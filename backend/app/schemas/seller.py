from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserResponse


class SellerRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: str = Field(..., max_length=255)
    phone_number: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=4)


class SellerLogin(BaseModel):
    email: str
    password: str = Field(..., min_length=4)


class SellerCarUpdate(BaseModel):
    price: Optional[float] = None
    description: Optional[str] = None
    status: Optional[str] = None


class SellerResponse(UserResponse):
    """Authenticated seller profile, extending the base user with approval state."""

    model_config = ConfigDict(from_attributes=True)

    is_approved_seller: bool = False


class SellerToken(BaseModel):
    """Login response carrying the full seller profile (incl. approval state)."""

    access_token: str
    token_type: str = "bearer"
    user: SellerResponse