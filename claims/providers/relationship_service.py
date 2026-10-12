import re
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from .base import RelationshipStatus


# Statutory relationship rules based on Indian Succession Act, 1925
# and Hindu Succession Act, 1956
STATUTORY_RELATIONSHIP_REQUIREMENTS: Dict[str, Dict[str, Any]] = {
    "SPOUSE": {
        "heir_class": "Class 1 Heir",
        "description": "Surviving legal husband or wife of the deceased person.",
        "mandatory_documents": [
            {
                "type": "DEATH_CERTIFICATE",
                "label": "Original / Certified Death Certificate",
                "description": "Issued by Municipal Corporation or Registrar of Births and Deaths."
            },
            {
                "type": "MARRIAGE_CERTIFICATE",
                "label": "Marriage Certificate / Statutory Spousal Proof",
                "description": "Issued by Registrar of Marriages, or Passport / Ration Card / Joint Bank Account naming spouse."
            },
            {
                "type": "CLAIMANT_KYC",
                "label": "Surviving Spouse KYC (Identity & Address Proof)",
                "description": "Officially Valid Document (PAN and Aadhaar / Voter ID / Passport)."
            }
        ],
        "conditional_documents": [
            {
                "type": "LEGAL_HEIR_CERTIFICATE",
                "label": "Legal Heir Certificate / Surviving Member Certificate",
                "description": "Mandatory when no nominee is listed or when children/other Class-1 heirs exist."
            },
            {
                "type": "NOC_OTHER_HEIRS",
                "label": "No Objection Certificate (NOC) from Children",
                "description": "Required if children are of legal majority and waive claim in favor of surviving spouse."
            }
        ]
    },
    "SON": {
        "heir_class": "Class 1 Heir",
        "description": "Biological or legally adopted son of the deceased person.",
        "mandatory_documents": [
            {
                "type": "DEATH_CERTIFICATE",
                "label": "Original / Certified Death Certificate",
                "description": "Issued by Municipal Corporation or Registrar of Births and Deaths."
            },
            {
                "type": "BIRTH_CERTIFICATE",
                "label": "Birth Certificate / School Leaving Certificate / Passport",
                "description": "Must explicitly identify the deceased person as father or mother."
            },
            {
                "type": "CLAIMANT_KYC",
                "label": "Claimant Photo Identity Proof",
                "description": "PAN and officially valid identity document."
            }
        ],
        "conditional_documents": [
            {
                "type": "LEGAL_HEIR_CERTIFICATE",
                "label": "Legal Heir Certificate / Waris Certificate",
                "description": "Issued by Revenue Department / Tehsildar listing all surviving Class-1 heirs."
            },
            {
                "type": "NOC_OTHER_HEIRS",
                "label": "No Objection Certificate (NOC) from Surviving Sibling(s) & Mother",
                "description": "Required when single heir claims aggregate asset on behalf of family."
            }
        ]
    },
    "DAUGHTER": {
        "heir_class": "Class 1 Heir",
        "description": "Biological or legally adopted daughter of the deceased person (equal coparcenary rights under 2005 amendment).",
        "mandatory_documents": [
            {
                "type": "DEATH_CERTIFICATE",
                "label": "Original / Certified Death Certificate",
                "description": "Issued by Municipal Corporation or Registrar of Births and Deaths."
            },
            {
                "type": "BIRTH_CERTIFICATE",
                "label": "Birth Certificate / Educational Record / Passport",
                "description": "Must explicitly identify the deceased person as parent."
            },
            {
                "type": "CLAIMANT_KYC",
                "label": "Claimant Photo Identity Proof",
                "description": "PAN and current identification document."
            }
        ],
        "conditional_documents": [
            {
                "type": "LEGAL_HEIR_CERTIFICATE",
                "label": "Legal Heir Certificate",
                "description": "Issued by Tehsildar / District Revenue Officer."
            },
            {
                "type": "MARRIAGE_CERTIFICATE",
                "label": "Marriage Certificate (if surname changed post-marriage)",
                "description": "Required for identity reconciliation if maiden name differs from current identification."
            }
        ]
    },
    "MOTHER": {
        "heir_class": "Class 1 Heir",
        "description": "Biological mother of the deceased person.",
        "mandatory_documents": [
            {
                "type": "DEATH_CERTIFICATE",
                "label": "Original / Certified Death Certificate",
                "description": "Death Certificate of deceased son/daughter."
            },
            {
                "type": "BIRTH_CERTIFICATE",
                "label": "Birth Certificate of Deceased / School Records",
                "description": "Document confirming claimant as biological mother."
            },
            {
                "type": "CLAIMANT_KYC",
                "label": "Mother's KYC Identification",
                "description": "Identity and active bank account proofs."
            }
        ],
        "conditional_documents": [
            {
                "type": "LEGAL_HEIR_CERTIFICATE",
                "label": "Legal Heir Certificate",
                "description": "Confirming surviving family tree."
            }
        ]
    },
    "FATHER": {
        "heir_class": "Class 2 Heir",
        "description": "Father of deceased (under Hindu Succession Act, Father is Class 2 heir; inherits only in absence of Class 1 heirs).",
        "mandatory_documents": [
            {
                "type": "DEATH_CERTIFICATE",
                "label": "Death Certificate",
                "description": "Death Certificate of deceased child."
            },
            {
                "type": "LEGAL_HEIR_CERTIFICATE",
                "label": "Legal Heir / Succession Certificate",
                "description": "Court / Revenue certificate certifying absence of Class 1 heirs (spouse, children, mother)."
            },
            {
                "type": "CLAIMANT_KYC",
                "label": "Father's KYC Identification",
                "description": "Identity proof of claimant."
            }
        ],
        "conditional_documents": [
            {
                "type": "SUCCESSION_CERTIFICATE",
                "label": "Civil Court Succession Certificate",
                "description": "Mandatory for Class-2 claims above bank/financial thresholds without nomination."
            }
        ]
    },
    "BROTHER": {
        "heir_class": "Class 2 Heir",
        "description": "Brother of deceased (inherits only in absence of Class 1 heirs and parents).",
        "mandatory_documents": [
            {
                "type": "DEATH_CERTIFICATE",
                "label": "Death Certificate",
                "description": "Death Certificate of deceased sibling."
            },
            {
                "type": "LEGAL_HEIR_CERTIFICATE",
                "label": "Legal Heir Certificate / Genealogic Tree",
                "description": "Establishing common parentage and absence of Class 1 heirs."
            },
            {
                "type": "SUCCESSION_CERTIFICATE",
                "label": "Court Succession Certificate",
                "description": "Mandatory under Indian Succession Act Section 370."
            }
        ],
        "conditional_documents": []
    },
    "SISTER": {
        "heir_class": "Class 2 Heir",
        "description": "Sister of deceased (inherits only in absence of Class 1 heirs and parents).",
        "mandatory_documents": [
            {
                "type": "DEATH_CERTIFICATE",
                "label": "Death Certificate",
                "description": "Death Certificate of deceased sibling."
            },
            {
                "type": "LEGAL_HEIR_CERTIFICATE",
                "label": "Legal Heir Certificate / Family Tree",
                "description": "Establishing common parentage and absence of Class 1 heirs."
            },
            {
                "type": "SUCCESSION_CERTIFICATE",
                "label": "Court Succession Certificate",
                "description": "Mandatory under Indian Succession Act Section 370."
            }
        ],
        "conditional_documents": []
    },
    "LEGAL_HEIR_OTHER": {
        "heir_class": "Testamentary / Court Designated Representative",
        "description": "Executor, Administrator, or Legal Representative holding legal letters.",
        "mandatory_documents": [
            {
                "type": "DEATH_CERTIFICATE",
                "label": "Death Certificate",
                "description": "Original certified death certificate."
            },
            {
                "type": "SUCCESSION_CERTIFICATE",
                "label": "Succession Certificate / Letter of Administration / Probate of Will",
                "description": "Issued by High Court or District Judge with competent territorial jurisdiction."
            },
            {
                "type": "CLAIMANT_KYC",
                "label": "Court Appointed Representative KYC",
                "description": "Verified identification of the applicant."
            }
        ],
        "conditional_documents": []
    }
}


