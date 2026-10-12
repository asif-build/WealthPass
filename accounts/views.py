import json
import re
from datetime import timedelta
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.middleware.csrf import get_token

from .models import (
    UserProfile, LegalAcceptance, EmailVerificationToken,
    PasswordResetToken, MobileOTPRecord, AuthAuditLog,
    AccountStatus, hash_token
)
from .sms_service import SMSService
from .email_service import EmailService
from .phone_utils import validate_and_normalize_indian_phone
from notifications.services import NotificationService


def get_client_ip(request) -> str:
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip or '127.0.0.1'


def parse_json_body(request):
    try:
        return json.loads(request.body.decode('utf-8'))
    except Exception:
        return {}


def normalize_email(email: str) -> str:
    return email.strip().lower()


def normalize_phone(phone: str) -> str:
    is_valid, normalized, _ = validate_and_normalize_indian_phone(phone)
    if is_valid:
        return normalized
    # Fallback safe sanitization if invoked outside validation
    cleaned = re.sub(r'[^\d+]', '', (phone or '').strip())
    return cleaned[:15]



def validate_password_strength(password: str) -> tuple[bool, str | None]:
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number."
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=]', password):
        return False, "Password must contain at least one special character."
    return True, None


# ==============================================================================
# AUTHENTICATION API ENDPOINTS
# ==============================================================================

