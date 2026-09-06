import enum
import uuid
from typing import Optional
from sqlalchemy import Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, GUID


class OrderType(str, enum.Enum):
    RESERVATION_TOKEN = "RESERVATION_TOKEN"
    FULL_PAYMENT = "FULL_PAYMENT"


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    RESERVED = "RESERVED"
    PAID = "PAID"
    DOCUMENTATION = "DOCUMENTATION"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"


class PaymentStatus(str, enum.Enum):
    INITIATED = "INITIATED"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class Order(Base):
    __tablename__ = "orders"

    order_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    car_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("cars.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    customer_name: Mapped[str] = mapped_column(String(120), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    customer_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    order_type: Mapped[OrderType] = mapped_column(
        Enum(OrderType), default=OrderType.RESERVATION_TOKEN, nullable=False
    )
    order_status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus), default=OrderStatus.PENDING, index=True, nullable=False
    )

    token_amount: Mapped[float] = mapped_column(Float, default=10000.0, nullable=False)  # ₹10,000 reservation fee
    total_price: Mapped[float] = mapped_column(Float, nullable=False)
    balance_amount: Mapped[float] = mapped_column(Float, nullable=False)

    delivery_city: Mapped[str] = mapped_column(String(80), nullable=False)
    delivery_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    car = relationship("Car", back_populates="orders")
    user = relationship("User", back_populates="orders")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"

    order_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    transaction_ref: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    payment_gateway: Mapped[str] = mapped_column(String(50), default="RAZORPAY")
    gateway_order_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    gateway_payment_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR")
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus), default=PaymentStatus.INITIATED, nullable=False
    )

    order = relationship("Order", back_populates="payments")
