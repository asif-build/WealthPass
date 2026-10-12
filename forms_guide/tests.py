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
