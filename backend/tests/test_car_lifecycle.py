import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_car_modify_mark_sold_and_delete(client: AsyncClient, admin_headers: dict):
    # 1. Submit a test car
    car_res = await client.post('/api/v1/cars/submit', json={
        'seller_email': 'shankarmanoj654@gmail.com',
        'seller_name': 'Manoj Shankar',
        'seller_phone': '8050966025',
        'title': '2023 Maruti Baleno Alpha Petrol',
        'reg_number': 'KA-04-MB-2023',
        'make': 'Maruti',
        'model': 'Baleno',
        'variant': 'Alpha',
        'year': 2023,
        'kilometers_driven': 8000,
        'fuel_type': 'PETROL',
        'transmission': 'MANUAL',
        'ownership': 'FIRST',
        'body_type': 'HATCHBACK',
        'color': 'Celestial Blue',
        'city': 'Bangalore',
        'price': 850000.0,
    })
    assert car_res.status_code == 200
    car_id = car_res.json()['car_id']

    # 2. Modify car details (e.g. price and description)
    modify_res = await client.patch(f'/api/v1/cars/manage/{car_id}', json={
        'manager_email': 'shankarmanoj654@gmail.com',
        'price': 825000.0,
        'description': 'Price dropped for quick sale! Mint condition.',
    })
    assert modify_res.status_code == 200
    assert modify_res.json()['price'] == 825000.0

    # 3. Mark as Sold with 2-day auto delete
    sold_res = await client.post(f'/api/v1/cars/manage/{car_id}/mark-sold', json={
        'manager_email': 'shankarmanoj654@gmail.com',
        'auto_delete_after_days': 2,
        'dont_delete': False,
    })
    assert sold_res.status_code == 200
    data = sold_res.json()
    assert data['status'] == 'SOLD'
    assert data['dont_delete'] is False
    assert data['auto_delete_at'] is not None

    # 4. Mark as Sold with dont_delete=True
    sold_keep_res = await client.post(f'/api/v1/cars/manage/{car_id}/mark-sold', json={
        'manager_email': 'shankarmanoj654@gmail.com',
        'dont_delete': True,
    })
    assert sold_keep_res.status_code == 200
    assert sold_keep_res.json()['dont_delete'] is True

    # 5. Unauthorized attempt with random email
    unauth_res = await client.post(f'/api/v1/cars/manage/{car_id}/mark-sold', json={
        'manager_email': 'random_hacker@unknown.com',
        'dont_delete': True,
    })
    assert unauth_res.status_code == 403

    # 6. Delete car
    del_res = await client.delete(f'/api/v1/cars/manage/{car_id}?manager_email=shankarmanoj654@gmail.com')
    assert del_res.status_code == 200

    # 7. Verify car is gone
    get_res = await client.get(f'/api/v1/cars/{car_id}')
    assert get_res.status_code == 404
