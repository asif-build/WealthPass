import React from "react";
import { HowItWorksHero } from "./HowItWorksHero";
import { HowItWorksSection } from "./HowItWorksSection";
import { StepNavigation } from "./StepNavigation";
import { ArrowDown, GitBranch, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface ClaimPreparationPageProps {
  onNavigate: (path: string) => void;
}

export const ClaimPreparationPage: React.FC<ClaimPreparationPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-[#0755C9] text-white min-h-screen">
      {/* HERO */}
      <HowItWorksHero
        stepNumber="02"
        stepLabel="HOW IT WORKS — STEP 02"
        title="CLAIM PREPARATION."
        quote="Turn an identified asset into a structured recovery journey."
        supportingText="Understand the information, documents and decision paths that may be required before submitting a claim."
      />

      {/* SECTION 1: NOMINEE VS LEGAL-HEIR LOGIC */}
      <HowItWorksSection
        id="nominee-logic"
        sectionNumber="02.1"
        badge="Path Classification"
        title="Nominee vs Legal-Heir Logic"
        description="Different circumstances can require different documentation and recovery paths. In the Indian financial system, a registered nominee acts as an authorized trustee for expedited disbursement, whereas un-nominated accounts transition to statutory legal-heir succession pathways."
        disclaimer="This overview is provided for general informational purposes only and does not constitute formal legal advice. Legal requirements, succession protocols, and document thresholds depend on the relevant institution, asset class, and applicable Indian succession laws."
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] uppercase tracking-widest text-primary/70 font-semibold">
              Recovery Path Decision Tree
            </span>
            <GitBranch className="w-4 h-4 text-primary" />
          </div>

          {/* Visual Decision Tree */}
          <div className="flex flex-col items-center gap-2 text-xs">
            {/* 1. ASSET IDENTIFIED */}
            <div className="w-full max-w-xs bg-[#083B8A] p-2.5 rounded-xl border border-white/10 text-center font-medium text-white">
              ASSET IDENTIFIED
            </div>
            <ArrowDown className="w-3.5 h-3.5 text-primary/60" />

            {/* 2. IS A NOMINEE REGISTERED? */}
            <div className="w-full max-w-xs bg-[#0646AD] p-2.5 rounded-xl border border-white/20 text-center font-semibold text-white">
              IS A NOMINEE REGISTERED?
            </div>

            {/* Split Lines & Branches */}
            <div className="w-full grid grid-cols-2 gap-3 mt-1">
              {/* Branch YES */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  YES
                </span>
                <ArrowDown className="w-3 h-3 text-emerald-300/60" />
                <div className="w-full bg-[#083B8A] p-3 rounded-xl border border-emerald-400/30 text-center">
                  <p className="font-semibold text-emerald-300 text-xs mb-1">NOMINEE PATH</p>
                  <p className="text-[10px] text-blue-100 leading-tight">
                    Nominee claim form, death cert, KYC. Typically fast-track settlement.
                  </p>
                </div>
              </div>

              {/* Branch NO */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  NO
                </span>
                <ArrowDown className="w-3 h-3 text-amber-300/60" />
                <div className="w-full bg-[#083B8A] p-3 rounded-xl border border-amber-400/30 text-center">
                  <p className="font-semibold text-amber-300 text-xs mb-1">LEGAL-HEIR / SUCCESSION</p>
                  <p className="text-[10px] text-blue-100 leading-tight">
                    Requires succession certificate, family tree NOC, or legal heir cert.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </HowItWorksSection>

      {/* SECTION 2: AUTOMATED FORM PRE-FILLING */}
      <HowItWorksSection
        id="form-prefill"
        sectionNumber="02.2"
        badge="Efficiency Workflow"
        title="Automated Form Pre-Filling"
        description="Where appropriate, WealthPass can reduce repetitive data entry by using already verified information to pre-fill relevant claim forms across insurance corporations, banks, and registries, leaving only signature authorizations to be finalized."
      >
        <div className="flex flex-col gap-3">
          <span className="text-[10px] uppercase tracking-widest text-primary/70 font-semibold mb-2">
            Pre-Fill & Submission Pipeline
          </span>

          <div className="flex flex-col items-center gap-2 text-xs">
            <div className="w-full max-w-sm bg-[#083B8A] px-4 py-2 rounded-xl border border-white/10 text-center text-white">
              VERIFIED PROFILE
            </div>
            <ArrowDown className="w-3 h-3 text-primary/60" />

            <div className="w-full max-w-sm bg-[#083B8A] px-4 py-2 rounded-xl border border-white/10 text-center text-white">
              RELEVANT INFORMATION
            </div>
            <ArrowDown className="w-3 h-3 text-primary/60" />

            <div className="w-full max-w-sm bg-[#0646AD] px-4 py-2 rounded-xl border border-white/20 text-center font-medium text-white">
              FORM PRE-FILL
            </div>
            <ArrowDown className="w-3 h-3 text-primary/60" />

            <div className="w-full max-w-sm bg-[#083B8A] px-4 py-2 rounded-xl border border-white/10 text-center text-white">
              USER REVIEW
            </div>
            <ArrowDown className="w-3 h-3 text-primary/60" />

            <div className="w-full max-w-sm bg-primary text-[#102A56] px-4 py-2 rounded-xl text-center font-semibold">
              SUBMIT
            </div>
          </div>

          <p className="text-[11px] text-[#EAF2FF]/80 text-center mt-2 italic">
            * Eliminates multi-day paperwork overhead and reduces rejection risk from minor clerical errors.
          </p>
        </div>
      </HowItWorksSection>

      {/* SECTION 3: LEGAL GUIDANCE & NOC TEMPLATES */}
      <HowItWorksSection
        id="legal-guidance"
        sectionNumber="02.3"
        badge="Documentation Tooling"
        title="Legal Guidance & NOC Templates"
        description="Provide structured guidance and document templates to help users understand what may be required for their recovery journey, eliminating guesswork when interacting with multiple institutions."
        points={[
          "Required-document checklist: Comprehensive listing tailored to each asset classification",
          "NOC template: Standardized No Objection Certificate drafts for co-heir approvals",
          "Claim preparation guidance: Step-by-step submission guidelines and attestation norms",
          "Institution-specific instructions: Direct reference guidelines for LIC, EPFO, SBI, and leading AMCs",
        ]}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] uppercase tracking-widest text-primary/70 font-semibold">
              Document Kit Templates
            </span>
            <FileText className="w-4 h-4 text-primary" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-[#083B8A] p-3 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-primary block mb-1">01. Checklist Kit</span>
              <p className="text-[11px] text-[#EAF2FF]">Detailed requirements mapped to each financial institution.</p>
            </div>
            <div className="bg-[#083B8A] p-3 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-primary block mb-1">02. Family NOC</span>
              <p className="text-[11px] text-[#EAF2FF]">Format for co-heir relinquishment or endorsement.</p>
            </div>
            <div className="bg-[#083B8A] p-3 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-primary block mb-1">03. Indemnity Bond</span>
              <p className="text-[11px] text-[#EAF2FF]">Standardized affidavit for non-nominated bank balances.</p>
            </div>
            <div className="bg-[#083B8A] p-3 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-primary block mb-1">04. Submission Guide</span>
              <p className="text-[11px] text-[#EAF2FF]">Branch & postal routing details for claim submissions.</p>
            </div>
          </div>
        </div>
      </HowItWorksSection>

      {/* SECTION 4: CLAIM READINESS */}
      <HowItWorksSection
        id="claim-readiness"
        sectionNumber="02.4"
        badge="Milestone Tracker"
        title="Claim Readiness"
        description="A structured milestone UI ensures you know exactly when your case is prepared for institutional submission, preventing premature filings that could lead to delays."
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] uppercase tracking-widest text-primary/70 font-semibold">
              Readiness Status Scorecard
            </span>
            <span className="text-[10px] text-[#EAF2FF]/70 uppercase tracking-wider">
              Live Evaluation
            </span>
          </div>

          {/* Premium Checklist UI */}
          <div className="flex flex-col gap-2.5">
            {/* Item 1 */}
            <div className="bg-[#083B8A] px-4 py-3 rounded-xl border border-emerald-400/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-semibold text-white tracking-wider">IDENTITY</span>
              </div>
              <span className="text-xs text-emerald-300 font-medium">✓ Verified</span>
            </div>

            {/* Item 2 */}
            <div className="bg-[#083B8A] px-4 py-3 rounded-xl border border-emerald-400/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-semibold text-white tracking-wider">ASSET</span>
              </div>
              <span className="text-xs text-emerald-300 font-medium">✓ Matched</span>
            </div>

            {/* Item 3 */}
            <div className="bg-[#083B8A] px-4 py-3 rounded-xl border border-amber-400/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-semibold text-white tracking-wider">DOCUMENTS</span>
              </div>
              <span className="text-xs text-amber-300 font-medium">● Review required</span>
            </div>

            {/* Item 4 */}
            <div className="bg-[#083B8A] px-4 py-3 rounded-xl border border-white/10 flex items-center justify-between opacity-85">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-blue-200" />
                <span className="text-xs font-semibold text-blue-100 tracking-wider">CLAIM</span>
              </div>
              <span className="text-xs text-blue-200 font-medium">○ Ready after documentation</span>
            </div>
          </div>
        </div>
      </HowItWorksSection>

      {/* STEP NAVIGATION */}
      <StepNavigation
        prevStep={{
          name: "01 Verify & Match",
          path: "/how-it-works/verify-match",
        }}
        nextStep={{
          name: "03 — Instant Liquidity",
          path: "/how-it-works/instant-liquidity",
        }}
        onNavigate={onNavigate}
      />
    </div>
  );
};
