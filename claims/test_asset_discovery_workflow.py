import json
from decimal import Decimal
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from accounts.models import UserProfile
from claims.models import ClaimSession, ClaimDocument, ClaimantRelationshipRecord, AuditLog
from claims.ocr import extract_structured_document_info

User = get_user_model()


class AssetDiscoveryWorkflowTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='discovery_user',
            email='discovery@wealthpass.test',
            password='Password123!',
            first_name='Rohan',
            last_name='Mehta'
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            phone_e164='+919876543210',
            is_email_verified=True,
            is_phone_verified=True
        )
        self.client = Client()
        self.authenticated_client = Client()
        self.authenticated_client.force_login(self.user)

    def test_01_route_guard_unauthenticated_redirects(self):
        """Unauthenticated access to /assets/discover/ must redirect to /login/?next=/assets/discover/."""
        response = self.client.get('/assets/discover/')
        self.assertEqual(response.status_code, 302)
        self.assertIn('/login/', response.url)
        self.assertIn('next=/assets/discover/', response.url)

    def test_02_route_guard_authenticated_returns_200(self):
        """Authenticated access to /assets/discover/ serves the SPA shell."""
        response = self.authenticated_client.get('/assets/discover/')
        self.assertEqual(response.status_code, 200)

    def test_03_draft_api_unauthenticated_rejected(self):
        """Unauthenticated access to /api/user/claims/draft/ returns 401."""
        response = self.client.get('/api/user/claims/draft/')
        self.assertEqual(response.status_code, 401)
        response_post = self.client.post('/api/user/claims/draft/', data={}, content_type='application/json')
        self.assertEqual(response_post.status_code, 401)

    def test_04_draft_lifecycle_save_and_resume(self):
        """Claimant can save Step 1-4 progress as draft and resume across sessions."""
        # 1. Initially no draft exists
        get_res1 = self.authenticated_client.get('/api/user/claims/draft/')
        self.assertEqual(get_res1.status_code, 200)
        self.assertIsNone(get_res1.json()['draft'])

        # 2. Save Step 1 draft (deceased details)
        step1_payload = {
            'deceased_name': 'Late Arun Mehta',
            'deceased_pan': 'ABCDE1234F',
            'pan_unknown': False,
            'date_of_death': '2023-05-15',
            'date_of_death_unknown': False,
            'last_known_state': 'Maharashtra',
            'current_step': 1
        }
        post_res1 = self.authenticated_client.post(
            '/api/user/claims/draft/',
            data=json.dumps(step1_payload),
            content_type='application/json'
        )
        self.assertEqual(post_res1.status_code, 200)
        draft_id = post_res1.json()['case_id']
        self.assertTrue(draft_id)

        # 3. Update Step 2 (claimant and relation) idempotently on the same draft
        step2_payload = {
            'case_id': draft_id,
            'claimant_name': 'Rohan Mehta',
            'relation': 'Son',
            'mobile': '+919876543210',
            'current_step': 2
        }
        post_res2 = self.authenticated_client.post(
            '/api/user/claims/draft/',
            data=json.dumps(step2_payload),
            content_type='application/json'
        )
        self.assertEqual(post_res2.status_code, 200)
        self.assertEqual(post_res2.json()['case_id'], draft_id)

        # 4. Verify GET /api/user/claims/draft/ returns saved details
        get_res2 = self.authenticated_client.get('/api/user/claims/draft/')
        self.assertEqual(get_res2.status_code, 200)
        draft_data = get_res2.json()['draft']
        self.assertIsNotNone(draft_data)
        self.assertEqual(draft_data['id'], draft_id)
        self.assertEqual(draft_data['deceased_name'], 'Late Arun Mehta')
        self.assertEqual(draft_data['deceased_pan'], 'ABCDE1234F')
        self.assertEqual(draft_data['last_known_state'], 'Maharashtra')
        self.assertEqual(draft_data['relation'], 'Son')
        self.assertEqual(draft_data['current_step'], 2)

    def test_05_structured_ocr_extraction(self):
        """Structured OCR extraction accurately identifies issuing authorities, dates, and cert numbers."""
        sample_death_cert_text = """
        GOVERNMENT OF MAHARASHTRA
        MUNICIPAL CORPORATION OF GREATER MUMBAI
        DEATH CERTIFICATE
        This is to certify that Arun Mehta died on 15/05/2023.
        Registration Number: MCGM/2023/44812
        Date of Registration: 20/05/2023
        """
        extracted = extract_structured_document_info(sample_death_cert_text, "DEATH_CERTIFICATE")
        self.assertIn("Municipal Corporation", extracted["issuing_authority"])
        self.assertEqual(extracted["extracted_certificate_no"], "MCGM/2023/44812")
        self.assertIn("15/05/2023", extracted["extracted_dates"])

    def test_06_relationship_evidence_upload_stores_metadata(self):
        """Uploading relationship evidence stores structured fields and associates with user."""
        test_file = SimpleUploadedFile(
            "death_cert_sample.pdf",
            b"%PDF-1.4 sample content with Municipal Corporation Death Certificate Reg No MH-2023-9912",
            content_type="application/pdf"
        )
        res = self.authenticated_client.post('/api/relationship/evidence/', {
            'file': test_file,
            'document_type': 'DEATH_CERTIFICATE',
            'deceased_name': 'Arun Mehta',
            'relation': 'Son'
        })
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['document']['processing_status'], 'EXTRACTION_COMPLETED')
        self.assertIsNotNone(data['document']['issuing_authority'])

        doc_id = data['document']['id']
        doc = ClaimDocument.objects.get(id=doc_id)
        self.assertEqual(doc.user, self.user)
        self.assertFalse(doc.is_verified)  # Honest verification state

    def test_07_final_submission_converts_draft_to_active_case(self):
        """Final submission converts draft case to active case without duplicating entries."""
        # Create a draft first
        draft = ClaimSession.objects.create(
            user=self.user,
            deceased_name='Arun Mehta',
            deceased_pan='ABCDE1234F',
            relation='Son',
            claimant_name='Rohan Mehta',
            mobile='+919876543210',
            is_draft=True,
            current_step=4
        )

        # Upload a document
        test_file = SimpleUploadedFile("kinship.pdf", b"kinship content", content_type="application/pdf")
        doc = ClaimDocument.objects.create(
            user=self.user,
            document_type="RELATIONSHIP_CERTIFICATE",
            file=test_file,
            original_filename="kinship.pdf",
            file_size=15,
            mime_type="application/pdf"
        )

        submit_payload = {
            'case_id': str(draft.id),
            'deceased_name': 'Arun Mehta',
            'deceased_pan': 'ABCDE1234F',
            'pan_unknown': False,
            'date_of_death': '2023-05-15',
            'date_of_death_unknown': False,
            'last_known_state': 'Maharashtra',
            'death_certificate_no': 'MH-2023-88912',
            'claimant_name': 'Rohan Mehta',
            'relation': 'Son',
            'mobile': '+919876543210',
            'selected_asset_categories': ['BANK_DEPOSITS', 'INSURANCE'],
            'document_ids': [str(doc.id)]
        }

        response = self.authenticated_client.post(
            '/api/user/claims/',
            data=json.dumps(submit_payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 201)
        res_data = response.json()
        self.assertTrue(res_data['success'])
        self.assertEqual(res_data['claim']['id'], str(draft.id))  # Reuses same case ID

        # Verify DB state
        draft.refresh_from_db()
        self.assertFalse(draft.is_draft)
        self.assertEqual(draft.status, 'UNDER_REVIEW')
        self.assertEqual(draft.current_step, 5)
        self.assertEqual(draft.selected_asset_categories, ['BANK_DEPOSITS', 'INSURANCE'])

        # Verify document is linked to session
        doc.refresh_from_db()
        self.assertEqual(doc.session, draft)

        # Verify Audit log was created
        audit = AuditLog.objects.filter(user=self.user, event_type='CASE_SUBMITTED').first()
        self.assertIsNotNone(audit)
