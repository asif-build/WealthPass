"""
Pydantic Schemas for Green AI Financial Document Intelligence.
Enforces strict typing, missing-field nullability, and provenance tracking.
"""
from enum import Enum
from typing import Optional, List, Dict, Any, Union
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator


class DocumentCategory(str, Enum):
    BANK_PASSBOOK_OR_STATEMENT = "bank_passbook_or_statement"
    INSURANCE_OR_LIC_POLICY = "insurance_or_lic_policy"
    EPF_DOCUMENT = "epf_document"
    MUTUAL_FUND_CAS_STATEMENT = "mutual_fund_cas_statement"
    SHARE_CERTIFICATE_OR_SECURITIES_STATEMENT = "share_certificate_or_securities_statement"
    UNKNOWN_OR_OTHER = "unknown_or_other"


class ClassificationMethod(str, Enum):
    CACHE_HIT = "CACHE_HIT"
    DETERMINISTIC_RULES = "DETERMINISTIC_RULES"
    FAST_CLASSIFIER_TFIDF = "FAST_CLASSIFIER_TFIDF"
    ESCALATED_BASELINE = "ESCALATED_BASELINE"
    MANUAL_REVIEW = "MANUAL_REVIEW"


class PipelineType(str, Enum):
    BASELINE = "BASELINE"
    OPTIMIZED_CASCADE = "OPTIMIZED_CASCADE"


class BankStatementFields(BaseModel):
    account_holder_name: Optional[str] = Field(None, description="Primary account holder full name")
    bank_name: Optional[str] = Field(None, description="Name of the scheduled commercial or cooperative bank")
    account_number_masked: Optional[str] = Field(None, description="Masked account number, e.g. XXXXXX1234")
    ifsc_code: Optional[str] = Field(None, description="11-character Indian Financial System Code")
    statement_period: Optional[str] = Field(None, description="Statement duration or passbook date range")
    closing_balance: Optional[Decimal] = Field(None, description="Ending balance in INR, None if unstated")

    @field_validator("ifsc_code")
    @classmethod
    def validate_ifsc(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip().upper()
        if len(clean) == 11 and clean[:4].isalpha() and clean[4] == "0":
            return clean
        return None


class InsurancePolicyFields(BaseModel):
    policyholder_name: Optional[str] = Field(None, description="Insured person full name")
    insurer_name: Optional[str] = Field(None, description="Insurance company name, e.g. LIC of India, HDFC Life")
    policy_number: Optional[str] = Field(None, description="Alphanumeric policy identifier")
    sum_assured: Optional[Decimal] = Field(None, description="Guaranteed insurance sum in INR")
    nominee_name: Optional[str] = Field(None, description="Registered nominee on policy, if specified")
    premium_status: Optional[str] = Field(None, description="Paid-up, Active, or Inactive status")


class EPFDocumentFields(BaseModel):
    member_name: Optional[str] = Field(None, description="EPF member full legal name")
    uan: Optional[str] = Field(None, description="12-digit Universal Account Number")
    pf_account_number: Optional[str] = Field(None, description="Establishment and Member PF code")
    establishment_name: Optional[str] = Field(None, description="Employer / establishment name")
    total_balance: Optional[Decimal] = Field(None, description="Total employee + employer balance in INR")

    @field_validator("uan")
    @classmethod
    def validate_uan(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = "".join(filter(str.isdigit, v))
        if len(clean) == 12:
            return clean
        return None


class MutualFundCASFields(BaseModel):
    investor_name: Optional[str] = Field(None, description="Primary unit holder name")
    amc_name: Optional[str] = Field(None, description="Asset Management Company / Fund House")
    folio_number: Optional[str] = Field(None, description="Mutual fund folio identifier")
    scheme_name: Optional[str] = Field(None, description="Fund scheme name")
    pan_masked: Optional[str] = Field(None, description="Masked Permanent Account Number")
    current_value: Optional[Decimal] = Field(None, description="Total valuation / NAV balance in INR")


class SecuritiesCertificateFields(BaseModel):
    holder_name: Optional[str] = Field(None, description="Registered shareholder name")
    company_name: Optional[str] = Field(None, description="Issuing corporate entity name")
    folio_number_or_dpid: Optional[str] = Field(None, description="Shareholder folio or DP ID / Client ID")
    certificate_no: Optional[str] = Field(None, description="Physical share certificate number")
    distinctive_nos_range: Optional[str] = Field(None, description="Range of distinctive share numbers")
    number_of_shares: Optional[int] = Field(None, description="Total quantity of shares held")


class UnknownDocumentFields(BaseModel):
    summary: Optional[str] = Field(None, description="Brief description of unrecognized content")
    detected_keywords: List[str] = Field(default_factory=list, description="Keywords identified")
    reason: Optional[str] = Field(None, description="Reason for rejection or non-financial category")


CategoryFieldsUnion = Union[
    BankStatementFields,
    InsurancePolicyFields,
    EPFDocumentFields,
    MutualFundCASFields,
    SecuritiesCertificateFields,
    UnknownDocumentFields
]


class DocumentIntelligenceResult(BaseModel):
    document_category: DocumentCategory = Field(..., description="Classified category")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Calibrated confidence score")
    classification_method: ClassificationMethod = Field(..., description="Method used to classify")
    pipeline_type: PipelineType = Field(..., description="Pipeline that executed the inference")
    extracted_fields: CategoryFieldsUnion = Field(..., description="Category-specific extracted fields")
    explanation: Optional[str] = Field(None, description="Plain-language statutory guidance summary")
    
    # Telemetry and Energy metrics
    latency_ms: float = Field(default=0.0, ge=0.0, description="Inference latency in milliseconds")
    energy_wh: float = Field(default=0.0, ge=0.0, description="Energy consumed in Watt-hours")
    emissions_g_co2: float = Field(default=0.0, ge=0.0, description="Estimated CO2 emissions in grams")
    escalated_to_baseline: bool = Field(default=False, description="Whether fast classifier escalated to baseline")
    cached: bool = Field(default=False, description="Whether result was served from SHA-256 cache")
    model_name: str = Field(default="cascade-v2", description="Model identifier")
    pipeline_version: str = Field(default="2.0.0", description="Pipeline semantic version")
    provenance: Dict[str, Any] = Field(default_factory=dict, description="Metadata and audit provenance")
