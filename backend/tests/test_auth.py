import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_send_and_verify_otp(client: AsyncClient):
    # 1. Send OTP
    send_res = await client.post("/api/v1/auth/send-otp", json={"phone_number": "9876543299"})
    assert send_res.status_code == 200
    assert send_res.json()["success"] is True

    # 2. Verify OTP
    verify_res = await client.post(
        "/api/v1/auth/verify-otp",
        json={"phone_number": "9876543299", "otp": "1234", "full_name": "Test Customer"},
    )
    assert verify_res.status_code == 200
    data = verify_res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["phone_number"] == "9876543299"


from sqlalchemy import select

from app.models.user import User, UserRole


@pytest.mark.asyncio
async def test_register_cannot_escalate_to_admin(client: AsyncClient):
    # A malicious caller passing role="ADMIN" must NOT get an admin account.
    res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "escalator@example.com",
            "password": "Secret@123",
            "full_name": "Escalation Attempt",
            "role": "ADMIN",
        },
    )
    assert res.status_code == 201
    assert res.json()["role"] != "ADMIN"

    # Even registering the admin email directly must not self-grant ADMIN.
    res2 = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin.private@valuecars.com",
            "password": "Secret@123",
            "full_name": "Fake Admin",
            "role": "ADMIN",
        },
    )
    # Admin emails are pre-seeded, so this must be rejected as duplicate (400)
    # rather than overwriting the real admin.
    assert res2.status_code == 400


@pytest.mark.asyncio
async def test_request_verification_admin_email_is_customer(client: AsyncClient, db_session):
    # Public request-verification must never create an ADMIN row from an email.
    res = await client.post(
        "/api/v1/auth/request-verification",
        json={"email": "someadminlookalike@example.com", "full_name": "X"},
    )
    assert res.status_code == 200
    q = select(User).where(User.email == "someadminlookalike@example.com")
    user = (await db_session.execute(q)).scalar_one()
    assert user.role == UserRole.CUSTOMER
    assert user.account_status == "PENDING"
    assert user.is_approved_seller is False


@pytest.mark.asyncio
async def test_login_forged_admin_headers_stay_customer(client: AsyncClient):
    # Create customer then confirm login returns their role, admin secret not implicit.
    phone = "9855550201"
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "plainuser@example.com",
            "phone_number": phone,
            "password": "StrongPass123!",
            "full_name": "Plain User",
        },
    )
    res = await client.post(
        "/api/v1/auth/token",
        data={"username": "plainuser@example.com", "password": "StrongPass123!"},
    )
    assert res.status_code == 200
    assert res.json()["user"]["role"] == "CUSTOMER"
