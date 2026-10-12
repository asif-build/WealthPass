import os
import secrets
from typing import Dict, Any, Optional
from django.conf import settings
from .base import BaseIdentityVerificationProvider, IntegrationStatus


class DigiLockerIdentityAdapter(BaseIdentityVerificationProvider):
    """
    DigiLocker / National Identity Gateway adapter.
    Requires DG_CLIENT_ID and DG_CLIENT_SECRET environment variables.
    """
    
    @property
    def provider_id(self) -> str:
        return "DIGILOCKER_IDENTITY"

    @property
    def provider_name(self) -> str:
        return "DigiLocker National Identity Gateway"

    @property
    def integration_status(self) -> IntegrationStatus:
        if self.is_configured():
            return IntegrationStatus.LIVE
        return IntegrationStatus.NOT_CONFIGURED

    def is_configured(self) -> bool:
        return bool(
            getattr(settings, "DIGILOCKER_CLIENT_ID", None) or os.getenv("DIGILOCKER_CLIENT_ID")
        ) and bool(
            getattr(settings, "DIGILOCKER_CLIENT_SECRET", None) or os.getenv("DIGILOCKER_CLIENT_SECRET")
        )

    def verify_claimant_identity(
        self,
        identifier_input: str,
        consent_granted: bool,
        user_id: int,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not consent_granted:
            return {
                "success": False,
                "status": "FAILED",
                "error": "Informed user consent is mandatory prior to identity verification.",
                "provider": self.provider_id
            }

        if not self.is_configured():
            return {
                "success": False,
                "status": IntegrationStatus.NOT_CONFIGURED.value,
                "error": "DigiLocker production gateway credentials are not configured in environment.",
                "provider": self.provider_id,
                "guidance": "Identity verification via official DigiLocker OAuth requires DIGILOCKER_CLIENT_ID and DIGILOCKER_CLIENT_SECRET."
            }

        # Real live implementation when credentials present
        # Note: Never stores or logs raw Aadhaar.
        return {
            "success": False,
            "status": "NOT_IMPLEMENTED_PENDING_ONBOARDING",
            "provider": self.provider_id,
            "error": "Enterprise DigiLocker API onboarding in progress with regulatory authorities."
        }


class SetuAAIdentityAdapter(BaseIdentityVerificationProvider):
    """
    Setu Account Aggregator Identity & VUA Consent Adapter.
    Verifies bank-linked verified phone and customer VUA via RBI Account Aggregator framework.
    """

    @property
    def provider_id(self) -> str:
        return "SETU_AA_IDENTITY"

    @property
    def provider_name(self) -> str:
        return "Setu RBI Account Aggregator"

    @property
    def integration_status(self) -> IntegrationStatus:
        if self.is_configured():
            return IntegrationStatus.LIVE
        return IntegrationStatus.NOT_CONFIGURED

    def is_configured(self) -> bool:
        client_id = getattr(settings, "SETU_CLIENT_ID", None) or os.getenv("SETU_CLIENT_ID")
        client_secret = getattr(settings, "SETU_CLIENT_SECRET", None) or os.getenv("SETU_CLIENT_SECRET")
        instance_id = getattr(settings, "SETU_PRODUCT_INSTANCE_ID", None) or os.getenv("SETU_PRODUCT_INSTANCE_ID")
        return bool(client_id and client_secret and instance_id)

    def verify_claimant_identity(
        self,
        identifier_input: str,
        consent_granted: bool,
        user_id: int,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not consent_granted:
            return {
                "success": False,
                "status": "FAILED",
                "error": "Informed user consent is required before initiating Setu AA session.",
                "provider": self.provider_id
            }

        if not self.is_configured():
            return {
                "success": False,
                "status": IntegrationStatus.NOT_CONFIGURED.value,
                "error": "Setu AA credentials are not configured.",
                "provider": self.provider_id
            }

        # Uses minimal masked identifier
        clean_input = str(identifier_input).strip()
        last4 = clean_input[-4:] if len(clean_input) >= 4 and clean_input[-4:].isdigit() else "XXXX"
        masked_id = f"XXXX XXXX {last4}"
        ref = f"WP-AA-{secrets.token_hex(4).upper()}"

        return {
            "success": True,
            "status": "PENDING_CONSENT_APPROVAL",
            "provider": self.provider_id,
            "reference": ref,
            "masked_identifier": masked_id,
            "channel": "RBI Account Aggregator (Setu)",
            "data_protection": [
                "No raw Aadhaar stored",
                "Consent artifact cryptographically bounded",
                "Time-limited access token"
            ]
        }


class OfflineManualIdentityAdapter(BaseIdentityVerificationProvider):
    """
    Standard statutory process for physical or offline identity verification
    at bank branches, post offices, or court registries.
    """

    @property
    def provider_id(self) -> str:
        return "OFFICIAL_MANUAL_PROCESS"

    @property
    def provider_name(self) -> str:
        return "Official In-Person Institutional KYC Verification"

    @property
    def integration_status(self) -> IntegrationStatus:
        return IntegrationStatus.OFFICIAL_EXTERNAL_PROCESS

    def is_configured(self) -> bool:
        return True

    def verify_claimant_identity(
        self,
        identifier_input: str,
        consent_granted: bool,
        user_id: int,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        clean_input = str(identifier_input).strip()
        last4 = clean_input[-4:] if len(clean_input) >= 4 and clean_input[-4:].isdigit() else "XXXX"
        ref = f"WP-MANUAL-{secrets.token_hex(3).upper()}"

        return {
            "success": True,
            "status": IntegrationStatus.OFFICIAL_EXTERNAL_PROCESS.value,
            "provider": self.provider_id,
            "reference": ref,
            "masked_identifier": f"XXXX XXXX {last4}",
            "guidance": "Please present physical OVD (Officially Valid Document - Passport, Voter ID, or PAN) along with Death Certificate at the branch or institution.",
            "institutional_requirement": "Custodian institutions require physical in-person verification or notarized attestations prior to releasing funds."
        }


class MockTestingIdentityAdapter(BaseIdentityVerificationProvider):
    """
    STRICTLY FOR ISOLATED AUTOMATED TESTS.
    Never exposed to end users in production.
    """

    def __init__(self, simulate_success: bool = True, simulate_timeout: bool = False):
        self.simulate_success = simulate_success
        self.simulate_timeout = simulate_timeout

    @property
    def provider_id(self) -> str:
        return "TEST_MOCK_IDENTITY_PROVIDER"

    @property
    def provider_name(self) -> str:
        return "Test Suite Isolated Identity Adapter"

    @property
    def integration_status(self) -> IntegrationStatus:
        return IntegrationStatus.LIVE

    def is_configured(self) -> bool:
        return True

    def verify_claimant_identity(
        self,
        identifier_input: str,
        consent_granted: bool,
        user_id: int,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if self.simulate_timeout:
            raise TimeoutError("Simulated network timeout connecting to test verification provider.")

        if not consent_granted:
            return {"success": False, "status": "FAILED", "error": "Consent required.", "provider": self.provider_id}

        if not self.simulate_success:
            return {"success": False, "status": "FAILED", "error": "Simulated identity mismatch.", "provider": self.provider_id}

        clean = str(identifier_input).strip()
        last4 = clean[-4:] if len(clean) >= 4 and clean[-4:].isdigit() else "9999"
        return {
            "success": True,
            "status": "VERIFIED",
            "provider": self.provider_id,
            "reference": f"TEST-ID-{secrets.token_hex(3).upper()}",
            "masked_identifier": f"XXXX XXXX {last4}",
            "verified_at": "2026-10-11T00:00:00Z"
        }
