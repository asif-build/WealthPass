from abc import ABC, abstractmethod
from enum import Enum
from typing import Dict, Any, List, Optional
from datetime import datetime


class IntegrationStatus(str, Enum):
    LIVE = "LIVE"
    OFFICIAL_EXTERNAL_PROCESS = "OFFICIAL_EXTERNAL_PROCESS"
    NOT_CONFIGURED = "NOT_CONFIGURED"
    FAILED = "FAILED"
    PLANNED = "PLANNED"


class RelationshipStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    DOCUMENTS_REQUIRED = "DOCUMENTS_REQUIRED"
    EVIDENCE_SUBMITTED = "EVIDENCE_SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    NEEDS_CLARIFICATION = "NEEDS_CLARIFICATION"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class BaseProvider(ABC):
    """Base class for all WealthPass verification and discovery providers."""
    
    @property
    @abstractmethod
    def provider_id(self) -> str:
        """Unique machine identifier for the provider."""
        pass

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Human-readable provider name."""
        pass

    @property
    @abstractmethod
    def integration_status(self) -> IntegrationStatus:
        """Current integration state: LIVE, OFFICIAL_EXTERNAL_PROCESS, NOT_CONFIGURED, etc."""
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        """Checks if all required environment variables, credentials, or keys are present."""
        pass

    def get_metadata(self) -> Dict[str, Any]:
        """Returns public metadata suitable for safe client-side presentation."""
        return {
            "id": self.provider_id,
            "name": self.provider_name,
            "status": self.integration_status.value,
            "is_configured": self.is_configured(),
        }


class BaseIdentityVerificationProvider(BaseProvider):
    """Abstract interface for privacy-first claimant identity verification."""

    @abstractmethod
    def verify_claimant_identity(
        self,
        identifier_input: str,
        consent_granted: bool,
        user_id: int,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes identity verification.
        Must strictly adhere to data minimization:
        NEVER stores or logs full Aadhaar, full biometric data, or raw OTPs.
        """
        pass


class BaseDocumentVerificationProvider(BaseProvider):
    """Abstract interface for statutory document verification."""

    @abstractmethod
    def verify_document(
        self,
        document_type: str,
        file_path: Optional[str] = None,
        extracted_text: Optional[str] = None,
        document_number: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Verifies or assesses uploaded evidence against official channels."""
        pass


class BaseDeathCertificateVerificationProvider(BaseProvider):
    """Abstract interface for verifying official death certificates."""

    @abstractmethod
    def verify_death_certificate(
        self,
        certificate_number: str,
        deceased_name: str,
        date_of_death: Optional[str] = None,
        state_or_district: Optional[str] = None
    ) -> Dict[str, Any]:
        """Queries civil registration authority or returns official manual verification route."""
        pass


class BaseAssetDiscoveryProvider(BaseProvider):
    """Abstract interface for statutory asset discovery providers."""

    @property
    @abstractmethod
    def category(self) -> str:
        """Asset class (e.g., 'BANK_DEPOSITS', 'INSURANCE', 'MUTUAL_FUNDS', 'CORPORATE_ASSETS')."""
        pass

    @property
    @abstractmethod
    def official_portal_url(self) -> str:
        """Direct link to the official authority/regulator portal."""
        pass

    @abstractmethod
    def get_discovery_guide(self) -> Dict[str, Any]:
        """Returns official process guidance, required identifiers, and institutional checklists."""
        pass

    @abstractmethod
    def discover_assets(
        self,
        query_params: Dict[str, Any],
        consent_record_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Queries authorized API if configured and live, or returns official external process guidance.
        NEVER fabricates fake balances, mock accounts, or simulated matches.
        """
        pass
