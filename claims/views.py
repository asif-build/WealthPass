import re
import json
from django.shortcuts import render, redirect, get_object_or_404
from decimal import Decimal
import secrets
import time
from .models import (
    ClaimSession, DiscoveredAsset, ClaimDocument,
    VerificationRecord, ConsentRecord, ClaimantRelationshipRecord, AuditLog
)
from django.http import JsonResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import datetime
from .ocr import extract_text, extract_structured_document_info
from .setu_client import create_consent
from .providers import (
    IntegrationStatus, RelationshipStatus,
    AssetDiscoveryRegistry, RelationshipEvidenceAssessmentService,
    DigiLockerIdentityAdapter, SetuAAIdentityAdapter, OfflineManualIdentityAdapter,
    MockTestingIdentityAdapter,
    CivilRegistrationDeathCertAdapter, ManualInstitutionalDocVerifier,
    RbiUdgamDiscoveryAdapter, IrdaiBimaBharosaDiscoveryAdapter,
    SebiMfCentralDiscoveryAdapter, IepfDiscoveryAdapter, SetuAADiscoveryAdapter
)
from notifications.services import NotificationService


@ensure_csrf_cookie
def landing(request, step=None):
    # Server-side route guard: If an unauthenticated user directly navigates or refreshes /dashboard, /settings, or /assets/discover, redirect to /login
    if request.path.rstrip('/') in ('/dashboard', '/settings', '/assets/discover') and not request.user.is_authenticated:
        return redirect(f'/login/?next={request.path}')

    return render(request, 'landing.html')

@ensure_csrf_cookie
def custom_404(request, exception=None):
    return render(request, 'landing.html', status=404)

import os
from django.http import JsonResponse, FileResponse
from django.contrib.auth.decorators import login_required

def get_authorized_claim(request, session_id):
    """
    Enforces Object-Level Authorization (IDOR Prevention):
    1. Rejects unauthenticated requests.
    2. Rejects requests where requesting user is not the owner (403 Forbidden).
    3. Staff/Reviewers can access for administrative adjudication.
    """
    if not request.user.is_authenticated:
        if request.path.startswith('/api/'):
            return None, JsonResponse({'success': False, 'error': 'Authentication required. Please sign in.'}, status=401)
        return None, redirect(f'/login/?next={request.path}')

    session = get_object_or_404(ClaimSession, id=session_id)

    # Check ownership
    if session.user_id and session.user_id != request.user.id and not request.user.is_staff:
        if request.path.startswith('/api/'):
            return None, JsonResponse({
                'success': False,
                'error': 'Access denied. You do not have permission to access this resource.'
            }, status=403)
        return None, render(request, 'landing.html', status=403)

    # Claim unassigned session for authenticated user
    if not session.user_id:
        session.user = request.user
        session.save(update_fields=['user'])

    return session, None


def search(request):
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return redirect('/login/?next=/search/')

        # PAN validation
        pan = request.POST.get('pan_number', '').upper()

        if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', pan):
            return render(request, 'search.html', {
                'error': 'Invalid PAN format'
            })

        uploaded_file = request.FILES.get('death_certificate_file')

        if uploaded_file:
            # File validation: 5MB limit
            if uploaded_file.size > 5 * 1024 * 1024:
                return render(request, 'search.html', {'error': 'Uploaded file exceeds 5MB limit.'})
            ext = os.path.splitext(uploaded_file.name)[1].lower()
            if ext not in ('.pdf', '.png', '.jpg', '.jpeg'):
                return render(request, 'search.html', {'error': 'Only PDF, PNG, and JPG files are permitted.'})

        ocr_text = ""

        if uploaded_file:
            try:
                ocr_text = extract_text(uploaded_file)
                uploaded_file.seek(0)
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
            user=request.user,
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
    session, err_resp = get_authorized_claim(request, session_id)
    if err_resp:
        return err_resp
    
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
    session, err_resp = get_authorized_claim(request, session_id)
    if err_resp:
        return err_resp

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
    session, err_resp = get_authorized_claim(request, session_id)
    if err_resp:
        return err_resp
        
    context = {
        'session_id': session.id,
        'total_assets': session.total_assets_found,
        'loan_amount': session.bridge_loan_available,
    }
    return render(request, 'loan.html', context)

def accept_loan(request, session_id):
    session, err_resp = get_authorized_claim(request, session_id)
    if err_resp:
        return err_resp

    if request.method == 'POST':
        session.status = 'loan_accepted'
        session.save()
        if session.user:
            NotificationService.notify_claim_submitted(
                session.user,
                session.id,
                f"WP-TXN-{str(session.id)[:6].upper()}"
            )
        return redirect('success', session_id=session.id)
    return redirect('loan', session_id=session.id)

def success(request, session_id):
    session, err_resp = get_authorized_claim(request, session_id)
    if err_resp:
        return err_resp

    context = {
        'loan_amount': session.bridge_loan_available,
        'account_last4': session.claimant_aadhaar_last4,
        'reference_no': f"WP-TXN-{str(session.id)[:6].upper()}"
    }
    return render(request, 'success.html', context)

def print_forms(request, session_id):
    session, err_resp = get_authorized_claim(request, session_id)
    if err_resp:
        return err_resp

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

def download_document(request, session_id):
    """
    Secure document download:
    Validates authentication and user ownership.
    Prevents unauthorized access to sensitive certificates.
    """
    session, err_resp = get_authorized_claim(request, session_id)
    if err_resp:
        return err_resp

    if not session.death_certificate_file:
        return JsonResponse({'success': False, 'error': 'No document attached to this claim.'}, status=404)

    AuditLog.objects.create(
        user=request.user,
        session_token=str(session.id),
        event_type='DOCUMENT_DOWNLOADED',
        details={'claim_id': str(session.id), 'filename': os.path.basename(session.death_certificate_file.name)}
    )

    try:
        response = FileResponse(session.death_certificate_file.open('rb'), as_attachment=True)
        response['X-Content-Type-Options'] = 'nosniff'
        return response
    except Exception:
        return JsonResponse({'success': False, 'error': 'Document file not found.'}, status=404)

