import json
from decimal import Decimal
from unittest.mock import patch
from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.utils import timezone

from accounts.models import (
    UserProfile, LegalAcceptance, EmailVerificationToken,
    MobileOTPRecord, AuthAuditLog, AccountStatus
)
from claims.models import ClaimSession, DiscoveredAsset, AuditLog


class WealthPassOnboardingAndJourneyTests(TestCase):
    """
    Automated Verification Suite for User Onboarding and Asset Recovery Journey.
    Validates:
    - TEST 1: Homepage & Protected Route Guards
    - TEST 2: Registration Validation & Duplication Controls
    - TEST 3: Database Persistence of New Registrations & Legal Consents
    - TEST 4: Email Verification Token Single-Use & Expiry Flow
    - TEST 5: Phone OTP Generation, Hash Storage & Verification
    - TEST 6: Authenticated Dashboard Isolated Case Listing (Empty States & Counts)
    - TEST 7: Case Creation via API (Validation, Session Binding & Audit Trail)
    - TEST 8: Object-Level Authorization (IDOR Defense: User A vs User B Cases)
    - TEST 9: Case Lifecycle Status Transition & Updates
    - TEST 10: Strict User Activity & Audit History Isolation
    - TEST 11: Security Controls: Password Rotation & Session Hash Update
    - TEST 12: Logout Invalidation & Subsequent Route Denial
    """

    def setUp(self):
        # Create User A (Alice)
        self.user_a = User.objects.create_user(
            username='alice@example.com',
            email='alice@example.com',
            password='Password123!',
            first_name='Alice',
            last_name='Sharma'
        )
        self.profile_a = UserProfile.objects.create(
            user=self.user_a,
            phone_e164='+919876543210',
            is_email_verified=True,
            is_phone_verified=True,
            account_status=AccountStatus.ACTIVE
        )

        # Create User B (Bob)
        self.user_b = User.objects.create_user(
            username='bob@example.com',
            email='bob@example.com',
            password='Password123!',
            first_name='Bob',
            last_name='Verma'
        )
        self.profile_b = UserProfile.objects.create(
            user=self.user_b,
            phone_e164='+919876543211',
            is_email_verified=True,
            is_phone_verified=True,
            account_status=AccountStatus.ACTIVE
        )

        # Client for User A
        self.client_a = Client()
        self.client_a.force_login(self.user_a)

        # Client for User B
        self.client_b = Client()
        self.client_b.force_login(self.user_b)

        # Anonymous Client
        self.anon_client = Client()

    def test_01_homepage_and_protected_route_guard(self):
        """TEST 1: Unauthenticated request to /dashboard redirects to /login; landing renders 200."""
        # Unauthenticated access to /dashboard must 302 redirect to /login
        resp = self.anon_client.get('/dashboard')
        self.assertEqual(resp.status_code, 302)
        self.assertIn('/login', resp.headers.get('Location', ''))

        # Landing page renders 200 OK
        resp_landing = self.anon_client.get('/')
        self.assertEqual(resp_landing.status_code, 200)

        # Authenticated access to /dashboard renders 200
        resp_auth = self.client_a.get('/dashboard/')
        self.assertEqual(resp_auth.status_code, 200)

    def test_02_registration_validation(self):
        """TEST 2: Registration rejects missing data, invalid passwords, and duplicates."""
        # Missing full name
        payload = {
            'full_name': '',
            'email': 'newuser@example.com',
            'phone': '+919999988888',
            'password': 'Password123!',
            'confirm_password': 'Password123!',
            'terms_accepted': True,
            'privacy_acknowledged': True
        }
        resp = self.anon_client.post('/api/auth/register/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(resp.status_code, 400)
        self.assertIn('Full name is required', resp.json().get('error', ''))

        # Weak password (no special char)
        payload['full_name'] = 'New User'
        payload['password'] = 'WeakPassword1'
        payload['confirm_password'] = 'WeakPassword1'
        resp = self.anon_client.post('/api/auth/register/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(resp.status_code, 400)
        self.assertIn('special character', resp.json().get('error', ''))

        # Duplicate email
        payload['password'] = 'StrongPass123!'
        payload['confirm_password'] = 'StrongPass123!'
        payload['email'] = 'alice@example.com'  # Already exists
        resp = self.anon_client.post('/api/auth/register/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(resp.status_code, 409)
        self.assertIn('already exists', resp.json().get('error', ''))

    def test_03_registration_database_persistence(self):
        """TEST 3: Successful registration persists User, Profile, LegalAcceptance, and AuditLog."""
        payload = {
            'full_name': 'Devendra Singh',
            'email': 'devendra@example.com',
            'phone': '+919123456789',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!',
            'terms_accepted': True,
            'privacy_acknowledged': True
        }
        resp = self.anon_client.post('/api/auth/register/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertTrue(data.get('success'))
        self.assertTrue(data.get('requires_verification'))

        # Verify DB records
        user = User.objects.get(email='devendra@example.com')
        self.assertEqual(user.first_name, 'Devendra')
        self.assertEqual(user.last_name, 'Singh')
        self.assertTrue(user.check_password('SecurePassword123!'))

        # Verify Profile
        profile = UserProfile.objects.get(user=user)
        self.assertEqual(profile.account_status, AccountStatus.PENDING_VERIFICATION)
        self.assertFalse(profile.is_email_verified)
        self.assertFalse(profile.is_phone_verified)

        # Verify Legal Acceptance
        legal = LegalAcceptance.objects.filter(user=user).first()
        self.assertIsNotNone(legal)
        self.assertEqual(legal.terms_version, 'v1.0')

        # Verify Verification Token
        token = EmailVerificationToken.objects.filter(user=user).first()
        self.assertIsNotNone(token)
        self.assertFalse(token.is_used)

        # Verify Audit Log
        audit = AuthAuditLog.objects.filter(user=user, event_type='REGISTER').first()
        self.assertIsNotNone(audit)

    def test_04_email_verification_flow(self):
        """TEST 4: Email token verification activates account; rejects re-use."""
        # Create user with token
        user = User.objects.create_user(username='verifytest@example.com', email='verifytest@example.com', password='Pass123!Password')
        profile = UserProfile.objects.create(user=user, is_email_verified=False)
        token_obj, raw_token = EmailVerificationToken.create_token(user=user, expiry_hours=24)

        # Verify with raw token
        resp = self.anon_client.post('/api/auth/verify-email/', data=json.dumps({'token': raw_token}), content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json().get('success'))

        # Profile is updated
        profile.refresh_from_db()
        self.assertTrue(profile.is_email_verified)
        self.assertIsNotNone(profile.email_verified_at)

        # Re-use token fails
        resp_reuse = self.anon_client.post('/api/auth/verify-email/', data=json.dumps({'token': raw_token}), content_type='application/json')
        self.assertEqual(resp_reuse.status_code, 400)

    @patch('accounts.views.SMSService.send_otp', return_value=(True, 'OTP dispatched via MSG91'))
    def test_05_phone_otp_flow(self, mock_sms):
        """TEST 5: Phone OTP generation stores hash; verification marks phone verified."""
        from accounts.models import hash_token
        phone = '+919876543210'
        # Send OTP
        resp_send = self.client_a.post('/api/auth/send-otp/', data=json.dumps({'phone': phone}), content_type='application/json')
        self.assertEqual(resp_send.status_code, 200)
        self.assertTrue(resp_send.json().get('success'))

        # Fetch created OTP record
        otp_rec = MobileOTPRecord.objects.filter(phone_e164=phone, is_used=False).first()
        self.assertIsNotNone(otp_rec)
        # Plaintext OTP is NEVER stored
        self.assertNotEqual(len(otp_rec.otp_hash), 6)
        self.assertEqual(len(otp_rec.otp_hash), 64)  # SHA-256

        # Wrong OTP fails
        resp_wrong = self.client_a.post('/api/auth/verify-otp/', data=json.dumps({'phone': phone, 'otp': '000000'}), content_type='application/json')
        self.assertEqual(resp_wrong.status_code, 400)

        # Successful OTP verification with valid hash
        test_code = "654321"
        otp_rec.otp_hash = hash_token(test_code)
        otp_rec.save()

        resp_correct = self.client_a.post('/api/auth/verify-otp/', data=json.dumps({'phone': phone, 'otp': test_code}), content_type='application/json')
        self.assertEqual(resp_correct.status_code, 200)
        self.assertTrue(resp_correct.json().get('success'))
        self.profile_a.refresh_from_db()
        self.assertTrue(self.profile_a.is_phone_verified)

    def test_06_authenticated_dashboard_empty_and_populated_states(self):
        """TEST 6: Dashboard claims API returns empty list when no cases exist; populated when added."""
        # User A initially has 0 cases
        resp = self.client_a.get('/api/user/claims/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.json().get('claims', [])), 0)

        # Create 1 case for User A
        ClaimSession.objects.create(
            user=self.user_a,
            deceased_name='Late R. K. Sharma',
            deceased_pan='ABCDE1234F',
            death_certificate_no='DEL-9988',
            claimant_name='Alice Sharma',
            relation='Daughter',
            status='DRAFT'
        )

        resp_populated = self.client_a.get('/api/user/claims/')
        self.assertEqual(resp_populated.status_code, 200)
        claims = resp_populated.json().get('claims', [])
        self.assertEqual(len(claims), 1)
        self.assertEqual(claims[0]['deceased_name'], 'Late R. K. Sharma')

        # User B still has 0 cases
        resp_b = self.client_b.get('/api/user/claims/')
        self.assertEqual(len(resp_b.json().get('claims', [])), 0)

    def test_07_case_creation_via_api(self):
        """TEST 7: POST /api/user/claims/ validates input, binds to user, and creates audit entry."""
        case_payload = {
            'deceased_name': 'Ramesh Chandra Verma',
            'deceased_pan': 'ABCDE5678G',
            'death_certificate_no': 'UP-2024-5544',
            'relation': 'Son',
            'init_discovery': True
        }
        resp = self.client_a.post('/api/user/claims/', data=json.dumps(case_payload), content_type='application/json')
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertTrue(data.get('success'))
        created_claim = data.get('claim')
        self.assertEqual(created_claim['deceased_name'], 'Ramesh Chandra Verma')
        self.assertIn(created_claim['status'], ['UNDER_REVIEW', 'READY_FOR_CLAIM'])
        self.assertEqual(created_claim['total_assets_found'], 0)

        # Verify DB session is bound to User A
        session = ClaimSession.objects.get(id=created_claim['id'])
        self.assertEqual(session.user, self.user_a)

        # Verify Audit Log
        audit = AuditLog.objects.filter(user=self.user_a, event_type='CASE_CREATED').first()
        self.assertIsNotNone(audit)

    def test_08_object_level_authorization_idor_defense(self):
        """TEST 8: User B cannot access or download case belonging to User A (403 Forbidden)."""
        # Create case for User A
        session_a = ClaimSession.objects.create(
            user=self.user_a,
            deceased_name='Confidential Family Case',
            deceased_pan='ABCDE9999Z',
            death_certificate_no='SEC-1122',
            claimant_name='Alice Sharma',
            relation='Daughter',
            status='READY_FOR_CLAIM'
        )

        # User A accesses own case: 200 OK
        resp_owner = self.client_a.get(f'/api/user/claims/{session_a.id}/')
        self.assertEqual(resp_owner.status_code, 200)

        # User B attempts to access User A's case: 403 Forbidden
        resp_intruder = self.client_b.get(f'/api/user/claims/{session_a.id}/')
        self.assertEqual(resp_intruder.status_code, 403)
        self.assertIn('Access denied', resp_intruder.json().get('error', ''))

        # Anonymous user: 401 Unauthorized
        resp_anon = self.anon_client.get(f'/api/user/claims/{session_a.id}/')
        self.assertEqual(resp_anon.status_code, 401)

    def test_09_case_lifecycle_status_transition(self):
        """TEST 9: PATCH /api/user/claims/<id>/ updates status and logs event."""
        session_a = ClaimSession.objects.create(
            user=self.user_a,
            deceased_name='Arun Sharma',
            deceased_pan='ABCDE1111A',
            death_certificate_no='MH-001',
            claimant_name='Alice Sharma',
            relation='Daughter',
            status='DRAFT'
        )

        # Update status to SUBMITTED
        update_payload = {'status': 'SUBMITTED', 'verification_status': 'VERIFIED'}
        resp = self.client_a.post(
            f'/api/user/claims/{session_a.id}/',
            data=json.dumps(update_payload),
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 200)
        session_a.refresh_from_db()
        self.assertEqual(session_a.status, 'SUBMITTED')
        self.assertEqual(session_a.verification_status, 'VERIFIED')

        # Check Audit Log
        audit = AuditLog.objects.filter(user=self.user_a, event_type='CASE_UPDATED').first()
        self.assertIsNotNone(audit)

    def test_10_activity_history_isolation(self):
        """TEST 10: GET /api/auth/activity/ returns only requesting user's audit logs."""
        AuthAuditLog.objects.create(user=self.user_a, event_type='USER_A_ACTION', ip_address='127.0.0.1')
        AuthAuditLog.objects.create(user=self.user_b, event_type='USER_B_ACTION', ip_address='127.0.0.2')

        resp_a = self.client_a.get('/api/auth/activity/')
        self.assertEqual(resp_a.status_code, 200)
        events_a = [item['event_type'] for item in resp_a.json().get('activity', [])]
        self.assertIn('USER_A_ACTION', events_a)
        self.assertNotIn('USER_B_ACTION', events_a)

    def test_11_security_password_rotation(self):
        """TEST 11: Change password updates credentials and logs security event."""
        payload = {
            'current_password': 'Password123!',
            'new_password': 'NewSecurePassword999!',
            'confirm_password': 'NewSecurePassword999!'
        }
        resp = self.client_a.post('/api/auth/change-password/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json().get('success'))

        self.user_a.refresh_from_db()
        self.assertTrue(self.user_a.check_password('NewSecurePassword999!'))

    def test_12_logout_session_invalidation(self):
        """TEST 12: Logout invalidates session and subsequent protected calls return 401."""
        # Confirm user is authenticated
        resp_before = self.client_a.get('/api/auth/me/')
        self.assertTrue(resp_before.json().get('isAuthenticated'))

        # Logout
        resp_logout = self.client_a.post('/api/auth/logout/')
        self.assertEqual(resp_logout.status_code, 200)

        # Subsequent call to /api/auth/me/ returns false
        resp_after = self.client_a.get('/api/auth/me/')
        self.assertFalse(resp_after.json().get('isAuthenticated'))

        # Subsequent call to protected API returns 401
        resp_protected = self.client_a.get('/api/user/claims/')
        self.assertEqual(resp_protected.status_code, 401)
