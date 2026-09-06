import pytest
from httpx import AsyncClient
from app.services.valuation_engine import ValuationEngine


def test_valuation_engine_logic():
    # Test Hyundai Creta Petrol Automatic
    val = ValuationEngine.calculate_valuation(
        make="Hyundai",
        model="Creta",
        year=2022,
        kilometers_driven=25000,
        fuel_type="PETROL",
        transmission="AUTOMATIC",
        ownership="FIRST",
        inspection_score=9.0,
    )
    assert val["estimated_min_price"] > 800000
    assert val["estimated_max_price"] > val["estimated_min_price"]
    assert val["recommended_procurement_price"] < val["fair_market_price"]


@pytest.mark.asyncio
async def test_valuation_api(client: AsyncClient):
    payload = {
        "make": "Tata",
        "model": "Nexon",
        "year": 2022,
        "fuel_type": "PETROL",
        "transmission": "MANUAL",
        "kilometers_driven": 20000,
        "ownership": "FIRST",
        "city": "Mumbai",
    }
    res = await client.post("/api/v1/leads/valuation", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["estimated_min_price"] > 500000
    assert data["estimated_max_price"] > data["estimated_min_price"]
