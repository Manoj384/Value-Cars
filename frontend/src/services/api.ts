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

export const apiClient = {
  // Cars & Catalog
  async getCars(params: CarFilterOptions = {}): Promise<PaginatedCars> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const res = await fetch(`${API_BASE_URL}/cars?${query.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch cars');
    return res.json();
  },

  async getCarById(id: string): Promise<Car> {
    const res = await fetch(`${API_BASE_URL}/cars/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Car not found');
    return res.json();
  },

  async getCarInspection(carId: string): Promise<InspectionReport> {
    const res = await fetch(`${API_BASE_URL}/inspections/car/${carId}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Inspection report not found');
    return res.json();
  },

  // Valuation Engine
  async calculateValuation(data: ValuationRequest): Promise<ValuationResponse> {
    const res = await fetch(`${API_BASE_URL}/leads/valuation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to compute valuation');
    return res.json();
  },

  // Test Drives & Reservations
  async bookTestDrive(data: TestDriveRequest) {
    const res = await fetch(`${API_BASE_URL}/test-drives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to book test drive');
    return res.json();
  },

  async reserveCar(data: TokenReservationRequest) {
    const res = await fetch(`${API_BASE_URL}/orders/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to reserve car');
    return res.json();
  },

  // Seller Online Addition
  async checkSellerEmail(email: string): Promise<{ email: string; is_approved: boolean }> {
    const res = await fetch(`${API_BASE_URL}/cars/check-seller-email?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error('Failed to check email status');
    return res.json();
  },

  async submitSellerCar(data: SellerCarSubmission) {
    const res = await fetch(`${API_BASE_URL}/cars/seller-submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit car');
    return res.json();
  },

  // Admin Portal & Operations
  async getAdminMetrics(): Promise<AdminMetrics> {
    const res = await fetch(`${API_BASE_URL}/admin/metrics`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch admin metrics');
    return res.json();
  },

  async getPendingCars(): Promise<Car[]> {
    const res = await fetch(`${API_BASE_URL}/cars/pending-approval`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch pending cars');
    return res.json();
  },

  async approveCar(carId: string) {
    const res = await fetch(`${API_BASE_URL}/cars/${carId}/approve`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to approve car');
    return res.json();
  },

  async whitelistSellerEmail(email: string, approvedBy = 'Superadmin', notes = 'Verified Online') {
    const res = await fetch(`${API_BASE_URL}/cars/approve-seller-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, approved_by: approvedBy, notes }),
    });
    if (!res.ok) throw new Error('Failed to whitelist email');
    return res.json();
  },

  async getApprovedEmails() {
    const res = await fetch(`${API_BASE_URL}/cars/approved-emails`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch approved emails');
    return res.json();
  },
};
