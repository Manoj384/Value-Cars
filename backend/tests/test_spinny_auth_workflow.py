import pytest
from httpx import AsyncClient
from sqlalchemy import select
from app.models.user import User, UserVerificationToken, AccountStatus

@pytest.mark.asyncio
async def test_spinny_auth_full_journey(client: AsyncClient, db_session):
    test_email = "spinny_buyer@example.com"

    # 1. Step 1: Check Email -> Should be NEW
    res = await client.post("/api/v1/auth/check-email", json={"email": test_email})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "NEW"

    # 2. Step 2: Request Verification
    res = await client.post(
        "/api/v1/auth/request-verification",
        json={
            "email": test_email,
            "full_name": "Spinny Buyer",
            "phone_number": "9988776655",
            "city": "Bangalore"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "PENDING"

    # 3. Check Email again -> Should now be PENDING
    res = await client.post("/api/v1/auth/check-email", json={"email": test_email})
    assert res.status_code == 200
    assert res.json()["status"] == "PENDING"

    # 4. Find the single-use ADMIN_APPROVAL token in DB
    user_res = await db_session.execute(select(User).where(User.email == test_email))
    user = user_res.scalar_one()
    assert user.account_status == "PENDING"

    tok_res = await db_session.execute(
        select(UserVerificationToken).where(
            UserVerificationToken.user_id == user.id,
            UserVerificationToken.token_type == "ADMIN_APPROVAL"
        )
    )
    approval_token = tok_res.scalar_one()
    assert not approval_token.is_used

    # 5. Admin clicks 1-Click Approve via GET /api/v1/auth/verify-token/approve?token=...
    res = await client.get(f"/api/v1/auth/verify-token/approve?token={approval_token.token}")
    assert res.status_code == 200
    assert "User Approved Successfully" in res.text

    # Refresh DB session & check token was consumed
    await db_session.refresh(approval_token)
    assert approval_token.is_used

    # 6. Re-using same token should fail
    res = await client.get(f"/api/v1/auth/verify-token/approve?token={approval_token.token}")
    assert res.status_code == 400

    # 7. Find user's CREATE_PASSWORD token
    cp_res = await db_session.execute(
        select(UserVerificationToken).where(
            UserVerificationToken.user_id == user.id,
            UserVerificationToken.token_type == "CREATE_PASSWORD"
        )
    )
    cp_token = cp_res.scalar_one()
    assert not cp_token.is_used

    # 8. User Creates Password
    # Weak password policy check: no uppercase/number (should return 400)
    res = await client.post(
        "/api/v1/auth/create-password",
        json={
            "token": cp_token.token,
            "password": "weakpassword",
            "confirm_password": "weakpassword"
        }
    )
    assert res.status_code == 400

    # Strong password
    res = await client.post(
        "/api/v1/auth/create-password",
        json={
            "token": cp_token.token,
            "password": "StrongPassword123!",
            "confirm_password": "StrongPassword123!"
        }
    )
    assert res.status_code == 200
    auth_data = res.json()
    assert "access_token" in auth_data
    assert auth_data["user"]["is_verified"] is True
    assert auth_data["user"]["account_status"] == "ACTIVE"

    access_token = auth_data["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # 9. Normal Login
    login_res = await client.post(
        "/api/v1/auth/login",
        json={
            "email": test_email,
            "password": "StrongPassword123!"
        }
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 10. Check /me
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == test_email

    # 11. Admin User Action: Disable & Reactivate
    action_res = await client.post(
        "/api/v1/auth/admin-user-action",
        json={"user_id": str(user.id), "action": "DISABLE"}
    )
    assert action_res.status_code == 200
    assert action_res.json()["status"] == "DISABLED"

    # Login should now fail with 403
    bad_login = await client.post(
        "/api/v1/auth/login",
        json={"email": test_email, "password": "StrongPassword123!"}
    )
    assert bad_login.status_code == 403

    # Reactivate
    react_res = await client.post(
        "/api/v1/auth/admin-user-action",
        json={"user_id": str(user.id), "action": "REACTIVATE"}
    )
    assert react_res.status_code == 200
    assert react_res.json()["status"] == "ACTIVE"
