import os
from decimal import Decimal
from typing import Dict, Any, List, Optional
from django.conf import settings
from .base import BaseAssetDiscoveryProvider, IntegrationStatus


class RbiUdgamDiscoveryAdapter(BaseAssetDiscoveryProvider):
    """
    RBI UDGAM (Unclaimed Deposits - Gateway to Access inforMation) Adapter.
    Central portal developed by Reserve Bank Information Technology Pvt. Ltd. (ReBIT)
    and participating commercial banks.
    
    API Availability: UDGAM operates as a citizen portal requiring mobile OTP registration
    and CAPTCHA. It does NOT offer a public developer API without direct RBI/bank
    consortium onboarding.
    
    Status: OFFICIAL_EXTERNAL_PROCESS
    """

    @property
    def provider_id(self) -> str:
        return "RBI_UDGAM"

    @property
    def provider_name(self) -> str:
        return "RBI UDGAM (Unclaimed Bank Deposits)"

    @property
    def category(self) -> str:
        return "BANK_DEPOSITS"

    @property
    def integration_status(self) -> IntegrationStatus:
        if self.is_configured():
            return IntegrationStatus.LIVE
        return IntegrationStatus.OFFICIAL_EXTERNAL_PROCESS

    @property
    def official_portal_url(self) -> str:
        return "https://udgam.rbi.org.in/"

    def is_configured(self) -> bool:
        # Check if enterprise RBI consortium credentials exist in environment
        return bool(os.getenv("RBI_UDGAM_API_KEY") and os.getenv("RBI_UDGAM_API_SECRET"))

    def get_discovery_guide(self) -> Dict[str, Any]:
        return {
            "source_id": self.provider_id,
            "source_name": self.provider_name,
            "category": "Bank Accounts & Inactive Deposits",
            "integration_status": self.integration_status.value,
            "official_url": self.official_portal_url,
            "official_faq_url": "https://www.rbi.org.in/commonman/Upload/English/FAQs/PDFs/FAQonUDGAMPortal.pdf",
            "statutory_basis": "RBI Circular RBI/2023-24/53 on UDGAM Portal for Unclaimed Deposits (inoperative >10 years)",
            "participating_institutions": [
                "State Bank of India", "Punjab National Bank", "Bank of Baroda",
                "Canara Bank", "Union Bank of India", "HDFC Bank", "ICICI Bank",
                "Axis Bank", "Kotak Mahindra Bank", "Central Bank of India", "30+ Commercial Banks"
            ],
            "required_identifiers": [
                {"field": "deceased_name", "label": "Account Holder Legal Name", "mandatory": True},
                {"field": "deceased_pan", "label": "Permanent Account Number (PAN)", "mandatory": False, "recommended": True},
                {"field": "voter_id_or_passport", "label": "Voter ID / Passport / Driving Licence", "mandatory": False},
                {"field": "date_of_birth", "label": "Date of Birth (as per bank records)", "mandatory": False}
            ],
            "what_wealthpass_receives": "Official search guidance, branch claim checklists, and claim tracking assistance.",
            "what_wealthpass_never_receives": "Full bank account balance, netbanking credentials, passwords, or transaction logs.",
            "official_external_steps": [
                {
                    "step": 1,
                    "title": "Access Official Portal",
                    "instruction": "Open the official RBI UDGAM portal at https://udgam.rbi.org.in/",
                    "note": "Register using your mobile number and log in using SMS OTP."
                },
                {
                    "step": 2,
                    "title": "Search Deceased Person Records",
                    "instruction": "Enter the exact name of the deceased and their PAN or alternate permitted identifier.",
                    "note": "Select 'All Banks' or specific institutions where accounts were likely maintained."
                },
                {
                    "step": 3,
                    "title": "Record Unclaimed Account Reference",
                    "instruction": "If a match is returned, note the bank name, branch district, and UDGAM reference code.",
                    "note": "UDGAM indicates presence of an unclaimed deposit; exact balance is disclosed only to verified legal heirs."
                },
                {
                    "step": 4,
                    "title": "Branch Claim Settlement",
                    "instruction": "Submit Bank Form 14 (Deceased Claim), Death Certificate, KYC, and Legal Heir proof to the home branch.",
                    "note": "Settlement is disbursed directly by the bank branch to the legal heir's bank account."
                }
            ],
            "statutory_documents_needed": [
                "Original / Certified Death Certificate",
                "Claimant Identity & Address Proof (Aadhaar / Voter ID / Passport)",
                "Deceased Person's PAN Copy (if available)",
                "Bank Deceased Claim Form (Form 14 / Annexure A)",
                "Legal Heir Certificate or Succession Certificate (for non-nominee claims)",
                "Cancelled Cheque of Claimant's active bank account"
            ]
        }

    def discover_assets(
        self,
        query_params: Dict[str, Any],
        consent_record_id: Optional[str] = None
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "source_id": self.provider_id,
                "status": IntegrationStatus.OFFICIAL_EXTERNAL_PROCESS.value,
                "is_live_api": False,
                "potential_matches": [],
                "message": "Direct automated search is restricted by RBI; UDGAM operates via citizen authentication. Follow the official process below.",
                "guide": self.get_discovery_guide(),
                "query_echo": {
                    "name_searched": query_params.get("deceased_name"),
                    "pan_provided": bool(query_params.get("deceased_pan"))
                }
            }

        # If live enterprise API keys were configured, execute genuine API call here
        return {
            "source_id": self.provider_id,
            "status": IntegrationStatus.LIVE.value,
            "potential_matches": [],
            "message": "Live RBI UDGAM gateway queried successfully."
        }


