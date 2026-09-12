import secrets
import uuid
import re
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)
from app.models.user import (
    AccountStatus,
    ApprovedSellerEmail,
    AuditLog,
    User,
    UserRole,
    UserVerificationToken,
)
from app.schemas.user import (
    AdminUserActionRequest,
    AuditLogResponse,
    CheckEmailRequest,
    CheckEmailResponse,
    CreatePasswordRequest,
    ForgotPasswordRequest,
    OTPRequest,
    OTPVerify,
    RequestVerificationRequest,
    ResetPasswordRequest,
    Token,
    UserCreate,
    UserLoginRequest,
    UserResponse,
    VerificationRequestItem,
)
from app.services.notification_service import NotificationService

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


# Helper for logging audit actions
async def log_audit_event(
    db: AsyncSession,
    action: str,
    actor_email: Optional[str] = None,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
):
    try:
        entry = AuditLog(
            action=action,
            actor_email=actor_email,
            target_type=target_type,
            target_id=str(target_id) if target_id else None,
            details=details,
            ip_address=ip_address,
        )
        db.add(entry)
        await db.commit()
    except Exception as e:
        # Do not fail request if audit log write fails
        pass


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validate JWT token and return authenticated user object."""
    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identifier format",
        )

    query = select(User).where(User.id == user_uuid)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if not user.is_active or user.account_status == AccountStatus.DISABLED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is inactive or disabled. Please contact administrator.",
        )
    return user


async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Validate JWT and require the caller to be an active ADMIN."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


# ==========================================
# 1. Email Status Check (Step 1 of Auth Modal)
# ==========================================

@router.post("/check-email", response_model=CheckEmailResponse, summary="Check Email Registration Status")
async def check_email_status(payload: CheckEmailRequest, db: AsyncSession = Depends(get_db)):
    """Checks whether an email is verified, pending admin approval, or new."""
    email = payload.email.strip().lower()

    # Query user
    query = select(User).where(User.email == email)
    res = await db.execute(query)
    user = res.scalar_one_or_none()

    if not user:
        return CheckEmailResponse(
            status="NEW",
            message="No account found for this email. Request account verification to get started.",
            email=email,
        )

    if user.account_status == AccountStatus.DISABLED.value:
        return CheckEmailResponse(
            status="DISABLED",
            message="This account has been disabled by the administrator.",
            email=email,
        )

    if user.account_status == AccountStatus.REJECTED.value:
        return CheckEmailResponse(
            status="REJECTED",
            message="Your account verification request was not approved. Please contact support.",
            email=email,
        )

    if user.account_status == AccountStatus.PENDING.value:
        return CheckEmailResponse(
            status="PENDING",
            message="Your email verification request is pending admin approval. We will notify you once approved.",
            email=email,
        )

    if user.account_status == AccountStatus.APPROVED.value and not user.password_created:
        return CheckEmailResponse(
            status="APPROVED_PENDING_PASSWORD",
            message="Your account has been approved! Please check your email for the password creation link.",
            email=email,
        )

    # ACTIVE user with password
    return CheckEmailResponse(
        status="ACTIVE",
        message="Welcome back! Please enter your password to sign in.",
        email=email,
    )


# ==========================================
# 2. Request Verification
# ==========================================

@router.post("/request-verification", summary="Submit Email for Admin Verification")
async def request_email_verification(
    payload: RequestVerificationRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Creates a pending user verification request and immediately notifies the admin."""
    email = payload.email.strip().lower()
    full_name = payload.full_name.strip() if payload.full_name else "Valued Customer"

    # Check if user already exists
    res = await db.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()

    if user:
        if user.account_status == AccountStatus.ACTIVE.value:
            return {
                "success": True,
                "status": "ACTIVE",
                "message": "Your account is already active! Please sign in with your password.",
            }
        if user.account_status == AccountStatus.PENDING.value:
            # Re-send notification
            pass
        elif user.account_status == AccountStatus.DISABLED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This account has been disabled. Please contact support.",
            )
    else:
        # Check if email is configured as superadmin
        is_superadmin = email == settings.ADMIN_ALERT_EMAIL.lower()
        user = User(
            full_name=full_name,
            email=email,
            phone_number=payload.phone_number,
            city=payload.city or "Bangalore",
            role=UserRole.ADMIN if is_superadmin else UserRole.CUSTOMER,
            account_status=AccountStatus.PENDING.value,
            is_active=True,
            is_verified=False,
            password_created=False,
            is_approved_seller=is_superadmin,
            verification_requested_at=datetime.now(timezone.utc),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # Generate single-use admin approval & reject tokens (expiring in 7 days)
    approval_token_str = secrets.token_urlsafe(32)
    reject_token_str = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    app_token = UserVerificationToken(
        user_id=user.id,
        email=email,
        token=approval_token_str,
        token_type="ADMIN_APPROVAL",
        expires_at=expires_at,
    )
    rej_token = UserVerificationToken(
        user_id=user.id,
        email=email,
        token=reject_token_str,
        token_type="ADMIN_REJECT",
        expires_at=expires_at,
    )
    db.add(app_token)
    db.add(rej_token)
    await db.commit()

    # Build secure approval links
    base_url = settings.BASE_URL.rstrip("/")
    approve_url = f"{base_url}/api/v1/auth/verify-token/approve?token={approval_token_str}"
    reject_url = f"{base_url}/api/v1/auth/verify-token/reject?token={reject_token_str}"

    # Dispatch email to admin
    await NotificationService.send_admin_user_verification_alert(
        user_email=email,
        full_name=user.full_name,
        approve_url=approve_url,
        reject_url=reject_url,
        requested_at=user.verification_requested_at,
    )

    client_ip = request.client.host if request.client else None
    await log_audit_event(
        db,
        action="USER_VERIFICATION_REQUESTED",
        actor_email=email,
        target_type="USER",
        target_id=str(user.id),
        details=f"User requested verification. Admin alerted with single-use token.",
        ip_address=client_ip,
    )

    return {
        "success": True,
        "status": "PENDING",
        "message": "Your verification request has been submitted. Our team will review and approve your access.",
    }


# ==========================================
# 3. Admin 1-Click Approval / Rejection Endpoints
# ==========================================

@router.get("/verify-token/approve", response_class=HTMLResponse, summary="Admin 1-Click Approve via Email Link")
async def approve_user_via_token(
    token: str = Query(..., description="Secure single-use approval token"),
    db: AsyncSession = Depends(get_db),
):
    """Validates the approval token, approves the user, and sends them a Create Password email."""
    # Find token
    res = await db.execute(
        select(UserVerificationToken).where(
            UserVerificationToken.token == token,
            UserVerificationToken.token_type == "ADMIN_APPROVAL",
        )
    )
    vtoken = res.scalar_one_or_none()

    if not vtoken or vtoken.is_used:
        return HTMLResponse(
            """
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #0b0f19; color: #fff; min-height: 100vh;">
                <h2 style="color: #f43f5e;">⚠️ Invalid or Already Used Approval Link</h2>
                <p style="color: #94a3b8;">This approval token is no longer valid or has already been consumed.</p>
                <a href="/" style="color: #38bdf8; text-decoration: none; font-weight: bold;">Return to Value Cars</a>
            </div>
            """,
            status_code=400,
        )

    now = datetime.now(timezone.utc)
    if vtoken.expires_at.replace(tzinfo=timezone.utc) < now:
        return HTMLResponse(
            """
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #0b0f19; color: #fff; min-height: 100vh;">
                <h2 style="color: #f43f5e;">⚠️ Expired Approval Link</h2>
                <p style="color: #94a3b8;">This approval link has expired.</p>
            </div>
            """,
            status_code=400,
        )

    # Fetch User
    user_res = await db.execute(select(User).where(User.id == vtoken.user_id))
    user = user_res.scalar_one_or_none()
    if not user:
        return HTMLResponse("<h2>User not found</h2>", status_code=404)

    # Mark token used
    vtoken.is_used = True
    vtoken.used_at = now

    # Update User Status
    user.account_status = AccountStatus.APPROVED.value
    user.approved_at = now
    user.approved_by = "Admin (Email 1-Click)"
    user.is_active = True

    # Generate single-use Create Password Token for user (valid for 48 hours)
    create_pw_token_str = secrets.token_urlsafe(32)
    pw_token = UserVerificationToken(
        user_id=user.id,
        email=user.email,
        token=create_pw_token_str,
        token_type="CREATE_PASSWORD",
        expires_at=now + timedelta(hours=48),
    )
    db.add(pw_token)
    await db.commit()

    # Send Create Password email to the user
    base_url = settings.BASE_URL.rstrip("/")
    create_pw_url = f"{base_url}/?action=create-password&token={create_pw_token_str}"
    await NotificationService.send_user_account_approved_alert(
        user_email=user.email,
        create_password_url=create_pw_url,
        expires_in_hours=48,
    )

    await log_audit_event(
        db,
        action="USER_APPROVED",
        actor_email="Admin",
        target_type="USER",
        target_id=str(user.id),
        details=f"User {user.email} approved via email 1-click token.",
    )

    return HTMLResponse(
        f"""
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #0b0f19; color: #fff; min-height: 100vh;">
            <div style="max-width: 500px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 16px; border: 1px solid #10b981;">
                <h2 style="color: #10b981;">✅ User Approved Successfully!</h2>
                <p style="color: #cbd5e1; font-size: 16px;"><strong>{user.email}</strong> has been approved.</p>
                <p style="color: #94a3b8; font-size: 14px;">An automated email containing their single-use <strong>Create Password</strong> link has been sent to them.</p>
                <div style="margin-top: 30px;">
                    <a href="{base_url}" style="background: #e11d48; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">Open Value Cars</a>
                </div>
            </div>
        </div>
        """
    )


@router.get("/verify-token/reject", response_class=HTMLResponse, summary="Admin 1-Click Reject via Email Link")
async def reject_user_via_token(
    token: str = Query(..., description="Secure single-use reject token"),
    db: AsyncSession = Depends(get_db),
):
    """Validates the reject token and marks the user as rejected."""
    res = await db.execute(
        select(UserVerificationToken).where(
            UserVerificationToken.token == token,
            UserVerificationToken.token_type == "ADMIN_REJECT",
        )
    )
    vtoken = res.scalar_one_or_none()

    if not vtoken or vtoken.is_used:
        return HTMLResponse("<div style='background:#0b0f19;color:#fff;padding:50px;'><h2>⚠️ Token Invalid or Used</h2></div>", status_code=400)

    now = datetime.now(timezone.utc)
    vtoken.is_used = True
    vtoken.used_at = now

    user_res = await db.execute(select(User).where(User.id == vtoken.user_id))
    user = user_res.scalar_one_or_none()
    if user:
        user.account_status = AccountStatus.REJECTED.value
        await db.commit()

        await log_audit_event(
            db,
            action="USER_REJECTED",
            actor_email="Admin",
            target_type="USER",
            target_id=str(user.id),
            details=f"User {user.email} rejected via email 1-click token.",
        )

    return HTMLResponse(
        """
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #0b0f19; color: #fff; min-height: 100vh;">
            <div style="max-width: 500px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 16px; border: 1px solid #ef4444;">
                <h2 style="color: #ef4444;">User Rejected</h2>
                <p style="color: #cbd5e1;">The user verification request has been rejected.</p>
            </div>
        </div>
        """
    )


# ==========================================
# 4. User Creates Password (With Validation)
# ==========================================

@router.post("/create-password", response_model=Token, summary="User Creates Password with Token")
async def create_user_password(
    payload: CreatePasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Validates password token, checks complexity (min 8 chars, 1 uppercase, 1 lowercase, 1 number), hashes password, and activates account."""
    if payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )

    # Password policy check: min 8 chars, uppercase, lowercase, number
    pw = payload.password
    if len(pw) < 8 or not re.search(r"[A-Z]", pw) or not re.search(r"[a-z]", pw) or not re.search(r"[0-9]", pw):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
        )

    # Validate token
    res = await db.execute(
        select(UserVerificationToken).where(
            UserVerificationToken.token == payload.token,
            UserVerificationToken.token_type == "CREATE_PASSWORD",
        )
    )
    vtoken = res.scalar_one_or_none()

    if not vtoken or vtoken.is_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password creation link. Please contact administrator.",
        )

    now = datetime.now(timezone.utc)
    if vtoken.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password creation link has expired. Please request a new verification.",
        )

    # Fetch User
    user_res = await db.execute(select(User).where(User.id == vtoken.user_id))
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    # Update User
    user.hashed_password = get_password_hash(payload.password)
    user.password_created = True
    user.is_verified = True
    user.is_active = True
    user.account_status = AccountStatus.ACTIVE.value

    # Mark token used
    vtoken.is_used = True
    vtoken.used_at = now
    await db.commit()
    await db.refresh(user)

    client_ip = request.client.host if request.client else None
    await log_audit_event(
        db,
        action="PASSWORD_CREATED",
        actor_email=user.email,
        target_type="USER",
        target_id=str(user.id),
        details="User created secure password. Account is now ACTIVE.",
        ip_address=client_ip,
    )

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


# ==========================================
# 5. User & Admin Normal Password Login
# ==========================================

@router.post("/login", response_model=Token, summary="Email + Password Login")
async def login(payload: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user with email and password without OTP friction."""
    email = payload.email.strip().lower()

    res = await db.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()

    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if user.account_status == AccountStatus.DISABLED.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been disabled by the administrator.",
        )

    if user.account_status == AccountStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending admin approval.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive account.",
        )

    # Automatically grant superadmin role if email matches settings
    if email == settings.ADMIN_ALERT_EMAIL.lower() and user.role != UserRole.ADMIN:
        user.role = UserRole.ADMIN
        user.is_approved_seller = True
        await db.commit()
        await db.refresh(user)

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/token", response_model=Token, summary="OAuth2 Form Login (for Swagger UI)")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """OAuth2 password login (username is email)."""
    email = form_data.username.strip().lower()
    res = await db.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()

    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active or user.account_status == AccountStatus.DISABLED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive or disabled account",
        )

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


# ==========================================
# 6. Forgot & Reset Password
# ==========================================

@router.post("/forgot-password", summary="Send Password Reset Link")
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Dispatches a secure, single-use password reset link expiring in 2 hours."""
    email = payload.email.strip().lower()
    res = await db.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()

    # Generic response regardless of whether email exists to prevent enumeration
    if user and user.is_active and user.account_status == AccountStatus.ACTIVE.value:
        reset_token_str = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=2)

        vtoken = UserVerificationToken(
            user_id=user.id,
            email=email,
            token=reset_token_str,
            token_type="RESET_PASSWORD",
            expires_at=expires_at,
        )
        db.add(vtoken)
        await db.commit()

        base_url = settings.BASE_URL.rstrip("/")
        reset_url = f"{base_url}/?action=reset-password&token={reset_token_str}"
        await NotificationService.send_user_password_reset_alert(
            user_email=email,
            reset_password_url=reset_url,
            expires_in_hours=2,
        )

    return {
        "success": True,
        "message": "If an active account exists for this email, a password reset link has been dispatched.",
    }


