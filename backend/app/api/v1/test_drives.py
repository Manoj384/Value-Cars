import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.v1.auth import get_current_admin
from app.models.car import Car, CarStatus
from app.models.test_drive import TestDrive, TestDriveStatus
from app.models.user import User
from app.schemas.test_drive import TestDriveCreate, TestDriveResponse, TestDriveUpdate
from app.services.notification_service import NotificationService

router = APIRouter()


@router.post("", response_model=TestDriveResponse, status_code=status.HTTP_201_CREATED, summary="Book a Test Drive")
async def book_test_drive(booking_in: TestDriveCreate, db: AsyncSession = Depends(get_db)):
    """Customer books a home delivery or hub test drive."""
    # Check if car exists
    car_query = select(Car).where(Car.id == booking_in.car_id)
    car_res = await db.execute(car_query)
    car = car_res.scalar_one_or_none()
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target vehicle not found")

    booking = TestDrive(**booking_in.model_dump())
    db.add(booking)
    await db.commit()
    await db.refresh(booking)

    # Trigger automated SMS & WhatsApp notifications
    # 1. Notify customer
    await NotificationService.send_test_drive_booked_alert(
        customer_name=booking.customer_name,
        customer_phone=booking.customer_phone,
        car_title=car.title,
        booking_date=str(booking.booking_date),
        time_slot=booking.booking_time_slot,
        location_type=booking.location_type.value if hasattr(booking.location_type, "value") else str(booking.location_type),
        address=booking.delivery_address,
        hub_city=booking.hub_name or car.city,
    )

    # 2. Alert Admin on WhatsApp with customer contact number
    await NotificationService.send_admin_schedule_contact_alert(
        customer_name=booking.customer_name,
        customer_phone=booking.customer_phone,
        customer_email=booking.customer_email,
        car_title=car.title,
        city=car.city,
        request_type=f"Test Drive ({booking.location_type.value if hasattr(booking.location_type, 'value') else booking.location_type})",
        booking_date=str(booking.booking_date),
        time_slot=booking.booking_time_slot,
        location_type=booking.location_type.value if hasattr(booking.location_type, "value") else str(booking.location_type),
        address=booking.delivery_address,
    )

    return booking


@router.get("", response_model=List[TestDriveResponse], summary="List Test Drive Bookings")
async def list_test_drives(
    status: Optional[TestDriveStatus] = None,
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Retrieve test drive bookings for customer service & hub operations."""
    query = select(TestDrive).order_by(desc(TestDrive.booking_date)).limit(limit)
    if status:
        query = query.where(TestDrive.status == status)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.patch("/{booking_id}", response_model=TestDriveResponse, summary="Update Test Drive Status")
async def update_test_drive(
    booking_id: uuid.UUID,
    booking_update: TestDriveUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Confirm, complete, or cancel a test drive."""
    query = select(TestDrive).where(TestDrive.id == booking_id)
    result = await db.execute(query)
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    status_changed = booking_update.status is not None and booking_update.status != booking.status

    for field, value in booking_update.model_dump(exclude_unset=True).items():
        setattr(booking, field, value)

    await db.commit()
    await db.refresh(booking)

    if status_changed:
        car_query = select(Car).where(Car.id == booking.car_id)
        car_res = await db.execute(car_query)
        car = car_res.scalar_one_or_none()
        car_title = car.title if car else "Selected Vehicle"
        await NotificationService.send_test_drive_status_update(
            customer_name=booking.customer_name,
            customer_phone=booking.customer_phone,
            car_title=car_title,
            new_status=booking.status.value if hasattr(booking.status, "value") else str(booking.status),
        )

    return booking