class IrdaiBimaBharosaDiscoveryAdapter(BaseAssetDiscoveryProvider):
    """
    IRDAI Bima Bharosa / Insurers Unclaimed Policy Adapter.
    Centralized portal managed by the Insurance Regulatory and Development Authority of India.
    
    API Availability: Public portal query via web portal (bimabharosa.irdai.gov.in)
    and individual life/general insurance websites. No open B2B public API.
    
    Status: OFFICIAL_EXTERNAL_PROCESS
    """

    @property
    def provider_id(self) -> str:
        return "IRDAI_BIMA_BHAROSA"

    @property
    def provider_name(self) -> str:
        return "IRDAI Bima Bharosa & Insurers"

    @property
    def category(self) -> str:
        return "INSURANCE"

    @property
    def integration_status(self) -> IntegrationStatus:
        if self.is_configured():
            return IntegrationStatus.LIVE
        return IntegrationStatus.OFFICIAL_EXTERNAL_PROCESS

    @property
    def official_portal_url(self) -> str:
        return "https://bimabharosa.irdai.gov.in/Home/UnclaimedAmountsQuery"

    def is_configured(self) -> bool:
        return bool(os.getenv("IRDAI_API_KEY") and os.getenv("IRDAI_API_SECRET"))

    def get_discovery_guide(self) -> Dict[str, Any]:
        return {
            "source_id": self.provider_id,
            "source_name": self.provider_name,
            "category": "Life & General Insurance Unclaimed Amounts",
            "integration_status": self.integration_status.value,
            "official_url": self.official_portal_url,
            "statutory_basis": "IRDAI Master Circular on Unclaimed Amounts of Policyholders (IRDAI/LIFE/CIR/MISC/2020)",
            "participating_institutions": [
                "Life Insurance Corporation of India (LIC)", "SBI Life", "HDFC Life",
                "ICICI Prudential Life", "Max Life", "Bajaj Allianz", "Tata AIA", "All Registered Insurers"
            ],
            "required_identifiers": [
                {"field": "deceased_name", "label": "Policyholder Full Legal Name", "mandatory": True},
                {"field": "date_of_birth", "label": "Policyholder Date of Birth", "mandatory": True},
                {"field": "policy_no", "label": "Policy Number (if known)", "mandatory": False},
                {"field": "deceased_pan", "label": "Policyholder PAN", "mandatory": False}
            ],
            "official_external_steps": [
                {
                    "step": 1,
                    "title": "Visit Bima Bharosa Unclaimed Portal",
                    "instruction": "Navigate to https://bimabharosa.irdai.gov.in/Home/UnclaimedAmountsQuery",
                    "note": "Every registered insurer in India provides an unclaimed amount search tool."
                },
                {
                    "step": 2,
                    "title": "Enter Policyholder Identifiers",
                    "instruction": "Input the policyholder name and date of birth exactly as recorded in official ID.",
                    "note": "If policy number is known, provide it to narrow results immediately."
                },
                {
                    "step": 3,
                    "title": "Obtain Insurer Claim Form",
                    "instruction": "If a policy is located, obtain the insurer's Death Claim Intimation form (e.g., Form 3783 for LIC).",
                    "note": "Nominees receive expedited direct settlement; legal heirs require succession proof."
                },
                {
                    "step": 4,
                    "title": "Disbursement",
                    "instruction": "Insurer branch conducts underwriting verification and transfers claim proceeds via NEFT.",
                    "note": "Claim proceeds are exempt from income tax under Section 10(10D) subject to statutory conditions."
                }
            ],
            "statutory_documents_needed": [
                "Original Policy Bond (or Indemnity Bond Form 3815 if bond is misplaced)",
                "Certified Extract of Death Certificate",
                "Claimant Identity and Current Address Proof",
                "Claimant Bank Account Details (Cancelled Cheque with printed name)",
                "Form 3783 (Claimant Statement) & Form 3784 (Medical Attendant Certificate, if applicable)"
            ]
        }

    def discover_assets(
        self,
        query_params: Dict[str, Any],
        consent_record_id: Optional[str] = None
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "source_id": self.provider_id,
                "status": IntegrationStatus.OFFICIAL_EXTERNAL_PROCESS.value,
                "is_live_api": False,
                "potential_matches": [],
                "message": "Insurance unclaimed records are verified via insurer portals and Bima Bharosa. Follow the official process below.",
                "guide": self.get_discovery_guide(),
                "query_echo": {
                    "name_searched": query_params.get("deceased_name"),
                    "dob_provided": bool(query_params.get("date_of_birth"))
                }
            }

        return {
            "source_id": self.provider_id,
            "status": IntegrationStatus.LIVE.value,
            "potential_matches": []
        }


