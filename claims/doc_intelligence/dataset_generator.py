"""
Synthetic Financial Document Dataset Generator.
Generates 240 realistic, synthetic Indian financial documents across 6 categories.
Includes clean text, noisy OCR variants, missing fields, confusing crossover layouts,
and non-financial unknown documents. Ground truth is strictly isolated.
"""
import os
import json
import random
from typing import List, Dict, Any
from .schemas import DocumentCategory
from .ocr_utils import add_synthetic_ocr_noise


INDIAN_BANKS = [
    ("State Bank of India", "SBIN0001234"),
    ("Punjab National Bank", "PUNB0123400"),
    ("Bank of Baroda", "BARB0VISHAL"),
    ("HDFC Bank Ltd", "HDFC0000128"),
    ("ICICI Bank Ltd", "ICIC0000001"),
    ("Canara Bank", "CNRB0002540"),
    ("Axis Bank", "UTIB0000010"),
    ("Union Bank of India", "UBIN0532100"),
]

INDIAN_INSURERS = [
    ("Life Insurance Corporation of India (LIC)", "012"),
    ("HDFC Life Insurance Co Ltd", "101"),
    ("ICICI Prudential Life Insurance", "105"),
    ("SBI Life Insurance Co Ltd", "111"),
    ("Max Life Insurance Co Ltd", "104"),
    ("Bajaj Allianz Life Insurance", "116"),
    ("Tata AIA Life Insurance", "110"),
]

MUTUAL_FUNDS = [
    ("HDFC Mutual Fund", "HDFC Asset Management Company Ltd"),
    ("SBI Mutual Fund", "SBI Funds Management Ltd"),
    ("ICICI Prudential Mutual Fund", "ICICI Prudential AMC"),
    ("Nippon India Mutual Fund", "Nippon Life India Asset Management"),
    ("Kotak Mahindra Mutual Fund", "Kotak Mahindra Asset Management"),
    ("Axis Mutual Fund", "Axis Asset Management Company Ltd"),
]

COMPANIES_LISTED = [
    ("Tata Consultancy Services Limited", "INE467B01029"),
    ("Reliance Industries Limited", "INE002A01018"),
    ("Infosys Limited", "INE009A01021"),
    ("ITC Limited", "INE154A01025"),
    ("Hindustan Unilever Limited", "INE030A01027"),
    ("Larsen & Toubro Limited", "INE018A01030"),
    ("Steel Authority of India Limited", "INE114A01011"),
]

SAMPLE_NAMES = [
    "Rajesh Kumar Sharma", "Sunita Devi Verma", "Amitabh Sen Gupta",
    "Priya Venkatesh Iyer", "Mohammed Farhan Khan", "Gurpreet Singh Gill",
    "Ananya Mukhopadhyay", "Deepak Narayan Patil", "Kavita Raghunath Joshi",
    "Suresh Babu Reddy", "Meenakshi Sundaram", "Vikramaditya Chauhan",
    "Pooja Mahesh Kulkarni", "Harish Chandra Agarwal", "Nandini Swaminathan"
]

ESTABLISHMENTS_EPF = [
    ("INFOSYS TECHNOLOGIES PVT LTD", "BHPUN0012345"),
    ("TATA MOTORS LIMITED ENGINEERING DIV", "MHBAN0098765"),
    ("BHARAT HEAVY ELECTRICALS LTD", "DLCPM0045678"),
    ("WIPRO ENTERPRISES LIMITED", "KABAN0033221"),
    ("RELIANCE JIO INFOCOMM LTD", "MHMMB0077889")
]