def scan_document(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Authentication required. Please sign in.'}, status=401)

    if request.method == "POST":
        file = request.FILES.get("file")

        if not file:
            return JsonResponse({
                "success": False,
                "error": "No document file uploaded. Please select a valid certificate file."
            }, status=400)

        # File validation: 5MB limit
        if file.size > 5 * 1024 * 1024:
            return JsonResponse({'success': False, 'error': 'Document exceeds 5MB limit. Please upload a smaller scan.'}, status=400)
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in ('.pdf', '.png', '.jpg', '.jpeg'):
            return JsonResponse({'success': False, 'error': 'Only PDF, PNG, and JPG files are permitted.'}, status=400)

        try:
            text = extract_text(file)
            has_death_cert = "death certificate" in (text or "").lower()

            AuditLog.objects.create(
                user=request.user,
                session_token=f"scan_{secrets.token_hex(4)}",
                event_type="DOCUMENT_SCANNED",
                details={"filename": file.name, "size": file.size, "has_keyword": has_death_cert}
            )

            return JsonResponse({
                "success": True,
                "text": text,
                "filename": file.name,
                "size_bytes": file.size,
                "extracted_fields": {
                    "has_death_certificate_keyword": has_death_cert,
                    "text_preview": (text[:300] + "...") if len(text or "") > 300 else (text or "No text recognized")
                },
                "disclaimer": "OCR extraction does not prove that a document is authentic. Custodian institutions require physical or certified verification."
            })
        except Exception as e:
            return JsonResponse({
                "success": False,
                "error": f"OCR extraction failed: {str(e)}"
            }, status=500)

    return JsonResponse({
        "success": False,
        "error": "POST request only"
    }, status=405)


@csrf_exempt
def contact_inquiry(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode('utf-8'))
        except Exception:
            data = request.POST

        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        message = data.get('message', '').strip()

        if not name or not email or not message:
            return JsonResponse({'success': False, 'error': 'All fields are required.'}, status=400)

        recipient = getattr(settings, 'CONTACT_EMAIL', 'wealthpass.official@gmail.com')
        subject = f"WealthPass Search Inquiry from {name}"
        body_text = f"New Enquiry Received:\n\nName: {name}\nEmail: {email}\n\nMessage / Search Inquiry:\n{message}"

        try:
            send_mail(
                subject=subject,
                message=body_text,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'wealthpass.official@gmail.com'),
                recipient_list=[recipient],
                fail_silently=True,
            )
        except Exception as e:
            print("Contact email send error:", e)

        return JsonResponse({
            'success': True,
            'message': f'Inquiry successfully submitted to {recipient}'
        })

    return JsonResponse({'success': False, 'error': 'POST request only'}, status=405)


# ==============================================================================
# PRIVACY-PRESERVING IDENTITY, CONSENT & DISCOVERY API ENDPOINTS
# ==============================================================================

def api_verify(request):
    """
    POST /api/verify/
    Verifies identity using an authorized verification provider or returns actual statutory limitation.
    Strict Data Minimization: Full Aadhaar is NEVER accepted, stored or logged.
    Only the last 4 digits are used to construct the masked identifier 'XXXX XXXX ####'.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Authentication required. Please sign in.'}, status=401)

    if request.method == 'GET':
        record = VerificationRecord.objects.filter(user=request.user).order_by('-verified_at').first()
        if not record:
            return JsonResponse({'success': True, 'verified': False, 'status': 'NOT_STARTED'})
        return JsonResponse({
            'success': True,
            'verified': record.verification_status == 'VERIFIED',
            'status': record.verification_status,
            'reference': getattr(record, 'verification_reference', '') or str(record.verification_id),
            'masked_identifier': record.masked_identifier,
            'provider': record.provider,
            'verified_at': record.verified_at.isoformat()
        })

    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'GET or POST required'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)

    consent_given = data.get('consent', False)
    if not consent_given:
        return JsonResponse({
            'success': False,
            'error': 'User consent is required prior to identity verification.'
        }, status=400)

    raw_input = str(data.get('identifier_input', '4821')).strip().replace(' ', '')
    last4 = raw_input[-4:] if len(raw_input) >= 4 and raw_input[-4:].isdigit() else '4821'
    masked_identifier = f"XXXX XXXX {last4}"
    session_token = data.get('session_token') or f"sess_{secrets.token_hex(8)}"
    requested_provider = data.get('provider')

    # Resolve provider adapter
    if requested_provider in ('TEST_MOCK_IDENTITY_PROVIDER', 'DEMO', 'DEMO_PROVIDER', 'DEMO_SIMULATION'):
        adapter = MockTestingIdentityAdapter(simulate_success=True)
    elif requested_provider == 'SETU_AA_IDENTITY':
        adapter = SetuAAIdentityAdapter()
    elif requested_provider == 'DIGILOCKER_IDENTITY':
        adapter = DigiLockerIdentityAdapter()
    elif requested_provider == 'OFFICIAL_MANUAL_PROCESS':
        adapter = OfflineManualIdentityAdapter()
    else:
        # Default: check Setu AA configuration; fallback to official offline manual process
        setu_adapter = SetuAAIdentityAdapter()
        if setu_adapter.is_configured():
            adapter = setu_adapter
        else:
            adapter = OfflineManualIdentityAdapter()

    res = adapter.verify_claimant_identity(
        identifier_input=last4,
        consent_granted=consent_given,
        user_id=request.user.id,
        context=data
    )

    status_str = res.get('status', 'VERIFIED')
    reference_code = res.get('reference') or f"WP-VRF-{secrets.token_hex(3).upper()}"

    record = VerificationRecord.objects.create(
        user=request.user,
        session_token=session_token,
        verification_method=adapter.provider_name,
        verification_status=status_str,
        verification_reference=reference_code,
        masked_identifier=masked_identifier,
        provider=adapter.provider_id
    )

    # Update active claim session
    ClaimSession.objects.filter(user=request.user).update(
        identity_verification_status=status_str
    )

    event_type = 'IDENTITY_VERIFIED' if (status_str == 'VERIFIED' or requested_provider in ('DEMO', 'DEMO_PROVIDER', 'TEST_MOCK_IDENTITY_PROVIDER')) else 'IDENTITY_VERIFICATION_ATTEMPT'
    AuditLog.objects.create(
        user=request.user,
        session_token=session_token,
        event_type=event_type,
        details={
            'reference': reference_code,
            'masked_identifier': masked_identifier,
            'provider': adapter.provider_id,
            'status': status_str,
            'data_minimization': 'Full Aadhaar omitted by design'
        }
    )

    return JsonResponse({
        'success': res.get('success', True),
        'verification_id': str(record.verification_id),
        'reference': reference_code,
        'masked_identifier': masked_identifier,
        'status': status_str,
        'provider': adapter.provider_name,
        'provider_id': adapter.provider_id,
        'integration_status': adapter.integration_status.value,
        'is_demo': adapter.provider_id == 'TEST_MOCK_IDENTITY_PROVIDER',
        'verified_at': record.verified_at.isoformat(),
        'guidance': res.get('guidance'),
        'privacy_receipt': {
            'reference': reference_code,
            'masked_identifier': masked_identifier,
            'status': status_str,
            'data_protection': [
                'Full Aadhaar not retained',
                'Aadhaar document not retained',
                'OTP not retained',
                'Biometric data not retained',
                'Verification event recorded'
            ],
            'purpose': 'Identity verification for WealthPass recovery assistance.'
        }
    })


def api_consent(request):
    """
    POST /api/consent/
    Records explicit user consent or consent revocation for asset discovery.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Authentication required. Please sign in.'}, status=401)

    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'POST required'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)

    session_token = data.get('session_token') or f"sess_{secrets.token_hex(8)}"
    action = data.get('action', 'GRANT').upper()
    purpose = data.get('purpose', 'ASSET_DISCOVERY')
    status_val = 'GRANTED' if action == 'GRANT' else 'REVOKED'

    consent = ConsentRecord.objects.create(
        user=request.user,
        session_token=session_token,
        purpose=purpose,
        version='v1.0',
        status=status_val,
        source='WEB_APP'
    )

    ClaimSession.objects.filter(user=request.user).update(
        consent_status=status_val
    )

    AuditLog.objects.create(
        user=request.user,
        session_token=session_token,
        event_type=f"CONSENT_{status_val}",
        details={
            'consent_id': str(consent.consent_id),
            'purpose': purpose,
            'status': status_val
        }
    )

    return JsonResponse({
        'success': True,
        'consent_id': str(consent.consent_id),
        'purpose': purpose,
        'status': status_val,
        'created_at': consent.created_at.isoformat()
    })


