import pytest
from httpx import AsyncClient
from app.core.config import settings


# Regression tests for the auth/authorization security fixes (audit A-F).


@pytest.mark.asyncio
async def test_unauth_admin_auth_endpoints_return_401(client: AsyncClient):
    """The admin-only auth endpoints must reject requests with no token."""
    # GET /auth/verification-requests (no token) -> 401
    res = await client.get("/api/v1/auth/verification-requests")
    assert res.status_code in (401, 403)

    # GET /auth/audit-logs (no token) -> 401
    res = await client.get("/api/v1/auth/audit-logs")
    assert res.status_code in (401, 403)

    # POST /auth/admin-user-action (no token) -> 401
    res = await client.post(
        "/api/v1/auth/admin-user-action",
        json={"user_id": "00000000-0000-0000-0000-000000000000", "action": "DISABLE"},
    )
    assert res.status_code in (401, 403)


@pytest.mark.asyncio
async def test_unauth_car_manage_endpoints_return_401(client: AsyncClient):
    """The /cars/manage/* endpoints must reject requests with no token."""
    # mark-sold (no token) -> 401
    res = await client.post(
        "/api/v1/cars/manage/00000000-0000-0000-0000-000000000000/mark-sold",
        json={"dont_delete": True},
    )
    assert res.status_code in (401, 403)

    # PATCH modify (no token) -> 401
    res = await client.patch(
        "/api/v1/cars/manage/00000000-0000-0000-0000-000000000000",
        json={"price": 1000.0},
    )
    assert res.status_code in (401, 403)

    # DELETE (no token) -> 401
    res = await client.delete("/api/v1/cars/manage/00000000-0000-0000-0000-000000000000")
    assert res.status_code in (401, 403)

    # cleanup-expired (no token) -> 401
    res = await client.post("/api/v1/cars/manage/cleanup-expired")
    assert res.status_code in (401, 403)


@pytest.mark.asyncio
async def test_otp_disabled_when_flag_off(client: AsyncClient):
    """When OTP_DEV_MODE is off, the OTP endpoints must be disabled (410)."""
    original = settings.OTP_DEV_MODE
    settings.OTP_DEV_MODE = False
    try:
        send_res = await client.post("/api/v1/auth/send-otp", json={"phone_number": "9999999999"})
        assert send_res.status_code == 410

        verify_res = await client.post(
            "/api/v1/auth/verify-otp",
            json={"phone_number": "9999999999", "otp": "123456"},
        )
        assert verify_res.status_code == 410
    finally:
        settings.OTP_DEV_MODE = original


@pytest.mark.asyncio
async def test_list_cars_count_matches_filters(client: AsyncClient):
    """Total count in list_cars must reflect all applied filters (pagination fix)."""
    # Filter by a very high price that should match zero cars
    res = await client.get(
        "/api/v1/cars", params={"min_price": 999999999, "page": 1, "page_size": 12}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 0
    assert len(data["items"]) == 0


@pytest.mark.asyncio
async def test_media_upload_path_traversal_rejected(client: AsyncClient):
    """GET /uploads/{path} must reject any path that escapes UPLOAD_DIR (Fix E)."""
    # Percent-encode the traversal so the HTTP client does not normalize it away
    # before Starlette hands the decoded "../" path to the route.
    res = await client.get("/uploads/%2e%2e%2f%2e%2e%2f%2e.env")
    # The guard must refuse traversal before any file read occurs.
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_media_upload_nested_valid_file_served(client: AsyncClient, tmp_path):
    """A valid file inside UPLOAD_DIR must still be served (the guard is not over-broad)."""
    import os

    # Point UPLOAD_DIR at a temp dir so no stray writes land in the real backend/uploads.
    original = settings.UPLOAD_DIR
    settings.UPLOAD_DIR = str(tmp_path)
    try:
        sub = tmp_path / "honda"
        sub.mkdir()
        f = sub / "car.jpg"
        f.write_bytes(b"fake-jpeg-bytes")

        ok = await client.get("/uploads/honda/car.jpg")
        assert ok.status_code == 200
        assert ok.content == b"fake-jpeg-bytes"
    finally:
        settings.UPLOAD_DIR = original
