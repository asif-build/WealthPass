"""
Layer A & Layer E: Deterministic keyword rules and regex field extraction.
Zero-FLOP, ultra-fast deterministic classifier and extractor.
"""
import re
from typing import Optional, Tuple, Dict, Any
from .schemas import (
    DocumentCategory, BankStatementFields, InsurancePolicyFields,
    EPFDocumentFields, MutualFundCASFields, SecuritiesCertificateFields,
    UnknownDocumentFields, CategoryFieldsUnion
)
from .ocr_utils import extract_ifsc, extract_uan, extract_pan, extract_amount_inr, mask_identifier


# Unambiguous statutory anchors
STATUTORY_SIGNALS = {
    DocumentCategory.EPF_DOCUMENT: [
        r"\b(?:EMPLOYEES'?\s+PROVIDENT\s+FUND|EPFO|UAN|UNIVERSAL\s+ACCOUNT\s+NUMBER|MEMBER\s+PASSBOOK)\b",
        r"\b(?:PENSION\s+FUND|EPS\s+CONTRIBUTION|MEMBER\s+ID)\b"
    ],
    DocumentCategory.MUTUAL_FUND_CAS_STATEMENT: [
        r"\b(?:CONSOLIDATED\s+ACCOUNT\s+STATEMENT|CAS|MUTUAL\s+FUND|FUND\s+HOUSE|NAV\s+DATE|UNITS\s+HELD)\b",
        r"\b(?:CAMS|KFINTECH|FOLIO\s+NUMBER|DIRECT\s+PLAN\s+GROWTH)\b"
    ],
    DocumentCategory.SHARE_CERTIFICATE_OR_SECURITIES_STATEMENT: [
        r"\b(?:SHARE\s+CERTIFICATE|EQUITY\s+SHARES|DISTINCTIVE\s+NUMBERS?|CERTIFICATE\s+NO|ISIN:\s*INE)\b",
        r"\b(?:FACE\s+VALUE\s+RS|REGISTERED\s+HOLDER|COMMON\s+SEAL)\b"
    ],
    DocumentCategory.INSURANCE_OR_LIC_POLICY: [
        r"\b(?:LIFE\s+ASSURANCE|SUM\s+ASSURED|POLICY\s+SCHEDULE|LIFE\s+ASSURED|POLICY\s+TERM|PREMIUM\s+PAYING)\b",
        r"\b(?:LIC\s+OF\s+INDIA|LIFE\s+INSURANCE|NOMINEE\s+DETAILS?|COMMENCEMENT\s+DATE)\b"
    ],
    DocumentCategory.BANK_PASSBOOK_OR_STATEMENT: [
        r"\b(?:SAVINGS\s+BANK|CURRENT\s+ACCOUNT|PASSBOOK|STATEMENT\s+PERIOD|IFSC\s+CODE|CLOSING\s+BALANCE)\b",
        r"\b(?:DEBIT\s+\(RS\)|CREDIT\s+\(RS\)|ATM\s+CASH\s+WDL|BY\s+SALARY\s+NEFT)\b"
    ],
    DocumentCategory.UNKNOWN_OR_OTHER: [
        r"\b(?:ELECTRICITY\s+CONSUMPTION|PROPERTY\s+TAX|TENANCY\s+AGREEMENT|DISCHARGE\s+SUMMARY|BACHELOR\s+OF\s+COMMERCE)\b",
        r"\b(?:HOSPITAL|PATIENT|PRESCRIPTION|UNIVERSITY|MCD-SZ)\b"
    ]
}


