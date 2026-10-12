"""
Automated Test Suite for Per-Bank Directory (Part 1).
Validates models, management command, mapping rules, public URLs, and view rendering.
"""
from django.test import TestCase, Client
from django.utils import timezone
from forms_guide.models import BankDirectory, BankFormLink, BankExtraRequirement, FormAlias, RBIAnnex, DirectoryStatus


class BankDirectoryTests(TestCase):
    def setUp(self):
        self.client = Client()
        # Create sample banks
        self.sbi = BankDirectory.objects.create(
            bank="State Bank of India",
            bank_code="sbi",
            claim_page_url="https://sbi.bank.in/web/personal-banking/information-services/deceased-settlement",
            online_claim_available=True,
            tracking_available=True,
            status=DirectoryStatus.VERIFIED
        )
        self.hdfc = BankDirectory.objects.create(
            bank="HDFC Bank",
            bank_code="hdfc",
            claim_page_url="https://www.hdfcbank.com/personal/useful-links/settlement-of-claim-of-deceased-depositor",
            online_claim_available=True,
            tracking_available=True,
            status=DirectoryStatus.BLOCKED
        )

        # Create form links
        self.sbi_form = BankFormLink.objects.create(
            bank=self.sbi,
            label_as_published="Annexure-A: Application for Settlement of Claim",
            official_download_url="https://sbi.bank.in/web/business/forms/deceased-claim-forms",
            maps_to_rbi_annex=RBIAnnex.ANNEX_I_A,
            differs_from_rbi=False
        )

        # Create extra requirement
        self.sbi_extra = BankExtraRequirement.objects.create(
            bank=self.sbi,
            scenario="no_nominee",
            text_as_published="Balances exceeding 5 Lakhs require Indemnity bond with two independent sureties.",
            source_url="https://sbi.bank.in/web/personal-banking/information-services/deceased-settlement",
            verified_at=timezone.now()
        )

        # Create FormAlias
        self.alias = FormAlias.objects.create(
            alias_text="Form 14",
            maps_to_rbi_annex=RBIAnnex.ANNEX_I_A
        )

    def test_01_bank_directory_models(self):
        """Verifies BankDirectory and FormLink attributes and mappings."""
        self.assertEqual(self.sbi.bank_code, "sbi")
        self.assertTrue(self.sbi.online_claim_available)
        self.assertEqual(self.sbi_form.maps_to_rbi_annex, "Annex I-A")
        self.assertEqual(self.alias.maps_to_rbi_annex, "Annex I-A")

    def test_02_bank_directory_view_renders_sbi(self):
        """Tests that /guide/banks/?bank=sbi renders SBI page, forms, and extra requirements."""
        resp = self.client.get('/guide/banks/?bank=sbi&scenario=nominee')
        self.assertEqual(resp.status_code, 200)
        self.assertTemplateUsed(resp, 'forms_guide/bank_directory.html')
        self.assertContains(resp, 'State Bank of India')
        self.assertContains(resp, 'Annexure-A')
        self.assertContains(resp, '15 Calendar Days Timeline')

    def test_03_bank_directory_view_renders_hdfc(self):
        """Tests that /guide/banks/?bank=hdfc renders HDFC page and blocked status flag."""
        resp = self.client.get('/guide/banks/?bank=hdfc&scenario=no_nominee')
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, 'HDFC Bank')
        self.assertIn('blocked', resp.content.decode('utf-8').lower())

    def test_04_api_bank_directory_endpoint(self):
        """Tests /guide/api/banks/ returns structured verified bank JSON."""
        resp = self.client.get('/guide/api/banks/?bank_code=sbi')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get('success'))
        self.assertEqual(len(data['banks']), 1)
        self.assertEqual(data['banks'][0]['bank'], 'State Bank of India')
        self.assertEqual(data['banks'][0]['forms'][0]['maps_to_rbi_annex'], 'Annex I-A')

    def test_05_wealth_buddy_pii_discard(self):
        """Rule 2: Buddy rejects and discards Aadhaar, PAN, and account numbers without saving."""
        from forms_guide.buddy_service import ask_buddy_grounded
        
        # Test Aadhaar
        res1 = ask_buddy_grounded("My Aadhaar is 5482 1234 5678, what do I do?")
        self.assertEqual(res1["status"], "pii_rejected")
        self.assertIn("Aadhaar", res1["answer"])
        
        # Test PAN
        res2 = ask_buddy_grounded("Deceased person PAN is ABCDE1234F")
        self.assertEqual(res2["status"], "pii_rejected")
        self.assertIn("PAN", res2["answer"])

        # Test Account Number
        res3 = ask_buddy_grounded("My account number is 100234567890")
        self.assertEqual(res3["status"], "pii_rejected")
        self.assertIn("Account Number", res3["answer"])

    def test_06_wealth_buddy_refusal_threshold(self):
        """Rule 3: Buddy answers only from verified content; refuses ungrounded questions and legal advice."""
        from forms_guide.buddy_service import ask_buddy_grounded
        
        # Legal dispute question
        res1 = ask_buddy_grounded("Should I sue the bank for compensation and hire an advocate?")
        self.assertEqual(res1["status"], "refusal")
        self.assertEqual(res1["answer"], "I'm not sure, please check with your bank or a lawyer.")

        # Completely ungrounded question
        res2 = ask_buddy_grounded("How do I bake chocolate chip cookies in an oven?")
        self.assertEqual(res2["status"], "refusal")
        self.assertEqual(res2["answer"], "I'm not sure, please check with your bank or a lawyer.")

    def test_07_wealth_buddy_timeline_citation(self):
        """Buddy correctly answers 15-day timeline and cites RBI Master Directions."""
        from forms_guide.buddy_service import ask_buddy_grounded
        res = ask_buddy_grounded("What is the 15-day settlement timeline?")
        self.assertEqual(res["status"], "answered")
        self.assertIn("15 calendar days", res["answer"])
        self.assertIn("RBI Master Directions", res["citation"])

    def test_08_wealth_buddy_form_alias_resolution(self):
        """Buddy resolves 'Form 14' to RBI Annex I-A using FormAlias."""
        from forms_guide.buddy_service import ask_buddy_grounded
        res = ask_buddy_grounded("Which form is Form 14?")
        self.assertEqual(res["status"], "answered")
        self.assertIn("Annex I-A", res["answer"])
        self.assertIn("Form 14", res["citation"])

    def test_09_rule_4_hindi_human_review_enforcement(self):
        """Rule 4: Hindi text is published ONLY if reviewed_by and reviewed_at are present."""
        from forms_guide.models import FormGuideSection
        from forms_guide.buddy_service import get_bilingual_guide
        
        # Section with human review
        sec_reviewed = FormGuideSection.objects.create(
            annex="Annex I-B",
            section_number=1,
            section_title="Survivorship Claim Details",
            what_this_is="Claim by survivor in either or survivor account.",
            where_to_find="Passbook",
            who_must_sign="Surviving joint holder",
            stamp_notary_needed="None",
            hindi_title="उत्तरजीविता दावा",
            hindi_explanation="संयुक्त खाते में जीवित खाताधारक द्वारा दावा।",
            reviewed_by="Certified Reviewer",
            reviewed_at=timezone.now()
        )
        res_reviewed = get_bilingual_guide("Annex I-B", 1, lang="hi")
        self.assertEqual(res_reviewed["language"], "hi")
        self.assertEqual(res_reviewed["title"], "उत्तरजीविता दावा")

        # Section without human review
        sec_unreviewed = FormGuideSection.objects.create(
            annex="Annex I-H",
            section_number=1,
            section_title="Unreviewed Locker Section",
            what_this_is="Draft explanation",
            where_to_find="Locker",
            who_must_sign="Heirs",
            stamp_notary_needed="None",
            hindi_title="अप्रमाणित हिन्दी",
            hindi_explanation="ड्राफ्ट",
            reviewed_by="", # Not reviewed
            reviewed_at=timezone.now()
        )
        res_unreviewed = get_bilingual_guide("Annex I-H", 1, lang="hi")
        self.assertEqual(res_unreviewed["language"], "en") # Fallback enforced!
        self.assertIn("pending", res_unreviewed["fallback_note"].lower())

    def test_10_energy_benchmark_dashboard_and_telemetry(self):
        """Rule 5 & Part 3: Measures telemetry with MEASURED vs ESTIMATED tags and renders dashboard."""
        from forms_guide.models import EnergyTelemetry
        initial_count = EnergyTelemetry.objects.count()

        # Trigger Buddy API query
        resp = self.client.post(
            '/guide/api/buddy/ask/',
            data='{"query": "Do I need a notary or stamp paper?"}',
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(EnergyTelemetry.objects.count(), initial_count + 1)
        latest = EnergyTelemetry.objects.first()
        self.assertEqual(latest.measurement_tag, "MEASURED")
        self.assertGreater(latest.energy_saved_pct, 50.0) # >50% energy cut required

        # Check Energy dashboard page
        dash_resp = self.client.get('/guide/energy/')
        self.assertEqual(dash_resp.status_code, 200)
        self.assertContains(dash_resp, "MEASURED")
        self.assertContains(dash_resp, "ESTIMATED")
        self.assertContains(dash_resp, "Green AI")

