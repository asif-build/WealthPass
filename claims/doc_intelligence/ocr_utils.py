"""
OCR preprocessing, noise modeling, and deterministic regex extractors.
"""
import re
import hashlib
from typing import Optional, List, Tuple
from decimal import Decimal, InvalidOperation


def clean_text(raw_text: str) -> str:
    """Standardize whitespace and remove unprintable control characters."""
    if not raw_text:
        return ""
    # Normalize unicode spaces and remove control characters
    text = re.sub(r'[\r\f\v]', '\n', raw_text)
    text = re.sub(r'[^\S\n]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def compute_sha256(text: str) -> str:
    """Compute deterministic SHA-256 hash of cleaned text."""
    normalized = clean_text(text).lower().encode('utf-8')
    return hashlib.sha256(normalized).hexdigest()


def extract_ifsc(text: str) -> Optional[str]:
    """Extract valid Indian Financial System Code (IFSC). Format: 4 letters, 0, 6 alphanumeric."""
    match = re.search(r'\b([A-Z]{4}0[A-Z0-9]{6})\b', text.upper())
    return match.group(1) if match else None


def extract_uan(text: str) -> Optional[str]:
    """Extract 12-digit Universal Account Number (EPF UAN)."""
    # Look for keyword context or isolated 12 digit number
    match = re.search(r'(?:UAN|UNIVERSAL\s+ACCOUNT\s+NO|MEMBER\s+ID)[:\s\-]*([0-9]{12})\b', text, re.IGNORECASE)
    if match:
        return match.group(1)
    # Fallback to standalone 12-digit sequence
    match_fallback = re.search(r'\b([1-9][0-9]{11})\b', text)
    return match_fallback.group(1) if match_fallback else None


def extract_pan(text: str) -> Optional[str]:
    """Extract 10-character Permanent Account Number (PAN). Format: 5 letters, 4 digits, 1 letter."""
    match = re.search(r'\b([A-Z]{5}[0-9]{4}[A-Z])\b', text.upper())
    return match.group(1) if match else None


def mask_identifier(val: Optional[str], keep_last: int = 4) -> Optional[str]:
    """Mask sensitive identifier (e.g. account number or PAN)."""
    if not val:
        return None
    val_clean = val.strip()
    if len(val_clean) <= keep_last:
        return val_clean
    masked_part = "X" * (len(val_clean) - keep_last)
    return f"{masked_part}{val_clean[-keep_last:]}"


def extract_amount_inr(text: str, context_keywords: Optional[List[str]] = None) -> Optional[Decimal]:
    """
    Extract monetary amount in INR from text.
    Handles Indian numbering comma format (e.g. 1,50,000.00 or 150000).
    Never invents values.
    """
    if not text:
        return None

    # Common patterns: ₹ 1,50,000.00 | Rs. 45,000 | INR 2,00,000 | Balance: 15,400.50
    patterns = []
    if context_keywords:
        kw_re = "|".join([re.escape(k) for k in context_keywords])
        patterns.append(rf'(?:{kw_re})[:\s]*(?:₹|Rs\.?|INR)?\s*([0-9]{{1,3}}(?:,[0-9]{{2,3}})*(?:\.[0-9]{{1,2}})?|[0-9]+(?:\.[0-9]{{1,2}})?)\b')

    patterns.extend([
        r'(?:Total\s+Balance|Closing\s+Balance|Sum\s+Assured|Current\s+Value|Net\s+Amount|Total)[:\s]*(?:₹|Rs\.?|INR)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\b',
        r'(?:₹|Rs\.?|INR)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\b'
    ])

    for pat in patterns:
        match = re.search(pat, text, re.IGNORECASE)
        if match:
            raw_val = match.group(1).replace(",", "").strip()
            try:
                dec = Decimal(raw_val)
                if dec > 0:
                    return dec
            except InvalidOperation:
                continue

    return None


def add_synthetic_ocr_noise(text: str, noise_level: float = 0.08, seed: int = 42) -> str:
    """
    Adds realistic OCR noise:
    - Character confusions ('O' <-> '0', 'I' <-> '1', 'S' <-> '5', 'B' <-> '8', 'vv' <-> 'w')
    - Dropped characters
    - Punctuation jitter
    """
    import random
    rng = random.Random(seed)
    
    substitutions = {
        'O': '0', '0': 'O',
        'I': '1', '1': 'I', 'l': '1',
        'S': '5', '5': 'S',
        'B': '8', '8': 'B',
        'Z': '2', '2': 'Z',
        'G': '6', '6': 'G',
        'rn': 'm', 'm': 'rn',
        'c': 'o', 'o': 'c'
    }

    chars = list(text)
    n = len(chars)
    num_errors = int(n * noise_level)

    for _ in range(num_errors):
        idx = rng.randint(0, n - 1)
        orig = chars[idx]
        if orig in substitutions and rng.random() < 0.7:
            chars[idx] = substitutions[orig]
        elif orig.isalnum() and rng.random() < 0.2:
            # Random character speckle
            chars[idx] = rng.choice(['.', ',', "'", '-', '~'])

    return "".join(chars)