def generate_bank_document(doc_id: int, variant: str, rng: random.Random) -> Dict[str, Any]:
    bank, ifsc = rng.choice(INDIAN_BANKS)
    name = rng.choice(SAMPLE_NAMES)
    acc_num = str(rng.randint(10000000000, 99999999999))
    masked_acc = f"XXXXXX{acc_num[-4:]}"
    has_balance = variant != "missing_field"
    bal_val = rng.randint(5000, 480000) if has_balance else None
    
    # Text template
    text_lines = [
        f"{bank.upper()}",
        f"Branch: Connaught Place, New Delhi | IFSC Code: {ifsc}",
        f"Account Type: Savings Bank Account",
        f"Account Holder: {name}",
        f"Account Number: {masked_acc}",
        f"Statement Period: 01-Apr-2025 to 30-Sep-2025",
        "----------------------------------------------------------------",
        "Date        Particulars                  Debit (Rs)  Credit (Rs)  Balance (Rs)",
        f"05/04/2025  TRF UPI/Swiggy/Order         450.00                   {rng.randint(20000, 50000)}.00",
        f"12/05/2025  BY SALARY NEFT CR                        85,000.00   {rng.randint(80000, 150000)}.00",
        f"28/08/2025  ATM CASH WDL                 5,000.00                 {rng.randint(60000, 110000)}.00",
    ]
    if variant == "crossover":
        text_lines.append("15/09/2025  ACH DEBIT HDFC MUTUAL FUND SIP  5,000.00")
        text_lines.append("18/09/2025  ACH DEBIT LIC PREMIUM NACH     3,200.00")

    if has_balance:
        text_lines.append("----------------------------------------------------------------")
        text_lines.append(f"Closing Balance as on 30-Sep-2025: Rs. {bal_val:,.2f}")
    else:
        text_lines.append("----------------------------------------------------------------")
        text_lines.append("End of Page 1. Continued on next statement cycle...")

    raw_text = "\n".join(text_lines)
    if variant == "noisy_ocr":
        raw_text = add_synthetic_ocr_noise(raw_text, noise_level=0.07, seed=doc_id)

    ground_truth_fields = {
        "account_holder_name": name,
        "bank_name": bank,
        "account_number_masked": masked_acc,
        "ifsc_code": ifsc,
        "statement_period": "01-Apr-2025 to 30-Sep-2025",
        "closing_balance": str(bal_val) if has_balance else None
    }
    return {
        "id": f"BANK_{doc_id:03d}",
        "category": DocumentCategory.BANK_PASSBOOK_OR_STATEMENT.value,
        "variant": variant,
        "text": raw_text,
        "ground_truth_fields": ground_truth_fields
    }


def generate_insurance_document(doc_id: int, variant: str, rng: random.Random) -> Dict[str, Any]:
    insurer, _ = rng.choice(INDIAN_INSURERS)
    name = rng.choice(SAMPLE_NAMES)
    nominee = rng.choice([n for n in SAMPLE_NAMES if n != name])
    pol_num = f"POL-{rng.randint(100000000, 999999999)}"
    has_nominee = variant != "missing_field"
    has_sum = True
    sum_val = rng.choice([200000, 500000, 1000000, 2500000])

    text_lines = [
        f"{insurer.upper()}",
        "CERTIFICATE OF LIFE ASSURANCE / POLICY SCHEDULE",
        f"Policy Number: {pol_num}",
        f"Life Assured: {name}",
        f"Sum Assured: Rs. {sum_val:,.2f}",
        f"Policy Term: 20 Years | Premium Paying Term: 15 Years",
        "Premium Frequency: Annual | Status: IN FORCE / PREMIUM PAID",
        "Date of Commencement: 15/06/2018 | Maturity Date: 15/06/2038"
    ]
    if has_nominee:
        text_lines.append(f"Registered Nominee: {nominee} (Relationship: Spouse/Son)")
    else:
        text_lines.append("Nominee Details: NOT REGISTERED / PROBATE REQUIRED")

    if variant == "crossover":
        text_lines.append("Annuity Option: Fixed Monthly Pension Plan comparable to superannuation scheme")

    raw_text = "\n".join(text_lines)
    if variant == "noisy_ocr":
        raw_text = add_synthetic_ocr_noise(raw_text, noise_level=0.07, seed=doc_id)

    ground_truth_fields = {
        "policyholder_name": name,
        "insurer_name": insurer,
        "policy_number": pol_num,
        "sum_assured": str(sum_val) if has_sum else None,
        "nominee_name": nominee if has_nominee else None,
        "premium_status": "IN FORCE / PREMIUM PAID"
    }
    return {
        "id": f"INS_{doc_id:03d}",
        "category": DocumentCategory.INSURANCE_OR_LIC_POLICY.value,
        "variant": variant,
        "text": raw_text,
        "ground_truth_fields": ground_truth_fields
    }


