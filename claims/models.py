from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid
from .providers.base import RelationshipStatus


class ClaimSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='claim_sessions', null=True, blank=True, db_index=True)
    
    # Deceased Details
    deceased_name = models.CharField(max_length=255)
    deceased_pan = models.CharField(max_length=15, blank=True, default='')
    death_certificate_no = models.CharField(max_length=100, blank=True, default='')
    death_certificate_file = models.FileField(upload_to='certificates/', null=True, blank=True)
    date_of_death = models.DateField(null=True, blank=True)
    date_of_death_unknown = models.BooleanField(default=False)
    last_known_state = models.CharField(max_length=100, blank=True, null=True)
    pan_unknown = models.BooleanField(default=False)
    ocr_result = models.TextField(blank=True, null=True)
    document_verified = models.BooleanField(default=False)
    confidence_score = models.IntegerField(default=0)
    
    # OCR Matching & Field Comparison
    verification_status = models.CharField(max_length=50, default='PENDING')
    match_score = models.IntegerField(default=0)
    fraud_risk_level = models.CharField(max_length=20, default='LOW')
    extracted_name = models.CharField(max_length=255, blank=True, null=True)
    extracted_certificate_no = models.CharField(max_length=100, blank=True, null=True)
    
    # Claimant Information
    claimant_name = models.CharField(max_length=255)
    claimant_aadhaar_last4 = models.CharField(max_length=4, blank=True, default='')
    relation = models.CharField(max_length=100)
    mobile = models.CharField(max_length=15)
    claimant_notes = models.TextField(blank=True, null=True)
    
    # Separate Verification Pillars
    identity_verification_status = models.CharField(max_length=50, default='NOT_STARTED')
    consent_status = models.CharField(max_length=50, default='NOT_STARTED')
    relationship_verification_status = models.CharField(max_length=50, default='NOT_STARTED')
    institutional_eligibility_status = models.CharField(max_length=50, default='PENDING_INSTITUTIONAL_VERIFICATION')

    # Workflow & Category Selection
    selected_asset_categories = models.JSONField(default=list)
    current_step = models.IntegerField(default=1)
    is_draft = models.BooleanField(default=False)

    # Status tracking
    status = models.CharField(max_length=50, default='pending')  # draft, pending, verified, loan_accepted
    fraud_risk_score = models.IntegerField(default=2)
    total_assets_found = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    bridge_loan_available = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Bridge Liquidity Partner Workflow
    bridge_loan_status = models.CharField(max_length=50, default='NOT_APPLIED')
    bridge_loan_partner = models.CharField(max_length=100, blank=True, default='Regulated NBFC / Bank Partner')
    bridge_loan_application_ref = models.CharField(max_length=100, blank=True, default='')

    # Setu AA tracking
    setu_consent_id = models.CharField(max_length=255, blank=True, null=True)
    setu_consent_status = models.CharField(max_length=50, default='NOT_STARTED')
    setu_session_id = models.CharField(max_length=255, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Session {self.id} - {self.claimant_name} claiming for {self.deceased_name}"


class DiscoverySourceJob(models.Model):
    """
    Tracks execution and status of a discovery search for a specific source
    under a ClaimSession.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ClaimSession, related_name='source_jobs', on_delete=models.CASCADE, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='discovery_jobs', db_index=True)
    source_id = models.CharField(max_length=50, db_index=True)
    asset_category = models.CharField(max_length=50)
    status = models.CharField(max_length=50, default='OFFICIAL_EXTERNAL_ACTION_REQUIRED')
    # Statuses: NOT_STARTED, IN_PROGRESS, COMPLETED, NO_MATCHES_FOUND, OFFICIAL_EXTERNAL_ACTION_REQUIRED, ACCESS_PENDING, NOT_CONFIGURED, FAILED
    is_live_api = models.BooleanField(default=False)
    external_portal_url = models.CharField(max_length=255, blank=True, null=True)
    external_reference_number = models.CharField(max_length=100, blank=True, default='')
    external_search_completed = models.BooleanField(default=False)
    external_search_date = models.DateTimeField(null=True, blank=True)
    query_payload = models.JSONField(default=dict)
    response_payload = models.JSONField(default=dict)
    error_message = models.TextField(blank=True, default='')
    last_checked_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('session', 'source_id')
        ordering = ['created_at']

    def __str__(self):
        return f"{self.source_id} ({self.status}) - Case {self.session_id}"


class DiscoveredAsset(models.Model):
    session = models.ForeignKey(ClaimSession, related_name='assets', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='discovered_assets', null=True, blank=True, db_index=True)
    source_id = models.CharField(max_length=50, default='RBI_UDGAM')
    source_reference = models.CharField(max_length=100, blank=True, null=True)
    asset_category = models.CharField(max_length=50, default='BANK_DEPOSITS', db_index=True)
    institution = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    masked_reference = models.CharField(max_length=100, blank=True, default='')
    situation_label = models.CharField(max_length=255)
    color = models.CharField(max_length=50, default='amber')  # green, amber, red
    message = models.TextField()
    documents_needed = models.JSONField(default=list)
    next_steps = models.JSONField(default=list)
    time_estimate = models.CharField(max_length=100, default='4-8 Weeks')
    loan_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Transparency & verification separation
    is_potential_match = models.BooleanField(default=True)
    institution_verified = models.BooleanField(default=False)
    match_status = models.CharField(max_length=50, default='POTENTIAL_MATCH')
    verification_status = models.CharField(max_length=50, default='UNVERIFIED_BY_INSTITUTION')
    claim_status = models.CharField(max_length=50, default='NOT_INITIATED')
    source_evidence_reference = models.CharField(max_length=255, blank=True, default='')
    discovery_timestamp = models.DateTimeField(default=timezone.now)
    how_found = models.JSONField(default=dict)
    unverified_items = models.JSONField(default=list)
    official_portal_url = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    def __str__(self):
        return f"{self.institution} - {self.amount} ({'Verified' if self.institution_verified else 'Potential Match'})"


class ClaimDocument(models.Model):
    """
    Private, auditable storage for claimant and deceased person evidence.
    Includes OCR text, extracted fields, and strict user ownership.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_claim_documents', db_index=True)
    session = models.ForeignKey(ClaimSession, on_delete=models.CASCADE, related_name='evidence_documents', null=True, blank=True, db_index=True)
    document_type = models.CharField(max_length=50, default='DEATH_CERTIFICATE')
    file = models.FileField(upload_to='private_documents/')
    original_filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField(default=0)
    mime_type = models.CharField(max_length=100, default='application/octet-stream')
    ocr_text = models.TextField(blank=True, null=True)
    extracted_fields = models.JSONField(default=dict)
    processing_status = models.CharField(max_length=50, default='EXTRACTION_COMPLETED')
    issuing_authority = models.CharField(max_length=255, blank=True, null=True)
    document_reference_no = models.CharField(max_length=100, blank=True, null=True)
    extracted_dates = models.JSONField(default=list)
    is_verified = models.BooleanField(default=False)
    verification_notes = models.TextField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.document_type} - {self.original_filename} (User: {self.user.username})"


