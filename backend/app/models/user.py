import enum
from datetime import datetime
from sqlalchemy import Boolean, Enum, String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class UserRole(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    ADMIN = "ADMIN"
    INSPECTOR = "INSPECTOR"
    SALES = "SALES"
    SELLER = "SELLER"


class User(Base):
    __tablename__ = "users"

    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), default=UserRole.CUSTOMER, nullable=False, index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_approved_seller: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    city: Mapped[str] = mapped_column(String(80), nullable=True)

    # Relationships
    test_drives = relationship("TestDrive", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    inspections = relationship("Inspection", back_populates="inspector")


class ApprovedSellerEmail(Base):
    """Admin-approved seller email whitelist for adding new cars."""
    __tablename__ = "approved_seller_emails"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    approved_by: Mapped[str] = mapped_column(String(120), default="Superadmin", nullable=False)
    notes: Mapped[str] = mapped_column(String(255), default="Verified Seller", nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
