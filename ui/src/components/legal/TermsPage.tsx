import React from "react";
import { ArrowLeft, Scale } from "lucide-react";

interface TermsPageProps {
  onNavigate: (path: string) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-black text-[#E1E0CC] selection:bg-primary selection:text-black">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-black/85 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate("/")}
              className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>Version 1.0</span>
            <span>•</span>
            <span>Effective October 2026</span>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="px-6 pt-16 pb-12 border-b border-white/5 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto">
          <span className="text-primary text-[10px] sm:text-xs tracking-[0.2em] uppercase font-semibold block mb-3">
            Legal Agreement
          </span>
          <h1 className="text-3xl sm:text-5xl font-medium text-white tracking-tight mb-4 leading-tight">
            Terms &amp; Conditions
          </h1>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-3xl">
            Please read these Terms &amp; Conditions carefully before accessing or using the WealthPass platform. These terms govern your use of our discovery assistance and claim preparation tools.
          </p>

          {/* Statutory Positioning Notice */}
          <div className="mt-8 p-5 rounded-2xl bg-[#14120c] border border-primary/20 flex items-start gap-4 text-xs sm:text-sm text-[#E1E0CC]">
            <Scale className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-white block mb-1">Essential Regulatory &amp; Platform Positioning Notice</strong>
              WealthPass is an independent digital search and claim preparation assistance platform operated by WealthPass Technologies Pvt. Ltd. WealthPass is <strong>not</strong> a bank, non-banking financial company (NBFC), insurance depository, government agency, judicial court, or statutory adjudicating authority. A potential asset match identified through the platform does <strong>not</strong> constitute proof of legal ownership, beneficiary status, legal-heir title, or guarantee of claim settlement. Final verification, admissibility, and disbursement decisions rest solely with the relevant financial institutions and statutory authorities in accordance with applicable Indian law.
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <main className="px-6 py-16 max-w-4xl mx-auto leading-relaxed text-sm sm:text-base text-gray-300 space-y-12">
        {/* Section 1 */}
        <section id="section-1" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">01.</span> Introduction
          </h2>
          <p>
            These Terms &amp; Conditions ("Terms", "Agreement") constitute a legally binding agreement between you (the "User", "Claimant", "You") and WealthPass Technologies Pvt. Ltd. ("WealthPass", "we", "us", or "our") governing your access to and use of the WealthPass website, applications, APIs, and associated discovery assistance services (collectively, the "Platform").
          </p>
          <p>
            By registering an account, clicking "I Agree", or using any portion of the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you must not access or use the Platform.
          </p>
        </section>

        {/* Section 2 */}
        <section id="section-2" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">02.</span> Definitions
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm">
            <li><strong>"Unclaimed Asset":</strong> Financial assets, deposits, mature insurance policies, provident fund balances, shares, mutual funds, or dividends held by regulated entities that have remained dormant, inactive, or unliquidated.</li>
            <li><strong>"Discovery Services":</strong> Platform features facilitating search queries across publicly disclosed dormant registries, published government portals (e.g., UDGAM, IEPF), and voluntary account aggregator frameworks.</li>
            <li><strong>"Claim Preparation Dossier":</strong> Automated document assembly, form pre-filling, statutory checklists, and instructions generated to assist claimants in assembling formal submissions.</li>
            <li><strong>"Financial Institution":</strong> Any regulated commercial bank, life insurance company, asset management company (AMC), registrar and transfer agent (RTA), pension fund, or statutory fund administrator (such as IEPF or EPFO).</li>
            <li><strong>"Session Token":</strong> An encrypted, time-bounded identifier generated to manage user state securely without storing unauthorized credentials.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section id="section-3" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">03.</span> Eligibility
          </h2>
          <p>
            To use the Platform, you must be at least eighteen (18) years of age, possess the legal capacity to enter into a binding contract under the Indian Contract Act, 1872, and reside in a jurisdiction where our services are lawfully permitted. By registering, you warrant that all information you submit is accurate, truthful, and lawful.
          </p>
        </section>

        {/* Section 4 */}
        <section id="section-4" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">04.</span> Account Registration
          </h2>
          <p>
            To access certain features of the Platform, you must create an account. You agree to provide a valid legal name, valid mobile number with country code, and authorized email address. You agree to complete email verification and phone OTP verification as required by our security policies. You may not register on behalf of another individual without verified legal authorization (such as an executed Power of Attorney or legal guardianship appointment).
          </p>
        </section>

        {/* Section 5 */}
        <section id="section-5" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">05.</span> Account Security
          </h2>
          <p>
            You are solely responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to immediately notify WealthPass of any unauthorized access, security incident, or credential compromise. WealthPass will not be liable for any loss arising from your failure to protect your login credentials.
          </p>
        </section>

        {/* Section 6 */}
        <section id="section-6" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">06.</span> User Responsibilities
          </h2>
          <p>
            When utilizing the Platform, you represent and warrant that:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm">
            <li>You possess a bona fide legal interest in the deceased individual's estate or are inquiring as a legitimate nominee, legal heir, executor, or court-appointed administrator.</li>
            <li>All death certificates, succession documentation, identity proofs, and relationship declarations provided are authentic, un-altered, and legally valid.</li>
            <li>You will not submit falsified documents, engage in identity misrepresentation, or attempt to assert claims against assets belonging to third parties without lawful entitlement.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section id="section-7" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">07.</span> Consent and Authorization
          </h2>
          <p>
            By initiating an asset search or verification workflow, you grant WealthPass explicit, revocable consent to process the provided search criteria (e.g., deceased full name, date of death, certificate reference, PAN format verification) strictly for the purpose of identifying corresponding records across designated data sources. Consent is recorded on an auditable ledger and may be withdrawn at any time through your dashboard.
          </p>
        </section>

        {/* Section 8 */}
        <section id="section-8" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">08.</span> Asset Discovery Services
          </h2>
          <p>
            WealthPass provides search aggregation across publicly accessible unclaimed registers, institutional depositories, and integrated account aggregator consent gateways. We do <strong>not</strong> represent or warrant that our discovery tools have exhaustive or real-time connectivity to every financial institution, private cooperative bank, rural cooperative, post office deposit, or unlisted entity operating in India.
          </p>
        </section>

        {/* Section 9 */}
        <section id="section-9" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">09.</span> Potential Asset Matches
          </h2>
          <p>
            A potential match presented by WealthPass represents a statistical or metadata correlation between the queried parameters and institutional records. A potential match:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm">
            <li>Does <strong>not</strong> establish that the deceased held an active or settled claim.</li>
            <li>Does <strong>not</strong> verify that you are the sole or lawful beneficiary.</li>
            <li>Does <strong>not</strong> supersede conflicting nominations, testamentary wills, or contested probate proceedings.</li>
          </ul>
        </section>

        {/* Section 10 */}
        <section id="section-10" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">10.</span> Claim Preparation Assistance
          </h2>
          <p>
            Our claim preparation assistance features assemble standard institutional claim packets, procedural checklists, and statutory declaration templates. These automated materials are intended for informational convenience and administrative assistance only. WealthPass does not offer legal representation, legal opinions, or judicial advocacy.
          </p>
        </section>

        {/* Section 11 */}
        <section id="section-11" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">11.</span> Third-Party Institutions and Services
          </h2>
          <p>
            Settlement of unclaimed financial assets is conducted solely under the internal guidelines, Know Your Customer (KYC) requirements, and operational timelines of the respective financial institutions. WealthPass does not control, supervise, or expedite institutional internal review procedures, nor can we waive statutory requirements such as indemnity bonds or succession certificates.
          </p>
        </section>

        {/* Section 12 */}
        <section id="section-12" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">12.</span> Accuracy and Availability of Information
          </h2>
          <p>
            While WealthPass makes diligent efforts to ensure high data integrity, external registry data may contain typographical discrepancies, outdated ledger balances, or incomplete folio references. WealthPass disclaims any liability for inaccuracies originating from third-party institutional records.
          </p>
        </section>

        {/* Section 13 */}
        <section id="section-13" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">13.</span> No Guarantee of Asset Recovery
          </h2>
          <p>
            WealthPass explicitly disclaims any warranty or guarantee that any search conducted on the Platform will yield discovered assets, or that identified potential matches will culminate in successful financial recovery or liquidity.
          </p>
        </section>

        {/* Section 14 */}
        <section id="section-14" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">14.</span> No Guarantee of Claim Approval or Settlement
          </h2>
          <p>
            Approval or rejection of an inheritance claim is within the sole statutory jurisdiction of the custodian institution or competent civil court. WealthPass does not guarantee that institutional claims will be sanctioned, paid out, or expedited.
          </p>
        </section>

        {/* Section 15 */}
        <section id="section-15" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">15.</span> Fees and Pricing
          </h2>
          <p>
            Initial search queries and basic claim checklists are provided pursuant to published platform tiers. Any premium document preparation, courier forwarding, or bridge-loan evaluation fees will be transparently presented for your explicit agreement prior to billing.
          </p>
        </section>

        {/* Section 16 */}
        <section id="section-16" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">16.</span> Prohibited Activities
          </h2>
          <p>
            Users shall not: (a) engage in automated scraping or reverse engineering of the Platform; (b) probe or test system vulnerabilities without authorization; (c) submit forged civil status records; or (d) violate the Information Technology Act, 2000 or the Digital Personal Data Protection Act, 2023.
          </p>
        </section>

        {/* Section 17 */}
        <section id="section-17" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">17.</span> Privacy and Personal Information
          </h2>
          <p>
            Your privacy is paramount. Collection and handling of personal data are governed by our Privacy Policy, incorporated into these Terms by reference. WealthPass strictly adheres to data minimization and does not store full Aadhaar numbers or biometrics.
          </p>
        </section>

        {/* Section 18 */}
        <section id="section-18" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">18.</span> Intellectual Property
          </h2>
          <p>
            All text, software algorithms, graphics, interfaces, and trademarks (including "WealthPass") are the proprietary intellectual property of WealthPass Technologies Pvt. Ltd. and are protected by Indian copyright and intellectual property laws.
          </p>
        </section>

        {/* Section 19 */}
        <section id="section-19" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">19.</span> Suspension and Termination
          </h2>
          <p>
            WealthPass reserves the right to suspend or terminate accounts that breach these Terms, submit fraudulent credentials, or engage in suspicious account activity, with immediate effect and without liability.
          </p>
        </section>

        {/* Section 20 */}
        <section id="section-20" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">20.</span> Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by applicable law, WealthPass, its directors, employees, and affiliates shall not be liable for any indirect, consequential, punitive, or special damages, or for lost profits or institutional claim rejections arising out of your use of the Platform.
          </p>
        </section>

        {/* Section 21 */}
        <section id="section-21" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">21.</span> Dispute Resolution and Governing Law
          </h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in New Delhi, India.
          </p>
        </section>

        {/* Section 22 */}
        <section id="section-22" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">22.</span> Changes to the Terms
          </h2>
          <p>
            WealthPass may revise these Terms periodically. In the event of material changes, registered users will be notified via email or a conspicuous notice upon login. Continued use of the Platform constitutes acceptance of the amended Terms.
          </p>
        </section>

        {/* Section 23 */}
        <section id="section-23" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">23.</span> Contact Information
          </h2>
          <div className="p-5 rounded-2xl bg-[#121212] border border-white/10 text-xs sm:text-sm space-y-2">
            <p className="font-medium text-white">WealthPass Technologies Pvt. Ltd.</p>
            <p>Attn: Legal &amp; Compliance Department</p>
            <p>Official Support Email: <a href="mailto:wealthpass.official@gmail.com" className="text-primary hover:underline">wealthpass.official@gmail.com</a></p>
            <p className="text-gray-500 text-xs pt-2">For security, legal notices and inquiries must be submitted in writing to the email address above.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-6 bg-[#0a0a0a] text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} WealthPass Technologies Pvt. Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
};
