import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.car import Car, CarImage, CarFeature, FuelType, TransmissionType, OwnershipType, BodyType, CarStatus
from app.models.user import User, UserRole, ApprovedSellerEmail
from app.models.inspection import Inspection, InspectionItem, InspectionStatus, CheckpointCondition
from app.core.security import get_password_hash

SAMPLE_CARS = [
    {
        "title": "2021 Hyundai Creta SX (O) 1.5 Petrol Automatic",
        "reg_number": "KA-01-MJ-2021",
        "make": "Hyundai",
        "model": "Creta",
        "variant": "1.5 SX (O)",
        "year": 2021,
        "kilometers_driven": 28500,
        "fuel_type": FuelType.PETROL,
        "transmission": TransmissionType.AUTOMATIC,
        "ownership": OwnershipType.FIRST,
        "body_type": BodyType.SUV,
        "color": "Polar White",
        "city": "Bangalore",
        "hub_location": "Value Cars Mega Hub, Koramangala",
        "price": 1475000.0,
        "original_price": 1850000.0,
        "estimated_market_min": 1420000.0,
        "estimated_market_max": 1520000.0,
        "inspection_score": 9.2,
        "is_spinny_certified": True,
        "warranty_months": 12,
        "status": CarStatus.PUBLISHED,
        "seller_email": "admin@valuecars.com",
        "seller_name": "Value Cars Direct",
        "seller_phone": "9876543210",
        "is_verified_seller": True,
        "description": "Pristine single owner Hyundai Creta SX(O) top model with Panoramic Sunroof, ventilated seats, Bose audio, and full service history at authorized Hyundai service center.",
        "images": [
            {"image_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80", "tag": "EXTERIOR", "display_order": 1, "is_cover": True},
            {"image_url": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80", "tag": "EXTERIOR", "display_order": 2, "is_cover": False},
            {"image_url": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80", "tag": "INTERIOR", "display_order": 3, "is_cover": False},
        ],
        "features": [
            {"category": "COMFORT", "name": "Panoramic Sunroof"},
            {"category": "COMFORT", "name": "Ventilated Front Seats"},
            {"category": "INFOTAINMENT", "name": "10.25 inch HD Touchscreen with Apple CarPlay"},
            {"category": "SAFETY", "name": "6 Airbags & ESP"},
            {"category": "PERFORMANCE", "name": "Paddle Shifters"},
        ],
    },
    {
        "title": "2022 Tata Nexon Fearless Plus S Petrol Manual",
        "reg_number": "MH-02-DN-4521",
        "make": "Tata",
        "model": "Nexon",
        "variant": "Fearless Plus S",
        "year": 2022,
        "kilometers_driven": 18200,
        "fuel_type": FuelType.PETROL,
        "transmission": TransmissionType.MANUAL,
        "ownership": OwnershipType.FIRST,
        "body_type": BodyType.SUV,
        "color": "Daytona Grey",
        "city": "Mumbai",
        "hub_location": "Value Cars Hub, Andheri East",
        "price": 1090000.0,
        "original_price": 1380000.0,
        "estimated_market_min": 1040000.0,
        "estimated_market_max": 1130000.0,
        "inspection_score": 9.5,
        "is_spinny_certified": True,
        "warranty_months": 12,
        "status": CarStatus.PUBLISHED,
        "seller_email": "admin@valuecars.com",
        "seller_name": "Value Cars Direct",
        "seller_phone": "9876543210",
        "is_verified_seller": True,
        "description": "5-Star Global NCAP safety rated Tata Nexon with electronic sunroof, 360-degree camera, and sequential LED DRLs. Zero insurance claims.",
        "images": [
            {"image_url": "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80", "tag": "EXTERIOR", "display_order": 1, "is_cover": True},
            {"image_url": "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80", "tag": "INTERIOR", "display_order": 2, "is_cover": False},
        ],
        "features": [
            {"category": "SAFETY", "name": "5-Star Global NCAP Safety Rating"},
            {"category": "SAFETY", "name": "360-Degree Surround View Camera"},
            {"category": "COMFORT", "name": "Voice-assisted Electric Sunroof"},
            {"category": "INFOTAINMENT", "name": "JBL 8-Speaker Sound System"},
        ],
    },
    {
        "title": "2020 Honda City ZX CVT Petrol Automatic",
        "reg_number": "DL-01-CR-8890",
        "make": "Honda",
        "model": "City",
        "variant": "ZX CVT (5th Gen)",
        "year": 2020,
        "kilometers_driven": 35000,
        "fuel_type": FuelType.PETROL,
        "transmission": TransmissionType.AUTOMATIC,
        "ownership": OwnershipType.FIRST,
        "body_type": BodyType.SEDAN,
        "color": "Golden Brown Metallic",
        "city": "Delhi NCR",
        "hub_location": "Value Cars Hub, Gurgaon CyberHub",
        "price": 1125000.0,
        "original_price": 1600000.0,
        "estimated_market_min": 1080000.0,
        "estimated_market_max": 1160000.0,
        "inspection_score": 8.9,
        "is_spinny_certified": True,
        "warranty_months": 12,
        "status": CarStatus.PUBLISHED,
        "seller_email": "admin@valuecars.com",
        "seller_name": "Value Cars Direct",
        "seller_phone": "9876543210",
        "is_verified_seller": True,
        "description": "Executive sedan perfection with Honda LaneWatch Camera, LED headlights, plush leather upholstery, and buttery smooth 1.5L i-VTEC engine.",
        "images": [
            {"image_url": "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80", "tag": "EXTERIOR", "display_order": 1, "is_cover": True},
            {"image_url": "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80", "tag": "EXTERIOR", "display_order": 2, "is_cover": False},
        ],
        "features": [
            {"category": "SAFETY", "name": "Honda LaneWatch Blind Spot Camera"},
            {"category": "COMFORT", "name": "One-Touch Electric Sunroof"},
            {"category": "COMFORT", "name": "Full Premium Leather Seats"},
            {"category": "PERFORMANCE", "name": "1.5L i-VTEC DOHC Engine"},
        ],
    },
    {
        "title": "2023 Mahindra Thar LX Hard Top 4x4 Diesel Manual",
        "reg_number": "KA-05-TH-4444",
        "make": "Mahindra",
        "model": "Thar",
        "variant": "LX 4-Str Hard Top Diesel 4x4",
        "year": 2023,
        "kilometers_driven": 12400,
        "fuel_type": FuelType.DIESEL,
        "transmission": TransmissionType.MANUAL,
        "ownership": OwnershipType.FIRST,
        "body_type": BodyType.SUV,
        "color": "Napoli Black",
        "city": "Bangalore",
        "hub_location": "Value Cars Mega Hub, Whitefield",
        "price": 1580000.0,
        "original_price": 1820000.0,
        "estimated_market_min": 1530000.0,
        "estimated_market_max": 1620000.0,
        "inspection_score": 9.6,
        "is_spinny_certified": True,
        "warranty_months": 12,
        "status": CarStatus.PUBLISHED,
        "seller_email": "admin@valuecars.com",
        "seller_name": "Value Cars Direct",
        "seller_phone": "9876543210",
        "is_verified_seller": True,
        "description": "True 4x4 capability with shift-on-fly transfer case, factory hard top, all-terrain alloys, and immaculate mechanical health.",
        "images": [
            {"image_url": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80", "tag": "EXTERIOR", "display_order": 1, "is_cover": True},
        ],
        "features": [
            {"category": "PERFORMANCE", "name": "Mechanical Locking Differential (MLD)"},
            {"category": "PERFORMANCE", "name": "Shift-on-the-fly 4x4 Transfer Case"},
            {"category": "SAFETY", "name": "Roll Cage & ESP with Rollover Mitigation"},
        ],
    },
    {
        "title": "2022 Maruti Suzuki Swift ZXi Plus AMT Petrol",
        "reg_number": "MH-12-SW-9912",
        "make": "Maruti",
        "model": "Swift",
        "variant": "ZXi Plus AMT Dual Tone",
        "year": 2022,
        "kilometers_driven": 21000,
        "fuel_type": FuelType.PETROL,
        "transmission": TransmissionType.AUTOMATIC,
        "ownership": OwnershipType.FIRST,
        "body_type": BodyType.HATCHBACK,
        "color": "Solid Fire Red with Midnight Black Roof",
        "city": "Mumbai",
        "hub_location": "Value Cars Hub, Navi Mumbai",
        "price": 765000.0,
        "original_price": 930000.0,
        "estimated_market_min": 730000.0,
        "estimated_market_max": 790000.0,
        "inspection_score": 9.1,
        "is_spinny_certified": True,
        "warranty_months": 12,
        "status": CarStatus.PUBLISHED,
        "seller_email": "admin@valuecars.com",
        "seller_name": "Value Cars Direct",
        "seller_phone": "9876543210",
        "is_verified_seller": True,
        "description": "Super fuel-efficient city hatchback delivering 23+ kmpl with SmartPlay Pro touchscreen, cruise control, and precision AMT transmission.",
        "images": [
            {"image_url": "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80", "tag": "EXTERIOR", "display_order": 1, "is_cover": True},
        ],
        "features": [
            {"category": "COMFORT", "name": "Cruise Control"},
            {"category": "INFOTAINMENT", "name": "7-inch SmartPlay Studio with Apple CarPlay"},
            {"category": "SAFETY", "name": "Reverse Parking Camera with Sensors"},
        ],
    },
]


async def seed_database(db: AsyncSession) -> None:
    """Seeds default admin user, approved emails, and initial sample car inventory."""
    # 1. Seed Admin User
    admin_query = select(User).where(User.email == "admin@valuecars.com")
    admin_res = await db.execute(admin_query)
    admin = admin_res.scalar_one_or_none()
    if not admin:
        admin = User(
            full_name="Value Cars Superadmin",
            phone_number="9876543210",
            email="admin@valuecars.com",
            hashed_password=get_password_hash("Admin@ValueCars2026"),
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
            is_approved_seller=True,
            city="Bangalore",
        )
        db.add(admin)

    # 2. Seed Pre-approved Seller Email
    apprv_query = select(ApprovedSellerEmail).where(ApprovedSellerEmail.email == "verified.seller@valuecars.com")
    apprv_res = await db.execute(apprv_query)
    if not apprv_res.scalar_one_or_none():
        db.add(
            ApprovedSellerEmail(
                email="verified.seller@valuecars.com",
                approved_by="Superadmin",
                notes="Authorized Premium Partner Dealer",
                is_active=True,
            )
        )
        db.add(
            ApprovedSellerEmail(
                email="admin@valuecars.com",
                approved_by="Superadmin",
                notes="Primary Platform Admin",
                is_active=True,
            )
        )

    # 3. Seed Inspector User
    insp_query = select(User).where(User.email == "inspector@valuecars.com")
    insp_res = await db.execute(insp_query)
    inspector = insp_res.scalar_one_or_none()
    if not inspector:
        inspector = User(
            full_name="Rajesh Kumar (Senior Inspector)",
            phone_number="9876543211",
            email="inspector@valuecars.com",
            hashed_password=get_password_hash("Inspector@2026"),
            role=UserRole.INSPECTOR,
            is_active=True,
            is_verified=True,
            city="Bangalore",
        )
        db.add(inspector)

    await db.flush()

    # 4. Seed Cars if table is empty
    cars_count_query = select(Car)
    existing_cars = await db.execute(cars_count_query)
    if not existing_cars.first():
        for car_data in SAMPLE_CARS:
            images = car_data.pop("images", [])
            features = car_data.pop("features", [])

            car = Car(**car_data)
            db.add(car)
            await db.flush()

            for img in images:
                db.add(CarImage(car_id=car.id, **img))

            for feat in features:
                db.add(CarFeature(car_id=car.id, **feat))

            # Create an inspection record for the car
            inspection = Inspection(
                car_id=car.id,
                inspector_id=inspector.id if inspector else None,
                overall_score=car.inspection_score,
                status=InspectionStatus.APPROVED,
                engine_score=9.4,
                exterior_score=9.1,
                interior_score=9.3,
                transmission_score=9.5,
                suspension_score=9.0,
                electrical_score=9.6,
                tyre_score=8.8,
                ac_score=9.5,
                summary_notes="Vehicle is in superb mechanical and cosmetic condition. No structural damage detected.",
            )
            db.add(inspection)
            await db.flush()

            # Add sample checkpoints
            checkpoints = [
                ("ENGINE", "Engine Oil Condition", CheckpointCondition.PERFECT, "Clean engine oil at optimal level"),
                ("ENGINE", "Coolant & Radiator", CheckpointCondition.GOOD, "No coolant leaks detected"),
                ("EXTERIOR", "Front Bumper & Grille", CheckpointCondition.GOOD, "Minor superficial stone chip"),
                ("INTERIOR", "Dashboard & Upholstery", CheckpointCondition.PERFECT, "No tears or dashboard fading"),
                ("TYRES", "Tyre Tread Depth", CheckpointCondition.GOOD, "Approx 75% tread life remaining"),
            ]
            for cat, name, cond, notes in checkpoints:
                db.add(
                    InspectionItem(
                        inspection_id=inspection.id,
                        category=cat,
                        checkpoint_name=name,
                        condition=cond,
                        notes=notes,
                    )
                )

        await db.commit()
