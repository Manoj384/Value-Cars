from typing import Dict, Any, List
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.api.v1.auth import get_current_admin
from app.models.car import Car, CarStatus
from app.models.lead import Lead, LeadStatus
from app.models.test_drive import TestDrive, TestDriveStatus
from app.models.order import Order, OrderStatus
from app.models.user import ApprovedSellerEmail, User, UserRole
from app.schemas.user import Token, UserResponse

router = APIRouter()


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


@router.post("/login", response_model=Token, summary="Admin Login -> JWT")
async def admin_login(payload: AdminLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate an administrator account and return a JWT."""
    email = payload.email.strip().lower()
    res = await db.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account does not have admin access",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/metrics", summary="Admin Dashboard KPI Metrics")
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> Dict[str, Any]:
    """Retrieve key operational metrics, inventory value, and funnel statistics."""
    # 1. Total Live Cars & Value
    cars_query = select(
        func.count(Car.id),
        func.coalesce(func.sum(Car.price), 0.0),
        func.coalesce(func.avg(Car.inspection_score), 0.0),
    ).where(Car.status == CarStatus.PUBLISHED)
    cars_res = await db.execute(cars_query)
    total_live_cars, total_inv_value, avg_score = cars_res.one()

    # 2. Pending Approval Cars
    pending_cars_res = await db.execute(
        select(func.count(Car.id)).where(Car.status == CarStatus.PENDING_APPROVAL)
    )
    pending_cars_count = pending_cars_res.scalar_one()

    # 3. Leads Stats
    leads_count_res = await db.execute(select(func.count(Lead.id)))
    total_leads = leads_count_res.scalar_one()

    new_leads_res = await db.execute(
        select(func.count(Lead.id)).where(Lead.status == LeadStatus.NEW)
    )
    new_leads_count = new_leads_res.scalar_one()

    # 4. Test Drives Stats
    td_count_res = await db.execute(select(func.count(TestDrive.id)))
    total_test_drives = td_count_res.scalar_one()

    # 5. Orders & Token Revenue
    orders_res = await db.execute(
        select(
            func.count(Order.id),
            func.coalesce(func.sum(Order.token_amount), 0.0),
        )
    )
    total_orders, total_token_revenue = orders_res.one()

    # 6. Approved Sellers
    sellers_res = await db.execute(
        select(func.count(ApprovedSellerEmail.id)).where(ApprovedSellerEmail.is_active == True)
    )
    approved_sellers_count = sellers_res.scalar_one()

    return {
        "total_published_cars": total_live_cars,
        "total_inventory_value_inr": total_inv_value,
        "average_inspection_score": round(float(avg_score), 1),
        "pending_car_approvals": pending_cars_count,
        "total_leads": total_leads,
        "new_leads": new_leads_count,
        "total_test_drives": total_test_drives,
        "total_orders": total_orders,
        "total_token_revenue_inr": total_token_revenue,
        "approved_sellers": approved_sellers_count,
    }


@router.get("/orders", summary="Admin: List All Orders and Token Bookings")
async def get_all_orders(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Admin views all customer orders, reservations, and payment receipts."""
    query = select(Order).order_by(desc(Order.created_at)).limit(100)
    res = await db.execute(query)
    return list(res.scalars().all())
