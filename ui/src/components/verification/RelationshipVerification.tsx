import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Users, Shield, CheckCircle2, XCircle, ArrowRight,
  Upload, AlertCircle, FileCheck, Check
} from "lucide-react";
import type { VerificationResult } from "../../services/IdentityVerificationProvider";
import { WealthPassProcessingPanel } from "../processing/WealthPassProcessingPanel";
import type { ChecklistItem } from "../processing/WealthPassProcessingPanel";

interface RelationshipVerificationProps {
  verificationResult: VerificationResult;
  onProceedToDiscovery: (relationshipData: {
    relationship: string;
    claimantName: string;
    deceasedName: string;
    consentGranted: boolean;
  }) => void;
  onBack: () => void;
}

const RELATIONSHIP_OPTIONS = [
  { id: "Son", label: "Son", heirClass: "Class 1 Heir", desc: "Biological or legally adopted son (Hindu / Indian Succession Act)" },
  { id: "Daughter", label: "Daughter", heirClass: "Class 1 Heir", desc: "Biological or legally adopted daughter with equal coparcenary rights" },
  { id: "Spouse", label: "Spouse", heirClass: "Class 1 Heir", desc: "Surviving legal husband or wife" },
  { id: "Mother", label: "Mother", heirClass: "Class 1 Heir", desc: "Biological mother of deceased" },
  { id: "Father", label: "Father", heirClass: "Class 2 Heir", desc: "Father of deceased (inherits in absence of Class 1 heirs)" },
  { id: "Brother", label: "Brother", heirClass: "Class 2 Heir", desc: "Brother of deceased (inherits in absence of Class 1 heirs & parents)" },
  { id: "Sister", label: "Sister", heirClass: "Class 2 Heir", desc: "Sister of deceased (inherits in absence of Class 1 heirs & parents)" },
  { id: "Legal heir", label: "Legal Heir / Representative", heirClass: "Testamentary / Court Decree", desc: "Succession certificate / letter of administration / probate decree holder" },
];

const STATUS_STEPS = [
  "NOT_STARTED",
  "DOCUMENTS_REQUIRED",
  "EVIDENCE_SUBMITTED",
  "UNDER_REVIEW",
  "NEEDS_CLARIFICATION",
  "VERIFIED",
  "REJECTED"
];

