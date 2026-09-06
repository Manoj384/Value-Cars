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


@pytest.mark.asyncio
async def test_admin_password_login(client: AsyncClient):
    login_res = await client.post(
        "/api/v1/auth/token",
        data={"username": "admin@valuecars.com", "password": "Admin@ValueCars2026"},
    )
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"
