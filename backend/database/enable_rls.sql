-- =========================================================
-- VALUE CARS - ENABLE ROW LEVEL SECURITY (RLS) IN SUPABASE
-- =========================================================

-- 1. Enable RLS on all Public Tables
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approved_seller_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Public Read Policies for Public Tables
DROP POLICY IF EXISTS "Public can view published cars" ON public.cars;
CREATE POLICY "Public can view published cars" 
    ON public.cars 
    FOR SELECT 
    USING (status = 'PUBLISHED');

DROP POLICY IF EXISTS "Public can view car images" ON public.car_images;
CREATE POLICY "Public can view car images" 
    ON public.car_images 
    FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Public can view car features" ON public.car_features;
CREATE POLICY "Public can view car features" 
    ON public.car_features 
    FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Public can view inspections" ON public.inspections;
CREATE POLICY "Public can view inspections" 
    ON public.inspections 
    FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Public can view inspection items" ON public.inspection_items;
CREATE POLICY "Public can view inspection items" 
    ON public.inspection_items 
    FOR SELECT 
    USING (true);

-- 3. Public Insert Policies for Leads & Bookings
DROP POLICY IF EXISTS "Anyone can submit leads" ON public.leads;
CREATE POLICY "Anyone can submit leads" 
    ON public.leads 
    FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can book test drives" ON public.test_drives;
CREATE POLICY "Anyone can book test drives" 
    ON public.test_drives 
    FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can create reservation orders" ON public.orders;
CREATE POLICY "Anyone can create reservation orders" 
    ON public.orders 
    FOR INSERT 
    WITH CHECK (true);