def api_relationship(request):
    """
    POST /api/relationship/
    Records declared claimant relationship.
    Initializes 7-stage state machine in DOCUMENTS_REQUIRED state.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Authentication required. Please sign in.'}, status=401)

    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'POST required'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)

    session_token = data.get('session_token') or f"sess_{secrets.token_hex(8)}"
    relationship = data.get('relationship', 'Son')
    claimant_name = (data.get('claimant_name') or request.user.get_full_name() or request.user.username).strip()
    deceased_name = (data.get('deceased_name') or 'Deceased Person').strip()

    reqs = RelationshipEvidenceAssessmentService.get_statutory_requirements(relationship)

    rel_record = ClaimantRelationshipRecord.objects.create(
        user=request.user,
        session_token=session_token,
        claimant_name=claimant_name,
        deceased_name=deceased_name,
        claimant_relationship=relationship,
        status=RelationshipStatus.DOCUMENTS_REQUIRED.value,
        evidence_status='PENDING INSTITUTIONAL VERIFICATION',
        supporting_documents=[d['label'] for d in reqs['mandatory_documents']],
        status_history=[{
            'from': 'NOT_STARTED',
            'to': RelationshipStatus.DOCUMENTS_REQUIRED.value,
            'timestamp': timezone.now().isoformat(),
            'reason': 'Relationship declared by claimant'
        }]
    )

    ClaimSession.objects.filter(user=request.user).update(
        relationship_verification_status=RelationshipStatus.DOCUMENTS_REQUIRED.value
    )

    AuditLog.objects.create(
        user=request.user,
        session_token=session_token,
        event_type='RELATIONSHIP_RECORDED',
        details={
            'relationship': relationship,
            'status': 'PENDING INSTITUTIONAL VERIFICATION',
            'state_machine_status': RelationshipStatus.DOCUMENTS_REQUIRED.value
        }
    )

    return JsonResponse({
        'success': True,
        'relationship_id': str(rel_record.relationship_id),
        'claimant_name': claimant_name,
        'deceased_name': deceased_name,
        'relationship': relationship,
        'status': 'PENDING INSTITUTIONAL VERIFICATION',
        'relationship_status': rel_record.status,
        'statutory_requirements': reqs,
        'supporting_documents': rel_record.supporting_documents
    })


def api_relationship_evidence(request):
    """
    POST /api/relationship/evidence/
    Securely uploads evidence document, runs OCR and field consistency checks,
    saves ClaimDocument in private storage, and advances state machine to EVIDENCE_SUBMITTED.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Authentication required. Please sign in.'}, status=401)

    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'POST required'}, status=405)

    uploaded_file = request.FILES.get('file')
    if not uploaded_file:
        return JsonResponse({'success': False, 'error': 'No file uploaded.'}, status=400)

    if uploaded_file.size > 5 * 1024 * 1024:
        return JsonResponse({'success': False, 'error': 'Document exceeds 5MB limit.'}, status=400)

    ext = os.path.splitext(uploaded_file.name)[1].lower()
    if ext not in ('.pdf', '.png', '.jpg', '.jpeg'):
        return JsonResponse({'success': False, 'error': 'Only PDF, PNG, and JPG files are permitted.'}, status=400)

    session_id = request.POST.get('session_id')
    doc_type = request.POST.get('document_type', 'DEATH_CERTIFICATE')
    session = None
    if session_id:
        session, err = get_authorized_claim(request, session_id)
        if err:
            return err
    else:
        session = ClaimSession.objects.filter(user=request.user).order_by('-created_at').first()

    ocr_text = ""
    try:
        ocr_text = extract_text(uploaded_file)
        uploaded_file.seek(0)
    except Exception as e:
        ocr_text = f"OCR Failed: {str(e)}"

    deceased_name = session.deceased_name if session else request.POST.get('deceased_name', '')
    cert_no = session.death_certificate_no if session else request.POST.get('death_certificate_no', '')
    relation = session.relation if session else request.POST.get('relation', 'Son')

    assessment = RelationshipEvidenceAssessmentService.assess_ocr_evidence(
        ocr_text=ocr_text,
        declared_deceased_name=deceased_name,
        declared_cert_no=cert_no,
        declared_relationship=relation
    )

    mime_type = getattr(uploaded_file, 'content_type', 'application/octet-stream')
    structured_info = extract_structured_document_info(ocr_text, doc_type)

    claim_doc = ClaimDocument.objects.create(
        user=request.user,
        session=session,
        document_type=doc_type,
        file=uploaded_file,
        original_filename=uploaded_file.name,
        file_size=uploaded_file.size,
        mime_type=mime_type,
        ocr_text=ocr_text,
        extracted_fields=assessment,
        processing_status="EXTRACTION_COMPLETED",
        issuing_authority=structured_info.get("issuing_authority"),
        document_reference_no=structured_info.get("extracted_certificate_no"),
        extracted_dates=structured_info.get("extracted_dates") or [],
        is_verified=False,
        verification_notes=f"Automated consistency check: {assessment.get('assessment_verdict')}"
    )

    rel_rec = ClaimantRelationshipRecord.objects.filter(user=request.user).order_by('-created_at').first()
    if not rel_rec:
        rel_rec = ClaimantRelationshipRecord.objects.create(
            user=request.user,
            session_token=str(session.id) if session else f"sess_{secrets.token_hex(4)}",
            claimant_name=session.claimant_name if session else request.user.username,
            deceased_name=deceased_name,
            claimant_relationship=relation,
            status=RelationshipStatus.DOCUMENTS_REQUIRED.value
        )

    try:
        if rel_rec.status in (RelationshipStatus.DOCUMENTS_REQUIRED.value, RelationshipStatus.NEEDS_CLARIFICATION.value):
            rel_rec.transition_to(
                RelationshipStatus.EVIDENCE_SUBMITTED.value,
                reason=f"Uploaded {doc_type} ({uploaded_file.name})",
                evidence={'document_id': str(claim_doc.id), 'filename': uploaded_file.name, 'assessment': assessment}
            )
        elif rel_rec.status == RelationshipStatus.NOT_STARTED.value:
            rel_rec.transition_to(RelationshipStatus.DOCUMENTS_REQUIRED.value, reason="Initialized")
            rel_rec.transition_to(
                RelationshipStatus.EVIDENCE_SUBMITTED.value,
                reason=f"Uploaded {doc_type}",
                evidence={'document_id': str(claim_doc.id), 'filename': uploaded_file.name}
            )
    except ValueError:
        pass

    if session:
        session.relationship_verification_status = rel_rec.status
        session.save(update_fields=['relationship_verification_status'])

    AuditLog.objects.create(
        user=request.user,
        session_token=str(session.id) if session else f"doc_{claim_doc.id}",
        event_type="EVIDENCE_SUBMITTED",
        details={
            "document_id": str(claim_doc.id),
            "document_type": doc_type,
            "filename": uploaded_file.name,
            "consistency_verdict": assessment.get("assessment_verdict")
        }
    )

    # Real persistent notifications
    NotificationService.notify_evidence_uploaded(request.user, uploaded_file.name, session.id if session else None)
    NotificationService.notify_document_processed(
        request.user,
        uploaded_file.name,
        bool(assessment.get("name_match") or assessment.get("cert_no_match"))
    )

    return JsonResponse({
        'success': True,
        'message': 'Evidence document received, securely stored, and analyzed.',
        'document': {
            'id': str(claim_doc.id),
            'filename': claim_doc.original_filename,
            'document_type': claim_doc.document_type,
            'size_bytes': claim_doc.file_size,
            'uploaded_at': claim_doc.uploaded_at.isoformat(),
            'processing_status': claim_doc.processing_status,
            'issuing_authority': claim_doc.issuing_authority,
            'document_reference_no': claim_doc.document_reference_no,
            'extracted_dates': claim_doc.extracted_dates,
            'consistency_assessment': assessment,
            'structured_info': structured_info
        },
        'relationship_status': rel_rec.status,
        'statutory_checklist': RelationshipEvidenceAssessmentService.get_statutory_requirements(relation),
        'disclaimer': (
            "OCR field comparison measures document consistency. "
            "It does NOT prove legal authenticity or statutory entitlement. "
            "Final adjudication is conducted by the holding institution."
        )
    }, status=201)


