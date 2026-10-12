import json
import time
from datetime import timedelta
from decimal import Decimal
from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from accounts.models import UserProfile, AuthAuditLog
from claims.models import ClaimSession, DiscoveredAsset, AuditLog


class WealthPassSecurityHardeningTests(TestCase):
    """
    Automated Penetration & Security Isolation Tests (TEST A to TEST M)
    Validates:
    - Object-Level Authorization (IDOR)
    - Cross-Account Isolation
    - Session Invalidation & Inactivity Timeout
    - Document Download Authorization
    - Security Headers & Anti-Cache Controls
    - Audit Trail Transparency (No Plaintext Secrets)
    """

    def setUp(self):
        # Create User A
        self.user_a = User.objects.create_user(
            username='usera@example.com',
            email='usera@example.com',
            password='Password123!',
            first_name='Alice',
            last_name='Sharma'
        )
        self.profile_a = UserProfile.objects.create(
            user=self.user_a,
            phone_e164='+919876543210',
            is_email_verified=True,
            is_phone_verified=True
        )

        # Create User B
        self.user_b = User.objects.create_user(
            username='userb@example.com',
            email='userb@example.com',
            password='Password123!',
            first_name='Bob',
            last_name='Verma'
        )
        self.profile_b = UserProfile.objects.create(
            user=self.user_b,
            phone_e164='+919876543211',
            is_email_verified=True,
            is_phone_verified=True
        )

        # Create Staff / Reviewer User
        self.staff_user = User.objects.create_user(
            username='admin@wealthpass.com',
            email='admin@wealthpass.com',
            password='AdminPassword123!',
            first_name='Admin',
            last_name='Officer',
            is_staff=True
        )

        # Test document for User A's claim
        test_pdf = SimpleUploadedFile("death_cert_alice.pdf", b"%PDF-1.4 sample death certificate content", content_type="application/pdf")

        # Claim Session owned by User A
        self.claim_a = ClaimSession.objects.create(
            user=self.user_a,
            deceased_name='Late Suresh Sharma',
            deceased_pan='ABCDE1234F',
            death_certificate_no='DC-2024-9988',
            death_certificate_file=test_pdf,
            claimant_name='Alice Sharma',
            claimant_aadhaar_last4='4821',
            relation='Daughter',
            verification_status='VERIFIED',
            fraud_risk_level='LOW',
            total_assets_found=Decimal('500000'),
            bridge_loan_available=Decimal('38000')
        )
        DiscoveredAsset.objects.create(
            session=self.claim_a,
            institution='LIC India',
            amount=Decimal('500000'),
            situation_label='Direct Nominee',
            color='green',
            message='Active policy located.',
            documents_needed=['Form 3783'],
            next_steps=['Submit to branch'],
            time_estimate='4 weeks',
            loan_amount=Decimal('38000')
        )

        # Claim Session owned by User B
        self.claim_b = ClaimSession.objects.create(
            user=self.user_b,
            deceased_name='Late Ramesh Verma',
            deceased_pan='XYZPK5678Q',
            death_certificate_no='DC-2024-1122',
            claimant_name='Bob Verma',
            claimant_aadhaar_last4='9933',
            relation='Son',
            verification_status='VERIFIED',
            fraud_risk_level='LOW',
            total_assets_found=Decimal('250000'),
            bridge_loan_available=Decimal('15000')
        )

        # HTTP Clients
        self.client_a = Client()
        self.client_a.force_login(self.user_a)

        self.client_b = Client()
        self.client_b.force_login(self.user_b)

        self.anon_client = Client()

    def test_a_user_can_access_own_profile_and_claims(self):
        """TEST A: User A can access own profile and claims."""
        resp = self.client_a.get('/api/auth/me/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data['isAuthenticated'])
        self.assertEqual(data['user']['email'], 'usera@example.com')

        # User A checks claims
        resp_claims = self.client_a.get('/api/user/claims/')
        self.assertEqual(resp_claims.status_code, 200)
        claims = resp_claims.json()['claims']
        self.assertEqual(len(claims), 1)
        self.assertEqual(claims[0]['id'], str(self.claim_a.id))

    def test_b_user_cannot_access_other_user_profile_via_parameter_tampering(self):
        """TEST B: User A cannot access User B's profile via direct ID manipulation."""
        # /api/auth/me/ derives identity solely from session, ignoring tampering parameters
        resp = self.client_a.get(f'/api/auth/me/?user_id={self.user_b.id}')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data['user']['id'], self.user_a.id)
        self.assertNotEqual(data['user']['id'], self.user_b.id)

    def test_c_user_cannot_view_other_user_claim_session(self):
        """TEST C: User B cannot view User A's claim session or assets (IDOR Prevention)."""
        # User B attempts to access User A's claim pages
        resp_verify = self.client_b.get(f'/verify/{self.claim_a.id}/')
        self.assertEqual(resp_verify.status_code, 403)

        resp_results = self.client_b.get(f'/results/{self.claim_a.id}/')
        self.assertEqual(resp_results.status_code, 403)

        resp_loan = self.client_b.get(f'/loan/{self.claim_a.id}/')
        self.assertEqual(resp_loan.status_code, 403)

        resp_forms = self.client_b.get(f'/print-forms/{self.claim_a.id}/')
        self.assertEqual(resp_forms.status_code, 403)

        # User B attempts to access User A's claim via API
        resp_api = self.client_b.get(f'/api/user/claims/{self.claim_a.id}/')
        self.assertEqual(resp_api.status_code, 403)

    def test_d_modifying_user_id_in_request_body_has_no_effect(self):
        """TEST D: Identity is derived from validated session, not frontend-provided user_id."""
        payload = {
            'consent': True,
            'identifier_input': '4821',
            'user_id': self.user_b.id,  # Tampered user_id
            'provider': 'DEMO'
        }
        resp = self.client_a.post('/api/verify/', json.dumps(payload), content_type='application/json')
        self.assertEqual(resp.status_code, 200)

        # Check Audit Log - should be bound to User A, NOT User B
        latest_audit = AuditLog.objects.filter(event_type='IDENTITY_VERIFIED').latest('timestamp')
        self.assertEqual(latest_audit.user, self.user_a)
        self.assertNotEqual(latest_audit.user, self.user_b)

    def test_e_real_logout_invalidates_session_immediately(self):
        """TEST E: Real logout flushes server-side session and deletes cookie."""
        # Check active session
        resp = self.client_a.get('/api/auth/me/')
        self.assertEqual(resp.json()['isAuthenticated'], True)

        # Store old session key before logout
        old_session_key = self.client_a.session.session_key
        self.assertIsNotNone(old_session_key)

        # Perform logout
        logout_resp = self.client_a.post('/api/auth/logout/')
        self.assertEqual(logout_resp.status_code, 200)

        # Ensure session cookie deletion header was sent
        self.assertIn('sessionid', logout_resp.cookies)
        self.assertEqual(logout_resp.cookies['sessionid'].value, '')

        # Ensure subsequent requests are unauthenticated
        resp_after = self.client_a.get('/api/auth/me/')
        self.assertEqual(resp_after.json()['isAuthenticated'], False)

    def test_e2_old_session_cannot_be_reused_after_logout(self):
        """TEST E2: Attacker or refreshed tab trying to reuse old session key is rejected."""
        # User logs in and gets a session
        client = Client()
        client.login(username='usera@example.com', password='Password123!')
        session_key = client.session.session_key
        self.assertTrue(client.get('/api/auth/me/').json()['isAuthenticated'])

        # User logs out
        client.post('/api/auth/logout/')

        # Attacker tries to inject the old session key into cookies
        attacker_client = Client()
        attacker_client.cookies['sessionid'] = session_key

        # Protected API check
        resp_api = attacker_client.get('/api/auth/me/')
        self.assertFalse(resp_api.json()['isAuthenticated'])

        # Protected claims check
        resp_claims = attacker_client.get('/api/user/claims/')
        self.assertEqual(resp_claims.status_code, 401)

        # Protected dashboard route check
        resp_dash = attacker_client.get('/dashboard/')
        self.assertEqual(resp_dash.status_code, 302)
        self.assertIn('/login', resp_dash.url)

    def test_e3_direct_navigation_to_dashboard_after_logout_redirects_to_login(self):
        """TEST E3: Direct URL navigation or page refresh of /dashboard after logout redirects to /login."""
        # Logged out client directly hits /dashboard
        resp = self.anon_client.get('/dashboard/')
        self.assertEqual(resp.status_code, 302)
        self.assertIn('/login', resp.url)
        self.assertIn('next=/dashboard', resp.url)

    def test_f_password_change_invalidates_other_sessions(self):
        """TEST F: Password change updates session auth hash to invalidate sessions on other devices."""
        # Create a second client for User A representing Device 2
        client_a_device2 = Client()
        client_a_device2.login(username='usera@example.com', password='Password123!')

        # Device 2 works
        resp_d2 = client_a_device2.get('/api/auth/me/')
        self.assertTrue(resp_d2.json()['isAuthenticated'])

        # User changes password on Device 1
        change_resp = self.client_a.post(
            '/api/auth/change-password/',
            json.dumps({
                'current_password': 'Password123!',
                'new_password': 'NewPassword456@',
                'confirm_password': 'NewPassword456@'
            }),
            content_type='application/json'
        )
        self.assertEqual(change_resp.status_code, 200)

        # Device 1 remains authenticated (update_session_auth_hash called)
        resp_d1_after = self.client_a.get('/api/auth/me/')
        self.assertTrue(resp_d1_after.json()['isAuthenticated'])

        # Device 2 session is invalidated on next request
        resp_d2_after = client_a_device2.get('/api/auth/me/')
        self.assertFalse(resp_d2_after.json()['isAuthenticated'])

    def test_g_session_inactivity_timeout_rejects_requests_after_30_minutes(self):
        """TEST G: Inactivity timeout (1800s) rejects expired requests."""
        # Initial request sets last activity
        self.client_a.get('/api/auth/me/')

        # Manually backdate the session's _wp_last_activity by 31 minutes
        session = self.client_a.session
        session['_wp_last_activity'] = int(time.time()) - (31 * 60)
        session.save()

        # Next request must be terminated by SessionSecurityMiddleware
        resp = self.client_a.get('/api/auth/me/')
        self.assertEqual(resp.status_code, 401)
        self.assertIn('Session expired due to inactivity', resp.json().get('error', ''))

    def test_h_unauthenticated_user_denied_on_private_endpoints(self):
        """TEST H: Unauthenticated requests rejected on private APIs and redirected on pages."""
        # Private API endpoints
        self.assertEqual(self.anon_client.get('/api/discover/').status_code, 401)
        self.assertEqual(self.anon_client.get('/api/user/claims/').status_code, 401)

        # Protected pages and download route redirect unauthenticated requests to login
        resp_doc = self.anon_client.get(f'/claims/{self.claim_a.id}/download-document/')
        self.assertEqual(resp_doc.status_code, 302)
        self.assertIn('/login', resp_doc.url)

        resp_search = self.anon_client.post('/search/', {'pan_number': 'ABCDE1234F'})
        self.assertEqual(resp_search.status_code, 302)
        self.assertIn('/login/', resp_search.url)

    def test_i_user_cannot_download_other_user_private_documents(self):
        """TEST I: User B cannot download User A's uploaded documents (403 Forbidden)."""
        # User B attempts to download User A's death certificate
        resp_b = self.client_b.get(f'/claims/{self.claim_a.id}/download-document/')
        self.assertEqual(resp_b.status_code, 403)

        # User A can download their own document
        resp_a = self.client_a.get(f'/claims/{self.claim_a.id}/download-document/')
        self.assertEqual(resp_a.status_code, 200)
        self.assertIn('attachment; filename="death_cert_alice', resp_a['Content-Disposition'])

    def test_j_staff_reviewer_access_verified(self):
        """TEST J: Staff/Reviewer can adjudicate claims for compliance verification."""
        staff_client = Client()
        staff_client.force_login(self.staff_user)

        # Staff can inspect User A's claim
        resp = staff_client.get(f'/verify/{self.claim_a.id}/')
        self.assertEqual(resp.status_code, 200)

        # Staff can run setu_test
        resp_setu = staff_client.get('/setu-test/')
        # May be 200 or 500 depending on real sandbox API credentials, but NOT 403 Forbidden
        self.assertNotEqual(resp_setu.status_code, 403)

        # Non-staff user denied from setu_test
        resp_setu_user = self.client_a.get('/setu-test/')
        self.assertEqual(resp_setu_user.status_code, 403)


    def test_k_cache_control_and_security_headers_verified(self):
        """TEST K: Cache-Control: no-store and security headers are strictly applied."""
        resp = self.client_a.get('/api/auth/me/')
        self.assertEqual(resp.status_code, 200)

        # Anti-cache headers to block browser back-button caching
        self.assertIn('no-store', resp.headers.get('Cache-Control', ''))
        self.assertIn('no-cache', resp.headers.get('Cache-Control', ''))
        self.assertEqual(resp.headers.get('Pragma'), 'no-cache')

        # OWASP Security Headers
        self.assertEqual(resp.headers.get('X-Content-Type-Options'), 'nosniff')
        self.assertEqual(resp.headers.get('X-Frame-Options'), 'DENY')
        self.assertEqual(resp.headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin')

    def test_m_audit_trail_logged_without_plaintext_passwords_or_secrets(self):
        """TEST M: Audit logs record security events without storing credentials, OTPs, or passwords."""
        # Perform security operations
        self.client_a.post('/api/auth/logout/')

        # Inspect AuthAuditLog
        audit_records = AuthAuditLog.objects.filter(user=self.user_a)
        self.assertTrue(audit_records.exists())

        for record in audit_records:
            details_str = json.dumps(record.details or {})
            self.assertNotIn('Password123!', details_str)
            self.assertNotIn('password', details_str.lower())
            self.assertNotIn('secret', details_str.lower())
            self.assertNotIn('otp', details_str.lower())
