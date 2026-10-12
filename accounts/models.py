import hashlib
import secrets
from datetime import timedelta
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


def hash_token(raw_token: str) -> str:
    """Computes SHA-256 hash of a sensitive token so plain values are never stored."""
    return hashlib.sha256(raw_token.encode('utf-8')).hexdigest()


class AccountStatus(models.TextChoices):
    PENDING_VERIFICATION = 'PENDING_VERIFICATION', 'Pending Verification'
    ACTIVE = 'ACTIVE', 'Active'
    SUSPENDED = 'SUSPENDED', 'Suspended'
    LOCKED = 'LOCKED', 'Temporarily Locked'


class UserProfile(models.Model):
    """
    Extends standard Django User with WealthPass enterprise attributes,
    mobile E.164 phone verification, separate verification states, and security locks.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_e164 = models.CharField(max_length=20, unique=True, null=True, blank=True, db_index=True)
    is_phone_verified = models.BooleanField(default=False)
    phone_verified_at = models.DateTimeField(null=True, blank=True)
    
    is_email_verified = models.BooleanField(default=False)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    
    account_status = models.CharField(
        max_length=30,
        choices=AccountStatus.choices,
        default=AccountStatus.PENDING_VERIFICATION,
        db_index=True
    )
    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_locked(self) -> bool:
        if self.locked_until and timezone.now() < self.locked_until:
            return True
        return False

    def reset_failed_attempts(self):
        self.failed_login_attempts = 0
        self.locked_until = None
        self.save(update_fields=['failed_login_attempts', 'locked_until'])

    def register_failed_attempt(self, max_attempts=5, lock_duration_minutes=15):
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= max_attempts:
            self.locked_until = timezone.now() + timedelta(minutes=lock_duration_minutes)
            self.account_status = AccountStatus.LOCKED
        self.save(update_fields=['failed_login_attempts', 'locked_until', 'account_status'])

    def __str__(self):
        return f"Profile of {self.user.username} ({self.account_status})"


class LegalAcceptance(models.Model):
    """
    Legal audit trail recording explicit user agreement to Terms & Conditions
    and separate acknowledgement of Privacy Policy.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='legal_acceptances')
    terms_version = models.CharField(max_length=20, default='v1.0')
    terms_accepted_at = models.DateTimeField(default=timezone.now)
    privacy_policy_version = models.CharField(max_length=20, default='v1.0')
    privacy_acknowledged_at = models.DateTimeField(default=timezone.now)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} accepted Terms {self.terms_version} & Privacy {self.privacy_policy_version}"


class EmailVerificationToken(models.Model):
    """
    Cryptographically secure single-use email verification tokens.
    Stores only the SHA-256 hash of the generated token.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_verification_tokens')
    token_hash = models.CharField(max_length=128, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)

    @classmethod
    def create_token(cls, user, expiry_hours=24):
        raw_token = secrets.token_urlsafe(32)
        token_hash = hash_token(raw_token)
        expires_at = timezone.now() + timedelta(hours=expiry_hours)
        obj = cls.objects.create(
            user=user,
            token_hash=token_hash,
            expires_at=expires_at
        )
        return obj, raw_token

    @property
    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"EmailToken for {self.user.email} (Used={self.is_used}, Expired={self.is_expired})"


class PasswordResetToken(models.Model):
    """
    Cryptographically secure single-use password reset tokens.
    Stores only the SHA-256 hash.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token_hash = models.CharField(max_length=128, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)

    @classmethod
    def create_token(cls, user, expiry_hours=1):
        raw_token = secrets.token_urlsafe(32)
        token_hash = hash_token(raw_token)
        expires_at = timezone.now() + timedelta(hours=expiry_hours)
        obj = cls.objects.create(
            user=user,
            token_hash=token_hash,
            expires_at=expires_at
        )
        return obj, raw_token

    @property
    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"ResetToken for {self.user.email} (Used={self.is_used}, Expired={self.is_expired})"


class MobileOTPRecord(models.Model):
    """
    Tracks mobile OTP dispatch, rate limiting, and verification attempts.
    Never stores plaintext OTPs; only stores the SHA-256 hash.
    """
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='otp_records')
    phone_e164 = models.CharField(max_length=20, db_index=True)
    otp_hash = models.CharField(max_length=128)
    attempts = models.IntegerField(default=0)
    max_attempts = models.IntegerField(default=3)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    @classmethod
    def create_otp(cls, phone_e164, user=None, expiry_minutes=10, ip_address=None):
        # 6-digit cryptographically secure numeric OTP
        raw_otp = f"{secrets.randbelow(900000) + 100000}"
        otp_hash = hash_token(raw_otp)
        expires_at = timezone.now() + timedelta(minutes=expiry_minutes)
        obj = cls.objects.create(
            user=user,
            phone_e164=phone_e164,
            otp_hash=otp_hash,
            expires_at=expires_at,
            ip_address=ip_address
        )
        return obj, raw_otp

    @property
    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"OTP for {self.phone_e164} (Used={self.is_used}, Attempts={self.attempts})"


class AuthAuditLog(models.Model):
    """
    Security audit trail for authentication, recovery, and verification events.
    Contains strictly no credentials, plaintext OTPs, or sensitive Aadhaar data.
    """
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='auth_audit_logs')
    event_type = models.CharField(max_length=50, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    details = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp}] {self.event_type} - {self.user.email if self.user else 'Anonymous'}"