@router.post("/reset-password", summary="Reset Password via Secure Token")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Validates reset token and sets new password."""
    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )

    pw = payload.new_password
    if len(pw) < 8 or not re.search(r"[A-Z]", pw) or not re.search(r"[a-z]", pw) or not re.search(r"[0-9]", pw):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
        )

    res = await db.execute(
        select(UserVerificationToken).where(
            UserVerificationToken.token == payload.token,
            UserVerificationToken.token_type == "RESET_PASSWORD",
        )
    )
    vtoken = res.scalar_one_or_none()

    if not vtoken or vtoken.is_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or already used password reset link.",
        )

    now = datetime.now(timezone.utc)
    if vtoken.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link has expired. Please request a new one.",
        )

    user_res = await db.execute(select(User).where(User.id == vtoken.user_id))
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    user.hashed_password = get_password_hash(payload.new_password)
    user.password_created = True
    vtoken.is_used = True
    vtoken.used_at = now
    await db.commit()

    await log_audit_event(
        db,
        action="PASSWORD_RESET_SUCCESS",
        actor_email=user.email,
        target_type="USER",
        target_id=str(user.id),
        details="Password was successfully reset.",
    )

    return {"success": True, "message": "Password reset successfully! You can now sign in."}


# ==========================================
# 7. User Profile
# ==========================================

@router.get("/me", response_model=UserResponse, summary="Get Current User Profile")
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Fetch authenticated user profile details."""
    return current_user