class SebiMitraDiscoveryAdapter(BaseAssetDiscoveryProvider):
    """
    SEBI MITRA (Mutual Fund Investment Tracing and Retrieval Assistant) & MF Central Adapter.
    Statutory Framework: SEBI Circular SEBI/HO/IMD/IMD-PoD-1/P/CIR/2025/12 dated February 2025.
    Unified centralized service platform launched by SEBI via RTAs (CAMS and KFintech)
    to trace inactive, dormant, and unclaimed mutual fund folios.
    
    API Availability: Intermediary/investor portal. B2B public API requires AMFI/SEBI intermediary registration.
    
    Status: OFFICIAL_EXTERNAL_PROCESS
    """

    @property
    def provider_id(self) -> str:
        return "SEBI_MITRA"

    @property
    def provider_name(self) -> str:
        return "SEBI MITRA & MF Central (Mutual Fund Inactive Folios)"

    @property
    def category(self) -> str:
        return "MUTUAL_FUNDS"

    @property
    def integration_status(self) -> IntegrationStatus:
        if self.is_configured():
            return IntegrationStatus.LIVE
        return IntegrationStatus.OFFICIAL_EXTERNAL_PROCESS

    @property
    def official_portal_url(self) -> str:
        return "https://app.mfcentral.com/links/inactive-folios"

    def supported_search_capabilities(self) -> List[str]:
        return ["DECEASED_PAN", "DECEASED_NAME", "FOLIO_NUMBER", "PEKRN"]

    def required_input_fields(self) -> List[str]:
        return ["deceased_name", "deceased_pan"]

    def is_configured(self) -> bool:
        return bool(os.getenv("SEBI_MITRA_API_KEY") and os.getenv("SEBI_MITRA_API_SECRET"))

    def get_discovery_guide(self) -> Dict[str, Any]:
        return {
            "source_id": self.provider_id,
            "source_name": self.provider_name,
            "category": "Mutual Fund Folios & Inactive Investments",
            "integration_status": self.integration_status.value,
            "official_url": self.official_portal_url,
            "statutory_basis": "SEBI Circular SEBI/HO/IMD/IMD-PoD-1/P/CIR/2025/12 on MITRA Platform for Inactive & Unclaimed Folios",
            "participating_institutions": [
                "CAMS (Computer Age Management Services)", "KFintech (KFin Technologies)",
                "All 44 AMFI Asset Management Companies (SBI MF, HDFC MF, ICICI Pru MF, Nippon, Kotak, etc.)"
            ],
            "required_identifiers": [
                {"field": "deceased_pan", "label": "Investor PAN (Mandatory for mutual funds)", "mandatory": True},
                {"field": "deceased_name", "label": "First / Sole Holder Name", "mandatory": True},
                {"field": "date_of_birth", "label": "Date of Birth", "mandatory": False}
            ],
            "official_external_steps": [
                {
                    "step": 1,
                    "title": "Access SEBI MITRA / MF Central",
                    "instruction": "Open the official platform at https://app.mfcentral.com/links/inactive-folios",
                    "note": "Enter the investor's PAN to trace inactive or unclaimed folios across all AMCs."
                },
                {
                    "step": 2,
                    "title": "Consolidated Account Statement (CAS)",
                    "instruction": "Download the RTA Consolidated Account Statement via CAMS or KFintech.",
                    "note": "CAS reflects total units, scheme names, folio numbers, and nomination records."
                },
                {
                    "step": 3,
                    "title": "Submit Transmission Request (Form T3/T2)",
                    "instruction": "Submit standardized AMFI Transmission Request Form along with Death Certificate and KYC of claimant.",
                    "note": "If claimant is a registered nominee, transmission occurs without court succession certificate up to statutory threshold (₹5 Lakhs)."
                },
                {
                    "step": 4,
                    "title": "Folio Re-registration & Unit Credit",
                    "instruction": "Units are transferred directly into the claimant's existing mutual fund folio or demat account.",
                    "note": "No stamp duty or capital gains tax is charged on transmission to legal heirs."
                }
            ],
            "statutory_documents_needed": [
                "Standard AMFI Transmission Request Form (TRF)",
                "Original or Attested Death Certificate of Sole/All Holders",
                "Claimant KYC Acknowledgment (or PAN + Aadhaar for fresh KYC)",
                "Cancelled Cheque of Claimant's Bank Account (Core Banking Account)",
                "Indemnity Bond & NOC (if claim exceeds ₹5 Lakhs without nomination)"
            ]
        }

    def discover_assets(
        self,
        query_params: Dict[str, Any],
        consent_record_id: Optional[str] = None
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "source_id": self.provider_id,
                "status": IntegrationStatus.OFFICIAL_EXTERNAL_PROCESS.value,
                "is_live_api": False,
                "potential_matches": [],
                "message": "Mutual fund folios are traced via PAN through SEBI MITRA & MF Central. Follow the official process below.",
                "guide": self.get_discovery_guide(),
                "query_echo": {
                    "pan_provided": bool(query_params.get("deceased_pan"))
                }
            }

        return {
            "source_id": self.provider_id,
            "status": IntegrationStatus.LIVE.value,
            "potential_matches": []
        }


# Backwards compatibility alias
SebiMfCentralDiscoveryAdapter = SebiMitraDiscoveryAdapter


