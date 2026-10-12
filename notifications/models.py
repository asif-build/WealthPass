import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class NotificationCategory(models.TextChoices):
    ACCOUNT = 'ACCOUNT', 'Account & Security'
    DISCOVERY = 'DISCOVERY', 'Asset Discovery'
    RELATIONSHIP = 'RELATIONSHIP', 'Relationship Verification'
    CLAIMS = 'CLAIMS', 'Claims & Recovery'
    SECURITY = 'SECURITY', 'Security Alert'
    SYSTEM = 'SYSTEM', 'System Announcement'


class NotificationType(models.TextChoices):
    SUCCESS = 'SUCCESS', 'Success'
    INFO = 'INFO', 'Information'
    WARNING = 'WARNING', 'Warning'
    ERROR = 'ERROR', 'Error'
    PROCESSING = 'PROCESSING', 'Processing'
    ACTION_REQUIRED = 'ACTION_REQUIRED', 'Action Required'


class NotificationPriority(models.TextChoices):
    LOW = 'LOW', 'Low'
    MEDIUM = 'MEDIUM', 'Medium'
    HIGH = 'HIGH', 'High'
    URGENT = 'URGENT', 'Urgent'


class Notification(models.Model):
    """
    Persistent, auditable notification model for WealthPass.
    Supports in-app alerts, dynamic island web presentations,
    and mobile Expo push compatibility.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        db_index=True
    )
    event_type = models.CharField(max_length=100, db_index=True)
    category = models.CharField(
        max_length=50,
        choices=NotificationCategory.choices,
        default=NotificationCategory.SYSTEM,
        db_index=True
    )
    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
        default=NotificationType.INFO,
        db_index=True
    )
    priority = models.CharField(
        max_length=20,
        choices=NotificationPriority.choices,
        default=NotificationPriority.MEDIUM
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Optional link to related domain objects
    related_object_type = models.CharField(max_length=100, blank=True, null=True)
    related_object_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Safe navigation & action
    safe_internal_route = models.CharField(max_length=255, blank=True, null=True)
    action_label = models.CharField(max_length=100, blank=True, null=True)
    action_url = models.CharField(max_length=255, blank=True, null=True)
    
    # Read & Archive state
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True, db_index=True)
    is_archived = models.BooleanField(default=False, db_index=True)
    archived_at = models.DateTimeField(null=True, blank=True)
    
    # Multi-channel delivery telemetry (in_app, email, push, expo)
    delivery_status = models.JSONField(default=dict)
    
    # Deduplication key for idempotent dispatch
    deduplication_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', '-created_at']),
            models.Index(fields=['user', 'is_archived', '-created_at']),
            models.Index(fields=['user', 'category', '-created_at']),
        ]

    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at', 'updated_at'])

    def archive(self):
        if not self.is_archived:
            self.is_archived = True
            self.archived_at = timezone.now()
            self.save(update_fields=['is_archived', 'archived_at', 'updated_at'])

    def __str__(self):
        return f"[{self.notification_type}] {self.title} -> {self.user.username} ({'Read' if self.is_read else 'Unread'})"


class NotificationPreference(models.Model):
    """
    User notification preferences with granular channel and category toggles.
    Security alerts are mandatory and cannot be disabled.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )
    
    # Email Preferences
    email_account_security = models.BooleanField(default=True)  # Mandatory security emails
    email_discovery_updates = models.BooleanField(default=True)
    email_relationship_updates = models.BooleanField(default=True)
    email_claims_progress = models.BooleanField(default=True)
    
    # In-App Preferences
    in_app_discovery_updates = models.BooleanField(default=True)
    in_app_relationship_updates = models.BooleanField(default=True)
    in_app_claims_progress = models.BooleanField(default=True)
    
    # Web Push Preferences
    web_push_enabled = models.BooleanField(default=False)
    web_push_discovery = models.BooleanField(default=False)
    web_push_relationship = models.BooleanField(default=False)
    web_push_claims = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_category_enabled(self, category: str, channel: str = 'in_app') -> bool:
        if category in [NotificationCategory.SECURITY.value, NotificationCategory.ACCOUNT.value]:
            return True  # Security events are always delivered
            
        if channel == 'email':
            if category == NotificationCategory.DISCOVERY.value:
                return self.email_discovery_updates
            if category == NotificationCategory.RELATIONSHIP.value:
                return self.email_relationship_updates
            if category == NotificationCategory.CLAIMS.value:
                return self.email_claims_progress
            return True
            
        if channel == 'in_app':
            if category == NotificationCategory.DISCOVERY.value:
                return self.in_app_discovery_updates
            if category == NotificationCategory.RELATIONSHIP.value:
                return self.in_app_relationship_updates
            if category == NotificationCategory.CLAIMS.value:
                return self.in_app_claims_progress
            return True

        if channel == 'web_push':
            if not self.web_push_enabled:
                return False
            if category == NotificationCategory.DISCOVERY.value:
                return self.web_push_discovery
            if category == NotificationCategory.RELATIONSHIP.value:
                return self.web_push_relationship
            if category == NotificationCategory.CLAIMS.value:
                return self.web_push_claims
            return True

        return True

    def __str__(self):
        return f"Preferences for {self.user.username}"


class PushSubscription(models.Model):
    """
    Standard W3C Web Push subscription token storage.
    Enforces device isolation and user ownership.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='push_subscriptions',
        db_index=True
    )
    endpoint = models.TextField(db_index=True)
    p256dh_key = models.TextField()
    auth_secret = models.TextField()
    user_agent = models.TextField(blank=True)
    device_name = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"PushSub for {self.user.username} ({self.device_name or 'Web Browser'})"


class ExpoDeviceToken(models.Model):
    """
    Stores Expo Push notification tokens for future React Native/Expo mobile apps.
    Ensures seamless compatibility with expo-dynamic-notifications mobile client.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='expo_device_tokens',
        db_index=True
    )
    expo_push_token = models.CharField(max_length=255, db_index=True)
    device_platform = models.CharField(max_length=20, default='unknown')  # ios, android, web
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"ExpoToken for {self.user.username} ({self.device_platform})"
