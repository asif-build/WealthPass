import json
import os
from decimal import Decimal
from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile

from accounts.models import UserProfile, AccountStatus
from claims.models import (
    ClaimSession, DiscoveredAsset, AuditLog,
    ClaimantRelationshipRecord
)


class WealthPassLatticeProcessingTests(TestCase):
    """
    Automated verification suite for the Unified Lattice Processing Experience:
    1. Document Processing & OCR (/api/scan-document/)
    2. Claim Preparation & Dossier Checklist (/api/claim-preparation/<asset_id>/)
    3. Multi-Registry Asset Discovery & Sources (/api/discover/, /api/sources/)
    4. Claimant-Deceased Relationship Assessment (/api/relationship/)
    5. Case Creation & Discovery Pipeline (/api/user/claims/)
    """

    def setUp(self):
        # Create Test User
        self.user = User.objects.create_user(
            username='claimant@wealthpass.test',
            email='claimant@wealthpass.test',
            password='Password123!',
            first_name='Rohan',
            last_name='Mehta'
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            phone_e164='+919876543210',
            is_email_verified=True,
            is_phone_verified=True,
            account_status=AccountStatus.ACTIVE
        )

        self.client = Client()
        self.authenticated_client = Client()
        self.authenticated_client.force_login(self.user)

    def test_scan_document_requires_authentication(self):
        """Unauthenticated requests to scan documents must return 401."""
        response = self.client.post('/api/scan-document/')
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn('Authentication required', data['error'])

    def test_scan_document_validates_file_presence(self):
        """POST without file payload must return 400 Bad Request."""
        response = self.authenticated_client.post('/api/scan-document/')
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn('No document file uploaded', data['error'])

    def test_scan_document_validates_file_size(self):
        """Files exceeding 5MB must be rejected."""
        large_content = b'X' * (6 * 1024 * 1024)  # 6MB
        large_file = SimpleUploadedFile("oversized_cert.pdf", large_content, content_type="application/pdf")
        response = self.authenticated_client.post('/api/scan-document/', {'file': large_file})
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn('exceeds 5MB', data['error'])

    def test_scan_document_validates_file_extension(self):
        """Unsupported file formats must be rejected."""
        invalid_file = SimpleUploadedFile("executable.exe", b"MZbinarycontent", content_type="application/octet-stream")
        response = self.authenticated_client.post('/api/scan-document/', {'file': invalid_file})
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn('Only PDF, PNG, and JPG', data['error'])

    def test_scan_document_success_with_text_extraction_and_audit(self):
        """Valid PDF upload extracts text, flags keywords, logs audit record, and returns statutory disclaimer."""
        pdf_content = b"%PDF-1.4 Official Municipal Corporation Death Certificate for Arun Mehta"
        test_file = SimpleUploadedFile("death_certificate.pdf", pdf_content, content_type="application/pdf")
        response = self.authenticated_client.post('/api/scan-document/', {'file': test_file})
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertTrue(data['success'])
        self.assertEqual(data['filename'], 'death_certificate.pdf')
        self.assertIn('death certificate', data['text'].lower())
        self.assertTrue(data['extracted_fields']['has_death_certificate_keyword'])
        self.assertIn('does not prove that a document is authentic', data['disclaimer'])

        # Verify Audit Log
        log = AuditLog.objects.filter(user=self.user, event_type='DOCUMENT_SCANNED').first()
        self.assertIsNotNone(log)
        self.assertEqual(log.details['filename'], 'death_certificate.pdf')

    def test_claim_preparation_authenticated_session(self):
        """Authenticated access returns full checklist, milestones, and logs audit record."""
        response = self.authenticated_client.get('/api/claim-preparation/AST-INS-9821/')
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertTrue(data['success'])
        self.assertTrue(data['authenticated'])
        self.assertEqual(data['asset_id'], 'AST-INS-9821')
        self.assertGreaterEqual(len(data['checklist']), 4)
        self.assertGreaterEqual(len(data['milestones']), 5)
        self.assertIn('custodian institution', data['legal_notice'])

        # Verify Audit Log
        log = AuditLog.objects.filter(user=self.user, event_type='CLAIM_PREPARATION_ACCESSED').first()
        self.assertIsNotNone(log)

    def test_claim_preparation_unauthenticated_session(self):
        """Unauthenticated access returns prototype checklist with authenticated=False."""
        response = self.client.get('/api/claim-preparation/AST-INS-9821/')
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertTrue(data['success'])
        self.assertFalse(data['authenticated'])
        self.assertGreaterEqual(len(data['checklist']), 4)

    def test_asset_discovery_sources_accuracy(self):
        """GET /api/discover/ must declare accurate source categories without claiming private database access."""
        response = self.authenticated_client.get('/api/discover/')
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertTrue(data['success'])
        sources = data['sources_scanned']
        self.assertGreaterEqual(len(sources), 4)

        # Check that sources declare official external discovery status
        integration_statuses = [s.get('integration_status', '') for s in sources]
        self.assertTrue(any('OFFICIAL EXTERNAL DISCOVERY' in st for st in integration_statuses))

        # Check disclaimer
        self.assertIn('does not establish ownership', data['summary']['disclaimer'])

    def test_sources_transparency_registry(self):
        """GET /api/sources/ provides source transparency metadata and permitted identifiers."""
        response = self.client.get('/api/sources/')
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertTrue(data['success'])
        sources = data['sources']
        self.assertGreaterEqual(len(sources), 4)
        names = [s['name'] for s in sources]
        self.assertTrue(any('UDGAM' in n for n in names))
        self.assertTrue(any('Bima Bharosa' in n for n in names))

    def test_relationship_declaration_records_pending_status(self):
        """Relationship declaration strictly marks verification as PENDING INSTITUTIONAL VERIFICATION."""
        payload = {
            'relationship': 'Son',
            'claimant_name': 'Rohan Mehta',
            'deceased_name': 'Arun Mehta'
        }
        response = self.authenticated_client.post(
            '/api/relationship/',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertTrue(data['success'])
        self.assertEqual(data['status'], 'PENDING INSTITUTIONAL VERIFICATION')

        # Verify persisted record
        rel_rec = ClaimantRelationshipRecord.objects.filter(user=self.user).first()
        self.assertIsNotNone(rel_rec)
        self.assertEqual(rel_rec.claimant_relationship, 'Son')
        self.assertEqual(rel_rec.evidence_status, 'PENDING INSTITUTIONAL VERIFICATION')

    def test_user_claims_creation_with_discovery_initialization(self):
        """POST /api/user/claims/ with init_discovery=True creates case, attaches assets, and logs audit record."""
        payload = {
            'deceased_name': 'Arun Mehta',
            'deceased_pan': 'ABCDE1234F',
            'death_certificate_no': 'MH-2023-887711',
            'relation': 'Son',
            'init_discovery': True
        }
        response = self.authenticated_client.post(
            '/api/user/claims/',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()

        self.assertTrue(data['success'])
        claim_id = data['claim']['id']
        session = ClaimSession.objects.get(id=claim_id)

        self.assertEqual(session.user, self.user)
        self.assertEqual(session.deceased_name, 'Arun Mehta')
        self.assertEqual(session.status, 'READY_FOR_CLAIM')
        self.assertGreater(session.total_assets_found, Decimal('0'))
        self.assertEqual(session.assets.count(), 2)

        # Verify audit log
        log = AuditLog.objects.filter(user=self.user, event_type='CASE_CREATED').first()
        self.assertIsNotNone(log)
        self.assertEqual(log.details['deceased_name'], 'Arun Mehta')
