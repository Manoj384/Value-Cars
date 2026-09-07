import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class NotificationChannel(str, Enum):
    SMS = "SMS"
    WHATSAPP = "WHATSAPP"
    EMAIL = "EMAIL"


class NotificationStatus(str, Enum):
    SENT = "SENT"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


@dataclass
class NotificationRecord:
    channel: NotificationChannel
    recipient: str
    message: str
    template_name: str
    status: NotificationStatus
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class NotificationService:
    """Automated SMS and WhatsApp Notification Service for Value Cars.

    Supports mock/log providers, Twilio, Fast2SMS, and Meta WhatsApp Cloud API.
    Maintains an in-memory dispatch log for testing and auditing.
    """

    _history: List[NotificationRecord] = []

    @classmethod
    def get_history(cls) -> List[NotificationRecord]:
        """Return a copy of dispatched notifications."""
        return list(cls._history)

    @classmethod
    def clear_history(cls) -> None:
        """Clear the in-memory notification history."""
        cls._history.clear()

    @classmethod
    async def _send_sms(cls, phone: str, message: str, template: str, metadata: Optional[Dict[str, Any]] = None) -> NotificationRecord:
        """Internal SMS dispatcher with provider support."""
        if not settings.NOTIFICATIONS_ENABLED:
            record = NotificationRecord(
                channel=NotificationChannel.SMS,
                recipient=phone,
                message=message,
                template_name=template,
                status=NotificationStatus.SKIPPED,
                metadata=metadata or {},
            )
            cls._history.append(record)
            return record

        # Normalize phone
        clean_phone = phone.strip()
        provider = settings.SMS_PROVIDER.lower()
        record_status = NotificationStatus.SENT
        err_msg = None

        try:
            if provider == "twilio" and settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
                url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
                auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                data = {
                    "From": settings.TWILIO_PHONE_NUMBER,
                    "To": clean_phone if clean_phone.startswith("+") else f"+91{clean_phone}",
                    "Body": message,
                }
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.post(url, auth=auth, data=data)
                    if resp.status_code >= 400:
                        record_status = NotificationStatus.FAILED
                        err_msg = f"Twilio SMS Error {resp.status_code}: {resp.text}"
            elif provider == "fast2sms" and settings.FAST2SMS_API_KEY:
                url = "https://www.fast2sms.com/dev/bulkV2"
                headers = {"authorization": settings.FAST2SMS_API_KEY}
                payload = {
                    "route": "v3",
                    "sender_id": "VALCAR",
                    "message": message,
                    "language": "english",
                    "flash": 0,
                    "numbers": clean_phone.replace("+91", "").replace("+", ""),
                }
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code >= 400:
                        record_status = NotificationStatus.FAILED
                        err_msg = f"Fast2SMS Error {resp.status_code}: {resp.text}"
            else:
                # Mock / Log Provider
                logger.info(f"📱 [SMS MOCK] To: {clean_phone} | Template: {template} | Body: {message}")
        except Exception as e:
            record_status = NotificationStatus.FAILED
            err_msg = str(e)
            logger.error(f"Failed to send SMS to {clean_phone}: {e}")

        record = NotificationRecord(
            channel=NotificationChannel.SMS,
            recipient=clean_phone,
            message=message,
            template_name=template,
            status=record_status,
            error=err_msg,
            metadata=metadata or {},
        )
        cls._history.append(record)
        return record

    @classmethod
    async def _send_whatsapp(cls, phone: str, message: str, template: str, metadata: Optional[Dict[str, Any]] = None) -> NotificationRecord:
        """Internal WhatsApp dispatcher with provider support."""
        if not settings.NOTIFICATIONS_ENABLED:
            record = NotificationRecord(
                channel=NotificationChannel.WHATSAPP,
                recipient=phone,
                message=message,
                template_name=template,
                status=NotificationStatus.SKIPPED,
                metadata=metadata or {},
            )
            cls._history.append(record)
            return record

        clean_phone = phone.strip()
        provider = settings.WHATSAPP_PROVIDER.lower()
        record_status = NotificationStatus.SENT
        err_msg = None

        try:
            if provider == "twilio" and settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
                url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
                auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                formatted_to = clean_phone if clean_phone.startswith("+") else f"+91{clean_phone}"
                data = {
                    "From": f"whatsapp:{settings.TWILIO_WHATSAPP_NUMBER}",
                    "To": f"whatsapp:{formatted_to}",
                    "Body": message,
                }
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.post(url, auth=auth, data=data)
                    if resp.status_code >= 400:
                        record_status = NotificationStatus.FAILED
                        err_msg = f"Twilio WhatsApp Error {resp.status_code}: {resp.text}"
            elif provider == "meta" and settings.META_WHATSAPP_TOKEN and settings.META_WHATSAPP_PHONE_NUMBER_ID:
                url = f"https://graph.facebook.com/v19.0/{settings.META_WHATSAPP_PHONE_NUMBER_ID}/messages"
                headers = {
                    "Authorization": f"Bearer {settings.META_WHATSAPP_TOKEN}",
                    "Content-Type": "application/json",
                }
                to_number = clean_phone.replace("+", "")
                payload = {
                    "messaging_product": "whatsapp",
                    "to": to_number,
                    "type": "text",
                    "text": {"preview_url": False, "body": message},
                }
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code >= 400:
                        record_status = NotificationStatus.FAILED
                        err_msg = f"Meta WhatsApp Error {resp.status_code}: {resp.text}"
            else:
                # Mock / Log Provider
                logger.info(f"💬 [WHATSAPP MOCK] To: {clean_phone} | Template: {template} | Body: {message}")
        except Exception as e:
            record_status = NotificationStatus.FAILED
            err_msg = str(e)
            logger.error(f"Failed to send WhatsApp to {clean_phone}: {e}")

        record = NotificationRecord(
            channel=NotificationChannel.WHATSAPP,
            recipient=clean_phone,
            message=message,
            template_name=template,
            status=record_status,
            error=err_msg,
            metadata=metadata or {},
        )
        cls._history.append(record)
        return record

    # ==========================================
    # High-level Notification Workflows
    # ==========================================

    @classmethod
    async def send_test_drive_booked_alert(
        cls,
        customer_name: str,
        customer_phone: str,
        car_title: str,
        booking_date: str,
        time_slot: str,
        location_type: str,
        address: Optional[str] = None,
        hub_city: Optional[str] = None,
    ) -> List[NotificationRecord]:
        """Trigger customer SMS and WhatsApp notification upon booking a test drive."""
        loc_desc = address if location_type == "HOME_DELIVERY" and address else (f"{hub_city or 'Value Cars'} Hub")
        message = (
            f"🚗 Value Cars: Hi {customer_name}! Your test drive for '{car_title}' is confirmed for "
            f"{booking_date} ({time_slot}) at {loc_desc}. Our car specialist will assist you. "
            f"Need changes? Call 1800-VAL-CARS."
        )
        meta = {"car_title": car_title, "booking_date": str(booking_date), "time_slot": time_slot}
        
        # Dispatch SMS and WhatsApp concurrently
        results = await asyncio.gather(
            cls._send_sms(customer_phone, message, "TEST_DRIVE_BOOKED", meta),
            cls._send_whatsapp(customer_phone, message, "TEST_DRIVE_BOOKED", meta),
            return_exceptions=True,
        )
        return [r for r in results if isinstance(r, NotificationRecord)]

    @classmethod
    async def send_test_drive_status_update(
        cls,
        customer_name: str,
        customer_phone: str,
        car_title: str,
        new_status: str,
    ) -> List[NotificationRecord]:
        """Notify customer when test drive booking status changes (CONFIRMED, COMPLETED, CANCELLED)."""
        status_clean = new_status.replace("_", " ").title()
        message = (
            f"🚗 Value Cars: Hello {customer_name}, your test drive for '{car_title}' "
            f"status is now {status_clean}. Thank you for choosing Value Cars!"
        )
        meta = {"car_title": car_title, "status": new_status}
        results = await asyncio.gather(
            cls._send_sms(customer_phone, message, "TEST_DRIVE_STATUS_UPDATE", meta),
            cls._send_whatsapp(customer_phone, message, "TEST_DRIVE_STATUS_UPDATE", meta),
            return_exceptions=True,
        )
        return [r for r in results if isinstance(r, NotificationRecord)]

    @classmethod
    async def send_car_reserved_alert(
        cls,
        customer_name: str,
        customer_phone: str,
        order_number: str,
        car_title: str,
        token_amount: float,
        balance_amount: float,
    ) -> List[NotificationRecord]:
        """Notify customer when car reservation deposit is successfully received."""
        message = (
            f"🎉 Value Cars: Congratulations {customer_name}! Your booking #{order_number} for '{car_title}' "
            f"is confirmed. Token received: ₹{token_amount:,.0f}. Remaining balance: ₹{balance_amount:,.0f}. "
            f"Our relationship manager will contact you for delivery coordination."
        )
        meta = {
            "order_number": order_number,
            "car_title": car_title,
            "token_amount": token_amount,
            "balance_amount": balance_amount,
        }
        results = await asyncio.gather(
            cls._send_sms(customer_phone, message, "CAR_RESERVED", meta),
            cls._send_whatsapp(customer_phone, message, "CAR_RESERVED", meta),
            return_exceptions=True,
        )
        return [r for r in results if isinstance(r, NotificationRecord)]

    @classmethod
    async def send_seller_car_submitted_alert(
        cls,
        seller_name: str,
        seller_phone: str,
        seller_email: str,
        car_title: str,
        reg_number: str,
        is_published: bool,
    ) -> List[NotificationRecord]:
        """Notify seller when they submit a new car listing."""
        if not seller_phone:
            return []
        
        status_text = (
            "Your listing is LIVE on Value Cars catalog!"
            if is_published
            else "Our team is reviewing your listing and will approve it shortly."
        )
        message = (
            f"🚗 Value Cars: Hello {seller_name}, your listing for '{car_title}' (Reg: {reg_number}) "
            f"has been received. {status_text}"
        )
        meta = {"car_title": car_title, "reg_number": reg_number, "is_published": is_published}
        results = await asyncio.gather(
            cls._send_sms(seller_phone, message, "SELLER_CAR_SUBMITTED", meta),
            cls._send_whatsapp(seller_phone, message, "SELLER_CAR_SUBMITTED", meta),
            return_exceptions=True,
        )
        return [r for r in results if isinstance(r, NotificationRecord)]

    @classmethod
    async def send_seller_car_approved_alert(
        cls,
        seller_name: str,
        seller_phone: str,
        seller_email: str,
        car_title: str,
        reg_number: str,
    ) -> List[NotificationRecord]:
        """Notify seller when admin approves their pending vehicle listing."""
        if not seller_phone:
            return []
            
        message = (
            f"✅ Value Cars: Great news {seller_name}! Your car '{car_title}' (Reg: {reg_number}) "
            f"has been APPROVED by our operations team and is now actively visible to thousands of buyers."
        )
        meta = {"car_title": car_title, "reg_number": reg_number}
        results = await asyncio.gather(
            cls._send_sms(seller_phone, message, "SELLER_CAR_APPROVED", meta),
            cls._send_whatsapp(seller_phone, message, "SELLER_CAR_APPROVED", meta),
            return_exceptions=True,
        )
        return [r for r in results if isinstance(r, NotificationRecord)]

    @classmethod
    async def send_admin_new_car_alert(
        cls,
        car_title: str,
        seller_name: str,
        seller_email: str,
        reg_number: str,
        price: float,
    ) -> List[NotificationRecord]:
        """Notify admin operations team when an unapproved seller submits a car."""
        admin_phone = settings.ADMIN_ALERT_PHONE
        if not admin_phone:
            return []
            
        message = (
            f"🔔 [Admin Alert] New Car Pending Approval: '{car_title}' (Reg: {reg_number}) "
            f"listed by {seller_name} ({seller_email}) for ₹{price:,.0f}. Please review in Admin Dashboard."
        )
        meta = {"car_title": car_title, "seller_email": seller_email, "price": price}
        results = await asyncio.gather(
            cls._send_sms(admin_phone, message, "ADMIN_PENDING_CAR_ALERT", meta),
            cls._send_whatsapp(admin_phone, message, "ADMIN_PENDING_CAR_ALERT", meta),
            return_exceptions=True,
        )
        return [r for r in results if isinstance(r, NotificationRecord)]
