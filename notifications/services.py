import logging
import re
from typing import Optional, Dict, Any, List
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.utils import timezone
from django.utils.html import escape

from .models import (
    Notification,
    NotificationPreference,
    NotificationCategory,
    NotificationType,
    NotificationPriority,
    PushSubscription,
    ExpoDeviceToken,
)

logger = logging.getLogger(__name__)

# Strict Whitelist of internal routes to prevent open redirects or unsafe actions
SAFE_INTERNAL_ROUTES = {
    '/dashboard',
    '/relationship',
    '/discover-assets',
    '/claim',
    '/sources',
    '/verify',
    '/login',
    '/register',
    '/terms',
    '/privacy-policy',
}


class NotificationService:
    """
    Enterprise Notification Dispatcher & Management Engine for WealthPass.
    Handles persistence, channel routing (In-App, Email, Web Push, Expo),
    security sanitization, deduplication, and user preferences.
    """

    @classmethod
    def sanitize_text(cls, text: str) -> str:
        """
        Prevents accidental leakage of raw Aadhaar numbers, OTP tokens, or credentials.
        """
        if not text:
            return ""
        # Mask 12-digit numbers (potential Aadhaar)
        masked = re.sub(r'\b\d{4}\s?\d{4}\s?\d{4}\b', 'XXXX XXXX XXXX', str(text))
        # Mask 6-digit standalone numbers (potential OTPs) in alert bodies
        masked = re.sub(r'(?i)\b(otp|code|pin)\s*[:=]?\s*(\d{6})\b', r'\1: ******', masked)
        return masked

    @classmethod
    def validate_safe_route(cls, route: Optional[str]) -> Optional[str]:
        """
        Validates internal route against the application's strict whitelist.
        Disallows external URLs or arbitrary redirects.
        """
        if not route:
            return None
        clean_route = route.strip().split('?')[0].rstrip('/')
        if not clean_route:
            clean_route = '/'
            
        # Check base path against whitelist
        if clean_route in SAFE_INTERNAL_ROUTES or clean_route == '/':
            return route
            
        # Also support sub-paths like /how-it-works/verify-match
        if clean_route.startswith('/how-it-works'):
            return route

        logger.warning(f"Unsafe route rejected by NotificationService: {route}")
        return '/dashboard'

    @classmethod
    def get_user_preferences(cls, user) -> NotificationPreference:
        """Fetches or initializes user notification preferences."""
        prefs, _ = NotificationPreference.objects.get_or_create(user=user)
        return prefs

    @classmethod
    def create_notification(
        cls,
        user,
        event_type: str,
        category: str,
        title: str,
        message: str,
        notification_type: str = NotificationType.INFO.value,
        priority: str = NotificationPriority.MEDIUM.value,
        related_object_type: Optional[str] = None,
        related_object_id: Optional[str] = None,
        safe_internal_route: Optional[str] = None,
        action_label: Optional[str] = None,
        deduplication_id: Optional[str] = None,
        dispatch_email: bool = False,
        dispatch_push: bool = False,
    ) -> Optional[Notification]:
        """
        Primary entry point to create and dispatch a real persistent notification.
        Persists record, respects user preferences, and routes through configured channels.
        """
        if not user or not user.is_authenticated:
            logger.warning("Attempted to send notification to unauthenticated user.")
            return None

        # Check deduplication
        if deduplication_id:
            existing = Notification.objects.filter(
                user=user,
                deduplication_id=deduplication_id,
                created_at__gte=timezone.now() - timezone.timedelta(hours=24)
            ).first()
            if existing:
                logger.info(f"Duplicate notification suppressed: {deduplication_id} for user {user.id}")
                return existing

        prefs = cls.get_user_preferences(user)

        # Check in-app category preference
        if not prefs.is_category_enabled(category, channel='in_app'):
            logger.info(f"Notification in_app channel disabled by user prefs: {category}")
            return None

        sanitized_title = cls.sanitize_text(title)
        sanitized_msg = cls.sanitize_text(message)
        valid_route = cls.validate_safe_route(safe_internal_route)

        delivery_telemetry: Dict[str, Any] = {
            'in_app': 'DELIVERED',
            'created_at': timezone.now().isoformat(),
        }

        # Persist notification
        notification = Notification.objects.create(
            user=user,
            event_type=event_type,
            category=category,
            notification_type=notification_type,
            priority=priority,
            title=sanitized_title,
            message=sanitized_msg,
            related_object_type=related_object_type,
            related_object_id=str(related_object_id) if related_object_id else None,
            safe_internal_route=valid_route,
            action_label=action_label,
            action_url=valid_route,
            deduplication_id=deduplication_id,
            delivery_status=delivery_telemetry,
        )

        # Transaction hook for external channel dispatch
        def dispatch_channels():
            # 1. Email Delivery
            if dispatch_email and prefs.is_category_enabled(category, channel='email'):
                email_status = cls._send_email_notification(user, notification)
                notification.delivery_status['email'] = email_status
            else:
                notification.delivery_status['email'] = 'SKIPPED_PREFERENCE'

            # 2. Web Push Delivery
            if dispatch_push and prefs.is_category_enabled(category, channel='web_push'):
                push_status = cls._send_web_push(user, notification)
                notification.delivery_status['web_push'] = push_status
            else:
                notification.delivery_status['web_push'] = 'SKIPPED_PREFERENCE'

            # 3. Expo Mobile Push Delivery (Prepared for future Expo mobile app)
            expo_status = cls._send_expo_push(user, notification)
            notification.delivery_status['expo_push'] = expo_status

            notification.save(update_fields=['delivery_status'])

        transaction.on_commit(dispatch_channels)
        return notification

    # =========================================================================
    # CHANNEL DISPATCH ADAPTERS
    # =========================================================================

    @classmethod
    def _send_email_notification(cls, user, notification: Notification) -> str:
        """
        Dispatches email alert via Django email backend with dark WealthPass branding.
        """
        if not user.email:
            return 'SKIPPED_NO_EMAIL'

        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'wealthpass.official@gmail.com')
        support_email = getattr(settings, 'CONTACT_EMAIL', 'wealthpass.official@gmail.com')
        recipient = user.email

        subject = f"[WealthPass] {notification.title}"
        full_name = escape(user.get_full_name() or user.username)

        text_content = f"""Hello {full_name},

{notification.title}
------------------------------------------------------------------------
{notification.message}

Category: {notification.category}
Priority: {notification.priority}
Timestamp: {notification.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}

Log in to your WealthPass portal to review details:
https://wealthpass.in/dashboard

If you have any questions, contact us at {support_email}.

WealthPass Technologies Pvt. Ltd.
"""

        html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{escape(notification.title)}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0b0b; color: #E1E0CC; margin: 0; padding: 40px 20px; }}
    .container {{ max-width: 560px; margin: 0 auto; background: #121212; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 36px; }}
    .badge {{ display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(225, 224, 204, 0.1); color: #E1E0CC; margin-bottom: 16px; }}
    .title {{ font-size: 20px; font-weight: 600; color: #FFFFFF; margin: 0 0 14px 0; }}
    .message {{ font-size: 14px; line-height: 1.6; color: #A3A398; margin: 0 0 24px 0; }}
    .btn {{ display: inline-block; background: #E1E0CC; color: #000000; padding: 12px 24px; border-radius: 9999px; font-size: 13px; font-weight: 600; text-decoration: none; }}
    .footer {{ margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #66665E; text-align: center; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">{escape(notification.category)} &bull; {escape(notification.notification_type)}</div>
    <h1 class="title">{escape(notification.title)}</h1>
    <p class="message">{escape(notification.message)}</p>
    <a href="https://wealthpass.in/dashboard" class="btn">View in Dashboard &rarr;</a>
    <div class="footer">
      WealthPass Technologies Pvt. Ltd. &bull; Official Bereaved Asset Discovery Platform<br>
      Automated system dispatch. Please do not reply directly to this email.
    </div>
  </div>
</body>
</html>
"""

        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email,
                to=[recipient]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=False)
            return 'SENT'
        except Exception as e:
            logger.error(f"Failed to deliver notification email to {recipient}: {e}")
            return f"FAILED: {str(e)[:50]}"

    @classmethod
    def _send_web_push(cls, user, notification: Notification) -> str:
        """
        Web Push delivery adapter via active user PushSubscriptions.
        """
        subs = PushSubscription.objects.filter(user=user, is_active=True)
        if not subs.exists():
            return 'SKIPPED_NO_SUBSCRIPTION'

        # Record delivery attempt
        subs.update(last_used_at=timezone.now())
        return 'READY_FOR_VAPID_DISPATCH'

    @classmethod
    def _send_expo_push(cls, user, notification: Notification) -> str:
        """
        Expo Push delivery adapter. Packages payload compatible with
        expo-dynamic-notifications on React Native.
        """
        tokens = ExpoDeviceToken.objects.filter(user=user, is_active=True)
        if not tokens.exists():
            return 'SKIPPED_NO_EXPO_DEVICE'

        # Payload formatted for expo-dynamic-notifications
        expo_payload = {
            'to': [t.expo_push_token for t in tokens],
            'title': notification.title,
            'body': notification.message,
            'data': {
                'notification_id': str(notification.id),
                'category': notification.category,
                'type': notification.notification_type,
                'route': notification.safe_internal_route,
                'action_label': notification.action_label,
            },
            'sound': 'default',
            'priority': 'high' if notification.priority in ['HIGH', 'URGENT'] else 'normal',
        }
        logger.info(f"Expo dynamic notification prepared for user {user.id}: {expo_payload['title']}")
        return 'QUEUED_FOR_EXPO'

    # =========================================================================
    # DOMAIN EVENT GENERATORS (PHASE 4)
    # =========================================================================

    # 1. ACCOUNT EVENTS
    @classmethod
    def notify_account_created(cls, user):
        return cls.create_notification(
            user=user,
            event_type='ACCOUNT_CREATED',
            category=NotificationCategory.ACCOUNT.value,
            notification_type=NotificationType.SUCCESS.value,
            title='Account Created',
            message='Welcome to WealthPass. Your secure asset recovery account is active.',
            safe_internal_route='/dashboard',
            deduplication_id=f"acct_created_{user.id}",
            dispatch_email=True,
        )

    @classmethod
    def notify_email_verified(cls, user):
        return cls.create_notification(
            user=user,
            event_type='EMAIL_VERIFIED',
            category=NotificationCategory.ACCOUNT.value,
            notification_type=NotificationType.SUCCESS.value,
            title='Email Verified',
            message='Your email address has been successfully verified.',
            safe_internal_route='/dashboard',
            deduplication_id=f"email_verified_{user.id}",
            dispatch_email=True,
        )

    @classmethod
    def notify_phone_verified(cls, user, masked_phone: str = ""):
        phone_txt = f" for {masked_phone}" if masked_phone else ""
        return cls.create_notification(
            user=user,
            event_type='PHONE_VERIFIED',
            category=NotificationCategory.ACCOUNT.value,
            notification_type=NotificationType.SUCCESS.value,
            title='Phone Verification Complete',
            message=f'Mobile phone verification{phone_txt} completed successfully.',
            safe_internal_route='/dashboard',
            deduplication_id=f"phone_verified_{user.id}",
            dispatch_email=False,
        )

    @classmethod
    def notify_password_reset(cls, user):
        return cls.create_notification(
            user=user,
            event_type='PASSWORD_RESET',
            category=NotificationCategory.SECURITY.value,
            notification_type=NotificationType.WARNING.value,
            priority=NotificationPriority.HIGH.value,
            title='Password Reset Successful',
            message='Your WealthPass account password was reset. If you did not authorize this, terminate sessions immediately.',
            safe_internal_route='/dashboard',
            action_label='Review Security',
            dispatch_email=True,
        )

    @classmethod
    def notify_security_settings_changed(cls, user, detail: str = "Password updated"):
        return cls.create_notification(
            user=user,
            event_type='SECURITY_SETTINGS_CHANGED',
            category=NotificationCategory.SECURITY.value,
            notification_type=NotificationType.INFO.value,
            priority=NotificationPriority.HIGH.value,
            title='Security Settings Updated',
            message=f'Account security event: {detail}.',
            safe_internal_route='/dashboard',
            dispatch_email=True,
        )

    # 2. ASSET DISCOVERY EVENTS
    @classmethod
    def notify_discovery_initiated(cls, user, session_id: Any, deceased_name: str):
        return cls.create_notification(
            user=user,
            event_type='DISCOVERY_INITIATED',
            category=NotificationCategory.DISCOVERY.value,
            notification_type=NotificationType.PROCESSING.value,
            title='Asset Discovery Initiated',
            message=f'Initiated discovery queries across statutory registries for deceased person {deceased_name}.',
            related_object_type='ClaimSession',
            related_object_id=str(session_id),
            safe_internal_route='/dashboard',
            action_label='View Progress',
            deduplication_id=f"disc_init_{session_id}",
        )

    @classmethod
    def notify_discovery_completed(cls, user, session_id: Any, count: int, total_amount: float):
        return cls.create_notification(
            user=user,
            event_type='DISCOVERY_COMPLETED',
            category=NotificationCategory.DISCOVERY.value,
            notification_type=NotificationType.SUCCESS.value if count > 0 else NotificationType.INFO.value,
            title='Asset Discovery Query Finished',
            message=f'Discovery completed. {count} statutory sources reviewed. Estimated potential pool: ₹{total_amount:,.2f}.',
            related_object_type='ClaimSession',
            related_object_id=str(session_id),
            safe_internal_route='/dashboard',
            action_label='Review Findings',
            dispatch_email=True,
        )

    @classmethod
    def notify_potential_match_found(cls, user, session_id: Any, institution: str, amount: float):
        return cls.create_notification(
            user=user,
            event_type='POTENTIAL_MATCH_FOUND',
            category=NotificationCategory.DISCOVERY.value,
            notification_type=NotificationType.SUCCESS.value,
            priority=NotificationPriority.HIGH.value,
            title='Potential Asset Match Detected',
            message=f'A potential dormant balance of ₹{amount:,.2f} identified at {institution}. Official verification required.',
            related_object_type='ClaimSession',
            related_object_id=str(session_id),
            safe_internal_route='/dashboard',
            action_label='View Details',
            dispatch_email=True,
            dispatch_push=True,
        )

    @classmethod
    def notify_source_unavailable(cls, user, source_name: str, reason: str = ""):
        extra = f" ({reason})" if reason else ""
        return cls.create_notification(
            user=user,
            event_type='SOURCE_UNAVAILABLE',
            category=NotificationCategory.DISCOVERY.value,
            notification_type=NotificationType.WARNING.value,
            title=f'{source_name} Requires External Filing',
            message=f'{source_name} does not offer automated direct APIs{extra}. Official offline steps and petitions are provided.',
            safe_internal_route='/sources',
            action_label='View Guide',
        )

    # 3. RELATIONSHIP VERIFICATION EVENTS
    @classmethod
    def notify_evidence_uploaded(cls, user, filename: str, session_id: Optional[Any] = None):
        return cls.create_notification(
            user=user,
            event_type='EVIDENCE_UPLOADED',
            category=NotificationCategory.RELATIONSHIP.value,
            notification_type=NotificationType.INFO.value,
            title='Evidence Document Uploaded',
            message=f'Document {filename} uploaded successfully and queued for statutory OCR extraction.',
            related_object_type='ClaimSession' if session_id else None,
            related_object_id=str(session_id) if session_id else None,
            safe_internal_route='/relationship',
            action_label='Check Status',
        )

    @classmethod
    def notify_document_processed(cls, user, filename: str, has_keyword: bool):
        return cls.create_notification(
            user=user,
            event_type='DOCUMENT_PROCESSED',
            category=NotificationCategory.RELATIONSHIP.value,
            notification_type=NotificationType.SUCCESS.value if has_keyword else NotificationType.WARNING.value,
            title='Document Processing Complete',
            message=f'OCR text extraction finished for {filename}. Key institutional markers detected: {"Yes" if has_keyword else "Needs Review"}.',
            safe_internal_route='/relationship',
            action_label='View Evidence',
        )

    @classmethod
    def notify_relationship_status_changed(cls, user, session_id: Any, old_status: str, new_status: str, reason: str = ""):
        is_verified = (new_status == 'VERIFIED')
        is_clarification = (new_status == 'NEEDS_CLARIFICATION')
        is_rejected = (new_status == 'REJECTED')
        
        ntype = NotificationType.SUCCESS.value if is_verified else (
            NotificationType.ACTION_REQUIRED.value if is_clarification else (
                NotificationType.ERROR.value if is_rejected else NotificationType.INFO.value
            )
        )
        prio = NotificationPriority.HIGH.value if (is_verified or is_clarification or is_rejected) else NotificationPriority.MEDIUM.value

        reason_txt = f" Note: {reason}" if reason else ""
        return cls.create_notification(
            user=user,
            event_type='RELATIONSHIP_STATUS_CHANGED',
            category=NotificationCategory.RELATIONSHIP.value,
            notification_type=ntype,
            priority=prio,
            title=f'Relationship Status: {new_status.replace("_", " ").title()}',
            message=f'Claimant verification transitioned from {old_status} to {new_status}.{reason_txt}',
            related_object_type='ClaimSession',
            related_object_id=str(session_id),
            safe_internal_route='/relationship',
            action_label='Review Claim',
            dispatch_email=True,
            dispatch_push=True,
        )

    # 4. CLAIMS EVENTS
    @classmethod
    def notify_claim_prepared(cls, user, session_id: Any, asset_name: str):
        return cls.create_notification(
            user=user,
            event_type='CLAIM_PREPARED',
            category=NotificationCategory.CLAIMS.value,
            notification_type=NotificationType.SUCCESS.value,
            title='Claim Petition Docket Ready',
            message=f'Statutory claim documentation and checklist prepared for {asset_name}. Ready for filing.',
            related_object_type='ClaimSession',
            related_object_id=str(session_id),
            safe_internal_route='/claim',
            action_label='View Docket',
            dispatch_email=True,
        )

    @classmethod
    def notify_claim_submitted(cls, user, session_id: Any, reference_id: str):
        return cls.create_notification(
            user=user,
            event_type='CLAIM_SUBMITTED',
            category=NotificationCategory.CLAIMS.value,
            notification_type=NotificationType.SUCCESS.value,
            priority=NotificationPriority.HIGH.value,
            title='Claim Formally Submitted',
            message=f'Statutory claim docket recorded under reference {reference_id}. Tracking active.',
            related_object_type='ClaimSession',
            related_object_id=str(session_id),
            safe_internal_route='/dashboard',
            action_label='Track Claim',
            dispatch_email=True,
            dispatch_push=True,
        )

    @classmethod
    def notify_documents_requested(cls, user, session_id: Any, missing_docs: List[str]):
        docs_txt = ", ".join(missing_docs[:3])
        return cls.create_notification(
            user=user,
            event_type='DOCUMENTS_REQUESTED',
            category=NotificationCategory.CLAIMS.value,
            notification_type=NotificationType.ACTION_REQUIRED.value,
            priority=NotificationPriority.HIGH.value,
            title='Additional Evidence Required',
            message=f'The reviewing institution has requested additional documentation: {docs_txt}.',
            related_object_type='ClaimSession',
            related_object_id=str(session_id),
            safe_internal_route='/relationship',
            action_label='Upload Documents',
            dispatch_email=True,
            dispatch_push=True,
        )

    @classmethod
    def notify_recovery_confirmed(cls, user, session_id: Any, amount: float, institution: str):
        return cls.create_notification(
            user=user,
            event_type='RECOVERY_CONFIRMED',
            category=NotificationCategory.CLAIMS.value,
            notification_type=NotificationType.SUCCESS.value,
            priority=NotificationPriority.URGENT.value,
            title='Asset Recovery Confirmed',
            message=f'Transmission of ₹{amount:,.2f} confirmed from {institution}. Funds released according to statutory probate.',
            related_object_type='ClaimSession',
            related_object_id=str(session_id),
            safe_internal_route='/dashboard',
            action_label='View Settlement',
            dispatch_email=True,
            dispatch_push=True,
        )
