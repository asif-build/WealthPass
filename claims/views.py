import re
from django.shortcuts import render, redirect, get_object_or_404
from decimal import Decimal
from .models import ClaimSession, DiscoveredAsset
from django.http import JsonResponse
from .ocr import extract_text


def landing(request):
    return render(request, 'landing.html')

def search(request):
    if request.method == 'POST':

        # PAN validation
        pan = request.POST.get('pan_number', '').upper()

        if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', pan):
            return render(request, 'search.html', {
                'error': 'Invalid PAN format'
            })

        uploaded_file = request.FILES.get('death_certificate_file')

        ocr_text = ""

        if uploaded_file:
            try:
                ocr_text = extract_text(uploaded_file)
                uploaded_file.seek(0)

                print("OCR RESULT:")
                print(repr(ocr_text))

            except Exception as e:
                ocr_text = f"OCR Failed: {str(e)}"

        deceased_name = request.POST.get('deceased_name', '')
        cert_no = request.POST.get('death_certificate_no', '')
        
        match_score = 0
        fraud_risk = 'LOW'
        v_status = 'PENDING'

        if ocr_text and not ocr_text.startswith("OCR Failed"):
            ocr_lower = ocr_text.lower()
            if deceased_name.lower() in ocr_lower and deceased_name.strip() != '':
                match_score += 40
            if cert_no.lower() in ocr_lower and cert_no.strip() != '':
                match_score += 40
            if "death certificate" in ocr_lower:
                match_score += 20
                
            if match_score >= 70:
                v_status = 'VERIFIED'
            else:
                v_status = 'REJECTED'
                fraud_risk = 'HIGH' if match_score < 40 else 'MEDIUM'
        else:
            v_status = 'NEEDS REVIEW'
            fraud_risk = 'MEDIUM'

        session = ClaimSession.objects.create(
            deceased_name=deceased_name,
            deceased_pan=pan,
            death_certificate_no=cert_no,
            death_certificate_file=uploaded_file,
            ocr_result=ocr_text,
            match_score=match_score,
            verification_status=v_status,
            fraud_risk_level=fraud_risk,
            claimant_name=request.POST.get('claimant_name'),
            claimant_aadhaar_last4=request.POST.get('aadhaar_last4'),
            relation=request.POST.get('relation'),
            mobile=request.POST.get('mobile')
        )

        return redirect('verify', session_id=session.id)

    return render(request, 'search.html')

def verify(request, session_id):
    session = get_object_or_404(ClaimSession, id=session_id)
    
    # Mock data generation if not generated
    if not session.assets.exists() and session.status == 'pending':
        # Create some mock assets
        a1 = DiscoveredAsset.objects.create(
            session=session,
            institution="LIC Insurance",
            amount=Decimal('500000'),
            situation_label="✅ You are the Nominee",
            color="green",
            message="We found an active LIC Jeevan Anand policy. You are listed directly as the 100% nominee. Processing priority is extremely high.",
            documents_needed=["Death Certificate (Uploaded)", "Aadhaar Card (Verified)", "Original Policy Bond", "Form 3783 (Pre-filled via WealthPass)"],
            next_steps=["Download pre-filled Form 3783", "Sign and physically mail with Policy Bond", "LIC verifies physical packet (30 days)", "Amount RTGS to your bank"],
            time_estimate="4-6 Weeks expected timeframe",
            loan_amount=Decimal('38000')
        )
        a2 = DiscoveredAsset.objects.create(
            session=session,
            institution="State Bank of India",
            amount=Decimal('142000'),
            situation_label="⚠️ Legal Priority Detected",
            color="amber",
            message="This savings account has a different sibling listed as nominee, but as a Class 1 legal heir, you maintain equal priority rights under the Hindu Succession Act. Claim requires NOC.",
            documents_needed=["Death Certificate (Uploaded)", "Aadhaar Card (Verified)", "NOC from sibling (Template provided)"],
            next_steps=["Obtain signatures on NOC", "Upload signed NOC", "Bank verification (14 days)", "Amount release"],
            time_estimate="8-12 Weeks expected timeframe",
            loan_amount=Decimal('10000')
        )
        session.total_assets_found = a1.amount + a2.amount
        session.bridge_loan_available = a1.loan_amount + a2.loan_amount
        session.status = 'verified'
        session.save()
    
    context = {
        'session_id': session.id,
        'claimant_name': session.claimant_name,
        'deceased_name': session.deceased_name,
        'death_certificate_no': session.death_certificate_no,
        'created_at': session.created_at,
        'fraud_detected': session.verification_status == 'REJECTED',
        'verification_status': session.verification_status,
        'match_score': session.match_score,
        'fraud_risk_level': session.fraud_risk_level,
        'ocr_result': session.ocr_result,
    }
    return render(request, 'verify.html', context)

def results(request, session_id):
    session = get_object_or_404(ClaimSession, id=session_id)
    context = {
        'session_id': session.id,
        'deceased_name': session.deceased_name,
        'claimant_name': session.claimant_name,
        'relation': session.relation,
        'total_assets': session.total_assets_found,
        'total_loan': session.bridge_loan_available,
        'classified_assets': session.assets.all(),
    }
    return render(request, 'results.html', context)

def loan(request, session_id):
    session = get_object_or_404(ClaimSession, id=session_id)
        
    context = {
        'session_id': session.id,
        'total_assets': session.total_assets_found,
        'loan_amount': session.bridge_loan_available,
    }
    return render(request, 'loan.html', context)

def accept_loan(request, session_id):
    session = get_object_or_404(ClaimSession, id=session_id)
    if request.method == 'POST':
        session.status = 'loan_accepted'
        session.save()
        return redirect('success', session_id=session.id)
    return redirect('loan', session_id=session.id)

def success(request, session_id):
    session = get_object_or_404(ClaimSession, id=session_id)
    context = {
        'loan_amount': session.bridge_loan_available,
        'account_last4': session.claimant_aadhaar_last4, # using aadhaar as proxy for mock
        'reference_no': f"WP-TXN-{str(session.id)[:6].upper()}"
    }
    return render(request, 'success.html', context)

def print_forms(request, session_id):
    session = get_object_or_404(ClaimSession, id=session_id)
    # Get all required docs from assets to show in the PDF
    required_docs = []
    for asset in session.assets.all():
        for doc in asset.documents_needed:
            if doc not in required_docs:
                required_docs.append(doc)
                
    context = {
        'session_id': session.id,
        'claimant_name': session.claimant_name,
        'claimant_last4': session.claimant_aadhaar_last4,
        'deceased_name': session.deceased_name,
        'pan': session.deceased_pan,
        'cert_no': session.death_certificate_no,
        'relation': session.relation,
        'assets': session.assets.all(),
        'docs': required_docs,
        'total_amount': session.total_assets_found
    }
    return render(request, 'print_forms.html', context)

def scan_document(request):
    if request.method == "POST":
        file = request.FILES.get("file")

        if not file:
            return JsonResponse({
                "success": False,
                "error": "No file uploaded"
            })

        text = extract_text(file)

        return JsonResponse({
            "success": True,
            "text": text
        })

    return JsonResponse({
        "success": False,
        "error": "POST request only"
    })