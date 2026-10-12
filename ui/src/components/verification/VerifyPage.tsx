import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Check, Lock, AlertCircle, ArrowRight, FileText, ChevronRight, Landmark, KeyRound } from "lucide-react";
import { defaultVerificationProvider } from "../../services/IdentityVerificationProvider";
import type { VerificationResult } from "../../services/IdentityVerificationProvider";

interface VerifyPageProps {
  onVerificationComplete: (result: VerificationResult) => void;
  onNavigateHome: () => void;
}

export function VerifyPage({ onVerificationComplete, onNavigateHome }: VerifyPageProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>("OFFICIAL_MANUAL_PROCESS");
  const [last4Input, setLast4Input] = useState("4821");
  const [consentGiven, setConsentGiven] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const handleExecuteVerify = async () => {
    if (!consentGiven) {
      setError("Informed user consent is mandatory prior to identity verification.");
      return;
    }
    setError(null);
    setIsVerifying(true);

    try {
      const res = await defaultVerificationProvider.verifyIdentity({
        identifierInput: last4Input,
        consentGiven: true,
        provider: selectedProvider
      });
      if (!res.success && res.error) {
        setError(res.error);
      }
      setVerificationResult(res);
    } catch (err: any) {
      setError(err?.message || "Verification request could not be processed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#E1E0CC] font-['Almarai'] selection:bg-white/20 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="text-xs text-white/50 hover:text-[#E1E0CC] transition-colors flex items-center gap-1.5 group cursor-pointer"
            >
              <span className="group-hover:text-white/80">← Home</span>
            </button>
            <span className="text-white/20">/</span>
            <span className="text-sm text-[#E1E0CC] font-medium tracking-wide">Identity Verification</span>
          </div>

          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-white/15 bg-white/5 text-white/70 text-xs font-mono">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Statutory Data Minimization
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 lg:py-16">
        {/* Editorial Subtitle & Hero */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono tracking-widest uppercase text-white/60 mb-4">
            <Shield className="w-3.5 h-3.5 text-[#DEDBC8]" /> Safe &amp; Private
          </div>
          <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-[#E1E0CC] mb-4">
            Claimant <span className="font-['Instrument_Serif'] italic text-white">Identity</span>
          </h1>
          <p className="text-white/60 text-sm sm:text-base leading-relaxed">
            Verify claimant identity safely without storing full Aadhaar numbers, biometric payloads, or private OTPs.
          </p>
        </motion.div>

        {/* Essential Statutory Separation Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <div className="p-4 rounded-xl border border-white/10 bg-[#0c0c0c] text-xs">
            <span className="text-amber-400 font-mono block mb-1">RULE 01</span>
            <div className="font-medium text-white mb-1">Phone ≠ Identity</div>
            <p className="text-white/50 leading-relaxed">Phone OTP confirms possession of SIM, never legal identity or entitlement.</p>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-[#0c0c0c] text-xs">
            <span className="text-amber-400 font-mono block mb-1">RULE 02</span>
            <div className="font-medium text-white mb-1">Identity ≠ Kinship</div>
            <p className="text-white/50 leading-relaxed">Government ID proves who you are, but does not prove family relationship to the deceased.</p>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-[#0c0c0c] text-xs">
            <span className="text-amber-400 font-mono block mb-1">RULE 03</span>
            <div className="font-medium text-white mb-1">Kinship ≠ Entitlement</div>
            <p className="text-white/50 leading-relaxed">Legal entitlement is established only by official nomination, succession decree, or statutory class.</p>
          </div>
        </div>

        {!verificationResult ? (
          /* Step 1: Verification Gateway Card */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-[#0e0e0e] border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden"
          >
            <div className="space-y-8">
              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-white/60 mb-3">
                  Select Authorized Verification Channel
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedProvider("OFFICIAL_MANUAL_PROCESS")}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedProvider === "OFFICIAL_MANUAL_PROCESS"
                        ? "border-[#E1E0CC] bg-white/5"
                        : "border-white/10 bg-black/40 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-[#E1E0CC] flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-emerald-400" />
                        In-Person Institutional KYC
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        STANDARD
                      </span>
                    </div>
                    <p className="text-xs text-white/50">
                      Standard RBI &amp; IRDAI statutory verification conducted at bank or insurer branch with physical OVD.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedProvider("SETU_AA_IDENTITY")}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedProvider === "SETU_AA_IDENTITY"
                        ? "border-[#E1E0CC] bg-white/5"
                        : "border-white/10 bg-black/40 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-[#E1E0CC] flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-cyan-400" />
                        Setu Account Aggregator
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        AA GATEWAY
                      </span>
                    </div>
                    <p className="text-xs text-white/50">
                      Cryptographic consent verification via RBI-regulated Account Aggregator framework.
                    </p>
                  </button>
                </div>
              </div>

              {/* Masked Identifier Entry */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-white/60 mb-2">
                  Last 4 Digits of Officially Valid ID
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center bg-black/60 border border-white/15 rounded-xl px-4 py-3.5 text-lg font-mono tracking-wider focus-within:border-white/40 transition-colors">
                    <span className="text-white/40 select-none mr-2">XXXX  XXXX</span>
                    <input
                      type="text"
                      maxLength={4}
                      value={last4Input}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setLast4Input(val);
                      }}
                      className="bg-transparent border-none outline-none text-[#E1E0CC] w-16 tracking-widest"
                      placeholder="4821"
                    />
                  </div>
                </div>
                <p className="text-xs text-white/40 mt-2 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#DEDBC8]" />
                  Data Minimization Guarantee: Only last 4 digits are accepted. Full 12-digit numbers are rejected.
                </p>
              </div>

              {/* Informed Consent Checkbox */}
              <div className="pt-2 border-t border-white/10">
                <label className="flex items-start gap-3.5 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded bg-black border-white/20 text-white focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#E1E0CC]"
                  />
                  <span className="text-sm text-white/80 group-hover:text-white leading-relaxed">
                    I grant informed consent for claimant identity verification solely for tracing eligible unclaimed family assets across statutory discovery registries.
                  </span>
                </label>
              </div>

              {error && (
                <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="button"
                  onClick={handleExecuteVerify}
                  disabled={isVerifying}
                  className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-xl bg-[#E1E0CC] hover:bg-white text-black font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Connecting to Authorized Gateway...
                    </>
                  ) : (
                    <>
                      Verify Claimant Identity
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Step 2: Verification Receipt */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-[#0e0e0e] border border-white/15 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden"
          >
            {/* Header Badge */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-[#E1E0CC] tracking-tight">IDENTITY VERIFICATION RECORDED</h2>
                  <p className="text-xs text-white/50">{verificationResult.provider}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                STATUS: {verificationResult.status}
              </span>
            </div>

            {/* Receipt Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-black/60 border border-white/10">
                <div className="text-xs font-mono text-white/40 uppercase tracking-widest mb-1">Reference Code</div>
                <div className="text-base font-mono text-[#DEDBC8] font-medium">{verificationResult.reference}</div>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-white/10">
                <div className="text-xs font-mono text-white/40 uppercase tracking-widest mb-1">Masked Identifier</div>
                <div className="text-base font-mono text-white/90">{verificationResult.maskedIdentifier}</div>
              </div>
            </div>

            {verificationResult.guidance && (
              <div className="mb-8 p-4 rounded-xl border border-white/10 bg-white/[0.02] text-xs text-white/70 leading-relaxed">
                <strong className="text-white block mb-1">Statutory Guidance:</strong>
                {verificationResult.guidance}
              </div>
            )}

            {/* Data Minimization Guarantees */}
            <div className="mb-8 p-5 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="text-xs font-mono text-white/50 uppercase tracking-widest mb-3 flex items-center justify-between">
                <span>Data Protection Guarantees</span>
                <span className="text-emerald-400 text-[11px] font-normal">Active Minimization</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-white/80">
                {verificationResult.dataProtectionGuarantees.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Purpose */}
            <div className="mb-8 text-xs text-white/50 leading-relaxed border-t border-white/10 pt-4 flex items-start gap-2">
              <FileText className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white/80">Authorized Purpose: </strong>
                Identity credentialing for statutory asset discovery. Next step: Statutory Relationship Verification.
              </div>
            </div>

            {/* CTA */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setVerificationResult(null)}
                className="text-xs text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                ← Change Verification Channel
              </button>

              <button
                type="button"
                onClick={() => onVerificationComplete(verificationResult)}
                className="w-full sm:w-auto py-3 px-6 rounded-xl bg-[#E1E0CC] hover:bg-white text-black font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                Proceed to Relationship Verification
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
