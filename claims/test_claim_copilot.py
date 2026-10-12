"""
Comprehensive Test Suite for Claim Copilot, Privacy Boundaries,
Knowledge Base Versioning, and Green AI Guidance.
"""
from django.test import TestCase, Client
from django.contrib.auth.models import User
import uuid
import json
from decimal import Decimal

from claims.models import (
    ClaimSession,
    DiscoveredAsset,
    ClaimProcedure,
    ClaimCopilotProgress,
    CapabilityType,
    ClaimCategory,
    ClaimProcedureStatus
)
from claims.copilot.guidance_engine import ClaimCopilotGuidanceEngine
from claims.copilot.schemas import FieldGuidanceRequest
from claims.copilot.verified_procedures import VERIFIED_PROCEDURES


class ClaimCopilotTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='test_claimant@example.com',
            email='test_claimant@example.com',
            password='Password123!'
        )
        self.other_user = User.objects.create_user(
            username='stranger@example.com',
            email='stranger@example.com',
            password='Password123!'
        )

        # Discovery Case
        self.session = ClaimSession.objects.create(
            user=self.user,
            deceased_name='Ramesh Kumar Saini',
            claimant_name='Devendra Kumar Saini',
            relation='Son',
            mobile='9876543210'
        )

        # Discovered Bank Asset
        self.asset_sbi = DiscoveredAsset.objects.create(
            session=self.session,
            user=self.user,
            institution='State Bank of India',
            asset_category='BANK_DEPOSITS',
            amount=Decimal('142850.00'),
            situation_label='Unclaimed Savings Deposit',
            message='Savings bank deposit identified via statutory registry.'
        )

        # Discovered LIC Policy Asset
        self.asset_lic = DiscoveredAsset.objects.create(
            session=self.session,
            user=self.user,
            institution='Life Insurance Corporation of India (LIC)',
            asset_category='INSURANCE_LIC',
            amount=Decimal('500000.00'),
            situation_label='Death Claim Pending Settlement',
            message='Policy death benefit eligible for claim.'
        )

        # Seed Verified Procedures
        for p in VERIFIED_PROCEDURES:
            ClaimProcedure.objects.update_or_create(
                institution_id=p['institution_id'],
                claim_type=p['claim_type'],
                version=p.get('version', 'v2024.1'),
                defaults={
                    'institution_name': p['institution_name'],
                    'asset_category': p['asset_category'],
                    'capability_type': p['capability_type'],
                    'official_source_url': p['official_source_url'],
                    'official_portal_url': p.get('official_portal_url'),
                    'form_identifier': p['form_identifier'],
                    'form_name': p['form_name'],
                    'summary': p['summary'],
                    'eligibility_notes': p['eligibility_notes'],
                    'submission_method': p['submission_method'],
                    'direct_api_supported': p.get('direct_api_supported', False),
                    'procedure_status': p.get('procedure_status', 'VERIFIED'),
                    'step_by_step_instructions': p.get('step_by_step_instructions', []),
                    'required_documents': p.get('required_documents', []),
                    'fields_catalog': p.get('fields_catalog', [])
                }
            )

    def test_01_knowledge_base_seeded_and_versioned(self):
        """Verifies knowledge base procedures are versioned and officially sourced."""
        sbi_proc = ClaimProcedure.objects.filter(institution_id='sbi').first()
        self.assertIsNotNone(sbi_proc)
        self.assertEqual(sbi_proc.version, "v2024.1")
        self.assertIn("https://sbi.co.in", sbi_proc.official_source_url)
        self.assertGreater(len(sbi_proc.fields_catalog), 3)
        self.assertGreater(len(sbi_proc.required_documents), 3)

    def test_02_field_guidance_without_claimant_personal_data(self):
        """Tests that field guidance returns structured explanation with minimal metadata and zero personal leaks."""
        engine = ClaimCopilotGuidanceEngine()
        req = FieldGuidanceRequest(
            institution_id="sbi",
            procedure_version="v2024.1",
            field_id="account_number"
        )
        res = engine.get_guidance(req)
        self.assertEqual(res.field_id, "account_number")
        self.assertIn("11 numeric digits", res.expected_format)
        self.assertFalse(res.uncertainty_flag)
        self.assertIn("sbi.co.in", res.official_source_reference.lower())
        # Energy should be negligible
        self.assertLess(res.energy_wh, 0.0001)

    def test_03_unknown_field_returns_safe_uncertainty(self):
        """Tests that an unsupported/unknown field returns strict uncertainty without hallucination."""
        engine = ClaimCopilotGuidanceEngine()
        req = FieldGuidanceRequest(
            institution_id="sbi",
            procedure_version="v2024.1",
            field_id="unknown_arbitrary_field"
        )
        res = engine.get_guidance(req)
        self.assertTrue(res.uncertainty_flag)
        self.assertIn("not explicitly specified", res.field_explanation)
        self.assertFalse(res.is_mandatory)

    def test_04_copilot_guidance_cache_invalidation(self):
        """Tests cache hits and explicit invalidation upon procedure change."""
        engine = ClaimCopilotGuidanceEngine()
        req = FieldGuidanceRequest(
            institution_id="lic_india",
            procedure_version="v2024.1",
            field_id="policy_number"
        )
        # Call 1: deterministic lookup
        res1 = engine.get_guidance(req)
        self.assertEqual(res1.source_tier, "DETERMINISTIC_RULE")
        # Call 2: cache hit
        res2 = engine.get_guidance(req)
        self.assertEqual(res2.source_tier, "CACHE_HIT")
        # Invalidate
        engine.invalidate_cache()
        # Call 3: re-resolved deterministically
        res3 = engine.get_guidance(req)
        self.assertEqual(res3.source_tier, "DETERMINISTIC_RULE")

    def test_05_copilot_workspace_access_control(self):
        """Ensures cross-user isolation: other user cannot access claimant's copilot workspace."""
        self.client.force_login(self.other_user)
        resp = self.client.get(f'/claims/{self.session.id}/copilot/')
        self.assertEqual(resp.status_code, 403)

    def test_06_copilot_workspace_renders_authorized(self):
        """Ensures authorized claimant sees side-by-side workspace with correct procedure."""
        self.client.force_login(self.user)
        resp = self.client.get(f'/claims/{self.session.id}/copilot/?asset_id={self.asset_sbi.id}')
        self.assertEqual(resp.status_code, 200)
        self.assertTemplateUsed(resp, 'copilot_workspace.html')
        self.assertContains(resp, 'State Bank of India')
        self.assertContains(resp, 'Devendra Kumar Saini')

    def test_07_api_field_guidance_endpoint_authenticated(self):
        """Tests POST /api/claims/copilot/field-guidance/ requires authentication and returns structured guidance."""
        # Unauthenticated blocked
        anon_client = Client()
        resp_anon = anon_client.post(
            '/api/claims/copilot/field-guidance/',
            data=json.dumps({"field_id": "account_number", "institution_id": "sbi"}),
            content_type='application/json'
        )
        self.assertEqual(resp_anon.status_code, 401)

        # Authenticated succeeds
        self.client.force_login(self.user)
        resp_auth = self.client.post(
            '/api/claims/copilot/field-guidance/',
            data=json.dumps({"field_id": "deceased_name", "institution_id": "sbi"}),
            content_type='application/json'
        )
        self.assertEqual(resp_auth.status_code, 200)
        data = resp_auth.json()
        self.assertTrue(data.get("success"))
        self.assertIn("Death Certificate", data["guidance"]["where_to_find_information"])

    def test_08_checklist_progress_saving_and_status_transitions(self):
        """Tests saving checklist and preventing illegitimate claim completion transitions."""
        self.client.force_login(self.user)

        # Save checked documents
        payload = {
            "asset_id": self.asset_sbi.id,
            "checked_documents": ["Death Certificate", "Claimant Identity Proof"],
            "status": "DOCUMENTS_COLLECTED"
        }
        resp = self.client.post(
            f'/api/claims/{self.session.id}/copilot-progress/',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 200)

        prog = ClaimCopilotProgress.objects.get(session=self.session, asset=self.asset_sbi)
        self.assertEqual(prog.status, "DOCUMENTS_COLLECTED")
        self.assertEqual(len(prog.checked_document_ids), 2)

        # Record external submission evidence
        ack_payload = {
            "asset_id": self.asset_sbi.id,
            "acknowledgement_number": "SBI-BR-2024-88491",
            "servicing_branch": "Mumbai Main Branch (00001)"
        }
        resp_ack = self.client.post(
            f'/api/claims/{self.session.id}/copilot-progress/',
            data=json.dumps(ack_payload),
            content_type='application/json'
        )
        self.assertEqual(resp_ack.status_code, 200)
        prog.refresh_from_db()
        self.assertEqual(prog.status, "SUBMISSION_EVIDENCE_RECORDED")
        self.assertEqual(prog.acknowledgement_number, "SBI-BR-2024-88491")
        # Notice: is_institution_confirmed must remain False until independent bank confirmation
        self.assertFalse(prog.is_institution_confirmed)

    def test_09_user_cannot_self_confirm_institution_settlement(self):
        """Claimant cannot set INSTITUTION_CONFIRMED on self-report without administrative audit."""
        self.client.force_login(self.user)
        payload = {
            "asset_id": self.asset_sbi.id,
            "status": "INSTITUTION_CONFIRMED"
        }
        self.client.post(
            f'/api/claims/{self.session.id}/copilot-progress/',
            data=json.dumps(payload),
            content_type='application/json'
        )
        prog = ClaimCopilotProgress.objects.get(session=self.session, asset=self.asset_sbi)
        # Should be downgraded to SUBMISSION_EVIDENCE_RECORDED because non-staff user cannot verify institution
        self.assertEqual(prog.status, "SUBMISSION_EVIDENCE_RECORDED")
        self.assertFalse(prog.is_institution_confirmed)
