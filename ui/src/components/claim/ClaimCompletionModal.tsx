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
    <div className="fixed inset-0 z-50 bg-[#083B8A]/80 backdrop-blur-md flex items-center justify-center p-4 selection:bg-primary selection:text-[#102A56]">
      <div
        className="w-full max-w-lg bg-[#0646AD] border border-white/20 rounded-3xl p-8 sm:p-12 shadow-2xl relative text-center flex flex-col items-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-completion-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-blue-200 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
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
          className="text-2xl sm:text-3xl font-medium text-white tracking-tight mb-3"
        >
          {title}
        </h2>

        {/* 3. Supporting Description */}
        <p className="text-xs sm:text-sm text-[#EAF2FF] leading-relaxed max-w-md mx-auto mb-6">
          {description}
        </p>

        {/* Optional Metadata Box (Zero fake data) */}
        {(caseReference || institutionName) && (
          <div className="w-full bg-[#083B8A] border border-white/15 rounded-xl p-3.5 mb-6 text-xs text-left space-y-1.5 font-mono">
            {caseReference && (
              <div className="flex justify-between items-center">
                <span className="text-blue-200">Case Reference:</span>
                <span className="text-primary font-medium">{caseReference}</span>
              </div>
            )}
            {institutionName && (
              <div className="flex justify-between items-center">
                <span className="text-blue-200">Custodian Institution:</span>
                <span className="text-white">{institutionName}</span>
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
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-primary text-[#102A56] font-semibold text-xs sm:text-sm hover:bg-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>View Claim</span>
            </a>
          ) : onViewClaim ? (
            <button
              type="button"
              onClick={onViewClaim}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-primary text-[#102A56] font-semibold text-xs sm:text-sm hover:bg-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <ArrowRight className="w-4 h-4" />
              <span>View Claim</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={onBackToDashboard}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-white/20 bg-[#083B8A] hover:bg-white/15 text-[#EAF2FF] hover:text-white font-medium text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
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