def api_register(request):
    """
    POST /api/auth/register/
    Registers a new user, records separate legal and privacy acceptance,
    and dispatches a cryptographically secure email verification token.
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    data = parse_json_body(request)
    full_name = (data.get('full_name') or data.get('name') or '').strip()
    raw_email = (data.get('email') or '').strip()
    raw_phone = (data.get('phone') or data.get('mobile_number') or '').strip()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', password)
    terms_accepted = bool(data.get('terms_accepted'))
    privacy_acknowledged = bool(data.get('privacy_acknowledged'))

    # Validation
    if not full_name:
        return JsonResponse({'success': False, 'error': 'Full name is required.'}, status=400)
    if not raw_email or '@' not in raw_email:
        return JsonResponse({'success': False, 'error': 'A valid email address is required.'}, status=400)
    is_phone_valid, phone_e164, phone_err = validate_and_normalize_indian_phone(raw_phone)
    if not is_phone_valid:
        return JsonResponse({'success': False, 'error': phone_err}, status=400)
    if not password:
        return JsonResponse({'success': False, 'error': 'Password is required.'}, status=400)
    if password != confirm_password:
        return JsonResponse({'success': False, 'error': 'Passwords do not match.'}, status=400)
    if not terms_accepted:
        return JsonResponse({'success': False, 'error': 'You must explicitly agree to the Terms & Conditions.'}, status=400)
    if not privacy_acknowledged:
        return JsonResponse({'success': False, 'error': 'You must acknowledge reading the Privacy Policy.'}, status=400)

    pw_valid, pw_err = validate_password_strength(password)
    if not pw_valid:
        return JsonResponse({'success': False, 'error': pw_err}, status=400)

    email = normalize_email(raw_email)

    # Check for duplicate email
    if User.objects.filter(email__iexact=email).exists():
        return JsonResponse({
            'success': False,
            'error': 'An account with this email address already exists. Please sign in.'
        }, status=409)

    # Check for duplicate phone
    if UserProfile.objects.filter(phone_e164=phone_e164).exists():
        return JsonResponse({
            'success': False,
            'error': 'An account with this mobile number already exists.'
        }, status=409)

    # Split name into first and last
    name_parts = full_name.split(' ', 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ''

    ip_address = get_client_ip(request)
    user_agent = request.META.get('HTTP_USER_AGENT', '')

    # Create User
    # In standard Django User, username must be unique; we use the normalized email as the username
    user = User(
        username=email,
        email=email,
        first_name=first_name,
        last_name=last_name,
        is_active=True
    )
    user.set_password(password)
    user.save()

    # Create UserProfile
    profile = UserProfile.objects.create(
        user=user,
        phone_e164=phone_e164,
        is_email_verified=False,
        is_phone_verified=False,
        account_status=AccountStatus.PENDING_VERIFICATION
    )

    # Create Legal Acceptance record
    LegalAcceptance.objects.create(
        user=user,
        terms_version='v1.0',
        terms_accepted_at=timezone.now(),
        privacy_policy_version='v1.0',
        privacy_acknowledged_at=timezone.now(),
        ip_address=ip_address,
        user_agent=user_agent
    )

    # Create single-use Email Verification Token
    token_obj, raw_token = EmailVerificationToken.create_token(user=user, expiry_hours=24)

    # Send verification email
    email_sent, email_err = EmailService.send_verification_email(user=user, raw_token=raw_token, request=request)

    # Log audit trail
    AuthAuditLog.objects.create(
        user=user,
        event_type='REGISTER',
        ip_address=ip_address,
        user_agent=user_agent,
        details={
            'email': email,
            'phone_masked': phone_e164[:4] + '****' + phone_e164[-2:] if len(phone_e164) > 6 else '***',
            'email_sent': email_sent,
            'terms_version': 'v1.0',
            'privacy_version': 'v1.0'
        }
    )

    # Real persistent notification
    NotificationService.notify_account_created(user)

    return JsonResponse({
        'success': True,
        'message': 'Account created successfully. A verification email has been sent to your address.',
        'email': email,
        'email_sent': email_sent,
        'email_error': email_err if not email_sent else None,
        'requires_verification': True
    }, status=201)


def api_login(request):
    """
    POST /api/auth/login/
    Authenticates user credentials, enforces rate limiting and account lockouts,
    handles unverified emails, and sets a secure authenticated session.
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    data = parse_json_body(request)
    raw_email = data.get('email', '').strip()
    password = data.get('password', '')
    remember_me = bool(data.get('remember_me', False))

    if not raw_email or not password:
        return JsonResponse({'success': False, 'error': 'Email and password are required.'}, status=400)

    email = normalize_email(raw_email)
    ip_address = get_client_ip(request)
    user_agent = request.META.get('HTTP_USER_AGENT', '')

    try:
        user = User.objects.get(email__iexact=email)
        profile = getattr(user, 'profile', None)
    except User.DoesNotExist:
        user = None
        profile = None

    # Check lockout
    if profile and profile.is_locked():
        lock_remaining = int((profile.locked_until - timezone.now()).total_seconds() / 60)
        return JsonResponse({
            'success': False,
            'error': f'Account is temporarily locked due to multiple failed login attempts. Please try again in {max(1, lock_remaining)} minutes.'
        }, status=403)

    authenticated_user = authenticate(request, username=email, password=password)

    if not authenticated_user:
        if profile:
            profile.register_failed_attempt()
        AuthAuditLog.objects.create(
            user=user,
            event_type='LOGIN_FAILED',
            ip_address=ip_address,
            user_agent=user_agent,
            details={'email': email}
        )
        return JsonResponse({
            'success': False,
            'error': 'Invalid email or password.'
        }, status=401)

    # Check unverified email
    user_profile = getattr(authenticated_user, 'profile', None)
    if user_profile and not user_profile.is_email_verified:
        return JsonResponse({
            'success': False,
            'requires_verification': True,
            'email': email,
            'error': 'Your email address has not been verified yet. Please check your inbox or request a new verification link.'
        }, status=403)

    # Check disabled/suspended status
    if not authenticated_user.is_active or (user_profile and user_profile.account_status == AccountStatus.SUSPENDED):
        return JsonResponse({
            'success': False,
            'error': 'Your account has been deactivated or suspended. Please contact WealthPass support.'
        }, status=403)

    # Reset failed attempts upon successful login
    if user_profile:
        user_profile.reset_failed_attempts()
        if user_profile.account_status == AccountStatus.PENDING_VERIFICATION and user_profile.is_email_verified:
            user_profile.account_status = AccountStatus.ACTIVE
            user_profile.save(update_fields=['account_status'])

    # Establish session
    login(request, authenticated_user)

    if remember_me:
        request.session.set_expiry(14 * 24 * 3600)  # 14 days
    else:
        request.session.set_expiry(0)  # Browser session

    AuthAuditLog.objects.create(
        user=authenticated_user,
        event_type='LOGIN_SUCCESS',
        ip_address=ip_address,
        user_agent=user_agent,
        details={'email': email}
    )

    return JsonResponse({
        'success': True,
        'message': 'Welcome back.',
        'user': {
            'id': authenticated_user.id,
            'full_name': authenticated_user.get_full_name() or authenticated_user.username,
            'email': authenticated_user.email,
            'phone': user_profile.phone_e164 if user_profile else '',
            'is_email_verified': user_profile.is_email_verified if user_profile else False,
            'is_phone_verified': user_profile.is_phone_verified if user_profile else False,
            'account_status': user_profile.account_status if user_profile else 'ACTIVE'
        }
    })


