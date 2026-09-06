import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_digital_inspection_submission_and_retrieval(client: AsyncClient):
    # 1. Get a seeded car
    cars_res = await client.get("/api/v1/cars")
    assert cars_res.status_code == 200
    cars = cars_res.json()["items"]
    assert len(cars) > 0
    car_id = cars[0]["id"]

    # 2. Submit new inspection report
    insp_payload = {
        "car_id": car_id,
        "engine_score": 9.5,
        "exterior_score": 9.0,
        "interior_score": 9.2,
        "suspension_score": 8.8,
        "electrical_score": 9.4,
        "ac_score": 9.0,
        "overall_score": 9.2,
        "summary_notes": "Vehicle in outstanding mechanical and aesthetic condition.",
        "items": [
            {
                "category": "ENGINE",
                "checkpoint_name": "Engine Oil Quality",
                "condition": "PERFECT",
                "notes": "Fresh oil, no leaks",
            },
            {
                "category": "EXTERIOR",
                "checkpoint_name": "Front Bumper Paint",
                "condition": "GOOD",
                "notes": "Minor scratch touched up",
            },
        ],
    }
    create_res = await client.post("/api/v1/inspections", json=insp_payload)
    assert create_res.status_code == 201
    insp_data = create_res.json()
    assert insp_data["overall_score"] == 9.2
    assert len(insp_data["items"]) == 2

    # 3. Retrieve inspection report
    get_res = await client.get(f"/api/v1/inspections/car/{car_id}")
    assert get_res.status_code == 200
    retrieved = get_res.json()
    assert retrieved["overall_score"] == 9.2
    assert len(retrieved["items"]) >= 2
