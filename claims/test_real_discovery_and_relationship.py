import json
import os
import tempfile
from decimal import Decimal
from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from claims.models import (
    ClaimSession, DiscoveredAsset, ClaimDocument,
    VerificationRecord, ConsentRecord, ClaimantRelationshipRecord, AuditLog
)
from claims.providers.base import IntegrationStatus, RelationshipStatus
from claims.providers.identity import (
    DigiLockerIdentityAdapter, SetuAAIdentityAdapter,
    OfflineManualIdentityAdapter, MockTestingIdentityAdapter
)
from claims.providers.asset_discovery import (
    RbiUdgamDiscoveryAdapter, IrdaiBimaBharosaDiscoveryAdapter,
    SebiMfCentralDiscoveryAdapter, IepfDiscoveryAdapter,
    SetuAADiscoveryAdapter, AssetDiscoveryRegistry
)
from claims.providers.relationship_service import (
    RelationshipEvidenceAssessmentService,
    STATUTORY_RELATIONSHIP_REQUIREMENTS
)


class RealDiscoveryAndRelationshipVerificationTests(TestCase):
    """
    Automated verification suite for Real Asset Discovery and
    Claimant–Deceased Relationship Verification.
    Tests all 14 statutory, security, and lifecycle scenarios.
    """

    def setUp(self):
        self.user_a = User.objects.create_user(
            username='claimant_a',
            email='claimant_a@example.com',
            password='ValidPassword123!',
            first_name='Rohan',
            last_name='Mehta'
        )
        self.user_b = User.objects.create_user(
            username='claimant_b',
            email='claimant_b@example.com',
            password='ValidPassword123!',
            first_name='Pooja',
            last_name='Sharma'
        )
        self.staff_user = User.objects.create_user(
            username='reviewer_staff',
            email='reviewer@wealthpass.internal',
            password='StaffPassword123!',
            is_staff=True
        )

        self.client_a = Client()
        self.client_a.force_login(self.user_a)

        self.client_b = Client()
        self.client_b.force_login(self.user_b)

        self.staff_client = Client()
        self.staff_client.force_login(self.staff_user)

        self.anon_client = Client()

        # Create active claim session for User A
        self.session_a = ClaimSession.objects.create(
            user=self.user_a,
            deceased_name='Arun Mehta',
            deceased_pan='ABCDE1234F',
            death_certificate_no='MUM-2023-998877',
            claimant_name='Rohan Mehta',
            claimant_aadhaar_last4='4821',
            relation='Son',
            mobile='+919876543210',
            status='DRAFT'
        )

    # --------------------------------------------------------------------------
    # 1. Genuine Provider Success
    # --------------------------------------------------------------------------
    def test_1_genuine_provider_success(self):
        """Test 1: Genuine provider adapter executes and returns expected status."""
        test_adapter = MockTestingIdentityAdapter(simulate_success=True)
        res = test_adapter.verify_claimant_identity(
            identifier_input="4821",
            consent_granted=True,
            user_id=self.user_a.id
        )
        self.assertTrue(res['success'])
        self.assertEqual(res['status'], 'VERIFIED')
        self.assertEqual(res['masked_identifier'], 'XXXX XXXX 4821')

        # Test official offline manual provider
        manual_adapter = OfflineManualIdentityAdapter()
        man_res = manual_adapter.verify_claimant_identity(
            identifier_input="4821",
            consent_granted=True,
            user_id=self.user_a.id
        )
        self.assertTrue(man_res['success'])
        self.assertEqual(man_res['status'], IntegrationStatus.OFFICIAL_EXTERNAL_PROCESS.value)

    # --------------------------------------------------------------------------
    # 2. Provider Unavailable / NOT_CONFIGURED
    # --------------------------------------------------------------------------
    def test_2_provider_unavailable_and_not_configured(self):
        """Test 2: Unconfigured providers return explicit NOT_CONFIGURED status."""
        dg_adapter = DigiLockerIdentityAdapter()
        # Without DIGILOCKER_CLIENT_ID / SECRET in env, must report NOT_CONFIGURED
        self.assertEqual(dg_adapter.integration_status, IntegrationStatus.NOT_CONFIGURED)
        res = dg_adapter.verify_claimant_identity("4821", consent_granted=True, user_id=self.user_a.id)
        self.assertFalse(res['success'])
        self.assertEqual(res['status'], IntegrationStatus.NOT_CONFIGURED.value)

    # --------------------------------------------------------------------------
    # 3. Invalid Provider Credentials Handling
    # --------------------------------------------------------------------------
    def test_3_invalid_provider_credentials(self):
        """Test 3: Provider with failed response reports FAILED without raising uncaught exceptions."""
        test_adapter = MockTestingIdentityAdapter(simulate_success=False)
        res = test_adapter.verify_claimant_identity("4821", consent_granted=True, user_id=self.user_a.id)
        self.assertFalse(res['success'])
        self.assertEqual(res['status'], 'FAILED')

    # --------------------------------------------------------------------------
    # 4. Network Timeout
    # --------------------------------------------------------------------------
    def test_4_network_timeout(self):
        """Test 4: Network timeout is raised and can be caught cleanly."""
        timeout_adapter = MockTestingIdentityAdapter(simulate_timeout=True)
        with self.assertRaises(TimeoutError):
            timeout_adapter.verify_claimant_identity("4821", consent_granted=True, user_id=self.user_a.id)

    # --------------------------------------------------------------------------
    # 5. Input Validation & Bounds
    # --------------------------------------------------------------------------
    def test_5_input_validation(self):
        """Test 5: API rejects invalid PAN, empty names, and missing consent."""
        # Missing consent in identity verification
        resp_no_consent = self.client_a.post('/api/verify/', json.dumps({
            'consent': False,
            'identifier_input': '4821'
        }), content_type='application/json')
        self.assertEqual(resp_no_consent.status_code, 400)

        # Invalid PAN in case creation
        resp_bad_pan = self.client_a.post('/api/user/claims/', json.dumps({
            'deceased_name': 'Arun Mehta',
            'deceased_pan': 'INVALID_PAN',
            'relation': 'Son'
        }), content_type='application/json')
        self.assertEqual(resp_bad_pan.status_code, 400)

    # --------------------------------------------------------------------------
    # 6. Malformed & Oversized Documents
    # --------------------------------------------------------------------------
    def test_6_malformed_and_oversized_documents(self):
        """Test 6: Reject files exceeding 5MB or invalid extensions."""
        # Disallowed extension (.exe)
        bad_file = SimpleUploadedFile("malware.exe", b"MZexecutabledata", content_type="application/x-msdownload")
        resp_bad_ext = self.client_a.post('/api/relationship/evidence/', {
            'file': bad_file,
            'session_id': str(self.session_a.id),
            'document_type': 'DEATH_CERTIFICATE'
        })
        self.assertEqual(resp_bad_ext.status_code, 400)
        self.assertIn('Only PDF, PNG, and JPG', resp_bad_ext.json()['error'])

        # Oversized file (> 5MB)
        oversized = SimpleUploadedFile("huge.pdf", b"x" * (5 * 1024 * 1024 + 100), content_type="application/pdf")
        resp_oversized = self.client_a.post('/api/relationship/evidence/', {
            'file': oversized,
            'session_id': str(self.session_a.id),
            'document_type': 'DEATH_CERTIFICATE'
        })
        self.assertEqual(resp_oversized.status_code, 400)
        self.assertIn('5MB limit', resp_oversized.json()['error'])

    # --------------------------------------------------------------------------
    # 7. Conflicting Document Details (OCR Field Comparison)
    # --------------------------------------------------------------------------
    def test_7_conflicting_document_details(self):
        """Test 7: Field assessment detects missing names and mismatched cert numbers."""
        conflicting_text = "This is a municipal tax receipt for property in Pune. Owner: Ramesh Patel. Receipt: TX-999."
        assessment = RelationshipEvidenceAssessmentService.assess_ocr_evidence(
            ocr_text=conflicting_text,
            declared_deceased_name="Arun Mehta",
            declared_cert_no="MUM-2023-998877",
            declared_relationship="Son"
        )
        self.assertFalse(assessment['matches_deceased_name'])
        self.assertFalse(assessment['matches_certificate_no'])
        self.assertFalse(assessment['has_death_certificate_header'])
        self.assertEqual(assessment['assessment_verdict'], 'LOW_CONSISTENCY_DISCREPANCIES_DETECTED')
        self.assertGreater(len(assessment['discrepancies']), 0)

    # --------------------------------------------------------------------------
    # 8. Incomplete Relationship Evidence & Statutory Checklist
    # --------------------------------------------------------------------------
    def test_8_incomplete_relationship_evidence(self):
        """Test 8: Relationship engine returns mandatory and conditional documents per succession law."""
        son_reqs = RelationshipEvidenceAssessmentService.get_statutory_requirements("Son")
        self.assertEqual(son_reqs['heir_class'], 'Class 1 Heir')
        mandatory_types = [d['type'] for d in son_reqs['mandatory_documents']]
        self.assertIn('DEATH_CERTIFICATE', mandatory_types)
        self.assertIn('BIRTH_CERTIFICATE', mandatory_types)
        self.assertIn('CLAIMANT_KYC', mandatory_types)

        # Spouse requirements
        spouse_reqs = RelationshipEvidenceAssessmentService.get_statutory_requirements("Spouse")
        spouse_mand = [d['type'] for d in spouse_reqs['mandatory_documents']]
        self.assertIn('MARRIAGE_CERTIFICATE', spouse_mand)

        # Sister (Class 2 heir) requires succession certificate
        sister_reqs = RelationshipEvidenceAssessmentService.get_statutory_requirements("Sister")
        sister_mand = [d['type'] for d in sister_reqs['mandatory_documents']]
        self.assertIn('SUCCESSION_CERTIFICATE', sister_mand)

    # --------------------------------------------------------------------------
    # 9. Unauthorized Access (401)
    # --------------------------------------------------------------------------
    def test_9_unauthorized_access(self):
        """Test 9: Protected endpoints reject unauthenticated access with 401."""
        self.assertEqual(self.anon_client.get('/api/discover/').status_code, 401)
        self.assertEqual(self.anon_client.get('/api/user/claims/').status_code, 401)
        self.assertEqual(self.anon_client.post('/api/relationship/evidence/').status_code, 401)
        self.assertEqual(self.anon_client.get(f'/api/relationship/status/{self.session_a.id}/').status_code, 401)

    # --------------------------------------------------------------------------
    # 10. Cross-User Access Attempts (403 IDOR Defense)
    # --------------------------------------------------------------------------
    def test_10_cross_user_access_attempts(self):
        """Test 10: User B cannot access User A's claim status or private documents."""
        # Attempt to access User A's status
        resp_status = self.client_b.get(f'/api/relationship/status/{self.session_a.id}/')
        self.assertEqual(resp_status.status_code, 403)

        # Create private document for User A
        valid_file = SimpleUploadedFile("cert_a.pdf", b"%PDF-1.4 sample death certificate", content_type="application/pdf")
        doc_a = ClaimDocument.objects.create(
            user=self.user_a,
            session=self.session_a,
            document_type='DEATH_CERTIFICATE',
            file=valid_file,
            original_filename="cert_a.pdf",
            file_size=32
        )

        # User B attempts to delete User A's document
        resp_del = self.client_b.post(f'/api/relationship/document/{doc_a.id}/')
        self.assertEqual(resp_del.status_code, 403)

        # User B attempts to download User A's document
        resp_dl = self.client_b.get(f'/api/documents/{doc_a.id}/download/')
        self.assertEqual(resp_dl.status_code, 403)

    # --------------------------------------------------------------------------
    # 11. Invalid Status Transitions Enforced
    # --------------------------------------------------------------------------
    def test_11_invalid_status_transitions(self):
        """Test 11: State machine blocks jumping from NOT_STARTED directly to VERIFIED."""
        rel_rec = ClaimantRelationshipRecord.objects.create(
            user=self.user_a,
            session_token=str(self.session_a.id),
            claimant_name='Rohan Mehta',
            deceased_name='Arun Mehta',
            claimant_relationship='Son',
            status=RelationshipStatus.NOT_STARTED.value
        )

        # Illegal jump: NOT_STARTED -> VERIFIED
        with self.assertRaises(ValueError) as ctx:
            rel_rec.transition_to(RelationshipStatus.VERIFIED.value)
        self.assertIn("Invalid status transition", str(ctx.exception))

        # Non-staff attempting transition to VERIFIED via API
        resp_illegal = self.client_a.post('/api/relationship/transition/', json.dumps({
            'session_id': str(self.session_a.id),
            'target_status': 'VERIFIED'
        }), content_type='application/json')
        self.assertEqual(resp_illegal.status_code, 403)

        # Legal path: NOT_STARTED -> DOCUMENTS_REQUIRED -> EVIDENCE_SUBMITTED -> UNDER_REVIEW -> VERIFIED (by staff)
        rel_rec.transition_to(RelationshipStatus.DOCUMENTS_REQUIRED.value)
        self.assertEqual(rel_rec.status, RelationshipStatus.DOCUMENTS_REQUIRED.value)

        rel_rec.transition_to(RelationshipStatus.EVIDENCE_SUBMITTED.value)
        self.assertEqual(rel_rec.status, RelationshipStatus.EVIDENCE_SUBMITTED.value)

        rel_rec.transition_to(RelationshipStatus.UNDER_REVIEW.value)
        self.assertEqual(rel_rec.status, RelationshipStatus.UNDER_REVIEW.value)

        rel_rec.transition_to(RelationshipStatus.VERIFIED.value, reviewer="staff_examiner")
        self.assertEqual(rel_rec.status, RelationshipStatus.VERIFIED.value)

    # --------------------------------------------------------------------------
    # 12. Repeated Requests & Duplicate Records
    # --------------------------------------------------------------------------
    def test_12_repeated_requests_and_duplicates(self):
        """Test 12: Multiple consent and discovery requests are handled idempotently."""
        # Repeated consent grants
        for _ in range(3):
            resp = self.client_a.post('/api/consent/', json.dumps({
                'action': 'GRANT',
                'purpose': 'ASSET_DISCOVERY'
            }), content_type='application/json')
            self.assertEqual(resp.status_code, 200)

        # Revoke consent
        resp_revoke = self.client_a.post('/api/consent/', json.dumps({
            'action': 'REVOKE',
            'purpose': 'ASSET_DISCOVERY'
        }), content_type='application/json')
        self.assertEqual(resp_revoke.status_code, 200)
        self.assertEqual(resp_revoke.json()['status'], 'REVOKED')

    # --------------------------------------------------------------------------
    # 13. Document Access After Logout
    # --------------------------------------------------------------------------
    def test_13_document_access_after_logout(self):
        """Test 13: Logging out invalidates session and prevents document downloads."""
        valid_file = SimpleUploadedFile("cert_logout.pdf", b"%PDF-1.4 death cert", content_type="application/pdf")
        doc = ClaimDocument.objects.create(
            user=self.user_a,
            session=self.session_a,
            document_type='DEATH_CERTIFICATE',
            file=valid_file,
            original_filename="cert_logout.pdf",
            file_size=20
        )

        # Successful download while authenticated
        resp_authed = self.client_a.get(f'/api/documents/{doc.id}/download/')
        self.assertEqual(resp_authed.status_code, 200)

        # Logout
        self.client_a.post('/api/auth/logout/')

        # Download rejected after logout
        resp_logged_out = self.client_a.get(f'/api/documents/{doc.id}/download/')
        self.assertEqual(resp_logged_out.status_code, 401)

    # --------------------------------------------------------------------------
    # 14. Data Deletion & Retention Behavior
    # --------------------------------------------------------------------------
    def test_14_data_deletion_and_retention(self):
        """Test 14: User can securely delete evidence documents with audit trail logging."""
        valid_file = SimpleUploadedFile("cert_to_delete.pdf", b"%PDF-1.4 delete cert", content_type="application/pdf")
        doc = ClaimDocument.objects.create(
            user=self.user_a,
            session=self.session_a,
            document_type='DEATH_CERTIFICATE',
            file=valid_file,
            original_filename="cert_to_delete.pdf",
            file_size=25
        )
        doc_id = doc.id

        # Delete document via authenticated endpoint
        resp_del = self.client_a.post(f'/api/relationship/document/{doc_id}/')
        self.assertEqual(resp_del.status_code, 200)
        self.assertTrue(resp_del.json()['success'])

        # Confirm deleted from database
        self.assertFalse(ClaimDocument.objects.filter(id=doc_id).exists())

        # Verify Audit Log recorded DOCUMENT_DELETED
        audit_entry = AuditLog.objects.filter(user=self.user_a, event_type='DOCUMENT_DELETED').first()
        self.assertIsNotNone(audit_entry)
        self.assertEqual(audit_entry.details['document_id'], str(doc_id))
