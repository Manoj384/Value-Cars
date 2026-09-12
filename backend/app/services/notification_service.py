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
    async def _send_email(
        cls,
        to_email: str,
        subject: str,
        html_body: str,
        template: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> NotificationRecord:
        """Internal Email dispatcher with SMTP and log/mock support."""
        clean_email = to_email.strip()
        record_status = NotificationStatus.SENT
        err_msg = None

        if not settings.NOTIFICATIONS_ENABLED:
            record = NotificationRecord(
                channel=NotificationChannel.EMAIL,
                recipient=clean_email,
                message=f"[{subject}] {html_body[:100]}...",
                template_name=template,
                status=NotificationStatus.SKIPPED,
                metadata=metadata or {},
            )
            cls._history.append(record)
            return record

        try:
            if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
                import smtplib
                from email.mime.multipart import MIMEMultipart
                from email.mime.text import MIMEText

                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
                msg["To"] = clean_email

                part = MIMEText(html_body, "html")
                msg.attach(part)

                # Send via SMTP in background executor so it doesn't block async loop
                loop = asyncio.get_event_loop()
                def _send_sync():
                    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                        server.starttls()
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                        server.sendmail(settings.SMTP_FROM_EMAIL, [clean_email], msg.as_string())
                await loop.run_in_executor(None, _send_sync)
            else:
                # Mock / Log Provider
                logger.info(f"📧 [EMAIL MOCK] To: {clean_email} | Subject: {subject} | Template: {template}")
        except Exception as e:
            record_status = NotificationStatus.FAILED
            err_msg = str(e)
            logger.error(f"Failed to send email to {clean_email}: {e}")

        record = NotificationRecord(
            channel=NotificationChannel.EMAIL,
            recipient=clean_email,
            message=f"[{subject}] {html_body[:120]}...",
            template_name=template,
            status=record_status,
            error=err_msg,
            metadata=metadata or {},
        )
        cls._history.append(record)
        return record

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
        """Notify all admin operations phones when an unapproved seller submits a car."""
        admin_phones = getattr(settings, "ADMIN_ALERT_PHONES", [settings.ADMIN_ALERT_PHONE])
        if not admin_phones:
            return []
            
        message = (
            f"🔔 [Admin Alert] New Car Pending Approval: '{car_title}' (Reg: {reg_number}) "
            f"listed by {seller_name} ({seller_email}) for ₹{price:,.0f}. Please review in Admin Dashboard."
        )
        meta = {"car_title": car_title, "seller_email": seller_email, "price": price}
        tasks = []
        for phone in admin_phones:
            if phone:
                tasks.append(cls._send_sms(phone, message, "ADMIN_PENDING_CAR_ALERT", meta))
                tasks.append(cls._send_whatsapp(phone, message, "ADMIN_PENDING_CAR_ALERT", meta))

        results = await asyncio.gather(*tasks, return_exceptions=True)
        return [r for r in results if isinstance(r, NotificationRecord)]

    @classmethod
    async def send_admin_schedule_contact_alert(
        cls,
        customer_name: str,
        customer_phone: str,
        customer_email: Optional[str],
        car_title: str,
        city: str,
        request_type: str = "Test Drive / Viewing Schedule",
        booking_date: Optional[str] = None,
        time_slot: Optional[str] = None,
        location_type: Optional[str] = None,
        address: Optional[str] = None,
    ) -> List[NotificationRecord]:
        """Notify all admin operations phones on WhatsApp & SMS with the customer's phone number prominently shown."""
        admin_phones = getattr(settings, "ADMIN_ALERT_PHONES", [settings.ADMIN_ALERT_PHONE])
        if not admin_phones:
            return []

        date_info = f"{booking_date} ({time_slot})" if booking_date and time_slot else (booking_date or "Flexible")
        loc_info = f"{city} - {address}" if address else city

        message = (
            f"🔔 [Value Cars Lead Alert] A customer wants to connect!\n"
            f"👤 Customer: {customer_name}\n"
            f"📱 Phone: {customer_phone}\n"
            f"✉️ Email: {customer_email or 'Not provided'}\n"
            f"🚗 Vehicle: {car_title}\n"
            f"📅 Slot: {date_info}\n"
            f"📍 Location: {loc_info} ({location_type or 'Viewing'})\n"
            f"👉 Action: Please call {customer_phone} to confirm the viewing."
        )

        meta = {
            "customer_name": customer_name,
            "customer_phone": customer_phone,
            "car_title": car_title,
            "request_type": request_type,
        }

        tasks = []
        for phone in admin_phones:
            if phone:
                tasks.append(cls._send_sms(phone, message, "ADMIN_CUSTOMER_SCHEDULE_ALERT", meta))
                tasks.append(cls._send_whatsapp(phone, message, "ADMIN_CUSTOMER_SCHEDULE_ALERT", meta))

        results = await asyncio.gather(*tasks, return_exceptions=True)
        return [r for r in results if isinstance(r, NotificationRecord)]

    @classmethod
    async def send_admin_user_verification_alert(
        cls,
        user_email: str,
        full_name: str,
        approve_url: str,
        reject_url: str,
        requested_at: Optional[datetime] = None,
    ) -> NotificationRecord:
        """Send admin notification with secure 1-click Approve and Reject links."""
        admin_email = getattr(settings, "ADMIN_ALERT_EMAIL", "shankarmanoj654@gmail.com")
        req_time = (requested_at or datetime.now(timezone.utc)).strftime("%d %B %Y, %I:%M %p UTC")
        
        subject = f"🔔 New User Email Verification Request: {user_email}"
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 28px; border-radius: 16px; border: 1px solid #334155;">
            <h2 style="color: #f43f5e; margin-top: 0;">🚗 Value Cars — Verification Request</h2>
            <p style="color: #cbd5e1; font-size: 15px;">A new customer has requested account approval to access Value Cars features.</p>
            
            <div style="background: #1e293b; padding: 18px; border-radius: 12px; margin: 20px 0; border: 1px solid #475569;">
                <p style="margin: 6px 0;"><strong>Name:</strong> {full_name}</p>
                <p style="margin: 6px 0;"><strong>Email:</strong> <span style="color: #38bdf8;">{user_email}</span></p>
                <p style="margin: 6px 0;"><strong>Requested At:</strong> {req_time}</p>
            </div>

            <div style="margin: 28px 0; display: flex; gap: 14px;">
                <a href="{approve_url}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-right: 12px;">✓ APPROVE USER</a>
                <a href="{reject_url}" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">✗ REJECT USER</a>
            </div>

            <p style="font-size: 12px; color: #64748b; margin-top: 24px;">This is a secure, single-use, time-limited administrative link.</p>
        </div>
        """
        meta = {"user_email": user_email, "full_name": full_name}
        return await cls._send_email(admin_email, subject, html_body, "ADMIN_USER_VERIFICATION_REQUEST", meta)

    @classmethod
    async def send_user_account_approved_alert(
        cls,
        user_email: str,
        create_password_url: str,
        expires_in_hours: int = 48,
    ) -> NotificationRecord:
        """Send approved user an email with secure, expiring Create Password link."""
        subject = "🎉 Your Value Cars Account Has Been Approved!"
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 28px; border-radius: 16px; border: 1px solid #334155;">
            <h2 style="color: #10b981; margin-top: 0;">🚗 Welcome to Value Cars!</h2>
            <p style="color: #cbd5e1; font-size: 15px;">Great news! Your account verification request has been approved by our team.</p>
            <p style="color: #cbd5e1; font-size: 15px;">You can now set up your secure password to save favorite cars, submit enquiries, and book inspections.</p>
            
            <div style="margin: 28px 0;">
                <a href="{create_password_url}" style="background: #e11d48; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block;">Create My Password</a>
            </div>

            <p style="font-size: 13px; color: #94a3b8;">Or copy this link to your browser:<br><span style="color: #38bdf8; word-break: break-all;">{create_password_url}</span></p>
            <p style="font-size: 12px; color: #64748b; margin-top: 24px;">Note: This single-use link expires in {expires_in_hours} hours. If you did not request this, please ignore this email.</p>
        </div>
        """
        meta = {"user_email": user_email}
        return await cls._send_email(user_email, subject, html_body, "USER_ACCOUNT_APPROVED", meta)

    @classmethod
    async def send_user_password_reset_alert(
        cls,
        user_email: str,
        reset_password_url: str,
        expires_in_hours: int = 2,
    ) -> NotificationRecord:
        """Send password reset email with single-use secure link."""
        subject = "🔒 Reset Your Value Cars Password"
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 28px; border-radius: 16px; border: 1px solid #334155;">
            <h2 style="color: #f43f5e; margin-top: 0;">🔒 Value Cars — Password Reset</h2>
            <p style="color: #cbd5e1; font-size: 15px;">We received a request to reset the password for your account.</p>
            
            <div style="margin: 28px 0;">
                <a href="{reset_password_url}" style="background: #e11d48; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block;">Reset Password</a>
            </div>

            <p style="font-size: 13px; color: #94a3b8;">Or copy this link to your browser:<br><span style="color: #38bdf8; word-break: break-all;">{reset_password_url}</span></p>
            <p style="font-size: 12px; color: #64748b; margin-top: 24px;">Note: This link expires in {expires_in_hours} hours and can only be used once.</p>
        </div>
        """
        meta = {"user_email": user_email}
        return await cls._send_email(user_email, subject, html_body, "USER_PASSWORD_RESET", meta)