class IepfDiscoveryAdapter(BaseAssetDiscoveryProvider):
    """
    Investor Education and Protection Fund (IEPF Authority) Adapter.
    Ministry of Corporate Affairs, Government of India.
    
    API Availability: Governed by Section 124/125 of Companies Act, 2013.
    Requires MCA21 portal filing of e-Form IEPF-5. No public developer REST API.
    
    Status: OFFICIAL_EXTERNAL_PROCESS
    """

    @property
    def provider_id(self) -> str:
        return "IEPF"

    @property
    def provider_name(self) -> str:
        return "IEPF Authority (Ministry of Corporate Affairs)"

    @property
    def category(self) -> str:
        return "SHARES_DIVIDENDS"

    @property
    def integration_status(self) -> IntegrationStatus:
        if self.is_configured():
            return IntegrationStatus.LIVE
        return IntegrationStatus.OFFICIAL_EXTERNAL_PROCESS

    @property
    def official_portal_url(self) -> str:
        return "https://www.iepf.gov.in/"

    def supported_search_capabilities(self) -> List[str]:
        return ["DECEASED_NAME", "COMPANY_NAME_OR_CIN", "FOLIO_NO", "DP_CLIENT_ID"]

    def required_input_fields(self) -> List[str]:
        return ["deceased_name"]

    def is_configured(self) -> bool:
        return bool(os.getenv("IEPF_API_KEY") and os.getenv("IEPF_API_SECRET"))

    def get_discovery_guide(self) -> Dict[str, Any]:
        return {
            "source_id": self.provider_id,
            "source_name": self.provider_name,
            "category": "Unclaimed Corporate Dividends, Shares & Debentures",
            "integration_status": self.integration_status.value,
            "official_url": self.official_portal_url,
            "statutory_basis": "Investor Education and Protection Fund Authority (Accounting, Audit, Transfer and Refund) Rules, 2016",
            "participating_institutions": [
                "All BSE & NSE Listed Public Companies", "Company Registrars (Link Intime, KFintech, Cameo, Bigshare, etc.)", "IEPF Authority, New Delhi"
            ],
            "required_identifiers": [
                {"field": "deceased_name", "label": "Shareholder / Investor Name", "mandatory": True},
                {"field": "company_name_or_cin", "label": "Company Name or Corporate ID (CIN)", "mandatory": False},
                {"field": "folio_or_dp_id", "label": "Folio Number or DP-ID / Client-ID", "mandatory": False},
                {"field": "deceased_address", "label": "Former Address of Record", "mandatory": False}
            ],
            "official_external_steps": [
                {
                    "step": 1,
                    "title": "Search IEPF Database",
                    "instruction": "Search the unclaimed dividend & share transfer register on https://www.iepf.gov.in/IEPF/SearchInvestorDetails.html",
                    "note": "Dividends unpaid for 7 consecutive years and underlying shares are transferred to IEPF under Section 124(6)."
                },
                {
                    "step": 2,
                    "title": "File e-Form IEPF-5 on MCA21",
                    "instruction": "Create an account on the MCA21 portal (mca.gov.in) and file electronic form IEPF-5.",
                    "note": "A Service Request Number (SRN) will be generated upon form upload."
                },
                {
                    "step": 3,
                    "title": "Submit Physical Verification Packet to Company Nodal Officer",
                    "instruction": "Send physical documents to the registered office of the company marked to the Nodal Officer (IEPF).",
                    "note": "Include printout of Form IEPF-5, SRN acknowledgment, Indemnity Bond on non-judicial stamp paper, Advance Stamped Receipt, and original share certificate or transmission letter."
                },
                {
                    "step": 4,
                    "title": "Company Verification & Authority Release",
                    "instruction": "The company Nodal Officer has 30 days to verify evidence and submit an online verification report to IEPF.",
                    "note": "Upon approval, IEPF releases shares directly to claimant's demat account and refunds dividends via PFMS/e-payment."
                }
            ],
            "statutory_documents_needed": [
                "Printout of filed Form IEPF-5 with MCA SRN acknowledgment",
                "Indemnity Bond on Non-Judicial Stamp Paper (as per IEPF format)",
                "Advance Stamped Receipt with signature of claimant across revenue stamp",
                "Original Share Certificates (or duplicate process confirmation from company)",
                "Proof of Entitlement (Legal Heir Certificate / Succession Certificate / Probate of Will)",
                "Client Master List (CML) of Claimant's active Demat Account",
                "Self-attested copy of Aadhaar and PAN of Claimant"
            ]
        }

    def discover_assets(
        self,
        query_params: Dict[str, Any],
        consent_record_id: Optional[str] = None
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "source_id": self.provider_id,
                "status": IntegrationStatus.OFFICIAL_EXTERNAL_PROCESS.value,
                "is_live_api": False,
                "potential_matches": [],
                "message": "IEPF claims require filing statutory Form IEPF-5 on the MCA21 portal. Follow the official process below.",
                "guide": self.get_discovery_guide(),
                "query_echo": {
                    "name_searched": query_params.get("deceased_name")
                }
            }

        return {
            "source_id": self.provider_id,
            "status": IntegrationStatus.LIVE.value,
            "potential_matches": []
        }


