"""
Official Claim Procedure Knowledge Base Models and Claim Guidance Records.
Strictly separates:
- Official external form guidance (A)
- Authorized online form integration (B)
- Direct electronic claim submission (C)

Preserves versioning, official URLs, exact field explanations, and privacy-first status tracking.
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid


class CapabilityType(models.TextChoices):
    OFFICIAL_EXTERNAL_GUIDANCE = "EXTERNAL_GUIDANCE", "Official External Form Guidance"
    AUTHORIZED_FORM_INTEGRATION = "AUTHORIZED_FORM_INTEGRATION", "Authorized Online Form Integration"
    DIRECT_ELECTRONIC_SUBMISSION = "DIRECT_SUBMISSION", "Direct Electronic Claim Submission"


class ClaimCategory(models.TextChoices):
    BANK_DEPOSITS = "BANK_DEPOSITS", "Bank Deposits"
    INSURANCE_LIC = "INSURANCE_LIC", "LIC & Other Insurance Policies"
    MUTUAL_FUNDS = "MUTUAL_FUNDS", "Mutual Funds"
    SHARES_DIVIDENDS = "SHARES_DIVIDENDS", "Shares & IEPF Dividends"
    EPF_PENSION = "EPF_PENSION", "EPF & Eligible Retirement Benefits"
    POSTAL_SAVINGS = "POSTAL_SAVINGS", "Postal Savings & National Savings Schemes"
    OTHER = "OTHER", "Other Verified Statutory Assets"


class ClaimProcedureStatus(models.TextChoices):
    OFFICIALLY_VERIFIED = "VERIFIED", "Officially Verified from Primary Regulatory Source"
    UNDER_REVIEW = "UNDER_REVIEW", "Under Legal Review"
    DEPRECATED = "DEPRECATED", "Deprecated / Updated by Regulator"


class ClaimProcedure(models.Model):
    """
    Curated, versioned knowledge base for supported institutions and claim types.
    Contains strictly regulatory verified guidelines (RBI, IRDAI, SEBI, EPFO, IEPF).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution_id = models.CharField(max_length=64, db_index=True, help_text="e.g. sbi, canara_bank, lic_india, epfo, iepf, cams_kfintech")
    institution_name = models.CharField(max_length=150)
    asset_category = models.CharField(max_length=50, choices=ClaimCategory.choices, db_index=True)
    claim_type = models.CharField(max_length=100, help_text="e.g. DECEASED_CLAIM_WITH_NOMINEE, DECEASED_CLAIM_WITHOUT_NOMINEE, DEATH_CLAIM_3783")
    capability_type = models.CharField(max_length=50, choices=CapabilityType.choices, default=CapabilityType.OFFICIAL_EXTERNAL_GUIDANCE)
    
    # Official Source Metadata
    official_source_url = models.URLField(max_length=500)
    official_portal_url = models.URLField(max_length=500, blank=True, null=True, help_text="Direct link to institution claim submission portal")
    form_identifier = models.CharField(max_length=100, help_text="e.g. Form 14, Form 3783, IEPF-5, Form 20 / 10D")
    form_name = models.CharField(max_length=255)
    
    # Procedures and Guidance
    summary = models.TextField(help_text="High-level procedure summary")
    eligibility_notes = models.TextField(help_text="Legal heir / nominee eligibility conditions under primary law")
    submission_method = models.CharField(max_length=150, help_text="e.g. In-Person at Home Branch / Digital via EPFO Unified Portal / IEPF Gateway")
    direct_api_supported = models.BooleanField(default=False)
    
    # Versioning & Integrity
    version = models.CharField(max_length=32, default="v2024.1")
    last_checked_date = models.DateField(default=timezone.now)
    procedure_status = models.CharField(max_length=32, choices=ClaimProcedureStatus.choices, default=ClaimProcedureStatus.OFFICIALLY_VERIFIED)
    verified_by = models.CharField(max_length=100, default="WealthPass Regulatory Compliance Desk")
    
    # Fields & Checklist Data (Structured JSON)
    # schema: [{"field_id": str, "label": str, "explanation": str, "where_to_find": str, "expected_format": str, "supporting_doc": str, "is_mandatory": bool}]
    fields_catalog = models.JSONField(default=list)
    # schema: [{"doc_name": str, "description": str, "mandatory": bool, "issuing_authority": str}]
    required_documents = models.JSONField(default=list)
    step_by_step_instructions = models.JSONField(default=list)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['institution_name', 'claim_type']
        unique_together = ('institution_id', 'claim_type', 'version')

    def __str__(self):
        return f"{self.institution_name} - {self.form_identifier} ({self.claim_type}) [{self.version}]"


class ClaimCopilotProgress(models.Model):
    """
    Tracks the claimant's own claim preparation and checklist progression.
    Guarantees strict separation of user-reported vs institution-verified status.
    """
    class ProgressStatus(models.TextChoices):
        PREPARATION_STARTED = "PREPARATION_STARTED", "Preparation Started"
        DOCUMENTS_COLLECTED = "DOCUMENTS_COLLECTED", "Required Documents Collected"
        USER_REPORTS_COMPLETED = "USER_REPORTS_COMPLETED", "User Reports Form Completed (Unverified by Institution)"
        SUBMISSION_PENDING = "SUBMISSION_PENDING", "Submission Pending Review / Physical Branch Visit"
        SUBMISSION_EVIDENCE_RECORDED = "SUBMISSION_EVIDENCE_RECORDED", "User Provided Acknowledgement / Ref Receipt"
        INSTITUTION_CONFIRMED = "INSTITUTION_CONFIRMED", "Institution Formally Confirmed Filing"
        CLAIM_SETTLED = "CLAIM_SETTLED", "Claim Settled & Disbursed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='copilot_progresses', db_index=True)
    session = models.ForeignKey('claims.ClaimSession', on_delete=models.CASCADE, related_name='copilot_progresses', db_index=True)
    asset = models.ForeignKey('claims.DiscoveredAsset', on_delete=models.CASCADE, related_name='copilot_progresses', null=True, blank=True)
    procedure = models.ForeignKey(ClaimProcedure, on_delete=models.SET_NULL, null=True, blank=True, related_name='user_progresses')
    
    # Progress tracking
    status = models.CharField(max_length=50, choices=ProgressStatus.choices, default=ProgressStatus.PREPARATION_STARTED)
    checked_document_ids = models.JSONField(default=list, help_text="List of doc_names checked off by the claimant")
    completed_field_ids = models.JSONField(default=list, help_text="List of field_ids completed by the claimant")
    form_data = models.JSONField(default=dict, help_text="User filled and autosaved form field values")
    user_notes = models.TextField(blank=True, default="")
    
    # External Submission Evidence (Only filled when claimant provides concrete proof)
    user_reported_submission_date = models.DateTimeField(null=True, blank=True)
    acknowledgement_number = models.CharField(max_length=150, blank=True, default="")
    servicing_branch_or_desk = models.CharField(max_length=255, blank=True, default="")
    acknowledgement_file = models.FileField(upload_to='acknowledgements/', null=True, blank=True)
    
    # Formal confirmation
    is_institution_confirmed = models.BooleanField(default=False)
    institution_reference = models.CharField(max_length=150, blank=True, default="")
    institution_notes = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('session', 'asset')
        ordering = ['-updated_at']

    def __str__(self):
        return f"Copilot Progress [{self.get_status_display()}] - Session {self.session_id} - {self.procedure}"
