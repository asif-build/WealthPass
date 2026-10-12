"""
Pydantic Schemas for Claim Copilot Field Guidance & Progress Tracking.
Enforces strict typing, structured output validation, uncertainty indicators,
and privacy boundaries (zero transmission of unneeded personal records).
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class FieldGuidanceRequest(BaseModel):
    institution_id: str = Field(..., description="Target institution identifier, e.g. 'sbi', 'lic_india'")
    procedure_version: str = Field("v2024.1", description="Procedure version key")
    field_id: str = Field(..., description="Form field identifier being queried")
    user_question: Optional[str] = Field(None, description="Optional specific user query regarding this field")


class FieldGuidanceResponse(BaseModel):
    field_id: str = Field(..., description="Field identifier")
    field_label: str = Field(..., description="Official human-readable form field title")
    field_explanation: str = Field(..., description="Concise explanation of what information is requested")
    required_information: str = Field(..., description="Specific data element needed")
    where_to_find_information: str = Field(..., description="Specific physical or digital location to find this information")
    expected_format: str = Field(..., description="Exact format required by official instructions")
    relevant_document_types: List[str] = Field(default_factory=list, description="List of official supporting documents")
    official_source_reference: str = Field(..., description="Direct citation / URL to official regulatory procedure")
    is_mandatory: bool = Field(True, description="Whether the field is strictly mandatory for claim acceptance")
    uncertainty_flag: bool = Field(False, description="True if requirement is ambiguous or institution-specific conditions apply")
    uncertainty_guidance: Optional[str] = Field(None, description="Actionable instruction when uncertainty flag is true")
    source_tier: str = Field("CACHE_HIT", description="CACHE_HIT, DETERMINISTIC_RULE, LIGHTWEIGHT_MODEL, or LLM_FALLBACK")
    energy_wh: float = Field(0.0, description="Measured energy consumption (internal telemetry)")


class CopilotProcedureDetails(BaseModel):
    procedure_id: str
    institution_id: str
    institution_name: str
    asset_category: str
    claim_type: str
    capability_type: str
    official_source_url: str
    official_portal_url: Optional[str]
    form_identifier: str
    form_name: str
    summary: str
    eligibility_notes: str
    submission_method: str
    direct_api_supported: bool
    version: str
    step_by_step_instructions: List[str]
    required_documents: List[Dict[str, Any]]
    fields_catalog: List[Dict[str, Any]]


class ClaimProgressUpdateRequest(BaseModel):
    status: Optional[str] = None
    checked_documents: Optional[List[str]] = None
    completed_fields: Optional[List[str]] = None
    user_notes: Optional[str] = None
    acknowledgement_number: Optional[str] = None
    servicing_branch: Optional[str] = None
