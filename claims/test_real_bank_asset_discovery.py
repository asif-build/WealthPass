import json
import uuid
from decimal import Decimal
from unittest.mock import patch, MagicMock
from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.utils import timezone

from claims.models import (
    ClaimSession,
    DiscoverySourceJob,
    DiscoveredAsset,
    ConsentRecord,
    AuditLog,
)
from claims.providers.asset_discovery import (
    AssetDiscoveryRegistry,
    RbiUdgamDiscoveryAdapter,
    SetuAADiscoveryAdapter,
    IntegrationStatus,
)


class GenuineBankAssetDiscoveryTests(TestCase):
    """
    Milestone 1 Test Suite: Genuine Bank Asset Discovery & Case Dossier.
    Tests all 10 core verification requirements:
    1. Case creation
    2. Discovery-job creation
    3. Actual provider execution
    4. Genuine response parsing
    5. Database persistence
    6. Dossier updates after completion
    7. Refresh persistence
    8. No-match handling
    9. Provider failures
    10. Cross-user access protection (IDOR)
    """

    def setUp(self):
        self.client = Client()
        self.user_a = User.objects.create_user(
            username="claimant_a",
            password="StrongPassword#123",
            email="claimant_a@example.com",
            first_name="Rohan",
            last_name="Mehta"
        )
        self.user_b = User.objects.create_user(
            username="claimant_b",
            password="StrongPassword#123",
            email="claimant_b@example.com",
            first_name="Priya",
            last_name="Sharma"
        )
        self.client.force_login(self.user_a)

    # -------------------------------------------------------------------------
    # 1. CASE CREATION
    # -------------------------------------------------------------------------
    @patch("claims.setu_client.create_consent")
    def test_01_case_creation_initializes_statutory_jobs_and_zero_fabricated_assets(self, mock_create):
        """
        Verify case creation initiates discovery jobs for selected categories
        and never fabricates fake assets or balances.
        """
        mock_create.return_value = {
            "id": "c-test-01",
            "status": "PENDING",
            "url": "https://fiu-uat.setu.co/v2/consents/ui/c-test-01"
        }
        payload = {
            "deceased_name": "Late Rajesh Mehta",
            "deceased_pan": "ABCDE1234F",
            "pan_unknown": False,
            "death_certificate_no": "DEATH/2026/98214",
            "claimant_name": "Rohan Mehta",
            "relation": "Son",
            "mobile": "+919876543210",
            "selected_asset_categories": ["BANK_DEPOSITS", "INSURANCE"]
        }
        resp = self.client.post(
            "/api/user/claims/",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertTrue(data.get("success"))
        claim_id = data["claim"]["id"]

        session = ClaimSession.objects.get(id=claim_id)
        self.assertEqual(session.user, self.user_a)
        self.assertEqual(session.deceased_name, "Late Rajesh Mehta")
        self.assertEqual(session.status, "UNDER_REVIEW")
        self.assertEqual(session.total_assets_found, Decimal("0.00"))
        self.assertEqual(session.bridge_loan_available, Decimal("0.00"))
        self.assertEqual(session.assets.count(), 0, "No fake assets should be created on intake!")

        # Verify discovery source jobs created for BANK_DEPOSITS
        job_udgam = DiscoverySourceJob.objects.filter(session=session, source_id="RBI_UDGAM").first()
        self.assertIsNotNone(job_udgam)
        self.assertEqual(job_udgam.status, "OFFICIAL_EXTERNAL_ACTION_REQUIRED")
        self.assertFalse(job_udgam.is_live_api)
        self.assertIn("udgam.rbi.org.in", job_udgam.external_portal_url)

        job_setu = DiscoverySourceJob.objects.filter(session=session, source_id="SETU_AA_DISCOVERY").first()
        self.assertIsNotNone(job_setu)
        self.assertTrue(job_setu.is_live_api)

    # -------------------------------------------------------------------------
    # 2. DISCOVERY-JOB CREATION FOR ALL STATUTORY SOURCES
    # -------------------------------------------------------------------------
    @patch("claims.setu_client.create_consent")
    def test_02_discovery_jobs_created_for_all_statutory_categories(self, mock_create):
        """
        Verify that selecting all statutory categories creates jobs for:
        RBI UDGAM, Setu AA, IRDAI Bima Bharosa, SEBI MITRA, IEPFA, and EPFO.
        """
        mock_create.return_value = {
            "id": "c-test-02",
            "status": "PENDING",
            "url": "https://fiu-uat.setu.co/v2/consents/ui/c-test-02"
        }
        payload = {
            "deceased_name": "Late Anita Deshmukh",
            "deceased_pan": "XYZPA9988K",
            "pan_unknown": False,
            "death_certificate_no": "DEATH/2026/11029",
            "claimant_name": "Rohan Mehta",
            "relation": "Son",
            "mobile": "9876543210",
            "selected_asset_categories": [
                "BANK_DEPOSITS", "INSURANCE", "MUTUAL_FUNDS",
                "SHARES_DIVIDENDS", "PENSION_EPFO", "OTHER_INVESTMENTS"
            ]
        }
        resp = self.client.post("/api/user/claims/", data=json.dumps(payload), content_type="application/json")
        self.assertEqual(resp.status_code, 201)
        session = ClaimSession.objects.get(id=resp.json()["claim"]["id"])

        source_ids = list(session.source_jobs.values_list("source_id", flat=True))
        self.assertIn("RBI_UDGAM", source_ids)
        self.assertIn("SETU_AA_DISCOVERY", source_ids)
        self.assertIn("IRDAI_BIMA_BHAROSA", source_ids)
        self.assertIn("SEBI_MITRA", source_ids)
        self.assertIn("IEPF", source_ids)
        self.assertIn("EPFO_SERVICES", source_ids)

    # -------------------------------------------------------------------------
    # 3. ACTUAL PROVIDER EXECUTION (SETU AA ADAPTER)
    # -------------------------------------------------------------------------
    @patch("claims.setu_client.create_consent")
    def test_03_actual_provider_execution_with_consent_creation(self, mock_create_consent):
        """
        Verify provider execution creates a real consent request via Setu AA client
        and captures the consent ID and consent URL.
        """
        mock_create_consent.return_value = {
            "id": "c7890123-4567-89ab-cdef-0123456789ab",
            "status": "PENDING",
            "url": "https://fiu-uat.setu.co/v2/consents/ui/c7890123-4567-89ab-cdef-0123456789ab"
        }

        adapter = SetuAADiscoveryAdapter()
        res = adapter.discover_assets({"mobile": "9876543210"})

        self.assertEqual(res["source_id"], "SETU_AA_DISCOVERY")
        self.assertEqual(res["status"], "CONSENT_PENDING")
        self.assertEqual(res["consent_id"], "c7890123-4567-89ab-cdef-0123456789ab")
        self.assertEqual(res["consent_url"], "https://fiu-uat.setu.co/v2/consents/ui/c7890123-4567-89ab-cdef-0123456789ab")
        self.assertTrue(res["is_live_api"])
        mock_create_consent.assert_called_once_with("9876543210")

    # -------------------------------------------------------------------------
    # 4. GENUINE RESPONSE PARSING (LINKED ACCOUNTS DISCOVERY)
    # -------------------------------------------------------------------------
    @patch("claims.setu_client.get_consent")
    def test_04_genuine_response_parsing_from_approved_consent(self, mock_get_consent):
        """
        Verify parsing of real Setu AA linked accounts into normalized bank assets.
        """
        mock_get_consent.return_value = {
            "id": "c7890123-4567-89ab-cdef-0123456789ab",
            "status": "ACTIVE",
            "url": "https://fiu-uat.setu.co/v2/consents/ui/c7890123-4567-89ab-cdef-0123456789ab",
            "accountsLinked": [
                {
                    "fipId": "HDFC-FIP",
                    "accountType": "SAVINGS",
                    "maskedAccNumber": "XXXX-XXXX-8910",
                    "linkRefNumber": "LNK-HDFC-99124"
                },
                {
                    "fipId": "SBIN-FIP",
                    "accountType": "TERM_DEPOSIT",
                    "maskedAccNumber": "XXXX-XXXX-4421",
                    "linkRefNumber": "LNK-SBI-11029"
                }
            ]
        }

        adapter = SetuAADiscoveryAdapter()
        res = adapter.discover_assets({"consent_id": "c7890123-4567-89ab-cdef-0123456789ab", "mobile": "9876543210"})

        self.assertEqual(res["status"], "COMPLETED")
        self.assertEqual(len(res["potential_matches"]), 2)

        m1 = res["potential_matches"][0]
        self.assertEqual(m1["institution"], "HDFC-FIP")
        self.assertEqual(m1["masked_reference"], "XXXX-XXXX-8910")
        self.assertEqual(m1["source_reference"], "LNK-HDFC-99124")
        self.assertTrue(m1["is_amount_undisclosed"])
        self.assertEqual(m1["verification_status"], "API_VERIFIED")
        self.assertTrue(m1["institution_verified"])

        m2 = res["potential_matches"][1]
        self.assertEqual(m2["institution"], "SBIN-FIP")
        self.assertEqual(m2["masked_reference"], "XXXX-XXXX-4421")

    # -------------------------------------------------------------------------
    # 5. DATABASE PERSISTENCE FOR BANK ASSETS
    # -------------------------------------------------------------------------
    def test_05_database_persistence_of_reported_official_search_asset(self):
        """
        Verify that recording an official RBI UDGAM search persists a DiscoveredAsset
        with is_amount_undisclosed=True, CLAIMANT_REPORTED_OFFICIAL_SEARCH status,
        and accurately updates DiscoverySourceJob.
        """
        session = ClaimSession.objects.create(
            user=self.user_a,
            deceased_name="Late Vikram Sen",
            deceased_pan="ABCDE1122F",
            claimant_name="Rohan Mehta",
            relation="Son",
            mobile="+919876543210"
        )
        job = DiscoverySourceJob.objects.create(
            session=session,
            user=self.user_a,
            source_id="RBI_UDGAM",
            asset_category="BANK_DEPOSITS",
            status="OFFICIAL_EXTERNAL_ACTION_REQUIRED"
        )

        payload = {
            "case_id": str(session.id),
            "source_id": "RBI_UDGAM",
            "external_reference_number": "UDGAM-2026-88194",
            "institution_name": "Punjab National Bank",
            "search_outcome": "MATCH_FOUND"
        }
        resp = self.client.post(
            "/api/discover/record-external-reference/",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])

        # Check DiscoveredAsset in DB
        asset = DiscoveredAsset.objects.get(id=data["asset"]["id"])
        self.assertEqual(asset.session, session)
        self.assertEqual(asset.user, self.user_a)
        self.assertEqual(asset.institution, "Punjab National Bank")
        self.assertEqual(asset.source_reference, "UDGAM-2026-88194")
        self.assertEqual(asset.amount, Decimal("0.00"))
        self.assertTrue(asset.is_amount_undisclosed)
        self.assertEqual(asset.verification_status, "CLAIMANT_REPORTED_OFFICIAL_SEARCH")
        self.assertEqual(asset.match_status, "OFFICIAL_SEARCH_RECORDED")
        self.assertFalse(asset.institution_verified)
        self.assertIn("Bank Form 14", str(asset.documents_needed))

        # Check DiscoverySourceJob in DB
        job.refresh_from_db()
        self.assertEqual(job.status, "COMPLETED")
        self.assertTrue(job.external_search_completed)
        self.assertEqual(job.external_reference_number, "UDGAM-2026-88194")
        self.assertIsNotNone(job.external_search_date)

    # -------------------------------------------------------------------------
    # 6. DOSSIER UPDATES AFTER DISCOVERY COMPLETION
    # -------------------------------------------------------------------------
    def test_06_dossier_updates_reflect_in_api_and_print_forms(self):
        """
        Verify that after recording an official bank asset match:
        - GET /api/user/claims/<id>/ returns the asset and source job with undisclosed valuation.
        - GET /print-forms/<id>/ renders the statutory discovery table and Bank Form 14 guidance.
        - GET /results/<id>/ renders pending branch valuation instead of false ₹0.
        """
        session = ClaimSession.objects.create(
            user=self.user_a,
            deceased_name="Late Sitaram Joshi",
            deceased_pan="PQRST5432M",
            death_certificate_no="CERT-890123",
            claimant_name="Rohan Mehta",
            relation="Son",
            mobile="+919876543210"
        )
        DiscoverySourceJob.objects.create(
            session=session,
            user=self.user_a,
            source_id="RBI_UDGAM",
            asset_category="BANK_DEPOSITS",
            status="COMPLETED",
            external_reference_number="UDGAM-PUNB-4412",
            external_search_completed=True
        )
        DiscoveredAsset.objects.create(
            session=session,
            user=self.user_a,
            source_id="RBI_UDGAM",
            source_reference="UDGAM-PUNB-4412",
            asset_category="BANK_DEPOSITS",
            institution="Bank of Baroda",
            amount=Decimal("0.00"),
            is_amount_undisclosed=True,
            masked_reference="REF-UDGA****",
            situation_label="Unclaimed Savings Deposit",
            verification_status="CLAIMANT_REPORTED_OFFICIAL_SEARCH",
            match_status="OFFICIAL_SEARCH_RECORDED",
            documents_needed=["Bank Form 14", "Death Certificate"]
        )

        # Verify API Detail
        resp_api = self.client.get(f"/api/user/claims/{session.id}/")
        self.assertEqual(resp_api.status_code, 200)
        claim_data = resp_api.json()["claim"]
        self.assertEqual(len(claim_data["assets"]), 1)
        self.assertTrue(claim_data["assets"][0]["is_amount_undisclosed"])
        self.assertEqual(claim_data["assets"][0]["potential_value_display"], "Valuation Pending Branch Verification")
        self.assertEqual(len(claim_data["source_jobs"]), 1)
        self.assertEqual(claim_data["source_jobs"][0]["status"], "COMPLETED")
        self.assertEqual(claim_data["source_jobs"][0]["external_reference_number"], "UDGAM-PUNB-4412")

        # Verify Print Forms HTML
        resp_print = self.client.get(f"/print-forms/{session.id}/")
        self.assertEqual(resp_print.status_code, 200)
        html = resp_print.content.decode("utf-8")
        self.assertIn("Bank of Baroda", html)
        self.assertIn("Valuation Pending Branch Verification", html)
        self.assertIn("UDGAM-PUNB-4412", html)
        self.assertIn("Statutory Banking Claim Protocol (Bank Form 14)", html)

        # Verify Results HTML
        resp_results = self.client.get(f"/results/{session.id}/")
        self.assertEqual(resp_results.status_code, 200)
        res_html = resp_results.content.decode("utf-8")
        self.assertIn("Bank of Baroda", res_html)
        self.assertIn("Valuation Pending Branch Verification", res_html)

    # -------------------------------------------------------------------------
    # 7. REFRESH PERSISTENCE
    # -------------------------------------------------------------------------
    def test_07_refresh_persistence_maintains_consistent_state(self):
        """
        Verify that multiple consecutive calls to /api/user/claims/<id>/ and /api/discover/
        return identical persisted state without side effects.
        """
        session = ClaimSession.objects.create(
            user=self.user_a,
            deceased_name="Late Ramesh Patel",
            claimant_name="Rohan Mehta"
        )
        DiscoverySourceJob.objects.create(
            session=session,
            user=self.user_a,
            source_id="RBI_UDGAM",
            asset_category="BANK_DEPOSITS",
            status="OFFICIAL_EXTERNAL_ACTION_REQUIRED"
        )

        r1 = self.client.get(f"/api/user/claims/{session.id}/").json()
        r2 = self.client.get(f"/api/user/claims/{session.id}/").json()
        r3 = self.client.get(f"/api/discover/?case_id={session.id}").json()

        self.assertEqual(r1["claim"]["id"], r2["claim"]["id"])
        self.assertEqual(r1["claim"]["source_jobs"], r2["claim"]["source_jobs"])
        self.assertEqual(r3["case_id"], str(session.id))
        self.assertEqual(r3["summary"]["potential_assets_count"], 0)

    # -------------------------------------------------------------------------
    # 8. NO-MATCH HANDLING
    # -------------------------------------------------------------------------
    def test_08_no_match_handling_updates_job_without_claiming_case_has_zero_total_assets(self):
        """
        Verify that when a user records a NO_MATCH_FOUND outcome:
        - Job status becomes NO_MATCHES_FOUND
        - No fake asset is created
        - Does not falsely claim no assets exist anywhere in the world
        """
        session = ClaimSession.objects.create(
            user=self.user_a,
            deceased_name="Late Gopal Varma",
            claimant_name="Rohan Mehta"
        )
        job = DiscoverySourceJob.objects.create(
            session=session,
            user=self.user_a,
            source_id="RBI_UDGAM",
            asset_category="BANK_DEPOSITS",
            status="OFFICIAL_EXTERNAL_ACTION_REQUIRED"
        )

        payload = {
            "case_id": str(session.id),
            "source_id": "RBI_UDGAM",
            "external_reference_number": "UDGAM-SEARCH-NOMATCH",
            "search_outcome": "NO_MATCH_FOUND"
        }
        resp = self.client.post(
            "/api/discover/record-external-reference/",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "NO_MATCHES_FOUND")
        self.assertIn("No matching records identified in official registry", data["message"])

        job.refresh_from_db()
        self.assertEqual(job.status, "NO_MATCHES_FOUND")
        self.assertEqual(session.assets.count(), 0)

        # Audit log verification
        log = AuditLog.objects.filter(event_type="OFFICIAL_SEARCH_NO_MATCH_RECORDED").first()
        self.assertIsNotNone(log)
        self.assertEqual(log.details["source_id"], "RBI_UDGAM")

    # -------------------------------------------------------------------------
    # 9. PROVIDER FAILURES
    # -------------------------------------------------------------------------
    @patch("claims.setu_client.get_consent")
    def test_09_provider_failure_handled_gracefully(self, mock_get_consent):
        """
        Verify that when a provider API fails (e.g. Setu HTTP 500 or timeout),
        the endpoint returns appropriate error status without crashing.
        """
        mock_get_consent.side_effect = RuntimeError("Setu API gateway timeout (504)")

        session = ClaimSession.objects.create(
            user=self.user_a,
            deceased_name="Late Devendra Joshi",
            setu_consent_id="err-consent-id-12345",
            mobile="+919876543210"
        )
        job = DiscoverySourceJob.objects.create(
            session=session,
            user=self.user_a,
            source_id="SETU_AA_DISCOVERY",
            asset_category="BANK_DEPOSITS",
            status="CONSENT_PENDING"
        )

        resp = self.client.post(
            "/api/discover/setu/check-status/",
            data=json.dumps({"case_id": str(session.id)}),
            content_type="application/json"
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["result"]["status"], "FAILED")
        self.assertIn("Setu AA call failed", data["result"]["error"])

    # -------------------------------------------------------------------------
    # 10. CROSS-USER ACCESS PROTECTION (IDOR)
    # -------------------------------------------------------------------------
    def test_10_cross_user_access_protection_enforces_strict_isolation(self):
        """
        Verify that User B cannot view User A's dossier, cannot record references
        on User A's case, and cannot check User A's Setu AA status.
        """
        session_a = ClaimSession.objects.create(
            user=self.user_a,
            deceased_name="Late Secret Person",
            claimant_name="Rohan Mehta"
        )

        # Log in as User B
        self.client.force_login(self.user_b)

        # 1. User B tries to view User A's claim details
        resp_detail = self.client.get(f"/api/user/claims/{session_a.id}/")
        self.assertIn(resp_detail.status_code, [403, 404])

        # 2. User B tries to view User A's print forms
        resp_print = self.client.get(f"/print-forms/{session_a.id}/")
        self.assertIn(resp_print.status_code, [403, 404])

        # 3. User B tries to view User A's results page
        resp_results = self.client.get(f"/results/{session_a.id}/")
        self.assertIn(resp_results.status_code, [403, 404])

        # 4. User B tries to record external reference on User A's case
        resp_record = self.client.post(
            "/api/discover/record-external-reference/",
            data=json.dumps({
                "case_id": str(session_a.id),
                "source_id": "RBI_UDGAM",
                "external_reference_number": "ATTACK-1234"
            }),
            content_type="application/json"
        )
        self.assertIn(resp_record.status_code, [403, 404])

        # 5. User B tries to trigger Setu check on User A's case
        resp_setu = self.client.post(
            "/api/discover/setu/check-status/",
            data=json.dumps({"case_id": str(session_a.id)}),
            content_type="application/json"
        )
        self.assertIn(resp_setu.status_code, [403, 404])
