import re
from typing import Tuple, Optional


def validate_and_normalize_indian_phone(phone: Optional[str]) -> Tuple[bool, str, Optional[str]]:
    """
    Validates and normalizes an Indian mobile phone number into E.164 format (+91XXXXXXXXXX).
    
    Accepts:
      - 10-digit mobile numbers: '9876543210'
      - +91-prefixed numbers: '+919876543210', '+91 98765-43210'
      - 91-prefixed numbers: '919876543210'
      - 0-prefixed trunk numbers: '09876543210'
      - Optional formatting: spaces, hyphens, parentheses, dots
      
    Rejects:
      - Non-numeric input (letters, invalid characters)
      - Numbers with fewer than 10 national digits
      - Numbers with more than 10 national digits (excessively long numbers)
      - Numbers where the national 10-digit number does not start with valid Indian mobile digits (6, 7, 8, 9)
      
    Returns:
      (is_valid, normalized_e164, error_message)
      - If valid: (True, '+91XXXXXXXXXX', None)
      - If invalid: (False, '', 'Enter a valid 10-digit Indian mobile number.')
    """
    error_msg = "Enter a valid 10-digit Indian mobile number."

    if not phone or not isinstance(phone, str):
        return False, "", error_msg

    trimmed = phone.strip()
    if not trimmed:
        return False, "", error_msg

    # Reject if contains letters or unsupported characters
    if re.search(r'[^\d+\-\s().]', trimmed):
        return False, "", error_msg

    # Remove allowed formatting punctuation
    cleaned = re.sub(r'[\s\-.()]', '', trimmed)

    # Extract national 10-digit number
    national_number = ""
    if cleaned.startswith('+91'):
        national_number = cleaned[3:]
    elif cleaned.startswith('+'):
        # Non-+91 country code is rejected for Indian mobile numbers
        return False, "", error_msg
    elif cleaned.startswith('91') and len(cleaned) == 12:
        national_number = cleaned[2:]
    elif cleaned.startswith('0') and len(cleaned) == 11:
        national_number = cleaned[1:]
    elif len(cleaned) == 10:
        national_number = cleaned
    else:
        # Fewer or more than 10 digits
        return False, "", error_msg

    # Indian mobile numbers must be exactly 10 digits and start with 6, 7, 8, or 9
    if not re.match(r'^[6-9]\d{9}$', national_number):
        return False, "", error_msg

    return True, f"+91{national_number}", None