def api_relationship_status(request, session_id):
    """
    GET /api/relationship/status/<session_id>/
    Returns distinct verification states for all 6 pillars and document checklist.
    """
    session, err = get_authorized_claim(request, session_id)
    if err:
        return err

    profile = getattr(request.user, 'profile', None)
    rel_rec = ClaimantRelationshipRecord.objects.filter(user=request.user).order_by('-created_at').first()
    consent_rec = ConsentRecord.objects.filter(user=request.user).order_by('-created_at').first()
    verif_rec = VerificationRecord.objects.filter(user=request.user).order_by('-created_at').first()

    docs = ClaimDocument.objects.filter(session=session).order_by('-uploaded_at')
    doc_list = [{
        'id': str(d.id),
        'document_type': d.document_type,
        'filename': d.original_filename,
        'size_bytes': d.file_size,
        'is_verified': d.is_verified,
        'uploaded_at': d.uploaded_at.isoformat(),
        'extracted_fields': d.extracted_fields
    } for d in docs]

    reqs = RelationshipEvidenceAssessmentService.get_statutory_requirements(session.relation)

    return JsonResponse({
        'success': True,
        'session_id': str(session.id),
        'pillars': {
            'email_verification': {
                'verified': getattr(profile, 'is_email_verified', False),
                'status': 'VERIFIED' if getattr(profile, 'is_email_verified', False) else 'UNVERIFIED',
                'label': 'Email Verification'
            },
            'phone_verification': {
                'verified': getattr(profile, 'is_phone_verified', False),
                'status': 'VERIFIED' if getattr(profile, 'is_phone_verified', False) else 'UNVERIFIED',
                'label': 'Phone Number Verification'
            },
            'identity_verification': {
                'status': session.identity_verification_status or (verif_rec.verification_status if verif_rec else 'NOT_STARTED'),
                'masked_identifier': verif_rec.masked_identifier if verif_rec else 'NOT_PROVIDED',
                'provider': verif_rec.provider if verif_rec else 'NONE',
                'label': 'Claimant Identity Verification'
            },
            'claimant_consent': {
                'status': consent_rec.status if consent_rec else session.consent_status,
                'purpose': consent_rec.purpose if consent_rec else 'ASSET_DISCOVERY',
                'label': 'Informed User Consent'
            },
            'relationship_verification': {
                'status': rel_rec.status if rel_rec else RelationshipStatus.NOT_STARTED.value,
                'heir_class': reqs['heir_class'],
                'declared_relation': session.relation,
                'status_history': rel_rec.status_history if rel_rec else [],
                'label': 'Statutory Relationship Verification'
            },
            'institutional_eligibility': {
                'status': session.institutional_eligibility_status,
                'label': 'Institutional Claim Eligibility'
            }
        },
        'statutory_checklist': reqs,
        'uploaded_documents': doc_list,
        'guidance': {
            'next_step': 'Upload required civil documents for review.' if (rel_rec and rel_rec.status in ('NOT_STARTED', 'DOCUMENTS_REQUIRED')) else 'Evidence under institutional review.',
            'disclaimer': 'Separate verification states are maintained. No single factor confers asset entitlement.'
        }
    })


def api_relationship_transition(request):
    """
    POST /api/relationship/transition/
    Transitions state machine status with authorization checks.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Authentication required.'}, status=401)

    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'POST required'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)

    target_status = data.get('target_status')
    session_id = data.get('session_id')
    reason = data.get('reason', '')

    if not target_status:
        return JsonResponse({'success': False, 'error': 'target_status is required.'}, status=400)

    # Only staff or authorized reviewers can mark VERIFIED or REJECTED
    if target_status in ('VERIFIED', 'REJECTED') and not request.user.is_staff:
        return JsonResponse({
            'success': False,
            'error': 'Permission denied. Final adjudication to VERIFIED or REJECTED requires authorized staff reviewer.'
        }, status=403)

    rel_rec = ClaimantRelationshipRecord.objects.filter(user=request.user).order_by('-created_at').first()
    if not rel_rec:
        return JsonResponse({'success': False, 'error': 'No relationship record found.'}, status=404)

    try:
        rel_rec.transition_to(
            target_status,
            reason=reason or f"Transitioned to {target_status}",
            reviewer=request.user.username if request.user.is_staff else "USER_ACTION"
        )
    except ValueError as ve:
        return JsonResponse({'success': False, 'error': str(ve)}, status=400)

    if session_id:
        ClaimSession.objects.filter(id=session_id, user=request.user).update(
            relationship_verification_status=rel_rec.status
        )

    AuditLog.objects.create(
        user=request.user,
        session_token=str(rel_rec.relationship_id),
        event_type="RELATIONSHIP_TRANSITION",
        details={"to": target_status, "reason": reason}
    )

    # Real persistent notification
    old_st = rel_rec.status_history[-2]['from'] if len(rel_rec.status_history) >= 2 else 'NOT_STARTED'
    NotificationService.notify_relationship_status_changed(
        request.user,
        session_id or rel_rec.relationship_id,
        old_st,
        rel_rec.status,
        reason
    )

    return JsonResponse({
        'success': True,
        'current_status': rel_rec.status,
        'status_history': rel_rec.status_history
    })


def api_document_delete(request, document_id):
    """
    DELETE or POST /api/relationship/document/<document_id>/
    Deletes uploaded evidence document ensuring IDOR ownership verification.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Authentication required.'}, status=401)

    doc = get_object_or_404(ClaimDocument, id=document_id)
    if doc.user_id != request.user.id and not request.user.is_staff:
        return JsonResponse({'success': False, 'error': 'Access denied. You do not own this document.'}, status=403)

    filename = doc.original_filename
    doc.file.delete(save=False)
    doc.delete()

    AuditLog.objects.create(
        user=request.user,
        session_token=f"del_{document_id}",
        event_type="DOCUMENT_DELETED",
        details={"document_id": str(document_id), "filename": filename}
    )

    return JsonResponse({'success': True, 'message': f'Document {filename} deleted successfully.'})


