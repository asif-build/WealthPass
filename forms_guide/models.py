"""
Models for Per-Bank Directory, Official Forms, and RBI Standard Form Cross-References.
Strict compliance with RBI Master Directions on Settlement of Claims in respect of
Deceased Depositors (Annex I-A to I-H, RBI/2025-26/82, 26 Sep 2025).

Rules:
1. No fabricated data. Every bank record points to verified, public pages.
2. Unknown means unknown ("Not found: check the bank's website or branch").
3. Maps to RBI annex only when explicit or verified.
"""
from django.db import models
from django.utils import timezone


class DirectoryStatus(models.TextChoices):
    VERIFIED = "verified", "Verified"
    NOT_FOUND = "not_found", "Not Found"
    BLOCKED = "blocked", "Blocked (Automated Access Prohibited)"
    STALE = "stale", "Stale (Changed/Requires Re-verification)"


class RBIAnnex(models.TextChoices):
    ANNEX_I_A = "Annex I-A", "Annex I-A: Claim with Nomination (Savings/Current/Term)"
    ANNEX_I_B = "Annex I-B", "Annex I-B: Claim by Survivorship / Joint Accounts"
    ANNEX_I_C = "Annex I-C", "Annex I-C: Claim without Nomination / Legal Heirs"
    ANNEX_I_D = "Annex I-D", "Annex I-D: Stamped Letter of Indemnity & Sureties"
    ANNEX_I_E = "Annex I-E", "Annex I-E: Affidavit by Legal Heirs"
    ANNEX_I_F = "Annex I-F", "Annex I-F: Letter of Disclaimer / Relinquishment"
    ANNEX_I_G = "Annex I-G", "Annex I-G: Locker / Safe Custody with Nomination"
    ANNEX_I_H = "Annex I-H", "Annex I-H: Locker / Safe Custody without Nomination"


class ScenarioChoice(models.TextChoices):
    NOMINEE = "nominee", "With Registered Nomination"
    NO_NOMINEE = "no_nominee", "Without Nomination (Legal Heirs)"
    SURVIVORSHIP = "survivorship", "Joint Account / Either or Survivor"
    LOCKER = "locker", "Safe Deposit Locker / Safe Custody"
    MISSING_PERSON = "missing_person", "Missing Person (Presumption of Demise under Sec 108)"


class BankDirectory(models.Model):
    """
    Official Deceased Customer Claim portal information per bank.
    """
    bank = models.CharField(max_length=100, unique=True, db_index=True, help_text="Official name of the Scheduled Commercial Bank")
    bank_code = models.CharField(max_length=30, unique=True, db_index=True, help_text="Slug identifier, e.g. sbi, pnb, hdfc")
    claim_page_url = models.URLField(max_length=500, blank=True, null=True, help_text="Official deceased claim landing page")
    online_claim_available = models.BooleanField(default=False, help_text="True only if bank genuinely offers digital portal filing")
    tracking_available = models.BooleanField(default=False, help_text="True if bank has online claim tracking by docket/ref")
    verified_at = models.DateTimeField(default=timezone.now)
    page_sha256 = models.CharField(max_length=64, blank=True, default="", help_text="SHA-256 hash of public page text")
    status = models.CharField(max_length=20, choices=DirectoryStatus.choices, default=DirectoryStatus.VERIFIED)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['bank']
        verbose_name = "Bank Directory"
        verbose_name_plural = "Bank Directories"

    def __str__(self):
        return f"{self.bank} ({self.get_status_display()})"