def api_verify_email(request):
    """
    POST or GET /api/auth/verify-email/
    Validates single-use token, activates user email verification status.
    """
    if request.method == 'GET':
        raw_token = request.GET.get('token', '').strip()
    else:
        data = parse_json_body(request)
        raw_token = data.get('token', '').strip()

    if not raw_token:
        return JsonResponse({'success': False, 'error': 'Verification token is required.'}, status=400)

    token_hash = hash_token(raw_token)
    ip_address = get_client_ip(request)
    user_agent = request.META.get('HTTP_USER_AGENT', '')

    try:
        token_record = EmailVerificationToken.objects.select_related('user', 'user__profile').get(
            token_hash=token_hash
        )
    except EmailVerificationToken.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Invalid verification link. The link may have expired or been replaced.'
        }, status=400)

    if token_record.is_used:
        return JsonResponse({
            'success': False,
            'error': 'This verification link has already been used. Please log in to your account.'
        }, status=400)

    if token_record.is_expired:
        return JsonResponse({
            'success': False,
            'error': 'This verification link has expired. Please request a new verification link.'
        }, status=400)

    # Mark token used
    token_record.is_used = True
    token_record.used_at = timezone.now()
    token_record.save(update_fields=['is_used', 'used_at'])

    # Activate email status
    user = token_record.user
    profile = getattr(user, 'profile', None)
    if profile:
        profile.is_email_verified = True
        profile.email_verified_at = timezone.now()
        if profile.account_status == AccountStatus.PENDING_VERIFICATION:
            profile.account_status = AccountStatus.ACTIVE
        profile.save(update_fields=['is_email_verified', 'email_verified_at', 'account_status'])

    AuthAuditLog.objects.create(
        user=user,
        event_type='EMAIL_VERIFIED',
        ip_address=ip_address,
        user_agent=user_agent,
        details={'email': user.email}
    )

    # Real persistent notification
    NotificationService.notify_email_verified(user)

    return JsonResponse({
        'success': True,
        'message': 'Your email address has been successfully verified! You can now log in.'
    })


def api_resend_verification(request):
    """
    POST /api/auth/resend-verification/
    Dispatches a new email verification token with cooldown protection.
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    data = parse_json_body(request)
    raw_email = data.get('email', '').strip()
    if not raw_email:
        return JsonResponse({'success': False, 'error': 'Email address is required.'}, status=400)

    email = normalize_email(raw_email)
    try:
        user = User.objects.get(email__iexact=email)
        profile = getattr(user, 'profile', None)
    except User.DoesNotExist:
        # Generic response to prevent user enumeration
        return JsonResponse({
            'success': True,
            'message': 'If an account exists with this email, a verification link has been resent.'
        })

    if profile and profile.is_email_verified:
        return JsonResponse({
            'success': True,
            'message': 'This email address is already verified. You can log in directly.'
        })

    # 60-second cooldown check
    recent_token = EmailVerificationToken.objects.filter(
        user=user,
        created_at__gte=timezone.now() - timedelta(seconds=60)
    ).first()

    if recent_token:
        return JsonResponse({
            'success': False,
            'error': 'Please wait at least 60 seconds before requesting another verification email.'
        }, status=429)

    # Invalidate previous unused tokens
    EmailVerificationToken.objects.filter(user=user, is_used=False).update(is_used=True)

    token_obj, raw_token = EmailVerificationToken.create_token(user=user, expiry_hours=24)
    email_sent, email_err = EmailService.send_verification_email(user=user, raw_token=raw_token, request=request)

    return JsonResponse({
        'success': True,
        'message': 'A new verification link has been sent to your email address.',
        'email_sent': email_sent,
        'email_error': email_err if not email_sent else None
    })


def api_forgot_password(request):
    """
    POST /api/auth/forgot-password/
    Sends password reset email. Always returns generic response.
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    data = parse_json_body(request)
    raw_email = data.get('email', '').strip()
    if not raw_email:
        return JsonResponse({'success': False, 'error': 'Email address is required.'}, status=400)

    email = normalize_email(raw_email)
    ip_address = get_client_ip(request)

    # Look up user
    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        user = None

    if user:
        # Invalidate existing unused reset tokens
        PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)

        token_obj, raw_token = PasswordResetToken.create_token(user=user, expiry_hours=1)
        email_sent, _ = EmailService.send_password_reset_email(user=user, raw_token=raw_token, request=request)

        AuthAuditLog.objects.create(
            user=user,
            event_type='PASSWORD_RESET_REQUESTED',
            ip_address=ip_address,
            details={'email': email, 'email_sent': email_sent}
        )

    # Always return anti-enumeration response
    return JsonResponse({
        'success': True,
        'message': 'If an account exists with this email address, password reset instructions have been sent.'
    })


