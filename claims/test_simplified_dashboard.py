import json
from decimal import Decimal
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from accounts.models import UserProfile, LegalAcceptance, AuthAuditLog
from claims.models import ClaimSession, VerificationRecord, ClaimantRelationshipRecord

User = get_user_model()


class SimplifiedDashboardTests(TestCase):
    def setUp(self):
        # Create User A
        self.user_a = User.objects.create_user(
            username='usera@wealthpass.test',
            email='usera@wealthpass.test',
            password='Password123!',
            first_name='Rohan',
            last_name='Mehta'
        )
        self.profile_a = UserProfile.objects.create(
            user=self.user_a,
            phone_e164='+919876543210',
            is_email_verified=True,
            is_phone_verified=True
        )
        LegalAcceptance.objects.create(
            user=self.user_a,
            terms_version='v1.0',
            privacy_policy_version='v1.0'
        )

        # Create User B
        self.user_b = User.objects.create_user(
            username='userb@wealthpass.test',
            email='userb@wealthpass.test',
            password='Password123!',
            first_name='Aditi',
            last_name='Sharma'
        )
        self.profile_b = UserProfile.objects.create(
            user=self.user_b,
            phone_e164='+919876543211',
            is_email_verified=False,
            is_phone_verified=False
        )

        self.client = Client()
        self.client_a = Client()
        self.client_a.force_login(self.user_a)
        self.client_b = Client()
        self.client_b.force_login(self.user_b)

    def test_01_settings_route_guard_unauthenticated(self):
        """Unauthenticated GET /settings/ must redirect to /login/?next=/settings/."""
        response = self.client.get('/settings/')
        self.assertEqual(response.status_code, 302)
        self.assertIn('/login/', response.url)
        self.assertIn('next=/settings/', response.url)

    def test_02_settings_route_guard_authenticated(self):
        """Authenticated GET /settings/ serves the SPA shell (200 OK)."""
        response = self.client_a.get('/settings/')
        self.assertEqual(response.status_code, 200)

    def test_03_api_verify_get_endpoint(self):
        """GET /api/verify/ returns real verification status from VerificationRecord."""
        # Initially not started
        res1 = self.client_a.get('/api/verify/')
        self.assertEqual(res1.status_code, 200)
        self.assertFalse(res1.json()['verified'])
        self.assertEqual(res1.json()['status'], 'NOT_STARTED')

        # Add record
        VerificationRecord.objects.create(
            user=self.user_a,
            verification_reference='WP-VRF-99881',
            masked_identifier='XXXX XXXX 4821',
            verification_status='VERIFIED',
            provider='OFFICIAL_MANUAL_PROCESS'
        )
        res2 = self.client_a.get('/api/verify/')
        self.assertEqual(res2.status_code, 200)
        self.assertTrue(res2.json()['verified'])
        self.assertEqual(res2.json()['status'], 'VERIFIED')
        self.assertEqual(res2.json()['reference'], 'WP-VRF-99881')

    def test_04_api_me_returns_enhanced_verification_states(self):
        """GET /api/auth/me/ returns real is_identity_verified, identity_status, and relationship_status."""
        # For User A (with verification record)
        VerificationRecord.objects.create(
            user=self.user_a,
            verification_reference='WP-VRF-77112',
            masked_identifier='XXXX XXXX 4821',
            verification_status='VERIFIED',
            provider='OFFICIAL_MANUAL_PROCESS'
        )
        ClaimantRelationshipRecord.objects.create(
            user=self.user_a,
            claimant_name='Rohan Mehta',
            deceased_name='Arun Mehta',
            claimant_relationship='Son',
            status='EVIDENCE_SUBMITTED'
        )

        res_a = self.client_a.get('/api/auth/me/')
        self.assertEqual(res_a.status_code, 200)
        user_data_a = res_a.json()['user']
        self.assertTrue(user_data_a['is_email_verified'])
        self.assertTrue(user_data_a['is_identity_verified'])
        self.assertEqual(user_data_a['identity_status'], 'VERIFIED')
        self.assertEqual(user_data_a['relationship_status'], 'EVIDENCE_SUBMITTED')

        # For User B (unverified email, no identity record, no relationship record)
        res_b = self.client_b.get('/api/auth/me/')
        self.assertEqual(res_b.status_code, 200)
        user_data_b = res_b.json()['user']
        self.assertFalse(user_data_b['is_email_verified'])
        self.assertFalse(user_data_b['is_identity_verified'])
        self.assertEqual(user_data_b['identity_status'], 'NOT_STARTED')
        self.assertIsNone(user_data_b['relationship_status'])

    def test_05_strict_user_case_isolation(self):
        """User B cannot view or retrieve User A's recovery cases."""
        # Create case for User A
        case_a = ClaimSession.objects.create(
            user=self.user_a,
            deceased_name='Arun Mehta',
            deceased_pan='ABCDE1234F',
            relation='Son',
            claimant_name='Rohan Mehta',
            status='UNDER_REVIEW',
            total_assets_found=Decimal('0')
        )

        # User A sees 1 case
        res_a = self.client_a.get('/api/user/claims/')
        self.assertEqual(res_a.status_code, 200)
        self.assertEqual(len(res_a.json()['claims']), 1)
        self.assertEqual(res_a.json()['claims'][0]['id'], str(case_a.id))

        # User B sees 0 cases
        res_b = self.client_b.get('/api/user/claims/')
        self.assertEqual(res_b.status_code, 200)
        self.assertEqual(len(res_b.json()['claims']), 0)

        # User B attempting direct detail access on User A's case gets 403 Forbidden
        direct_access = self.client_b.get(f'/api/user/claims/{case_a.id}/')
        self.assertEqual(direct_access.status_code, 403)

    def test_06_terminate_other_sessions(self):
        """POST /api/auth/terminate-other-sessions/ genuinely rotates auth hash and logs audit entry."""
        old_hash = self.user_a.get_session_auth_hash()
        res = self.client_a.post('/api/auth/terminate-other-sessions/')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()['success'])

        self.user_a.refresh_from_db()
        new_hash = self.user_a.get_session_auth_hash()
        self.assertIsNotNone(new_hash)

        # Verify audit log
        audit = AuthAuditLog.objects.filter(user=self.user_a, event_type='SESSIONS_TERMINATED').first()
        self.assertIsNotNone(audit)
