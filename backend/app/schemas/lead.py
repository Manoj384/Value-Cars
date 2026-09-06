import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.lead import LeadStatus, LeadType


class LeadBase(BaseModel):
    lead_type: LeadType = LeadType.SELL_CAR
    name: str = Field(..., min_length=2, max_length=120)
    phone: str = Field(..., min_length=10, max_length=20)
    email: Optional[str] = None
    city: str = Field(..., max_length=80)
    car_id: Optional[uuid.UUID] = None
    reg_number: Optional[str] = None
    car_details: Optional[str] = None
    expected_price: Optional[float] = None
    estimated_valuation: Optional[float] = None
    notes: Optional[str] = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    status: Optional[LeadStatus] = None
    notes: Optional[str] = None
    assigned_sales_rep: Optional[str] = None
    estimated_valuation: Optional[float] = None


class LeadResponse(LeadBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: LeadStatus
    assigned_sales_rep: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class SellCarValuationRequest(BaseModel):
    make: str
    model: str
    year: int
    fuel_type: str
    transmission: str
    kilometers_driven: int
    ownership: str = "FIRST"
    city: str = "Bangalore"


class SellCarValuationResponse(BaseModel):
    estimated_min_price: float
    estimated_max_price: float
    recommended_procurement_price: float
    currency: str = "INR"
