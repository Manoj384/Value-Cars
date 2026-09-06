import random
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.car import Car, CarStatus
from app.models.order import Order, OrderStatus, Payment, PaymentStatus
from app.schemas.order import OrderCreate, OrderResponse, PaymentCreate, PaymentResponse

router = APIRouter()


@router.post("/reserve", response_model=OrderResponse, status_code=status.HTTP_201_CREATED, summary="Reserve Car with Token")
async def reserve_car(order_in: OrderCreate, db: AsyncSession = Depends(get_db)):
    """Customer reserves a car by paying the refundable token amount (₹10,000)."""
    car_res = await db.execute(select(Car).where(Car.id == order_in.car_id))
    car = car_res.scalar_one_or_none()
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    if car.status in [CarStatus.RESERVED, CarStatus.SOLD]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle is already reserved or sold to another customer",
        )

    order_number = f"VC-{random.randint(100000, 999999)}"
    total_price = car.price
    balance = max(0.0, total_price - order_in.token_amount)

    order = Order(
        order_number=order_number,
        car_id=order_in.car_id,
        customer_name=order_in.customer_name,
        customer_phone=order_in.customer_phone,
        customer_email=order_in.customer_email,
        order_type=order_in.order_type,
        order_status=OrderStatus.RESERVED,
        token_amount=order_in.token_amount,
        total_price=total_price,
        balance_amount=balance,
        delivery_city=order_in.delivery_city,
        delivery_address=order_in.delivery_address,
    )
    db.add(order)
    await db.flush()

    # Create initial successful token payment
    payment = Payment(
        order_id=order.id,
        transaction_ref=f"TXN-{uuid.uuid4().hex[:12].upper()}",
        payment_gateway="RAZORPAY",
        amount=order_in.token_amount,
        status=PaymentStatus.SUCCESS,
    )
    db.add(payment)

    # Transition car status to RESERVED
    car.status = CarStatus.RESERVED

    await db.commit()

    # Reload order with payments
    query = select(Order).where(Order.id == order.id).options(selectinload(Order.payments))
    res = await db.execute(query)
    return OrderResponse.model_validate(res.scalar_one())


@router.get("/{order_number}", response_model=OrderResponse, summary="Get Order Status")
async def get_order_details(order_number: str, db: AsyncSession = Depends(get_db)):
    """Fetch order status, payment summary, and vehicle delivery info."""
    query = (
        select(Order)
        .where(Order.order_number == order_number)
        .options(selectinload(Order.payments))
    )
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return OrderResponse.model_validate(order)