def api_reset_password(request):
    """
    POST /api/auth/reset-password/
    Validates token and updates password securely.
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    data = parse_json_body(request)
    raw_token = data.get('token', '').strip()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')

    if not raw_token:
        return JsonResponse({'success': False, 'error': 'Reset token is required.'}, status=400)
    if not password:
        return JsonResponse({'success': False, 'error': 'New password is required.'}, status=400)
    if password != confirm_password:
        return JsonResponse({'success': False, 'error': 'Passwords do not match.'}, status=400)

    pw_valid, pw_err = validate_password_strength(password)
    if not pw_valid:
        return JsonResponse({'success': False, 'error': pw_err}, status=400)

    token_hash = hash_token(raw_token)
    ip_address = get_client_ip(request)

    try:
        token_record = PasswordResetToken.objects.select_related('user', 'user__profile').get(
            token_hash=token_hash
        )
    except PasswordResetToken.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Invalid password reset link.'
        }, status=400)

    if token_record.is_used:
        return JsonResponse({
            'success': False,
            'error': 'This reset link has already been used.'
        }, status=400)

    if token_record.is_expired:
        return JsonResponse({
            'success': False,
            'error': 'This reset link has expired. Please request a new one.'
        }, status=400)

    user = token_record.user
    user.set_password(password)
    user.save()

    token_record.is_used = True
    token_record.used_at = timezone.now()
    token_record.save(update_fields=['is_used', 'used_at'])

    profile = getattr(user, 'profile', None)
    if profile:
        profile.reset_failed_attempts()

    AuthAuditLog.objects.create(
        user=user,
        event_type='PASSWORD_RESET_SUCCESS',
        ip_address=ip_address,
        details={'email': user.email}
    )

    # Real persistent notification
    NotificationService.notify_password_reset(user)

    return JsonResponse({
        'success': True,
        'message': 'Your password has been successfully reset. You may now sign in with your new password.'
    })


# ==============================================================================
# REAL MOBILE OTP ENDPOINTS
# ==============================================================================

def api_send_otp(request):
    """
    POST /api/auth/send-otp/
    Dispatches real mobile OTP using the configured SMS provider.
    Enforces per-phone and per-IP rate limits and cooldowns.
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    data = parse_json_body(request)
    raw_phone = data.get('phone', '').strip()

    if not raw_phone:
        if request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.phone_e164:
            raw_phone = request.user.profile.phone_e164
        else:
            return JsonResponse({'success': False, 'error': 'Enter a valid 10-digit Indian mobile number.'}, status=400)

    is_phone_valid, phone_e164, phone_err = validate_and_normalize_indian_phone(raw_phone)
    if not is_phone_valid:
        return JsonResponse({'success': False, 'error': phone_err}, status=400)

    ip_address = get_client_ip(request)

    # Rate limiting: max 4 requests per hour per phone
    one_hour_ago = timezone.now() - timedelta(hours=1)
    recent_count = MobileOTPRecord.objects.filter(
        phone_e164=phone_e164,
        created_at__gte=one_hour_ago
    ).count()

    if recent_count >= 4:
        return JsonResponse({
            'success': False,
            'error': 'Too many OTP requests for this mobile number. Please wait an hour.'
        }, status=429)

    # 60-second cooldown
    last_sent = MobileOTPRecord.objects.filter(
        phone_e164=phone_e164,
        created_at__gte=timezone.now() - timedelta(seconds=60)
    ).first()

    if last_sent:
        return JsonResponse({
            'success': False,
            'error': 'Please wait 60 seconds before requesting another OTP.'
        }, status=429)

    # Generate OTP record
    user = request.user if request.user.is_authenticated else None
    otp_record, raw_otp = MobileOTPRecord.create_otp(
        phone_e164=phone_e164,
        user=user,
        expiry_minutes=10,
        ip_address=ip_address
    )

    # Dispatch via SMS Service
    sms_sent, status_msg = SMSService.send_otp(phone_e164=phone_e164, raw_otp=raw_otp)

    if not sms_sent:
        # Never silently pretend success if SMS provider is not configured
        otp_record.delete()
        is_configured = SMSService.is_sms_configured()
        status_code = 503
        if "authentication" in status_msg.lower() or "credentials" in status_msg.lower():
            status_code = 502
        return JsonResponse({
            'success': False,
            'configured': is_configured,
            'error': status_msg
        }, status=status_code)

    AuthAuditLog.objects.create(
        user=user,
        event_type='OTP_SENT',
        ip_address=ip_address,
        details={'phone_masked': phone_e164[:4] + '****' + phone_e164[-2:]}
    )

    return JsonResponse({
        'success': True,
        'message': f'OTP sent successfully to {phone_e164[:4]}****{phone_e164[-2:]}. Valid for 10 minutes.',
        'phone': phone_e164,
        'cooldown_seconds': 60
    })