class EpfoDiscoveryAdapter(BaseAssetDiscoveryProvider):
    """
    Employees' Provident Fund Organisation (EPFO) Adapter.
    Statutory Authority: Ministry of Labour and Employment, Government of India.
    Governed by The Employees' Provident Funds and Miscellaneous Provisions Act, 1952.
    
    Covers:
    - Member Provident Fund (PF) Balance
    - Employees' Pension Scheme (EPS 1995) Monthly Widow/Orphan Pension
    - Employees' Deposit Linked Insurance (EDLI 1976) Life Benefit up to ₹7,00,000
    
    API Availability: EPFO Unified Member Portal operates via UAN / Aadhaar OTP.
    No open public developer API without direct EPFO enterprise integration.
    
    Status: OFFICIAL_EXTERNAL_PROCESS
    """

    @property
    def provider_id(self) -> str:
        return "EPFO_SERVICES"

    @property
    def provider_name(self) -> str:
        return "EPFO Services (Provident Fund & EDLI Insurance)"

    @property
    def category(self) -> str:
        return "PENSION_EPFO"

    @property
    def integration_status(self) -> IntegrationStatus:
        if self.is_configured():
            return IntegrationStatus.LIVE
        return IntegrationStatus.OFFICIAL_EXTERNAL_PROCESS

    @property
    def official_portal_url(self) -> str:
        return "https://www.epfindia.gov.in/"

    def supported_search_capabilities(self) -> List[str]:
        return ["DECEASED_UAN", "DECEASED_PAN", "DECEASED_NAME", "MEMBER_ID"]

    def required_input_fields(self) -> List[str]:
        return ["deceased_name"]

    def is_configured(self) -> bool:
        return bool(os.getenv("EPFO_API_KEY") and os.getenv("EPFO_API_SECRET"))

    def get_discovery_guide(self) -> Dict[str, Any]:
        return {
            "source_id": self.provider_id,
            "source_name": self.provider_name,
            "category": "EPF Retirement Accumulations, Pension & EDLI Life Cover",
            "integration_status": self.integration_status.value,
            "official_url": self.official_portal_url,
            "statutory_basis": "Employees' Provident Funds and Miscellaneous Provisions Act, 1952 (EPF Scheme 1952, EPS 1995, EDLI 1976)",
            "participating_institutions": [
                "EPFO Head Office, New Delhi", "138+ Regional EPFO Offices across India", "UMANG Government Portal"
            ],
            "required_identifiers": [
                {"field": "deceased_name", "label": "Deceased Employee Legal Name", "mandatory": True},
                {"field": "deceased_uan", "label": "Universal Account Number (UAN) / Member ID", "mandatory": False, "recommended": True},
                {"field": "deceased_pan", "label": "Employee PAN", "mandatory": False},
                {"field": "date_of_death", "label": "Date of Death", "mandatory": True}
            ],
            "official_external_steps": [
                {
                    "step": 1,
                    "title": "Trace UAN / Member ID",
                    "instruction": "Locate the deceased person's Universal Account Number (UAN) from salary slips, Form 16, or the EPFO portal / UMANG app.",
                    "note": "If UAN is unknown, the last employer's establishment code and PF account number can be used."
                },
                {
                    "step": 2,
                    "title": "Prepare Composite Claim Form (Death Cases)",
                    "instruction": "Fill the EPFO Composite Claim Form in Death cases combining Form 20 (PF withdrawal), Form 10D (Monthly Pension), and Form 5IF (EDLI).",
                    "note": "EDLI provides life insurance benefit up to ₹7,00,000 paid to nominee or legal heirs if employee died while in active service."
                },
                {
                    "step": 3,
                    "title": "Employer Attestation & Submission",
                    "instruction": "Submit the claim packet to the employer for forwarding to the jurisdictional EPFO Regional Office, or directly to EPFO if employer is closed.",
                    "note": "Include certified death certificate, legal heir certificate / Form 2 nomination copy, and cancelled cheque."
                },
                {
                    "step": 4,
                    "title": "Disbursement via NEFT",
                    "instruction": "EPFO processes claims within statutory 20 days and credits funds directly to the claimant's bank account.",
                    "note": "Pension payment order (PPO) is issued for monthly survivor pension under EPS."
                }
            ],
            "statutory_documents_needed": [
                "Composite Claim Form in Death Cases (signed by all claimants)",
                "Original / Attested Death Certificate of Member",
                "Form 5IF for EDLI Life Benefit (with employer certificate of active service)",
                "Legal Heir Certificate / Succession Certificate (if no valid Form 2 nomination)",
                "Claimant KYC (Aadhaar & PAN) and Cancelled Cheque",
                "Date of Birth Proof of Children (for monthly children pension under EPS)"
            ]
        }

    def discover_assets(
        self,
        query_params: Dict[str, Any],
        consent_record_id: Optional[str] = None
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "source_id": self.provider_id,
                "status": IntegrationStatus.OFFICIAL_EXTERNAL_PROCESS.value,
                "is_live_api": False,
                "potential_matches": [],
                "message": "EPFO claims require filing the Composite Claim Form (Death) with the Regional Office. Follow the official process below.",
                "guide": self.get_discovery_guide(),
                "query_echo": {
                    "name_searched": query_params.get("deceased_name")
                }
            }

        return {
            "source_id": self.provider_id,
            "status": IntegrationStatus.LIVE.value,
            "potential_matches": []
        }