def generate_epf_document(doc_id: int, variant: str, rng: random.Random) -> Dict[str, Any]:
    est_name, est_code = rng.choice(ESTABLISHMENTS_EPF)
    name = rng.choice(SAMPLE_NAMES)
    uan = str(rng.randint(100000000000, 999999999999))
    pf_no = f"{est_code}/{rng.randint(1000, 99999)}"
    has_bal = variant != "missing_field"
    bal_val = rng.randint(45000, 920000) if has_bal else None

    text_lines = [
        "EMPLOYEES' PROVIDENT FUND ORGANISATION, INDIA",
        "MEMBER EPF PASSBOOK / CONTRIBUTION STATEMENT",
        f"Universal Account Number (UAN): {uan}",
        f"Member ID / PF Account: {pf_no}",
        f"Member Name: {name}",
        f"Establishment: {est_name}",
        "Date of Joining EPF: 12/08/2016 | Date of Exit: Not Applicable",
        "----------------------------------------------------------------",
        "Year: 2024-2025 | Employee Share (EE) | Employer Share (ER) | Pension Fund (EPS)",
        "Opening Bal:     Rs. 1,45,200.00      Rs.  48,400.00      Rs. 32,100.00",
        "Contributions:   Rs.  36,000.00       Rs.  12,000.00      Rs. 24,000.00",
    ]
    if has_bal:
        text_lines.append(f"Total Balance as on Date: Rs. {bal_val:,.2f}")
    else:
        text_lines.append("Interest calculation under process by regional EPFO commissioner office.")

    if variant == "crossover":
        text_lines.append("Linked Bank Account for Settlement: State Bank of India IFSC SBIN0001234")

    raw_text = "\n".join(text_lines)
    if variant == "noisy_ocr":
        raw_text = add_synthetic_ocr_noise(raw_text, noise_level=0.07, seed=doc_id)

    ground_truth_fields = {
        "member_name": name,
        "uan": uan,
        "pf_account_number": pf_no,
        "establishment_name": est_name,
        "total_balance": str(bal_val) if has_bal else None
    }
    return {
        "id": f"EPF_{doc_id:03d}",
        "category": DocumentCategory.EPF_DOCUMENT.value,
        "variant": variant,
        "text": raw_text,
        "ground_truth_fields": ground_truth_fields
    }


def generate_mutual_fund_document(doc_id: int, variant: str, rng: random.Random) -> Dict[str, Any]:
    amc_brand, amc_full = rng.choice(MUTUAL_FUNDS)
    name = rng.choice(SAMPLE_NAMES)
    folio = f"{rng.randint(1000000, 9999999)}/{rng.randint(10, 99)}"
    pan = f"{''.join(rng.choices('ABCDEFGHJKLMNPQRSTUVWXYZ', k=5))}{rng.randint(1000, 9999)}{rng.choice('ABCDEFGHJKLMNPQRSTUVWXYZ')}"
    has_val = variant != "missing_field"
    val_amt = rng.randint(25000, 750000) if has_val else None

    text_lines = [
        f"CONSOLIDATED ACCOUNT STATEMENT (CAS) — {amc_brand.upper()}",
        "CAMS & KFINTECH REGISTRAR MUTUAL FUND STATEMENT",
        f"Primary Investor: {name}",
        f"PAN: {pan[:2]}XXXXX{pan[-2:]}",
        f"Folio Number: {folio}",
        f"Fund House: {amc_full}",
        "Scheme: Flexi Cap Fund - Direct Plan - Growth",
        "Holding Nature: Single | Nominee Status: Registered",
        "----------------------------------------------------------------",
        "Units Held: 1,420.584 | NAV Date: 12-Feb-2025 | NAV: Rs. 142.85",
    ]
    if has_val:
        text_lines.append(f"Current Value / Total Valuation: Rs. {val_amt:,.2f}")
    else:
        text_lines.append("Valuation pending updated closing NAV release.")

    if variant == "crossover":
        text_lines.append("Dividend Payout Mandate: Direct credit to bank passbook")

    raw_text = "\n".join(text_lines)
    if variant == "noisy_ocr":
        raw_text = add_synthetic_ocr_noise(raw_text, noise_level=0.07, seed=doc_id)

    ground_truth_fields = {
        "investor_name": name,
        "amc_name": amc_brand,
        "folio_number": folio,
        "scheme_name": "Flexi Cap Fund - Direct Plan - Growth",
        "pan_masked": f"{pan[:2]}XXXXX{pan[-2:]}",
        "current_value": str(val_amt) if has_val else None
    }
    return {
        "id": f"MF_{doc_id:03d}",
        "category": DocumentCategory.MUTUAL_FUND_CAS_STATEMENT.value,
        "variant": variant,
        "text": raw_text,
        "ground_truth_fields": ground_truth_fields
    }


