import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.v1.auth import get_current_admin
from app.models.car import BodyType, Car, CarFeature, CarImage, CarStatus, FuelType, OwnershipType, TransmissionType
from app.models.inspection import CheckpointCondition, Inspection, InspectionItem, InspectionStatus
from app.models.user import ApprovedSellerEmail, User
from app.schemas.car import (
    ApproveEmailRequest,
    ApprovedEmailResponse,
    CarCreate,
    CarFilterParams,
    CarImageCreate,
    CarListResponse,
    CarResponse,
    SellerCarSubmitRequest,
)
from app.services.car_service import CarService
from app.services.valuation_engine import ValuationEngine
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("", response_model=CarListResponse, summary="Browse and Search Cars")
async def get_cars(
    make: Optional[str] = None,
    model: Optional[str] = None,
    city: Optional[str] = None,
    fuel_type: Optional[FuelType] = None,
    transmission: Optional[TransmissionType] = None,
    body_type: Optional[BodyType] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_year: Optional[int] = None,
    max_year: Optional[int] = None,
    max_km: Optional[int] = None,
    min_score: Optional[float] = None,
    sort_by: Optional[str] = Query("created_at", description="price_asc | price_desc | km_asc | year_desc | score_desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve catalog of published cars with dynamic filters, pagination, and sorting."""
    filters = CarFilterParams(
        make=make,
        model=model,
        city=city,
        fuel_type=fuel_type,
        transmission=transmission,
        body_type=body_type,
        min_price=min_price,
        max_price=max_price,
        min_year=min_year,
        max_year=max_year,
        max_km=max_km,
        min_score=min_score,
        sort_by=sort_by,
        page=page,
        page_size=page_size,
    )

    cars, total, pages = await CarService.list_cars(db, filters)
    return CarListResponse(
        items=[CarResponse.model_validate(c) for c in cars],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/admin/pending", response_model=List[CarResponse], summary="Admin: View Cars Awaiting Approval")
async def get_pending_cars(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Admin views all car listings submitted by sellers awaiting approval."""
    filters = CarFilterParams(status=CarStatus.PENDING_APPROVAL, page_size=100)
    cars, _, _ = await CarService.list_cars(db, filters)
    return [CarResponse.model_validate(c) for c in cars]


@router.post("/admin/approve/{car_id}", response_model=CarResponse, summary="Admin: Approve Pending Car Listing")
async def approve_car_listing(
    car_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Admin approves a submitted car, changing status to PUBLISHED."""
    car = await CarService.get_car_by_id(db, car_id)
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    car.status = CarStatus.PUBLISHED
    car.is_verified_seller = True
    await db.commit()
    await db.refresh(car)

    # Notify seller that car is approved and live
    if car.seller_phone:
        await NotificationService.send_seller_car_approved_alert(
            seller_name=car.seller_name or "Seller",
            seller_phone=car.seller_phone,
            seller_email=car.seller_email or "",
            car_title=car.title,
            reg_number=car.reg_number,
        )

    return CarResponse.model_validate(car)


@router.post("/admin/approve-seller-email", response_model=ApprovedEmailResponse, summary="Admin: Approve Seller Email Whitelist")
async def approve_seller_email(
    payload: ApproveEmailRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Admin approves an email address so the seller can add verified car listings."""
    clean_email = payload.email.strip().lower()
    query = select(ApprovedSellerEmail).where(ApprovedSellerEmail.email == clean_email)
    existing = await db.execute(query)
    record = existing.scalar_one_or_none()

    if record:
        record.is_active = True
        record.notes = payload.notes
    else:
        record = ApprovedSellerEmail(
            email=clean_email,
            approved_by="Superadmin",
            notes=payload.notes,
            is_active=True,
        )
        db.add(record)

    # Automatically mark any pending cars from this seller email as published & verified
    pending_query = select(Car).where(Car.seller_email == clean_email, Car.status == CarStatus.PENDING_APPROVAL)
    pending_cars = await db.execute(pending_query)
    all_pending = pending_cars.scalars().all()
    for car in all_pending:
        car.status = CarStatus.PUBLISHED
        car.is_verified_seller = True

    await db.commit()
    await db.refresh(record)

    # Send approval alert for each car that was just approved
    for car in all_pending:
        if car.seller_phone:
            await NotificationService.send_seller_car_approved_alert(
                seller_name=car.seller_name or "Seller",
                seller_phone=car.seller_phone,
                seller_email=car.seller_email or "",
                car_title=car.title,
                reg_number=car.reg_number,
            )

    return ApprovedEmailResponse.model_validate(record)


@router.get("/admin/approved-seller-emails", response_model=List[ApprovedEmailResponse], summary="Admin: List Approved Emails")
async def list_approved_seller_emails(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Admin views all verified/approved seller emails."""
    query = select(ApprovedSellerEmail).where(ApprovedSellerEmail.is_active == True).order_by(desc(ApprovedSellerEmail.created_at))
    res = await db.execute(query)
    return [ApprovedEmailResponse.model_validate(e) for e in res.scalars().all()]


@router.get("/check-seller-email", summary="Check If Seller Email is Verified")
async def check_seller_email(email: str, db: AsyncSession = Depends(get_db)):
    """Check if an email address is pre-approved by admin to list cars."""
    clean_email = email.strip().lower()
    query = select(ApprovedSellerEmail).where(
        ApprovedSellerEmail.email == clean_email,
        ApprovedSellerEmail.is_active == True,
    )
    res = await db.execute(query)
    is_approved = res.scalar_one_or_none() is not None
    return {
        "email": clean_email,
        "is_approved": is_approved,
        "message": "Email is authorized to publish cars directly" if is_approved else "Email requires admin approval before listings go live",
    }


@router.post("/submit", response_model=dict, summary="Online User/Seller: Submit New Car")
async def submit_car_online(payload: SellerCarSubmitRequest, db: AsyncSession = Depends(get_db)):
    """Public/Seller portal to add a new car.

    - If seller email is approved by admin -> Immediately PUBLISHED.
    - If seller email is not yet approved -> PENDING_APPROVAL (Admin will review & approve).
    """
    clean_email = payload.seller_email.strip().lower()

    # Check if seller email is approved
    query = select(ApprovedSellerEmail).where(
        ApprovedSellerEmail.email == clean_email,
        ApprovedSellerEmail.is_active == True,
    )
    res = await db.execute(query)
    is_approved = res.scalar_one_or_none() is not None

    status_target = CarStatus.PUBLISHED if is_approved else CarStatus.PENDING_APPROVAL

    # Automatic Valuation bounds
    val = ValuationEngine.calculate_valuation(
        make=payload.make,
        model=payload.model,
        year=payload.year,
        kilometers_driven=payload.kilometers_driven,
        fuel_type=payload.fuel_type.value,
        transmission=payload.transmission.value,
        ownership=payload.ownership.value,
        inspection_score=8.8,
    )

    # Check for duplicate registration number
    clean_reg = payload.reg_number.strip().upper()
    existing_car = await db.execute(select(Car).where(Car.reg_number == clean_reg))
    if existing_car.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A vehicle with registration number '{clean_reg}' is already registered.",
        )

    car = Car(
        title=payload.title,
        reg_number=clean_reg,
        make=payload.make,
        model=payload.model,
        variant=payload.variant,
        year=payload.year,
        kilometers_driven=payload.kilometers_driven,
        fuel_type=payload.fuel_type,
        transmission=payload.transmission,
        ownership=payload.ownership,
        body_type=payload.body_type,
        color=payload.color,
        city=payload.city,
        price=payload.price,
        original_price=payload.price * 1.25,
        estimated_market_min=val["estimated_min_price"],
        estimated_market_max=val["estimated_max_price"],
        inspection_score=8.8,
        is_spinny_certified=True,
        status=status_target,
        seller_email=clean_email,
        seller_name=payload.seller_name,
        seller_phone=payload.seller_phone,
        is_verified_seller=is_approved,
        description=payload.description or f"{payload.year} {payload.make} {payload.model} in great condition.",
    )
    db.add(car)
    await db.flush()

    # Attach images
    default_img = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80"
    images_to_add = payload.image_urls if payload.image_urls else [default_img]
    for idx, url in enumerate(images_to_add):
        db.add(CarImage(car_id=car.id, image_url=url, tag="EXTERIOR", display_order=idx + 1, is_cover=(idx == 0)))

    # Attach features
    default_feats = payload.features if payload.features else ["Power Steering", "ABS with EBD", "Air Conditioner", "Touchscreen Audio"]
    for feat in default_feats:
        db.add(CarFeature(car_id=car.id, category="STANDARD", name=feat))

    # Attach initial digital inspection
    inspection = Inspection(
        car_id=car.id,
        overall_score=8.8,
        status=InspectionStatus.APPROVED,
        engine_score=9.0,
        exterior_score=8.7,
        interior_score=8.9,
        transmission_score=9.0,
        suspension_score=8.5,
        electrical_score=9.0,
        tyre_score=8.5,
        ac_score=9.0,
        summary_notes="Initial automated digital inspection performed upon online car submission.",
    )
    db.add(inspection)
    await db.flush()

    # Inspection checkpoints
    checkpoints = [
        ("ENGINE", "Engine Oil & Fluid Levels", CheckpointCondition.GOOD, "Fluid levels within normal parameters"),
        ("EXTERIOR", "Body Panels & Paint Condition", CheckpointCondition.GOOD, "Normal wear consistent with mileage"),
        ("INTERIOR", "Seats & Dashboard Electronics", CheckpointCondition.PERFECT, "Electronics and switches working properly"),
        ("TYRES", "Tyre Condition & Tread Life", CheckpointCondition.GOOD, "Good tread life remaining"),
    ]
    for cat, chk, cond, nts in checkpoints:
        db.add(InspectionItem(inspection_id=inspection.id, category=cat, checkpoint_name=chk, condition=cond, notes=nts))

    await db.commit()
    await db.refresh(car)

    # Trigger automated SMS & WhatsApp notifications
    # 1. Alert seller on submission status
    if payload.seller_phone:
        await NotificationService.send_seller_car_submitted_alert(
            seller_name=payload.seller_name,
            seller_phone=payload.seller_phone,
            seller_email=clean_email,
            car_title=car.title,
            reg_number=car.reg_number,
            is_published=is_approved,
        )

    # 2. Alert admin operations team if listing is pending review
    if not is_approved:
        await NotificationService.send_admin_new_car_alert(
            car_title=car.title,
            seller_name=payload.seller_name,
            seller_email=clean_email,
            reg_number=car.reg_number,
            price=car.price,
        )

    return {
        "success": True,
        "car_id": str(car.id),
        "status": car.status.value,
        "is_verified_seller": is_approved,
        "message": (
            "Car published successfully! Your email is verified."
            if is_approved
            else "Car submitted successfully! Since your email is pending admin approval, our team will review and approve it shortly."
        ),
    }


@router.get("/{car_id}", response_model=CarResponse, summary="Get Car Details")
async def get_car_details(car_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Fetch single vehicle with complete image gallery and features list."""
    car = await CarService.get_car_by_id(db, car_id)
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID '{car_id}' not found",
        )
    return CarResponse.model_validate(car)


@router.delete("/admin/{car_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Admin: Delete Any Car")
async def admin_delete_car(
    car_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Admin removes any car listing permanently from catalog."""
    car = await CarService.get_car_by_id(db, car_id)
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID '{car_id}' not found",
        )
    await db.delete(car)
    await db.commit()
    return None


@router.patch("/admin/{car_id}", response_model=CarResponse, summary="Admin: Update Any Car")
async def admin_update_car(
    car_id: uuid.UUID,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Admin updates vehicle price, status, or details."""
    car = await CarService.get_car_by_id(db, car_id)
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID '{car_id}' not found",
        )
    if "price" in payload and payload["price"] is not None:
        car.price = float(payload["price"])
    if "description" in payload and payload["description"] is not None:
        car.description = str(payload["description"])
    if "status" in payload and payload["status"] is not None:
        try:
            car.status = CarStatus(payload["status"])
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{payload['status']}'",
            )
    await db.commit()
    await db.refresh(car)
    return CarResponse.model_validate(car)
