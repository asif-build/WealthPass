"""
Verified Procedures Seed Data for Claim Copilot.
All procedures are derived from official regulatory publications:
- Reserve Bank of India (RBI) Master Circular on Settlement of Claims in respect of Deceased Depositors (DBOD.No.Leg.BC.95/09.07.005/2004-05 & updates).
- Life Insurance Corporation of India (LIC) Citizens' Charter & Form 3783 Statutory Claim Process.
- Employees' Provident Fund Organisation (EPFO) Composite Claim Form / Form 20 & 10D Death Claim Manual.
- Investor Education and Protection Fund Authority (IEPF) IEPF-5 Web-Form Filing Standard Operating Procedure.
- Association of Mutual Funds in India (AMFI) Best Practice Guidelines on Transmission of Units (AMFI/3DF/2022-23).
- Canara Bank Deceased Depositor Settlement Policy (Form 14 / Annexure-I).
"""
import datetime

VERIFIED_PROCEDURES = [
    {
        "institution_id": "sbi",
        "institution_name": "State Bank of India",
        "asset_category": "BANK_DEPOSITS",
        "claim_type": "DECEASED_DEPOSIT_FORM_14",
        "capability_type": "EXTERNAL_GUIDANCE",
        "official_source_url": "https://sbi.co.in/web/customer-care/settlement-of-deceased-depositors-accounts",
        "official_portal_url": "https://sbi.co.in/web/customer-care/settlement-of-deceased-depositors-accounts",
        "form_identifier": "RBI Form 14 / SBI Annexure-A",
        "form_name": "Application for Settlement of Claims of Deceased Depositors",
        "summary": "Statutory application under RBI guidelines for settling savings, current, or term deposits of deceased account holders where nomination is registered or legal heirs apply jointly.",
        "eligibility_notes": "1. If Nomination exists: Nominee obtains immediate settlement against Death Certificate, KYC, and Form 14 receipt within 15 days.\n2. If No Nomination (Threshold up to ₹5,00,000): Settled against Indemnity (Annexure-C) and Legal Heir Declaration without succession certificate.\n3. Above threshold: Succession Certificate, Will with Probate, or Letter of Administration required.",
        "submission_method": "Submission at Account Servicing Home Branch / Any SBI Core Banking Branch Desk with physical KYC verification",
        "direct_api_supported": False,
        "version": "v2024.1",
        "procedure_status": "VERIFIED",
        "verified_by": "WealthPass Regulatory Compliance Desk",
        "step_by_step_instructions": [
            "Download and print official SBI Form 14 (or fill details using WealthPass Copilot guidance).",
            "Collect original death certificate and self-attest 2 photocopies.",
            "Gather claimant KYC (Aadhaar, PAN card, recent photograph) and proof of legal heirship or nominee registration.",
            "Obtain cancelled cheque or bank passbook of your own savings bank account for NEFT/RTGS settlement.",
            "If account balance exceeds ₹5,00,000 without nomination, prepare Annexure-C (Indemnity Bond with two independent sureties).",
            "Submit the physical claim package at the SBI Home Branch servicing desk. Request an official stamped acknowledgement with branch inward number."
        ],
        "required_documents": [
            {"doc_name": "Death Certificate", "description": "Original extract issued by Municipal Corporation / Registrar of Births & Deaths", "mandatory": True, "issuing_authority": "Municipal Corporation / Panchayat"},
            {"doc_name": "Claimant Identity Proof", "description": "Aadhaar Card or PAN Card of claimant / nominee", "mandatory": True, "issuing_authority": "UIDAI / Income Tax Dept"},
            {"doc_name": "Claimant Address Proof", "description": "Voter ID, Passport, Utility Bill, or Aadhaar", "mandatory": True, "issuing_authority": "Govt of India"},
            {"doc_name": "Original Bank Passbook / TDR Receipt", "description": "Passbook or Deposit receipt of the deceased account holder (if available)", "mandatory": False, "issuing_authority": "State Bank of India"},
            {"doc_name": "Cancelled Cheque of Claimant", "description": "Pre-printed claimant account cheque for RTGS/NEFT settlement", "mandatory": True, "issuing_authority": "Claimant's Bank"},
            {"doc_name": "Letter of Indemnity (Annexure-C)", "description": "Required if balance > ₹5,00,000 without registered nominee", "mandatory": False, "issuing_authority": "Notary Public / Stamp Vendor"}
        ],
        "fields_catalog": [
            {
                "field_id": "deceased_name",
                "label": "Name of the Deceased Account Holder",
                "explanation": "Enter the exact full legal name of the deceased depositor as printed on the bank passbook or death certificate.",
                "where_to_find": "Page 1 of SBI Bank Passbook or Death Certificate Section 1.",
                "expected_format": "Full Name matching bank records (e.g. Ramesh Kumar Saini)",
                "supporting_doc": "Death Certificate / Passbook",
                "is_mandatory": True
            },
            {
                "field_id": "account_number",
                "label": "Deceased Account Number(s)",
                "explanation": "The 11-digit SBI Savings, Current, or Term Deposit account number belonging to the deceased.",
                "where_to_find": "Front page of SBI Passbook, fixed deposit receipt, or UDGAM search result.",
                "expected_format": "11 numeric digits (e.g. 20491823719)",
                "supporting_doc": "Bank Passbook / Fixed Deposit Advice / UDGAM Record",
                "is_mandatory": True
            },
            {
                "field_id": "branch_name_ifsc",
                "label": "Home Branch Name & IFSC",
                "explanation": "The specific SBI branch where the deceased maintained their account.",
                "where_to_find": "Top header of the passbook or cheque book leaf.",
                "expected_format": "Branch Name and 11-character IFSC starting with 'SBIN0' (e.g. SBIN0000001)",
                "supporting_doc": "Bank Passbook / Cheque Leaf",
                "is_mandatory": True
            },
            {
                "field_id": "date_of_death",
                "label": "Date of Death",
                "explanation": "The exact date of demise recorded by the civil registration authority.",
                "where_to_find": "Box marked 'Date of Death / मृत्यु दिनांक' on the official death certificate.",
                "expected_format": "DD/MM/YYYY format",
                "supporting_doc": "Death Certificate",
                "is_mandatory": True
            },
            {
                "field_id": "claimant_capacity",
                "label": "Capacity of Claimant",
                "explanation": "Specify whether you are claiming as Registered Nominee, Surviving Legal Heir, Executor of Will, or Administrator.",
                "where_to_find": "Passbook nomination notation ('Nomination Registered: Yes') or Family Tree / Legal Heir Certificate.",
                "expected_format": "Select: Registered Nominee / Legal Heir / Successor",
                "supporting_doc": "Legal Heir Certificate / Passbook / Will",
                "is_mandatory": True
            },
            {
                "field_id": "settlement_account_no",
                "label": "Claimant Settlement Account Number",
                "explanation": "Your active bank account number into which the settled funds must be transferred by electronic NEFT/RTGS.",
                "where_to_find": "Your own bank cheque leaf or account statement.",
                "expected_format": "9 to 18 numeric digits",
                "supporting_doc": "Cancelled Cheque",
                "is_mandatory": True
            },
            {
                "field_id": "settlement_ifsc",
                "label": "Claimant Bank IFSC",
                "explanation": "IFSC code of the claimant's bank branch receiving the payout.",
                "where_to_find": "Claimant's cheque book leaf or bank passbook.",
                "expected_format": "11-character alphanumeric code",
                "supporting_doc": "Cancelled Cheque",
                "is_mandatory": True
            }
        ]
    },
    {
        "institution_id": "canara_bank",
        "institution_name": "Canara Bank",
        "asset_category": "BANK_DEPOSITS",
        "claim_type": "DECEASED_DEPOSIT_FORM_14",
        "capability_type": "EXTERNAL_GUIDANCE",
        "official_source_url": "https://canarabank.com/deceased-claims",
        "official_portal_url": "https://canarabank.com/deceased-claims",
        "form_identifier": "Canara Bank Annexure-I / Form NF-754",
        "form_name": "Claim Form for Settlement of Deceased Depositor Accounts",
        "summary": "Official settlement procedure for savings, recurring, and fixed deposits maintained across Canara Bank branches.",
        "eligibility_notes": "Claim processed within 15 working days from receipt of all KYC documents, death certificate, and settlement indemnity.",
        "submission_method": "Home Branch Submission or Designated Nodal Branch Desk",
        "direct_api_supported": False,
        "version": "v2024.1",
        "procedure_status": "VERIFIED",
        "verified_by": "WealthPass Regulatory Compliance Desk",
        "step_by_step_instructions": [
            "Download Canara Bank Annexure-I claim format.",
            "Complete deceased account reference and claimant KYC declarations.",
            "Submit to the Branch Manager where account was originally held.",
            "Obtain Inward Reference Number on duplicate copy."
        ],
        "required_documents": [
            {"doc_name": "Death Certificate", "description": "Original extract from civil authorities", "mandatory": True, "issuing_authority": "Municipal Authority"},
            {"doc_name": "Claimant Identity Proof", "description": "Aadhaar / PAN Card", "mandatory": True, "issuing_authority": "UIDAI / ITD"},
            {"doc_name": "Cancelled Cheque", "description": "Claimant's active account cheque", "mandatory": True, "issuing_authority": "Claimant's Bank"}
        ],
        "fields_catalog": [
            {
                "field_id": "deceased_name",
                "label": "Deceased Depositor Name",
                "explanation": "Full name of deceased matching Canara Bank records.",
                "where_to_find": "Passbook front page.",
                "expected_format": "Full Name",
                "supporting_doc": "Death Certificate / Passbook",
                "is_mandatory": True
            },
            {
                "field_id": "account_number",
                "label": "Canara Bank Account Number",
                "explanation": "13-digit Canara Bank account number.",
                "where_to_find": "Canara Bank passbook leaf.",
                "expected_format": "13 numeric digits",
                "supporting_doc": "Passbook",
                "is_mandatory": True
            }
        ]
    },
    {
        "institution_id": "lic_india",
        "institution_name": "Life Insurance Corporation of India (LIC)",
        "asset_category": "INSURANCE_LIC",
        "claim_type": "DEATH_CLAIM_FORM_3783",
        "capability_type": "EXTERNAL_GUIDANCE",
        "official_source_url": "https://licindia.in/guidelines-for-settlement-of-claims",
        "official_portal_url": "https://licindia.in/customer-services/help-desk/claim-process",
        "form_identifier": "LIC Form 3783",
        "form_name": "Claimant's Statement for Death Claim Settlement",
        "summary": "Mandatory statutory claim form for death benefit settlement on LIC life insurance and endowment policies.",
        "eligibility_notes": "1. Policy with Nominee: Nominee submits Form 3783, original policy bond, and death certificate for direct NEFT payout.\n2. Policy without Nominee: Requires Title Evidence, Legal Heirship Certificate, and Deed of Indemnity.\n3. Early Death (within 3 years of inception): LIC may initiate a brief inquiry before settlement under Section 45 of Insurance Act.",
        "submission_method": "Submission at the LIC Servicing Branch (branch code indicated on policy bond)",
        "direct_api_supported": False,
        "version": "v2024.1",
        "procedure_status": "VERIFIED",
        "verified_by": "WealthPass Regulatory Compliance Desk",
        "step_by_step_instructions": [
            "Locate LIC 9-digit policy number on the policy document or premium receipt.",
            "Complete LIC Form 3783 (Claimant Statement).",
            "Fill NEFT Mandate form with claimant's bank details and attach cancelled cheque.",
            "Submit original policy document, certified death certificate, and Form 3783 to the Servicing Branch.",
            "Branch issues Claim File Inward Docket for tracking."
        ],
        "required_documents": [
            {"doc_name": "Original Policy Bond", "description": "Original document issued by LIC (or Indemnity Bond in Form 3815 if lost)", "mandatory": True, "issuing_authority": "LIC of India"},
            {"doc_name": "Death Certificate", "description": "Certified copy from local municipal authority", "mandatory": True, "issuing_authority": "Registrar of Deaths"},
            {"doc_name": "Claimant KYC & NEFT Mandate", "description": "Aadhaar, PAN, and bank mandate for direct settlement", "mandatory": True, "issuing_authority": "Claimant / Bank"},
            {"doc_name": "Form 3801 (Medical Attendant Certificate)", "description": "Only required if death occurred in hospital / within 3 years of policy date", "mandatory": False, "issuing_authority": "Treating Hospital"}
        ],
        "fields_catalog": [
            {
                "field_id": "policy_number",
                "label": "LIC Policy Number",
                "explanation": "The 9-digit unique policy number assigned to the life assured.",
                "where_to_find": "Top right corner of LIC Policy Bond or premium renewal receipt.",
                "expected_format": "9 numeric digits (e.g. 182749102)",
                "supporting_doc": "LIC Policy Document / Premium Receipt",
                "is_mandatory": True
            },
            {
                "field_id": "life_assured_name",
                "label": "Name of the Life Assured",
                "explanation": "Full name of the deceased insured person as recorded on the policy bond.",
                "where_to_find": "Schedule box of policy bond under 'Name of Life Assured'.",
                "expected_format": "Full Name",
                "supporting_doc": "Policy Bond / Death Certificate",
                "is_mandatory": True
            },
            {
                "field_id": "cause_of_death",
                "label": "Nature and Cause of Death",
                "explanation": "Medical cause of death as stated by attending physician or death certificate.",
                "where_to_find": "Medical cause section of hospital discharge/death summary or post-mortem report (if accidental).",
                "expected_format": "Text explanation (e.g. Cardiac arrest / Natural causes)",
                "supporting_doc": "Death Summary / Doctor Certificate",
                "is_mandatory": True
            },
            {
                "field_id": "claimant_relation",
                "label": "Relationship with Deceased",
                "explanation": "State your legal relationship with the deceased (Spouse, Child, Parent, etc.).",
                "where_to_find": "Nomination clause on policy bond.",
                "expected_format": "Spouse / Son / Daughter / Father / Mother",
                "supporting_doc": "Aadhaar / Legal Heir Certificate",
                "is_mandatory": True
            }
        ]
    },
    {
        "institution_id": "epfo",
        "institution_name": "Employees' Provident Fund Organisation (EPFO)",
        "asset_category": "EPF_PENSION",
        "claim_type": "EPFO_DEATH_COMPOSITE_FORM_20_10D",
        "capability_type": "EXTERNAL_GUIDANCE",
        "official_source_url": "https://www.epfindia.gov.in/site_en/Death_Claims.php",
        "official_portal_url": "https://unifiedportal-mem.epfindia.gov.in/memberinterface/",
        "form_identifier": "Composite Claim Form (Death) / Form 20, 10D, 5IF",
        "form_name": "Composite Claim Form in Case of Death of Member (EPF, EPS, EDLI)",
        "summary": "Statutory recovery of deceased employee's provident fund accumulations, monthly widow/children pension (EPS), and EDLI life insurance benefit (up to ₹7,00,000).",
        "eligibility_notes": "1. Nominee registered under Form 2 (e-Nomination) can claim online via EPFO Member Portal.\n2. In absence of nomination: Surviving family members (widow, children, dependent parents) can submit physical Composite Claim Form attested by employer.\n3. EDLI Insurance: Beneficiaries are eligible for life insurance up to ₹7,00,000 if member was in active service at time of death.",
        "submission_method": "Online via EPFO Unified Member Portal (if e-Nomination active) OR Physical filing at Field PF Office through last employer",
        "direct_api_supported": False,
        "version": "v2024.1",
        "procedure_status": "VERIFIED",
        "verified_by": "WealthPass Regulatory Compliance Desk",
        "step_by_step_instructions": [
            "Check if deceased had an active 12-digit UAN and e-Nomination on the EPFO portal.",
            "If e-Nomination exists: Nominee logs into Member Portal with their own login to submit online claim.",
            "If no e-Nomination: Download physical Composite Claim Form in Death Cases.",
            "Get the form attested and stamped by the deceased's last employer (or authorised bank manager if employer closed).",
            "Attach member death certificate, joint photograph of legal heirs, and cancelled cheques.",
            "Submit to the Regional PF Commissioner (RPFC) holding jurisdiction over the employer."
        ],
        "required_documents": [
            {"doc_name": "Death Certificate", "description": "Original extract from civil authorities", "mandatory": True, "issuing_authority": "Municipal Corporation"},
            {"doc_name": "Composite Claim Form (Death)", "description": "Duly filled and employer-attested claim form", "mandatory": True, "issuing_authority": "EPFO / Employer"},
            {"doc_name": "Cancelled Cheque / Bank Passbook", "description": "Beneficiary account with IFSC code clearly visible", "mandatory": True, "issuing_authority": "Beneficiary's Bank"},
            {"doc_name": "Family Member Certificate / Form 2", "description": "Proof of family members and date of birth of minor children", "mandatory": True, "issuing_authority": "Revenue Authority / Employer"}
        ],
        "fields_catalog": [
            {
                "field_id": "uan",
                "label": "Universal Account Number (UAN)",
                "explanation": "The 12-digit permanent account number assigned to the EPF member.",
                "where_to_find": "Monthly salary slip of deceased or EPF Member Passbook.",
                "expected_format": "12 numeric digits (e.g. 101928374829)",
                "supporting_doc": "Salary Slip / EPF Passbook",
                "is_mandatory": True
            },
            {
                "field_id": "member_id",
                "label": "EPF Member ID (PF Account Number)",
                "explanation": "The establishment code and extension identifier representing the specific employer account.",
                "where_to_find": "Salary slip or PF Annual Statement (e.g. MHBAN00123450000012345).",
                "expected_format": "Alphanumeric EPFO format",
                "supporting_doc": "Salary Slip / Form 16",
                "is_mandatory": True
            },
            {
                "field_id": "date_of_leaving",
                "label": "Date of Demise / Exit",
                "explanation": "Date when service ended due to death.",
                "where_to_find": "Service register or Death Certificate.",
                "expected_format": "DD/MM/YYYY",
                "supporting_doc": "Death Certificate",
                "is_mandatory": True
            }
        ]
    },
    {
        "institution_id": "iepf",
        "institution_name": "Investor Education and Protection Fund Authority (IEPF)",
        "asset_category": "SHARES_DIVIDENDS",
        "claim_type": "IEPF_5_WEB_FORM_TRANSMISSION",
        "capability_type": "EXTERNAL_GUIDANCE",
        "official_source_url": "https://www.iepf.gov.in/content/iepf/global/master/home/claim-refund/claim-refund.html",
        "official_portal_url": "https://www.mca.gov.in/mcafoportal/iepf5Service.do",
        "form_identifier": "MCA IEPF-5 Web-Form",
        "form_name": "Application to the Authority for Claiming Unpaid Amounts and Shares",
        "summary": "Statutory recovery of dividends and physical or demat shares transferred to the IEPF Authority under Section 124(6) of Companies Act 2013.",
        "eligibility_notes": "1. In case of deceased shareholder, legal heirs must first obtain Transmission Confirmation / Entitlement Letter from the Company's Registrar & Transfer Agent (RTA).\n2. Once RTA confirms entitlement, claimant files e-form IEPF-5 on MCA21 portal with Digital Signature (DSC) or Aadhaar e-Sign.",
        "submission_method": "Online Web-form submission on MCA21 portal + Physical submission of signed indemnity & original share certificate to Company Nodal Officer",
        "direct_api_supported": False,
        "version": "v2024.1",
        "procedure_status": "VERIFIED",
        "verified_by": "WealthPass Regulatory Compliance Desk",
        "step_by_step_instructions": [
            "Contact Company RTA (e.g. KFin Technologies / Link Intime) to request transmission of shares in claimant's name.",
            "Obtain Entitlement Letter from the Company Nodal Officer.",
            "Create user account on Ministry of Corporate Affairs (MCA21) portal.",
            "Fill IEPF-5 online form, entering Company CIN, Folio Number, and Demat Account (BOID).",
            "Submit online, pay nil fee, and download generated SRN Acknowledgement and IEPF-5 PDF.",
            "Dispatch physical dossier (Form IEPF-5, original indemnity on stamp paper, advance receipt, and share certificates) to Company Nodal Officer within 15 days."
        ],
        "required_documents": [
            {"doc_name": "IEPF-5 SRN Acknowledgement", "description": "Challan generated after MCA21 web-form filing", "mandatory": True, "issuing_authority": "MCA21"},
            {"doc_name": "Indemnity Bond (Non-Judicial Stamp Paper)", "description": "Executed indemnity as per MCA prescribed format", "mandatory": True, "issuing_authority": "Notary / State Treasury"},
            {"doc_name": "Advance Stamped Receipt", "description": "Form with revenue stamp signed by claimant", "mandatory": True, "issuing_authority": "Claimant"},
            {"doc_name": "Client Master List (CML)", "description": "Demat account statement stamped by Depository Participant", "mandatory": True, "issuing_authority": "NSDL / CDSL DP"},
            {"doc_name": "Original Share Certificate", "description": "Physical share certificate or RTA Entitlement Letter", "mandatory": True, "issuing_authority": "Issuing Corporate / RTA"}
        ],
        "fields_catalog": [
            {
                "field_id": "company_cin",
                "label": "Corporate Identification Number (CIN)",
                "explanation": "The 21-digit alphanumeric code identifying the company whose shares/dividends are held.",
                "where_to_find": "MCA company directory or share certificate header.",
                "expected_format": "21-character alphanumeric (e.g. L65110MH1994PLC080870)",
                "supporting_doc": "Share Certificate / MCA Records",
                "is_mandatory": True
            },
            {
                "field_id": "folio_number",
                "label": "Company Folio Number / DP ID Client ID",
                "explanation": "The ledger folio number recorded in company books or your demat account number.",
                "where_to_find": "Face of physical share certificate or dividend warrant.",
                "expected_format": "Alphanumeric folio or 16-digit Demat ID",
                "supporting_doc": "Share Certificate / Dividend Advice",
                "is_mandatory": True
            },
            {
                "field_id": "demat_boid",
                "label": "Claimant Demat Account (BOID)",
                "explanation": "Target 16-digit Demat Account into which IEPF Authority will credit the recovered shares.",
                "where_to_find": "Your Demat Client Master List (CML) from Zerodha, Groww, ICICI Direct, etc.",
                "expected_format": "16 numeric digits (CDSL) or 'IN' followed by 14 digits (NSDL)",
                "supporting_doc": "Client Master List (CML)",
                "is_mandatory": True
            }
        ]
    },
    {
        "institution_id": "cams_kfintech",
        "institution_name": "Mutual Funds (AMFI / CAMS / KFintech)",
        "asset_category": "MUTUAL_FUNDS",
        "claim_type": "MF_TRANSMISSION_FORM_T3",
        "capability_type": "EXTERNAL_GUIDANCE",
        "official_source_url": "https://www.camsonline.com/Investors/Service-requests/Transmission",
        "official_portal_url": "https://www.camsonline.com/Investors/Service-requests/Transmission",
        "form_identifier": "AMFI Form T3 (Transmission on Death)",
        "form_name": "Standard Mutual Fund Transmission Request Form",
        "summary": "Unified transmission of mutual fund units held across AMCs to registered nominee or surviving legal heirs.",
        "eligibility_notes": "1. Registered Nominee: Submit Form T3, death certificate, self-attested KYC (PAN & KYC acknowledgement), and bank mandate with cancelled cheque.\n2. No Nominee (Value up to ₹5 Lakhs): Settled against Indemnity Bond (Annexure-I) and Individual Affidavits.\n3. No Nominee (Value > ₹5 Lakhs): Succession Certificate, Probate of Will, or Legal Heirship Certificate required.",
        "submission_method": "Submission at any CAMS or KFintech Investor Service Centre (ISC) or AMC branch",
        "direct_api_supported": False,
        "version": "v2024.1",
        "procedure_status": "VERIFIED",
        "verified_by": "WealthPass Regulatory Compliance Desk",
        "step_by_step_instructions": [
            "Obtain Consolidated Account Statement (CAS) to list all folios across mutual fund houses.",
            "Complete AMFI Form T3 specifying fund names and folio numbers.",
            "Ensure claimant has completed mutual fund KYC (KRA-compliant PAN).",
            "Attach attested death certificate and claimant's cancelled cheque leaf.",
            "Submit to nearest CAMS or KFintech Investor Service Centre to receive an acknowledgement receipt."
        ],
        "required_documents": [
            {"doc_name": "Death Certificate", "description": "Attested copy from municipal registrar", "mandatory": True, "issuing_authority": "Municipal Registrar"},
            {"doc_name": "AMFI Form T3", "description": "Transmission request form signed by nominee / legal heir", "mandatory": True, "issuing_authority": "AMFI / CAMS"},
            {"doc_name": "Claimant KYC Acknowledgement", "description": "KRA validated KYC status (NDML, CVL, CAMS KRA)", "mandatory": True, "issuing_authority": "SEBI KRA"},
            {"doc_name": "Cancelled Cheque Leaf", "description": "Cheque with claimant name pre-printed", "mandatory": True, "issuing_authority": "Claimant's Bank"}
        ],
        "fields_catalog": [
            {
                "field_id": "folio_number",
                "label": "Mutual Fund Folio Number",
                "explanation": "Unique folio number representing unit holdings with the Asset Management Company.",
                "where_to_find": "Consolidated Account Statement (CAS) or SOA statement.",
                "expected_format": "Alphanumeric folio (e.g. 1049281/92)",
                "supporting_doc": "CAS Statement",
                "is_mandatory": True
            },
            {
                "field_id": "amc_name",
                "label": "Asset Management Company (Fund House)",
                "explanation": "Name of the AMC managing the mutual fund (e.g. HDFC Mutual Fund, SBI MF, ICICI Prudential).",
                "where_to_find": "Top header of mutual fund account statement.",
                "expected_format": "AMC Name",
                "supporting_doc": "CAS Statement",
                "is_mandatory": True
            },
            {
                "field_id": "claimant_pan",
                "label": "Claimant PAN (KRA Verified)",
                "explanation": "Permanent Account Number of the claimant. Must be KYC-compliant with SEBI KRA.",
                "where_to_find": "Claimant PAN card.",
                "expected_format": "10-character alphanumeric (5 letters, 4 digits, 1 letter)",
                "supporting_doc": "PAN Card",
                "is_mandatory": True
            }
        ]
    }
]
