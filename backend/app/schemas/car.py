import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.car import BodyType, CarStatus, FuelType, OwnershipType, TransmissionType


class CarImageBase(BaseModel):
    image_url: str
    tag: str = "EXTERIOR"
    display_order: int = 0
    is_cover: bool = False


class CarImageCreate(CarImageBase):
    pass


class CarImageResponse(CarImageBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    car_id: uuid.UUID


class CarFeatureBase(BaseModel):
    category: str
    name: str


class CarFeatureCreate(CarFeatureBase):
    pass


class CarFeatureResponse(CarFeatureBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    car_id: uuid.UUID


class CarBase(BaseModel):
    title: str = Field(..., max_length=200)
    reg_number: str = Field(..., max_length=30)
    make: str = Field(..., max_length=50)
    model: str = Field(..., max_length=50)
    variant: str = Field(..., max_length=100)
    year: int = Field(..., ge=1990, le=2030)
    kilometers_driven: int = Field(..., ge=0)
    fuel_type: FuelType
    transmission: TransmissionType
    ownership: OwnershipType
    body_type: BodyType
    color: str
    city: str
    hub_location: Optional[str] = None
    price: float = Field(..., gt=0)
    original_price: Optional[float] = None
    estimated_market_min: Optional[float] = None
    estimated_market_max: Optional[float] = None
    inspection_score: float = Field(default=0.0, ge=0.0, le=10.0)
    is_spinny_certified: bool = True
    warranty_months: int = 12
    status: CarStatus = CarStatus.PUBLISHED
    description: Optional[str] = None

    # Sale & Lifecycle Tracking
    sold_at: Optional[datetime] = None
    auto_delete_at: Optional[datetime] = None
    dont_delete: bool = False

    # Seller & Approval Tracking
    seller_email: Optional[str] = None
    seller_phone: Optional[str] = None
    seller_name: Optional[str] = None
    is_verified_seller: bool = False


class CarCreate(CarBase):
    images: Optional[List[CarImageCreate]] = []
    features: Optional[List[CarFeatureCreate]] = []


class CarUpdate(BaseModel):
    title: Optional[str] = None
    price: Optional[float] = None
    kilometers_driven: Optional[int] = None
    inspection_score: Optional[float] = None
    status: Optional[CarStatus] = None
    description: Optional[str] = None
    hub_location: Optional[str] = None
    is_verified_seller: Optional[bool] = None
    sold_at: Optional[datetime] = None
    auto_delete_at: Optional[datetime] = None
    dont_delete: Optional[bool] = None


class CarModifyRequest(BaseModel):
    manager_email: Optional[str] = None
    title: Optional[str] = None
    price: Optional[float] = None
    kilometers_driven: Optional[int] = None
    year: Optional[int] = None
    fuel_type: Optional[FuelType] = None
    transmission: Optional[TransmissionType] = None
    body_type: Optional[BodyType] = None
    color: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CarStatus] = None
    inspection_score: Optional[float] = None


class MarkCarSoldRequest(BaseModel):
    manager_email: Optional[str] = None
    auto_delete_after_days: Optional[int] = 2
    dont_delete: bool = False
    notes: Optional[str] = None


class CarDeleteRequest(BaseModel):
    manager_email: Optional[str] = None


class CarResponse(CarBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    images: List[CarImageResponse] = []
    features: List[CarFeatureResponse] = []


class CarListResponse(BaseModel):
    items: List[CarResponse]
    total: int
    page: int
    page_size: int
    pages: int


class CarFilterParams(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    city: Optional[str] = None
    fuel_type: Optional[FuelType] = None
    transmission: Optional[TransmissionType] = None
    body_type: Optional[BodyType] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_year: Optional[int] = None
    max_year: Optional[int] = None
    max_km: Optional[int] = None
    min_score: Optional[float] = None
    status: Optional[CarStatus] = None
    seller_email: Optional[str] = None
    sort_by: Optional[str] = "created_at"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=12, ge=1, le=100)


class SellerCarSubmitRequest(BaseModel):
    seller_email: str
    seller_name: str
    seller_phone: str
    title: str
    reg_number: str
    make: str
    model: str
    variant: str
    year: int
    kilometers_driven: int
    fuel_type: FuelType
    transmission: TransmissionType
    ownership: OwnershipType
    body_type: BodyType
    color: str
    city: str
    price: float
    description: Optional[str] = None
    image_urls: Optional[List[str]] = []
    features: Optional[List[str]] = []


class ApproveEmailRequest(BaseModel):
    email: str
    notes: Optional[str] = "Approved verified seller"


class ApprovedEmailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    approved_by: str
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