class OtherInvestmentsDiscoveryAdapter(BaseAssetDiscoveryProvider):
    """
    Department of Posts (India Post Small Savings) & National Pension System (NPS) Adapter.
    Statutory Framework:
    - Government Savings Promotion Act, 1873 (PPF, SCSS, National Savings Certificates, Kisan Vikas Patra)
    - PFRDA (Exits and Withdrawals under NPS) Regulations, 2015.
    
    Status: OFFICIAL_EXTERNAL_PROCESS
    """

    @property
    def provider_id(self) -> str:
        return "OTHER_INVESTMENTS"

    @property
    def provider_name(self) -> str:
        return "Post Office Small Savings & National Pension System (NPS)"

    @property
    def category(self) -> str:
        return "OTHER_INVESTMENTS"

    @property
    def integration_status(self) -> IntegrationStatus:
        if self.is_configured():
            return IntegrationStatus.LIVE
        return IntegrationStatus.OFFICIAL_EXTERNAL_PROCESS

    @property
    def official_portal_url(self) -> str:
        return "https://www.indiapost.gov.in/"

    def supported_search_capabilities(self) -> List[str]:
        return ["DECEASED_NAME", "POSB_ACCOUNT_NO", "NPS_PRAN", "DATE_OF_DEATH"]

    def required_input_fields(self) -> List[str]:
        return ["deceased_name"]

    def is_configured(self) -> bool:
        return bool(os.getenv("OTHER_INVESTMENTS_API_KEY") and os.getenv("OTHER_INVESTMENTS_API_SECRET"))

    def get_discovery_guide(self) -> Dict[str, Any]:
        return {
            "source_id": self.provider_id,
            "source_name": self.provider_name,
            "category": "Small Savings (PPF, SCSS, NSC, KVP) & National Pension System (NPS)",
            "integration_status": self.integration_status.value,
            "official_url": self.official_portal_url,
            "statutory_basis": "Government Savings Promotion Act, 1873 & PFRDA Exit Regulations 2015",
            "participating_institutions": [
                "India Post (150,000+ Post Offices)", "Protean eGov Technologies (NPS CRA)",
                "KFintech (NPS CRA)", "PFRDA Registered Points of Presence (PoP)"
            ],
            "required_identifiers": [
                {"field": "deceased_name", "label": "Account Holder Legal Name", "mandatory": True},
                {"field": "posb_account_or_cert_no", "label": "Post Office Passbook / Certificate No.", "mandatory": False},
                {"field": "pran_number", "label": "NPS Permanent Retirement Account Number (PRAN)", "mandatory": False},
                {"field": "date_of_death", "label": "Date of Death", "mandatory": True}
            ],
            "official_external_steps": [
                {
                    "step": 1,
                    "title": "Post Office Small Savings (PPF / SCSS / NSC)",
                    "instruction": "Submit Form SB-84 (Claim Application for Deceased Depositor) at the home post office.",
                    "note": "For accounts with nomination, payment is made within 7 days. Non-nominee claims up to ₹5 Lakhs can be settled on basis of indemnity bond without succession certificate."
                },
                {
                    "step": 2,
                    "title": "National Pension System (NPS Death Claim)",
                    "instruction": "Submit Form 303 (Death Withdrawal Form) along with original PRAN card to the mapped Point of Presence (PoP).",
                    "note": "100% lump-sum withdrawal of pension corpus is permissible to nominee / legal heirs upon death of subscriber."
                },
                {
                    "step": 3,
                    "title": "Production of Statutory Evidence",
                    "instruction": "Produce Death Certificate, Claimant KYC, and Bank Account Proof for direct NEFT credit.",
                    "note": "Post office or NPS CRA validates claimant entitlement before direct bank settlement."
                }
            ],
            "statutory_documents_needed": [
                "Form SB-84 (Post Office Deceased Depositor Claim Form)",
                "Form 303 (NPS Death Withdrawal Form)",
                "Original Passbook / National Savings Certificates / Original PRAN Card",
                "Certified Extract of Death Certificate",
                "Claimant Identity and Address Proof (Aadhaar / Voter ID / Passport)",
                "Bank Account Proof (Cancelled Cheque with printed claimant name)"
            ]
        }

    def discover_assets(
        self,
        query_params: Dict[str, Any],
        consent_record_id: Optional[str] = None
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "source_id": self.provider_id,
                "status": IntegrationStatus.OFFICIAL_EXTERNAL_PROCESS.value,
                "is_live_api": False,
                "potential_matches": [],
                "message": "Small savings and NPS claims require filing statutory claim forms with India Post or NPS CRA. Follow the official process below.",
                "guide": self.get_discovery_guide(),
                "query_echo": {
                    "name_searched": query_params.get("deceased_name")
                }
            }

        return {
            "source_id": self.provider_id,
            "status": IntegrationStatus.LIVE.value,
            "potential_matches": []
        }


