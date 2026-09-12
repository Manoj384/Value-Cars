import uuid
from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.user import UserRole


class UserBase(BaseModel):
    full_name: str = Field(default="Customer", min_length=1, max_length=120)
    phone_number: Optional[str] = Field(None, max_length=20)
    email: EmailStr
    city: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER


class UserCreate(UserBase):
    password: Optional[str] = Field(None, min_length=6)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    city: Optional[str] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    phone_number: Optional[str] = None
    city: Optional[str] = None
    role: UserRole
    account_status: str
    is_active: bool
    is_verified: bool
    password_created: bool
    is_approved_seller: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None


# --- Workflow Schemas ---

class CheckEmailRequest(BaseModel):
    email: EmailStr


class CheckEmailResponse(BaseModel):
    status: str  # ACTIVE, APPROVED_PENDING_PASSWORD, PENDING, NEW, DISABLED, REJECTED
    message: str
    email: str


class RequestVerificationRequest(BaseModel):
    email: EmailStr
    full_name: Optional[str] = "Valued Customer"
    phone_number: Optional[str] = None
    city: Optional[str] = "Bangalore"
    notes: Optional[str] = None


class CreatePasswordRequest(BaseModel):
    token: str = Field(..., min_length=10)
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)


class VerificationRequestItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    phone_number: Optional[str] = None
    city: Optional[str] = None
    account_status: str
    role: UserRole
    is_active: bool
    is_verified: bool
    password_created: bool
    verification_requested_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    created_at: datetime


class AdminUserActionRequest(BaseModel):
    user_id: Optional[uuid.UUID] = None
    email: Optional[EmailStr] = None
    action: str = Field(..., description="APPROVE, REJECT, DISABLE, REACTIVATE")


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    action: str
    actor_email: Optional[str] = None
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime


class FavoriteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    car_id: uuid.UUID
    created_at: datetime


# Legacy OTP schemas retained for compatibility
class OTPRequest(BaseModel):
    phone_number: str = Field(..., min_length=10, max_length=15)


class OTPVerify(BaseModel):
    phone_number: str = Field(..., min_length=10, max_length=15)
    otp: str = Field(..., min_length=4, max_length=6)
    full_name: Optional[str] = "Customer"