class VerificationRecord(models.Model):
    """
    Privacy-first identity verification record.
    Strictly minimizes data: Never stores full Aadhaar, biometric data,
    Aadhaar PDF/images, or OTPs.
    """
    verification_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_records', null=True, blank=True, db_index=True)
    session_token = models.CharField(max_length=100, db_index=True)
    verification_method = models.CharField(max_length=50, default='DEMO_SIMULATION')
    verification_status = models.CharField(max_length=50, default='VERIFIED')
    verification_reference = models.CharField(max_length=100)
    masked_identifier = models.CharField(max_length=30)  # e.g., 'XXXX XXXX 4821'
    consent_id = models.CharField(max_length=100, blank=True, null=True)
    provider = models.CharField(max_length=50, default='DEMO_PROVIDER')
    verified_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.verification_reference} ({self.masked_identifier}) - {self.verification_status}"


class ConsentRecord(models.Model):
    """
    Tracks explicit user consent for asset discovery.
    Allows user-controlled discovery and auditable withdrawal.
    """
    consent_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='consent_records', null=True, blank=True, db_index=True)
    session_token = models.CharField(max_length=100, db_index=True)
    purpose = models.CharField(max_length=255, default='ASSET_DISCOVERY')
    version = models.CharField(max_length=20, default='v1.0')
    status = models.CharField(max_length=50, default='GRANTED')  # GRANTED, REVOKED
    source = models.CharField(max_length=100, default='WEB_APP')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Consent {self.consent_id} ({self.purpose}) - {self.status}"