def evaluate_deterministic_rules(text: str) -> Tuple[Optional[DocumentCategory], float, Dict[str, int]]:
    """
    Evaluates exact keyword anchors.
    Returns (category, confidence, hit_scores).
    If unambiguous and meets statutory threshold, returns high confidence (0.95+).
    If ambiguous or tied, returns (None, 0.0, hit_scores) to trigger Layer B or C.
    """
    if not text:
        return (DocumentCategory.UNKNOWN_OR_OTHER, 1.0, {})

    text_upper = text.upper()
    scores: Dict[DocumentCategory, int] = {}

    for cat, patterns in STATUTORY_SIGNALS.items():
        score = 0
        for pat in patterns:
            matches = len(re.findall(pat, text_upper))
            score += matches * 2
        scores[cat] = score

    # Check for specific strong anchors
    if extract_uan(text) and "EPF" in text_upper:
        scores[DocumentCategory.EPF_DOCUMENT] += 10

    if extract_ifsc(text) and ("ACCOUNT NUMBER" in text_upper or "CLOSING BALANCE" in text_upper or "PASSBOOK" in text_upper):
        scores[DocumentCategory.BANK_PASSBOOK_OR_STATEMENT] += 8

    if "SHARE CERTIFICATE" in text_upper and "DISTINCTIVE" in text_upper:
        scores[DocumentCategory.SHARE_CERTIFICATE_OR_SECURITIES_STATEMENT] += 10

    if "SUM ASSURED" in text_upper and "POLICY" in text_upper:
        scores[DocumentCategory.INSURANCE_OR_LIC_POLICY] += 10

    if "CONSOLIDATED ACCOUNT STATEMENT" in text_upper or ("FOLIO" in text_upper and "MUTUAL FUND" in text_upper):
        scores[DocumentCategory.MUTUAL_FUND_CAS_STATEMENT] += 10

    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    top_cat, top_score = sorted_scores[0]
    second_cat, second_score = sorted_scores[1]

    # Strong unambiguous rule match
    if top_score >= 6 and (top_score - second_score) >= 4:
        confidence = min(0.98, 0.90 + (top_score * 0.01))
        return (top_cat, confidence, {c.value: s for c, s in scores.items()})

    # Crossover / ambiguous case
    return (None, 0.0, {c.value: s for c, s in scores.items()})


# =====================================================================
# LAYER E: DETERMINISTIC REGEX FIELD EXTRACTORS
# =====================================================================

def extract_bank_fields(text: str) -> BankStatementFields:
    holder_m = re.search(r'(?:Account\s+Holder|Name)[:\s]*([A-Za-z\s\.]+)(?:\n|$)', text, re.I)
    bank_m = re.search(r'([A-Za-z\s]+(?:BANK|LIMITED|COOPERATIVE))', text, re.I)
    acc_m = re.search(r'(?:Account\s+Number|A/c\s+No)[:\s]*([A-Za-z0-9X\-]+)', text, re.I)
    period_m = re.search(r'(?:Statement\s+Period)[:\s]*([A-Za-z0-9\s\-]+to[A-Za-z0-9\s\-]+)', text, re.I)
    
    closing_bal = extract_amount_inr(text, ["Closing Balance", "Total Balance", "Balance as on"])
    ifsc = extract_ifsc(text)

    return BankStatementFields(
        account_holder_name=holder_m.group(1).strip() if holder_m else None,
        bank_name=bank_m.group(1).strip() if bank_m else None,
        account_number_masked=mask_identifier(acc_m.group(1).strip()) if acc_m else None,
        ifsc_code=ifsc,
        statement_period=period_m.group(1).strip() if period_m else None,
        closing_balance=closing_bal
    )


def extract_insurance_fields(text: str) -> InsurancePolicyFields:
    holder_m = re.search(r'(?:Life\s+Assured|Policyholder|Insured)[:\s]*([A-Za-z\s\.]+)(?:\n|$)', text, re.I)
    insurer_m = re.search(r'([A-Za-z\s]+(?:INSURANCE|ASSURANCE|LIC))', text, re.I)
    pol_m = re.search(r'(?:Policy\s+Number|Policy\s+No)[:\s]*([A-Za-z0-9\-]+)', text, re.I)
    nominee_m = re.search(r'(?:Registered\s+Nominee|Nominee)[:\s]*([A-Za-z\s\.]+)(?:\(|\n|$)', text, re.I)
    sum_ass = extract_amount_inr(text, ["Sum Assured", "Guaranteed Sum"])

    nom_str = nominee_m.group(1).strip() if nominee_m else None
    if nom_str and "NOT REGISTERED" in nom_str.upper():
        nom_str = None

    status_str = "IN FORCE / PREMIUM PAID" if "IN FORCE" in text.upper() or "PREMIUM PAID" in text.upper() else None

    return InsurancePolicyFields(
        policyholder_name=holder_m.group(1).strip() if holder_m else None,
        insurer_name=insurer_m.group(1).strip() if insurer_m else None,
        policy_number=pol_m.group(1).strip() if pol_m else None,
        sum_assured=sum_ass,
        nominee_name=nom_str,
        premium_status=status_str
    )


