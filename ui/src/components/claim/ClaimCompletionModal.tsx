import React, { useEffect, useRef } from "react";
import { X, ArrowRight, Download, Briefcase } from "lucide-react";
import { ClaimSuccessBadge } from "./ClaimSuccessBadge";

export interface ClaimCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * "FORM_COMPLETE" displays "Claim Form Complete" per Section 7.
   * "CLAIM_SUBMITTED" displays "Claim Submitted" per Section 7.
   */
  type?: "FORM_COMPLETE" | "CLAIM_SUBMITTED";
  caseReference?: string;
  deceasedName?: string;
  institutionName?: string;
  onViewClaim?: () => void;
  onBackToDashboard: () => void;
  claimUrl?: string;
}

export const ClaimCompletionModal: React.FC<ClaimCompletionModalProps> = ({
  isOpen,
  onClose,
  type = "FORM_COMPLETE",
  caseReference,
  deceasedName,
  institutionName,
  onViewClaim,
  onBackToDashboard,
  claimUrl,
}) => {
  // Prevent duplicate trigger re-animations during component re-renders
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      hasAnimatedRef.current = true;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isSubmitted = type === "CLAIM_SUBMITTED";
  const title = isSubmitted ? "Claim Submitted" : "Claim Form Complete";
  const description = isSubmitted
    ? `Your asset discovery case${
        deceasedName ? ` for ${deceasedName}` : ""
      } has been logged in our secure registry and queued for statutory checking across official regulatory repositories.`
    : "Your claim information is ready for final review. Check your details and follow the next steps for submitting your claim to the relevant institution.";

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/85 backdrop-blur-md flex items-center justify-center p-4 selection:bg-[#E5E0C9] selection:text-[#080808]">
      <div
        className="w-full max-w-lg bg-[#111111] border border-[#292929] rounded-3xl p-8 sm:p-12 shadow-2xl relative text-center flex flex-col items-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-completion-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#A4A4A4] hover:text-[#F1EEDC] p-1.5 rounded-full hover:bg-[#171717] transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. Glossy Blue Verification Badge (Responsive: 156px desktop, 120px mobile) */}
        <div className="mb-6 flex items-center justify-center">
          <div className="hidden sm:block">
            <ClaimSuccessBadge size={156} />
          </div>
          <div className="block sm:hidden">
            <ClaimSuccessBadge size={120} />
          </div>
        </div>

        {/* 2. Completion Title */}
        <h2
          id="claim-completion-title"
          className="text-2xl sm:text-3xl font-normal sm:font-medium text-[#F1EEDC] tracking-tight mb-3"
        >
          {title}
        </h2>

        {/* 3. Supporting Description */}
        <p className="text-xs sm:text-sm text-[#A4A4A4] leading-relaxed max-w-md mx-auto mb-6">
          {description}
        </p>

        {/* Optional Metadata Box (Zero fake data) */}
        {(caseReference || institutionName) && (
          <div className="w-full bg-[#080808] border border-[#202020] rounded-xl p-3.5 mb-6 text-xs text-left space-y-1.5 font-mono">
            {caseReference && (
              <div className="flex justify-between items-center">
                <span className="text-[#777777]">Case Reference:</span>
                <span className="text-[#E5E0C9] font-medium">{caseReference}</span>
              </div>
            )}
            {institutionName && (
              <div className="flex justify-between items-center">
                <span className="text-[#777777]">Custodian Institution:</span>
                <span className="text-[#F1EEDC]">{institutionName}</span>
              </div>
            )}
          </div>
        )}

        {/* 4. Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full pt-2">
          {claimUrl ? (
            <a
              href={claimUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#E5E0C9] text-[#080808] font-semibold text-xs sm:text-sm hover:bg-[#F1EEDC] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>View Claim</span>
            </a>
          ) : onViewClaim ? (
            <button
              type="button"
              onClick={onViewClaim}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#E5E0C9] text-[#080808] font-semibold text-xs sm:text-sm hover:bg-[#F1EEDC] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <ArrowRight className="w-4 h-4" />
              <span>View Claim</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={onBackToDashboard}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-[#303030] bg-[#171717] hover:bg-[#202020] text-[#A4A4A4] hover:text-[#F1EEDC] font-medium text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Briefcase className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClaimCompletionModal;
