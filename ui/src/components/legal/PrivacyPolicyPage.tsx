import React from "react";
import { ArrowLeft, Lock, EyeOff, FileCheck } from "lucide-react";

interface PrivacyPolicyPageProps {
  onNavigate: (path: string) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigate }) => {
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
            <span>DPDP Aligned</span>
            <span>•</span>
            <span>Version 1.0 (October 2026)</span>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="px-6 pt-16 pb-12 border-b border-white/5 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto">
          <span className="text-primary text-[10px] sm:text-xs tracking-[0.2em] uppercase font-semibold block mb-3">
            Data Protection &amp; Privacy
          </span>
          <h1 className="text-3xl sm:text-5xl font-medium text-white tracking-tight mb-4 leading-tight">
            Privacy Policy
          </h1>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-3xl">
            This Privacy Policy details how WealthPass collects, uses, stores, and protects personal data in strict compliance with the Digital Personal Data Protection Act, 2023 (DPDP) and industry-leading cryptographic standards.
          </p>

          {/* Privacy Guarantee Box */}
          <div className="mt-8 p-5 rounded-2xl bg-[#121212] border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-start gap-3">
              <EyeOff className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Strict Data Minimization</strong>
                Full Aadhaar numbers and biometrics are never requested or stored in our database.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Separation of States</strong>
                Email, phone, identity, and kinship verification statuses are strictly segregated.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">User-Controlled Consent</strong>
                Explicit, auditable consent is required for all discovery queries and is revocable.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <main className="px-6 py-16 max-w-4xl mx-auto leading-relaxed text-sm sm:text-base text-gray-300 space-y-12">
        {/* Section 1 */}
        <section id="section-1" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">01.</span> Who Operates WealthPass
          </h2>
          <p>
            WealthPass is developed and operated by <strong>WealthPass Technologies Pvt. Ltd.</strong> ("WealthPass", "we", "us"), acting as a Data Fiduciary under the Digital Personal Data Protection Act, 2023. We are committed to transparency, lawful purpose limitation, and robust security safeguards for all personal data entrusted to us.
          </p>
        </section>

        {/* Section 2 */}
        <section id="section-2" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">02.</span> What Personal Information Is Collected
          </h2>
          <p>
            We collect only the minimum personal data necessary to provide our discovery and claim preparation services:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm">
            <li><strong>Account Data:</strong> Full legal name, authorized email address, mobile phone number (E.164 format), and a securely hashed password.</li>
            <li><strong>Search Queries:</strong> Name of deceased family member, year of demise, death certificate reference, and PAN format for estate matching.</li>
            <li><strong>Masked Identifiers:</strong> Only masked identification references (such as "XXXX XXXX 4821") or the last four digits of an identity token are processed for transaction reconciliation. Full 12-digit Aadhaar numbers, biometric records, and biometric photographs are strictly barred from storage.</li>
            <li><strong>Technical Telemetry:</strong> IP address, browser type, and cryptographically signed session cookies for fraud prevention and rate limiting.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section id="section-3" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">03.</span> Why Information Is Collected
          </h2>
          <p>
            Personal data is processed strictly for specified, legitimate purposes:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm">
            <li>To authenticate authorized account access and prevent unauthorized account takeover.</li>
            <li>To execute user-directed search queries across unclaimed asset depositories.</li>
            <li>To assemble personalized, pre-filled claim forms and legal heir procedural checklists.</li>
            <li>To dispatch security notifications, single-use activation tokens, and password reset links.</li>
            <li>To maintain statutory audit logs required by financial fraud prevention standards.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section id="section-4" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">04.</span> How Account Information Is Used
          </h2>
          <p>
            Your account information is used exclusively to facilitate your active session and platform services. We do <strong>not</strong> sell, rent, monetize, or disclose your personal information to third-party data brokers, marketing networks, or unsolicited commercial advertisers.
          </p>
        </section>

        {/* Section 5 */}
        <section id="section-5" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">05.</span> How Phone and Email Verification Work
          </h2>
          <p>
            We implement two separate verification processes:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm">
            <li><strong>Email Verification:</strong> A cryptographically random, single-use token is generated, stored as an SHA-256 hash in our database, and delivered to your registered email address. Opening the link verifies control of that email address.</li>
            <li><strong>Phone OTP Verification:</strong> A time-limited, 6-digit numeric OTP is generated and transmitted via an authorized SMS gateway. The plaintext OTP is never logged or returned to the browser; only an SHA-256 hash is verified server-side.</li>
          </ul>
          <p className="text-xs text-primary/90 mt-2">
            Notice: Phone OTP verification establishes possession and control of the mobile device. It does <strong>not</strong> establish legal identity, legal-heir entitlement, family relationship, or ownership of an asset.
          </p>
        </section>

        {/* Section 6 */}
        <section id="section-6" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">06.</span> How Consent Is Collected and Recorded
          </h2>
          <p>
            In accordance with the DPDP framework, consent is freely given, specific, informed, and unambiguous. We record the applicable Terms &amp; Conditions version, Privacy Policy version, IP address, and timestamp on an immutable audit trail when you register. Consent for asset discovery is obtained as a separate, distinct action before querying institutional data.
          </p>
        </section>

        {/* Section 7 */}
        <section id="section-7" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">07.</span> How Asset Discovery Works
          </h2>
          <p>
            When you initiate a search, the Platform aggregates data from publicly disclosed unclaimed asset registers (such as RBI UDGAM, MCA IEPF, IRDAI Bima Bharosa) and voluntary Account Aggregator consent flows. We maintain strict separation between your user account and search parameters to uphold privacy-preserving architecture.
          </p>
        </section>

        {/* Section 8 */}
        <section id="section-8" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">08.</span> Information Sharing with Institutions
          </h2>
          <p>
            Information is only shared with financial institutions when you explicitly direct the platform to generate a claim packet or initiate an Account Aggregator consent session. WealthPass does not automatically transmit your personal data to external banks or insurers without your affirmative instruction.
          </p>
        </section>

        {/* Section 9 */}
        <section id="section-9" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">09.</span> Third-Party Service Providers
          </h2>
          <p>
            We engage vetted infrastructure partners for essential platform operations:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm">
            <li><strong>Email Delivery:</strong> Transactional SMTP relays for activation links and security alerts.</li>
            <li><strong>SMS Providers:</strong> Regulated telecom gateways (such as MSG91) for OTP dispatch.</li>
            <li><strong>Hosting &amp; Database:</strong> Secure, ISO 27001-certified PostgreSQL database clusters with encryption at rest and in transit.</li>
          </ul>
        </section>

        {/* Section 10 */}
        <section id="section-10" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">10.</span> Data Storage and Security
          </h2>
          <p>
            We implement comprehensive technical and organizational safeguards:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm">
            <li>All passwords are hashed using PBKDF2 with SHA-256 and cryptographic salts. Plaintext passwords are never stored.</li>
            <li>All data in transit is encrypted using TLS 1.3.</li>
            <li>Application cookies are secured with <code>HttpOnly</code>, <code>SameSite=Lax</code>, and Secure flags.</li>
            <li>Strict rate limiting is applied to authentication, OTP, and password reset endpoints.</li>
          </ul>
        </section>

        {/* Section 11 */}
        <section id="section-11" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">11.</span> Data Retention
          </h2>
          <p>
            We retain personal information only for as long as necessary to fulfill the purposes outlined in this policy or to satisfy statutory legal, accounting, and anti-fraud reporting requirements. Inactive search session tokens are expired after 24 hours.
          </p>
        </section>

        {/* Section 12 */}
        <section id="section-12" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">12.</span> Account Deletion
          </h2>
          <p>
            You have the right to request the permanent deletion of your WealthPass account and associated profile data at any time. Upon receiving a verified deletion request, your account and identifiers will be purged from active systems within thirty (30) days, subject only to statutory record-retention requirements under Indian law.
          </p>
        </section>

        {/* Section 13 */}
        <section id="section-13" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">13.</span> Withdrawal of Consent
          </h2>
          <p>
            Under Section 6(4) of the DPDP Act, 2023, you may withdraw previously granted consent at any time. Withdrawing consent does not affect the lawfulness of processing carried out prior to withdrawal. You can manage or revoke consent directly within your dashboard or by emailing our Data Protection Officer.
          </p>
        </section>

        {/* Section 14 */}
        <section id="section-14" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">14.</span> User Rights and Grievance Procedures
          </h2>
          <p>
            As a Data Principal, you possess statutory rights to: (a) access a summary of your processed data; (b) request correction of inaccurate information; (c) request erasure of your data; and (d) nominate an individual to exercise rights on your behalf in the event of demise.
          </p>
        </section>

        {/* Section 15 */}
        <section id="section-15" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">15.</span> Cookies and Session Management
          </h2>
          <p>
            WealthPass uses cookies strictly for security authentication, CSRF mitigation, and session persistence. We do <strong>not</strong> employ third-party tracking pixels, surveillance scripts, or advertising identifiers.
          </p>
        </section>

        {/* Section 16 */}
        <section id="section-16" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">16.</span> Security Incident Handling
          </h2>
          <p>
            In the event of a verified personal data breach, WealthPass will notify the Data Protection Board of India and affected users in compliance with statutory protocols under the DPDP Act, 2023.
          </p>
        </section>

        {/* Section 17 */}
        <section id="section-17" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">17.</span> Policy Updates
          </h2>
          <p>
            We may update this Privacy Policy from time to time. Any material updates will be communicated by posting an updated version with a revised effective date and notifying registered users via their verified email address.
          </p>
        </section>

        {/* Section 18 */}
        <section id="section-18" className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <span className="text-primary text-base font-mono">18.</span> Contact Information &amp; Grievance Redressal
          </h2>
          <div className="p-5 rounded-2xl bg-[#121212] border border-white/10 text-xs sm:text-sm space-y-2">
            <p className="font-medium text-white">Data Protection Officer / Grievance Officer</p>
            <p>WealthPass Technologies Pvt. Ltd.</p>
            <p>Official Dedicated Support Email: <a href="mailto:wealthpass.official@gmail.com" className="text-primary hover:underline">wealthpass.official@gmail.com</a></p>
            <p className="text-gray-500 text-xs pt-2">
              For any privacy concerns, consent withdrawal, or grievance redressal, please write to our dedicated support address. Inquiries are formally acknowledged within 24 hours.
            </p>
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