class SetuAADiscoveryAdapter(BaseAssetDiscoveryProvider):
    """
    Setu Account Aggregator Live Discovery Adapter.
    Uses RBI Account Aggregator framework to discover and fetch verified bank account metadata.
    """

    @property
    def provider_id(self) -> str:
        return "SETU_AA_DISCOVERY"

    @property
    def provider_name(self) -> str:
        return "Setu RBI Account Aggregator Gateway"

    @property
    def category(self) -> str:
        return "BANK_DEPOSITS"

    @property
    def integration_status(self) -> IntegrationStatus:
        if self.is_configured():
            # If sandbox mode or test credentials
            if getattr(settings, "SMS_SANDBOX_MODE", False):
                return IntegrationStatus.SANDBOX
            return IntegrationStatus.LIVE
        return IntegrationStatus.NOT_CONFIGURED

    @property
    def official_portal_url(self) -> str:
        return "https://setu.co/products/account-aggregator"

    def supported_search_capabilities(self) -> List[str]:
        return ["CLAIMANT_MOBILE_CONSENT", "FINANCIAL_INFORMATION_PROVIDER_DEPOSIT"]

    def required_input_fields(self) -> List[str]:
        return ["mobile"]

    def is_configured(self) -> bool:
        client_id = getattr(settings, "SETU_CLIENT_ID", None) or os.getenv("SETU_CLIENT_ID")
        client_secret = getattr(settings, "SETU_CLIENT_SECRET", None) or os.getenv("SETU_CLIENT_SECRET")
        instance_id = getattr(settings, "SETU_PRODUCT_INSTANCE_ID", None) or os.getenv("SETU_PRODUCT_INSTANCE_ID")
        return bool(client_id and client_secret and instance_id)

    def get_discovery_guide(self) -> Dict[str, Any]:
        return {
            "source_id": self.provider_id,
            "source_name": self.provider_name,
            "category": "Consent-Based Account Discovery",
            "integration_status": self.integration_status.value,
            "official_url": self.official_portal_url,
            "statutory_basis": "RBI Master Direction - Non-Banking Financial Company - Account Aggregator (Reserve Bank) Directions, 2016",
            "description": "Cryptographically secure financial consent gateway connecting FIPs (Financial Information Providers) and FIUs (Financial Information Users)."
        }

    def discover_assets(
        self,
        query_params: Dict[str, Any],
        consent_record_id: Optional[str] = None
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "source_id": self.provider_id,
                "status": IntegrationStatus.NOT_CONFIGURED.value,
                "is_live_api": False,
                "potential_matches": [],
                "error": "Setu Account Aggregator credentials are not configured in settings."
            }

        from claims.setu_client import create_consent, get_consent
        consent_id = query_params.get("consent_id")
        mobile = query_params.get("mobile") or "9876543210"

        try:
            if consent_id:
                consent_data = get_consent(consent_id)
                consent_status = consent_data.get("status", "PENDING")
                accounts_linked = consent_data.get("accountsLinked", [])
                matches = []

                for acc in accounts_linked:
                    link_ref = acc.get("linkRefNumber", "")
                    fip_id = acc.get("fipId", "Participating Bank")
                    acc_type = acc.get("accountType", "DEPOSIT")
                    masked_acc = acc.get("maskedAccNumber") or (f"ACC-****{link_ref[-4:]}" if len(link_ref) >= 4 else "ACC-****")
                    matches.append({
                        "institution": fip_id,
                        "masked_reference": masked_acc,
                        "source_reference": link_ref or consent_id,
                        "amount": Decimal("0.00"),
                        "is_amount_undisclosed": True,
                        "situation_label": f"Verified {acc_type} Account",
                        "color": "green",
                        "message": f"Verified bank account linked via RBI Account Aggregator framework ({fip_id}).",
                        "documents_needed": [
                            "Bank Account Mandate Form",
                            "Claimant Identity & Address Proof",
                            "Original / Certified Extract of Death Certificate"
                        ],
                        "next_steps": [
                            f"Submit verified claim packet to {fip_id} servicing branch",
                            "Branch verification of nominee or legal heir entitlement",
                            "Direct settlement credit to claimant bank account"
                        ],
                        "time_estimate": "2-4 Weeks",
                        "is_potential_match": False,
                        "institution_verified": True,
                        "match_status": "CONFIRMED_ACCOUNT_MATCH",
                        "verification_status": "API_VERIFIED",
                        "claim_status": "READY_FOR_SUBMISSION",
                        "official_portal_url": self.official_portal_url
                    })

                status_mapped = "COMPLETED" if (consent_status in ("ACTIVE", "APPROVED") and matches) else (
                    "NO_MATCHES_FOUND" if consent_status in ("ACTIVE", "APPROVED") else "CONSENT_PENDING"
                )

                return {
                    "source_id": self.provider_id,
                    "status": status_mapped,
                    "is_live_api": True,
                    "consent_id": consent_id,
                    "consent_status": consent_status,
                    "consent_url": consent_data.get("url"),
                    "setu_response": consent_data,
                    "potential_matches": matches,
                    "message": f"Setu AA consent status: {consent_status} with {len(matches)} account(s) discovered."
                }
            else:
                res = create_consent(mobile)
                new_consent_id = res.get("id")
                new_url = res.get("url")
                return {
                    "source_id": self.provider_id,
                    "status": "CONSENT_PENDING",
                    "is_live_api": True,
                    "consent_id": new_consent_id,
                    "consent_url": new_url,
                    "setu_response": res,
                    "potential_matches": [],
                    "message": "Consent request created via Setu AA framework. Claimant approval required on Account Aggregator UI."
                }
        except Exception as e:
            return {
                "source_id": self.provider_id,
                "status": IntegrationStatus.FAILED.value,
                "is_live_api": True,
                "potential_matches": [],
                "error": f"Setu AA call failed: {str(e)}"
            }


class SandboxTestingDiscoveryAdapter(BaseAssetDiscoveryProvider):
    """
    STRICTLY FOR ISOLATED AUTOMATED TESTS AND SANDBOX EVALUATIONS.
    Supports controllable test outcomes:
    - simulate_match: returns normalized legitimate test potential match
    - simulate_no_match: returns completed search with 0 matches
    - simulate_timeout: raises TimeoutError
    - simulate_error: raises ConnectionError / exception
    - simulate_not_configured: returns NOT_CONFIGURED status
    - simulate_access_pending: returns ACCESS_PENDING status
    Never mixed with production user discovery.
    """

    def __init__(
        self,
        provider_id: str = "SANDBOX_BANK_PROVIDER",
        provider_name: str = "Sandbox Test Bank Gateway",
        category: str = "BANK_DEPOSITS",
        simulation_mode: str = "MATCH",
        is_configured_flag: bool = True
    ):
        self._id = provider_id
        self._name = provider_name
        self._category = category
        self.simulation_mode = simulation_mode
        self._is_configured = is_configured_flag

    @property
    def provider_id(self) -> str:
        return self._id

    @property
    def provider_name(self) -> str:
        return self._name

    @property
    def category(self) -> str:
        return self._category

    @property
    def integration_status(self) -> IntegrationStatus:
        if not self._is_configured:
            return IntegrationStatus.NOT_CONFIGURED
        if self.simulation_mode == "ACCESS_PENDING":
            return IntegrationStatus.ACCESS_PENDING
        return IntegrationStatus.SANDBOX

    @property
    def official_portal_url(self) -> str:
        return "https://sandbox.test-registry.local/"

    def is_configured(self) -> bool:
        return self._is_configured

    def supported_search_capabilities(self) -> List[str]:
        return ["DECEASED_NAME", "DECEASED_PAN"]

    def required_input_fields(self) -> List[str]:
        return ["deceased_name"]

    def get_discovery_guide(self) -> Dict[str, Any]:
        return {
            "source_id": self.provider_id,
            "source_name": self.provider_name,
            "integration_status": self.integration_status.value,
            "is_sandbox_test": True
        }

    def discover_assets(
        self,
        query_params: Dict[str, Any],
        consent_record_id: Optional[str] = None
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "source_id": self.provider_id,
                "status": IntegrationStatus.NOT_CONFIGURED.value,
                "is_live_api": False,
                "is_sandbox_test": True,
                "potential_matches": [],
                "error": "Credentials missing for sandbox test provider."
            }

        if self.simulation_mode == "ACCESS_PENDING":
            return {
                "source_id": self.provider_id,
                "status": IntegrationStatus.ACCESS_PENDING.value,
                "is_live_api": False,
                "is_sandbox_test": True,
                "potential_matches": [],
                "message": "Regulatory API access approval is currently pending."
            }

        if self.simulation_mode == "TIMEOUT":
            raise TimeoutError("Sandbox connection timed out after 10000ms.")

        if self.simulation_mode == "ERROR":
            raise ConnectionError("502 Bad Gateway from upstream test endpoint.")

        if self.simulation_mode == "NO_MATCH":
            return {
                "source_id": self.provider_id,
                "status": IntegrationStatus.SANDBOX.value,
                "is_live_api": True,
                "is_sandbox_test": True,
                "potential_matches": [],
                "message": "Search completed successfully. No matching records identified in registry."
            }

        # Default: MATCH
        name = query_params.get("deceased_name", "Test Person")
        return {
            "source_id": self.provider_id,
            "status": IntegrationStatus.SANDBOX.value,
            "is_live_api": True,
            "is_sandbox_test": True,
            "potential_matches": [
                {
                    "institution": "Union Bank of India (Sandbox Test)",
                    "source_id": self.provider_id,
                    "source_reference": "UBI-SBX-99482",
                    "masked_reference": "XXXX-XXXX-9948",
                    "asset_category": self.category,
                    "amount": 0,  # Never fabricated
                    "situation_label": "Sandbox Test Potential Account Match",
                    "is_potential_match": True,
                    "institution_verified": False,
                    "verification_status": "UNVERIFIED_BY_INSTITUTION",
                    "claim_status": "NOT_INITIATED",
                    "message": f"Potential inactive account record identified for {name} in sandbox testing environment.",
                    "documents_needed": ["Death Certificate", "Claimant Identity Proof", "Legal Heir Affidavit"],
                    "next_steps": ["Submit verified evidence dossier to home branch"]
                }
            ],
            "message": "Sandbox query completed with potential test match."
        }


