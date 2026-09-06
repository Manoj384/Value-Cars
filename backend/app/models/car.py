import enum
import uuid
from typing import List, Optional
from sqlalchemy import Boolean, Enum, Float, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, GUID


class FuelType(str, enum.Enum):
    PETROL = "PETROL"
    DIESEL = "DIESEL"
    CNG = "CNG"
    ELECTRIC = "ELECTRIC"
    HYBRID = "HYBRID"


class TransmissionType(str, enum.Enum):
    MANUAL = "MANUAL"
    AUTOMATIC = "AUTOMATIC"


class OwnershipType(str, enum.Enum):
    FIRST = "FIRST"
    SECOND = "SECOND"
    THIRD = "THIRD"
    FOURTH_PLUS = "FOURTH_PLUS"


class BodyType(str, enum.Enum):
    HATCHBACK = "HATCHBACK"
    SEDAN = "SEDAN"
    SUV = "SUV"
    MUV = "MUV"
    LUXURY = "LUXURY"
    COUPE = "COUPE"


class CarStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    INSPECTION_PENDING = "INSPECTION_PENDING"
    REFURBISHMENT = "REFURBISHMENT"
    PUBLISHED = "PUBLISHED"
    TEST_DRIVE_BOOKED = "TEST_DRIVE_BOOKED"
    RESERVED = "RESERVED"
    SOLD = "SOLD"


class Car(Base):
    __tablename__ = "cars"

    # Core Identifiers
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    reg_number: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    make: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # e.g., Hyundai
    model: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # e.g., Creta
    variant: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., 1.5 SX (O)

    # Specs
    year: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    kilometers_driven: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    fuel_type: Mapped[FuelType] = mapped_column(Enum(FuelType), index=True, nullable=False)
    transmission: Mapped[TransmissionType] = mapped_column(
        Enum(TransmissionType), index=True, nullable=False
    )
    ownership: Mapped[OwnershipType] = mapped_column(Enum(OwnershipType), nullable=False)
    body_type: Mapped[BodyType] = mapped_column(Enum(BodyType), index=True, nullable=False)
    color: Mapped[str] = mapped_column(String(50), nullable=False)
    city: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    hub_location: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)

    # Pricing & Valuation
    price: Mapped[float] = mapped_column(Float, index=True, nullable=False)  # Selling price
    original_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # New car ex-showroom
    estimated_market_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    estimated_market_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Inspection
    inspection_score: Mapped[float] = mapped_column(Float, default=0.0, index=True, nullable=False)
    is_spinny_certified: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    warranty_months: Mapped[int] = mapped_column(Integer, default=12, nullable=False)

    # Operational Status
    status: Mapped[CarStatus] = mapped_column(
        Enum(CarStatus), default=CarStatus.PUBLISHED, index=True, nullable=False
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    images = relationship("CarImage", back_populates="car", cascade="all, delete-orphan", order_by="CarImage.display_order")
    features = relationship("CarFeature", back_populates="car", cascade="all, delete-orphan")
    inspections = relationship("Inspection", back_populates="car", cascade="all, delete-orphan")
    test_drives = relationship("TestDrive", back_populates="car", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="car")


class CarImage(Base):
    __tablename__ = "car_images"

    car_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True
    )
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    tag: Mapped[str] = mapped_column(String(50), default="EXTERIOR")  # EXTERIOR, INTERIOR, ENGINE, TYRES, DEFECT
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    is_cover: Mapped[bool] = mapped_column(Boolean, default=False)

    car = relationship("Car", back_populates="images")


class CarFeature(Base):
    __tablename__ = "car_features"

    car_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # SAFETY, COMFORT, INFOTAINMENT
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    car = relationship("Car", back_populates="features")