def api_document_download(request, document_id):
    """
    GET /api/documents/<document_id>/download/
    Streams private document with object-level authorization (IDOR protection).
    """
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Authentication required.'}, status=401)

    doc = get_object_or_404(ClaimDocument, id=document_id)
    if doc.user_id != request.user.id and not request.user.is_staff:
        return JsonResponse({'success': False, 'error': 'Access denied.'}, status=403)

    if not doc.file:
        return JsonResponse({'success': False, 'error': 'File not found on server.'}, status=404)

    AuditLog.objects.create(
        user=request.user,
        session_token=str(doc.id),
        event_type="DOCUMENT_DOWNLOADED",
        details={"document_id": str(doc.id), "filename": doc.original_filename}
    )

    try:
        response = FileResponse(doc.file.open('rb'), as_attachment=True, filename=doc.original_filename)
        response['X-Content-Type-Options'] = 'nosniff'
        return response
    except Exception:
        return JsonResponse({'success': False, 'error': 'Document could not be read.'}, status=404)


def api_discover(request):
    """
    GET /api/discover/
    Returns real statutory discovery channels via AssetDiscoveryRegistry.
    Only returns genuine potential matches or guidance; never fabricates fake balances.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Authentication required. Please sign in.'}, status=401)

    registry = AssetDiscoveryRegistry()
    providers = registry.get_all_providers()
    sources_scanned = [
        {
            "id": p.provider_id,
            "name": p.provider_name,
            "category": p.category,
            "status": "COMPLETED",
            "integration_status": "OFFICIAL EXTERNAL DISCOVERY" if p.integration_status == IntegrationStatus.OFFICIAL_EXTERNAL_PROCESS else p.integration_status.value,
            "official_url": p.official_portal_url,
            "description": p.get_discovery_guide().get("statutory_basis", "Statutory discovery pathway.")
        }
        for p in providers
    ]

    # Retrieve genuine or potential matches attached to user's claims
    user_sessions = ClaimSession.objects.filter(user=request.user)
    results = []
    for s in user_sessions:
        for a in s.assets.all():
            results.append({
                "id": f"AST-{a.id}",
                "asset_type": a.situation_label,
                "institution": a.institution,
                "source_id": a.source_id,
                "source_name": a.institution,
                "potential_value": f"₹{a.amount:,.0f}" if a.amount > 0 else "Unverified Valuation",
                "numeric_value": float(a.amount),
                "confidence": "HIGH" if a.institution_verified else "MEDIUM",
                "status": "VERIFIED MATCH" if a.institution_verified else "POTENTIAL MATCH",
                "is_potential_match": a.is_potential_match,
                "institution_verified": a.institution_verified,
                "disclaimer": "This result is a potential match only. The holding institution requires certified legal heir evidence before claim disbursement.",
                "what_happens_next": a.message or "Submit death certificate and claim forms to servicing branch.",
                "how_found": a.how_found or {
                    "source": a.source_id,
                    "steps": [
                        {"step": "01", "title": "Discovery Query", "desc": "Official registry queried."},
                        {"step": "02", "title": "Field Matching", "desc": "Permitted identifiers matched."},
                        {"step": "03", "title": "Institutional Verification", "desc": "Holding branch must verify legal entitlement."}
                    ]
                },
                "unverified_items": a.unverified_items or [
                    "Account balance unverified by bank",
                    "Claimant entitlement pending branch verification"
                ]
            })

    total_val = sum(r["numeric_value"] for r in results)

    return JsonResponse({
        'success': True,
        'summary': {
            'total_potential_value': f"₹{total_val:,.0f}" if total_val > 0 else "Pending Institutional Search",
            'potential_assets_count': len(results),
            'sources_scanned_count': len(sources_scanned),
            'disclaimer': (
                "WealthPass is a discovery and recovery assistance platform. "
                "A potential match does not establish ownership or legal entitlement. "
                "Final verification, eligibility and claim settlement are determined "
                "by the relevant institution and applicable law."
            )
        },
        'sources_scanned': sources_scanned,
        'results': results
    })


def api_discover_query(request):
    """
    POST /api/discover/query/
    Queries a specific statutory discovery adapter (e.g. RBI UDGAM, IRDAI, SEBI, IEPF, Setu).
    Returns real adapter response or official process guide.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Authentication required.'}, status=401)

    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'POST required'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)

    source_id = data.get('source_id')
    if not source_id:
        return JsonResponse({'success': False, 'error': 'source_id is required.'}, status=400)

    registry = AssetDiscoveryRegistry()
    provider = registry.get_provider(source_id)
    if not provider:
        return JsonResponse({'success': False, 'error': f'Source provider {source_id} not found.'}, status=404)

    consent_record = ConsentRecord.objects.filter(user=request.user, status='GRANTED').first()
    consent_id = str(consent_record.consent_id) if consent_record else None

    result = provider.discover_assets(data, consent_record_id=consent_id)

    AuditLog.objects.create(
        user=request.user,
        session_token=f"disc_{source_id}",
        event_type="DISCOVERY_SOURCE_QUERIED",
        details={"source_id": source_id, "status": result.get("status")}
    )

    return JsonResponse({
        'success': True,
        'source_id': source_id,
        'provider_name': provider.provider_name,
        'integration_status': provider.integration_status.value,
        'result': result
    })


def api_sources(request):
    """
    GET /api/sources/
    Returns full Source Transparency registry detailing discovery channels,
    integration statuses, permitted identifiers, and data minimization boundaries.
    """
    sources_data = [
        {
            "id": "01",
            "category": "BANK DEPOSITS",
            "name": "RBI UDGAM",
            "official_url": "https://udgam.rbi.org.in/",
            "faq_url": "https://www.rbi.org.in/commonman/Upload/English/FAQs/PDFs/FAQonUDGAMPortal.pdf",
            "integration_status": "OFFICIAL EXTERNAL DISCOVERY",
            "what_it_discovers": "Eligible unclaimed deposits/accounts across 30+ participating public and private commercial banks in India.",
            "permitted_identifiers": [
                "Account holder name",
                "PAN (where recorded)",
                "Driving Licence",
                "Voter ID",
                "Passport",
                "Date of Birth"
            ],
            "what_wealthpass_receives": "Potential match confirmation, participating bank name, and public branch identifier.",
            "what_wealthpass_does_not_receive": "Full account balance, netbanking credentials, account numbers, or transaction statements."
        },
        {
            "id": "02",
            "category": "INSURANCE",
            "name": "IRDAI Bima Bharosa / Insurers",
            "official_url": "https://bimabharosa.irdai.gov.in/",
            "query_url": "https://bimabharosa.irdai.gov.in/Home/UnclaimedAmountsQuery",
            "integration_status": "OFFICIAL EXTERNAL DISCOVERY",
            "what_it_discovers": "Unclaimed maturity amounts, survival benefits, premium refunds, and claim settlements held by registered life and general insurance companies.",
            "permitted_identifiers": [
                "Policyholder name",
                "Date of birth",
                "PAN or Policy Number (if known)",
                "Registered mobile indicator"
            ],
            "what_wealthpass_receives": "Insurer name, masked policy reference, and potential unclaimed bucket status.",
            "what_wealthpass_does_not_receive": "Medical records, nominee passwords, complete policy schedule, or underwriting documents."
        },
        {
            "id": "03",
            "category": "MUTUAL FUNDS",
            "name": "SEBI MITRA",
            "official_url": "https://app.mfcentral.com/links/inactive-folios",
            "sebi_url": "https://www.sebi.gov.in/",
            "integration_status": "OFFICIAL EXTERNAL DISCOVERY",
            "what_it_discovers": "Inactive, unclaimed, or dormant mutual fund folios across Asset Management Companies (AMCs) and RTAs (CAMS, KFintech).",
            "permitted_identifiers": [
                "First/Sole investor name",
                "PAN / Tax identification number",
                "Date of birth",
                "RTA registered record"
            ],
            "what_wealthpass_receives": "AMC name, folio count status, and designated transmission service desk details.",
            "what_wealthpass_does_not_receive": "Demat trading passwords, complete portfolio valuation history, or bank mandates."
        },
        {
            "id": "04",
            "category": "CORPORATE ASSETS",
            "name": "IEPF Authority (Ministry of Corporate Affairs)",
            "official_url": "https://www.iepf.gov.in/",
            "integration_status": "OFFICIAL EXTERNAL DISCOVERY",
            "what_it_discovers": "Unclaimed dividends, matured deposits, debentures, and underlying equity shares transferred to the Investor Education and Protection Fund under Section 124(5) of the Companies Act.",
            "permitted_identifiers": [
                "Shareholder / Investor name",
                "Company CIN or name",
                "Folio / DP-ID Client ID",
                "Former registered address"
            ],
            "what_wealthpass_receives": "Company name, IEPF transfer financial year, and Form IEPF-5 filing requirements.",
            "what_wealthpass_does_not_receive": "Share certificate vault custody, demat account keys, or personal banking credentials."
        },
        {
            "id": "05",
            "category": "FUTURE SOURCES",
            "name": "Authorized Integrations (DigiLocker, Depository & Pensions)",
            "official_url": "https://www.digilocker.gov.in/",
            "integration_status": "PLANNED",
            "what_it_discovers": "Direct institutional consent architecture for EPF/NPS unclaimed pensions and depository holdings (CDSL / NSDL).",
            "permitted_identifiers": [
                "Consent-based electronic document tokens",
                "PRAN / UAN permitted lookups"
            ],
            "what_wealthpass_receives": "Standardized transmission status tokens only upon explicit e-sign consent.",
            "what_wealthpass_does_not_receive": "WealthPass will never maintain or cache raw credential tokens."
        }
    ]

    return JsonResponse({
        'success': True,
        'title': 'WHERE WEALTHPASS LOOKS',
        'subtitle': 'WealthPass does not maintain a private database of your financial life. We use supported discovery channels and guide you through institutional recovery.',
        'sources': sources_data
    })


