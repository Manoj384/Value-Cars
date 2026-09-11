import uuid
from typing import Optional
from sqlalchemy import String, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class UploadedMedia(Base):
    __tablename__ = "uploaded_media"

    filename: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    brand: Mapped[str] = mapped_column(String(50), default="general", index=True, nullable=False)
    content_type: Mapped[str] = mapped_column(String(80), default="image/webp", nullable=False)
    media_type: Mapped[str] = mapped_column(String(20), default="IMAGE", nullable=False)  # IMAGE | VIDEO
    data_base64: Mapped[str] = mapped_column(Text, nullable=False)
    size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
