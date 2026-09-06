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