def api_verify_otp(request):
    """
    POST /api/auth/verify-otp/
    Verifies mobile OTP against single-use hash and enforces max 3 attempts.
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    data = parse_json_body(request)
    raw_phone = data.get('phone', '').strip()
    raw_otp = data.get('otp', '').strip()

    if not raw_phone:
        if request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.phone_e164:
            raw_phone = request.user.profile.phone_e164
        else:
            return JsonResponse({'success': False, 'error': 'Enter a valid 10-digit Indian mobile number.'}, status=400)

    is_phone_valid, phone_e164, phone_err = validate_and_normalize_indian_phone(raw_phone)
    if not is_phone_valid:
        return JsonResponse({'success': False, 'error': phone_err}, status=400)

    if not raw_otp:
        return JsonResponse({'success': False, 'error': 'OTP is required.'}, status=400)

    ip_address = get_client_ip(request)

    # Find most recent unexpired, unused OTP record for this phone
    otp_record = MobileOTPRecord.objects.filter(
        phone_e164=phone_e164,
        is_used=False,
        expires_at__gt=timezone.now()
    ).order_by('-created_at').first()

    if not otp_record:
        return JsonResponse({
            'success': False,
            'error': 'No active OTP found. Please request a new OTP.'
        }, status=400)

    # Check attempt threshold
    if otp_record.attempts >= otp_record.max_attempts:
        otp_record.is_used = True
        otp_record.save(update_fields=['is_used'])
        return JsonResponse({
            'success': False,
            'error': 'Maximum verification attempts exceeded. Please request a new OTP.'
        }, status=400)

    otp_record.attempts += 1
    otp_record.save(update_fields=['attempts'])

    computed_hash = hash_token(raw_otp)
    if computed_hash != otp_record.otp_hash:
        remaining = otp_record.max_attempts - otp_record.attempts
        return JsonResponse({
            'success': False,
            'error': f'Incorrect OTP. {remaining} attempt(s) remaining.' if remaining > 0 else 'Incorrect OTP. Maximum attempts exceeded.'
        }, status=400)

    # Mark OTP as successfully used
    otp_record.is_used = True
    otp_record.save(update_fields=['is_used'])

    # Update user profile if authenticated or by phone match
    user_to_update = request.user if request.user.is_authenticated else None
    if not user_to_update:
        profile_match = UserProfile.objects.filter(phone_e164=phone_e164).select_related('user').first()
        if profile_match:
            user_to_update = profile_match.user

    if user_to_update and hasattr(user_to_update, 'profile'):
        user_to_update.profile.is_phone_verified = True
        user_to_update.profile.phone_verified_at = timezone.now()
        user_to_update.profile.save(update_fields=['is_phone_verified', 'phone_verified_at'])

    AuthAuditLog.objects.create(
        user=user_to_update,
        event_type='OTP_VERIFIED',
        ip_address=ip_address,
        details={'phone_masked': phone_e164[:4] + '****' + phone_e164[-2:]}
    )

    if user_to_update:
        NotificationService.notify_phone_verified(user_to_update, phone_e164[:4] + '****' + phone_e164[-2:])

    return JsonResponse({
        'success': True,
        'message': 'Mobile number verified successfully.',
        'notice': "Phone OTP verification establishes control of the mobile device. It does not establish legal identity, family relationship, asset ownership, or entitlement to a claim."
    })


def api_resend_otp(request):
    """
    POST /api/auth/resend-otp/
    Alias for send-otp with the same security checks and cooldowns.
    """
    return api_send_otp(request)


# ==============================================================================
# SESSION & USER STATE ENDPOINTS
# ==============================================================================

def api_me(request):
    """
    GET /api/auth/me/
    Returns current authenticated user session data and separate verification flags.
    """
    if not request.user.is_authenticated:
        return JsonResponse({
            'isAuthenticated': False,
            'user': None
        })

    user = request.user
    profile = getattr(user, 'profile', None)
    latest_legal = user.legal_acceptances.first() if hasattr(user, 'legal_acceptances') else None

    identity_rec = None
    rel_rec = None
    try:
        from claims.models import VerificationRecord, ClaimantRelationshipRecord
        identity_rec = VerificationRecord.objects.filter(user=user).order_by('-verified_at').first()
        rel_rec = ClaimantRelationshipRecord.objects.filter(user=user).order_by('-created_at').first()
    except Exception:
        pass

    return JsonResponse({
        'isAuthenticated': True,
        'user': {
            'id': user.id,
            'full_name': user.get_full_name() or user.username,
            'email': user.email,
            'phone': profile.phone_e164 if profile else '',
            'is_email_verified': profile.is_email_verified if profile else False,
            'email_verified_at': profile.email_verified_at.isoformat() if profile and profile.email_verified_at else None,
            'is_phone_verified': profile.is_phone_verified if profile else False,
            'phone_verified_at': profile.phone_verified_at.isoformat() if profile and profile.phone_verified_at else None,
            'is_identity_verified': (identity_rec.verification_status == 'VERIFIED') if identity_rec else False,
            'identity_status': identity_rec.verification_status if identity_rec else 'NOT_STARTED',
            'identity_masked': identity_rec.masked_identifier if identity_rec else None,
            'relationship_status': rel_rec.status if rel_rec else None,
            'account_status': profile.account_status if profile else 'ACTIVE',
            'created_at': user.date_joined.isoformat(),
            'terms_accepted_at': latest_legal.terms_accepted_at.isoformat() if latest_legal else None,
            'terms_version': latest_legal.terms_version if latest_legal else 'v1.0',
            'privacy_acknowledged_at': latest_legal.privacy_acknowledged_at.isoformat() if latest_legal else None,
            'privacy_version': latest_legal.privacy_policy_version if latest_legal else 'v1.0'
        }
    })


def api_logout(request):
    """
    POST /api/auth/logout/
    Flushes server-side session and clears authentication cookies.
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    ip_address = get_client_ip(request)
    user = request.user if request.user.is_authenticated else None

    if user:
        AuthAuditLog.objects.create(
            user=user,
            event_type='LOGOUT',
            ip_address=ip_address,
            details={'email': user.email}
        )

    # Invalidate session on server
    logout(request)

    response = JsonResponse({
        'success': True,
        'message': 'Successfully logged out.'
    })

    # Explicitly clear session cookie
    response.delete_cookie(
        settings.SESSION_COOKIE_NAME,
        domain=settings.SESSION_COOKIE_DOMAIN,
        path=settings.SESSION_COOKIE_PATH or '/'
    )
    # Ensure anti-cache headers are set
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate, private, max-age=0'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'

    return response


