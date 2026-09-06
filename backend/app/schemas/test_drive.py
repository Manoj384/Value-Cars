import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.test_drive import TestDriveLocation, TestDriveStatus


class TestDriveBase(BaseModel):
    __test__ = False

    car_id: uuid.UUID
    customer_name: str = Field(..., min_length=2, max_length=120)
    customer_phone: str = Field(..., min_length=10, max_length=20)
    customer_email: Optional[str] = None
    booking_date: date
    booking_time_slot: str = "10:00 AM - 12:00 PM"
    location_type: TestDriveLocation = TestDriveLocation.HUB_VISIT
    delivery_address: Optional[str] = None
    hub_name: Optional[str] = "Value Cars Mega Hub, Bangalore"
    notes: Optional[str] = None


class TestDriveCreate(TestDriveBase):
    __test__ = False


class TestDriveUpdate(BaseModel):
    __test__ = False

    status: Optional[TestDriveStatus] = None
    notes: Optional[str] = None
    booking_date: Optional[date] = None
    booking_time_slot: Optional[str] = None


class TestDriveResponse(TestDriveBase):
    __test__ = False
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    status: TestDriveStatus
    created_at: datetime
    updated_at: datetime
