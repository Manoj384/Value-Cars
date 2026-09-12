import pytest
from httpx import AsyncClient
from app.core.config import settings
from app.services.notification_service import (
    NotificationChannel,
    NotificationRecord,
    NotificationService,
    NotificationStatus,
)


@pytest.fixture(autouse=True)
def clear_notification_history():
    NotificationService.clear_history()
    yield
    NotificationService.clear_history()


@pytest.mark.asyncio
async def test_direct_test_drive_booked_alert():
    records = await NotificationService.send_test_drive_booked_alert(
        customer_name="Aarav Sharma",
        customer_phone="9876543210",
        car_title="2022 Hyundai Creta SX(O)",
        booking_date="2026-09-15",
        time_slot="10:00 AM - 12:00 PM",
        location_type="HOME_DELIVERY",
        address="Koramangala 4th Block, Bangalore",
    )
    assert len(records) == 2
    sms_rec = next(r for r in records if r.channel == NotificationChannel.SMS)
    wa_rec = next(r for r in records if r.channel == NotificationChannel.WHATSAPP)

    assert sms_rec.status == NotificationStatus.SENT
    assert wa_rec.status == NotificationStatus.SENT
    assert "Aarav Sharma" in sms_rec.message
    assert "Hyundai Creta" in sms_rec.message
    assert "Koramangala" in wa_rec.message


@pytest.mark.asyncio
async def test_direct_car_reserved_alert():
    records = await NotificationService.send_car_reserved_alert(
        customer_name="Priya Patel",
        customer_phone="9812345678",
        order_number="VC-982134",
        car_title="2021 Honda City ZX CVT",
        token_amount=10000.0,
        balance_amount=1080000.0,
    )
    assert len(records) == 2
    for r in records:
        assert r.status == NotificationStatus.SENT
        assert "VC-982134" in r.message
        assert "10,000" in r.message
        assert "1,080,000" in r.message


@pytest.mark.asyncio
async def test_direct_seller_alerts():
    # Submitted alert
    submit_records = await NotificationService.send_seller_car_submitted_alert(
        seller_name="Kishore Motors",
        seller_phone="9900112233",
        seller_email="kishore@motors.com",
        car_title="2020 Kia Seltos GTX+",
        reg_number="KA-05-MM-1234",
        is_published=False,
    )
    assert len(submit_records) == 2
    assert "reviewing your listing" in submit_records[0].message

    # Approved alert
    approve_records = await NotificationService.send_seller_car_approved_alert(
        seller_name="Kishore Motors",
        seller_phone="9900112233",
        seller_email="kishore@motors.com",
        car_title="2020 Kia Seltos GTX+",
        reg_number="KA-05-MM-1234",
    )
    assert len(approve_records) == 2
    assert "APPROVED" in approve_records[0].message

    # Admin alert
    admin_records = await NotificationService.send_admin_new_car_alert(
        car_title="2020 Kia Seltos GTX+",
        seller_name="Kishore Motors",
        seller_email="kishore@motors.com",
        reg_number="KA-05-MM-1234",
        price=1450000.0,
    )
    assert len(admin_records) == len(settings.ADMIN_ALERT_PHONES) * 2
    assert "Admin Alert" in admin_records[0].message


@pytest.mark.asyncio
async def test_disabled_notifications_flag(monkeypatch):
    monkeypatch.setattr(settings, "NOTIFICATIONS_ENABLED", False)
    records = await NotificationService.send_test_drive_booked_alert(
        customer_name="Test User",
        customer_phone="9000000000",
        car_title="Car A",
        booking_date="2026-09-20",
        time_slot="02:00 PM - 04:00 PM",
        location_type="HUB",
    )
    assert len(records) == 2
    for r in records:
        assert r.status == NotificationStatus.SKIPPED


@pytest.mark.asyncio
async def test_api_test_drive_triggers_notifications(client: AsyncClient, admin_headers: dict):
    # 1. Create a car first
    submit_res = await client.post(
        "/api/v1/cars/submit",
        json={
            "seller_email": "auto_seller_test@valcars.com",
            "seller_name": "Apex Motors",
            "seller_phone": "9876123450",
            "title": "2023 Tata Harrier XZA Plus",
            "reg_number": "KA-51-TH-7788",
            "make": "Tata",
            "model": "Harrier",
            "variant": "XZA Plus",
            "year": 2023,
            "kilometers_driven": 12000,
            "fuel_type": "DIESEL",
            "transmission": "AUTOMATIC",
            "ownership": "FIRST",
            "body_type": "SUV",
            "color": "Daytona Grey",
            "city": "Bangalore",
            "price": 2100000.0,
        },
    )
    assert submit_res.status_code == 200
    car_id = submit_res.json()["car_id"]

    # Approve car so it can be booked
    await client.post(f"/api/v1/cars/admin/approve/{car_id}", headers=admin_headers)
    NotificationService.clear_history()

    # 2. Book test drive
    td_res = await client.post(
        "/api/v1/test-drives",
        json={
            "car_id": car_id,
            "customer_name": "Rohan Gupta",
            "customer_phone": "9876543210",
            "customer_email": "rohan@example.com",
            "location_type": "HOME_DELIVERY",
            "delivery_address": "HSR Layout Sector 1, Bangalore",
            "booking_date": "2026-09-12",
            "booking_time_slot": "04:00 PM - 06:00 PM",
        },
    )
    assert td_res.status_code == 201
    booking_id = td_res.json()["id"]

    history = NotificationService.get_history()
    assert any(h.template_name == "TEST_DRIVE_BOOKED" and h.recipient == "9876543210" for h in history)

    # 3. Update status of test drive
    patch_res = await client.patch(
        f"/api/v1/test-drives/{booking_id}",
        json={"status": "CONFIRMED"},
        headers=admin_headers,
    )
    assert patch_res.status_code == 200
    history_after = NotificationService.get_history()
    assert any(h.template_name == "TEST_DRIVE_STATUS_UPDATE" and h.recipient == "9876543210" for h in history_after)


@pytest.mark.asyncio
async def test_api_order_reservation_triggers_notifications(client: AsyncClient, admin_headers: dict):
    # 1. Create a car
    submit_res = await client.post(
        "/api/v1/cars/submit",
        json={
            "seller_email": "order_seller@valcars.com",
            "seller_name": "Speed Auto",
            "seller_phone": "9812000000",
            "title": "2022 Maruti Baleno Alpha",
            "reg_number": "DL-01-BL-9900",
            "make": "Maruti",
            "model": "Baleno",
            "variant": "Alpha",
            "year": 2022,
            "kilometers_driven": 18000,
            "fuel_type": "PETROL",
            "transmission": "MANUAL",
            "ownership": "FIRST",
            "body_type": "HATCHBACK",
            "color": "Nexa Blue",
            "city": "Delhi",
            "price": 850000.0,
        },
    )
    car_id = submit_res.json()["car_id"]
    await client.post(f"/api/v1/cars/admin/approve/{car_id}", headers=admin_headers)
    NotificationService.clear_history()

    # 2. Reserve car
    order_res = await client.post(
        "/api/v1/orders/reserve",
        json={
            "car_id": car_id,
            "customer_name": "Ananya Sharma",
            "customer_phone": "9999888877",
            "customer_email": "ananya@example.com",
            "delivery_city": "Delhi",
            "token_amount": 10000.0,
        },
    )
    assert order_res.status_code == 201
    order_data = order_res.json()
    assert order_data["order_status"] == "RESERVED"

    history = NotificationService.get_history()
    assert any(h.template_name == "CAR_RESERVED" and h.recipient == "9999888877" for h in history)
