import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.inspection import CheckpointCondition, InspectionStatus


class InspectionItemBase(BaseModel):
    category: str
    checkpoint_name: str
    condition: CheckpointCondition = CheckpointCondition.GOOD
    notes: Optional[str] = None
    image_url: Optional[str] = None


class InspectionItemCreate(InspectionItemBase):
    pass


class InspectionItemResponse(InspectionItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    inspection_id: uuid.UUID


class InspectionBase(BaseModel):
    car_id: uuid.UUID
    inspector_id: Optional[uuid.UUID] = None
    overall_score: float = Field(default=0.0, ge=0.0, le=10.0)
    status: InspectionStatus = InspectionStatus.SCHEDULED
    engine_score: float = Field(default=0.0, ge=0.0, le=10.0)
    exterior_score: float = Field(default=0.0, ge=0.0, le=10.0)
    interior_score: float = Field(default=0.0, ge=0.0, le=10.0)
    transmission_score: float = Field(default=0.0, ge=0.0, le=10.0)
    suspension_score: float = Field(default=0.0, ge=0.0, le=10.0)
    electrical_score: float = Field(default=0.0, ge=0.0, le=10.0)
    tyre_score: float = Field(default=0.0, ge=0.0, le=10.0)
    ac_score: float = Field(default=0.0, ge=0.0, le=10.0)
    summary_notes: Optional[str] = None
    report_pdf_url: Optional[str] = None


class InspectionCreate(InspectionBase):
    items: Optional[List[InspectionItemCreate]] = []


class InspectionResponse(InspectionBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    items: List[InspectionItemResponse] = []
