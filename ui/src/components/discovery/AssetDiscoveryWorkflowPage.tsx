import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Shield, CheckCircle2, AlertCircle, FileText,
  Upload, Trash2, RefreshCw, Landmark, Save, Check
} from "lucide-react";
import { apiFetch } from "../../services/apiClient";
import BorderGlow from "../BorderGlow/BorderGlow";
import { ClaimSuccessBadge } from "../claim/ClaimSuccessBadge";

interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
}

interface AssetDiscoveryWorkflowPageProps {
  user: UserProfile;
  onNavigate: (path: string) => void;
}

interface UploadedDocItem {
  id: string;
  filename: string;
  document_type: string;
  size_bytes?: number;
  processing_status: string;
  issuing_authority?: string;
  document_reference_no?: string;
  extracted_dates?: string[];
  consistency_assessment?: any;
  structured_info?: any;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi (NCT)", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const ASSET_CATEGORIES = [
  {
    id: "BANK_DEPOSITS",
    title: "Unclaimed Bank Deposits",
    subtitle: "Savings, current accounts, and fixed deposits dormant for >10 years.",
    source: "RBI UDGAM (30+ Commercial Banks)",
    status: "OFFICIAL_EXTERNAL_PROCESS",
    badge: "Official Portal"
  },
  {
    id: "INSURANCE",
    title: "Insurance Policy Proceeds",
    subtitle: "Matured life policies, unclaimed death benefits, and survival payouts.",
    source: "IRDAI Bima Bharosa / Insurers",
    status: "OFFICIAL_EXTERNAL_PROCESS",
    badge: "Statutory Portal"
  },
  {
    id: "MUTUAL_FUNDS",
    title: "Mutual Fund Folios",
    subtitle: "Unclaimed redemptions, uncashed dividends, and inoperative folios.",
    source: "SEBI Mitra / RTA Portals (CAMS, KFintech)",
    status: "OFFICIAL_EXTERNAL_PROCESS",
    badge: "RTA Tracing"
  },
  {
    id: "SHARES_DIVIDENDS",
    title: "Corporate Shares & Dividends",
    subtitle: "Shares and unpaid dividends transferred after 7 consecutive years.",
    source: "IEPF Authority (Ministry of Corporate Affairs)",
    status: "OFFICIAL_EXTERNAL_PROCESS",
    badge: "MCA21 Registry"
  },
  {
    id: "PF_PENSION",
    title: "Provident Fund / Inoperative EPF",
    subtitle: "Inoperative EPF accounts, EPS 1995 survivor pensions, and EDLI insurance.",
    source: "EPFO Member Portal & Statutory Trusts",
    status: "OFFICIAL_EXTERNAL_PROCESS",
    badge: "EPFO / Central"
  },
  {
    id: "OTHER_INVESTMENTS",
    title: "Small Savings, Post Office & NPS",
    subtitle: "National Savings Certificates (NSC), PPF, Post Office savings, and PRAN NPS units.",
    source: "Department of Posts & PFRDA CRA",
    status: "OFFICIAL_EXTERNAL_PROCESS",
    badge: "Govt Small Savings"
  }
];