class RelationshipEvidenceAssessmentService:
    """
    Statutory Rules Engine & Status Machine for Claimant–Deceased Relationship Verification.
    
    Principles:
    1. Phone OTP does NOT prove identity.
    2. Identity verification does NOT prove family relationship.
    3. Family relationship does NOT prove legal entitlement to specific financial assets.
    4. Surnames, shared addresses, or AI similarity scores CANNOT establish kinship.
    5. OCR text extraction measures consistency but NEVER confers automatic VERIFIED status.
    """

    # Permitted state machine transitions
    VALID_TRANSITIONS: Dict[RelationshipStatus, List[RelationshipStatus]] = {
        RelationshipStatus.NOT_STARTED: [
            RelationshipStatus.DOCUMENTS_REQUIRED
        ],
        RelationshipStatus.DOCUMENTS_REQUIRED: [
            RelationshipStatus.EVIDENCE_SUBMITTED
        ],
        RelationshipStatus.EVIDENCE_SUBMITTED: [
            RelationshipStatus.UNDER_REVIEW
        ],
        RelationshipStatus.UNDER_REVIEW: [
            RelationshipStatus.NEEDS_CLARIFICATION,
            RelationshipStatus.VERIFIED,
            RelationshipStatus.REJECTED
        ],
        RelationshipStatus.NEEDS_CLARIFICATION: [
            RelationshipStatus.EVIDENCE_SUBMITTED
        ],
        RelationshipStatus.VERIFIED: [
            # Terminal state unless contested or revoked by legal challenge
            RelationshipStatus.UNDER_REVIEW
        ],
        RelationshipStatus.REJECTED: [
            # May reopen only if fresh statutory evidence is submitted
            RelationshipStatus.EVIDENCE_SUBMITTED
        ]
    }

    @classmethod
    def normalize_relationship(cls, relationship: str) -> str:
        clean = (relationship or "").strip().upper()
        mapping = {
            "SON": "SON",
            "DAUGHTER": "DAUGHTER",
            "CHILD": "SON",
            "SPOUSE": "SPOUSE",
            "WIFE": "SPOUSE",
            "HUSBAND": "SPOUSE",
            "MOTHER": "MOTHER",
            "FATHER": "FATHER",
            "PARENT": "FATHER",
            "BROTHER": "BROTHER",
            "SISTER": "SISTER",
            "SIBLING": "BROTHER",
        }
        return mapping.get(clean, "LEGAL_HEIR_OTHER")

    @classmethod
    def get_statutory_requirements(cls, relationship: str) -> Dict[str, Any]:
        normalized = cls.normalize_relationship(relationship)
        reqs = STATUTORY_RELATIONSHIP_REQUIREMENTS.get(normalized)
        if not reqs:
            reqs = STATUTORY_RELATIONSHIP_REQUIREMENTS["LEGAL_HEIR_OTHER"]
        return {
            "relationship_key": normalized,
            "heir_class": reqs["heir_class"],
            "description": reqs["description"],
            "mandatory_documents": reqs["mandatory_documents"],
            "conditional_documents": reqs["conditional_documents"],
            "statutory_notice": (
                "Under Indian succession laws, legal heirship and title must be substantiated by official certificates. "
                "WealthPass assists in evidence compilation and consistency verification, but final adjudication is "
                "conducted by the holding institution or competent court."
            )
        }

    @classmethod
    def validate_transition(
        cls,
        current_status: RelationshipStatus,
        target_status: RelationshipStatus
    ) -> Tuple[bool, Optional[str]]:
        """Enforces permitted transitions in the 7-stage state machine."""
        if current_status == target_status:
            return True, None

        allowed = cls.VALID_TRANSITIONS.get(current_status, [])
        if target_status in allowed:
            return True, None

        return False, (
            f"Invalid status transition from {current_status.value} to {target_status.value}. "
            f"Permitted next states: {[s.value for s in allowed]}."
        )

    @classmethod
    def assess_ocr_evidence(
        cls,
        ocr_text: str,
        declared_deceased_name: str,
        declared_cert_no: str,
        declared_relationship: str
    ) -> Dict[str, Any]:
        """
        Performs objective field comparison against extracted OCR text.
        IMPORTANT: This measures document consistency only; it does NOT verify authenticity or entitlement.
        """
        if not ocr_text or not ocr_text.strip():
            return {
                "consistency_score": 0,
                "matches_deceased_name": False,
                "matches_certificate_no": False,
                "has_death_certificate_header": False,
                "detected_relationship_signals": [],
                "discrepancies": ["Document contains no readable text or OCR extraction failed."],
                "assessment_verdict": "UNREADABLE_OR_FAILED_OCR",
                "legal_disclaimer": "OCR extraction does not prove authenticity or legal entitlement."
            }

        text_lower = ocr_text.lower()
        discrepancies = []
        consistency_points = 0

        # 1. Header check
        has_header = any(term in text_lower for term in [
            "death certificate", "certificate of death",
            "form no. 6", "registration of births and deaths",
            "nagar nigam", "municipal corporation", "gram panchayat"
        ])
        if has_header:
            consistency_points += 30
        else:
            discrepancies.append("Standard civil registration death certificate header not detected in document text.")

        # 2. Deceased name comparison
        name_clean = declared_deceased_name.strip().lower()
        matches_name = False
        if name_clean and len(name_clean) >= 3:
            # Check full name or tokenized name
            tokens = [t for t in re.split(r'\s+', name_clean) if len(t) > 2]
            token_matches = sum(1 for t in tokens if t in text_lower)
            if name_clean in text_lower or (tokens and token_matches == len(tokens)):
                matches_name = True
                consistency_points += 35
            elif tokens and token_matches > 0:
                discrepancies.append(f"Partial name match only: found {token_matches} of {len(tokens)} name parts in document text.")
                consistency_points += 15
            else:
                discrepancies.append(f"Declared deceased name '{declared_deceased_name}' was not located in document text.")

        # 3. Certificate number comparison
        cert_clean = re.sub(r'[^a-zA-Z0-9]', '', declared_cert_no.lower())
        matches_cert = False
        if cert_clean and len(cert_clean) >= 4:
            text_cleaned_alphanum = re.sub(r'[^a-zA-Z0-9]', '', text_lower)
            if cert_clean in text_cleaned_alphanum or declared_cert_no.lower() in text_lower:
                matches_cert = True
                consistency_points += 35
            else:
                discrepancies.append(f"Certificate number '{declared_cert_no}' was not matched in document text.")

        # Verdict
        if consistency_points >= 80:
            verdict = "HIGH_CONSISTENCY"
        elif consistency_points >= 40:
            verdict = "PARTIAL_CONSISTENCY_NEEDS_REVIEW"
        else:
            verdict = "LOW_CONSISTENCY_DISCREPANCIES_DETECTED"

        return {
            "consistency_score": consistency_points,
            "matches_deceased_name": matches_name,
            "matches_certificate_no": matches_cert,
            "has_death_certificate_header": has_header,
            "discrepancies": discrepancies,
            "assessment_verdict": verdict,
            "legal_disclaimer": (
                "Field comparison is an automated consistency aid. "
                "It does NOT constitute statutory proof of authenticity or kinship."
            )
        }
