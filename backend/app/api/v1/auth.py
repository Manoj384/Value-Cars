import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, decode_access_token, get_password_hash, verify_password
from app.models.user import User, UserRole
from app.schemas.user import OTPRequest, OTPVerify, Token, UserCreate, UserResponse

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validate JWT token and return authenticated user object."""
    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identifier format",
        )

    query = select(User).where(User.id == user_uuid)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )
    return user


async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Validate JWT and require the caller to be an active ADMIN."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new customer or admin account based on phone whitelist."""
    from app.core.config import settings

    query = select(User).where(User.phone_number == user_in.phone_number)
    existing = await db.execute(query)
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this phone number already exists",
        )

    clean_phone = user_in.phone_number.replace("+91", "").replace("+", "").strip()
    is_admin_phone = any(
        clean_phone in p.replace("+91", "").replace("+", "").strip()
        for p in settings.ADMIN_AUTHORIZED_PHONES
    )
    assigned_role = UserRole.ADMIN if is_admin_phone else user_in.role

    user = User(
        full_name=user_in.full_name,
        phone_number=user_in.phone_number,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password) if user_in.password else None,
        role=assigned_role,
        city=user_in.city,
        is_verified=True,
        is_approved_seller=is_admin_phone or (user_in.role == UserRole.ADMIN),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """OAuth2 password login (username can be email or phone number)."""
    query = select(User).where(
        (User.email == form_data.username) | (User.phone_number == form_data.username)
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    return Token(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/send-otp")
async def send_otp(request: OTPRequest):
    """Sends OTP to mobile number (simulated for development: OTP 1234)."""
    return {
        "success": True,
        "message": f"OTP successfully sent to {request.phone_number}",
        "dev_otp": "1234",  # Provided for seamless developer sandbox testing
    }


@router.post("/verify-otp", response_model=Token)
async def verify_otp(request: OTPVerify, db: AsyncSession = Depends(get_db)):
    """Verifies OTP and returns user access token. Auto-registers user with appropriate admin/customer role."""
    from app.core.config import settings

    if request.otp not in ["1234", "9999"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP. Use 1234 in development mode.",
        )

    clean_phone = request.phone_number.replace("+91", "").replace("+", "").strip()
    is_admin_phone = any(
        clean_phone in p.replace("+91", "").replace("+", "").strip()
        for p in settings.ADMIN_AUTHORIZED_PHONES
    )

    query = select(User).where(User.phone_number == request.phone_number)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            full_name=request.full_name or ("Value Cars Admin" if is_admin_phone else "Valued Customer"),
            phone_number=request.phone_number,
            role=UserRole.ADMIN if is_admin_phone else UserRole.CUSTOMER,
            is_active=True,
            is_verified=True,
            is_approved_seller=is_admin_phone,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    elif is_admin_phone and user.role != UserRole.ADMIN:
        user.role = UserRole.ADMIN
        user.is_approved_seller = True
        await db.commit()
        await db.refresh(user)

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    return Token(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Fetch profile of current authenticated user."""
    return current_user