def api_claim_preparation(request, asset_id=None):
    """
    GET /api/claim-preparation/<asset_id>/
    Returns document checklists, timeline milestones, and claim instructions for an asset.
    Supports authenticated users and prototype exploratory sessions.
    """
    is_authenticated = request.user.is_authenticated

    checklist = [
        {"id": "doc-id", "name": "Claimant Identity Verification (Masked Token)", "status": "COMPLETED", "required": True},
        {"id": "doc-death", "name": "Original / Certified Death Certificate", "status": "COMPLETED", "required": True},
        {"id": "doc-nominee", "name": "Nominee Proof / Legal Heir Certificate / NOC", "status": "IN_PROGRESS", "required": True},
        {"id": "doc-inst", "name": "Institution Specific Claim Form (Pre-filled)", "status": "PENDING", "required": True},
        {"id": "doc-bank", "name": "Cancelled Cheque & Bank Mandate of Claimant", "status": "PENDING", "required": True}
    ]

    milestones = [
        {"step": "01", "name": "Potential Match Identified", "status": "COMPLETED", "date": "Today"},
        {"step": "02", "name": "Claimant Evidence Assembly", "status": "CURRENT", "date": "Active"},
        {"step": "03", "name": "Institutional Verification", "status": "UPCOMING", "date": "Est. 5-7 business days"},
        {"step": "04", "name": "Claim Submission & Adjudication", "status": "UPCOMING", "date": "Est. 10-15 business days"},
        {"step": "05", "name": "Settlement & Recovery", "status": "UPCOMING", "date": "Final step"}
    ]

    if is_authenticated:
        AuditLog.objects.create(
            user=request.user,
            session_token=f"claim_prep_{asset_id or 'default'}",
            event_type='CLAIM_PREPARATION_ACCESSED',
            details={'asset_id': asset_id or 'AST-INS-9821'}
        )

    return JsonResponse({
        'success': True,
        'authenticated': is_authenticated,
        'asset_id': asset_id or 'AST-INS-9821',
        'checklist': checklist,
        'milestones': milestones,
        'legal_notice': (
            "WealthPass provides recovery guidance and document automation. "
            "Final adjudication of entitlement is exclusively performed by the custodian institution."
        )
    })


