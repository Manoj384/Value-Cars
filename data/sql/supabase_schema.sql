-- =========================================================
-- VALUE CARS - SUPABASE POSTGRESQL INITIAL SCHEMA
-- Run this in your Supabase Project -> SQL Editor
-- =========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('CUSTOMER', 'ADMIN', 'INSPECTOR', 'SALES', 'SELLER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE fuel_type AS ENUM ('PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'HYBRID');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transmission_type AS ENUM ('MANUAL', 'AUTOMATIC');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ownership_type AS ENUM ('FIRST', 'SECOND', 'THIRD', 'FOURTH_PLUS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE body_type AS ENUM ('HATCHBACK', 'SEDAN', 'SUV', 'MUV', 'LUXURY', 'COUPE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE car_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'INSPECTION_PENDING', 'REFURBISHMENT', 'PUBLISHED', 'TEST_DRIVE_BOOKED', 'RESERVED', 'SOLD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE inspection_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE checkpoint_condition AS ENUM ('PERFECT', 'GOOD', 'IMPERFECTION', 'DAMAGED', 'REPLACED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_type AS ENUM ('SELL_CAR', 'BUY_ENQUIRY', 'TEST_DRIVE', 'FINANCE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('NEW', 'CONTACTED', 'INTERESTED', 'INSPECTION_SCHEDULED', 'NEGOTIATION', 'CONVERTED', 'LOST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE test_drive_location AS ENUM ('HOME_DELIVERY', 'HUB_VISIT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE test_drive_status AS ENUM ('REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_type AS ENUM ('RESERVATION_TOKEN', 'FULL_PAYMENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('PENDING', 'RESERVED', 'PAID', 'DOCUMENTATION', 'DELIVERED', 'CANCELLED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('INITIATED', 'SUCCESS', 'FAILED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(120) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    hashed_password VARCHAR(255),
    role user_role DEFAULT 'CUSTOMER' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    is_approved_seller BOOLEAN DEFAULT FALSE NOT NULL,
    city VARCHAR(80),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Approved Seller Emails (Whitelist)
CREATE TABLE IF NOT EXISTS approved_seller_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    approved_by VARCHAR(120) DEFAULT 'Superadmin' NOT NULL,
    notes VARCHAR(255) DEFAULT 'Verified Seller',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Cars Table
CREATE TABLE IF NOT EXISTS cars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    reg_number VARCHAR(30) UNIQUE NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    variant VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    kilometers_driven INTEGER NOT NULL,
    fuel_type fuel_type NOT NULL,
    transmission transmission_type NOT NULL,
    ownership ownership_type NOT NULL,
    body_type body_type NOT NULL,
    color VARCHAR(50) NOT NULL,
    city VARCHAR(80) NOT NULL,
    hub_location VARCHAR(150),
    price DOUBLE PRECISION NOT NULL,
    original_price DOUBLE PRECISION,
    estimated_market_min DOUBLE PRECISION,
    estimated_market_max DOUBLE PRECISION,
    inspection_score DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    is_spinny_certified BOOLEAN DEFAULT TRUE NOT NULL,
    warranty_months INTEGER DEFAULT 12 NOT NULL,
    seller_email VARCHAR(255),
    seller_phone VARCHAR(20),
    seller_name VARCHAR(120),
    is_verified_seller BOOLEAN DEFAULT FALSE NOT NULL,
    status car_status DEFAULT 'PUBLISHED' NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Car Images Table
CREATE TABLE IF NOT EXISTS car_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    tag VARCHAR(50) DEFAULT 'EXTERIOR',
    display_order INTEGER DEFAULT 0,
    is_cover BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Car Features Table
CREATE TABLE IF NOT EXISTS car_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Inspections Table
CREATE TABLE IF NOT EXISTS inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    inspector_id UUID REFERENCES users(id) ON DELETE SET NULL,
    overall_score DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    status inspection_status DEFAULT 'SCHEDULED' NOT NULL,
    engine_score DOUBLE PRECISION DEFAULT 0.0,
    exterior_score DOUBLE PRECISION DEFAULT 0.0,
    interior_score DOUBLE PRECISION DEFAULT 0.0,
    transmission_score DOUBLE PRECISION DEFAULT 0.0,
    suspension_score DOUBLE PRECISION DEFAULT 0.0,
    electrical_score DOUBLE PRECISION DEFAULT 0.0,
    tyre_score DOUBLE PRECISION DEFAULT 0.0,
    ac_score DOUBLE PRECISION DEFAULT 0.0,
    summary_notes TEXT,
    report_pdf_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. Inspection Items Table
CREATE TABLE IF NOT EXISTS inspection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    checkpoint_name VARCHAR(150) NOT NULL,
    condition checkpoint_condition DEFAULT 'GOOD' NOT NULL,
    notes TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. Leads Table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_type lead_type DEFAULT 'SELL_CAR' NOT NULL,
    status lead_status DEFAULT 'NEW' NOT NULL,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    city VARCHAR(80) NOT NULL,
    car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
    reg_number VARCHAR(30),
    car_details VARCHAR(200),
    expected_price DOUBLE PRECISION,
    estimated_valuation DOUBLE PRECISION,
    notes TEXT,
    assigned_sales_rep VARCHAR(120),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. Test Drives Table
CREATE TABLE IF NOT EXISTS test_drives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    booking_date DATE NOT NULL,
    booking_time_slot VARCHAR(50) NOT NULL,
    location_type test_drive_location DEFAULT 'HUB_VISIT' NOT NULL,
    delivery_address TEXT,
    hub_name VARCHAR(150),
    status test_drive_status DEFAULT 'REQUESTED' NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE RESTRICT,
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    order_type order_type DEFAULT 'RESERVATION_TOKEN' NOT NULL,
    order_status order_status DEFAULT 'PENDING' NOT NULL,
    token_amount DOUBLE PRECISION DEFAULT 10000.0 NOT NULL,
    total_price DOUBLE PRECISION NOT NULL,
    balance_amount DOUBLE PRECISION NOT NULL,
    delivery_city VARCHAR(80) NOT NULL,
    delivery_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 13. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    transaction_ref VARCHAR(100) UNIQUE NOT NULL,
    payment_gateway VARCHAR(50) DEFAULT 'RAZORPAY',
    gateway_order_id VARCHAR(100),
    gateway_payment_id VARCHAR(100),
    amount DOUBLE PRECISION NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status payment_status DEFAULT 'INITIATED' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 14. Initial Seed Whitelist Email
INSERT INTO approved_seller_emails (email, approved_by, notes)
VALUES 
    ('verified.seller@valuecars.com', 'Superadmin', 'Authorized Premium Partner Dealer'),
    ('admin@valuecars.com', 'Superadmin', 'Primary Platform Admin')
ON CONFLICT (email) DO NOTHING;
