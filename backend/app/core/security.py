import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

# Use bcrypt via passlib for secure, salted password hashing.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Legacy salt used only to verify hashes created before bcrypt was introduced.
_LEGACY_SALT = "vc_salt_2026"


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt (bcrypt scheme)."""
    if not password:
        password = "guest"
    return pwd_context.hash(password)


def _legacy_hash(password: str) -> str:
    """Compute the old SHA-256 based hash for verifying pre-existing users."""
    if not password:
        password = "guest"
    return hashlib.sha256(f"{_LEGACY_SALT}_{password}".encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against either a bcrypt hash or a legacy SHA-256 hash."""
    if not plain_password or not hashed_password:
        return False
    # Detect legacy SHA-256 hashes (64 lowercase hex chars, not a bcrypt hash).
    is_legacy = (
        len(hashed_password) == 64
        and all(c in "0123456789abcdef" for c in hashed_password)
    )
    if is_legacy:
        return hashlib.sha256(
            f"{_LEGACY_SALT}_{plain_password}".encode("utf-8")
        ).hexdigest() == hashed_password
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


def create_access_token(
    subject: Union[str, Any],
    role: str = "CUSTOMER",
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Generate a signed JWT access token (optional)."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
    }
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except Exception:
        return None