class ClaimantRelationshipRecord(models.Model):
    """
    Tracks claimant relationship declarations and institutional evidence state.
    Enforces the statutory 7-stage Relationship Status Machine:
    NOT_STARTED -> DOCUMENTS_REQUIRED -> EVIDENCE_SUBMITTED -> UNDER_REVIEW -> NEEDS_CLARIFICATION -> VERIFIED -> REJECTED
    """
    STATUS_CHOICES = [
        (s.value, s.value) for s in RelationshipStatus
    ]

    relationship_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='relationship_records', null=True, blank=True, db_index=True)
    session_token = models.CharField(max_length=100, db_index=True)
    claimant_name = models.CharField(max_length=255, default='Rohan Mehta')
    deceased_name = models.CharField(max_length=255, default='Arun Mehta')
    claimant_relationship = models.CharField(max_length=50, default='Son')
    
    # 7-stage Relationship Status Machine
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default=RelationshipStatus.NOT_STARTED.value)
    evidence_status = models.CharField(max_length=50, default='PENDING INSTITUTIONAL VERIFICATION')
    supporting_documents = models.JSONField(default=list)
    evidence_considered = models.JSONField(default=list)
    verification_method = models.CharField(max_length=100, default='STATUTORY_DOCUMENT_REVIEW')
    provider_or_reviewer = models.CharField(max_length=100, default='PENDING_REVIEW')
    clarification_or_rejection_reason = models.TextField(blank=True, null=True)
    status_history = models.JSONField(default=list)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def transition_to(self, new_status_str: str, reason: str = "", reviewer: str = "", evidence: Any = None):
        """
        Validates and transitions state through the 7-stage state machine.
        Raises ValueError if transition is unauthorized or invalid.
        """
        from .providers.relationship_service import RelationshipEvidenceAssessmentService
        target = RelationshipStatus(new_status_str)
        try:
            current = RelationshipStatus(self.status)
        except ValueError:
            current = RelationshipStatus.NOT_STARTED

        valid, err_msg = RelationshipEvidenceAssessmentService.validate_transition(current, target)
        if not valid:
            raise ValueError(err_msg)

        prev_status = self.status
        self.status = target.value
        if reason:
            self.clarification_or_rejection_reason = reason
        if reviewer:
            self.provider_or_reviewer = reviewer
        if evidence:
            if not isinstance(self.evidence_considered, list):
                self.evidence_considered = []
            self.evidence_considered.append(evidence)

        if not isinstance(self.status_history, list):
            self.status_history = []
        self.status_history.append({
            'from': prev_status,
            'to': target.value,
            'timestamp': timezone.now().isoformat(),
            'reason': reason,
            'reviewer': reviewer
        })
        self.save()

    def __str__(self):
        return f"{self.claimant_name} ({self.claimant_relationship}) - {self.status}"


class AuditLog(models.Model):
    """
    Security audit trail for verification and discovery events.
    Contains NO raw sensitive identifiers, passwords, or biometrics.
    """
    log_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='claims_audit_logs', null=True, blank=True, db_index=True)
    session_token = models.CharField(max_length=100, db_index=True)
    event_type = models.CharField(max_length=100)
    details = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.timestamp}] {self.event_type} - {self.session_token}"
