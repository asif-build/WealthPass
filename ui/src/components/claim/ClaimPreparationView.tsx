import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, CheckCircle2, Download } from "lucide-react";
import type { DiscoveredAssetItem } from "../../services/AssetDiscoveryEngine";
import type { VerificationResult } from "../../services/IdentityVerificationProvider";
import { WealthPassProcessingPanel } from "../processing/WealthPassProcessingPanel";
import { apiFetch } from "../../services/apiClient";
import { ClaimCompletionModal } from "./ClaimCompletionModal";

interface ClaimPreparationViewProps {
  selectedAsset: DiscoveredAssetItem | null;
  verificationResult: VerificationResult;
  relationshipData: {
    relationship: string;
    claimantName: string;
    deceasedName: string;
    consentGranted: boolean;
  };
  onNavigateDiscovery: () => void;
  onNavigateHome: () => void;
}

interface ChecklistItem {
  id: string;
  name: string;
  description: string;
  status: "COMPLETED" | "IN_PROGRESS" | "PENDING";
}

export function ClaimPreparationView({
  selectedAsset,
  verificationResult,
  relationshipData,
  onNavigateDiscovery,
  onNavigateHome
}: ClaimPreparationViewProps) {
  // Fallback asset if navigated directly to /claim
  const asset: DiscoveredAssetItem = selectedAsset || {
    id: "AST-INS-9821",
    assetType: "Life Insurance",
    institution: "Life Insurance Corporation of India (LIC)",
    sourceId: "IRDAI_BIMA_BHAROSA",
    sourceName: "IRDAI / Insurer discovery pathway",
    potentialValue: "₹1,82,450",
    numericValue: 182450,
    matchSignals: ["Policyholder name", "Date of birth", "Permitted identifier"],
    confidence: "HIGH",
    status: "POTENTIAL MATCH",
    isDemo: true,
    demoLabel: "PROTOTYPE RESULT",
    disclaimer: "This result does not establish ownership. The relevant insurer must verify the claimant before any payment or transfer.",
    whatHappensNext: "Submit death certificate, claim Form 3783, and bank mandate to the servicing branch for transmission review.",
    howFound: {
      source: "IRDAI Bima Bharosa & Insurer discovery pathway",
      steps: [],
      dataUsed: ["Deceased name: Arun Mehta", "Permitted identifier check", "Claimant relationship: Son"],
      dataNotStored: ["Full Aadhaar", "Biometrics", "Private policy documents"]
    }
  };

  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: "doc-id",
      name: "Claimant Identity Verification Token",
      description: `Verified reference: ${verificationResult.reference} (Zero-Knowledge token)`,
      status: "COMPLETED"
    },
    {
      id: "doc-death",
      name: "Original Death Certificate",
      description: "Certified death certificate issued by local municipal registrar",
      status: "COMPLETED"
    },
    {
      id: "doc-nominee",
      name: "Nominee Proof / Legal Heir Certificate / NOC",
      description: "Statutory proof of kinship or succession rights",
      status: "IN_PROGRESS"
    },
    {
      id: "doc-form",
      name: "Institution-Specific Claim Form (Form 3783 / Form 14)",
      description: "Pre-filled claim declaration for the custodian institution",
      status: "PENDING"
    },
    {
      id: "doc-bank",
      name: "Claimant Bank Mandate & Cancelled Cheque",
      description: "Direct credit mandate under the claimant's legal name",
      status: "PENDING"
    }
  ]);

  const [dossierGenerated, setDossierGenerated] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isPreparingDossier, setIsPreparingDossier] = useState(false);
  const [prepStatus, setPrepStatus] = useState<"working" | "done" | "error">("working");
  const [prepError, setPrepError] = useState<string | null>(null);

  const handleGenerateDossier = async () => {
    setIsPreparingDossier(true);
    setPrepStatus("working");
    setPrepError(null);

    try {
      const res = await apiFetch<{
        success: boolean;
        checklist: Array<{ id: string; name: string; status: string }>;
        milestones: Array<{ step: string; name: string; status: string }>;
        legal_notice: string;
      }>(`/api/claim-preparation/${asset.id}/`);

      if (res.ok && res.data?.success) {
        if (res.data.checklist && res.data.checklist.length > 0) {
          setChecklist(prev =>
            res.data!.checklist.map(item => {
              const match = prev.find(p => p.id === item.id);
              return {
                id: item.id,
                name: item.name,
                description: match?.description || "Institutional recovery compliance requirement.",
                status: (item.status as "COMPLETED" | "IN_PROGRESS" | "PENDING") || "PENDING"
              };
            })
          );
        }
        setPrepStatus("done");
        setDossierGenerated(true);
        setIsCompletionModalOpen(true);
      } else {
        setPrepStatus("error");
        setPrepError(res.error || "Unable to retrieve claim guidelines from institutional gateway.");
      }
    } catch {
      setPrepStatus("error");
      setPrepError("Network error while assembling recovery dossier.");
    }
  };

  const toggleCheck = (id: string) => {
    setChecklist(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === "COMPLETED" ? "PENDING" : "COMPLETED";
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  return (
    <div className="min-h-screen bg-[#0755C9] text-white font-['Almarai'] selection:bg-white/20 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#083B8A]/85 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateDiscovery}
              className="text-xs text-white/70 hover:text-white transition-colors flex items-center gap-1.5 group cursor-pointer"
            >
              <span className="group-hover:text-white">← Discovery</span>
            </button>
            <span className="text-white/20">/</span>
            <span className="text-sm text-white font-medium tracking-wide">Claim Preparation Dossier</span>
          </div>

          <div className="text-xs font-mono text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            TOKEN: {verificationResult.reference}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 lg:py-16 space-y-10">
        {/* Editorial Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-mono tracking-widest uppercase text-white mb-3">
            <FileText className="w-3.5 h-3.5 text-primary" /> Institutional Claim Gateway
          </div>
          <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-white mb-3">
            Claim <span className="font-['Instrument_Serif'] italic text-[#EAF2FF]">Preparation</span>
          </h1>
          <p className="text-[#EAF2FF] text-sm sm:text-base leading-relaxed">
            Organizing required documents and decision paths before institutional submission. WealthPass does not hold your funds—we prepare you for official recovery.
          </p>
        </motion.div>

        {/* Selected Asset Header Card */}
        <div className="bg-[#0646AD] border border-white/10 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-blue-200">
                Selected Potential Asset
              </span>
              <h2 className="text-xl font-medium text-white mt-0.5">{asset.institution}</h2>
              <p className="text-xs text-blue-100 mt-0.5">{asset.assetType} — Source: {asset.sourceName}</p>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] font-mono uppercase tracking-widest text-blue-200 block">
                Estimated Pool
              </span>
              <span className="text-2xl font-['Instrument_Serif'] text-primary">
                {asset.potentialValue}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs">
            <div>
              <span className="text-blue-200 font-mono uppercase block mb-1">Claimant Name</span>
              <span className="text-white font-medium">{relationshipData.claimantName}</span>
            </div>
            <div>
              <span className="text-blue-200 font-mono uppercase block mb-1">Declared Relationship</span>
              <span className="text-primary font-medium">{relationshipData.relationship} of {relationshipData.deceasedName}</span>
            </div>
            <div>
              <span className="text-blue-200 font-mono uppercase block mb-1">Evidence Status</span>
              <span className="text-amber-300 font-mono">Evidence Submitted</span>
            </div>
          </div>
        </div>

        {/* Claim Status Pipeline (Part 23) */}
        <div className="bg-[#0646AD] border border-white/10 rounded-2xl p-6 sm:p-8">
          <h3 className="text-xs font-mono uppercase tracking-widest text-white/50 mb-6">
            Institutional Recovery Pipeline
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
            {[
              { step: "01", label: "Potential Match", status: "completed" },
              { step: "02", label: "Evidence Collection", status: "current" },
              { step: "03", label: "Institution Review", status: "upcoming" },
              { step: "04", label: "Claim Submission", status: "upcoming" },
              { step: "05", label: "Settlement", status: "upcoming" }
            ].map((p, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex flex-col justify-between h-24 ${
                  p.status === "completed"
                    ? "bg-emerald-500/20 border-emerald-400/30 text-white"
                    : p.status === "current"
                    ? "bg-[#083B8A] border-white/30 text-white"
                    : "bg-[#083B8A]/60 border-white/5 text-blue-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-['Instrument_Serif'] text-base italic text-primary">{p.step}</span>
                  {p.status === "completed" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
                  {p.status === "current" && <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />}
                </div>
                <div className="font-medium text-[11px] leading-tight">{p.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Checklist (Part 23) */}
        <div className="bg-[#0646AD] border border-white/10 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#EAF2FF]/80">
              Document Checklist & Requirements
            </h3>
            <span className="text-xs text-blue-200 font-mono">
              Click item to toggle status
            </span>
          </div>

          <div className="space-y-3">
            {checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className="p-4 rounded-xl bg-[#083B8A] border border-white/10 hover:border-white/20 transition-all flex items-start justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      item.status === "COMPLETED"
                        ? "bg-emerald-500/30 border-emerald-400/60 text-emerald-300"
                        : "border-white/20 text-transparent"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="text-sm font-medium text-white">{item.name}</div>
                    <div className="text-xs text-blue-100 mt-0.5">{item.description}</div>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono border shrink-0 ${
                  item.status === "COMPLETED"
                    ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-300"
                    : item.status === "IN_PROGRESS"
                    ? "bg-amber-500/20 border-amber-400/30 text-amber-200"
                    : "bg-white/10 border-white/15 text-blue-200"
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-white/10 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-blue-100">
              {dossierGenerated
                ? "✓ Recovery dossier compiled with pre-filled forms."
                : "Assemble pre-filled submission pack for the custodian institution."}
            </div>

            <button
              type="button"
              disabled={isPreparingDossier && prepStatus === "working"}
              onClick={() => {
                if (dossierGenerated) {
                  setIsCompletionModalOpen(true);
                } else {
                  handleGenerateDossier();
                }
              }}
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              {dossierGenerated ? "View Completed Claim Dossier" : "Generate Pre-Filled Dossier Pack"}
            </button>
          </div>
        </div>

        {/* Processing Panel Container */}
        {isPreparingDossier && (
          <div className="my-8">
            <WealthPassProcessingPanel
              operation="CLAIM_PREPARATION"
              status={prepStatus}
              label={
                prepStatus === "working"
                  ? "Assembling statutory dossier"
                  : prepStatus === "done"
                  ? "Claim dossier compiled"
                  : "Assembly interrupted"
              }
              description={
                prepStatus === "working"
                  ? `Querying institutional guidelines and document requirements for ${asset.institution}...`
                  : prepStatus === "done"
                  ? `Statutory checklist and claim schedule ready for submission to ${asset.institution}.`
                  : (prepError || "Could not retrieve institutional requirements.")
              }
              subNotice="WealthPass prepares documentation based on custodian regulations. Institutional verification is required for release of assets."
              checklist={checklist.map(c => ({ id: c.id, name: c.name, status: c.status, required: true }))}
              errorMessage={prepError}
              onRetry={handleGenerateDossier}
              onCancel={() => setIsPreparingDossier(false)}
              onContinue={() => {
                setIsPreparingDossier(false);
                setIsCompletionModalOpen(true);
              }}
              continueLabel="Review Assembled Dossier"
            />
          </div>
        )}

        {/* Legal Disclaimer */}
        <div className="p-5 rounded-2xl bg-[#083B8A] border border-white/10 text-xs text-blue-100 leading-relaxed text-center">
          <strong className="text-white">Statutory Notice: </strong>
          WealthPass provides recovery preparation and document automation. Final adjudication of entitlement is exclusively performed by the custodian institution ({asset.institution}) in compliance with applicable law.
        </div>

        {/* Navigation Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <button
            type="button"
            onClick={onNavigateDiscovery}
            className="text-xs text-blue-200 hover:text-white transition-colors cursor-pointer"
          >
            ← Back to Discovered Assets
          </button>

          <button
            type="button"
            onClick={onNavigateHome}
            className="w-full sm:w-auto py-3 px-6 rounded-xl bg-primary hover:bg-white text-[#102A56] font-semibold text-xs transition-all shadow-md cursor-pointer"
          >
            Return to WealthPass Home
          </button>
        </div>
      </main>

      {/* Claim Success / Completion Modal with Glossy Blue Verification Badge */}
      <ClaimCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        type="FORM_COMPLETE"
        caseReference={`WP-AST-${asset.id}`}
        institutionName={asset.institution}
        claimUrl="/print-forms/default/"
        onBackToDashboard={onNavigateHome}
      />
    </div>
  );
}
