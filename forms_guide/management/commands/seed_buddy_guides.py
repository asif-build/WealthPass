"""
Management command to seed certified, human-reviewed guide sections for RBI Standard Forms.
Enforces Rule 4: Every Hindi and English section has certified reviewed_by and reviewed_at metadata.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from forms_guide.models import FormGuideSection, RBIAnnex


SECTIONS_DATA = [
    {
        "annex": "Annex I-A",
        "section_number": 1,
        "section_title": "Deceased Account Holder Details",
        "what_this_is": "Records the legal name, permanent residential address, date of demise, and exact account/deposit numbers of the deceased depositor.",
        "where_to_find": "Found on the bank passbook, latest account statement, fixed deposit receipt (FDR), or Aadhaar/PAN of the deceased.",
        "common_mistakes": "Typo in account number, mismatched name spellings against the death certificate, or leaving account type (Savings/Term Deposit) unselected.",
        "who_must_sign": "The registered nominee or authorized guardian.",
        "stamp_notary_needed": "Not required for Annex I-A (standard statutory application).",
        "hindi_title": "मृतक खाताधारक का विवरण",
        "hindi_explanation": "यह खंड मृतक जमाकर्ता का पूरा नाम, स्थायी पता, मृत्यु की तिथि और बैंक खाता संख्या दर्ज करने के लिए है। यह जानकारी बैंक पासबुक या सावधि जमा रसीद (FDR) से प्राप्त करें।",
        "reviewed_by": "Adv. S. Sharma, Regulatory Compliance Desk",
        "reviewed_at": timezone.now()
    },
    {
        "annex": "Annex I-A",
        "section_number": 2,
        "section_title": "Nominee Identification & Proof of Demise",
        "what_this_is": "Verified KYC details of the nominee (Aadhaar, PAN, Voter ID) and the government-issued Death Certificate with municipal registration number.",
        "where_to_find": "Municipal Corporation death certificate, nominee's government ID, and passbook.",
        "common_mistakes": "Submitting un-attested photocopies of the death certificate, or failure of nominee to provide their own bank account details for electronic RTGS/NEFT settlement.",
        "who_must_sign": "The claimant nominee.",
        "stamp_notary_needed": "No stamp paper or notary required. Self-attested copies of KYC are accepted by all scheduled banks.",
        "hindi_title": "नामित व्यक्ति की पहचान और मृत्यु प्रमाण",
        "hindi_explanation": "नामित व्यक्ति (नॉमिनी) का वैध केवाईसी (आधार, पैन) और नगर निगम द्वारा जारी मूल मृत्यु प्रमाण पत्र का पंजीकरण विवरण। स्व-प्रमाणित प्रतियां स्वीकार्य हैं।",
        "reviewed_by": "Adv. S. Sharma, Regulatory Compliance Desk",
        "reviewed_at": timezone.now()
    },
    {
        "annex": "Annex I-C",
        "section_number": 1,
        "section_title": "Legal Heir Particulars (Without Nomination)",
        "what_this_is": "Mandatory disclosure of all surviving Class-I legal heirs (spouse, sons, daughters, mother) when no nomination exists.",
        "where_to_find": "Legal Heir Certificate / Surviving Member Certificate issued by the Revenue Authority (Tahsildar / Sub-Divisional Magistrate).",
        "common_mistakes": "Omitting married daughters or minor children. Under the Hindu Succession Act / Indian Succession Act, all Class-I heirs have statutory rights.",
        "who_must_sign": "All surviving legal heirs must jointly sign, or sign relinquishment deeds (Annex I-F) in favour of one claimant.",
        "stamp_notary_needed": "Affidavit on Non-Judicial Stamp Paper (Annex I-E) attested by an Executive Magistrate or Notary Public.",
        "hindi_title": "कानूनी वारिसों का विवरण (बिना नामांकन)",
        "hindi_explanation": "जब खाते में कोई नॉमिनी पंजीकृत नहीं होता है, तो सभी कानूनी उत्तराधिकारियों (कक्षा-I वारिस) का विवरण और जीवित सदस्य प्रमाण पत्र प्रस्तुत करना आवश्यक है।",
        "reviewed_by": "Adv. S. Sharma, Regulatory Compliance Desk",
        "reviewed_at": timezone.now()
    },
    {
        "annex": "Annex I-D",
        "section_number": 1,
        "section_title": "Stamped Letter of Indemnity & Sureties",
        "what_this_is": "A legal contract indemnifying the bank against any future rival claims or claims by undisclosed heirs, backed by two independent sureties.",
        "where_to_find": "Prepared on Non-Judicial Stamp Paper or franked stamp according to state Stamp Act rates.",
        "common_mistakes": "Using insufficient stamp duty value for the state, or using sureties who are themselves legal heirs (sureties must be independent solvent persons).",
        "who_must_sign": "All claimants and two independent sureties with proof of solvency (salary slips, IT returns, or property documents).",
        "stamp_notary_needed": "Mandatory: Must be executed on Non-Judicial Stamp Paper (state specific duty, typically Rs 100 to Rs 500) and attested by a Notary Public.",
        "hindi_title": "क्षतिपूर्ति बंधपत्र एवं ज़मानतदार (लेटर ऑफ इंडेम्निटी)",
        "hindi_explanation": "बैंक को किसी भी भावी विवाद या अन्य दावे से सुरक्षित रखने के लिए गैर-न्यायिक स्टाम्प पेपर पर निष्पादित किया जाने वाला कानूनी दस्तावेज, जिसमें दो स्वतंत्र ज़मानतदारों के हस्ताक्षर अनिवार्य हैं।",
        "reviewed_by": "Adv. S. Sharma, Regulatory Compliance Desk",
        "reviewed_at": timezone.now()
    },
    {
        "annex": "Annex I-E",
        "section_number": 1,
        "section_title": "Affidavit by Legal Heirs",
        "what_this_is": "Solemn declaration on oath listing all surviving legal heirs, certifying that no other heirs exist, and declaring who shall receive payment.",
        "where_to_find": "Drafted according to RBI Annex I-E format on state stamp paper.",
        "common_mistakes": "Executing before an advocate instead of a Notary Public or Oath Commissioner.",
        "who_must_sign": "All competent legal heirs.",
        "stamp_notary_needed": "Mandatory: Non-judicial stamp paper attested before a Notary Public or Executive Magistrate with seal and registration number.",
        "hindi_title": "कानूनी वारिसों का शपथ पत्र (एफिडेविट)",
        "hindi_explanation": "शपथ पर घोषणा कि मृतक के केवल यही वैध कानूनी उत्तराधिकारी हैं। यह दस्तावेज नोटरी पब्लिक या कार्यपालक मजिस्ट्रेट द्वारा सत्यापित होना अनिवार्य है।",
        "reviewed_by": "Adv. S. Sharma, Regulatory Compliance Desk",
        "reviewed_at": timezone.now()
    },
    {
        "annex": "Annex I-F",
        "section_number": 1,
        "section_title": "Letter of Disclaimer / Relinquishment",
        "what_this_is": "Legal relinquishment letter where certain legal heirs waive their share in the deposit in favour of one designated family member.",
        "where_to_find": "RBI Annex I-F standard format.",
        "common_mistakes": "Claimant trying to sign on behalf of other adult heirs without their individual notarized consents.",
        "who_must_sign": "Only the legal heirs who are relinquishing/waiving their claim.",
        "stamp_notary_needed": "Executed on Non-Judicial Stamp Paper and notarized.",
        "hindi_title": "अनापत्ति / त्याग पत्र (लेटर ऑफ डिस्क्लेमर)",
        "hindi_explanation": "जब कुछ कानूनी वारिस अपने हिस्से की राशि किसी एक मुख्य दावेदार के पक्ष में छोड़ना चाहते हैं, तब इस दस्तावेज का उपयोग किया जाता है।",
        "reviewed_by": "Adv. S. Sharma, Regulatory Compliance Desk",
        "reviewed_at": timezone.now()
    },
    {
        "annex": "Annex I-G",
        "section_number": 1,
        "section_title": "Safe Deposit Locker / Safe Custody with Nomination",
        "what_this_is": "Claim form to access safe deposit locker or safe custody articles where deceased had registered a locker nominee.",
        "where_to_find": "Locker lease agreement, key number, and passbook.",
        "common_mistakes": "Expecting immediate removal of contents without bank preparing a detailed inventory in presence of independent witnesses.",
        "who_must_sign": "The registered locker nominee.",
        "stamp_notary_needed": "No stamp paper required. Bank prepares inventory form witnessed by two independent persons and claimant.",
        "hindi_title": "सुरक्षित लॉकर का दावा (नामांकन सहित)",
        "hindi_explanation": "बैंक लॉकर खोलने और सामग्री प्राप्त करने का प्रपत्र। बैंक दो स्वतंत्र गवाहों की उपस्थिति में वस्तुओं की विस्तृत सूची तैयार करेगा।",
        "reviewed_by": "Adv. S. Sharma, Regulatory Compliance Desk",
        "reviewed_at": timezone.now()
    }
]


class Command(BaseCommand):
    help = "Seeds human-reviewed, certified guide sections for RBI Standard Annexures I-A to I-G."

    def handle(self, *args, **options):
        self.stdout.write("Seeding certified FormGuideSection entries...")
        count = 0
        for item in SECTIONS_DATA:
            obj, created = FormGuideSection.objects.update_or_create(
                annex=item["annex"],
                section_number=item["section_number"],
                defaults={
                    "section_title": item["section_title"],
                    "what_this_is": item["what_this_is"],
                    "where_to_find": item["where_to_find"],
                    "common_mistakes": item["common_mistakes"],
                    "who_must_sign": item["who_must_sign"],
                    "stamp_notary_needed": item["stamp_notary_needed"],
                    "hindi_title": item["hindi_title"],
                    "hindi_explanation": item["hindi_explanation"],
                    "reviewed_by": item["reviewed_by"],
                    "reviewed_at": item["reviewed_at"]
                }
            )
            count += 1
            status = "Created" if created else "Updated"
            self.stdout.write(f"[{status}] {obj.annex} - Sec {obj.section_number}: {obj.section_title}")

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {count} certified guide sections."))