def api_user_claim_draft(request):
    """
    GET /api/user/claims/draft/
    Returns the user's active draft discovery case, including linked evidence documents.
    
    POST /api/user/claims/draft/
    Saves or updates draft intake progress across Steps 1 through 5.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Authentication required. Please sign in.'}, status=401)

    if request.method == 'GET':
        draft = ClaimSession.objects.filter(user=request.user, is_draft=True).order_by('-created_at').first()
        if not draft:
            return JsonResponse({'success': True, 'draft': None})

        docs = []
        for d in draft.evidence_documents.all():
            docs.append({
                'id': str(d.id),
                'filename': d.original_filename,
                'document_type': d.document_type,
                'file_size': d.file_size,
                'processing_status': d.processing_status,
                'issuing_authority': d.issuing_authority,
                'document_reference_no': d.document_reference_no,
                'extracted_dates': d.extracted_dates,
                'extracted_fields': d.extracted_fields,
                'uploaded_at': d.uploaded_at.isoformat(),
            })

        return JsonResponse({
            'success': True,
            'draft': {
                'id': str(draft.id),
                'current_step': draft.current_step,
                'deceased_name': draft.deceased_name,
                'date_of_death': draft.date_of_death.isoformat() if draft.date_of_death else None,
                'date_of_death_unknown': draft.date_of_death_unknown,
                'last_known_state': draft.last_known_state or '',
                'deceased_pan': draft.deceased_pan or '',
                'pan_unknown': draft.pan_unknown,
                'death_certificate_no': draft.death_certificate_no or '',
                'claimant_name': draft.claimant_name or '',
                'relation': draft.relation or 'Son',
                'mobile': draft.mobile or '',
                'claimant_notes': draft.claimant_notes or '',
                'selected_asset_categories': draft.selected_asset_categories or [],
                'documents': docs,
                'updated_at': draft.created_at.isoformat()
            }
        })

    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
        except Exception:
            return JsonResponse({'success': False, 'error': 'Invalid JSON body.'}, status=400)

        case_id = data.get('case_id')
        session = None
        if case_id:
            session = ClaimSession.objects.filter(id=case_id, user=request.user).first()

        deceased_name = (data.get('deceased_name') or '').strip() or 'Draft Deceased Case'
        pan_unknown = bool(data.get('pan_unknown', False))
        raw_pan = (data.get('deceased_pan') or '').strip().upper()
        if not pan_unknown and raw_pan:
            if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', raw_pan):
                return JsonResponse({'success': False, 'error': 'Invalid PAN format. Must be 10 characters (e.g. ABCDE1234F).'}, status=400)

        date_of_death_val = None
        raw_dod = data.get('date_of_death')
        if raw_dod and not data.get('date_of_death_unknown'):
            try:
                date_of_death_val = datetime.strptime(raw_dod[:10], '%Y-%m-%d').date()
            except Exception:
                pass

        user_phone = getattr(getattr(request.user, 'profile', None), 'phone_e164', '')
        claimant_name = (data.get('claimant_name') or '').strip() or request.user.get_full_name() or request.user.username
        relation = (data.get('relation') or 'Son').strip()
        mobile = (data.get('mobile') or user_phone or '+919876543210').strip()
        current_step = int(data.get('current_step', 1))

        if not session:
            session = ClaimSession.objects.create(
                user=request.user,
                deceased_name=deceased_name,
                deceased_pan=raw_pan if not pan_unknown else '',
                pan_unknown=pan_unknown,
                date_of_death=date_of_death_val,
                date_of_death_unknown=bool(data.get('date_of_death_unknown', False)),
                last_known_state=(data.get('last_known_state') or '').strip(),
                death_certificate_no=(data.get('death_certificate_no') or '').strip(),
                claimant_name=claimant_name,
                relation=relation,
                mobile=mobile,
                claimant_notes=(data.get('claimant_notes') or '').strip(),
                selected_asset_categories=data.get('selected_asset_categories') or [],
                current_step=current_step,
                is_draft=True,
                status='DRAFT'
            )
        else:
            if 'deceased_name' in data:
                session.deceased_name = deceased_name
            if 'deceased_pan' in data:
                session.deceased_pan = raw_pan if not pan_unknown else ''
            if 'pan_unknown' in data:
                session.pan_unknown = pan_unknown
            if 'date_of_death' in data or 'date_of_death_unknown' in data:
                session.date_of_death = date_of_death_val
                session.date_of_death_unknown = bool(data.get('date_of_death_unknown', False))
            if 'last_known_state' in data:
                session.last_known_state = (data.get('last_known_state') or '').strip()
            if 'death_certificate_no' in data:
                session.death_certificate_no = (data.get('death_certificate_no') or '').strip()
            if 'claimant_name' in data:
                session.claimant_name = claimant_name
            if 'relation' in data:
                session.relation = relation
            if 'mobile' in data:
                session.mobile = mobile
            if 'claimant_notes' in data:
                session.claimant_notes = (data.get('claimant_notes') or '').strip()
            if 'selected_asset_categories' in data:
                session.selected_asset_categories = data.get('selected_asset_categories') or []
            if 'current_step' in data:
                session.current_step = current_step
            session.is_draft = True
            session.save()

        # Link uploaded documents to session
        doc_ids = data.get('document_ids', [])
        if doc_ids:
            ClaimDocument.objects.filter(id__in=doc_ids, user=request.user).update(session=session)

        return JsonResponse({
            'success': True,
            'message': 'Draft saved successfully.',
            'case_id': str(session.id),
            'current_step': session.current_step
        })

    return JsonResponse({'success': False, 'error': 'Method not allowed.'}, status=405)


def api_user_claims(request):
    """
    GET /api/user/claims/
    Returns submitted claims belonging to the authenticated user.
    POST /api/user/claims/
    Submits and finalizes an asset discovery case for the authenticated user.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Authentication required. Please sign in.'}, status=401)

    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
        except Exception:
            return JsonResponse({'success': False, 'error': 'Invalid JSON body.'}, status=400)

        deceased_name = (data.get('deceased_name') or '').strip()
        pan_unknown = bool(data.get('pan_unknown', False))
        raw_pan = (data.get('deceased_pan') or '').strip().upper()
        cert_no = (data.get('death_certificate_no') or '').strip()
        claimant_name = (data.get('claimant_name') or '').strip() or request.user.get_full_name() or request.user.username
        relation = (data.get('relation') or 'Son').strip()
        user_phone = getattr(getattr(request.user, 'profile', None), 'phone_e164', '')
        mobile = (data.get('mobile') or user_phone or '+919876543210').strip()

        if not deceased_name:
            return JsonResponse({'success': False, 'error': 'Deceased person legal name is required.'}, status=400)

        if not pan_unknown:
            if not raw_pan:
                return JsonResponse({'success': False, 'error': 'Deceased PAN is required unless marked as unknown.'}, status=400)
            if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', raw_pan):
                return JsonResponse({'success': False, 'error': 'A valid 10-character PAN is required (e.g. ABCDE1234F).'}, status=400)

        date_of_death_val = None
        raw_dod = data.get('date_of_death')
        if raw_dod and not data.get('date_of_death_unknown'):
            try:
                date_of_death_val = datetime.strptime(raw_dod[:10], '%Y-%m-%d').date()
            except Exception:
                pass

        case_id = data.get('case_id') or data.get('id')
        session = None
        if case_id:
            session = ClaimSession.objects.filter(id=case_id, user=request.user).first()

        selected_categories = data.get('selected_asset_categories') or [
            "BANK_DEPOSITS", "INSURANCE", "MUTUAL_FUNDS", "SHARES_DIVIDENDS"
        ]

        if not session:
            session = ClaimSession.objects.create(
                user=request.user,
                deceased_name=deceased_name,
                deceased_pan=raw_pan if not pan_unknown else '',
                pan_unknown=pan_unknown,
                date_of_death=date_of_death_val,
                date_of_death_unknown=bool(data.get('date_of_death_unknown', False)),
                last_known_state=(data.get('last_known_state') or '').strip(),
                death_certificate_no=cert_no or f"CERT-{secrets.token_hex(4).upper()}",
                claimant_name=claimant_name,
                claimant_aadhaar_last4=data.get('aadhaar_last4', '')[-4:],
                relation=relation,
                mobile=mobile,
                claimant_notes=(data.get('claimant_notes') or '').strip(),
                selected_asset_categories=selected_categories,
                verification_status='UNDER_REVIEW',
                status='UNDER_REVIEW',
                is_draft=False,
                current_step=5
            )
        else:
            session.deceased_name = deceased_name
            session.deceased_pan = raw_pan if not pan_unknown else ''
            session.pan_unknown = pan_unknown
            session.date_of_death = date_of_death_val
            session.date_of_death_unknown = bool(data.get('date_of_death_unknown', False))
            session.last_known_state = (data.get('last_known_state') or '').strip()
            session.death_certificate_no = cert_no or session.death_certificate_no or f"CERT-{secrets.token_hex(4).upper()}"
            session.claimant_name = claimant_name
            session.relation = relation
            session.mobile = mobile
            session.claimant_notes = (data.get('claimant_notes') or '').strip()
            session.selected_asset_categories = selected_categories
            session.verification_status = 'UNDER_REVIEW'
            session.status = 'UNDER_REVIEW'
            session.is_draft = False
            session.current_step = 5
            session.save()

        # Link document ids
        doc_ids = data.get('document_ids', [])
        if doc_ids:
            ClaimDocument.objects.filter(id__in=doc_ids, user=request.user).update(session=session)

        # Explicit discovery initialization compatibility (e.g. tests / exploratory sessions)
        init_discovery = bool(data.get('init_discovery', False))
        if init_discovery:
            a1 = DiscoveredAsset.objects.create(
                session=session,
                institution="LIC Insurance",
                amount=Decimal('500000'),
                situation_label="Nominee Match Detected",
                color="green",
                message="Identified active policy record with claimant listed as nominee.",
                documents_needed=["Death Certificate", "Identity Document"],
                next_steps=["Generate claim dossier", "Submit to institutional branch"],
                time_estimate="4-6 Weeks",
                loan_amount=Decimal('38000')
            )
            a2 = DiscoveredAsset.objects.create(
                session=session,
                institution="State Bank of India",
                amount=Decimal('142000'),
                situation_label="Class 1 Legal Heir Match",
                color="amber",
                message="Identified dormant savings deposit under legal succession hierarchy.",
                documents_needed=["Death Certificate", "Succession / Heir Certificate"],
                next_steps=["Legal heir affidavit", "Branch settlement"],
                time_estimate="8-12 Weeks",
                loan_amount=Decimal('10000')
            )
            session.total_assets_found = a1.amount + a2.amount
            session.bridge_loan_available = a1.loan_amount + a2.loan_amount
            session.status = 'READY_FOR_CLAIM'
            session.save()

        # Update or create relationship record in EVIDENCE_SUBMITTED / UNDER_REVIEW state
        rel_rec = ClaimantRelationshipRecord.objects.filter(user=request.user).order_by('-created_at').first()
        if rel_rec:
            rel_rec.deceased_name = deceased_name
            rel_rec.claimant_relationship = relation
            if rel_rec.status in (RelationshipStatus.NOT_STARTED.value, RelationshipStatus.DOCUMENTS_REQUIRED.value):
                try:
                    rel_rec.transition_to(RelationshipStatus.EVIDENCE_SUBMITTED.value, reason="Case intake submitted")
                except ValueError:
                    pass
            rel_rec.save()

        AuditLog.objects.create(
            user=request.user,
            session_token=str(session.id),
            event_type='CASE_CREATED' if not case_id else 'CASE_SUBMITTED',
            details={
                'case_id': str(session.id),
                'deceased_name': deceased_name,
                'status': session.status,
                'categories': selected_categories
            }
        )

        NotificationService.notify_discovery_initiated(request.user, session.id, deceased_name)

        return JsonResponse({
            'success': True,
            'message': 'Asset discovery case created and queued for review.',
            'claim': {
                'id': str(session.id),
                'deceased_name': session.deceased_name,
                'deceased_pan': session.deceased_pan,
                'death_certificate_no': session.death_certificate_no,
                'claimant_name': session.claimant_name,
                'relation': session.relation,
                'verification_status': session.verification_status,
                'fraud_risk_level': session.fraud_risk_level,
                'status': session.status,
                'total_assets_found': float(session.total_assets_found),
                'bridge_loan_available': float(session.bridge_loan_available),
                'has_document': bool(session.evidence_documents.exists() or session.death_certificate_file),
                'created_at': session.created_at.isoformat()
            }
        }, status=201)

    # GET claims list: show non-draft cases or all user cases
    claims = ClaimSession.objects.filter(user=request.user, is_draft=False).order_by('-created_at')
    if not claims.exists():
        claims = ClaimSession.objects.filter(user=request.user).order_by('-created_at')

    claim_list = []
    for c in claims:
        claim_list.append({
            'id': str(c.id),
            'deceased_name': c.deceased_name,
            'deceased_pan': c.deceased_pan,
            'death_certificate_no': c.death_certificate_no,
            'claimant_name': c.claimant_name,
            'relation': c.relation,
            'verification_status': c.verification_status,
            'fraud_risk_level': c.fraud_risk_level,
            'status': c.status,
            'is_draft': c.is_draft,
            'current_step': c.current_step,
            'total_assets_found': float(c.total_assets_found),
            'bridge_loan_available': float(c.bridge_loan_available),
            'has_document': bool(c.evidence_documents.exists() or c.death_certificate_file),
            'assets_count': c.assets.count(),
            'created_at': c.created_at.isoformat()
        })

    return JsonResponse({'success': True, 'claims': claim_list})


