"""
Management command to run Green AI Document Intelligence evaluation and CodeCarbon energy measurement.
Usage:
    python manage.py run_doc_intelligence_eval [--split test] [--save-db]
"""
import os
import json
from django.core.management.base import BaseCommand
from claims.doc_intelligence.evaluator import DocumentIntelligenceEvaluator
from claims.models import GreenAIBenchmarkRecord


class Command(BaseCommand):
    help = "Evaluates Green AI Document Intelligence pipeline and measures CodeCarbon energy consumption."

    def add_arguments(self, parser):
        parser.add_argument("--split", type=str, default="test", help="Dataset split to evaluate (train, val, test)")
        parser.add_argument("--save-db", action="store_true", default=True, help="Persist benchmark results in PostgreSQL database")
        parser.add_argument("--export-json", type=str, default="", help="Path to export benchmark results as JSON")

    def handle(self, *args, **options):
        split = options["split"]
        save_db = options["save_db"]
        export_path = options["export_json"]

        self.stdout.write(self.style.NOTICE("=" * 80))
        self.stdout.write(self.style.NOTICE(f"WEALTHPASS GREEN AI DOCUMENT INTELLIGENCE BENCHMARK (SPLIT: {split.upper()})"))
        self.stdout.write(self.style.NOTICE("=" * 80))

        evaluator = DocumentIntelligenceEvaluator()
        self.stdout.write("1. Loading / generating synthetic evaluation dataset...")
        dataset = evaluator.load_or_generate_data()
        self.stdout.write(f"   Total synthetic dataset: {dataset['metadata']['total_documents']} docs across 6 categories.")
        self.stdout.write(f"   Evaluating on split '{split}' ({len(dataset['splits'][split])} documents)...")

        self.stdout.write("2. Running baseline and optimized cascaded pipelines under CodeCarbon telemetry...")
        results = evaluator.run_benchmark(split_name=split)

        b = results["baseline"]
        o = results["optimized"]
        c = results["comparison"]
        f = results["field_extraction"]

        self.stdout.write("\n" + self.style.SUCCESS("=" * 80))
        self.stdout.write(self.style.SUCCESS("BENCHMARK RESULTS SUMMARY"))
        self.stdout.write(self.style.SUCCESS("=" * 80))

        self.stdout.write(f"{'Metric':<35} | {'Baseline (Dense/LLM)':<20} | {'Optimized (Cascade)':<20}")
        self.stdout.write("-" * 80)
        self.stdout.write(f"{'Overall Classification Accuracy':<35} | {b['accuracy']:>18.2f}% | {o['accuracy']:>18.2f}%")
        self.stdout.write(f"{'Mean Latency per Doc':<35} | {b['mean_latency_ms']:>16.2f} ms | {o['mean_latency_ms']:>16.2f} ms")
        self.stdout.write(f"{'p50 Latency':<35} | {b['p50_latency_ms']:>16.2f} ms | {o['p50_latency_ms']:>16.2f} ms")
        self.stdout.write(f"{'p95 Latency':<35} | {b['p95_latency_ms']:>16.2f} ms | {o['p95_latency_ms']:>16.2f} ms")
        self.stdout.write(f"{'Energy per Doc':<35} | {b['energy_wh_per_doc']:>18.6f} Wh | {o['energy_wh_per_doc']:>18.6f} Wh")
        self.stdout.write(f"{'Total Energy Consumed':<35} | {b['total_energy_wh']:>18.4f} Wh | {o['total_energy_wh']:>18.4f} Wh")
        self.stdout.write(f"{'Estimated CO2 Emissions':<35} | {b['estimated_co2_kg']*1000:>17.4f} g | {o['estimated_co2_kg']*1000:>17.4f} g")
        self.stdout.write(f"{'Telemetry Tag':<35} | {b['measurement_tag']:>20} | {o['measurement_tag']:>20}")
        self.stdout.write("-" * 80)

        self.stdout.write(self.style.WARNING(f"\n[TARGET 1] Energy Reduction: {c['energy_reduction_pct']:.2f}% (Target: >=50.0%) -> {'PASS' if c['target_energy_met'] else 'FAIL'}"))
        self.stdout.write(self.style.WARNING(f"[TARGET 2] Accuracy Delta:   {c['accuracy_delta_pct']:.2f}% (Target: <=2.0%)  -> {'PASS' if c['target_accuracy_met'] else 'FAIL'}"))
        self.stdout.write(self.style.WARNING(f"[EFFICIENCY] Latency Speedup: {c['speedup_factor']:.1f}x faster"))
        self.stdout.write(self.style.WARNING(f"[ESCALATION] Escalation Rate: {o['escalation_rate_pct']:.1f}% ({o['escalated_count']}/{results['total_documents']} docs escalated)"))

        self.stdout.write("\n" + self.style.NOTICE("FIELD EXTRACTION & HALLUCINATION DEFENSE:"))
        self.stdout.write(f"  * Normalized Field Extraction Accuracy: {f['exact_extraction_accuracy_pct']:.2f}%")
        self.stdout.write(f"  * Missing-Field Null Correctness:        {f['missing_field_null_correctness_pct']:.2f}%")
        self.stdout.write(f"  * Hallucination Rate on Missing Fields:  {f['hallucination_rate_pct']:.2f}% (Target: 0.0%)")

        self.stdout.write("\n" + self.style.NOTICE("PER-CATEGORY BREAKDOWN (OPTIMIZED CASCADE):"))
        self.stdout.write(f"{'Category':<45} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10}")
        self.stdout.write("-" * 80)
        for cat_name, metrics in results["per_category_metrics"].items():
            opt_m = metrics["optimized"]
            self.stdout.write(f"{cat_name:<45} | {opt_m['precision']:<10.3f} | {opt_m['recall']:<10.3f} | {opt_m['f1']:<10.3f}")

        if save_db:
            record = GreenAIBenchmarkRecord.objects.create(
                split_name=split,
                total_documents=results["total_documents"],
                baseline_accuracy_pct=b["accuracy"],
                optimized_accuracy_pct=o["accuracy"],
                accuracy_delta_pct=c["accuracy_delta_pct"],
                energy_reduction_pct=c["energy_reduction_pct"],
                baseline_energy_wh_per_doc=b["energy_wh_per_doc"],
                optimized_energy_wh_per_doc=o["energy_wh_per_doc"],
                baseline_latency_ms=b["mean_latency_ms"],
                optimized_latency_ms=o["mean_latency_ms"],
                escalation_rate_pct=o["escalation_rate_pct"],
                measurement_tag=o["measurement_tag"],
                benchmark_payload=results
            )
            self.stdout.write(self.style.SUCCESS(f"\n[PERSISTED] Saved GreenAIBenchmarkRecord id={record.id} to PostgreSQL database."))

        if export_path:
            with open(export_path, "w", encoding="utf-8") as f:
                json.dump(results, f, indent=2)
            self.stdout.write(self.style.SUCCESS(f"[EXPORTED] Saved report to {export_path}"))

        self.stdout.write(self.style.NOTICE("=" * 80))
