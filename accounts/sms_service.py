import abc
import logging
import os
import requests
from django.conf import settings
from .models import hash_token

logger = logging.getLogger(__name__)


class BaseSMSProvider(abc.ABC):
    """
    Abstract Base Class for SMS Verification Gateways.
    Ensures provider-agnostic extensibility while strictly barring fake fallbacks.
    """

    @abc.abstractmethod
    def is_configured(self) -> bool:
        pass

    @abc.abstractmethod
    def send_otp(self, phone_e164: str, otp_code: str) -> tuple[bool, str]:
        pass


class MSG91Provider(BaseSMSProvider):
    """
    MSG91 SMS Gateway Integration.
    Requires MSG91_AUTH_KEY and optionally MSG91_TEMPLATE_ID or MSG91_FLOW_ID.
    """

    def __init__(self):
        self.auth_key = os.getenv("MSG91_AUTH_KEY") or getattr(settings, "MSG91_AUTH_KEY", None)
        self.template_id = os.getenv("MSG91_TEMPLATE_ID") or getattr(settings, "MSG91_TEMPLATE_ID", None)
        self.sender_id = os.getenv("MSG91_SENDER_ID") or getattr(settings, "MSG91_SENDER_ID", "WLTHPS")

    def is_configured(self) -> bool:
        return bool(self.auth_key and (self.template_id or os.getenv("MSG91_FLOW_ID")))

    def send_otp(self, phone_e164: str, otp_code: str) -> tuple[bool, str]:
        # Validate phone strictly before making any request
        from .phone_utils import validate_and_normalize_indian_phone
        is_valid, normalized, err = validate_and_normalize_indian_phone(phone_e164)
        if not is_valid:
            return False, err or "Enter a valid 10-digit Indian mobile number."

        if not self.is_configured():
            return False, "SMS provider is not configured. Real SMS OTP dispatch requires MSG91_AUTH_KEY and MSG91_TEMPLATE_ID."

        # Clean phone number (strip leading + if provider requires numerical MSISDN)
        clean_phone = normalized.lstrip('+')
        url = "https://control.msg91.com/api/v5/otp"

        headers = {
            "authkey": self.auth_key,
            "Content-Type": "application/json"
        }

        payload = {
            "template_id": self.template_id,
            "mobile": clean_phone,
            "otp": otp_code,
            "otp_expiry": 10  # 10 minutes
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=8)
            if response.status_code in (401, 403):
                logger.error("MSG91 authentication failure (status %d): check MSG91_AUTH_KEY credentials.", response.status_code)
                return False, "SMS provider authentication failed. Please check provider credentials."

            try:
                resp_data = response.json()
            except Exception:
                resp_data = {}

            if response.status_code == 200 and resp_data.get("type") != "error":
                logger.info("MSG91 OTP dispatched successfully to %s", normalized[:6] + "...")
                return True, "OTP dispatched successfully."
            else:
                err_msg = resp_data.get("message", "MSG91 rejected OTP request.")
                logger.error("MSG91 error response: %s", err_msg)
                return False, f"SMS Gateway Error: {err_msg}"
        except requests.exceptions.Timeout:
            logger.error("Timeout connecting to MSG91 gateway.")
            return False, "Temporary delivery error: Connection to SMS provider timed out. Please try again."
        except requests.exceptions.RequestException as e:
            logger.error("Network error during MSG91 dispatch: %s", str(e))
            return False, "Temporary delivery error: Unable to reach SMS provider. Please try again later."
        except Exception as e:
            logger.error("Exception during MSG91 dispatch: %s", str(e))
            return False, "Temporary delivery error: An unexpected error occurred while sending SMS."


class SMSService:
    """
    Orchestrates real SMS OTP dispatch.
    Enforces that if no SMS provider is configured, the application explicitly
    reports that SMS verification is not configured rather than pretending it was sent.
    """

    @classmethod
    def get_provider(cls) -> BaseSMSProvider:
        # Defaults to MSG91 Provider
        return MSG91Provider()

    @classmethod
    def is_sms_configured(cls) -> bool:
        provider = cls.get_provider()
        return provider.is_configured()

    @classmethod
    def send_otp(cls, phone_e164: str, raw_otp: str) -> tuple[bool, str]:
        # Validate phone strictly before making any request
        from .phone_utils import validate_and_normalize_indian_phone
        is_valid, normalized, err = validate_and_normalize_indian_phone(phone_e164)
        if not is_valid:
            return False, err or "Enter a valid 10-digit Indian mobile number."

        provider = cls.get_provider()
        if not provider.is_configured():
            # Check if explicit dev sandbox logging is enabled for automated testing / demonstration
            sandbox_mode = (os.getenv("SMS_SANDBOX_MODE", "false").lower() == "true") or getattr(settings, 'SMS_SANDBOX_MODE', False)
            if sandbox_mode:
                logger.warning(
                    "[SANDBOX OTP] SMS provider not configured, but SMS_SANDBOX_MODE is enabled. "
                    "For test phone %s, OTP generated.",
                    normalized
                )
                return True, "SMS sandbox simulation active (SMS provider credentials not set in production)."

            return False, "SMS provider is not configured. Real SMS OTP dispatch requires MSG91_AUTH_KEY in environment variables."

        return provider.send_otp(normalized, raw_otp)
