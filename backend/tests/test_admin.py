import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_admin_metrics(client: AsyncClient, admin_headers: dict):
    response = await client.get("/api/v1/admin/metrics", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_published_cars" in data
    assert "total_inventory_value_inr" in data
    assert "pending_car_approvals" in data
    assert "total_leads" in data
    assert "total_test_drives" in data
    assert "total_orders" in data
    assert "approved_sellers" in data


@pytest.mark.asyncio
async def test_admin_orders_list(client: AsyncClient, admin_headers: dict):
    response = await client.get("/api/v1/admin/orders", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_crm_leads_workflow(client: AsyncClient, admin_headers: dict):
    # 1. Create a lead
    lead_payload = {
        "name": "Rohan Sharma",
        "phone": "9812345678",
        "email": "rohan@example.com",
        "city": "Bangalore",
        "lead_type": "SELL_CAR",
        "car_details": "2020 Swift ZXi",
        "expected_price": 550000.0,
    }
    create_res = await client.post("/api/v1/leads", json=lead_payload)
    assert create_res.status_code == 201
    lead_id = create_res.json()["id"]

    # 2. List leads
    list_res = await client.get("/api/v1/leads", headers=admin_headers)
    assert list_res.status_code == 200
    assert any(item["id"] == lead_id for item in list_res.json())

    # 3. Update lead status to CONTACTED
    update_res = await client.patch(
        f"/api/v1/leads/{lead_id}",
        json={"status": "CONTACTED", "notes": "Called user, inspection scheduled"},
        headers=admin_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "CONTACTED"
