import React, { useState } from "react";
import { HowItWorksHero } from "./HowItWorksHero";
import { HowItWorksSection } from "./HowItWorksSection";
import { StepNavigation } from "./StepNavigation";
import {
  ShieldCheck, UserCheck, ArrowDown,
  ArrowRight, Shield, CheckCircle2, XCircle
} from "lucide-react";

interface VerifyMatchPageProps {
  onNavigate: (path: string) => void;
}

export const VerifyMatchPage: React.FC<VerifyMatchPageProps> = ({ onNavigate }) => {
  const [selectedSourceDetail, setSelectedSourceDetail] = useState<string | null>("BANK");

  return (
    <div className="bg-[#050505] text-[#E1E0CC] min-h-screen">
      {/* HERO */}
      <HowItWorksHero
        stepNumber="01"
        stepLabel="HOW IT WORKS — STEP 01"
        title="VERIFY & MATCH."
        quote="Secure verification before WealthPass begins identifying potential asset matches."
        supportingText="Understand how identity verification, consent and multi-source matching work together to create a secure discovery process."
      />

      {/* QUICK LAUNCH BAR */}
      <div className="max-w-6xl mx-auto px-6 -mt-8 mb-12">
        <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-[#DEDBC8] font-semibold flex items-center gap-1.5 mb-1">
              <Shield className="w-4 h-4" /> Ready to test discovery?
            </div>
            <p className="text-xs text-white/60">
              Run a privacy-preserving sandbox verification with zero biometric storage.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onNavigate("/sources")}
              className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:text-white hover:border-white/30 text-xs font-medium transition-all text-center cursor-pointer"
            >
              Where We Look (/sources)
            </button>
            <button
              onClick={() => onNavigate("/verify")}
              className="flex-1 sm:flex-none py-2.5 px-5 rounded-xl bg-[#E1E0CC] hover:bg-white text-black text-xs font-medium transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              Start Verification
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: CONSENT-BASED DATABASE CHECK */}
      <HowItWorksSection
        id="consent"
        sectionNumber="01.1"
        badge="Consent Protocol"
        title="Consent-Based Database Check"
        description="WealthPass should only access supported information sources through an appropriate user-consent flow. The purpose is to make the discovery process transparent and user-controlled, ensuring no inquiry takes place without explicit authorization."
        points={[
          "User consent: Explicit authorization initiated before any query is dispatched",
          "Controlled access: Scoped strictly to statutory asset discovery repositories",
          "Transparent verification: Full visibility into what data is checked and why",
        ]}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <span className="text-[10px] uppercase tracking-widest text-primary/70 font-semibold">
              Consent Gate Architecture
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" />
              Active Consent Verified
            </span>
          </div>

          <div className="bg-[#1c1c1c] p-4 rounded-xl border border-white/5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                01
              </div>
              <div>
                <p className="text-xs font-medium text-[#E1E0CC]">Identity & Mandate Handshake</p>
                <p className="text-[11px] text-gray-400">Authenticated via Authorized Zero-Knowledge Provider</p>
              </div>
            </div>
            <div className="h-[1px] bg-white/5" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <div>
                <p className="text-xs font-medium text-[#E1E0CC]">Zero Unilateral Probing</p>
                <p className="text-[11px] text-gray-400">Queries run in-memory; full credentials never stored</p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 italic">
            * Every registry handshake complies with statutory data minimization and user-controlled discovery principles.
          </p>
        </div>
      </HowItWorksSection>

      {/* SECTION 2: PRIVACY BY DESIGN VISUAL (PART 26) */}
      <HowItWorksSection
        id="privacy-by-design"
        sectionNumber="01.2"
        badge="Zero-Storage Architecture"
        title="Privacy by Design Flow"
        description="WealthPass was designed from the ground up to never hoard sensitive data. Your Aadhaar verifies your legal identity through an authorized token, but your full 12-digit number, biometric records, and PDFs never enter our database."
        points={[
          "Full Aadhaar strictly omitted: Only masked references (XXXX XXXX 4821) exist",
          "No PDF/Biometric persistence: Zero retention of identity credentials",
          "Auditable verification receipts: Cryptographic reference tokens (WP-VRF-XXXXX)",
        ]}
      >
        <div className="flex flex-col gap-3">
          <span className="text-[10px] uppercase tracking-widest text-[#DEDBC8] font-semibold mb-1">
            Privacy-Preserving Verification Pipeline
          </span>

          <div className="flex flex-col items-center gap-2 text-xs">
            {/* 1. USER */}
            <div className="w-full max-w-sm bg-[#1c1c1c] px-4 py-2.5 rounded-xl border border-white/10 text-center font-medium text-[#E1E0CC]">
              USER (Claimant)
            </div>
            <ArrowDown className="w-3.5 h-3.5 text-white/40" />

            {/* 2. AUTHORIZED VERIFICATION */}
            <div className="w-full max-w-sm bg-[#1c1c1c] px-4 py-2.5 rounded-xl border border-white/20 text-center font-medium text-[#DEDBC8]">
              AUTHORIZED VERIFICATION MECHANISM
            </div>
            <ArrowDown className="w-3.5 h-3.5 text-white/40" />

            {/* 3. IDENTITY CONFIRMED */}
            <div className="w-full max-w-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-center font-medium flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> IDENTITY CONFIRMED
            </div>
            <ArrowDown className="w-3.5 h-3.5 text-white/40" />

            {/* 4. FULL AADHAAR: NOT RETAINED */}
            <div className="w-full max-w-sm bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-xl text-center font-mono font-medium flex items-center justify-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> FULL AADHAAR ✕ NOT RETAINED
            </div>
            <ArrowDown className="w-3.5 h-3.5 text-white/40" />

            {/* 5. MASKED REFERENCE */}
            <div className="w-full max-w-sm bg-black px-4 py-2.5 rounded-xl border border-white/20 text-center font-mono text-[#E1E0CC] flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> MASKED REFERENCE (WP-VRF-82A91)
            </div>
            <ArrowDown className="w-3.5 h-3.5 text-white/40" />

            {/* 6. CONSENT */}
            <div className="w-full max-w-sm bg-[#1c1c1c] px-4 py-2.5 rounded-xl border border-white/10 text-center text-[#E1E0CC]">
              CONSENT GRANTED (Active Purpose Scope)
            </div>
            <ArrowDown className="w-3.5 h-3.5 text-white/40" />

            {/* 7. ASSET DISCOVERY */}
            <div className="w-full max-w-sm bg-[#E1E0CC] text-black px-4 py-2.5 rounded-xl text-center font-medium shadow-md">
              ASSET DISCOVERY ENGINE
            </div>
          </div>
        </div>
      </HowItWorksSection>

      {/* SECTION 3: REAL-TIME PAN VALIDATION */}
      <HowItWorksSection
        id="pan-validation"
        sectionNumber="01.3"
        badge="Registry Sanity"
        title="Real-Time PAN Validation"
        description="The PAN supplied by the user is validated before proceeding with relevant discovery and matching workflows. This prevents erroneous queries and ensures all downstream matches correspond accurately to the deceased or rightful heir."
        points={[
          "Identity consistency: Verifies format, checksum, and status against authoritative databases",
          "Reduced mismatch risk: Filters out typographical errors before inquiries commence",
          "Verification before discovery: Structured gating that protects families from fragmented results",
        ]}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <span className="text-[10px] uppercase tracking-widest text-primary/70 font-semibold">
              PAN Registry Validation
            </span>
            <span className="text-[11px] text-primary font-mono font-medium">
              ABCDE1234F
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="bg-[#1c1c1c] p-3.5 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Format</span>
              <span className="text-xs font-medium text-emerald-400 flex items-center justify-center gap-1">
                ✓ Valid 10-Char
              </span>
            </div>
            <div className="bg-[#1c1c1c] p-3.5 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Status</span>
              <span className="text-xs font-medium text-emerald-400 flex items-center justify-center gap-1">
                ✓ Verified Active
              </span>
            </div>
            <div className="bg-[#1c1c1c] p-3.5 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Match Risk</span>
              <span className="text-xs font-medium text-primary flex items-center justify-center gap-1">
                Low (0.01%)
              </span>
            </div>
          </div>

          <div className="bg-[#181818] p-3.5 rounded-xl border border-white/5 flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-primary shrink-0" />
            <p className="text-xs text-gray-300 leading-snug">
              Ensures high accuracy in matching unclaimed balances across banking and insurance records.
            </p>
          </div>
        </div>
      </HowItWorksSection>

      {/* SECTION 4: INTERACTIVE ASSET DISCOVERY DIAGRAM (PART 27) */}
      <HowItWorksSection
        id="interactive-discovery"
        sectionNumber="01.4"
        badge="Interactive Architecture"
        title="How We Find Your Assets"
        description="WealthPass does not possess a magical private database. Instead, our engine orchestrates authorized discovery queries across public regulatory platforms and transparent registries. Click any source below to inspect its operational model:"
      >
        <div className="flex flex-col gap-4">
          {/* Main Interactive Flow */}
          <div className="flex flex-col items-center gap-2 text-xs">
            <div className="w-full max-w-sm bg-[#1c1c1c] px-4 py-2 rounded-xl border border-white/10 text-center font-medium text-[#E1E0CC]">
              WEALTHPASS
            </div>
            <ArrowDown className="w-3.5 h-3.5 text-white/40" />

            <div className="w-full max-w-sm bg-[#1c1c1c] px-4 py-2 rounded-xl border border-white/10 text-center text-white/80">
              VERIFIED USER (Claimant)
            </div>
            <ArrowDown className="w-3.5 h-3.5 text-white/40" />

            <div className="w-full max-w-sm bg-[#1c1c1c] px-4 py-2 rounded-xl border border-emerald-500/30 text-center text-emerald-300 font-mono">
              CONSENT LAYER (User Scoped)
            </div>
            <ArrowDown className="w-3.5 h-3.5 text-white/40" />

            {/* 4 Interactive Sources */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedSourceDetail("BANK")}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  selectedSourceDetail === "BANK"
                    ? "bg-white/15 border-[#E1E0CC] text-white"
                    : "bg-black/60 border-white/10 text-white/70 hover:border-white/30"
                }`}
              >
                <div className="font-semibold text-[11px]">BANK</div>
                <div className="text-[10px] text-white/50">RBI UDGAM</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSourceDetail("INSURANCE")}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  selectedSourceDetail === "INSURANCE"
                    ? "bg-white/15 border-[#E1E0CC] text-white"
                    : "bg-black/60 border-white/10 text-white/70 hover:border-white/30"
                }`}
              >
                <div className="font-semibold text-[11px]">INSURANCE</div>
                <div className="text-[10px] text-white/50">IRDAI</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSourceDetail("MF")}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  selectedSourceDetail === "MF"
                    ? "bg-white/15 border-[#E1E0CC] text-white"
                    : "bg-black/60 border-white/10 text-white/70 hover:border-white/30"
                }`}
              >
                <div className="font-semibold text-[11px]">MUTUAL FUND</div>
                <div className="text-[10px] text-white/50">SEBI MITRA</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSourceDetail("IEPF")}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  selectedSourceDetail === "IEPF"
                    ? "bg-white/15 border-[#E1E0CC] text-white"
                    : "bg-black/60 border-white/10 text-white/70 hover:border-white/30"
                }`}
              >
                <div className="font-semibold text-[11px]">CORP / SHARES</div>
                <div className="text-[10px] text-white/50">IEPF</div>
              </button>
            </div>

            <ArrowDown className="w-3.5 h-3.5 text-white/40" />

            <div className="w-full max-w-sm bg-[#1c1c1c] px-4 py-2 rounded-xl border border-white/10 text-center text-[#E1E0CC]">
              MATCHING ENGINE (Signal Scoring)
            </div>
            <ArrowDown className="w-3.5 h-3.5 text-white/40" />

            <div className="w-full max-w-sm bg-black px-4 py-2 rounded-xl border border-white/10 text-center text-emerald-400 font-mono">
              POTENTIAL ASSETS
            </div>
            <ArrowDown className="w-3.5 h-3.5 text-white/40" />

            <div className="w-full max-w-sm bg-[#1c1c1c] px-4 py-2 rounded-xl border border-white/10 text-center text-white/80">
              SOURCE TRANSPARENCY PANEL
            </div>
            <ArrowDown className="w-3.5 h-3.5 text-white/40" />

            <div className="w-full max-w-sm bg-amber-500/10 text-amber-300 border border-amber-500/30 px-4 py-2 rounded-xl text-center text-xs font-mono">
              INSTITUTIONAL VERIFICATION
            </div>
            <ArrowDown className="w-3.5 h-3.5 text-white/40" />

            <div className="w-full max-w-sm bg-[#E1E0CC] text-black px-4 py-2.5 rounded-xl text-center font-semibold text-xs shadow-md">
              CLAIM RECOVERY
            </div>
          </div>

          {/* Source Interactive Detail Box */}
          <div className="mt-4 p-4 rounded-xl bg-black/70 border border-white/10 text-xs leading-relaxed">
            {selectedSourceDetail === "BANK" && (
              <div>
                <strong className="text-white block mb-1">RBI UDGAM (Bank Deposits Discovery):</strong>
                Queries eligible unclaimed deposits across 30+ member commercial banks. Uses permissible identifiers (Account holder name, PAN indicator, branch district). Zero account credentials ever requested.
              </div>
            )}
            {selectedSourceDetail === "INSURANCE" && (
              <div>
                <strong className="text-white block mb-1">IRDAI Bima Bharosa / Insurers:</strong>
                Queries unclaimed death claims, survival benefits, and premium refunds across life insurers like LIC. Transmission requires original claim Form 3783 to the branch.
              </div>
            )}
            {selectedSourceDetail === "MF" && (
              <div>
                <strong className="text-white block mb-1">SEBI MITRA (Mutual Fund Tracing):</strong>
                Assists investors in tracing inactive and dormant mutual fund folios across Asset Management Companies and RTAs (CAMS/KFintech). Folio transmission handled through KYC verification.
              </div>
            )}
            {selectedSourceDetail === "IEPF" && (
              <div>
                <strong className="text-white block mb-1">IEPF Authority (Corporate Shares & Dividends):</strong>
                Identifies unclaimed dividends and equity shares transferred under Section 124(5) of the Companies Act. Recovery requires Form IEPF-5 filing and Nodal Officer verification.
              </div>
            )}
          </div>
        </div>
      </HowItWorksSection>

      {/* STEP NAVIGATION */}
      <StepNavigation
        nextStep={{
          name: "02 — Claim Preparation",
          path: "/how-it-works/claim-preparation",
        }}
        onNavigate={onNavigate}
      />
    </div>
  );
};