class BankFormLink(models.Model):
    """
    Real, verified downloadable form link published on the bank's official portal.
    """
    bank = models.ForeignKey(BankDirectory, on_delete=models.CASCADE, related_name='forms', db_index=True)
    label_as_published = models.CharField(max_length=255, help_text="Exact title/text as printed on bank website")
    official_download_url = models.URLField(max_length=500, help_text="Direct link to bank PDF/DOC download")
    maps_to_rbi_annex = models.CharField(max_length=30, choices=RBIAnnex.choices, blank=True, null=True, help_text="RBI Annex I-A to I-H if verified match")
    differs_from_rbi = models.BooleanField(default=False, help_text="True if form predates or departs from RBI standard")
    last_http_status = models.IntegerField(default=200)
    content_sha256 = models.CharField(max_length=64, blank=True, default="", help_text="Hash of form text or metadata")
    status = models.CharField(max_length=20, choices=DirectoryStatus.choices, default=DirectoryStatus.VERIFIED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['bank', 'label_as_published']

    def __str__(self):
        annex_str = f" -> {self.maps_to_rbi_annex}" if self.maps_to_rbi_annex else " (Bank-specific form)"
        return f"{self.bank.bank}: {self.label_as_published}{annex_str}"


class BankExtraRequirement(models.Model):
    """
    Bank-specific stipulations (e.g. indemnity threshold, surety criteria, branch notarization).
    Quote only short verified snippets, link directly to official source.
    """
    bank = models.ForeignKey(BankDirectory, on_delete=models.CASCADE, related_name='extra_requirements', db_index=True)
    scenario = models.CharField(max_length=30, choices=ScenarioChoice.choices, default=ScenarioChoice.NO_NOMINEE)
    text_as_published = models.TextField(help_text="Exact short snippet quoted from bank circular/instructions")
    source_url = models.URLField(max_length=500)
    verified_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['bank', 'scenario']

    def __str__(self):
        return f"{self.bank.bank} [{self.scenario}]: {self.text_as_published[:50]}..."


class FormAlias(models.Model):
    """
    Maps common informal user queries (e.g. 'Form 14', 'Annexure A', 'Deceased claim form')
    to standard RBI Annexures or bank forms.
    """
    alias_text = models.CharField(max_length=150, unique=True, db_index=True)
    maps_to_rbi_annex = models.CharField(max_length=30, choices=RBIAnnex.choices, blank=True, null=True)
    notes = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        ordering = ['alias_text']

    def __str__(self):
        return f"'{self.alias_text}' -> {self.maps_to_rbi_annex or 'Unmapped'}"


class FormGuideSection(models.Model):
    """
    Verified section-by-section guide content for standard forms.
    Used exclusively by Wealth Buddy and Guide Mode.
    No ungrounded text. Reviewed metadata enforced.
    """
    annex = models.CharField(max_length=30, choices=RBIAnnex.choices, db_index=True)
    section_number = models.IntegerField(default=1)
    section_title = models.CharField(max_length=255)
    what_this_is = models.TextField()
    where_to_find = models.TextField()
    common_mistakes = models.TextField(blank=True, default="")
    who_must_sign = models.TextField()
    stamp_notary_needed = models.TextField(help_text="Details on Non-Judicial Stamp Paper, Franking, Notarization")
    hindi_title = models.CharField(max_length=255, blank=True, default="")
    hindi_explanation = models.TextField(blank=True, default="")
    reviewed_by = models.CharField(max_length=100, default="WealthPass Regulatory Compliance Desk")
    reviewed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['annex', 'section_number']
        unique_together = ('annex', 'section_number')

    def __str__(self):
        return f"{self.annex} - Sec {self.section_number}: {self.section_title}"


class EnergyTelemetry(models.Model):
    """
    Green AI Energy & Carbon Benchmark Telemetry.
    Records honest MEASURED wall-clock latencies and payload metrics,
    along with standard ESTIMATED server power draw and carbon equivalents.
    Rule 5: Energy numbers have honest MEASURED vs ESTIMATED tags.
    """
    METRIC_TAGS = [
        ("MEASURED", "Measured (Wall-Clock / Real Payload)"),
        ("ESTIMATED", "Estimated (Standard Hardware TDP Model)"),
    ]
    query_preview = models.CharField(max_length=100, default="")
    latency_ms = models.FloatField(help_text="Measured execution time in milliseconds")
    baseline_energy_j = models.FloatField(help_text="Estimated baseline energy consumption in Joules")
    optimized_energy_j = models.FloatField(help_text="Optimized Green AI energy consumption in Joules")
    energy_saved_pct = models.FloatField(help_text="Calculated energy reduction percentage")
    co2_saved_mg = models.FloatField(help_text="Estimated CO2 avoided in milligrams")
    measurement_tag = models.CharField(max_length=20, choices=METRIC_TAGS, default="MEASURED")
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Energy Telemetry"
        verbose_name_plural = "Energy Telemetries"

    def __str__(self):
        return f"{self.query_preview[:30]} - Saved {self.energy_saved_pct:.1f}% ({self.measurement_tag})"

