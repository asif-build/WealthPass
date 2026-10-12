"""
Comprehensive Test Suite for Green AI Document Intelligence.
Covers:
1. Synthetic dataset generation, stratification, and split integrity
2. Strict Pydantic schema validation & missing-field nullability
3. Layer A deterministic keyword & statutory rules
4. Layer B fast TF-IDF + Logistic Regression classification
5. Layer C baseline model inference & telemetry
6. Layer D SHA-256 hash caching & invalidation
7. Ambiguous crossover pattern escalation
8. Zero-hallucination defense on missing fields
9. Authenticated API endpoint & authorization enforcement
10. Energy benchmark telemetry reporting
"""
import json
import uuid
from decimal import Decimal
from django.test import TestCase, Client
from django.contrib.auth.models import User

from claims.doc_intelligence.schemas import (
    DocumentCategory, DocumentIntelligenceResult, BankStatementFields,
    InsurancePolicyFields, EPFDocumentFields, MutualFundCASFields,
    SecuritiesCertificateFields, UnknownDocumentFields, PipelineType,
    ClassificationMethod
)
from claims.doc_intelligence.dataset_generator import generate_dataset, split_dataset
from claims.doc_intelligence.rules_engine import evaluate_deterministic_rules, extract_fields_by_category
from claims.doc_intelligence.fast_classifier import FastDocumentClassifier
from claims.doc_intelligence.llm_baseline import BaselineDocumentPipeline
from claims.doc_intelligence.cascade_pipeline import GreenDocumentIntelligenceCascade
from claims.models import DocumentIntelligenceRun, DocumentIntelligenceCache, GreenAIBenchmarkRecord


class GreenAIDocumentIntelligenceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="test_ai_user", password="password123")
        self.client = Client()
        self.client.force_login(self.user)
        self.anon_client = Client()

    def test_01_synthetic_dataset_generation_and_splits(self):
        """Verifies synthetic dataset contains 240 documents (40/category) across 6 categories with clean splits."""
        dataset = generate_dataset(total_per_category=40, seed=42)
        self.assertEqual(len(dataset), 240)

        # Check category distribution
        counts = {}
        for doc in dataset:
            counts[doc["category"]] = counts.get(doc["category"], 0) + 1
        for cat in DocumentCategory:
            self.assertEqual(counts[cat.value], 40)

        # Stratified split test
        splits = split_dataset(dataset, train_ratio=0.6, val_ratio=0.2)
        self.assertEqual(len(splits["train"]), 144)  # 60%
        self.assertEqual(len(splits["val"]), 48)     # 20%
        self.assertEqual(len(splits["test"]), 48)    # 20%

        # No ID overlap across splits
        train_ids = {d["id"] for d in splits["train"]}
        test_ids = {d["id"] for d in splits["test"]}
        self.assertEqual(len(train_ids.intersection(test_ids)), 0)

    def test_02_strict_pydantic_schema_validation(self):
        """Validates strict Pydantic field validators and missing value handling."""
        # Valid IFSC
        bank_valid = BankStatementFields(
            account_holder_name="Rajesh Sharma",
            bank_name="State Bank of India",
            ifsc_code="SBIN0001234",
            closing_balance=Decimal("15000.50")
        )
        self.assertEqual(bank_valid.ifsc_code, "SBIN0001234")
        self.assertEqual(bank_valid.closing_balance, Decimal("15000.50"))

        # Invalid IFSC gets rejected/sanitized to None
        bank_invalid_ifsc = BankStatementFields(ifsc_code="INVALID_CODE")
        self.assertIsNone(bank_invalid_ifsc.ifsc_code)

        # EPF UAN validation: must be 12 digits
        epf_valid = EPFDocumentFields(uan="100849204819", member_name="Priya Verma")
        self.assertEqual(epf_valid.uan, "100849204819")

        epf_invalid_uan = EPFDocumentFields(uan="12345")  # Too short
        self.assertIsNone(epf_invalid_uan.uan)

    def test_03_layer_a_deterministic_rules(self):
        """Validates Layer A deterministic statutory signals classify unambiguous headers with high confidence."""
        sample_bank_text = (
            "STATE BANK OF INDIA\n"
            "Branch: Connaught Place | IFSC Code: SBIN0001234\n"
            "Savings Bank Account Holder: Rajesh Sharma\n"
            "Statement Period: 01-Jan-2025 to 31-Mar-2025\n"
            "Closing Balance as on Date: Rs. 45,000.00"
        )
        cat, conf, scores = evaluate_deterministic_rules(sample_bank_text)
        self.assertEqual(cat, DocumentCategory.BANK_PASSBOOK_OR_STATEMENT)
        self.assertGreaterEqual(conf, 0.94)

        sample_epf_text = (
            "EMPLOYEES' PROVIDENT FUND ORGANISATION, INDIA\n"
            "Universal Account Number (UAN): 100849204819\n"
            "Member ID: MHBAN0098765/48201\n"
            "Member Name: Amitabh Sen Gupta"
        )
        cat_epf, conf_epf, _ = evaluate_deterministic_rules(sample_epf_text)
        self.assertEqual(cat_epf, DocumentCategory.EPF_DOCUMENT)
        self.assertGreaterEqual(conf_epf, 0.95)

    def test_04_layer_b_fast_classifier_training_and_inference(self):
        """Verifies training and calibrated inference of the lightweight TF-IDF+LR classifier."""
        dataset = generate_dataset(total_per_category=20, seed=123)
        splits = split_dataset(dataset, train_ratio=0.8, val_ratio=0.1)

        clf = FastDocumentClassifier()
        train_res = clf.train(splits["train"])
        self.assertGreater(train_res["train_accuracy"], 0.90)

        # Test predict on test doc
        test_doc = splits["test"][0]
        cat, conf, should_escalate, probs = clf.predict(test_doc["text"])
        self.assertIn(cat, DocumentCategory)
        self.assertGreaterEqual(conf, 0.0)
        self.assertLessEqual(conf, 1.0)
        self.assertIn(cat.value, probs)

    def test_05_layer_c_baseline_pipeline_and_telemetry(self):
        """Verifies BaselineDocumentPipeline executes, records latency, tokens, and returns grounded explanation."""
        pipeline = BaselineDocumentPipeline()
        text = (
            "LIFE INSURANCE CORPORATION OF INDIA (LIC)\n"
            "CERTIFICATE OF LIFE ASSURANCE / POLICY SCHEDULE\n"
            "Policy Number: POL-928471928\n"
            "Life Assured: Sunita Devi Verma\n"
            "Sum Assured: Rs. 5,00,000.00\n"
            "Registered Nominee: Rajesh Kumar Sharma"
        )
        result = pipeline.infer(text)
        self.assertEqual(result.document_category, DocumentCategory.INSURANCE_OR_LIC_POLICY)
        self.assertEqual(result.pipeline_type, PipelineType.BASELINE)
        self.assertGreater(result.latency_ms, 0.0)
        self.assertGreater(result.energy_wh, 0.0)
        self.assertIn("IRDAI", result.explanation)
        self.assertEqual(result.provenance.get("energy_tag"), "ESTIMATED_CLOUD_LLM")

    def test_06_layer_d_hash_based_caching_and_invalidation(self):
        """Verifies SHA-256 hash caching achieves 0 Wh energy on repeated inputs, and invalidates on changes."""
        cascade = GreenDocumentIntelligenceCascade()
        dataset = generate_dataset(total_per_category=5, seed=99)
        cascade.ensure_trained(dataset)

        text = "BSES Yamuna Power Limited - Electricity Consumption Bill. Amount: Rs. 2,450."

        # First run: cache miss
        res1 = cascade.process(text)
        self.assertFalse(res1.cached)

        # Second run: cache hit
        res2 = cascade.process(text)
        self.assertTrue(res2.cached)
        self.assertLess(res2.latency_ms, res1.latency_ms + 1.0)
        self.assertLess(res2.energy_wh, 0.000005)

        # Altered text: cache miss
        altered_text = text + " Late fee applied."
        res3 = cascade.process(altered_text)
        self.assertFalse(res3.cached)

    def test_07_ambiguous_and_noisy_crossover_escalation(self):
        """Verifies ambiguous crossover text with competing keywords safely triggers baseline escalation."""
        cascade = GreenDocumentIntelligenceCascade()
        dataset = generate_dataset(total_per_category=5, seed=101)
        cascade.ensure_trained(dataset)

        crossover_text = (
            "Transaction Debit Advice Note:\n"
            "Your mutual fund SIP of Rs. 5,000.00 and LIC Policy premium of Rs. 3,200.00 "
            "were debited. For details consult pension fund EPF UAN portal or share certificate registrar."
        )
        result = cascade.process(crossover_text)
        # Should escalate to baseline to make an informed multi-pass decision
        self.assertTrue(result.escalated_to_baseline)

    def test_08_zero_hallucination_on_missing_fields(self):
        """Verifies missing fields in partial documents remain None/null and are never fabricated."""
        text_no_balance = (
            "STATE BANK OF INDIA\n"
            "Savings Bank Account Holder: Rajesh Kumar Sharma\n"
            "IFSC Code: SBIN0001234\n"
            "Account Number: XXXXXX4821\n"
            "Statement Period: 01-Apr-2025 to 30-Sep-2025\n"
            "End of Page 1. Continued on next statement cycle..."
        )
        fields = extract_fields_by_category(DocumentCategory.BANK_PASSBOOK_OR_STATEMENT, text_no_balance)
        self.assertEqual(fields.account_holder_name, "Rajesh Kumar Sharma")
        self.assertIsNone(fields.closing_balance)  # MUST BE None!

    def test_09_api_classify_and_extract_endpoint(self):
        """Tests POST /api/documents/classify-and-extract/ validates auth, formats, and persists DocumentIntelligenceRun."""
        payload = {
            "text": (
                "CONSOLIDATED ACCOUNT STATEMENT (CAS) — HDFC MUTUAL FUND\n"
                "Primary Investor: Priya Venkatesh Iyer\n"
                "Folio Number: 4892019/12\n"
                "Current Value / Total Valuation: Rs. 2,15,400.00"
            )
        }

        # Anonymous request blocked: 401 Unauthorized
        resp_anon = self.anon_client.post('/api/documents/classify-and-extract/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(resp_anon.status_code, 401)

        # Authenticated request: 200 OK
        resp_auth = self.client.post('/api/documents/classify-and-extract/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(resp_auth.status_code, 200)
        data = resp_auth.json()
        self.assertTrue(data.get("success"))
        result = data.get("result")
        self.assertEqual(result["document_category"], "mutual_fund_cas_statement")
        self.assertGreater(result["confidence"], 0.70)
        self.assertIn("run_id", data)

        # Verify DB persistence
        run_record = DocumentIntelligenceRun.objects.get(id=data["run_id"])
        self.assertEqual(run_record.user, self.user)
        self.assertEqual(run_record.document_category, "mutual_fund_cas_statement")

    def test_10_api_energy_benchmark_endpoint(self):
        """Tests GET /api/documents/energy-benchmark/ returns verified benchmark metrics."""
        resp = self.client.get('/api/documents/energy-benchmark/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("success"))
        benchmark = data.get("benchmark")
        self.assertIn("comparison", benchmark)
        self.assertIn("baseline", benchmark)
        self.assertIn("optimized", benchmark)
        self.assertGreaterEqual(benchmark["comparison"]["energy_reduction_pct"], 50.0)
        self.assertLessEqual(benchmark["comparison"]["accuracy_delta_pct"], 2.0)