def generate_securities_document(doc_id: int, variant: str, rng: random.Random) -> Dict[str, Any]:
    company, isin = rng.choice(COMPANIES_LISTED)
    name = rng.choice(SAMPLE_NAMES)
    cert_no = str(rng.randint(100000, 999999))
    folio_no = f"SHR{rng.randint(10000, 99999)}"
    shares_count = rng.choice([50, 100, 250, 500, 1000])
    start_d = rng.randint(1000000, 5000000)
    end_d = start_d + shares_count - 1
    dist_range = f"{start_d} TO {end_d}"

    text_lines = [
        f"{company.upper()}",
        "(Incorporated under the Companies Act, 1956)",
        f"ISIN: {isin} | Registered Office: Nariman Point, Mumbai",
        "----------------------------------------------------------------",
        "SHARE CERTIFICATE",
        "This is to certify that the person named hereunder is the Registered Holder of",
        f"Equity Shares of Face Value Rs. 10/- each in the Company.",
        f"Certificate No.: {cert_no} | Folio No.: {folio_no}",
        f"Name of Holder: {name}",
        f"Number of Shares: {shares_count}",
        f"Distinctive Numbers: {dist_range}",
        "Given under the Common Seal of the Company this 14th day of March, 2002."
    ]
    if variant == "missing_field":
        # Missing distinctive numbers
        text_lines = [line for line in text_lines if "Distinctive Numbers" not in line]
        dist_range = None

    if variant == "crossover":
        text_lines.append("Subject to unpaid dividend transfer provisions under Section 124 of Companies Act 2013.")

    raw_text = "\n".join(text_lines)
    if variant == "noisy_ocr":
        raw_text = add_synthetic_ocr_noise(raw_text, noise_level=0.07, seed=doc_id)

    ground_truth_fields = {
        "holder_name": name,
        "company_name": company,
        "folio_number_or_dpid": folio_no,
        "certificate_no": cert_no,
        "distinctive_nos_range": dist_range,
        "number_of_shares": shares_count
    }
    return {
        "id": f"SEC_{doc_id:03d}",
        "category": DocumentCategory.SHARE_CERTIFICATE_OR_SECURITIES_STATEMENT.value,
        "variant": variant,
        "text": raw_text,
        "ground_truth_fields": ground_truth_fields
    }


