import re
from django.shortcuts import render, redirect, get_object_or_404
from decimal import Decimal
from .models import ClaimSession, DiscoveredAsset

def landing(request):
    return render(request, 'landing.html')

def search(request):
    if request.method == 'POST':
        # PAN validation
        pan = request.POST.get('pan_number', '').upper()
        if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', pan):
            return render(request, 'search.html', {'error': 'Invalid PAN format. Please use format ABCDE1234F'})
        
        session = ClaimSession.objects.create(
            deceased_name=request.POST.get('deceased_name'),
            deceased_pan=pan,
            death_certificate_no=request.POST.get('death_certificate_no'),
            death_certificate_file=request.FILES.get('death_certificate_file'),
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
        'fraud_detected': False # Hardcoded safely for testing logic UI
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
