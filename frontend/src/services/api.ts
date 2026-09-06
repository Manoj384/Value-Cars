import { Car, InspectionReport } from '../types/car';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export interface CarFilterOptions {
  make?: string;
  model?: string;
  city?: string;
  fuel_type?: string;
  transmission?: string;
  body_type?: string;
  min_price?: number;
  max_price?: number;
  min_year?: number;
  max_year?: number;
  max_km?: number;
  min_score?: number;
  sort_by?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedCars {
  items: Car[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ValuationRequest {
  make: string;
  model: string;
  year: number;
  fuel_type: string;
  transmission: string;
  kilometers_driven: number;
  ownership?: string;
  city?: string;
}

export interface ValuationResponse {
  estimated_min_price: number;
  estimated_max_price: number;
  recommended_procurement_price: number;
  currency: string;
}

export interface TestDriveRequest {
  car_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  city: string;
  location_type: 'HOME_DELIVERY' | 'VALUE_CARS_HUB';
  address?: string;
  booking_date: string;
  time_slot: string;
}

export interface TokenReservationRequest {
  car_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  city: string;
  token_amount?: number;
  payment_method?: string;
}

export interface SellerCarSubmission {
  title: string;
  reg_number: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  kilometers_driven: number;
  fuel_type: string;
  transmission: string;
  ownership: string;
  body_type: string;
  color: string;
  city: string;
  price: number;
  seller_email: string;
  seller_name: string;
  seller_phone: string;
  description?: string;
  image_urls?: string[];
}

export interface AdminMetrics {
  total_published_cars: number;
  total_inventory_value_inr: number;
  average_inspection_score: number;
  pending_car_approvals: number;
  total_leads: number;
  new_leads: number;
  total_test_drives: number;
  total_orders: number;
  total_token_revenue_inr: number;
  approved_sellers: number;
}

// Built-in Mock Certified Inventory for Seamless Static Demo on GitHub Pages
const MOCK_CARS: Car[] = [
  {
    id: 'c1',
    title: '2021 Hyundai Creta SX (O) 1.5 Petrol Automatic',
    reg_number: 'KA-01-MJ-2021',
    make: 'Hyundai',
    model: 'Creta',
    variant: '1.5 SX (O)',
    year: 2021,
    kilometers_driven: 28500,
    fuel_type: 'PETROL',
    transmission: 'AUTOMATIC',
    ownership: 'FIRST',
    body_type: 'SUV',
    color: 'Polar White',
    city: 'Bangalore',
    price: 1475000.0,
    original_price: 1850000.0,
    estimated_market_min: 1420000.0,
    estimated_market_max: 1520000.0,
    inspection_score: 9.2,
    is_spinny_certified: true,
    warranty_months: 12,
    status: 'PUBLISHED',
    seller_name: 'Value Cars Direct',
    seller_email: 'admin@valuecars.com',
    is_verified_seller: true,
    images: [
      { id: 'img-1', image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80', tag: 'EXTERIOR', display_order: 1, is_cover: true },
      { id: 'img-2', image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', tag: 'INTERIOR', display_order: 2, is_cover: false },
    ],
    features: [
      { id: 'f1', category: 'COMFORT', name: 'Panoramic Sunroof' },
      { id: 'f2', category: 'SAFETY', name: '6 Airbags' },
    ],
  },
  {
    id: 'c2',
    title: '2022 Tata Nexon Fearless Plus 1.2 Turbo Petrol',
    reg_number: 'MH-02-VC-2022',
    make: 'Tata',
    model: 'Nexon',
    variant: 'Fearless Plus S DT',
    year: 2022,
    kilometers_driven: 19800,
    fuel_type: 'PETROL',
    transmission: 'MANUAL',
    ownership: 'FIRST',
    body_type: 'SUV',
    color: 'Daytona Grey',
    city: 'Mumbai',
    price: 1120000.0,
    original_price: 1380000.0,
    estimated_market_min: 1080000.0,
    estimated_market_max: 1160000.0,
    inspection_score: 9.5,
    is_spinny_certified: true,
    warranty_months: 12,
    status: 'PUBLISHED',
    seller_name: 'Tata Certified',
    seller_email: 'seller@dealer.com',
    is_verified_seller: true,
    images: [
      { id: 'img-3', image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80', tag: 'EXTERIOR', display_order: 1, is_cover: true },
    ],
    features: [
      { id: 'f3', category: 'SAFETY', name: '5-Star GNCAP Safety Rating' },
      { id: 'f4', category: 'INFOTAINMENT', name: '10.25-inch Touchscreen' },
    ],
  },
  {
    id: 'c3',
    title: '2023 Mahindra Thar LX 4x4 Hard Top Diesel',
    reg_number: 'DL-01-TR-2023',
    make: 'Mahindra',
    model: 'Thar',
    variant: 'LX 4-Str Hard Top',
    year: 2023,
    kilometers_driven: 14200,
    fuel_type: 'DIESEL',
    transmission: 'AUTOMATIC',
    ownership: 'FIRST',
    body_type: 'SUV',
    color: 'Napoli Black',
    city: 'Delhi NCR',
    price: 1690000.0,
    original_price: 1980000.0,
    estimated_market_min: 1650000.0,
    estimated_market_max: 1740000.0,
    inspection_score: 9.6,
    is_spinny_certified: true,
    warranty_months: 12,
    status: 'PUBLISHED',
    seller_name: 'Mahindra Direct',
    seller_email: 'admin@valuecars.com',
    is_verified_seller: true,
    images: [
      { id: 'img-4', image_url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80', tag: 'EXTERIOR', display_order: 1, is_cover: true },
    ],
    features: [
      { id: 'f5', category: 'PERFORMANCE', name: '4x4 Shift-on-Fly Transfer Case' },
    ],
  },
  {
    id: 'c4',
    title: '2020 Honda City ZX 1.5 i-VTEC CVT',
    reg_number: 'KA-03-HC-2020',
    make: 'Honda',
    model: 'City',
    variant: 'ZX CVT',
    year: 2020,
    kilometers_driven: 34000,
    fuel_type: 'PETROL',
    transmission: 'AUTOMATIC',
    ownership: 'FIRST',
    body_type: 'SEDAN',
    color: 'Golden Brown',
    city: 'Bangalore',
    price: 1060000.0,
    original_price: 1520000.0,
    estimated_market_min: 1020000.0,
    estimated_market_max: 1100000.0,
    inspection_score: 9.1,
    is_spinny_certified: true,
    warranty_months: 12,
    status: 'PUBLISHED',
    seller_name: 'Honda Approved',
    seller_email: 'seller@dealer.com',
    is_verified_seller: true,
    images: [
      { id: 'img-5', image_url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80', tag: 'EXTERIOR', display_order: 1, is_cover: true },
    ],
    features: [
      { id: 'f6', category: 'COMFORT', name: 'Electric Sunroof & LaneWatch Camera' },
    ],
  },
  {
    id: 'c5',
    title: '2021 Maruti Suzuki Swift ZXi Plus Dual Tone',
    reg_number: 'KA-05-MS-2021',
    make: 'Maruti',
    model: 'Swift',
    variant: 'ZXi Plus DT',
    year: 2021,
    kilometers_driven: 21500,
    fuel_type: 'PETROL',
    transmission: 'MANUAL',
    ownership: 'FIRST',
    body_type: 'HATCHBACK',
    color: 'Solid Fire Red',
    city: 'Bangalore',
    price: 690000.0,
    original_price: 890000.0,
    estimated_market_min: 660000.0,
    estimated_market_max: 720000.0,
    inspection_score: 9.4,
    is_spinny_certified: true,
    warranty_months: 12,
    status: 'PUBLISHED',
    seller_name: 'Maruti TrueValue',
    seller_email: 'admin@valuecars.com',
    is_verified_seller: true,
    images: [
      { id: 'img-6', image_url: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80', tag: 'EXTERIOR', display_order: 1, is_cover: true },
    ],
    features: [
      { id: 'f7', category: 'CONVENIENCE', name: 'Cruise Control & SmartPlay Touch' },
    ],
  },
];

const APPROVED_SELLER_EMAILS = [
  'admin@valuecars.com',
  'seller@dealer.com',
  'superadmin@valuecars.com',
  'manojshankar@valuecars.local',
];

export const apiClient = {
  // Cars & Catalog
  async getCars(params: CarFilterOptions = {}): Promise<PaginatedCars> {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
      const res = await fetch(`${API_BASE_URL}/cars?${query.toString()}`, { cache: 'no-store' });
      if (res.ok) return res.json();
    } catch {
      // Fallback for GitHub Pages static hosting
    }

    // Filter in-memory for GitHub Pages demo
    let filtered = [...MOCK_CARS];
    if (params.make) {
      filtered = filtered.filter((c) => c.make.toLowerCase().includes(params.make!.toLowerCase()));
    }
    if (params.model) {
      filtered = filtered.filter((c) => c.model.toLowerCase().includes(params.model!.toLowerCase()) || c.make.toLowerCase().includes(params.model!.toLowerCase()));
    }
    if (params.fuel_type) {
      filtered = filtered.filter((c) => c.fuel_type === params.fuel_type);
    }
    if (params.transmission) {
      filtered = filtered.filter((c) => c.transmission === params.transmission);
    }
    if (params.body_type) {
      filtered = filtered.filter((c) => c.body_type === params.body_type);
    }
    if (params.max_price) {
      filtered = filtered.filter((c) => c.price <= params.max_price!);
    }
    if (params.min_score) {
      filtered = filtered.filter((c) => c.inspection_score >= params.min_score!);
    }

    return {
      items: filtered,
      total: filtered.length,
      page: 1,
      page_size: 12,
      total_pages: 1,
    };
  },

  async getCarById(id: string): Promise<Car> {
    try {
      const res = await fetch(`${API_BASE_URL}/cars/${id}`, { cache: 'no-store' });
      if (res.ok) return res.json();
    } catch {
      // Fallback
    }

    const found = MOCK_CARS.find((c) => c.id === id) || MOCK_CARS[0];
    return found;
  },

  async getCarInspection(carId: string): Promise<InspectionReport> {
    try {
      const res = await fetch(`${API_BASE_URL}/inspections/car/${carId}`, { cache: 'no-store' });
      if (res.ok) return res.json();
    } catch {
      // Fallback
    }

    return {
      id: 'insp-demo',
      car_id: carId,
      overall_score: 9.3,
      engine_score: 9.5,
      exterior_score: 9.2,
      interior_score: 9.4,
      transmission_score: 9.5,
      suspension_score: 9.0,
      ac_score: 9.2,
      summary_notes: 'Engine and transmission tested under dynamic load. Zero accidental structural damage.',
    };
  },

  // Valuation Engine
  async calculateValuation(data: ValuationRequest): Promise<ValuationResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/leads/valuation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) return res.json();
    } catch {
      // Fallback
    }

    const baseVal = 1000000;
    const age = Math.max(1, 2026 - data.year);
    const est = baseVal * Math.pow(0.9, age);
    return {
      estimated_min_price: est * 0.95,
      estimated_max_price: est * 1.05,
      recommended_procurement_price: est * 0.98,
      currency: 'INR',
    };
  },

  // Test Drives & Reservations
  async bookTestDrive(data: TestDriveRequest) {
    try {
      const res = await fetch(`${API_BASE_URL}/test-drives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) return res.json();
    } catch {
      // Fallback
    }
    return { id: 'td-demo', status: 'CONFIRMED', ...data };
  },

  async reserveCar(data: TokenReservationRequest) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) return res.json();
    } catch {
      // Fallback
    }
    return { id: 'ord-demo', status: 'RESERVED', ...data };
  },

  // Seller Online Addition
  async checkSellerEmail(email: string): Promise<{ email: string; is_approved: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/cars/check-seller-email?email=${encodeURIComponent(email)}`);
      if (res.ok) return res.json();
    } catch {
      // Fallback
    }
    const isApproved = APPROVED_SELLER_EMAILS.some((e) => e.toLowerCase() === email.toLowerCase());
    return { email, is_approved: isApproved };
  },

  async submitSellerCar(data: SellerCarSubmission) {
    try {
      const res = await fetch(`${API_BASE_URL}/cars/seller-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) return res.json();
    } catch {
      // Fallback
    }
    const isApproved = APPROVED_SELLER_EMAILS.some((e) => e.toLowerCase() === data.seller_email.toLowerCase());
    return {
      id: `car-${Date.now()}`,
      status: isApproved ? 'PUBLISHED' : 'PENDING_APPROVAL',
      ...data,
    };
  },

  // Admin Portal & Operations
  async getAdminMetrics(): Promise<AdminMetrics> {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/metrics`, { cache: 'no-store' });
      if (res.ok) return res.json();
    } catch {
      // Fallback
    }
    return {
      total_published_cars: 5,
      total_inventory_value_inr: 6035000.0,
      average_inspection_score: 9.3,
      pending_car_approvals: 0,
      total_leads: 3,
      new_leads: 1,
      total_test_drives: 2,
      total_orders: 1,
      total_token_revenue_inr: 10000.0,
      approved_sellers: APPROVED_SELLER_EMAILS.length,
    };
  },

  async getPendingCars(): Promise<Car[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/cars/pending-approval`, { cache: 'no-store' });
      if (res.ok) return res.json();
    } catch {
      // Fallback
    }
    return [];
  },

  async approveCar(carId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/cars/${carId}/approve`, { method: 'POST' });
      if (res.ok) return res.json();
    } catch {
      // Fallback
    }
    return { id: carId, status: 'PUBLISHED' };
  },

  async whitelistSellerEmail(email: string, approvedBy = 'Superadmin', notes = 'Verified Online') {
    try {
      const res = await fetch(`${API_BASE_URL}/cars/approve-seller-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, approved_by: approvedBy, notes }),
      });
      if (res.ok) return res.json();
    } catch {
      // Fallback
    }
    if (!APPROVED_SELLER_EMAILS.includes(email)) {
      APPROVED_SELLER_EMAILS.push(email);
    }
    return { email, approved_by: approvedBy, notes };
  },

  async getApprovedEmails() {
    try {
      const res = await fetch(`${API_BASE_URL}/cars/approved-emails`, { cache: 'no-store' });
      if (res.ok) return res.json();
    } catch {
      // Fallback
    }
    return APPROVED_SELLER_EMAILS.map((email) => ({
      email,
      approved_by: 'Superadmin',
      created_at: new Date().toISOString(),
    }));
  },
};
