import enum
import uuid
from typing import Optional
from sqlalchemy import Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, GUID


class LeadType(str, enum.Enum):
    SELL_CAR = "SELL_CAR"
    BUY_ENQUIRY = "BUY_ENQUIRY"
    TEST_DRIVE = "TEST_DRIVE"
    FINANCE = "FINANCE"


class LeadStatus(str, enum.Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    INTERESTED = "INTERESTED"
    INSPECTION_SCHEDULED = "INSPECTION_SCHEDULED"
    NEGOTIATION = "NEGOTIATION"
    CONVERTED = "CONVERTED"
    LOST = "LOST"


class Lead(Base):
    __tablename__ = "leads"

    lead_type: Mapped[LeadType] = mapped_column(Enum(LeadType), index=True, nullable=False)
    status: Mapped[LeadStatus] = mapped_column(
        Enum(LeadStatus), default=LeadStatus.NEW, index=True, nullable=False
    )

    # Customer Contact Info
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[str] = mapped_column(String(80), nullable=False)

    # Vehicle info (for Sell Lead or Target Car for Buy Lead)
    car_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("cars.id", ondelete="SET NULL"), nullable=True
    )
    reg_number: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    car_details: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)  # e.g., 2021 Hyundai Creta Petrol
    expected_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    estimated_valuation: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    assigned_sales_rep: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
