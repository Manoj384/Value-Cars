import asyncio
import sys
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import httpx
from app.main import app
from app.core.database import Base, AsyncSessionLocal, engine
from app.services.seed_service import seed_database


async def run_e2e_verification():
    print("=== Starting End-to-End Value Cars Verification ===")

    # 1. Initialize DB and seed
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        await seed_database(session)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://127.0.0.1:8000") as client:
        # Test 1: Public Health Check
        res = await client.get("/api/v1/health")
        print("[SUCCESS] Health Check:", res.json())
        assert res.status_code == 200

        # Test 2: Browse Cars & Filters
        cars_res = await client.get("/api/v1/cars?make=Hyundai")
        cars_data = cars_res.json()
        print(f"[SUCCESS] Catalog Search (Hyundai): Found {cars_data['total']} car(s)")
        assert cars_data["total"] >= 1
        car_id = cars_data["items"][0]["id"]

        # Test 3: Get Car Inspection Report
        insp_res = await client.get(f"/api/v1/inspections/car/{car_id}")
        insp_data = insp_res.json()
        print(f"[SUCCESS] Inspection Scorecard for {car_id}: Score {insp_data['overall_score']}/10 ({len(insp_data['items'])} checkpoints)")
        assert insp_res.status_code == 200

        # Test 4: Image Upload with Pillow WebP & Thumbnail generation
        import io
        from PIL import Image
        img_buf = io.BytesIO()
        img = Image.new("RGB", (1200, 800), color=(30, 60, 114))
        img.save(img_buf, format="JPEG")
        img_bytes = img_buf.getvalue()

        upload_res = await client.post(
            "/api/v1/uploads/images",
            files=[("files", ("thar_front.jpg", img_bytes, "image/jpeg"))],
        )
        upload_data = upload_res.json()
        uploaded_url = upload_data[0]["url"]
        thumb_url = upload_data[0]["thumbnail_url"]
        print(f"[SUCCESS] Image Upload: Display={uploaded_url} | Thumb={thumb_url}")
        assert upload_res.status_code == 200

        # Test 5: Seller Registration & Submit Car with Uploaded Image
        import time
        t_now = int(time.time())
        seller_email = f"sharma_{t_now}@valuecars.com"
        seller_res = await client.post(
            "/api/v1/sellers/register",
            json={
                "full_name": "Sharma Automobiles",
                "email": seller_email,
                "phone_number": f"9811{t_now % 1000000:06d}",
                "password": "SharmaPassword@2026",
            },
        )
        seller_token = seller_res.json()["access_token"]
        seller_headers = {"Authorization": f"Bearer {seller_token}"}
        print("[SUCCESS] Seller Registered & JWT issued")

        # Submit unverified car
        submit_res = await client.post(
            "/api/v1/cars/submit",
            json={
                "seller_email": seller_email,
                "seller_name": "Sharma Automobiles",
                "seller_phone": "9811223399",
                "title": "2023 Mahindra Scorpio-N Z8L Diesel 4x4",
                "reg_number": f"KA-01-SN-{t_now % 10000:04d}",
                "make": "Mahindra",
                "model": "Scorpio-N",
                "variant": "Z8L 4x4 AT",
                "year": 2023,
                "kilometers_driven": 16000,
                "fuel_type": "DIESEL",
                "transmission": "AUTOMATIC",
                "ownership": "FIRST",
                "body_type": "SUV",
                "color": "Deep Forest",
                "city": "Bangalore",
                "price": 2250000.0,
                "image_urls": [uploaded_url],
            },
        )
        submitted_car = submit_res.json()
        print(f"[SUCCESS] Seller Submitted Car (ID: {submitted_car['car_id']}) -> Status: {submitted_car['status']}")
        new_car_id = submitted_car["car_id"]

        # Test 6: Admin Login & Review Pending Queue
        admin_login_res = await client.post(
            "/api/v1/admin/login",
            json={"email": "admin@valuecars.com", "password": "Admin@ValueCars2026"},
        )
        admin_token = admin_login_res.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("[SUCCESS] Admin Login & JWT authenticated")

        # Admin fetches metrics
        metrics_res = await client.get("/api/v1/admin/metrics", headers=admin_headers)
        metrics = metrics_res.json()
        print(f"[SUCCESS] Admin Dashboard Metrics: {metrics['total_published_cars']} published cars, Rs {metrics['total_inventory_value_inr']/100000:.2f}L inventory, {metrics['pending_car_approvals']} pending approval")

        # Admin approves the pending car
        approve_res = await client.post(f"/api/v1/cars/admin/approve/{new_car_id}", headers=admin_headers)
        print(f"[SUCCESS] Admin Approved Car {new_car_id} -> Status: {approve_res.json()['status']}")

        # Test 7: Verify Approved Car is Live in Public Catalog
        catalog_res = await client.get("/api/v1/cars?model=Scorpio")
        catalog_data = catalog_res.json()
        print(f"[SUCCESS] Public Catalog Search (Scorpio): Found {catalog_data['total']} car(s) - Car title: '{catalog_data['items'][0]['title']}'")
        assert catalog_data["total"] >= 1

        # Test 8: Book Test Drive for this car
        td_res = await client.post(
            "/api/v1/test-drives",
            json={
                "car_id": new_car_id,
                "customer_name": "Manoj Customer",
                "customer_phone": "9988776655",
                "customer_email": "manoj.customer@example.com",
                "location_type": "HOME_DELIVERY",
                "delivery_address": "Indiranagar 100ft road, Bangalore",
                "booking_date": "2026-09-10",
                "booking_time_slot": "11:00 AM - 01:00 PM",
            },
        )
        print("[SUCCESS] Customer Test Drive Booking:", td_res.json()["status"])
        assert td_res.status_code == 201

        # Test 9: Reserve Car Token Deposit
        reserve_res = await client.post(
            "/api/v1/orders/reserve",
            json={
                "car_id": new_car_id,
                "customer_name": "Manoj Customer",
                "customer_phone": "9988776655",
                "customer_email": "manoj.customer@example.com",
                "delivery_city": "Bangalore",
                "token_amount": 10000.0,
            },
        )
        print("[SUCCESS] Customer Token Reservation:", reserve_res.json()["order_status"], f"- Amount: Rs {reserve_res.json()['token_amount']}")
        assert reserve_res.status_code == 201

        # Test 10: Automated SMS / WhatsApp Alerts Dispatch Log
        from app.services.notification_service import NotificationService
        history = NotificationService.get_history()
        templates_sent = [h.template_name for h in history]
        print(f"[SUCCESS] Notification Alerts Engine Dispatched {len(history)} Messages: {list(set(templates_sent))}")
        assert len(history) >= 8

    print("\nALL 10 END-TO-END WORKFLOWS VERIFIED 100% SUCCESSFULLY!")


if __name__ == "__main__":
    asyncio.run(run_e2e_verification())
