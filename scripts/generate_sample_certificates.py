"""
Script to generate synthetic, highly legible Indian civil evidence PDF documents
tailored for WealthPass OCR extraction and relationship consistency assessment.
"""
import os
import re

def create_raw_pdf(filename: str, title: str, doc_number: str, data_rows: list, footer_text: str):
    """
    Creates a valid, uncompressed PDF 1.4 file with vector borders,
    headers, official seal placeholder, and tabular civil data.
    Being uncompressed, it's 100% extractable by WealthPass OCR,
    pdfplumber, pypdf, and standard PDF text stream scanners.
    """
    commands = []
    
    # Page setup: A4 is 595 x 842 pt
    # Outer Border (Gold/Navy double border)
    commands.append("0.05 0.25 0.55 RG") # Dark Navy stroke
    commands.append("2 w")
    commands.append("30 30 535 782 re S")
    commands.append("0.1 0.3 0.6 RG")
    commands.append("0.75 w")
    commands.append("35 35 525 772 re S")

    # Header Box
    commands.append("0.92 0.95 1.0 rg") # Light blue fill
    commands.append("36 740 523 65 re f")
    commands.append("0.1 0.3 0.6 RG")
    commands.append("1 w")
    commands.append("36 740 523 65 re S")

    # Header Text
    commands.append("BT")
    commands.append("/F1 14 Tf")
    commands.append("0.05 0.2 0.5 rg")
    commands.append("160 780 Td (GOVERNMENT OF MAHARASHTRA) Tj")
    commands.append("ET")

    commands.append("BT")
    commands.append("/F1 13 Tf")
    commands.append("0.05 0.2 0.5 rg")
    commands.append("100 762 Td (MUNICIPAL CORPORATION OF GREATER MUMBAI) Tj")
    commands.append("ET")

    commands.append("BT")
    commands.append("/F2 9 Tf")
    commands.append("0.2 0.2 0.2 rg")
    commands.append("165 747 Td (DEPARTMENT OF HEALTH AND FAMILY WELFARE) Tj")
    commands.append("ET")

    # Certificate Title Ribbon
    commands.append("0.05 0.25 0.55 rg")
    commands.append("36 705 523 25 re f")
    commands.append("BT")
    commands.append("/F1 11 Tf")
    commands.append("1.0 1.0 1.0 rg")
    commands.append(f"140 713 Td ({title}) Tj")
    commands.append("ET")

    # Statutory Subtitle
    commands.append("BT")
    commands.append("/F2 8 Tf")
    commands.append("0.3 0.3 0.3 rg")
    commands.append("105 690 Td ((ISSUED UNDER SECTION 12/17 OF REGISTRATION OF BIRTHS AND DEATHS ACT, 1969)) Tj")
    commands.append("ET")

    # Registration Bar
    commands.append("0.95 0.96 0.98 rg")
    commands.append("45 650 505 28 re f")
    commands.append("0.7 0.7 0.8 RG")
    commands.append("0.5 w")
    commands.append("45 650 505 28 re S")

    commands.append("BT")
    commands.append("/F1 10 Tf")
    commands.append("0.1 0.1 0.1 rg")
    commands.append(f"55 660 Td (Registration Number: {doc_number}) Tj")
    commands.append("ET")

    commands.append("BT")
    commands.append("/F2 9 Tf")
    commands.append("0.2 0.2 0.2 rg")
    commands.append("380 660 Td (Issuance Date: 15/05/2023) Tj")
    commands.append("ET")

    # Table of Records
    y = 615
    commands.append("0.8 0.8 0.85 RG")
    commands.append("0.5 w")

    for label, val in data_rows:
        # Alternating row background
        commands.append("0.98 0.98 0.99 rg")
        commands.append(f"45 {y - 6} 505 22 re f")
        commands.append(f"45 {y - 6} 505 22 re S")

        # Label (Bold F1)
        commands.append("BT")
        commands.append("/F1 9 Tf")
        commands.append("0.15 0.25 0.4 rg")
        commands.append(f"55 {y} Td ({label}) Tj")
        commands.append("ET")

        # Value (Regular F2)
        commands.append("BT")
        commands.append("/F2 9 Tf")
        commands.append("0.05 0.05 0.05 rg")
        commands.append(f"230 {y} Td ({val}) Tj")
        commands.append("ET")

        y -= 26

    # Official Seal and Authority Box
    y -= 15
    commands.append("0.92 0.95 1.0 rg")
    commands.append(f"45 {y - 65} 505 70 re f")
    commands.append("0.2 0.4 0.7 RG")
    commands.append("0.75 w")
    commands.append(f"45 {y - 65} 505 70 re S")

    commands.append("BT")
    commands.append("/F1 9 Tf")
    commands.append("0.05 0.2 0.5 rg")
    commands.append(f"55 {y - 12} Td (ISSUING CIVIL REGISTRATION AUTHORITY:) Tj")
    commands.append("ET")

    commands.append("BT")
    commands.append("/F2 8.5 Tf")
    commands.append("0.1 0.1 0.1 rg")
    commands.append(f"55 {y - 28} Td (Municipal Corporation of Greater Mumbai - Health Department) Tj")
    commands.append(f"55 {y - 42} Td (Ward G/South, Elphinstone Road, Mumbai, Maharashtra 400012) Tj")
    commands.append(f"55 {y - 56} Td (Jurisdiction: State of Maharashtra, Republic of India) Tj")
    commands.append("ET")

    # Digital Signature Block (Right side)
    commands.append("BT")
    commands.append("/F1 8.5 Tf")
    commands.append("0.1 0.5 0.2 rg")
    commands.append(f"340 {y - 15} Td ([DIGITALLY SIGNED & VERIFIED]) Tj")
    commands.append("ET")

    commands.append("BT")
    commands.append("/F2 8 Tf")
    commands.append("0.2 0.2 0.2 rg")
    commands.append(f"340 {y - 30} Td (Registrar of Births and Deaths) Tj")
    commands.append(f"340 {y - 44} Td (Signer ID: MH-MCGM-REG-44910) Tj")
    commands.append(f"340 {y - 58} Td (Timestamp: 15-May-2023 11:42:09 IST) Tj")
    commands.append("ET")

    # Statutory Footer
    commands.append("BT")
    commands.append("/F2 7.5 Tf")
    commands.append("0.4 0.4 0.4 rg")
    commands.append(f"50 60 Td ({footer_text}) Tj")
    commands.append("50 48 Td (Generated for official statutory inheritance and asset recovery verification under WealthPass protocol.) Tj")
    commands.append("ET")

    stream_content = "\n".join(commands).encode("latin1")
    stream_len = len(stream_content)

    # Build PDF Objects
    objects = []
    
    # Obj 1: Catalog
    objects.append(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    
    # Obj 2: Pages
    objects.append(b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")
    
    # Obj 3: Page
    objects.append(b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n")
    
    # Obj 4: Contents stream
    obj4 = f"4 0 obj\n<< /Length {stream_len} >>\nstream\n".encode("latin1") + stream_content + b"\nendstream\nendobj\n"
    objects.append(obj4)
    
    # Obj 5: Font F1 (Helvetica-Bold)
    objects.append(b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n")
    
    # Obj 6: Font F2 (Helvetica)
    objects.append(b"6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")

    # Assemble PDF with cross-reference table
    output = bytearray(b"%PDF-1.4\n")
    offsets = []
    
    for obj in objects:
        offsets.append(len(output))
        output.extend(obj)
        
    startxref = len(output)
    output.extend(b"xref\n0 7\n0000000000 65535 f \n")
    for off in offsets:
        output.extend(f"{off:010d} 00000 n \n".encode("latin1"))
        
    output.extend(f"trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n{startxref}\n%%EOF\n".encode("latin1"))

    os.makedirs(os.path.dirname(os.path.abspath(filename)), exist_ok=True)
    with open(filename, "wb") as f:
        f.write(output)
    
    print(f"Generated {filename} ({len(output)} bytes)")
    return filename


def generate_all_samples():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    media_dir = os.path.join(base_dir, "media", "samples")
    static_dir = os.path.join(base_dir, "static", "samples")
    
    for target_dir in [media_dir, static_dir]:
        # 1. Primary Kinship Evidence: Birth / Kinship Certificate
        # Matches: Claimant = Sunita Sharma, Deceased Parent = Rajesh Kumar Sharma
        rel_pdf = os.path.join(target_dir, "sample_relationship_evidence.pdf")
        create_raw_pdf(
            filename=rel_pdf,
            title="FORM NO. 5 -- CERTIFICATE OF BIRTH & STATUTORY KINSHIP",
            doc_number="MCGM/BIRTH/2023/88921",
            data_rows=[
                ("Child / Claimant Full Name:", "Sunita Sharma"),
                ("Sex / Gender:", "Female"),
                ("Date of Birth:", "14/08/1988"),
                ("Place of Birth:", "K.E.M. Municipal Hospital, Parel, Mumbai"),
                ("Father's Name (Deceased):", "Rajesh Kumar Sharma"),
                ("Mother's Name:", "Kavita Sharma"),
                ("Permanent Residence:", "Flat 402, Shivam Residency, Prabhadevi, Mumbai 400025"),
                ("Date of Registration:", "20/08/1988"),
                ("Registration Number:", "MCGM/BIRTH/2023/88921"),
                ("Declared Legal Heirship:", "Class 1 Legal Heir (Daughter)"),
            ],
            footer_text="Certified True Extract from Civil Register of Births maintained under statutory provisions."
        )

        # 2. Death Certificate
        # Matches: Deceased = Rajesh Kumar Sharma, Certificate = MCGM/2023/88921
        death_pdf = os.path.join(target_dir, "sample_death_certificate.pdf")
        create_raw_pdf(
            filename=death_pdf,
            title="FORM NO. 6 -- CERTIFICATE OF DEATH",
            doc_number="MCGM/2023/88921",
            data_rows=[
                ("Name of Deceased:", "Late Shri Rajesh Kumar Sharma"),
                ("Sex / Gender:", "Male"),
                ("Date of Death:", "12/04/2023"),
                ("Place of Death:", "Lilavati Hospital, Bandra West, Mumbai"),
                ("Permanent Address:", "Flat 402, Shivam Residency, Prabhadevi, Mumbai 400025"),
                ("Father's Name:", "Gopal Krishna Sharma"),
                ("Spouse / Surviving Kin:", "Sunita Sharma (Daughter / Informant)"),
                ("Date of Registration:", "18/04/2023"),
                ("Registration Number:", "MCGM/2023/88921"),
                ("Cause of Death:", "Natural Causes (Certified by Chief Medical Officer)"),
            ],
            footer_text="Certified True Extract from Civil Register of Deaths under Section 12/17 of Act 18 of 1969."
        )

        # 3. Succession / Legal Heir Certificate
        heir_pdf = os.path.join(target_dir, "sample_legal_heir_certificate.pdf")
        create_raw_pdf(
            filename=heir_pdf,
            title="OFFICE OF THE TAHSILDAR -- LEGAL HEIR CERTIFICATE",
            doc_number="MH-REV-LHC-2023-99412",
            data_rows=[
                ("Name of Deceased:", "Rajesh Kumar Sharma"),
                ("Date of Demise:", "12/04/2023"),
                ("Primary Claimant / Legal Heir:", "Sunita Sharma"),
                ("Relationship to Deceased:", "Daughter (Class 1 Legal Heir)"),
                ("Family Tree Survivor 1:", "Sunita Sharma (Daughter, Age 35)"),
                ("Family Tree Survivor 2:", "Arun Sharma (Son, Age 32)"),
                ("Issuing Authority:", "Revenue Department, Tahsildar Office, Mumbai City"),
                ("Order / Case Number:", "REV/CASE/2023/419"),
                ("Issuance Date:", "10/06/2023"),
                ("Statutory Purpose:", "Asset Transmission and Banking Succession Claim"),
            ],
            footer_text="Issued by Sub-Divisional Magistrate / Tahsildar pursuant to statutory succession enquiry."
        )

if __name__ == "__main__":
    generate_all_samples()
