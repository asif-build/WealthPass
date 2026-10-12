"""
Views for Per-Bank Directory and Scenario Comparison.
Matches user scenario to RBI Standard Forms (Annex I-A to I-H),
displays bank-specific requirements, and provides verified download links.
"""
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from .models import BankDirectory, BankFormLink, BankExtraRequirement, FormAlias, RBIAnnex, ScenarioChoice, DirectoryStatus


def bank_directory_view(request):
    """
    Renders the Per-Bank Directory interface.
    Allows choosing a bank and scenario (nominee, no nominee, locker, survivorship, missing person),
    showing RBI standard forms vs bank published forms, and verified extras.
    """
    banks = BankDirectory.objects.all().order_by('bank')
    
    selected_bank_code = request.GET.get('bank', 'sbi').strip().lower()
    selected_scenario = request.GET.get('scenario', 'nominee').strip().lower()
    
    current_bank = BankDirectory.objects.filter(bank_code=selected_bank_code).first()
    if not current_bank and banks.exists():
        current_bank = banks.first()

    # Determine applicable RBI Annexures based on scenario
    applicable_annexes = []
    if selected_scenario == 'nominee':
        applicable_annexes = ['Annex I-A']
    elif selected_scenario == 'no_nominee':
        applicable_annexes = ['Annex I-C', 'Annex I-D', 'Annex I-E', 'Annex I-F']
    elif selected_scenario == 'survivorship':
        applicable_annexes = ['Annex I-B']
    elif selected_scenario == 'locker':
        applicable_annexes = ['Annex I-G', 'Annex I-H']
    elif selected_scenario == 'missing_person':
        applicable_annexes = ['Annex I-C', 'Annex I-D']

    # Fetch bank forms for this bank
    bank_forms = current_bank.forms.all() if current_bank else []
    
    # Filter forms matching scenario
    matching_forms = [f for f in bank_forms if f.maps_to_rbi_annex in applicable_annexes]
    other_forms = [f for f in bank_forms if f not in matching_forms]

    # Fetch bank extra requirements for scenario
    extras = current_bank.extra_requirements.filter(scenario=selected_scenario) if current_bank else []
    if not extras and current_bank:
        extras = current_bank.extra_requirements.all()

    context = {
        'banks': banks,
        'current_bank': current_bank,
        'selected_scenario': selected_scenario,
        'applicable_annexes': applicable_annexes,
        'matching_forms': matching_forms,
        'other_forms': other_forms,
        'extras': extras,
        'scenarios': ScenarioChoice.choices,
    }
    return render(request, 'forms_guide/bank_directory.html', context)


def api_bank_directory(request):
    """
    JSON API for Per-Bank Directory.
    """
    bank_code = request.GET.get('bank_code')
    banks = BankDirectory.objects.all()
    if bank_code:
        banks = banks.filter(bank_code=bank_code)

    results = []
    for b in banks:
        forms_list = [
            {
                'label': f.label_as_published,
                'url': f.official_download_url,
                'maps_to_rbi_annex': f.maps_to_rbi_annex,
                'differs_from_rbi': f.differs_from_rbi
            }
            for f in b.forms.all()
        ]
        extras_list = [
            {
                'scenario': e.scenario,
                'text': e.text_as_published,
                'source': e.source_url
            }
            for e in b.extra_requirements.all()
        ]
        results.append({
            'bank': b.bank,
            'bank_code': b.bank_code,
            'claim_page_url': b.claim_page_url,
            'status': b.status,
            'online_claim_available': b.online_claim_available,
            'tracking_available': b.tracking_available,
            'verified_at': b.verified_at.isoformat(),
            'forms': forms_list,
            'extra_requirements': extras_list
        })

    return JsonResponse({'success': True, 'banks': results})
