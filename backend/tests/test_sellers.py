import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_seller_registration_and_login(client: AsyncClient):
    # 1. Register a new seller
    reg_payload = {
        "full_name": "Premium Auto Dealer",
        "email": "dealer.test@valuecars.com",
        "phone_number": "9123456780",
        "password": "DealerPassword@123",
    }
    reg_res = await client.post("/api/v1/sellers/register", json=reg_payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "dealer.test@valuecars.com"
    token = reg_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get seller profile
    me_res = await client.get("/api/v1/sellers/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["full_name"] == "Premium Auto Dealer"

    # 3. Seller login
    login_res = await client.post(
        "/api/v1/sellers/login",
        json={"email": "dealer.test@valuecars.com", "password": "DealerPassword@123"},
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()


@pytest.mark.asyncio
async def test_seller_my_listings_lifecycle(client: AsyncClient):
    # 1. Register seller
    reg_payload = {
        "full_name": "Koramangala Used Cars",
        "email": "koramangala.cars@valuecars.com",
        "phone_number": "9876500112",
        "password": "SecurePassword@2026",
    }
    reg_res = await client.post("/api/v1/sellers/register", json=reg_payload)
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Submit a car with this seller email
    car_payload = {
        "seller_email": "koramangala.cars@valuecars.com",
        "seller_name": "Koramangala Used Cars",
        "seller_phone": "9876500112",
        "title": "2023 Maruti Brezza ZXi Plus Automatic",
        "reg_number": "KA-01-BZ-9090",
        "make": "Maruti",
        "model": "Brezza",
        "variant": "ZXi Plus AT",
        "year": 2023,
        "kilometers_driven": 12000,
        "fuel_type": "PETROL",
        "transmission": "AUTOMATIC",
        "ownership": "FIRST",
        "body_type": "SUV",
        "color": "Magma Grey",
        "city": "Bangalore",
        "price": 1250000.0,
    }
    submit_res = await client.post("/api/v1/cars/submit", json=car_payload)
    assert submit_res.status_code == 200
    car_id = submit_res.json()["car_id"]

    # 3. View my listings
    my_cars_res = await client.get("/api/v1/sellers/me/cars", headers=headers)
    assert my_cars_res.status_code == 200
    my_cars = my_cars_res.json()
    assert len(my_cars) == 1
    assert my_cars[0]["id"] == car_id

    # 4. Update listing (price & description)
    update_res = await client.patch(
        f"/api/v1/sellers/cars/{car_id}",
        json={"price": 1220000.0, "description": "Price drop for quick festival sale!"},
        headers=headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["price"] == 1220000.0

    # 5. Delete listing
    del_res = await client.delete(f"/api/v1/sellers/cars/{car_id}", headers=headers)
    assert del_res.status_code == 204

    # 6. Verify listing removed
    verify_res = await client.get("/api/v1/sellers/me/cars", headers=headers)
    assert verify_res.status_code == 200
    assert len(verify_res.json()) == 0