def generate_unknown_document(doc_id: int, variant: str, rng: random.Random) -> Dict[str, Any]:
    types = [
        ("ELECTRICITY_BILL", "BSES Yamuna Power Limited - Electricity Consumption Bill. Consumer CA No: 100234589. Units: 342 kWh. Bill Amount Due: Rs. 2,450.00. Payment due date: 15-Nov-2025."),
        ("PROPERTY_TAX", "Municipal Corporation of Delhi - Property Tax Assessment Notice. Property ID: MCD-SZ-8492. Ward 45. Paid Amount: Rs. 6,800. No financial assets or folios recorded."),
        ("RENT_AGREEMENT", "RESIDENTIAL TENANCY AGREEMENT. This Lease is made between Landlord Shri Ramesh Gupta and Tenant Vikram Malhotra. Monthly rent: Rs. 22,000. Security deposit held: Rs. 44,000."),
        ("HOSPITAL_DISCHARGE", "Max Super Speciality Hospital, Saket. Patient Discharge Summary. Diagnosis: Acute Bronchitis. Treating Physician: Dr. K. K. Sharma. Medicines prescribed upon discharge: Azithromycin 500mg."),
        ("ACADEMIC_DEGREE", "University of Delhi - Bachelor of Commerce (Honours). Awarded to Priya Sen with First Division in the year 2019. Controller of Examinations seal.")
    ]
    sub_type, text_content = types[doc_id % len(types)]
    raw_text = text_content
    if variant == "noisy_ocr":
        raw_text = add_synthetic_ocr_noise(raw_text, noise_level=0.08, seed=doc_id)

    return {
        "id": f"UNK_{doc_id:03d}",
        "category": DocumentCategory.UNKNOWN_OR_OTHER.value,
        "variant": variant,
        "text": raw_text,
        "ground_truth_fields": {
            "summary": sub_type,
            "detected_keywords": ["Bill" if "Bill" in raw_text else "Non-Financial"],
            "reason": f"Document is non-financial ({sub_type})"
        }
    }


def generate_dataset(total_per_category: int = 40, seed: int = 2026) -> List[Dict[str, Any]]:
    """
    Generates 240 synthetic documents (40 per category x 6 categories).
    Variants: 50% clean, 25% noisy_ocr, 15% missing_field, 10% crossover.
    """
    rng = random.Random(seed)
    dataset = []

    generators = [
        (generate_bank_document, DocumentCategory.BANK_PASSBOOK_OR_STATEMENT),
        (generate_insurance_document, DocumentCategory.INSURANCE_OR_LIC_POLICY),
        (generate_epf_document, DocumentCategory.EPF_DOCUMENT),
        (generate_mutual_fund_document, DocumentCategory.MUTUAL_FUND_CAS_STATEMENT),
        (generate_securities_document, DocumentCategory.SHARE_CERTIFICATE_OR_SECURITIES_STATEMENT),
        (generate_unknown_document, DocumentCategory.UNKNOWN_OR_OTHER)
    ]

    variants_pool = ["clean"] * 20 + ["noisy_ocr"] * 10 + ["missing_field"] * 6 + ["crossover"] * 4

    for gen_fn, cat in generators:
        shuffled_variants = list(variants_pool)
        rng.shuffle(shuffled_variants)
        for i in range(total_per_category):
            variant = shuffled_variants[i % len(shuffled_variants)]
            doc = gen_fn(doc_id=i + 1, variant=variant, rng=rng)
            dataset.append(doc)

    rng.shuffle(dataset)
    return dataset


def split_dataset(dataset: List[Dict[str, Any]], train_ratio: float = 0.6, val_ratio: float = 0.2) -> Dict[str, List[Dict[str, Any]]]:
    """
    Splits into train (60%), val (20%), and held-out test (20%).
    Stratified across categories.
    """
    by_category: Dict[str, List[Dict[str, Any]]] = {}
    for doc in dataset:
        by_category.setdefault(doc["category"], []).append(doc)

    splits: Dict[str, List[Dict[str, Any]]] = {"train": [], "val": [], "test": []}

    for cat, docs in by_category.items():
        n = len(docs)
        n_train = int(n * train_ratio)
        n_val = int(n * val_ratio)
        splits["train"].extend(docs[:n_train])
        splits["val"].extend(docs[n_train:n_train + n_val])
        splits["test"].extend(docs[n_train + n_val:])

    return splits


def save_dataset_to_disk(filepath: str) -> Dict[str, Any]:
    """Generates and saves the dataset with train/val/test splits to JSON."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    raw_dataset = generate_dataset(total_per_category=40, seed=2026)
    splits = split_dataset(raw_dataset, train_ratio=0.6, val_ratio=0.2)
    payload = {
        "metadata": {
            "total_documents": len(raw_dataset),
            "categories": [c.value for c in DocumentCategory],
            "split_counts": {k: len(v) for k, v in splits.items()},
            "seed": 2026,
            "version": "1.0.0"
        },
        "splits": splits
    }
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    return payload
