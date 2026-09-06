import enum
import uuid
from datetime import date
from typing import Optional
from sqlalchemy import Date, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, GUID


class TestDriveLocation(str, enum.Enum):
    __test__ = False
    HOME_DELIVERY = "HOME_DELIVERY"
    HUB_VISIT = "HUB_VISIT"


class TestDriveStatus(str, enum.Enum):
    __test__ = False
    REQUESTED = "REQUESTED"
    CONFIRMED = "CONFIRMED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class TestDrive(Base):
    __test__ = False
    __tablename__ = "test_drives"

    car_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Booking Details
    customer_name: Mapped[str] = mapped_column(String(120), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    customer_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    booking_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    booking_time_slot: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., "10:00 AM - 12:00 PM"
    location_type: Mapped[TestDriveLocation] = mapped_column(
        Enum(TestDriveLocation), default=TestDriveLocation.HUB_VISIT, nullable=False
    )
    delivery_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hub_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)

    status: Mapped[TestDriveStatus] = mapped_column(
        Enum(TestDriveStatus), default=TestDriveStatus.REQUESTED, index=True, nullable=False
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    car = relationship("Car", back_populates="test_drives")
    user = relationship("User", back_populates="test_drives")
