import requests
from django.conf import settings


# ============================================================
# SETU ACCOUNT AGGREGATOR CONFIGURATION
# ============================================================

SETU_AUTH_URL = "https://accountservice.setu.co/v1/users/login"

# Sandbox environment
SETU_BASE_URL = "https://fiu-sandbox.setu.co"


# ============================================================
# HELPER: GET ACCESS TOKEN
# ============================================================

def get_access_token():
    """
    Generate an access token using Setu Client ID and Secret.
    """

    response = requests.post(
        SETU_AUTH_URL,
        headers={
            "client": "bridge",
            "Content-Type": "application/json",
        },
        json={
            "clientID": settings.SETU_CLIENT_ID,
            "secret": settings.SETU_CLIENT_SECRET,
            "grant_type": "client_credentials",
        },
        timeout=20,
    )

    response.raise_for_status()

    data = response.json()

    if "access_token" not in data:
        raise RuntimeError(
            f"Setu authentication succeeded but no access_token "
            f"was returned: {data}"
        )

    return data["access_token"]


# ============================================================
# HELPER: COMMON HEADERS
# ============================================================

def _headers(access_token):
    """
    Headers required by Setu AA APIs.
    """

    return {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "x-product-instance-id": settings.SETU_PRODUCT_INSTANCE_ID,
    }


# ============================================================
# HELPER: NORMALIZE MOBILE NUMBER
# ============================================================

def _normalize_mobile(mobile_number):
    """
    Convert an Indian mobile number into a 10-digit number.
    """

    mobile = str(mobile_number).strip()

    if mobile.startswith("+91"):
        mobile = mobile[3:]

    if mobile.startswith("91") and len(mobile) == 12:
        mobile = mobile[2:]

    return mobile


# ============================================================
# ACCOUNT AVAILABILITY
# ============================================================

def check_account_availability(mobile_number):
    """
    Check whether the customer's mobile number has accounts
    available through Setu's Account Aggregator network.
    """

    token = get_access_token()

    mobile = _normalize_mobile(mobile_number)

    response = requests.post(
        f"{SETU_BASE_URL}/v2/account-availability",
        headers=_headers(token),
        json={
            "mobileNumber": mobile
        },
        timeout=20,
    )

    print("====================================")
    print("SETU ACCOUNT AVAILABILITY STATUS:", response.status_code)
    print("SETU ACCOUNT AVAILABILITY RESPONSE:", response.text)
    print("====================================")

    response.raise_for_status()

    return response.json()


# ============================================================
# CREATE CONSENT
# ============================================================

def create_consent(mobile_number):
    """
    Create a Setu Account Aggregator consent request.

    Returns:
        Setu response containing consent ID, URL and status.
    """

    token = get_access_token()

    mobile = _normalize_mobile(mobile_number)

    payload = {
        "consentDuration": {
            "unit": "MONTH",
            "value": 1
        },

        "vua": f"{mobile}@dashboard-aa-preprod" if mobile == "9876543210" else mobile,

        "consentMode": "VIEW",

        "fetchType": "ONETIME",

        "consentTypes": [
            "PROFILE",
            "SUMMARY",
            "TRANSACTIONS"
        ],

        "fiTypes": [
            "DEPOSIT"
        ],

        "purpose": {
            "category": {
                "type": "Wealth Management"
            },
            "code": "103",
            "text": "Wealth and asset discovery",
            "refUri": "https://api.rebit.org.in/aa/purpose/103.xml"
        },

        "dataRange": {
            "from": "2025-01-01T00:00:00Z",
            "to": "2026-08-16T23:59:59Z"
        },

        "dataLife": {
            "unit": "MONTH",
            "value": 1
        },

        "frequency": {
            "unit": "DAY",
            "value": 1
        },

        "redirectUrl": (
            "https://afflicted-haven-anything.ngrok-free.dev/"
            "setu-callback/"
        ),

        "context": [],
        "additionalParams": {}
    }

    print("====================================")
    print("SETU CONSENT PAYLOAD:")
    print(payload)
    print("====================================")

    response = requests.post(
        f"{SETU_BASE_URL}/v2/consents",
        headers=_headers(token),
        json=payload,
        timeout=20,
    )

    print("====================================")
    print("SETU STATUS:", response.status_code)
    print("SETU RESPONSE:", response.text)
    print("====================================")

    if not response.ok:
        raise RuntimeError(
            f"Setu API error {response.status_code}: "
            f"{response.text}"
        )

    return response.json()


# ============================================================
# GET CONSENT STATUS
# ============================================================

def get_consent(consent_id):
    """
    Get the current status/details of a consent request.
    """

    token = get_access_token()

    response = requests.get(
        f"{SETU_BASE_URL}/v2/consents/{consent_id}",
        headers=_headers(token),
        timeout=20,
    )

    print("====================================")
    print("SETU CONSENT STATUS:", response.status_code)
    print("SETU CONSENT RESPONSE:", response.text)
    print("====================================")

    response.raise_for_status()

    return response.json()


# ============================================================
# CREATE DATA SESSION
# ============================================================

def create_data_session(consent_id, data_from=None, data_to=None):
    """
    Create a data session after the consent has been approved.
    """

    token = get_access_token()

    if data_from is None:
        data_from = "2025-01-01T00:00:00Z"

    if data_to is None:
        data_to = "2026-08-16T23:59:59Z"

    payload = {
        "consentId": consent_id,

        "dataRange": {
            "from": data_from,
            "to": data_to,
        },

        "format": "json",
    }

    response = requests.post(
        f"{SETU_BASE_URL}/sessions",
        headers=_headers(token),
        json=payload,
        timeout=20,
    )

    print("====================================")
    print("SETU DATA SESSION STATUS:", response.status_code)
    print("SETU DATA SESSION RESPONSE:", response.text)
    print("====================================")

    response.raise_for_status()

    return response.json()


# ============================================================
# FETCH FI DATA
# ============================================================

def fetch_fi_data(data_session_id):
    """
    Fetch financial information for a completed/partial
    data session.
    """

    token = get_access_token()

    response = requests.get(
        f"{SETU_BASE_URL}/sessions/{data_session_id}",
        headers=_headers(token),
        timeout=30,
    )

    print("====================================")
    print("SETU FI DATA STATUS:", response.status_code)
    print("SETU FI DATA RESPONSE:", response.text)
    print("====================================")

    response.raise_for_status()

    return response.json()


# ============================================================
# GET DATA SESSIONS FOR A CONSENT
# ============================================================

def get_data_sessions(consent_id):
    """
    Get data sessions associated with a consent.
    """

    token = get_access_token()

    response = requests.get(
        f"{SETU_BASE_URL}/v2/consents/{consent_id}/data-sessions",
        headers=_headers(token),
        timeout=20,
    )

    print("====================================")
    print("SETU DATA SESSIONS STATUS:", response.status_code)
    print("SETU DATA SESSIONS RESPONSE:", response.text)
    print("====================================")

    response.raise_for_status()

    return response.json()


# ============================================================
# GET LAST FETCH STATUS
# ============================================================

def get_last_fetch_status(consent_id):
    """
    Get the latest fetch status for a consent.
    """

    token = get_access_token()

    response = requests.get(
        f"{SETU_BASE_URL}/v2/consents/{consent_id}/fetch/status",
        headers=_headers(token),
        timeout=20,
    )

    print("====================================")
    print("SETU FETCH STATUS:", response.status_code)
    print("SETU FETCH RESPONSE:", response.text)
    print("====================================")

    response.raise_for_status()

    return response.json()