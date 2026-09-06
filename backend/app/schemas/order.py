import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.order import OrderStatus, OrderType, PaymentStatus


class PaymentBase(BaseModel):
    transaction_ref: str
    payment_gateway: str = "RAZORPAY"
    gateway_order_id: Optional[str] = None
    gateway_payment_id: Optional[str] = None
    amount: float
    currency: str = "INR"
    status: PaymentStatus = PaymentStatus.INITIATED


class PaymentCreate(PaymentBase):
    order_id: uuid.UUID


class PaymentResponse(PaymentBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: uuid.UUID
    created_at: datetime


class OrderBase(BaseModel):
    car_id: uuid.UUID
    customer_name: str = Field(..., min_length=2, max_length=120)
    customer_phone: str = Field(..., min_length=10, max_length=20)
    customer_email: Optional[str] = None
    order_type: OrderType = OrderType.RESERVATION_TOKEN
    token_amount: float = 10000.0
    delivery_city: str
    delivery_address: Optional[str] = None


class OrderCreate(OrderBase):
    pass


class OrderResponse(OrderBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_number: str
    user_id: Optional[uuid.UUID] = None
    total_price: float
    balance_amount: float
    order_status: OrderStatus
    created_at: datetime
    updated_at: datetime
    payments: List[PaymentResponse] = []
