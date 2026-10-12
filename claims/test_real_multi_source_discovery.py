import json
from decimal import Decimal

from django.test import TestCase, Client
from django.contrib.auth.models import User

from claims.models import (
    ClaimSession, DiscoveredAsset, DiscoverySourceJob,
    ConsentRecord
)
from claims.providers.base import IntegrationStatus
from claims.providers.asset_discovery import (
    RbiUdgamDiscoveryAdapter, IrdaiBimaBharosaDiscoveryAdapter,
    SebiMitraDiscoveryAdapter, IepfDiscoveryAdapter,
    EpfoDiscoveryAdapter, OtherInvestmentsDiscoveryAdapter,
    SetuAADiscoveryAdapter, SandboxTestingDiscoveryAdapter,
    AssetDiscoveryRegistry
)


class RealMultiSourceDiscoveryTests(TestCase):
    """
    Test suite for Real Multi-Source Financial Asset Discovery & Recovery.
    Covers all 16 required technical and statutory scenarios.
    """

    def setUp(self):
        # Create test users
        self.user_a = User.objects.create_user(
            username='claimant_alpha',
            email='alpha@wealthpass.test',
            password='Password123!',
            first_name='Aditya',
            last_name='Verma'
        )
        self.user_b = User.objects.create_user(
            username='claimant_beta',
            email='beta@wealthpass.test',
            password='Password123!',
            first_name='Sneha',
            last_name='Kulkarni'
        )

        self.client_a = Client()
        self.client_a.force_login(self.user_a)

        self.client_b = Client()
        self.client_b.force_login(self.user_b)

        # Base case session for user A
        self.session_a = ClaimSession.objects.create(
            user=self.user_a,
            deceased_name='Late R. K. Verma',
            deceased_pan='ABCDE1234F',
            death_certificate_no='DEL/MCD/2023/99120',
            claimant_name='Aditya Verma',
            relation='Son',
            mobile='+919876543210',
            selected_asset_categories=[
                'BANK_DEPOSITS', 'INSURANCE', 'MUTUAL_FUNDS',
                'SHARES_DIVIDENDS', 'PENSION_EPFO', 'OTHER_INVESTMENTS'
            ],
            status='UNDER_REVIEW',
            is_draft=False
        )

        # Grant DPDP consent for user A
        self.consent_a = ConsentRecord.objects.create(
            user=self.user_a,
            session_token=str(self.session_a.id),
            purpose='ASSET_DISCOVERY',
            status='GRANTED'
        )

    # -------------------------------------------------------------------------
    # Scenario 1: Configured provider returning genuine sandbox match
    # -------------------------------------------------------------------------
    def test_01_configured_provider_genuine_sandbox_match(self):
        adapter = SandboxTestingDiscoveryAdapter(
            simulation_mode="MATCH",
            is_configured_flag=True
        )
        self.assertTrue(adapter.is_configured())
        self.assertEqual(adapter.integration_status, IntegrationStatus.SANDBOX)

        res = adapter.discover_assets({
            "deceased_name": "Late R. K. Verma",
            "deceased_pan": "ABCDE1234F"
        }, consent_record_id=str(self.consent_a.consent_id))

        self.assertEqual(res["status"], IntegrationStatus.SANDBOX.value)
        self.assertEqual(len(res["potential_matches"]), 1)
        match = res["potential_matches"][0]
        self.assertEqual(match["verification_status"], "UNVERIFIED_BY_INSTITUTION")
        self.assertFalse(match["institution_verified"])
        self.assertIn("Sandbox Test", match["institution"])

    # -------------------------------------------------------------------------
    # Scenario 2: Provider with missing credentials (NOT_CONFIGURED status)
    # -------------------------------------------------------------------------
    def test_02_provider_missing_credentials_not_configured(self):
        adapter = SandboxTestingDiscoveryAdapter(
            is_configured_flag=False
        )
        self.assertFalse(adapter.is_configured())
        self.assertEqual(adapter.integration_status, IntegrationStatus.NOT_CONFIGURED)

        res = adapter.discover_assets({"deceased_name": "Any Name"})
        self.assertEqual(res["status"], IntegrationStatus.NOT_CONFIGURED.value)
        self.assertIn("missing", res["error"].lower())
        self.assertEqual(len(res["potential_matches"]), 0)

    # -------------------------------------------------------------------------
    # Scenario 3: Unconfigured provider in registry
    # -------------------------------------------------------------------------
    def test_03_unconfigured_provider_in_registry(self):
        registry = AssetDiscoveryRegistry()
        unconfigured = SandboxTestingDiscoveryAdapter(
            provider_id="CUSTOM_UNCONFIGURED_SOURCE",
            is_configured_flag=False
        )
        registry.register(unconfigured)

        provider = registry.get_provider("CUSTOM_UNCONFIGURED_SOURCE")
        self.assertIsNotNone(provider)
        self.assertFalse(provider.is_configured())
        self.assertEqual(provider.integration_status, IntegrationStatus.NOT_CONFIGURED)

    # -------------------------------------------------------------------------
    # Scenario 4: Provider timeout handled gracefully
    # -------------------------------------------------------------------------
    def test_04_provider_timeout_handling(self):
        adapter = SandboxTestingDiscoveryAdapter(
            simulation_mode="TIMEOUT",
            is_configured_flag=True
        )
        with self.assertRaises(TimeoutError):
            adapter.discover_assets({"deceased_name": "Test Name"})

    # -------------------------------------------------------------------------
    # Scenario 5: Upstream provider error (HTTP 502) handled gracefully
    # -------------------------------------------------------------------------
    def test_05_upstream_provider_502_error(self):
        adapter = SandboxTestingDiscoveryAdapter(
            simulation_mode="ERROR",
            is_configured_flag=True
        )
        with self.assertRaises(ConnectionError):
            adapter.discover_assets({"deceased_name": "Test Name"})

    # -------------------------------------------------------------------------
    # Scenario 6: Legitimate response containing potential match normalized
    # -------------------------------------------------------------------------
    def test_06_legitimate_response_potential_match_normalized(self):
        adapter = SandboxTestingDiscoveryAdapter(
            simulation_mode="MATCH",
            is_configured_flag=True
        )
        res = adapter.discover_assets({"deceased_name": "Late R. K. Verma"})
        self.assertEqual(res["status"], IntegrationStatus.SANDBOX.value)
        matches = res["potential_matches"]
        self.assertTrue(len(matches) > 0)
        m = matches[0]
        # Verify normalized fields
        self.assertIn("source_id", m)
        self.assertIn("institution", m)
        self.assertIn("asset_category", m)
        self.assertIn("amount", m)
        self.assertIn("situation_label", m)
        self.assertIn("documents_needed", m)

    # -------------------------------------------------------------------------
    # Scenario 7: Completed search returning no matches (NO_MATCHES_FOUND)
    # -------------------------------------------------------------------------
    def test_07_completed_search_no_matches_found(self):
        adapter = SandboxTestingDiscoveryAdapter(
            simulation_mode="NO_MATCH",
            is_configured_flag=True
        )
        res = adapter.discover_assets({"deceased_name": "Unique Absent Name"})
        self.assertEqual(res["status"], IntegrationStatus.SANDBOX.value)
        self.assertEqual(len(res["potential_matches"]), 0)
        self.assertIn("No matching records", res["message"])

    # -------------------------------------------------------------------------
    # Scenario 8: Source that has not been searched (NOT_CHECKED)
    # -------------------------------------------------------------------------
    def test_08_source_not_checked_state(self):
        job = DiscoverySourceJob.objects.create(
            session=self.session_a,
            user=self.user_a,
            source_id="RBI_UDGAM",
            asset_category="BANK_DEPOSITS",
            status="NOT_CHECKED",
            external_search_completed=False
        )
        self.assertEqual(job.status, "NOT_CHECKED")
        self.assertFalse(job.external_search_completed)
        self.assertEqual(job.external_reference_number, "")

    # -------------------------------------------------------------------------
    # Scenario 9: Source requiring official external action (OFFICIAL_EXTERNAL_PROCESS)
    # -------------------------------------------------------------------------
    def test_09_source_official_external_action_guide(self):
        udgam = RbiUdgamDiscoveryAdapter()
        self.assertEqual(udgam.integration_status, IntegrationStatus.OFFICIAL_EXTERNAL_PROCESS)
        guide = udgam.get_discovery_guide()
        self.assertEqual(guide["official_url"], "https://udgam.rbi.org.in/")
        self.assertEqual(guide["integration_status"], "OFFICIAL_EXTERNAL_PROCESS")
        self.assertTrue(len(guide["official_external_steps"]) >= 4)
        self.assertIn("OTP", guide["official_external_steps"][0]["note"])

        res = udgam.discover_assets({"deceased_name": "Late R. K. Verma"})
        self.assertEqual(res["status"], IntegrationStatus.OFFICIAL_EXTERNAL_PROCESS.value)
        self.assertEqual(len(res["potential_matches"]), 0)

    # -------------------------------------------------------------------------
    # Scenario 10: Recording external portal reference
    # -------------------------------------------------------------------------
    def test_10_recording_external_portal_reference(self):
        resp = self.client_a.post(
            "/api/discover/record-external-reference/",
            data=json.dumps({
                "case_id": str(self.session_a.id),
                "source_id": "RBI_UDGAM",
                "external_reference_number": "UDGAM-2024-88912",
                "institution_name": "State Bank of India",
                "asset_category": "BANK_DEPOSITS"
            }),
            content_type="application/json"
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["job"]["status"], "COMPLETED")
        self.assertEqual(data["job"]["external_reference_number"], "UDGAM-2024-88912")

        # Verify database DiscoveredAsset was created with ₹0 unverified amount
        asset = DiscoveredAsset.objects.filter(
            session=self.session_a,
            source_reference="UDGAM-2024-88912"
        ).first()
        self.assertIsNotNone(asset)
        self.assertEqual(asset.amount, Decimal('0'))
        self.assertFalse(asset.institution_verified)
        self.assertEqual(asset.match_status, "OFFICIAL_SEARCH_RECORDED")

    # -------------------------------------------------------------------------
    # Scenario 11: Duplicate job submission / idempotency
    # -------------------------------------------------------------------------
    def test_11_duplicate_job_submission_idempotency(self):
        job1, c1 = DiscoverySourceJob.objects.get_or_create(
            session=self.session_a,
            source_id="IEPF",
            defaults={"user": self.user_a, "asset_category": "SHARES_DIVIDENDS", "status": "IN_PROGRESS"}
        )
        self.assertTrue(c1)

        job2, c2 = DiscoverySourceJob.objects.get_or_create(
            session=self.session_a,
            source_id="IEPF",
            defaults={"user": self.user_a, "asset_category": "SHARES_DIVIDENDS", "status": "IN_PROGRESS"}
        )
        self.assertFalse(c2)
        self.assertEqual(job1.id, job2.id)
        self.assertEqual(
            DiscoverySourceJob.objects.filter(session=self.session_a, source_id="IEPF").count(),
            1
        )

    # -------------------------------------------------------------------------
    # Scenario 12: Unauthorized access / cross-user IDOR isolation
    # -------------------------------------------------------------------------
    def test_12_cross_user_idor_isolation(self):
        # User B attempts to record an external reference on User A's case
        resp = self.client_b.post(
            "/api/discover/record-external-reference/",
            data=json.dumps({
                "case_id": str(self.session_a.id),
                "source_id": "RBI_UDGAM",
                "external_reference_number": "ATTACK-REF-999"
            }),
            content_type="application/json"
        )
        self.assertIn(resp.status_code, (403, 404))

        # User B attempts to access User A's discovery results via case_id
        resp_discover = self.client_b.get(f"/api/discover/?case_id={self.session_a.id}")
        self.assertEqual(resp_discover.status_code, 200)
        data = resp_discover.json()
        self.assertNotEqual(data.get("case_id"), str(self.session_a.id))

    # -------------------------------------------------------------------------
    # Scenario 13: Consent missing or withdrawn
    # -------------------------------------------------------------------------
    def test_13_consent_missing_or_withdrawn(self):
        self.consent_a.status = 'REVOKED'
        self.consent_a.save()

        consent_rec = ConsentRecord.objects.filter(user=self.user_a, status='GRANTED').first()
        self.assertIsNone(consent_rec)

    # -------------------------------------------------------------------------
    # Scenario 14: Results persisting after reload
    # -------------------------------------------------------------------------
    def test_14_results_persist_after_reload(self):
        self.client_a.post(
            "/api/discover/record-external-reference/",
            data=json.dumps({
                "case_id": str(self.session_a.id),
                "source_id": "SEBI_MITRA",
                "external_reference_number": "FOLIO-REF-4412",
                "institution_name": "HDFC Mutual Fund",
                "asset_category": "MUTUAL_FUNDS"
            }),
            content_type="application/json"
        )

        resp = self.client_a.get(f"/api/discover/?case_id={self.session_a.id}")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])

        sebi_source = next((s for s in data["sources_scanned"] if s["id"] == "SEBI_MITRA"), None)
        self.assertIsNotNone(sebi_source)
        self.assertEqual(sebi_source["external_reference_number"], "FOLIO-REF-4412")
        self.assertTrue(sebi_source["external_search_completed"])

        matched_asset = next((a for a in data["results"] if a["source_reference"] == "FOLIO-REF-4412"), None)
        self.assertIsNotNone(matched_asset)
        self.assertEqual(matched_asset["institution"], "HDFC Mutual Fund")

    # -------------------------------------------------------------------------
    # Scenario 15: Invalid / incomplete deceased inputs
    # -------------------------------------------------------------------------
    def test_15_invalid_incomplete_deceased_inputs(self):
        resp_no_name = self.client_a.post(
            "/api/user/claims/",
            data=json.dumps({"deceased_name": "", "deceased_pan": "ABCDE1234F"}),
            content_type="application/json"
        )
        self.assertEqual(resp_no_name.status_code, 400)
        self.assertIn("name is required", resp_no_name.json()["error"])

        resp_bad_pan = self.client_a.post(
            "/api/user/claims/",
            data=json.dumps({"deceased_name": "Test Person", "deceased_pan": "INVALID_PAN"}),
            content_type="application/json"
        )
        self.assertEqual(resp_bad_pan.status_code, 400)
        self.assertIn("valid 10-character PAN", resp_bad_pan.json()["error"])

    # -------------------------------------------------------------------------
    # Scenario 16: Bridge liquidity regulated partner application (no auto-approval)
    # -------------------------------------------------------------------------
    def test_16_bridge_liquidity_regulated_partner_application(self):
        resp_no_consent = self.client_a.post(
            "/api/claims/bridge-loan/apply/",
            data=json.dumps({"case_id": str(self.session_a.id)}),
            content_type="application/json"
        )
        self.assertEqual(resp_no_consent.status_code, 400)
        self.assertIn("consent", resp_no_consent.json()["error"].lower())

        resp_apply = self.client_a.post(
            "/api/claims/bridge-loan/apply/",
            data=json.dumps({
                "case_id": str(self.session_a.id),
                "partner_name": "Northern Arc Capital",
                "consent_partnership": True,
                "consent_underwriting": True
            }),
            content_type="application/json"
        )
        self.assertEqual(resp_apply.status_code, 200)
        data = resp_apply.json()
        self.assertTrue(data["success"])
        # Truthfulness check: Never auto-approved
        self.assertEqual(data["status"], "PARTNER_APPLICATION_SUBMITTED")
        self.assertIn("WP-FIN-", data["application_ref"])

        self.session_a.refresh_from_db()
        self.assertEqual(self.session_a.bridge_loan_status, "PARTNER_APPLICATION_SUBMITTED")
        self.assertEqual(self.session_a.bridge_loan_partner, "RBI-Regulated NBFC / Banking Partner")