@ensure_csrf_cookie
def api_csrf(request):
    """
    GET /api/auth/csrf/
    Ensures CSRF cookie is seeded on client and returns current CSRF token.
    """
    token = get_token(request)
    return JsonResponse({
        'success': True,
        'csrfToken': token
    })


def api_change_password(request):
    """
    POST /api/auth/change-password/
    Requires authenticated user session.
    Validates current password, enforces password complexity, updates password,
    calls update_session_auth_hash to invalidate sessions on other devices,
    and logs PASSWORD_CHANGED audit event.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Authentication required. Please sign in.'}, status=401)

    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    data = parse_json_body(request)
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    confirm_password = data.get('confirm_password', '')

    if not current_password or not new_password:
        return JsonResponse({'success': False, 'error': 'Current password and new password are required.'}, status=400)

    if new_password != confirm_password:
        return JsonResponse({'success': False, 'error': 'New passwords do not match.'}, status=400)

    if not request.user.check_password(current_password):
        return JsonResponse({'success': False, 'error': 'Current password is incorrect.'}, status=400)

    pw_valid, pw_err = validate_password_strength(new_password)
    if not pw_valid:
        return JsonResponse({'success': False, 'error': pw_err}, status=400)

    from django.contrib.auth import update_session_auth_hash
    request.user.set_password(new_password)
    request.user.save()

    # Keeps current user logged in while invalidating other devices
    update_session_auth_hash(request, request.user)

    ip_address = get_client_ip(request)
    AuthAuditLog.objects.create(
        user=request.user,
        event_type='PASSWORD_CHANGED',
        ip_address=ip_address,
        details={'reason': 'User initiated password change'}
    )

    # Real persistent notification
    NotificationService.notify_security_settings_changed(request.user, "Password updated successfully")

    return JsonResponse({
        'success': True,
        'message': 'Password has been successfully changed. All other active sessions have been invalidated.'
    })


def api_terminate_other_sessions(request):
    """
    POST /api/auth/terminate-other-sessions/
    Invalidates all other sessions on all devices for the current user
    by updating the session auth hash.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Authentication required.'}, status=401)

    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    from django.contrib.auth import update_session_auth_hash
    # Rotating the session auth hash invalidates all other sessions across devices
    request.user.set_password(request.user.password)  # Triggers hash update or save
    request.user.save()
    update_session_auth_hash(request, request.user)

    ip_address = get_client_ip(request)
    AuthAuditLog.objects.create(
        user=request.user,
        event_type='SESSIONS_TERMINATED',
        ip_address=ip_address,
        details={'action': 'Terminated all other active sessions'}
    )

    # Real persistent notification
    NotificationService.notify_security_settings_changed(request.user, "Terminated all other active browser sessions")

    return JsonResponse({
        'success': True,
        'message': 'All other active sessions have been terminated.'
    })


def api_user_activity(request):
    """
    GET /api/auth/activity/
    Returns recent security activity and audit logs for the authenticated user only.
    Strict Account Isolation: A user can only view their own logs.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Authentication required.'}, status=401)

    auth_logs = AuthAuditLog.objects.filter(user=request.user).order_by('-timestamp')[:50]
    activity = []
    for l in auth_logs:
        activity.append({
            'id': f"auth-{l.id}",
            'source': 'AUTHENTICATION',
            'event_type': l.event_type,
            'ip_address': l.ip_address,
            'timestamp': l.timestamp.isoformat(),
            'details': l.details or {}
        })

    try:
        from claims.models import AuditLog as ClaimAuditLog
        claim_logs = ClaimAuditLog.objects.filter(user=request.user).order_by('-timestamp')[:50]
        for cl in claim_logs:
            activity.append({
                'id': f"claim-{cl.log_id}",
                'source': 'DISCOVERY',
                'event_type': cl.event_type,
                'ip_address': 'Client App',
                'timestamp': cl.timestamp.isoformat(),
                'details': cl.details or {}
            })
        activity.sort(key=lambda x: x['timestamp'], reverse=True)
    except Exception:
        pass

    return JsonResponse({'success': True, 'activity': activity[:50]})