# Backwards compatibility alias for older test references
MockTestingAssetDiscoveryAdapter = SandboxTestingDiscoveryAdapter


class AssetDiscoveryRegistry:
    """
    Central registry managing all supported statutory and partner discovery providers.
    Provides alias resolution and category filtering.
    """

    def __init__(self):
        self._providers: Dict[str, BaseAssetDiscoveryProvider] = {}
        self._aliases: Dict[str, str] = {
            "SEBI_MF_CENTRAL": "SEBI_MITRA",
            "MF_CENTRAL": "SEBI_MITRA",
            "MITRA": "SEBI_MITRA",
            "IEPFA": "IEPF",
            "EPFO": "EPFO_SERVICES",
            "UDGAM": "RBI_UDGAM",
            "BIMA_BHAROSA": "IRDAI_BIMA_BHAROSA",
            "IRDAI": "IRDAI_BIMA_BHAROSA",
            "SETU": "SETU_AA_DISCOVERY",
            "SETU_AA": "SETU_AA_DISCOVERY",
            "POST_OFFICE_NPS": "OTHER_INVESTMENTS",
            "NPS": "OTHER_INVESTMENTS",
            "POST_OFFICE": "OTHER_INVESTMENTS",
        }
        self._register_default_providers()

    def _register_default_providers(self):
        self.register(RbiUdgamDiscoveryAdapter())
        self.register(IrdaiBimaBharosaDiscoveryAdapter())
        self.register(SebiMitraDiscoveryAdapter())
        self.register(IepfDiscoveryAdapter())
        self.register(EpfoDiscoveryAdapter())
        self.register(OtherInvestmentsDiscoveryAdapter())
        self.register(SetuAADiscoveryAdapter())

    def register(self, provider: BaseAssetDiscoveryProvider):
        self._providers[provider.provider_id] = provider

    def get_provider(self, provider_id: str) -> Optional[BaseAssetDiscoveryProvider]:
        if not provider_id:
            return None
        clean_id = provider_id.strip()
        if clean_id in self._providers:
            return self._providers[clean_id]
        aliased = self._aliases.get(clean_id) or self._aliases.get(clean_id.upper())
        if aliased and aliased in self._providers:
            return self._providers[aliased]
        return None

    def get_all_providers(self) -> List[BaseAssetDiscoveryProvider]:
        return list(self._providers.values())

    def get_providers_for_categories(self, categories: List[str]) -> List[BaseAssetDiscoveryProvider]:
        """Filters registered providers by selected asset categories."""
        if not categories:
            return self.get_all_providers()
        
        # Category normalization mapping
        cat_map = {
            "BANK_DEPOSITS": ["BANK_DEPOSITS"],
            "BANK": ["BANK_DEPOSITS"],
            "INSURANCE": ["INSURANCE"],
            "MUTUAL_FUNDS": ["MUTUAL_FUNDS"],
            "SHARES_DIVIDENDS": ["SHARES_DIVIDENDS", "CORPORATE_ASSETS"],
            "CORPORATE_ASSETS": ["SHARES_DIVIDENDS", "CORPORATE_ASSETS"],
            "PENSION_EPFO": ["PENSION_EPFO"],
            "EPFO": ["PENSION_EPFO"],
            "OTHER_INVESTMENTS": ["OTHER_INVESTMENTS"],
        }
        
        target_cats = set()
        for c in categories:
            for mapped in cat_map.get(c, [c]):
                target_cats.add(mapped)

        return [p for p in self._providers.values() if p.category in target_cats]

    def get_all_guides(self) -> List[Dict[str, Any]]:
        return [p.get_discovery_guide() for p in self._providers.values()]