export const AssetDiscoveryWorkflowPage: React.FC<AssetDiscoveryWorkflowPageProps> = ({
  user,
  onNavigate
}) => {
  // Step tracker: 1 to 5
  const [currentStep, setCurrentStep] = useState(1);
  const [caseId, setCaseId] = useState<string | null>(null);

  // Step 1: Deceased Person State
  const [deceasedName, setDeceasedName] = useState("");
  const [dateOfDeath, setDateOfDeath] = useState("");
  const [dateOfDeathUnknown, setDateOfDeathUnknown] = useState(false);
  const [lastKnownState, setLastKnownState] = useState("");
  const [deceasedPan, setDeceasedPan] = useState("");
  const [panUnknown, setPanUnknown] = useState(false);
  const [deathCertNo, setCaseCertNo] = useState("");

  // Step 2: Claimant Details State
  const [claimantName, setClaimantName] = useState(user.full_name || "");
  const [claimantPhone, setClaimantPhone] = useState(user.phone || "");
  const [claimantEmail, setClaimantEmail] = useState(user.email || "");
  const [relation, setRelation] = useState("Son");
  const [claimantNotes, setClaimantNotes] = useState("");

  // Step 3: Evidence Documents State
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocItem[]>([]);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<"idle" | "working" | "done" | "error">("idle");

  // Step 4: Asset Categories State
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "BANK_DEPOSITS", "INSURANCE", "MUTUAL_FUNDS", "SHARES_DIVIDENDS", "PF_PENSION", "OTHER_INVESTMENTS"
  ]);

  // Step 5: Review & Consent
  const [statutoryConsent, setStatutoryConsent] = useState(false);

  // General UI States
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSaveStatus, setDraftSaveStatus] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCase, setSubmittedCase] = useState<any | null>(null);

  // File input refs
  const deathCertInputRef = useRef<HTMLInputElement | null>(null);
  const kinshipInputRef = useRef<HTMLInputElement | null>(null);
  const successionInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const res = await apiFetch("/api/user/claims/draft/", { method: "GET" });
        if (res.ok && res.data?.draft) {
          const d = res.data.draft;
          setCaseId(d.id);
          if (d.deceased_name && d.deceased_name !== "Draft Deceased Case") setDeceasedName(d.deceased_name);
          if (d.date_of_death) setDateOfDeath(d.date_of_death);
          if (d.date_of_death_unknown) setDateOfDeathUnknown(true);
          if (d.last_known_state) setLastKnownState(d.last_known_state);
          if (d.deceased_pan) setDeceasedPan(d.deceased_pan);
          if (d.pan_unknown) setPanUnknown(true);
          if (d.death_certificate_no) setCaseCertNo(d.death_certificate_no);
          if (d.claimant_name) setClaimantName(d.claimant_name);
          if (d.relation) setRelation(d.relation);
          if (d.mobile) setClaimantPhone(d.mobile);
          if (d.claimant_notes) setClaimantNotes(d.claimant_notes);
          if (d.selected_asset_categories && d.selected_asset_categories.length > 0) {
            setSelectedCategories(d.selected_asset_categories);
          }
          if (d.documents && Array.isArray(d.documents)) {
            setUploadedDocuments(d.documents);
          }
          if (d.current_step && d.current_step >= 1 && d.current_step <= 5) {
            setCurrentStep(d.current_step);
          }
        }
      } catch {
        // Silently continue if no draft or error
      }
    };
    loadDraft();
  }, []);

  // Save draft helper
  const handleSaveDraft = async (stepToSave: number = currentStep) => {
    setIsSavingDraft(true);
    setDraftSaveStatus(null);
    try {
      const res = await apiFetch("/api/user/claims/draft/", {
        method: "POST",
        body: {
          case_id: caseId,
          current_step: stepToSave,
          deceased_name: deceasedName.trim() || "Draft Deceased Case",
          deceased_pan: panUnknown ? "" : deceasedPan.trim().toUpperCase(),
          pan_unknown: panUnknown,
          date_of_death: dateOfDeathUnknown ? null : dateOfDeath,
          date_of_death_unknown: dateOfDeathUnknown,
          last_known_state: lastKnownState,
          death_certificate_no: deathCertNo.trim(),
          claimant_name: claimantName.trim(),
          relation: relation,
          mobile: claimantPhone.trim(),
          claimant_notes: claimantNotes.trim(),
          selected_asset_categories: selectedCategories,
          document_ids: uploadedDocuments.map(d => d.id)
        }
      });
      if (res.ok && res.data?.case_id) {
        setCaseId(res.data.case_id);
        setDraftSaveStatus("Progress saved securely.");
        setTimeout(() => setDraftSaveStatus(null), 3000);
      } else {
        setDraftSaveStatus("Failed to save draft.");
      }
    } catch {
      setDraftSaveStatus("Network error while saving draft.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Document upload handler
  const handleUploadDocument = async (file: File, docType: string) => {
    setUploadingDocType(docType);
    setProcessingStatus("working");
    setFormError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", docType);
    if (caseId) formData.append("session_id", caseId);
    formData.append("deceased_name", deceasedName.trim());
    formData.append("death_certificate_no", deathCertNo.trim());
    formData.append("relation", relation);

    try {
      const res = await apiFetch("/api/relationship/evidence/", {
        method: "POST",
        body: formData
      });

      if (res.ok && res.data?.document) {
        const doc = res.data.document;
        setUploadedDocuments(prev => {
          // Remove existing doc of same type or append
          const filtered = prev.filter(d => d.id !== doc.id);
          return [...filtered, doc];
        });

        // If it was a death certificate, auto-fill cert number and name if extracted
        if (docType === "DEATH_CERTIFICATE") {
          if (doc.document_reference_no && !deathCertNo) {
            setCaseCertNo(doc.document_reference_no);
          }
          if (doc.structured_info?.extracted_name && !deceasedName) {
            setDeceasedName(doc.structured_info.extracted_name);
          }
        }

        setProcessingStatus("done");
      } else {
        setProcessingStatus("error");
        setFormError(res.error || res.data?.error || "Failed to process document.");
      }
    } catch (err: any) {
      setProcessingStatus("error");
      setFormError(err?.message || "Network error occurred during document upload.");
    }
  };

  // Delete document handler
  const handleDeleteDocument = async (docId: string) => {
    try {
      const res = await apiFetch(`/api/relationship/document/${docId}/`, {
        method: "DELETE"
      });
      if (res.ok) {
        setUploadedDocuments(prev => prev.filter(d => d.id !== docId));
      }
    } catch {
      // Ignored
    }
  };

  // Validation per step
  const validateStep = (step: number): boolean => {
    setFormError(null);

    if (step === 1) {
      if (!deceasedName.trim()) {
        setFormError("Please enter the full legal name of the deceased person.");
        return false;
      }
      if (!panUnknown && deceasedPan.trim()) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(deceasedPan.trim().toUpperCase())) {
          setFormError("Invalid PAN format. Must be 10 characters (e.g. ABCDE1234F).");
          return false;
        }
      }
      if (!panUnknown && !deceasedPan.trim()) {
        setFormError("Please provide the deceased person's PAN or select 'PAN is unknown'.");
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!claimantName.trim()) {
        setFormError("Please enter your legal name as claimant.");
        return false;
      }
      if (!claimantPhone.trim()) {
        setFormError("Please enter a valid mobile number for case updates.");
        return false;
      }
      return true;
    }

    if (step === 3) {
      // Step 3 allows saving even if some documents are pending review
      return true;
    }

    if (step === 4) {
      if (selectedCategories.length === 0) {
        setFormError("Please select at least one asset category to investigate.");
        return false;
      }
      return true;
    }

    if (step === 5) {
      if (!statutoryConsent) {
        setFormError("You must explicitly grant statutory consent to initiate case discovery.");
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
    await handleSaveDraft(nextStep);
  };

  const handleBack = () => {
    setFormError(null);
    setCurrentStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitFinal = async () => {
    if (!validateStep(5)) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await apiFetch("/api/user/claims/", {
        method: "POST",
        body: {
          case_id: caseId,
          deceased_name: deceasedName.trim(),
          deceased_pan: panUnknown ? "" : deceasedPan.trim().toUpperCase(),
          pan_unknown: panUnknown,
          date_of_death: dateOfDeathUnknown ? null : dateOfDeath,
          date_of_death_unknown: dateOfDeathUnknown,
          last_known_state: lastKnownState,
          death_certificate_no: deathCertNo.trim(),
          claimant_name: claimantName.trim(),
          relation: relation,
          mobile: claimantPhone.trim(),
          claimant_notes: claimantNotes.trim(),
          selected_asset_categories: selectedCategories,
          document_ids: uploadedDocuments.map(d => d.id)
        }
      });

      if (res.ok && res.data?.success) {
        setSubmittedCase(res.data.claim);
      } else {
        setFormError(res.error || res.data?.error || "Failed to submit discovery case.");
      }
    } catch {
      setFormError("A network error occurred while submitting the case. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mask sensitive PAN for display
  const getMaskedPan = (pan: string) => {
    if (!pan || pan.length !== 10) return pan;
    return `${pan.slice(0, 4)}****${pan.slice(8)}`;
  };

  const STEPS_LIST = [
    { num: 1, title: "DECEASED PERSON", desc: "Civil record & identifiers" },
    { num: 2, title: "CLAIMANT DETAILS", desc: "Kinship & contact info" },
    { num: 3, title: "RELATIONSHIP EVIDENCE", desc: "Supporting documents" },
    { num: 4, title: "ASSET DISCOVERY", desc: "Statutory registries" },
    { num: 5, title: "REVIEW & SUBMIT", desc: "Verification clearance" },
  ];

  // =========================================================================
  // CONFIRMATION VIEW UPON SUCCESSFUL SUBMISSION
  // =========================================================================
  if (submittedCase) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] text-[#E1E0CC] selection:bg-primary selection:text-black py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <BorderGlow
            edgeSensitivity={30}
            glowColor="40 80 80"
            backgroundColor="#120F17"
            borderRadius={28}
            glowRadius={40}
            glowIntensity={1.0}
            coneSpread={25}
            animated={false}
            colors={["#c084fc", "#f472b6", "#38bdf8"]}
          >
            <div className="p-8 sm:p-12 text-center flex flex-col items-center">
              {/* Glossy Blue Verification Badge with Raised White Checkmark */}
              <div className="mb-6 flex items-center justify-center">
                <div className="hidden sm:block">
                  <ClaimSuccessBadge size={156} />
                </div>
                <div className="block sm:hidden">
                  <ClaimSuccessBadge size={120} />
                </div>
              </div>

              <span className="text-[11px] font-mono tracking-widest text-[#777777] uppercase block mb-1">
                Official Case Intake Registered
              </span>
              <h1 className="text-2xl sm:text-3xl font-normal sm:font-medium text-[#F1EEDC] tracking-tight mb-3">
                Claim Submitted
              </h1>
              <p className="text-[#A4A4A4] text-xs sm:text-sm max-w-lg mx-auto leading-relaxed mb-8">
                Your asset discovery dossier for <strong className="text-[#F1EEDC]">{submittedCase.deceased_name}</strong> has been logged in our secure registry and queued for statutory checking across official regulatory repositories.
              </p>

              <div className="w-full bg-[#080808] border border-[#202020] rounded-2xl p-6 text-left max-w-xl mx-auto mb-8 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-[#202020]">
                  <span className="text-[#777777]">Case Reference:</span>
                  <span className="text-[#E5E0C9] font-bold">WP-CASE-{submittedCase.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[#202020]">
                  <span className="text-[#777777]">Deceased Person:</span>
                  <span className="text-[#F1EEDC]">{submittedCase.deceased_name}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[#202020]">
                  <span className="text-[#777777]">Claimant:</span>
                  <span className="text-[#F1EEDC]">{submittedCase.claimant_name} ({submittedCase.relation})</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[#202020]">
                  <span className="text-[#777777]">Verification State:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#142132] text-[#8CB4E2] border border-[#223954]">
                    UNDER_REVIEW
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#777777]">Statutory Registries:</span>
                  <span className="text-[#A4A4A4]">RBI UDGAM, IRDAI, SEBI, IEPF</span>
                </div>
              </div>

              <div className="w-full p-4 rounded-xl bg-[#2D2106]/40 border border-[#523C0A] text-left max-w-xl mx-auto mb-8 text-xs text-[#E0B252] leading-relaxed">
                <strong className="block mb-1 text-[#E0B252] font-semibold">Separation of Verification &amp; Statutory Process</strong>
                Creating a discovery case initiates official procedural guidance and checks. It does not automatically guarantee that assets exist, nor does it replace the statutory adjudication conducted by custodian banks and authorities.
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
                <a
                  href={`/print-forms/${submittedCase.id}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-2.5 rounded-full bg-[#E5E0C9] text-[#080808] font-semibold text-xs sm:text-sm hover:bg-[#F1EEDC] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Claim Dossier</span>
                </a>
                <button
                  type="button"
                  onClick={() => onNavigate("/dashboard")}
                  className="px-6 py-2.5 rounded-full border border-[#303030] bg-[#171717] hover:bg-[#202020] text-xs sm:text-sm text-[#A4A4A4] hover:text-[#F1EEDC] transition-colors cursor-pointer"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </BorderGlow>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-[#E1E0CC] selection:bg-primary selection:text-black py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* TOP BAR / NAVIGATION */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
          <button
            onClick={() => onNavigate("/dashboard")}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-3">
            {draftSaveStatus && (
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" />
                {draftSaveStatus}
              </span>
            )}
            <button
              onClick={() => handleSaveDraft()}
              disabled={isSavingDraft}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-xs text-gray-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              title="Save progress and resume anytime"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingDraft ? "Saving..." : "Save Draft"}</span>
            </button>
          </div>
        </div>

        {/* HEADER */}
        <div className="mb-8 text-left">
          <span className="text-primary text-[10px] tracking-[0.25em] uppercase font-mono block mb-1">
            Dedicated Intake Engine
          </span>
          <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
            Asset Discovery &amp; Recovery Workflow
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1 leading-relaxed max-w-2xl">
            Systematically scan statutory registries (RBI UDGAM, IRDAI Bima Bharosa, SEBI, and IEPF) with auditable evidence verification and zero fabricated balances.
          </p>
        </div>

        {/* STEP PROGRESS BAR */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex items-center gap-2 min-w-[620px]">
            {STEPS_LIST.map((s, idx) => {
              const isActive = currentStep === s.num;
              const isPast = currentStep > s.num;
              return (
                <React.Fragment key={s.num}>
                  <button
                    onClick={() => {
                      if (isPast) setCurrentStep(s.num);
                    }}
                    disabled={!isPast && !isActive}
                    className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-left transition-all ${
                      isActive
                        ? "bg-primary/10 border border-primary/50 text-white shadow-sm"
                        : isPast
                        ? "bg-white/[0.04] border border-white/10 text-gray-300 hover:text-white cursor-pointer"
                        : "opacity-40 border border-transparent text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-semibold ${
                        isActive
                          ? "bg-primary text-black"
                          : isPast
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                          : "bg-white/10 text-gray-400"
                      }`}
                    >
                      {isPast ? <Check className="w-3.5 h-3.5" /> : s.num}
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold block leading-tight">
                        {s.title}
                      </span>
                      <span className="text-[9px] text-gray-400 block leading-tight">
                        {s.desc}
                      </span>
                    </div>
                  </button>
                  {idx < STEPS_LIST.length - 1 && (
                    <div className="w-4 h-px bg-white/10 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* FORM ERROR BANNER */}
        {formError && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-500/40 flex items-start gap-3 text-red-200 text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* MAIN MULTI-STEP CARD */}
        <BorderGlow
          edgeSensitivity={30}
          glowColor="40 80 80"
          backgroundColor="#120F17"
          borderRadius={24}
          glowRadius={40}
          glowIntensity={1.0}
          coneSpread={25}
          animated={false}
          colors={["#c084fc", "#f472b6", "#38bdf8"]}
          className="w-full"
        >
          <div className="p-6 sm:p-10">
            {/* ============================================================= */}
            {/* STEP 1: DECEASED PERSON */}
            {/* ============================================================= */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="border-b border-white/10 pb-4">
                  <h2 className="text-lg font-medium text-white">
                    Step 1: Deceased Person Details
                  </h2>
                  <p className="text-gray-400 text-xs mt-1">
                    Enter the legal identity information required to scan central statutory registries.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Full Legal Name */}
                  <div>
                    <label className="text-xs text-gray-300 font-medium block mb-1.5">
                      Full Legal Name of Deceased Person *
                    </label>
                    <input
                      type="text"
                      required
                      value={deceasedName}
                      onChange={(e) => setDeceasedName(e.target.value)}
                      placeholder="e.g. Late Ramesh Chandra Sharma"
                      className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#E1E0CC] placeholder-gray-500 focus:outline-none focus:border-primary/60 transition-colors"
                    />
                    <span className="text-[11px] text-gray-500 mt-1 block">
                      Must match the name printed on death certificate or government records.
                    </span>
                  </div>

                  {/* Date of Death & Unknown toggle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-300 font-medium block mb-1.5">
                        Date of Death (if known)
                      </label>
                      <input
                        type="date"
                        disabled={dateOfDeathUnknown}
                        value={dateOfDeath}
                        onChange={(e) => setDateOfDeath(e.target.value)}
                        className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#E1E0CC] placeholder-gray-500 focus:outline-none focus:border-primary/60 transition-colors disabled:opacity-40"
                      />
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dateOfDeathUnknown}
                          onChange={(e) => {
                            setDateOfDeathUnknown(e.target.checked);
                            if (e.target.checked) setDateOfDeath("");
                          }}
                          className="accent-primary rounded"
                        />
                        <span className="text-[11px] text-gray-400">
                          Exact date of death is unconfirmed / unknown
                        </span>
                      </label>
                    </div>

                    {/* Last known State */}
                    <div>
                      <label className="text-xs text-gray-300 font-medium block mb-1.5">
                        Last Known State / Jurisdiction
                      </label>
                      <select
                        value={lastKnownState}
                        onChange={(e) => setLastKnownState(e.target.value)}
                        className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#E1E0CC] focus:outline-none focus:border-primary/60 transition-colors"
                      >
                        <option value="">Select State / UT (Optional)</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <span className="text-[11px] text-gray-500 mt-1 block">
                        Used to narrow municipal registries and regional bank circles.
                      </span>
                    </div>
                  </div>

                  {/* PAN & Unknown toggle */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-gray-300 font-medium">
                        Permanent Account Number (PAN) *
                      </label>
                      {deceasedPan && !panUnknown && (
                        <span className="text-[11px] font-mono text-primary">
                          Masked: {getMaskedPan(deceasedPan.toUpperCase())}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      disabled={panUnknown}
                      maxLength={10}
                      value={deceasedPan}
                      onChange={(e) => setDeceasedPan(e.target.value.toUpperCase())}
                      placeholder="e.g. ABCDE1234F"
                      className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-[#E1E0CC] placeholder-gray-500 focus:outline-none focus:border-primary/60 uppercase disabled:opacity-40 transition-colors"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={panUnknown}
                          onChange={(e) => {
                            setPanUnknown(e.target.checked);
                            if (e.target.checked) setDeceasedPan("");
                          }}
                          className="accent-primary rounded"
                        />
                        <span className="text-[11px] text-gray-400">
                          PAN is unavailable / unknown for deceased
                        </span>
                      </label>
                      <span className="text-[10px] text-gray-500">
                        10 alphanumeric characters
                      </span>
                    </div>
                  </div>

                  {/* Death Certificate Upload Section */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-gray-300 font-medium">
                        Death Certificate (Optional for initial discovery, required for claim)
                      </label>
                      <span className="text-[10px] font-mono text-gray-500">PDF, PNG, JPG &le; 5MB</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={deathCertNo}
                        onChange={(e) => setCaseCertNo(e.target.value)}
                        placeholder="Certificate / Registration Number (e.g. MCGM/2023/88912)"
                        className="flex-1 bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#E1E0CC] placeholder-gray-500 focus:outline-none focus:border-primary/60 transition-colors"
                      />
                      <input
                        type="file"
                        ref={deathCertInputRef}
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadDocument(file, "DEATH_CERTIFICATE");
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => deathCertInputRef.current?.click()}
                        disabled={uploadingDocType === "DEATH_CERTIFICATE" && processingStatus === "working"}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs text-gray-300 hover:text-white transition-all cursor-pointer whitespace-nowrap"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                      </button>
                    </div>

                    {/* Death certificate uploaded preview */}
                    {uploadedDocuments.filter(d => d.document_type === "DEATH_CERTIFICATE").map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <div className="truncate">
                            <span className="text-white font-medium block truncate">{doc.filename}</span>
                            <span className="text-[10px] text-gray-400 block font-mono">
                              {doc.issuing_authority || "Civil Authority"} &bull; {doc.document_reference_no || "Ref extracted"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                            EXTRACTION_COMPLETED
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                            title="Remove document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ============================================================= */}
            {/* STEP 2: CLAIMANT DETAILS */}
            {/* ============================================================= */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="border-b border-white/10 pb-4">
                  <h2 className="text-lg font-medium text-white">
                    Step 2: Claimant Details &amp; Relationship
                  </h2>
                  <p className="text-gray-400 text-xs mt-1">
                    Confirm your information as the claimant seeking asset discovery and subsequent recovery.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Claimant Name */}
                  <div>
                    <label className="text-xs text-gray-300 font-medium block mb-1.5">
                      Your Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={claimantName}
                      onChange={(e) => setClaimantName(e.target.value)}
                      placeholder="e.g. Arun Mehta"
                      className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#E1E0CC] placeholder-gray-500 focus:outline-none focus:border-primary/60 transition-colors"
                    />
                    <span className="text-[11px] text-gray-500 mt-1 block">
                      Pre-filled from your authenticated WealthPass profile. Confirm or correct for formal filings.
                    </span>
                  </div>

                  {/* Contact Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-300 font-medium block mb-1.5">
                        Your Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={claimantPhone}
                        onChange={(e) => setClaimantPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#E1E0CC] placeholder-gray-500 focus:outline-none focus:border-primary/60 transition-colors"
                      />
                      <span className="text-[11px] text-gray-500 mt-1 block">
                        Used for secure OTP updates and bank liaison.
                      </span>
                    </div>

                    <div>
                      <label className="text-xs text-gray-300 font-medium block mb-1.5">
                        Your Email Address
                      </label>
                      <input
                        type="email"
                        value={claimantEmail}
                        onChange={(e) => setClaimantEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#E1E0CC] placeholder-gray-500 focus:outline-none focus:border-primary/60 transition-colors"
                      />
                      <span className="text-[11px] text-gray-500 mt-1 block">
                        Dossier packets and status reports will be dispatched here.
                      </span>
                    </div>
                  </div>

                  {/* Relationship claimed */}
                  <div>
                    <label className="text-xs text-gray-300 font-medium block mb-1.5">
                      Your Relationship with the Deceased *
                    </label>
                    <select
                      value={relation}
                      onChange={(e) => setRelation(e.target.value)}
                      className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#E1E0CC] focus:outline-none focus:border-primary/60 transition-colors"
                    >
                      <option value="Son">Son (Class 1 Legal Heir)</option>
                      <option value="Daughter">Daughter (Class 1 Legal Heir)</option>
                      <option value="Spouse">Spouse (Class 1 Legal Heir)</option>
                      <option value="Mother">Mother (Class 1 Legal Heir)</option>
                      <option value="Father">Father (Class 2 Legal Heir)</option>
                      <option value="Brother">Brother (Class 2 Legal Heir)</option>
                      <option value="Sister">Sister (Class 2 Legal Heir)</option>
                      <option value="Grandson">Grandson / Granddaughter</option>
                      <option value="Legal Heir">Legal Heir under Succession Certificate / Will</option>
                      <option value="Other Legal Representative">Other Authorized Legal Representative</option>
                    </select>
                  </div>

                  {/* Statutory Heirship Explanatory Note */}
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                    <div className="flex items-center gap-2 mb-1 text-amber-300 font-semibold">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Statutory Succession Hierarchy Guidance</span>
                    </div>
                    Under the Hindu Succession Act and Indian Succession Act, Class 1 legal heirs (children, spouse, mother) hold concurrent, equal rights to intestate estate proceeds. Nomination on a bank deposit grants custody to collect, while ultimate beneficial distribution belongs to legal heirs.
                  </div>

                  {/* Claimant Notes */}
                  <div>
                    <label className="text-xs text-gray-300 font-medium block mb-1.5">
                      Additional Claim Notes / Family Context (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={claimantNotes}
                      onChange={(e) => setClaimantNotes(e.target.value)}
                      placeholder="Mention known bank branches, policy numbers, or family circumstances..."
                      className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-[#E1E0CC] placeholder-gray-500 focus:outline-none focus:border-primary/60 transition-colors"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ============================================================= */}
            {/* STEP 3: RELATIONSHIP EVIDENCE */}
            {/* ============================================================= */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="border-b border-white/10 pb-4">
                  <h2 className="text-lg font-medium text-white">
                    Step 3: Relationship Evidence &amp; Civil Documentation
                  </h2>
                  <p className="text-gray-400 text-xs mt-1">
                    Upload documents substantiating your claimed kinship. Civil documentation is required by institutions to prove legal heirship.
                  </p>
                </div>

                {/* Dynamic guidance based on claimed relationship */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs leading-relaxed space-y-2">
                  <span className="text-primary font-mono text-[11px] uppercase tracking-wider block font-semibold">
                    Recommended Evidence for: {relation}
                  </span>
                  {["Son", "Daughter"].includes(relation) && (
                    <p className="text-gray-300">
                      Civil birth certificate naming the deceased as parent, school leaving certificate, or Tehsildar Legal Heir Certificate.
                    </p>
                  )}
                  {relation === "Spouse" && (
                    <p className="text-gray-300">
                      Marriage registration certificate, joint bank account passbook, or ration card record.
                    </p>
                  )}
                  {["Brother", "Sister"].includes(relation) && (
                    <p className="text-gray-300">
                      Family tree affidavit / Class 2 heir documentation, or court-issued Succession Certificate if no Class 1 heirs exist.
                    </p>
                  )}
                  {relation.includes("Legal Heir") && (
                    <p className="text-gray-300">
                      Civil Court Succession Certificate, Letters of Administration, or probated Will.
                    </p>
                  )}
                  <p className="text-[11px] text-gray-500 italic">
                    Not all documents are mandatory at intake; you can upload preliminary records now and provide court decrees later.
                  </p>
                </div>

                {/* Upload Slots */}
                <div className="space-y-4">
                  {/* Slot 1: Primary Kinship Document */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white">
                        Primary Kinship Evidence (Birth / Marriage Certificate)
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">PDF, JPG, PNG &le; 5MB</span>
                    </div>
                    <input
                      type="file"
                      ref={kinshipInputRef}
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadDocument(file, "RELATIONSHIP_CERTIFICATE");
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => kinshipInputRef.current?.click()}
                      disabled={uploadingDocType === "RELATIONSHIP_CERTIFICATE" && processingStatus === "working"}
                      className="w-full py-3 rounded-xl border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.05] text-xs text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-primary" />
                      <span>Upload Primary Kinship Evidence</span>
                    </button>
                  </div>

                  {/* Slot 2: Succession / Legal Heir / Court Order */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white">
                        Succession / Legal Heir Certificate / Nomination Record
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">PDF, JPG, PNG &le; 5MB</span>
                    </div>
                    <input
                      type="file"
                      ref={successionInputRef}
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadDocument(file, "SUCCESSION_CERTIFICATE");
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => successionInputRef.current?.click()}
                      disabled={uploadingDocType === "SUCCESSION_CERTIFICATE" && processingStatus === "working"}
                      className="w-full py-3 rounded-xl border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.05] text-xs text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-primary" />
                      <span>Upload Succession / Legal Heir Document</span>
                    </button>
                  </div>

                  {/* Uploaded Documents List */}
                  {uploadedDocuments.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      <span className="text-xs font-medium text-gray-300 block">
                        Uploaded Case Evidence ({uploadedDocuments.length})
                      </span>
                      {uploadedDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <div className="truncate">
                              <span className="text-white font-medium block truncate">{doc.filename}</span>
                              <span className="text-[10px] text-gray-400 block font-mono">
                                {doc.document_type.replace(/_/g, " ")} &bull; {doc.issuing_authority || "Civil Record"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                              EXTRACTION_COMPLETED
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                              title="Delete evidence document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Disclaimer on verification */}
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-[11px] text-gray-400 leading-relaxed">
                    <strong className="text-gray-300 block mb-0.5">Civil Record Storage Security:</strong>
                    Documents are stored in encrypted private storage accessible only by your authenticated account. OCR field extraction compares textual consistency but does not constitute official legal adjudication.
                  </div>
                </div>
              </motion.div>
            )}

            {/* ============================================================= */}
            {/* STEP 4: ASSET DISCOVERY */}
            {/* ============================================================= */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="border-b border-white/10 pb-4">
                  <h2 className="text-lg font-medium text-white">
                    Step 4: Statutory Asset Discovery Scope
                  </h2>
                  <p className="text-gray-400 text-xs mt-1">
                    Select which financial categories to query across statutory portals and registry repositories.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {ASSET_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <div
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategories(prev =>
                            prev.includes(cat.id)
                              ? prev.filter(c => c !== cat.id)
                              : [...prev, cat.id]
                          );
                        }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                          isSelected
                            ? "bg-primary/[0.08] border-primary/50 text-white shadow-sm"
                            : "bg-white/[0.02] border-white/10 text-gray-300 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by parent div
                            className="accent-primary rounded mt-1 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-medium text-white">{cat.title}</h3>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-gray-300 border border-white/10">
                                {cat.badge}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 leading-normal mb-1.5">{cat.subtitle}</p>
                            <span className="text-[11px] font-mono text-primary/90 block">
                              Source: {cat.source}
                            </span>
                          </div>
                        </div>

                        <span className="px-2 py-1 rounded text-[10px] font-mono bg-amber-950/60 text-amber-300 border border-amber-500/30 shrink-0">
                          {cat.status}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-gray-400 space-y-2">
                  <div className="flex items-center gap-2 text-white font-medium">
                    <Landmark className="w-4 h-4 text-primary" />
                    <span>Statutory Transparency Policy</span>
                  </div>
                  <p className="leading-relaxed">
                    WealthPass connects to official public gateways using official citizen procedures. Because statutory portals such as RBI UDGAM require individual mobile OTP registration, WealthPass compiles an automated discovery packet guiding your exact submission without scraping restricted pages or fabricating financial matches.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ============================================================= */}
            {/* STEP 5: REVIEW AND SUBMIT */}
            {/* ============================================================= */}
            {currentStep === 5 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="border-b border-white/10 pb-4">
                  <h2 className="text-lg font-medium text-white">
                    Step 5: Review Discovery Dossier &amp; Submit Case
                  </h2>
                  <p className="text-gray-400 text-xs mt-1">
                    Carefully review all submitted details before initializing formal discovery and evidence evaluation.
                  </p>
                </div>

                {/* Review Cards */}
                <div className="space-y-4">
                  {/* Card 1: Deceased Person */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                        Deceased Person Details
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-primary hover:underline text-[11px] cursor-pointer"
                      >
                        Edit Step 1
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-300">
                      <div>
                        <span className="text-gray-500 block">Legal Name:</span>
                        <strong className="text-white">{deceasedName || "Not provided"}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Date of Death:</span>
                        <span className="text-white">
                          {dateOfDeathUnknown ? "Unconfirmed / Unknown" : (dateOfDeath || "Not specified")}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Permanent Account Number (PAN):</span>
                        <span className="font-mono text-white">
                          {panUnknown ? "Unknown / Not recorded" : getMaskedPan(deceasedPan)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Jurisdiction / State:</span>
                        <span className="text-white">{lastKnownState || "National circle"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Death Certificate Number:</span>
                        <span className="font-mono text-white">{deathCertNo || "Pending upload"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Claimant Details */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                        Claimant &amp; Kinship
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-primary hover:underline text-[11px] cursor-pointer"
                      >
                        Edit Step 2
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-300">
                      <div>
                        <span className="text-gray-500 block">Claimant Legal Name:</span>
                        <strong className="text-white">{claimantName}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Claimed Relationship:</span>
                        <span className="text-primary font-semibold">{relation}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Mobile Contact:</span>
                        <span className="text-white">{claimantPhone}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Email Address:</span>
                        <span className="text-white">{claimantEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Evidence Documents */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                        Uploaded Evidence ({uploadedDocuments.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="text-primary hover:underline text-[11px] cursor-pointer"
                      >
                        Edit Step 3
                      </button>
                    </div>
                    {uploadedDocuments.length === 0 ? (
                      <span className="text-gray-500 italic block py-1">
                        No civil evidence documents attached yet. Documents can be uploaded subsequently before claim filing.
                      </span>
                    ) : (
                      <div className="space-y-1.5">
                        {uploadedDocuments.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between py-1 border-b border-white/5 last:border-none">
                            <span className="text-gray-300 truncate">{doc.filename} ({doc.document_type})</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                              EXTRACTION_COMPLETED
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card 4: Categories */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                        Target Asset Categories ({selectedCategories.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(4)}
                        className="text-primary hover:underline text-[11px] cursor-pointer"
                      >
                        Edit Step 4
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedCategories.map((catId) => {
                        const item = ASSET_CATEGORIES.find(c => c.id === catId);
                        return (
                          <span key={catId} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-[11px]">
                            {item?.title || catId}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explicit Statutory Consent Declaration */}
                  <div className="p-4 rounded-xl bg-primary/[0.04] border border-primary/30 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={statutoryConsent}
                        onChange={(e) => setStatutoryConsent(e.target.checked)}
                        className="accent-primary rounded mt-1 shrink-0"
                      />
                      <span className="text-xs text-gray-200 leading-relaxed">
                        I explicitly declare that I am authorized to request discovery of the deceased person&apos;s assets under applicable succession laws. I authorize WealthPass to scan statutory portals (RBI UDGAM, IRDAI, SEBI, IEPF), store uploaded civil records in private storage, and generate official institutional claim packets.
                      </span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ACTION FOOTER */}
            <div className="flex items-center justify-between pt-8 mt-8 border-t border-white/10">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-2.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-xs text-gray-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous Step</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2.5 rounded-full bg-primary text-black font-semibold text-xs uppercase tracking-wider hover:bg-white transition-all cursor-pointer flex items-center gap-2 shadow-lg"
                  >
                    <span>Continue to Step {currentStep + 1}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitFinal}
                    disabled={isSubmitting || !statutoryConsent}
                    className="px-7 py-2.5 rounded-full bg-primary text-black font-semibold text-xs uppercase tracking-wider hover:bg-white disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-primary/20"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting Dossier...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Initialize Case Discovery</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </BorderGlow>
      </div>
    </div>
  );
};

export default AssetDiscoveryWorkflowPage;