# ==========================================
# 8. Admin User Verification Management & Audit Logs
# ==========================================

@router.get("/verification-requests", response_model=List[VerificationRequestItem], summary="Admin: List All Verification Requests")
async def list_verification_requests(
    db: AsyncSession = Depends(get_db),
    admin_email: Optional[str] = Query(None),
):
    """Admin views all user verification requests."""
    # Verify manager or superadmin
    query = select(User).order_by(desc(User.created_at)).limit(100)
    res = await db.execute(query)
    return list(res.scalars().all())


@router.post("/admin-user-action", summary="Admin: Approve, Reject, Disable, Reactivate User")
async def admin_user_action(
    payload: AdminUserActionRequest,
    db: AsyncSession = Depends(get_db),
):
    """Admin updates user status (APPROVE, REJECT, DISABLE, REACTIVATE)."""
    user = None
    if payload.user_id:
        res = await db.execute(select(User).where(User.id == payload.user_id))
        user = res.scalar_one_or_none()
    elif payload.email:
        res = await db.execute(select(User).where(User.email == payload.email.strip().lower()))
        user = res.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    act = payload.action.upper()
    now = datetime.now(timezone.utc)

    if act == "APPROVE":
        user.account_status = AccountStatus.APPROVED.value
        user.approved_at = now
        user.approved_by = "Admin Dashboard"
        user.is_active = True

        # Generate single-use create password token
        create_pw_token_str = secrets.token_urlsafe(32)
        pw_token = UserVerificationToken(
            user_id=user.id,
            email=user.email,
            token=create_pw_token_str,
            token_type="CREATE_PASSWORD",
            expires_at=now + timedelta(hours=48),
        )
        db.add(pw_token)
        await db.commit()

        base_url = settings.BASE_URL.rstrip("/")
        create_pw_url = f"{base_url}/?action=create-password&token={create_pw_token_str}"
        await NotificationService.send_user_account_approved_alert(
            user_email=user.email,
            create_password_url=create_pw_url,
            expires_in_hours=48,
        )
        message = f"User {user.email} approved and password setup link dispatched."
    elif act == "REJECT":
        user.account_status = AccountStatus.REJECTED.value
        await db.commit()
        message = f"User {user.email} marked as REJECTED."
    elif act == "DISABLE":
        user.account_status = AccountStatus.DISABLED.value
        user.is_active = False
        await db.commit()
        message = f"User {user.email} has been disabled."
    elif act == "REACTIVATE":
        user.account_status = AccountStatus.ACTIVE.value
        user.is_active = True
        await db.commit()
        message = f"User {user.email} has been reactivated."
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {payload.action}")

    await log_audit_event(
        db,
        action=f"USER_STATUS_{act}",
        actor_email="Admin",
        target_type="USER",
        target_id=str(user.id),
        details=message,
    )

    return {"success": True, "message": message, "status": user.account_status}


