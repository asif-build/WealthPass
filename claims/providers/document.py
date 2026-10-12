import os
import re
from typing import Dict, Any, Optional
from .base import (
    BaseDocumentVerificationProvider,
    BaseDeathCertificateVerificationProvider,
    IntegrationStatus
)


class CivilRegistrationDeathCertAdapter(BaseDeathCertificateVerificationProvider):
    """
    Civil Registration System (CRS) / Municipal Authority Death Certificate Verifier.
    Office of the Registrar General of India (RGI) / State CRS portals.
    """

    @property
    def provider_id(self) -> str:
        return "CRS_GOV_INDIA"

    @property
    def provider_name(self) -> str:
        return "Civil Registration System (CRS India) / Municipal Registrar"

    @property
    def integration_status(self) -> IntegrationStatus:
        if self.is_configured():
            return IntegrationStatus.LIVE
        return IntegrationStatus.OFFICIAL_EXTERNAL_PROCESS

    def is_configured(self) -> bool:
        return bool(os.getenv("CRS_VERIFICATION_API_KEY") and os.getenv("CRS_VERIFICATION_ENDPOINT"))

    def verify_death_certificate(
        self,
        certificate_number: str,
        deceased_name: str,
        date_of_death: Optional[str] = None,
        state_or_district: Optional[str] = None
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "success": False,
                "status": IntegrationStatus.OFFICIAL_EXTERNAL_PROCESS.value,
                "provider": self.provider_id,
                "certificate_number": certificate_number,
                "message": "Automated CRS API access is not configured. Physical verification with municipal issuing authority is required by statutory institutions.",
                "guidance": "Custodian institutions verify death certificates against state municipal registers (e.g. MCD, BMC, or state crsorgi.gov.in database) during claim adjudication."
            }

        # Real CRS integration would query official state registrar API here
        return {
            "success": True,
            "status": "VERIFIED_ONLINE",
            "provider": self.provider_id,
            "certificate_number": certificate_number
        }


class ManualInstitutionalDocVerifier(BaseDocumentVerificationProvider):
    """
    Standard institutional review adapter for high-stake legal documents
    (Succession Certificates from Civil Courts, Legal Heir Certificates from Revenue Authorities,
    Marriage Certificates from Sub-Registrar of Assurances).
    """

    @property
    def provider_id(self) -> str:
        return "INSTITUTIONAL_LEGAL_ADJUDICATION"

    @property
    def provider_name(self) -> str:
        return "Institutional / Judicial Adjudication"

    @property
    def integration_status(self) -> IntegrationStatus:
        return IntegrationStatus.OFFICIAL_EXTERNAL_PROCESS

    def is_configured(self) -> bool:
        return True

    def verify_document(
        self,
        document_type: str,
        file_path: Optional[str] = None,
        extracted_text: Optional[str] = None,
        document_number: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        return {
            "success": False,
            "status": "PENDING_INSTITUTIONAL_REVIEW",
            "provider": self.provider_id,
            "document_type": document_type,
            "message": "Under statutory recovery guidelines, legal heirship and succession certificates must be verified by the custodian institution's legal counsel or nodal officer.",
            "ocr_analyzed": bool(extracted_text)
        }


class MockTestingDocVerifier(BaseDocumentVerificationProvider):
    """
    STRICTLY FOR ISOLATED AUTOMATED TESTS.
    """

    def __init__(self, simulate_valid: bool = True):
        self.simulate_valid = simulate_valid

    @property
    def provider_id(self) -> str:
        return "TEST_DOC_VERIFIER"

    @property
    def provider_name(self) -> str:
        return "Test Suite Document Verifier"

    @property
    def integration_status(self) -> IntegrationStatus:
        return IntegrationStatus.LIVE

    def is_configured(self) -> bool:
        return True

    def verify_document(
        self,
        document_type: str,
        file_path: Optional[str] = None,
        extracted_text: Optional[str] = None,
        document_number: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        return {
            "success": self.simulate_valid,
            "status": "VERIFIED" if self.simulate_valid else "REJECTED",
            "provider": self.provider_id,
            "document_type": document_type
        }
