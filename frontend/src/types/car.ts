export interface CarImage {
  id: string;
  image_url: string;
  tag: string;
  display_order: number;
  is_cover: boolean;
}

export interface CarFeature {
  id: string;
  category: string;
  name: string;
}

export interface Car {
  id: string;
  title: string;
  reg_number: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  kilometers_driven: number;
  fuel_type: 'PETROL' | 'DIESEL' | 'CNG' | 'ELECTRIC';
  transmission: 'MANUAL' | 'AUTOMATIC';
  ownership: 'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH_PLUS';
  body_type: 'SUV' | 'SEDAN' | 'HATCHBACK' | 'MUV' | 'LUXURY';
  color: string;
  city: string;
  price: number;
  original_price?: number;
  estimated_market_min?: number;
  estimated_market_max?: number;
  inspection_score: number;
  is_spinny_certified: boolean;
  warranty_months: number;
  status: string;
  seller_email?: string;
  seller_name?: string;
  is_verified_seller: boolean;
  images: CarImage[];
  features: CarFeature[];
}

export interface InspectionReport {
  id: string;
  car_id: string;
  overall_score: number;
  engine_score: number;
  exterior_score: number;
  interior_score: number;
  transmission_score: number;
  suspension_score: number;
  ac_score: number;
  summary_notes?: string;
}
