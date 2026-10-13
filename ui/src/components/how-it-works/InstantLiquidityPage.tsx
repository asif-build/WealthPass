import React from "react";
import { HowItWorksHero } from "./HowItWorksHero";
import { HowItWorksSection } from "./HowItWorksSection";
import { StepNavigation } from "./StepNavigation";
import { ArrowDown, DollarSign, RefreshCw } from "lucide-react";

interface InstantLiquidityPageProps {
  onNavigate: (path: string) => void;
}

export const InstantLiquidityPage: React.FC<InstantLiquidityPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-[#0755C9] text-white min-h-screen">
      {/* HERO */}
      <HowItWorksHero
        stepNumber="03"
        stepLabel="HOW IT WORKS — STEP 03"
        title="INSTANT LIQUIDITY."
        quote="Bridge the gap between identifying an asset and receiving its recovery proceeds."
        supportingText="Understand how WealthPass can structure a potential liquidity pathway while the underlying recovery process continues."
      />

      {/* SECTION 1: ZERO-UPFRONT PROCESSING FEE */}
      <HowItWorksSection
        id="zero-fee"
        sectionNumber="03.1"
        badge="Fee Transparency"
        title="Zero-Upfront Processing Fee"
        description="Users should not be required to pay an upfront processing fee within the proposed WealthPass model. We believe families searching for their inheritance should never encounter upfront barriers or hidden discovery costs."
        points={[
          "Zero upfront deposit: No search fees, no mandatory upfront retainer",
          "Transparent economics: Terms and fees are fully disclosed before any authorization",
          "Aligned incentives: The platform focuses on successful documentation and legitimate closure",
        ]}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] uppercase tracking-widest text-primary/70 font-semibold">
              Transparent Fee Structure
            </span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="space-y-2.5">
            <div className="bg-[#083B8A] p-3 rounded-xl border border-white/10 flex items-center justify-between">
              <span className="text-xs text-white">Initial Registry Search</span>
              <span className="text-xs font-semibold text-emerald-300">₹0 (Free)</span>
            </div>
            <div className="bg-[#083B8A] p-3 rounded-xl border border-white/10 flex items-center justify-between">
              <span className="text-xs text-white">Identity & Document Check</span>
              <span className="text-xs font-semibold text-emerald-300">₹0 (Free)</span>
            </div>
            <div className="bg-[#083B8A] p-3 rounded-xl border border-white/10 flex items-center justify-between">
              <span className="text-xs text-white">Upfront Platform Retainer</span>
              <span className="text-xs font-semibold text-emerald-300">₹0 (Zero Upfront)</span>
            </div>
          </div>

          <p className="text-[11px] text-[#EAF2FF]/80 mt-1 italic">
            * Complete transparency is maintained at every phase of the recovery and bridge liquidity roadmap.
          </p>
        </div>
      </HowItWorksSection>

      {/* SECTION 2: IMMEDIATE CASH FLOW FOR FAMILIES */}
      <HowItWorksSection
        id="cash-flow"
        sectionNumber="03.2"
        badge="Liquidity Bridge Concept"
        title="Immediate Cash Flow for Families"
        description="Where eligible and supported, WealthPass can be designed to provide a liquidity bridge for families while the underlying asset recovery process is being completed. Often, claims take 30 to 90 days to settle through statutory institutional queues; an advance helps families cover immediate life obligations."
        disclaimer="Eligible users may be able to access a structured liquidity pathway, subject to verification, eligibility and applicable terms. Approval and advance amounts depend on asset confirmation, underwriting criteria, and regulated partner approval."
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] uppercase tracking-widest text-primary/70 font-semibold">
              The Liquidity Bridge Model
            </span>
            <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded font-mono">
              Concept
            </span>
          </div>

          <div className="bg-[#083B8A] p-4 rounded-xl border border-white/10 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <p className="text-xs text-blue-100">
                <span className="font-semibold text-white">Verified Asset as Foundation:</span> The confirmed institutional claim serves as the security basis for underwriting.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <p className="text-xs text-blue-100">
                <span className="font-semibold text-white">Timely Disbursal:</span> Approved funds can be transferred directly to the verified legal heir's bank account.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </div>
              <p className="text-xs text-blue-100">
                <span className="font-semibold text-white">Zero Stress During Waiting:</span> Urgent expenses are met while the institutional claim finishes its legal cycle.
              </p>
            </div>
          </div>
        </div>
      </HowItWorksSection>

      {/* SECTION 3: SECURE, AUTOMATED PAYBACK PATH */}
      <HowItWorksSection
        id="payback-path"
        sectionNumber="03.3"
        badge="Settlement Mechanism"
        title="Secure, Automated Payback Path"
        description="If a liquidity bridge is provided, repayment/recovery settlement should follow a clearly defined and transparent mechanism. When the institution releases the full claim amount, the advance is settled automatically with zero manual follow-up required."
      >
        <div className="flex flex-col gap-3">
          <span className="text-[10px] uppercase tracking-widest text-primary/70 font-semibold mb-2">
            Settlement Lifecycle Flow
          </span>

          {/* Visual Lifecycle */}
          <div className="flex flex-col items-center gap-2 text-xs">
            <div className="w-full max-w-sm bg-[#083B8A] px-4 py-2 rounded-xl border border-white/10 text-center text-white">
              ASSET IDENTIFIED
            </div>
            <ArrowDown className="w-3 h-3 text-primary/60" />

            <div className="w-full max-w-sm bg-[#083B8A] px-4 py-2 rounded-xl border border-white/10 text-center text-white">
              ELIGIBILITY CHECK
            </div>
            <ArrowDown className="w-3 h-3 text-primary/60" />

            <div className="w-full max-w-sm bg-[#0646AD] px-4 py-2 rounded-xl border border-white/20 text-center font-medium text-white">
              LIQUIDITY BRIDGE
            </div>
            <ArrowDown className="w-3 h-3 text-primary/60" />

            <div className="w-full max-w-sm bg-[#083B8A] px-4 py-2 rounded-xl border border-white/10 text-center text-white">
              CLAIM RECOVERY
            </div>
            <ArrowDown className="w-3 h-3 text-primary/60" />

            <div className="w-full max-w-sm bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-4 py-2 rounded-xl text-center font-semibold">
              SETTLEMENT
            </div>
          </div>

          <div className="mt-2 p-3 bg-[#083B8A] rounded-xl border border-white/10 flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 text-primary shrink-0" />
            <p className="text-[11px] text-[#EAF2FF]">
              Remaining balance after advance settlement is transferred directly to the beneficiary.
            </p>
          </div>
        </div>
      </HowItWorksSection>

      {/* SECTION 4: TRANSPARENT STATUS */}
      <HowItWorksSection
        id="transparent-status"
        sectionNumber="03.4"
        badge="Product Concept"
        title="Transparent Status"
        description="A real-time status component provides complete visibility into every checkpoint of the recovery process, showing what has been identified, what is under review, and what is available."
        disclaimer="Important Prototype Notice: This is a product concept and prototype display. WealthPass does not represent fictional transactions as completed or claim fabricated institutional partnerships."
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] uppercase tracking-widest text-primary/70 font-semibold">
              WEALTHPASS RECOVERY
            </span>
            <span className="text-[10px] text-[#EAF2FF]/70 uppercase tracking-wider">
              Prototype View
            </span>
          </div>

          {/* Mock Status Component */}
          <div className="flex flex-col gap-2.5">
            {/* Status 1 */}
            <div className="bg-[#083B8A] px-4 py-3 rounded-xl border border-emerald-400/30 flex items-center justify-between">
              <span className="text-xs font-medium text-blue-100">Asset</span>
              <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                Potentially Identified ✓
              </span>
            </div>

            {/* Status 2 */}
            <div className="bg-[#083B8A] px-4 py-3 rounded-xl border border-amber-400/30 flex items-center justify-between">
              <span className="text-xs font-medium text-blue-100">Eligibility</span>
              <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                Under Review ●
              </span>
            </div>

            {/* Status 3 */}
            <div className="bg-[#083B8A] px-4 py-3 rounded-xl border border-white/10 flex items-center justify-between opacity-80">
              <span className="text-xs font-medium text-blue-200">Recovery</span>
              <span className="text-xs font-medium text-blue-100 flex items-center gap-1.5">
                Pending ○
              </span>
            </div>

            {/* Status 4 */}
            <div className="bg-[#083B8A] px-4 py-3 rounded-xl border border-white/20 flex items-center justify-between">
              <span className="text-xs font-medium text-blue-100">Liquidity</span>
              <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                Available if Eligible ○
              </span>
            </div>
          </div>
        </div>
      </HowItWorksSection>

      {/* STEP NAVIGATION */}
      <StepNavigation
        prevStep={{
          name: "02 Claim Preparation",
          path: "/how-it-works/claim-preparation",
        }}
        onNavigate={onNavigate}
      />
    </div>
  );
};