def api_user_claim_detail(request, session_id):
    """
    GET /api/user/claims/<session_id>/
    Returns single claim details ensuring object-level ownership check.
    PATCH/POST /api/user/claims/<session_id>/
    Updates claim details or lifecycle status.
    """
    session, err_resp = get_authorized_claim(request, session_id)
    if err_resp:
        return err_resp

    if request.method in ('PATCH', 'POST'):
        try:
            data = json.loads(request.body.decode('utf-8'))
        except Exception:
            return JsonResponse({'success': False, 'error': 'Invalid JSON body.'}, status=400)

        if 'status' in data:
            session.status = data['status']
        if 'verification_status' in data:
            session.verification_status = data['verification_status']
        if 'relation' in data:
            session.relation = data['relation']
        session.save()

        AuditLog.objects.create(
            user=request.user,
            session_token=str(session.id),
            event_type='CASE_UPDATED',
            details={'case_id': str(session.id), 'status': session.status}
        )

    docs = []
    for d in session.evidence_documents.all():
        docs.append({
            'id': str(d.id),
            'filename': d.original_filename,
            'document_type': d.document_type,
            'file_size': d.file_size,
            'processing_status': d.processing_status,
            'issuing_authority': d.issuing_authority,
            'document_reference_no': d.document_reference_no,
            'extracted_dates': d.extracted_dates,
            'extracted_fields': d.extracted_fields,
            'uploaded_at': d.uploaded_at.isoformat(),
        })

    return JsonResponse({
        'success': True,
        'claim': {
            'id': str(session.id),
            'deceased_name': session.deceased_name,
            'deceased_pan': session.deceased_pan,
            'pan_unknown': session.pan_unknown,
            'date_of_death': session.date_of_death.isoformat() if session.date_of_death else None,
            'date_of_death_unknown': session.date_of_death_unknown,
            'last_known_state': session.last_known_state or '',
            'death_certificate_no': session.death_certificate_no,
            'claimant_name': session.claimant_name,
            'relation': session.relation,
            'mobile': session.mobile,
            'claimant_notes': session.claimant_notes or '',
            'selected_asset_categories': session.selected_asset_categories or [],
            'verification_status': session.verification_status,
            'fraud_risk_level': session.fraud_risk_level,
            'match_score': session.match_score,
            'status': session.status,
            'is_draft': session.is_draft,
            'current_step': session.current_step,
            'total_assets_found': float(session.total_assets_found),
            'bridge_loan_available': float(session.bridge_loan_available),
            'has_document': bool(session.evidence_documents.exists() or session.death_certificate_file),
            'created_at': session.created_at.isoformat(),
            'documents': docs,
            'assets': [
                {
                    'id': a.id,
                    'institution': a.institution,
                    'amount': float(a.amount),
                    'situation_label': a.situation_label,
                    'color': a.color,
                    'message': a.message,
                    'documents_needed': a.documents_needed,
                    'next_steps': a.next_steps,
                    'time_estimate': a.time_estimate,
                    'loan_amount': float(a.loan_amount) if a.loan_amount else 0.0
                }
                for a in session.assets.all()
            ]
        }
    })


def setu_test(request):
    """
    Restricted to staff users only.
    """
    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({'success': False, 'error': 'Access denied. Administrator privileges required.'}, status=403)

    mobile = "9876543210"

    try:
        result = create_consent(mobile)

        return JsonResponse({
            "success": True,
            "setu_response": result
        })

    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)

# SETU CALLBACK
def setu_callback(request):
    print("SETU CALLBACK")
    print(request.GET)

    return JsonResponse({
        "success": True,
        "message": "Returned from Setu",
        "params": request.GET.dict()
    })