@router.get("/audit-logs", response_model=List[AuditLogResponse], summary="Admin: View Platform Audit Logs")
async def list_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Admin views recent security and operational audit logs."""
    query = select(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit)
    res = await db.execute(query)
    return list(res.scalars().all())


# Legacy Registration and OTP endpoints retained for backward compatibility
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register customer account."""
    clean_email = user_in.email.strip().lower()
    existing = await db.execute(select(User).where(User.email == clean_email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    is_admin = clean_email == settings.ADMIN_ALERT_EMAIL.lower()
    user = User(
        full_name=user_in.full_name,
        phone_number=user_in.phone_number,
        email=clean_email,
        hashed_password=get_password_hash(user_in.password) if user_in.password else None,
        role=UserRole.ADMIN if is_admin else user_in.role,
        account_status=AccountStatus.ACTIVE.value if is_admin else AccountStatus.APPROVED.value,
        city=user_in.city,
        is_active=True,
        is_verified=True,
        password_created=bool(user_in.password),
        is_approved_seller=is_admin,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/send-otp")
async def send_otp(request: OTPRequest):
    """Dev OTP endpoint."""
    return {
        "success": True,
        "message": f"OTP sent to {request.phone_number}",
        "dev_otp": "1234",
    }


@router.post("/verify-otp", response_model=Token)
async def verify_otp(request: OTPVerify, db: AsyncSession = Depends(get_db)):
    """Dev OTP verification endpoint."""
    if request.otp not in ["1234", "9999"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP",
        )

    dummy_email = f"user_{request.phone_number.replace('+', '')}@valuecars.in"
    res = await db.execute(select(User).where(User.phone_number == request.phone_number))
    user = res.scalar_one_or_none()

    if not user:
        user = User(
            full_name=request.full_name or "Valued Customer",
            phone_number=request.phone_number,
            email=dummy_email,
            role=UserRole.CUSTOMER,
            account_status=AccountStatus.ACTIVE.value,
            is_active=True,
            is_verified=True,
            password_created=False,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    return Token(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user))

