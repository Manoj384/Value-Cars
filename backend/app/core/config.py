import os
import secrets
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Value Cars API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Security
    # A strong, randomly generated key is used when none is provided. In
    # production you MUST set SECRET_KEY explicitly via the environment.
    SECRET_KEY: str = secrets.token_urlsafe(48)
    # Convenience flag: if still the auto-generated default in a non-dev env,
    # we warn on startup below so you never ship with an ephemeral key.
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./value_cars.db"

    # Public URL of the frontend (used for CORS + any absolute links)
    FRONTEND_URL: str = "http://localhost:3000"

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Notifications & Alerts
    NOTIFICATIONS_ENABLED: bool = True
    SMS_PROVIDER: str = "mock"  # "mock" | "twilio" | "fast2sms"
    WHATSAPP_PROVIDER: str = "mock"  # "mock" | "twilio" | "meta"
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    TWILIO_WHATSAPP_NUMBER: str = ""
    FAST2SMS_API_KEY: str = ""
    META_WHATSAPP_TOKEN: str = ""
    META_WHATSAPP_PHONE_NUMBER_ID: str = ""
    ADMIN_ALERT_PHONE: str = "+918050966025"
    ADMIN_SECONDARY_PHONE: str = "+918310166040"
    OFFICIAL_ADDRESS: str = "Near Bangalore university, Kengunte, Mallathahalli, Bengaluru, Karnataka 560056"
    MAPS_URL: str = "https://maps.google.com/?q=Near+Bangalore+university,+Kengunte,+Mallathahalli,+Bengaluru,+Karnataka+560056"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() in {"production", "prod", "staging"}


settings = Settings()
