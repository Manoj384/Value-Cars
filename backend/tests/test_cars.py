import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_cars_and_filters(client: AsyncClient):
    # 1. Fetch all seeded cars
    res = await client.get("/api/v1/cars")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 5
    assert len(data["items"]) >= 5

    # 2. Filter by make "Hyundai"
    hyundai_res = await client.get("/api/v1/cars?make=Hyundai")
    assert hyundai_res.status_code == 200
    hyundai_data = hyundai_res.json()
    assert hyundai_data["total"] >= 1
    assert all("Hyundai" in item["make"] for item in hyundai_data["items"])

    # 3. Filter by transmission "AUTOMATIC"
    auto_res = await client.get("/api/v1/cars?transmission=AUTOMATIC")
    assert auto_res.status_code == 200
    auto_data = auto_res.json()
    assert all(item["transmission"] == "AUTOMATIC" for item in auto_data["items"])


@pytest.mark.asyncio
async def test_get_single_car_details(client: AsyncClient):
    # Get list first
    res = await client.get("/api/v1/cars")
    car_id = res.json()["items"][0]["id"]

    # Fetch details
    detail_res = await client.get(f"/api/v1/cars/{car_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == car_id
    assert "images" in detail
    assert "features" in detail


@pytest.mark.asyncio
async def test_seller_submission_and_approval_flow(client: AsyncClient, admin_headers: dict):
    # 1. Check verified email
    chk1 = await client.get("/api/v1/cars/check-seller-email?email=verified.seller@valuecars.com")
    assert chk1.status_code == 200
    assert chk1.json()["is_approved"] is True

    # 2. Submit car with verified email -> immediately PUBLISHED
    car_payload_verified = {
        "seller_email": "verified.seller@valuecars.com",
        "seller_name": "Verified Seller",
        "seller_phone": "9988776655",
        "title": "2023 Kia Seltos GTX Plus Petrol Automatic",
        "reg_number": "KA-03-KS-7788",
        "make": "Kia",
        "model": "Seltos",
        "variant": "GTX Plus 1.4 Turbo",
        "year": 2023,
        "kilometers_driven": 14000,
        "fuel_type": "PETROL",
        "transmission": "AUTOMATIC",
        "ownership": "FIRST",
        "body_type": "SUV",
        "color": "Gravity Grey",
        "city": "Bangalore",
        "price": 1650000.0,
    }
    sub1 = await client.post("/api/v1/cars/submit", json=car_payload_verified)
    assert sub1.status_code == 200
    assert sub1.json()["status"] == "PUBLISHED"
    assert sub1.json()["is_verified_seller"] is True

    # 3. Submit car with unverified email -> PENDING_APPROVAL
    car_payload_unverified = {
        "seller_email": "newuser@example.com",
        "seller_name": "New User",
        "seller_phone": "9811223344",
        "title": "2022 Hyundai Venue SX Petrol",
        "reg_number": "DL-04-HV-1212",
        "make": "Hyundai",
        "model": "Venue",
        "variant": "SX 1.2 Petrol",
        "year": 2022,
        "kilometers_driven": 22000,
        "fuel_type": "PETROL",
        "transmission": "MANUAL",
        "ownership": "FIRST",
        "body_type": "SUV",
        "color": "Typhoon Silver",
        "city": "Delhi NCR",
        "price": 890000.0,
    }
    sub2 = await client.post("/api/v1/cars/submit", json=car_payload_unverified)
    assert sub2.status_code == 200
    assert sub2.json()["status"] == "PENDING_APPROVAL"
    unverified_car_id = sub2.json()["car_id"]

    # 4. Admin views pending cars
    pending_res = await client.get("/api/v1/cars/admin/pending", headers=admin_headers)
    assert pending_res.status_code == 200
    pending_list = pending_res.json()
    assert any(c["id"] == unverified_car_id for c in pending_list)

    # 5. Admin approves the seller email
    apprv_res = await client.post(
        "/api/v1/cars/admin/approve-seller-email",
        json={"email": "newuser@example.com", "notes": "Approved by Manoj"},
        headers=admin_headers,
    )
    assert apprv_res.status_code == 200
    assert apprv_res.json()["is_active"] is True

    # 6. Verify the car was auto-published after email approval
    car_check = await client.get(f"/api/v1/cars/{unverified_car_id}")
    assert car_check.status_code == 200
    assert car_check.json()["status"] == "PUBLISHED"
    assert car_check.json()["is_verified_seller"] is True
