import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)
from app.models.car import Car, CarStatus
from app.models.user import ApprovedSellerEmail, User, UserRole
from app.schemas.car import CarResponse
from app.schemas.seller import (
    SellerCarUpdate,
    SellerLogin,
    SellerRegister,
    SellerResponse,
    SellerToken,
)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


async def get_current_seller(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validate the JWT and require an active SELLER (or ADMIN) with an email."""
    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        user_uuid = uuid.UUID(payload["sub"])
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not found or is inactive",
        )
    if user.role not in (UserRole.SELLER, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Seller access required"
        )
    if not user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seller account requires an email address to manage listings",
        )
    return user


@router.post(
    "/register",
    response_model=SellerToken,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new seller account",
)
async def register_seller(
    payload: SellerRegister, db: AsyncSession = Depends(get_db)
):
    """Create a SELLER account, auto-flipping approval based on the admin whitelist."""
    email = payload.email.strip().lower()

    exists = await db.execute(select(User).where(User.email == email))
    if exists.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    wl = await db.execute(
        select(ApprovedSellerEmail).where(
            ApprovedSellerEmail.email == email,
            ApprovedSellerEmail.is_active == True,
        )
    )
    approved = wl.scalar_one_or_none() is not None

    user = User(
        full_name=payload.full_name,
        email=email,
        phone_number=payload.phone_number,
        hashed_password=get_password_hash(payload.password),
        role=UserRole.SELLER,
        is_active=True,
        is_verified=True,
        is_approved_seller=approved,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    return SellerToken(
        access_token=access_token,
        token_type="bearer",
        user=SellerResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=SellerToken,
    summary="Seller login (email + password) -> JWT",
)
async def login_seller(payload: SellerLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate a seller by email/password and return a scoped JWT."""
    email = payload.email.strip().lower()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password or not verify_password(
        payload.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive seller account",
        )
    if user.role not in (UserRole.SELLER, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Seller access required"
        )

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    return SellerToken(
        access_token=access_token,
        token_type="bearer",
        user=SellerResponse.model_validate(user),
    )


@router.get(
    "/me", response_model=SellerResponse, summary="Get current seller profile"
)
async def my_seller_profile(current_seller: User = Depends(get_current_seller)):
    """Return the authenticated seller's profile."""
    return current_seller


@router.get(
    "/me/cars",
    response_model=List[CarResponse],
    summary="List the current seller's car listings",
)
async def my_seller_listings(
    current_seller: User = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db),
):
    """Return all cars owned by the authenticated seller (any status)."""
    email = current_seller.email.strip().lower()
    result = await db.execute(
        select(Car)
        .where(Car.seller_email == email)
        .options(selectinload(Car.images), selectinload(Car.features))
        .order_by(Car.created_at.desc())
    )
    return [CarResponse.model_validate(c) for c in result.scalars().all()]


@router.patch(
    "/cars/{car_id}",
    response_model=CarResponse,
    summary="Edit one of the seller's listings (or any listing for admin)",
)
async def update_seller_listing(
    car_id: uuid.UUID,
    payload: SellerCarUpdate,
    current_seller: User = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db),
):
    """Update a listing (seller owns it or caller is admin)."""
    email = current_seller.email.strip().lower()
    stmt = select(Car).options(selectinload(Car.images), selectinload(Car.features))
    if current_seller.role != UserRole.ADMIN:
        stmt = stmt.where(Car.id == car_id, Car.seller_email == email)
    else:
        stmt = stmt.where(Car.id == car_id)

    result = await db.execute(stmt)
    car = result.scalar_one_or_none()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found or not authorized to edit",
        )
    if payload.price is not None:
        car.price = payload.price
    if payload.description is not None:
        car.description = payload.description
    if payload.status is not None:
        try:
            car.status = CarStatus(payload.status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{payload.status}'",
            )
    await db.commit()
    await db.refresh(car)
    return car


@router.delete(
    "/cars/{car_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete one of the seller's listings (or any listing for admin)",
)
async def delete_seller_listing(
    car_id: uuid.UUID,
    current_seller: User = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db),
):
    """Remove a listing (seller owns it or caller is admin)."""
    email = current_seller.email.strip().lower()
    stmt = select(Car)
    if current_seller.role != UserRole.ADMIN:
        stmt = stmt.where(Car.id == car_id, Car.seller_email == email)
    else:
        stmt = stmt.where(Car.id == car_id)

    result = await db.execute(stmt)
    car = result.scalar_one_or_none()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found or not authorized to delete",
        )
    await db.delete(car)
    await db.commit()
    return None