import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.user import UserRole


class UserBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    phone_number: str = Field(..., min_length=10, max_length=15)
    email: Optional[str] = None
    city: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER


class UserCreate(UserBase):
    password: Optional[str] = Field(None, min_length=4)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    is_active: bool
    is_verified: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None


class OTPRequest(BaseModel):
    phone_number: str = Field(..., min_length=10, max_length=15)


class OTPVerify(BaseModel):
    phone_number: str = Field(..., min_length=10, max_length=15)
    otp: str = Field(..., min_length=4, max_length=6)
    full_name: Optional[str] = "Customer"
