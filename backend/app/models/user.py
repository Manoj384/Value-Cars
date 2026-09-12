import enum
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Boolean, Enum, String, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, GUID


class UserRole(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    ADMIN = "ADMIN"
    INSPECTOR = "INSPECTOR"
    SALES = "SALES"
    SELLER = "SELLER"


class AccountStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    ACTIVE = "ACTIVE"
    DISABLED = "DISABLED"
    REJECTED = "REJECTED"


class User(Base):
    __tablename__ = "users"

    full_name: Mapped[str] = mapped_column(String(120), default="Valued Customer", nullable=False)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), unique=True, index=True, nullable=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), default=UserRole.CUSTOMER, nullable=False, index=True
    )
    account_status: Mapped[str] = mapped_column(
        String(30), default=AccountStatus.PENDING.value, nullable=False, index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    password_created: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_approved_seller: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    city: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    
    # Audit timestamps for approval workflow
    verification_requested_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_by: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)

    # Relationships
    test_drives = relationship("TestDrive", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    inspections = relationship("Inspection", back_populates="inspector")
    verification_tokens = relationship("UserVerificationToken", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")


class UserVerificationToken(Base):
    """Cryptographically secure, single-use, time-limited verification & approval tokens."""
    __tablename__ = "user_verification_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    token: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    token_type: Mapped[str] = mapped_column(
        String(50), index=True, nullable=False
    )  # ADMIN_APPROVAL, CREATE_PASSWORD, RESET_PASSWORD
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="verification_tokens")


class AuditLog(Base):
    """Admin audit log recording operations across the platform."""
    __tablename__ = "audit_logs"

    action: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    actor_email: Mapped[Optional[str]] = mapped_column(String(255), index=True, nullable=True)
    target_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # USER, CAR, ENQUIRY, etc.
    target_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)


class Favorite(Base):
    """User Saved / Favorite Cars."""
    __tablename__ = "favorites"

    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    car_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True
    )

    user = relationship("User", back_populates="favorites")
    car = relationship("Car")


class ApprovedSellerEmail(Base):
    """Admin-approved seller email whitelist for adding new cars."""
    __tablename__ = "approved_seller_emails"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    approved_by: Mapped[str] = mapped_column(String(120), default="Superadmin", nullable=False)
    notes: Mapped[str] = mapped_column(String(255), default="Verified Seller", nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

