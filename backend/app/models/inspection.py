import enum
import uuid
from typing import List, Optional
from sqlalchemy import Enum, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, GUID


class InspectionStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class CheckpointCondition(str, enum.Enum):
    PERFECT = "PERFECT"
    GOOD = "GOOD"
    IMPERFECTION = "IMPERFECTION"
    DAMAGED = "DAMAGED"
    REPLACED = "REPLACED"


class Inspection(Base):
    __tablename__ = "inspections"

    car_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True
    )
    inspector_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    overall_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    status: Mapped[InspectionStatus] = mapped_column(
        Enum(InspectionStatus), default=InspectionStatus.SCHEDULED, nullable=False
    )

    # Category Breakdown Scores (0 - 10)
    engine_score: Mapped[float] = mapped_column(Float, default=0.0)
    exterior_score: Mapped[float] = mapped_column(Float, default=0.0)
    interior_score: Mapped[float] = mapped_column(Float, default=0.0)
    transmission_score: Mapped[float] = mapped_column(Float, default=0.0)
    suspension_score: Mapped[float] = mapped_column(Float, default=0.0)
    electrical_score: Mapped[float] = mapped_column(Float, default=0.0)
    tyre_score: Mapped[float] = mapped_column(Float, default=0.0)
    ac_score: Mapped[float] = mapped_column(Float, default=0.0)

    summary_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    report_pdf_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationships
    car = relationship("Car", back_populates="inspections")
    inspector = relationship("User", back_populates="inspections")
    items = relationship("InspectionItem", back_populates="inspection", cascade="all, delete-orphan")


class InspectionItem(Base):
    __tablename__ = "inspection_items"

    inspection_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # ENGINE, EXTERIOR, INTERIOR, etc.
    checkpoint_name: Mapped[str] = mapped_column(String(150), nullable=False)  # e.g., Engine Sound, Front Bumper
    condition: Mapped[CheckpointCondition] = mapped_column(
        Enum(CheckpointCondition), default=CheckpointCondition.GOOD, nullable=False
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    inspection = relationship("Inspection", back_populates="items")