export function RelationshipVerification({
  verificationResult,
  onProceedToDiscovery,
  onBack
}: RelationshipVerificationProps) {
  const [selectedRelationship, setSelectedRelationship] = useState("Son");
  const [claimantName, setClaimantName] = useState("Rohan Mehta");
  const [deceasedName, setDeceasedName] = useState("Arun Mehta");
  const [certNo, setCertNo] = useState("MUM-2023-998877");
  const [discoveryConsent, setDiscoveryConsent] = useState(true);

  // Evidence upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [evidenceResult, setEvidenceResult] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status machine state
  const [currentStatus, setCurrentStatus] = useState<string>("DOCUMENTS_REQUIRED");

  // Assessment processing panel
  const [assessmentStatus, setAssessmentStatus] = useState<"working" | "done" | "error" | "idle">("idle");
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [assessmentChecklist, setAssessmentChecklist] = useState<ChecklistItem[]>([
    { id: "rel-token", name: "Claimant Identity Reference (Masked)", status: "COMPLETED" },
    { id: "rel-declaration", name: "Kinship Declaration & Succession Class", status: "PENDING" },
    { id: "rel-evidence", name: "Statutory Evidence & OCR Field Comparison", status: "PENDING" },
    { id: "rel-inst", name: "Institutional Claim Entitlement Review", status: "PENDING" }
  ]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Document exceeds 5MB limit. Please upload a smaller scan.");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["pdf", "png", "jpg", "jpeg"].includes(ext)) {
      setUploadError("Only PDF, PNG, and JPG files are permitted.");
      return;
    }

    setUploadFile(file);
    setUploadError(null);
    setIsUploadingEvidence(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", "DEATH_CERTIFICATE");
    formData.append("deceased_name", deceasedName);
    formData.append("death_certificate_no", certNo);
    formData.append("relation", selectedRelationship);

    try {
      const res = await fetch("/api/relationship/evidence/", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEvidenceResult(data);
        setCurrentStatus(data.relationship_status || "EVIDENCE_SUBMITTED");
      } else {
        setUploadError(data.error || "Evidence upload and consistency extraction failed.");
      }
    } catch {
      setUploadError("Network error while submitting evidence.");
    } finally {
      setIsUploadingEvidence(false);
    }
  };

  const handleSubmit = async () => {
    if (!discoveryConsent) return;
    setAssessmentStatus("working");
    setAssessmentError(null);

    try {
      const relRes = await fetch("/api/relationship/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relationship: selectedRelationship,
          claimant_name: claimantName,
          deceased_name: deceasedName
        })
      });

      const relData = await relRes.json();

      const consentRes = await fetch("/api/consent/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "GRANT",
          purpose: "ASSET_DISCOVERY"
        })
      });

      if (!relRes.ok || !consentRes.ok) {
        setAssessmentStatus("error");
        setAssessmentError(relData.error || "Unable to record relationship declaration or consent.");
        return;
      }

      setAssessmentChecklist([
        { id: "rel-token", name: `Claimant Identity Token (${verificationResult.reference})`, status: "COMPLETED" },
        { id: "rel-declaration", name: `Kinship Declaration: ${selectedRelationship} to ${deceasedName}`, status: "COMPLETED" },
        { id: "rel-evidence", name: evidenceResult ? `Evidence Analyzed: ${uploadFile?.name || "Civil Certificate"}` : "Evidence Assessment Pending", status: evidenceResult ? "COMPLETED" : "IN_PROGRESS" },
        { id: "rel-inst", name: "Institutional Verification: Evidence Pending Official Branch Review", status: "IN_PROGRESS" }
      ]);
      setAssessmentStatus("done");
    } catch {
      setAssessmentStatus("error");
      setAssessmentError("Network communication error recording relationship declaration.");
    }
  };

  const handleFinishAndProceed = () => {
    onProceedToDiscovery({
      relationship: selectedRelationship,
      claimantName,
      deceasedName,
      consentGranted: true
    });
  };

  return (
    <div className="min-h-screen bg-[#0755C9] text-white font-['Almarai'] selection:bg-white/20 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#083B8A]/85 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-xs text-white/70 hover:text-white transition-colors flex items-center gap-1.5 group cursor-pointer"
            >
              <span className="group-hover:text-white">← Identity</span>
            </button>
            <span className="text-white/20">/</span>
            <span className="text-sm text-white font-medium tracking-wide">Relationship Verification</span>
          </div>

          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-amber-400/40 bg-amber-500/20 text-amber-200 text-xs font-mono">
            <span>State Machine: {currentStatus}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 lg:py-16">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-mono tracking-widest uppercase text-white mb-4">
            <Users className="w-3.5 h-3.5 text-primary" /> Statutory Succession Protocol
          </div>
          <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-white mb-4">
            Claimant–Deceased <span className="font-['Instrument_Serif'] italic text-[#EAF2FF]">Relationship</span>
          </h1>
          <p className="text-[#EAF2FF] text-sm sm:text-base leading-relaxed">
            Record kinship declarations, review statutory evidence checklists, and upload civil registry documents.
          </p>
        </motion.div>

        {/* 7-Stage Status Machine Progress Track */}
        <div className="mb-10 p-5 rounded-2xl bg-[#0646AD] border border-white/10">
          <div className="text-xs font-mono uppercase tracking-widest text-[#EAF2FF]/80 mb-3 flex items-center justify-between">
            <span>Relationship Status Machine</span>
            <span className="text-amber-300">Current: {currentStatus}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-[10px] font-mono">
            {STATUS_STEPS.map((step, idx) => {
              const isCurrent = step === currentStatus;
              const isPassed = STATUS_STEPS.indexOf(currentStatus) >= idx;
              return (
                <div
                  key={step}
                  className={`p-2 rounded-lg border text-center transition-colors ${
                    isCurrent
                      ? "border-amber-300 bg-amber-500/25 text-amber-200 font-semibold"
                      : isPassed
                      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                      : "border-white/10 bg-[#083B8A] text-white/50"
                  }`}
                >
                  <div className="text-[9px] text-[#EAF2FF]/60 mb-0.5">0{idx + 1}</div>
                  <div className="truncate">{step.replace("_", " ")}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Container */}
        <div className="space-y-8">
          {/* Section 1: Declaration */}
          <div className="bg-[#0646AD] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-medium text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> 1. Claimant Kinship Declaration
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[#EAF2FF] mb-2">
                  Claimant Legal Name
                </label>
                <input
                  type="text"
                  value={claimantName}
                  onChange={(e) => setClaimantName(e.target.value)}
                  className="w-full bg-[#083B8A] border border-white/15 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/40"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[#EAF2FF] mb-2">
                  Deceased Person Legal Name
                </label>
                <input
                  type="text"
                  value={deceasedName}
                  onChange={(e) => setDeceasedName(e.target.value)}
                  className="w-full bg-[#083B8A] border border-white/15 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-[#EAF2FF] mb-3">
                Claimant's Relationship to Deceased Person
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {RELATIONSHIP_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedRelationship(opt.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedRelationship === opt.id
                        ? "border-primary bg-white/10"
                        : "border-white/10 bg-[#083B8A] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-xs text-white">{opt.label}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-blue-200">
                        {opt.heirClass.split(" ")[0]}
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-100 line-clamp-2">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Statutory Evidence Upload & OCR Assessment */}
          <div className="bg-[#0646AD] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-medium text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-primary" /> 2. Statutory Evidence Upload &amp; Field Check
            </h2>
            <p className="text-xs text-[#EAF2FF] leading-relaxed">
              Upload the civil registration Death Certificate or primary kinship proof. Our system extracts text and runs field consistency checks against your declaration.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[#EAF2FF] mb-2">
                  Death Certificate Number
                </label>
                <input
                  type="text"
                  value={certNo}
                  onChange={(e) => setCertNo(e.target.value)}
                  placeholder="e.g. MUM-2023-998877"
                  className="w-full bg-[#083B8A] border border-white/15 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/40"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[#EAF2FF] mb-2">
                  Upload Document (PDF / PNG / JPG, max 5MB)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingEvidence}
                  className="w-full py-3 px-4 rounded-xl border border-dashed border-white/20 bg-[#083B8A] hover:bg-white/10 text-xs text-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 text-primary" />
                  {isUploadingEvidence
                    ? "Extracting OCR & Checking Fields..."
                    : uploadFile
                    ? `Selected: ${uploadFile.name}`
                    : "Select Evidence Document"}
                </button>
              </div>
            </div>

            {uploadError && (
              <div className="p-3.5 rounded-lg bg-red-500/20 border border-red-400/40 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {uploadError}
              </div>
            )}

            {/* Evidence Assessment Result */}
            {evidenceResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-xl bg-[#083B8A] border border-white/15 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
                    <Check className="w-4 h-4" />
                    <span>EVIDENCE STORED: {evidenceResult.document?.filename}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/30">
                    Verdict: {evidenceResult.document?.consistency_assessment?.assessment_verdict}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-blue-200 text-[10px]">Deceased Name</div>
                    <div className={evidenceResult.document?.consistency_assessment?.matches_deceased_name ? "text-emerald-300 font-semibold" : "text-amber-300"}>
                      {evidenceResult.document?.consistency_assessment?.matches_deceased_name ? "✓ MATCHED" : "UNCONFIRMED"}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-blue-200 text-[10px]">Certificate Number</div>
                    <div className={evidenceResult.document?.consistency_assessment?.matches_certificate_no ? "text-emerald-300 font-semibold" : "text-amber-300"}>
                      {evidenceResult.document?.consistency_assessment?.matches_certificate_no ? "✓ MATCHED" : "UNCONFIRMED"}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-blue-200 text-[10px]">Civil Header</div>
                    <div className={evidenceResult.document?.consistency_assessment?.has_death_certificate_header ? "text-emerald-300 font-semibold" : "text-amber-300"}>
                      {evidenceResult.document?.consistency_assessment?.has_death_certificate_header ? "✓ DETECTED" : "NOT DETECTED"}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-blue-100 italic leading-relaxed pt-2 border-t border-white/10">
                  "Notice: OCR field comparison measures document consistency. It does NOT prove legal authenticity or statutory entitlement. Final adjudication is conducted by the holding institution."
                </p>
              </motion.div>
            )}
          </div>

          {/* Section 3: Informed Consent & Discovery Action */}
          <div className="bg-[#0646AD] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-medium text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> 3. Asset Discovery Informed Consent
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs leading-relaxed">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/30 space-y-1.5">
                <div className="font-mono text-emerald-300 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> What WealthPass Will Do:
                </div>
                <ul className="space-y-1 text-white">
                  <li>✓ Query statutory discovery channels (UDGAM, Bima Bharosa, MF Central, IEPF)</li>
                  <li>✓ Compare permitted identifiers against official records</li>
                  <li>✓ Provide official process guides for manual recovery</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-red-500/10 border border-red-400/30 space-y-1.5">
                <div className="font-mono text-red-300 font-semibold flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" /> What WealthPass Will NOT Do:
                </div>
                <ul className="space-y-1 text-white">
                  <li>✕ Fabricate fake bank deposits, folios, or balances</li>
                  <li>✕ Store full 12-digit Aadhaar or biometrics</li>
                  <li>✕ Grant automatic claim settlement (institution decides)</li>
                </ul>
              </div>
            </div>

            <label className="flex items-start gap-3.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={discoveryConsent}
                onChange={(e) => setDiscoveryConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded bg-[#083B8A] border-white/20 text-white focus:ring-0 cursor-pointer accent-primary"
              />
              <span className="text-sm text-white leading-relaxed font-medium">
                I GRANT INFORMED CONSENT for WealthPass to query statutory discovery channels using declared identifiers.
              </span>
            </label>

            {assessmentStatus !== "idle" ? (
              <div className="pt-6 border-t border-white/10 space-y-4">
                <WealthPassProcessingPanel
                  operation="RELATIONSHIP_ASSESSMENT"
                  status={assessmentStatus}
                  label={assessmentStatus === "working" ? "Assessing statutory evidence" : assessmentStatus === "error" ? "Evidence assessment failed" : "Kinship declaration recorded"}
                  description="Evaluating claimant relationship declaration against institutional evidence guidelines and regulatory succession standards."
                  subNotice="Status is recorded under the 7-stage state machine. Custodian institution requires physical or certified evidence."
                  errorMessage={assessmentError}
                  onRetry={handleSubmit}
                  onContinue={handleFinishAndProceed}
                  continueLabel="Proceed to Asset Discovery"
                  checklist={assessmentChecklist}
                />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={onBack}
                  className="text-xs text-blue-200 hover:text-white transition-colors cursor-pointer"
                >
                  ← Back to Identity
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!discoveryConsent}
                  className="w-full sm:w-auto py-3.5 px-8 rounded-xl bg-primary hover:bg-white text-[#102A56] font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Record Kinship &amp; Search Statutory Sources</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