def extract_epf_fields(text: str) -> EPFDocumentFields:
    member_m = re.search(r'(?:Member\s+Name)[:\s]*([A-Za-z\s\.]+)(?:\n|$)', text, re.I)
    est_m = re.search(r'(?:Establishment)[:\s]*([A-Za-z0-9\s\.\-]+)(?:\n|$)', text, re.I)
    pf_m = re.search(r'(?:Member\s+ID\s*/\s*PF\s+Account|PF\s+Account)[:\s]*([A-Za-z0-9/\-]+)', text, re.I)
    uan = extract_uan(text)
    bal = extract_amount_inr(text, ["Total Balance", "Closing Balance", "Total Balance as on Date"])

    return EPFDocumentFields(
        member_name=member_m.group(1).strip() if member_m else None,
        uan=uan,
        pf_account_number=pf_m.group(1).strip() if pf_m else None,
        establishment_name=est_m.group(1).strip() if est_m else None,
        total_balance=bal
    )


def extract_mutual_fund_fields(text: str) -> MutualFundCASFields:
    investor_m = re.search(r'(?:Primary\s+Investor|Investor|Unit\s+Holder)[:\s]*([A-Za-z\s\.]+)(?:\n|$)', text, re.I)
    amc_m = re.search(r'(?:Fund\s+House|AMC)[:\s]*([A-Za-z\s\.]+)(?:\n|$)', text, re.I)
    folio_m = re.search(r'(?:Folio\s+Number|Folio\s+No)[:\s]*([A-Za-z0-9/\-]+)', text, re.I)
    scheme_m = re.search(r'(?:Scheme)[:\s]*([A-Za-z0-9\s\-\.]+)(?:\n|$)', text, re.I)
    pan = extract_pan(text)
    curr_val = extract_amount_inr(text, ["Current Value", "Total Valuation", "Valuation"])

    return MutualFundCASFields(
        investor_name=investor_m.group(1).strip() if investor_m else None,
        amc_name=amc_m.group(1).strip() if amc_m else None,
        folio_number=folio_m.group(1).strip() if folio_m else None,
        scheme_name=scheme_m.group(1).strip() if scheme_m else None,
        pan_masked=mask_identifier(pan, keep_last=2) if pan else None,
        current_value=curr_val
    )


def extract_securities_fields(text: str) -> SecuritiesCertificateFields:
    holder_m = re.search(r'(?:Name\s+of\s+Holder|Registered\s+Holder)[:\s]*([A-Za-z\s\.]+)(?:\n|$)', text, re.I)
    company_m = re.search(r'^([A-Z\s]+(?:LIMITED|LTD\.?))', text, re.M)
    cert_m = re.search(r'(?:Certificate\s+No\.?|Certificate\s+Number)[:\s]*([A-Za-z0-9\-]+)', text, re.I)
    folio_m = re.search(r'(?:Folio\s+No\.?|Folio\s+Number)[:\s]*([A-Za-z0-9\-]+)', text, re.I)
    dist_m = re.search(r'(?:Distinctive\s+Numbers?)[:\s]*([0-9\s\-TOto]+)(?:\n|$)', text, re.I)
    shares_m = re.search(r'(?:Number\s+of\s+Shares)[:\s]*([0-9]+)', text, re.I)

    shares_val = int(shares_m.group(1)) if shares_m else None

    return SecuritiesCertificateFields(
        holder_name=holder_m.group(1).strip() if holder_m else None,
        company_name=company_m.group(1).strip() if company_m else None,
        folio_number_or_dpid=folio_m.group(1).strip() if folio_m else None,
        certificate_no=cert_m.group(1).strip() if cert_m else None,
        distinctive_nos_range=dist_m.group(1).strip() if dist_m else None,
        number_of_shares=shares_val
    )


def extract_fields_by_category(category: DocumentCategory, text: str) -> CategoryFieldsUnion:
    """Dispatches to the appropriate deterministic field extractor."""
    if category == DocumentCategory.BANK_PASSBOOK_OR_STATEMENT:
        return extract_bank_fields(text)
    elif category == DocumentCategory.INSURANCE_OR_LIC_POLICY:
        return extract_insurance_fields(text)
    elif category == DocumentCategory.EPF_DOCUMENT:
        return extract_epf_fields(text)
    elif category == DocumentCategory.MUTUAL_FUND_CAS_STATEMENT:
        return extract_mutual_fund_fields(text)
    elif category == DocumentCategory.SHARE_CERTIFICATE_OR_SECURITIES_STATEMENT:
        return extract_securities_fields(text)
    else:
        return UnknownDocumentFields(
            summary="Non-financial or unrecognized document",
            detected_keywords=[],
            reason="No financial statutory anchors detected"
        )
