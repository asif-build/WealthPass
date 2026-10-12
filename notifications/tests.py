import json
import uuid
from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.utils import timezone
from unittest.mock import patch

from .models import (
    Notification,
    NotificationPreference,
    PushSubscription,
    ExpoDeviceToken,
    NotificationCategory,
    NotificationType,
    NotificationPriority,
)
from .services import NotificationService, SAFE_INTERNAL_ROUTES


class NotificationSystemTestSuite(TestCase):
    """
    Comprehensive verification test suite for WealthPass Notification Architecture.
    Covers domain event generation, IDOR security, deduplication, preferences,
    safe routing, and multi-channel delivery.
    """

    def setUp(self):
        self.client = Client()
        self.other_client = Client()

        # Primary test user
        self.user = User.objects.create_user(
            username='user1@example.com',
            email='user1@example.com',
            password='Password@123',
            first_name='Rohan',
            last_name='Mehta'
        )

        # Secondary test user for IDOR testing
        self.other_user = User.objects.create_user(
            username='user2@example.com',
            email='user2@example.com',
            password='Password@123',
            first_name='Vikram',
            last_name='Singhania'
        )

        self.client.force_login(self.user)
        self.other_client.force_login(self.other_user)

    # 1. Notification creation from a real backend event
    def test_01_notification_creation_from_real_backend_event(self):
        notif = NotificationService.notify_account_created(self.user)
        self.assertIsNotNone(notif)
        self.assertEqual(notif.user, self.user)
        self.assertEqual(notif.event_type, 'ACCOUNT_CREATED')
        self.assertEqual(notif.category, NotificationCategory.ACCOUNT.value)
        self.assertEqual(notif.notification_type, NotificationType.SUCCESS.value)
        self.assertFalse(notif.is_read)

        # Verify database record
        saved = Notification.objects.get(id=notif.id)
        self.assertEqual(saved.title, 'Account Created')

    # 2. Persistence after refresh and relogin
    def test_02_persistence_after_refresh_and_relogin(self):
        notif = NotificationService.create_notification(
            user=self.user,
            event_type='TEST_PERSISTENCE',
            category=NotificationCategory.SYSTEM.value,
            title='Session Test',
            message='Should persist across relogins',
        )

        # Log out and log back in
        self.client.logout()
        self.client.force_login(self.user)

        res = self.client.get('/api/notifications/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        ids = [n['id'] for n in data['notifications']]
        self.assertIn(str(notif.id), ids)

    # 3. Correct unread count
    def test_03_correct_unread_count(self):
        NotificationService.create_notification(
            user=self.user,
            event_type='E1',
            category=NotificationCategory.DISCOVERY.value,
            title='Alert 1',
            message='Msg 1',
        )
        NotificationService.create_notification(
            user=self.user,
            event_type='E2',
            category=NotificationCategory.DISCOVERY.value,
            title='Alert 2',
            message='Msg 2',
        )

        res = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['unread_count'], 2)

    # 4. Mark-as-read functionality
    def test_04_mark_as_read_functionality(self):
        notif = NotificationService.create_notification(
            user=self.user,
            event_type='E1',
            category=NotificationCategory.DISCOVERY.value,
            title='Alert 1',
            message='Msg 1',
        )

        # Mark single notification as read
        res = self.client.post(f'/api/notifications/{notif.id}/read/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['is_read'])
        self.assertEqual(data['unread_count'], 0)

        notif.refresh_from_db()
        self.assertTrue(notif.is_read)
        self.assertIsNotNone(notif.read_at)

        # Create another and test mark-all-read
        NotificationService.create_notification(
            user=self.user,
            event_type='E2',
            category=NotificationCategory.DISCOVERY.value,
            title='Alert 2',
            message='Msg 2',
        )
        res_all = self.client.post('/api/notifications/mark-all-read/')
        self.assertEqual(res_all.status_code, 200)
        self.assertEqual(res_all.json()['unread_count'], 0)

    # 5. Cross-user access prevention (IDOR)
    def test_05_cross_user_access_prevention_idor(self):
        # Create notification for User 1
        notif_user1 = NotificationService.create_notification(
            user=self.user,
            event_type='PRIVATE_DATA',
            category=NotificationCategory.CLAIMS.value,
            title='Claim Update for User 1',
            message='Strictly confidential',
        )

        # User 2 attempts to mark User 1's notification as read
        res = self.other_client.post(f'/api/notifications/{notif_user1.id}/read/')
        self.assertIn(res.status_code, [403, 404])

        # User 2 attempts to archive User 1's notification
        res_arch = self.other_client.post(f'/api/notifications/{notif_user1.id}/archive/')
        self.assertIn(res_arch.status_code, [403, 404])

        # User 2's notification list must NOT contain User 1's notification
        res_list = self.other_client.get('/api/notifications/')
        self.assertEqual(res_list.status_code, 200)
        ids = [n['id'] for n in res_list.json()['notifications']]
        self.assertNotIn(str(notif_user1.id), ids)

    # 6. Invalid notification IDs
    def test_06_invalid_notification_ids(self):
        # Invalid non-UUID format
        res = self.client.post('/api/notifications/not-a-valid-uuid/read/')
        self.assertEqual(res.status_code, 400)

        # Non-existent UUID
        random_uuid = uuid.uuid4()
        res_404 = self.client.post(f'/api/notifications/{random_uuid}/read/')
        self.assertEqual(res_404.status_code, 404)

    # 7. Duplicate event handling / deduplication
    def test_07_duplicate_event_handling_deduplication(self):
        dedup_key = 'discovery_session_abc123'
        n1 = NotificationService.create_notification(
            user=self.user,
            event_type='DISCOVERY_INITIATED',
            category=NotificationCategory.DISCOVERY.value,
            title='Scanned Registry',
            message='First scan',
            deduplication_id=dedup_key,
        )
        self.assertIsNotNone(n1)

        # Duplicate dispatch attempt
        n2 = NotificationService.create_notification(
            user=self.user,
            event_type='DISCOVERY_INITIATED',
            category=NotificationCategory.DISCOVERY.value,
            title='Scanned Registry',
            message='Duplicate scan attempt',
            deduplication_id=dedup_key,
        )
        self.assertEqual(n1.id, n2.id)
        # Count must remain 1
        count = Notification.objects.filter(user=self.user, deduplication_id=dedup_key).count()
        self.assertEqual(count, 1)

    # 8. Failed email delivery handling
    def test_08_failed_email_delivery_handling(self):
        # Mock send_messages to raise exception
        with patch('django.core.mail.EmailMultiAlternatives.send', side_effect=Exception("SMTP Connection refused")):
            notif = NotificationService.create_notification(
                user=self.user,
                event_type='TEST_EMAIL_FAIL',
                category=NotificationCategory.ACCOUNT.value,
                title='Security Alert',
                message='Testing email failure resilience',
                dispatch_email=True,
            )
            # Notification is still persisted in DB despite email transport failure
            self.assertIsNotNone(notif)
            self.assertTrue(Notification.objects.filter(id=notif.id).exists())

    # 9. Realtime connection & polling fallback
    @patch('time.sleep', return_value=None)
    def test_09_realtime_connection_and_fallback(self, mock_sleep):
        # Polling endpoint works reliably
        res = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('unread_count', res.json())

        # SSE endpoint returns streaming content type
        res_sse = self.client.get('/api/notifications/stream/')
        self.assertEqual(res_sse.status_code, 200)
        self.assertEqual(res_sse['Content-Type'], 'text/event-stream')

    # 10. Push permission & web push subscription
    def test_10_push_permission_preferences(self):
        payload = {
            'endpoint': 'https://fcm.googleapis.com/fcm/send/sample-token-123',
            'keys': {
                'p256dh': 'BNcRdreAL...',
                'auth': 'tBHItDaK...'
            },
            'device_name': 'Chrome Desktop on Windows'
        }
        res = self.client.post(
            '/api/notifications/push/subscribe/',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()['success'])

        sub = PushSubscription.objects.get(user=self.user, endpoint=payload['endpoint'])
        self.assertTrue(sub.is_active)
        self.assertEqual(sub.device_name, 'Chrome Desktop on Windows')

    # 11. Expired push subscription or token cleanup
    def test_11_expired_push_subscription_or_token_cleanup(self):
        sub = PushSubscription.objects.create(
            user=self.user,
            endpoint='https://fcm.googleapis.com/fcm/send/old-token',
            p256dh_key='key',
            auth_secret='auth',
            is_active=True
        )
        res = self.client.post(
            '/api/notifications/push/unsubscribe/',
            data=json.dumps({'endpoint': sub.endpoint}),
            content_type='application/json'
        )
        self.assertEqual(res.status_code, 200)
        sub.refresh_from_db()
        self.assertFalse(sub.is_active)

    # 12. Notification preferences enforcement
    def test_12_notification_preferences_enforcement(self):
        prefs = NotificationService.get_user_preferences(self.user)
        # Disable discovery updates
        prefs.in_app_discovery_updates = False
        prefs.save()

        # Non-security discovery notification should be suppressed
        notif = NotificationService.create_notification(
            user=self.user,
            event_type='DISCOVERY_SUPPRESSED',
            category=NotificationCategory.DISCOVERY.value,
            title='Suppressed Item',
            message='Should not be created',
        )
        self.assertIsNone(notif)

        # Mandatory security notification MUST be created regardless of general prefs
        sec_notif = NotificationService.create_notification(
            user=self.user,
            event_type='SECURITY_ALERT',
            category=NotificationCategory.SECURITY.value,
            title='Mandatory Alert',
            message='Security events always deliver',
        )
        self.assertIsNotNone(sec_notif)

    # 13. Safe navigation route whitelist
    def test_13_safe_navigation_route_whitelist(self):
        # Whitelisted internal route accepted
        route1 = NotificationService.validate_safe_route('/relationship')
        self.assertEqual(route1, '/relationship')

        route2 = NotificationService.validate_safe_route('/discover-assets?session=123')
        self.assertEqual(route2, '/discover-assets?session=123')

        # Dangerous external or unwhitelisted routes rejected and defaulted safely
        bad_route = NotificationService.validate_safe_route('https://malicious-phishing.com/steal')
        self.assertEqual(bad_route, '/dashboard')

        xss_route = NotificationService.validate_safe_route('javascript:alert(1)')
        self.assertEqual(xss_route, '/dashboard')

    # 14. Logout and session expiration
    def test_14_logout_and_session_expiration(self):
        self.client.logout()

        # Accessing protected notification endpoints without session
        res = self.client.get('/api/notifications/')
        # @login_required redirects to login
        self.assertIn(res.status_code, [302, 401])

        res_count = self.client.get('/api/notifications/unread-count/')
        self.assertIn(res_count.status_code, [302, 401])

    # 15. Mobile Expo Push token registration
    def test_15_mobile_expo_token_registration(self):
        payload = {
            'expo_push_token': 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
            'device_platform': 'ios'
        }
        res = self.client.post(
            '/api/notifications/expo/register/',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()['success'])

        token_obj = ExpoDeviceToken.objects.get(user=self.user, expo_push_token=payload['expo_push_token'])
        self.assertEqual(token_obj.device_platform, 'ios')
        self.assertTrue(token_obj.is_active)
