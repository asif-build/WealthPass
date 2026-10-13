import React, { useState, useEffect } from "react";
import {
  Mail, Phone, ShieldCheck, CheckCircle2, AlertCircle,
  LogOut, Search, FileText, RefreshCw, X,
  ArrowRight, Clock, Lock, ChevronRight,
  ExternalLink, Briefcase, Settings, Plus, Check
} from "lucide-react";
import { apiFetch } from "../../services/apiClient";
import { NotificationBell } from "../notifications/NotificationBell";

interface DashboardPageProps {
  user: any;
  initialTab?: "cases" | "settings";
  onNavigate: (path: string) => void;
  onLogout: () => void;
  onRefreshUser: () => void;
}

interface ClaimAsset {
  id: number;
  institution: string;
  amount: number;
  is_amount_undisclosed?: boolean;
  potential_value_display?: string;
  source_id?: string;
  source_reference?: string;
  masked_reference?: string;
  situation_label: string;
  color: string;
  message: string;
  documents_needed: string[];
  next_steps: string[];
  time_estimate: string;
  loan_amount: number;
  match_status?: string;
  verification_status?: string;
  claim_status?: string;
  official_portal_url?: string;
}

interface DiscoverySourceJobItem {
  id: string;
  source_id: string;
  provider_name?: string;
  asset_category: string;
  status: string;
  is_live_api: boolean;
  external_portal_url?: string;
  external_reference_number?: string;
  external_search_completed?: boolean;
  external_search_date?: string;
  consent_id?: string;
  consent_url?: string;
  guide?: Record<string, any>;
  error_message?: string;
  last_checked_at?: string;
}

interface ClaimCase {
  id: string;
  deceased_name: string;
  deceased_pan: string;
  death_certificate_no: string;
  claimant_name: string;
  relation: string;
  verification_status: string;
  fraud_risk_level: string;
  status: string;
  is_draft?: boolean;
  current_step?: number;
  total_assets_found: number;
  bridge_loan_available: number;
  has_document: boolean;
  assets_count?: number;
  created_at: string;
  assets?: ClaimAsset[];
  source_jobs?: DiscoverySourceJobItem[];
}

interface ActivityItem {
  id: string;
  source: string;
  event_type: string;
  ip_address: string;
  timestamp: string;
  details: Record<string, any>;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  initialTab = "cases",
  onNavigate,
  onLogout,
  onRefreshUser,
}) => {
  // Navigation View: "cases" (default dashboard) or "settings" (dedicated security settings)
  const [activeTab, setActiveTab] = useState<"cases" | "settings">(initialTab);

  // User Claims / Cases state
  const [cases, setCases] = useState<ClaimCase[]>([]);
  const [isCasesLoading, setIsCasesLoading] = useState(true);
  const [casesError, setCasesError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<ClaimCase | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Identity Verification record state
  const [identityRecord, setIdentityRecord] = useState<{
    verified: boolean;
    status: string;
    reference?: string;
  } | null>(null);

  // Activity Log state (loaded on demand in settings)
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(false);

  // Security controls state (in settings view)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [isTerminatingSessions, setIsTerminatingSessions] = useState(false);
  const [terminationMessage, setTerminationMessage] = useState<string | null>(null);

  // Record external reference modal state (accessible from dossier)
  const [isRecordRefModalOpen, setIsRecordRefModalOpen] = useState(false);
  const [recordSourceId, setRecordSourceId] = useState("RBI_UDGAM");
  const [recordCategory, setRecordCategory] = useState("BANK_DEPOSITS");
  const [recordInstitution, setRecordInstitution] = useState("");
  const [recordRefNo, setRecordRefNo] = useState("");
  const [recordOutcome, setRecordOutcome] = useState<"MATCH_FOUND" | "NO_MATCH_FOUND">("MATCH_FOUND");
  const [isRecordingRef, setIsRecordingRef] = useState(false);
  const [recordRefError, setRecordRefError] = useState<string | null>(null);
  const [recordRefSuccess, setRecordRefSuccess] = useState<string | null>(null);
  const [isCheckingSetu, setIsCheckingSetu] = useState(false);

  // Keep activeTab in sync if initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Fetch Cases from API (enforces server-side user isolation)
  const fetchCases = async () => {
    setIsCasesLoading(true);
    setCasesError(null);
    try {
      const res = await apiFetch<{
        success: boolean;
        cases: ClaimCase[];
        total_count: number;
      }>("/api/user/claims/");

      if (res.ok && res.data?.cases) {
        setCases(res.data.cases);
      } else {
        setCasesError(res.error || "Unable to load your recovery cases.");
      }
    } catch {
      setCasesError("Network connection interrupted while loading cases.");
    } finally {
      setIsCasesLoading(false);
    }
  };

  // Fetch Identity Status
  const fetchIdentityStatus = async () => {
    try {
      const res = await apiFetch<{
        verified: boolean;
        status: string;
        reference?: string;
      }>("/api/verify/");
      if (res.ok && res.data) {
        setIdentityRecord({
          verified: !!res.data.verified,
          status: res.data.status || "PENDING",
          reference: res.data.reference,
        });
      }
    } catch {
      // Non-critical background fetch failure
    }
  };

  // Fetch Security Activity (in settings view)
  const fetchActivity = async () => {
    setIsActivityLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; activities: ActivityItem[] }>(
        "/api/auth/activity/"
      );
      if (res.ok && res.data?.activities) {
        setActivities(res.data.activities);
      }
    } catch {
      // Non-critical
    } finally {
      setIsActivityLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
    fetchIdentityStatus();
  }, []);

  useEffect(() => {
    if (activeTab === "settings") {
      fetchActivity();
    }
  }, [activeTab]);

  // Fetch single case details when selected for dossier preview
  const handleSelectCase = async (caseId: string) => {
    setIsDetailLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; claim: ClaimCase }>(`/api/user/claims/${caseId}/`);
      if (res.ok && res.data?.claim) {
        setSelectedCase(res.data.claim);
      }
    } catch {
      const local = cases.find((c) => c.id === caseId);
      if (local) setSelectedCase(local);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Check Setu Account Aggregator status
  const handleCheckSetuStatus = async (caseId: string) => {
    setIsCheckingSetu(true);
    try {
      const res = await apiFetch<{ success: boolean; consent_status: string; accounts_found: number }>(
        "/api/discover/setu/check-status/",
        {
          method: "POST",
          body: { case_id: caseId },
        }
      );
      if (res.ok) {
        await handleSelectCase(caseId);
        fetchCases();
      }
    } catch {
      // Non-critical
    } finally {
      setIsCheckingSetu(false);
    }
  };

  // Submit recorded official reference from dossier
  const handleRecordReferenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    if (recordOutcome === "MATCH_FOUND" && !recordRefNo.trim()) {
      setRecordRefError("Please enter the official reference number or search token.");
      return;
    }

    setIsRecordingRef(true);
    setRecordRefError(null);
    setRecordRefSuccess(null);

    try {
      const res = await apiFetch<{ success: boolean; message: string }>("/api/discover/record-external-reference/", {
        method: "POST",
        body: {
          case_id: selectedCase.id,
          source_id: recordSourceId,
          external_reference_number: recordRefNo.trim() || undefined,
          institution_name: recordInstitution.trim() || undefined,
          asset_category: recordCategory,
          search_outcome: recordOutcome,
        },
      });

      if (res.ok && res.data?.success) {
        setRecordRefSuccess(res.data.message || "Reference recorded successfully.");
        await handleSelectCase(selectedCase.id);
        fetchCases();
        setTimeout(() => {
          setIsRecordRefModalOpen(false);
          setRecordRefNo("");
          setRecordInstitution("");
          setRecordRefSuccess(null);
        }, 1200);
      } else {
        setRecordRefError(res.error || "Failed to record reference.");
      }
    } catch {
      setRecordRefError("Network error recording reference.");
    } finally {
      setIsRecordingRef(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword) {
      setPasswordError("Both current and new password are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>("/api/auth/change-password/", {
        method: "POST",
        body: {
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        },
      });

      if (res.ok && res.data?.success) {
        setPasswordSuccess(res.data.message || "Password updated successfully. Other sessions invalidated.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        fetchActivity();
        onRefreshUser();
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPasswordSuccess(null);
        }, 1500);
      } else {
        setPasswordError(res.error || "Failed to update password.");
      }
    } catch {
      setPasswordError("Network error updating password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Terminate Other Sessions (Invalidates other sessions server-side)
  const handleTerminateOtherSessions = async () => {
    setIsTerminatingSessions(true);
    setTerminationMessage(null);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>("/api/auth/terminate-other-sessions/", {
        method: "POST",
      });
      if (res.ok && res.data?.success) {
        setTerminationMessage("All other active device sessions have been invalidated.");
        fetchActivity();
      } else {
        setTerminationMessage(res.error || "Could not terminate sessions.");
      }
    } catch {
      setTerminationMessage("Network error terminating sessions.");
    } finally {
      setIsTerminatingSessions(false);
    }
  };

  // Format PAN for display with masking
  const maskPan = (pan: string) => {
    if (!pan || pan.length < 6) return "••••••••••";
    return `${pan.slice(0, 5)}****${pan.slice(-1)}`;
  };

  // Helper: Derive next action text for a case
  const getNextActionForCase = (c: ClaimCase): string => {
    if (c.is_draft) {
      return `Resume draft intake (Step ${c.current_step || 1} of 5)`;
    }
    if (c.status === "READY_FOR_CLAIM") {
      return "Review identified asset matches and generate institutional claim packet";
    }
    if (c.status === "loan_accepted") {
      return "Bridge loan active — monitor institutional settlement release";
    }
    if (c.status === "verified") {
      return "Case verified — proceed with claim submission";
    }
    if (!c.has_document) {
      return "Upload death certificate or kinship documentation";
    }
    return "Institutional registry search underway across statutory repositories";
  };

  // Helper: Restrained status badge formatter for cases
  const getCaseStatusBadge = (status: string) => {
    const norm = (status || "").toUpperCase();
    if (norm === "READY_FOR_CLAIM" || norm === "VERIFIED" || norm === "COMPLETED") {
      return {
        label: status.replace(/_/g, " "),
        badgeStyle: "bg-[#132B1E] text-[#85E0A3] border-[#1E4D30]",
      };
    }
    if (norm === "UNDER_REVIEW" || norm === "PENDING") {
      return {
        label: status.replace(/_/g, " "),
        badgeStyle: "bg-[#142132] text-[#8CB4E2] border-[#223954]",
      };
    }
    if (norm.includes("REQUIRED") || norm.includes("ACTION")) {
      return {
        label: status.replace(/_/g, " "),
        badgeStyle: "bg-[#2D2106] text-[#E0B252] border-[#523C0A]",
      };
    }
    if (norm === "REJECTED" || norm === "FAILED") {
      return {
        label: status.replace(/_/g, " "),
        badgeStyle: "bg-[#2A1515] text-[#E07A7A] border-[#4A2020]",
      };
    }
    return {
      label: status.replace(/_/g, " "),
      badgeStyle: "bg-[#1A1A1A] text-[#B8B8B8] border-[#333333]",
    };
  };

  // Helper: Relationship Status derivation (Restrained palette)
  const getRelationshipStatus = (): {
    label: string;
    badgeStyle: string;
    subtext: string;
    actionable: boolean;
  } => {
    if (cases.length === 0) {
      return {
        label: "Not required yet",
        badgeStyle: "bg-[#083B8A] text-blue-200/70 border-white/10",
        subtext: "Begins when you start your first recovery case",
        actionable: false,
      };
    }

    const relStatus = user?.relationship_status;
    if (relStatus === "VERIFIED") {
      return {
        label: "Verified",
        badgeStyle: "bg-[#132B1E] text-[#85E0A3] border-[#1E4D30]",
        subtext: "Kinship established per Indian Succession Act",
        actionable: false,
      };
    }
    if (relStatus === "DOCUMENTS_REQUIRED" || relStatus === "NEEDS_CLARIFICATION") {
      return {
        label: "Additional evidence required",
        badgeStyle: "bg-[#2D2106] text-[#E0B252] border-[#523C0A]",
        subtext: "Upload civil documents to substantiate relationship",
        actionable: true,
      };
    }
    if (relStatus === "EVIDENCE_SUBMITTED" || relStatus === "UNDER_REVIEW") {
      return {
        label: "Under review",
        badgeStyle: "bg-[#142132] text-[#8CB4E2] border-[#223954]",
        subtext: "Submitted civil records currently under review",
        actionable: false,
      };
    }
    return {
      label: "In progress",
      badgeStyle: "bg-[#1A1A1A] text-[#B8B8B8] border-[#333333]",
      subtext: "Evaluating kinship evidence for active case",
      actionable: true,
    };
  };

  const relStatusInfo = getRelationshipStatus();

  // Resolved identity verification state
  const isIdentityVerified = user?.is_identity_verified || identityRecord?.verified;
  const rawIdStatus = user?.identity_status || identityRecord?.status || "NOT_STARTED";
  const identityStatusLabel = isIdentityVerified
    ? "Verified"
    : rawIdStatus === "UNDER_REVIEW" || rawIdStatus === "IN_PROGRESS"
    ? "Under review"
    : "Verification required";

  const identityBadgeStyle = isIdentityVerified
    ? "bg-[#132B1E] text-[#85E0A3] border-[#1E4D30]"
    : rawIdStatus === "UNDER_REVIEW" || rawIdStatus === "IN_PROGRESS"
    ? "bg-[#142132] text-[#8CB4E2] border-[#223954]"
    : "bg-[#2D2106] text-[#E0B252] border-[#523C0A]";

  return (
    <div className="min-h-screen bg-[#0755C9] text-white selection:bg-primary selection:text-[#102A56]">
      {/* ============================================================= */}
      {/* STICKY PORTAL HEADER & NAVIGATION TABS */}
      {/* ============================================================= */}
      <header className="sticky top-0 z-40 bg-[#083B8A]/85 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5">
        <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between gap-4">
          {/* Left: Brand & Navigation Switcher */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => {
                setActiveTab("cases");
                onNavigate("/dashboard");
              }}
              className="text-left cursor-pointer"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-white block">
                WealthPass
              </span>
              <span className="text-[10px] text-blue-200 font-mono hidden sm:inline">
                Asset Recovery Portal
              </span>
            </button>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1 bg-[#0646AD] p-1 rounded-full border border-white/15 text-xs">
              <button
                onClick={() => {
                  setActiveTab("cases");
                  onNavigate("/dashboard");
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-medium ${
                  activeTab === "cases"
                    ? "bg-primary text-[#102A56] shadow-sm font-semibold"
                    : "text-blue-100 hover:text-white"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Recovery Cases</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("settings");
                  onNavigate("/settings");
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-medium ${
                  activeTab === "settings"
                    ? "bg-primary text-[#102A56] shadow-sm font-semibold"
                    : "text-blue-100 hover:text-white"
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Security &amp; Settings</span>
              </button>
            </nav>
          </div>

          {/* Right: Notifications, User snippet & Sign Out */}
          <div className="flex items-center gap-3 sm:gap-4">
            <NotificationBell />

            <div className="text-right hidden md:block">
              <span className="text-xs text-white font-medium block truncate max-w-[160px]">
                {user?.full_name || "Account Holder"}
              </span>
              <span className="text-[10px] text-blue-200 block font-mono truncate max-w-[160px]">
                {user?.email}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-full border border-white/20 bg-[#0646AD] hover:bg-white/15 text-xs text-blue-100 hover:text-white transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ============================================================= */}
      <main className="max-w-[1440px] w-[calc(100%-32px)] sm:w-[calc(100%-48px)] lg:w-[calc(100%-64px)] mx-auto py-8 space-y-8">
        {activeTab === "cases" ? (
          /* =========================================================== */
          /* VIEW 1: RECOVERY DASHBOARD */
          /* =========================================================== */
          <>
            {/* 1. WELCOME BANNER (Refined, no green dots, editorial typography) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0646AD] border border-white/10 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-200/70 text-[11px] tracking-[0.2em] uppercase font-mono">
                      Personal Recovery Dashboard
                    </span>
                    <span className="text-[#333333]">•</span>
                    <span className="text-[11px] text-blue-100 font-mono">
                      Active
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-normal sm:font-medium text-white tracking-tight">
                    Welcome, {user?.full_name || "Valued User"}
                  </h1>

                  {/* Verification badges & contact info */}
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-blue-100 pt-1">
                    {/* Email badge with live action if unverified */}
                    <div className="flex items-center gap-1.5 bg-[#083B8A] px-3.5 py-1.5 rounded-full border border-white/10">
                      <Mail className="w-3.5 h-3.5 text-white" />
                      <span className="text-white">{user?.email}</span>
                      {user?.is_email_verified ? (
                        <span className="text-[#85E0A3] text-[10px] font-medium ml-1 flex items-center gap-0.5">
                          <Check className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => onNavigate("/verify-email")}
                          className="text-[#E0B252] hover:text-white text-[10px] font-medium ml-1 underline cursor-pointer"
                        >
                          Verify Email
                        </button>
                      )}
                    </div>

                    {/* Phone badge */}
                    <div className="flex items-center gap-1.5 bg-[#083B8A] px-3.5 py-1.5 rounded-full border border-white/10">
                      <Phone className="w-3.5 h-3.5 text-white" />
                      <span className="text-white">
                        {user?.phone || "No phone added"}
                      </span>
                      {user?.is_phone_verified && (
                        <span className="text-[#85E0A3] text-[10px] font-medium ml-1">
                          ✓ Verified
                        </span>
                      )}
                    </div>

                    {user?.created_at && (
                      <span className="flex items-center gap-1.5 text-blue-200/70 font-mono text-[11px] hidden sm:flex">
                        <Clock className="w-3 h-3" />
                        Member since {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary Action CTA "FIND ASSETS" */}
                <div className="shrink-0">
                  <button
                    onClick={() => onNavigate("/assets/discover")}
                    className="group flex items-center gap-3 p-1.5 pl-6 pr-1.5 rounded-full bg-[#E5E0C9] text-[#102A56] font-semibold transition-all duration-300 text-sm sm:text-base hover:bg-[#F1EEDC] cursor-pointer shadow-md"
                  >
                    <span>Find Assets</span>
                    <div className="bg-[#083B8A] rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  </button>
                </div>
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/[0.02] to-transparent pointer-events-none" />
            </div>

            {/* UNVERIFIED EMAIL NOTIFICATION BANNER (Action-oriented, restrained amber) */}
            {!user?.is_email_verified && (
              <div className="p-4 rounded-2xl bg-[#2D2106]/40 border border-[#523C0A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-[#E0B252]">
                  <AlertCircle className="w-4 h-4 text-[#E0B252] shrink-0" />
                  <span>
                    Action Required: Please verify your email address (<strong>{user?.email}</strong>) to receive official recovery dossier alerts and statutory match updates.
                  </span>
                </div>
                <button
                  onClick={() => onNavigate("/verify-email")}
                  className="px-4 py-1.5 rounded-full bg-[#E0B252] text-[#102A56] font-medium text-xs hover:bg-[#F1EEDC] transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  Verify Email
                </button>
              </div>
            )}

            {/* 2. COMPACT "YOUR VERIFICATION STATUS" SECTION */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xs uppercase tracking-widest text-blue-200/70 font-semibold">
                    Your Verification Status
                  </h2>
                  <p className="text-xs text-blue-100 mt-0.5">
                    Clearance credentials required by financial institutions to process asset recovery.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
                {/* 1. Email Verification */}
                <div
                  onClick={() => {
                    if (!user?.is_email_verified) onNavigate("/verify-email");
                  }}
                  className={`p-5 rounded-2xl bg-[#0646AD] border border-white/10 hover:border-white/20 flex flex-col justify-between transition-colors ${
                    !user?.is_email_verified ? "cursor-pointer" : ""
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-[#083B8A] border border-white/10 flex items-center justify-center text-white">
                        <Mail className="w-4 h-4" />
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                          user?.is_email_verified
                            ? "bg-[#132B1E] text-[#85E0A3] border-[#1E4D30]"
                            : "bg-[#2D2106] text-[#E0B252] border-[#523C0A]"
                        }`}
                      >
                        {user?.is_email_verified ? "Verified" : "Verification required"}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-white mb-1">
                      Email Verification
                    </h3>
                    <p className="text-xs text-blue-100 leading-relaxed">
                      {user?.is_email_verified
                        ? "Active channel for case correspondence and claim packets."
                        : "Required to receive statutory case match notifications."}
                    </p>
                  </div>
                  {!user?.is_email_verified && (
                    <span className="text-xs text-[#E0B252] font-medium flex items-center gap-1 mt-4">
                      <span>Verify now</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  )}
                </div>

                {/* 2. Claimant Identity Verification */}
                <div
                  onClick={() => {
                    if (!isIdentityVerified) onNavigate("/verify");
                  }}
                  className={`p-5 rounded-2xl bg-[#0646AD] border border-white/10 hover:border-white/20 flex flex-col justify-between transition-colors ${
                    !isIdentityVerified ? "cursor-pointer" : ""
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-[#083B8A] border border-white/10 flex items-center justify-center text-white">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${identityBadgeStyle}`}
                      >
                        {identityStatusLabel}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-white mb-1">
                      Identity Verification
                    </h3>
                    <p className="text-xs text-blue-100 leading-relaxed">
                      {isIdentityVerified
                        ? "Claimant identity authenticated. Ready for institutional filings."
                        : "Verify your legal identity prior to formal asset claim submission."}
                    </p>
                  </div>
                  {!isIdentityVerified && (
                    <span className="text-xs text-white font-medium flex items-center gap-1 mt-4">
                      <span>Begin verification</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  )}
                </div>

                {/* 3. Relationship Evidence */}
                <div
                  onClick={() => {
                    if (relStatusInfo.actionable) onNavigate("/assets/discover");
                  }}
                  className={`p-5 rounded-2xl bg-[#0646AD] border border-white/10 hover:border-white/20 flex flex-col justify-between transition-colors ${
                    relStatusInfo.actionable ? "cursor-pointer" : ""
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-[#083B8A] border border-white/10 flex items-center justify-center text-white">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${relStatusInfo.badgeStyle}`}
                      >
                        {relStatusInfo.label}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-white mb-1">
                      Relationship Evidence
                    </h3>
                    <p className="text-xs text-blue-100 leading-relaxed">
                      {relStatusInfo.subtext}
                    </p>
                  </div>
                  {relStatusInfo.actionable && (
                    <span className="text-xs text-white font-medium flex items-center gap-1 mt-4">
                      <span>Upload documents</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* 3. "YOUR ASSET RECOVERY CASES" (MAIN DASHBOARD SECTION) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm uppercase tracking-widest text-blue-200/70 font-semibold">
                    Your Asset Recovery Cases
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#083B8A] border border-white/10 text-blue-100 font-medium">
                    {cases.length} {cases.length === 1 ? "Case" : "Cases"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchCases}
                    disabled={isCasesLoading}
                    className="p-2 rounded-xl border border-white/10 bg-[#083B8A] text-blue-100 hover:text-white hover:border-white/20 transition-all cursor-pointer"
                    title="Refresh Cases"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCasesLoading ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    onClick={() => onNavigate("/assets/discover")}
                    className="group flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E5E0C9] hover:bg-[#F1EEDC] text-[#102A56] text-xs font-semibold transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Find Assets</span>
                  </button>
                </div>
              </div>

              {casesError && (
                <div className="p-4 rounded-2xl bg-[#2A1515] border border-[#4A2020] text-[#E07A7A] text-xs">
                  {casesError}
                </div>
              )}

              {isCasesLoading && cases.length === 0 ? (
                <div className="p-12 rounded-3xl bg-[#0646AD] border border-white/10 flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 border-2 border-[#E5E0C9] border-t-transparent rounded-full animate-spin mb-3" />
                  <span className="text-xs text-blue-100 font-mono">
                    Loading your recovery cases...
                  </span>
                </div>
              ) : cases.length === 0 ? (
                /* CLEAN USER-FRIENDLY EMPTY STATE */
                <div className="p-12 sm:p-16 rounded-3xl bg-[#0646AD] border border-white/10 flex flex-col items-center text-center max-w-2xl mx-auto space-y-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#083B8A] border border-white/10 flex items-center justify-center text-white">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-normal text-white mb-2">
                      Your family&apos;s assets deserve to be found.
                    </h3>
                    <p className="text-blue-100 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
                      Start by telling us about the person whose assets you want to discover across official banking, insurance, and statutory registries.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => onNavigate("/assets/discover")}
                      className="group flex items-center gap-2.5 p-1.5 pl-6 pr-1.5 rounded-full bg-[#E5E0C9] text-[#102A56] font-semibold text-xs sm:text-sm uppercase tracking-wider hover:bg-[#F1EEDC] transition-all cursor-pointer shadow-md"
                    >
                      <span>+ Find Assets</span>
                      <div className="bg-[#083B8A] rounded-full w-8 h-8 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                /* POPULATED CASES 2-COLUMN BALANCED GRID */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
                  {cases.map((c) => {
                    const nextAction = getNextActionForCase(c);
                    const formattedDate = new Date(c.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                    const hasGenuineMatches = Number(c.total_assets_found) > 0;
                    const statusBadge = getCaseStatusBadge(c.status);

                    return (
                      <div
                        key={c.id}
                        className="p-6 rounded-2xl bg-[#0646AD] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4"
                      >
                        <div>
                          {/* Case Header: Ref & Status */}
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[11px] font-mono uppercase text-blue-200/70 font-medium">
                                  CASE-{c.id.slice(0, 8).toUpperCase()}
                                </span>
                                <span className="text-[#333333]">•</span>
                                <span className="text-[11px] text-blue-200/70 font-mono">
                                  {formattedDate}
                                </span>
                              </div>
                              <h3 className="text-xl font-medium text-white">
                                {c.deceased_name}
                              </h3>
                              <span className="text-xs text-blue-100">
                                Claimed Relationship:{" "}
                                <strong className="text-white font-medium">
                                  {c.relation || "Legal Heir"}
                                </strong>
                              </span>
                            </div>

                            {/* Status Badge */}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider border shrink-0 ${statusBadge.badgeStyle}`}
                            >
                              {statusBadge.label}
                            </span>
                          </div>

                          {/* Next Required Action Box */}
                          <div className="p-3.5 rounded-xl bg-[#083B8A] border border-white/10 space-y-1 my-3 text-left">
                            <span className="text-[10px] uppercase tracking-wider text-blue-200/70 font-medium block">
                              Next Required Action
                            </span>
                            <p className="text-xs text-white leading-relaxed">
                              {nextAction}
                            </p>
                          </div>

                          {/* Genuine Discovery Summary */}
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-[#083B8A] border border-white/10">
                              <span className="text-[10px] uppercase text-blue-200/70 block mb-1">
                                Deceased PAN
                              </span>
                              <span className="font-mono text-white">
                                {maskPan(c.deceased_pan)}
                              </span>
                            </div>
                            <div className="p-3 rounded-xl bg-[#083B8A] border border-white/10">
                              <span className="text-[10px] uppercase text-blue-200/70 block mb-1">
                                Discovered Matches
                              </span>
                              {hasGenuineMatches ? (
                                <span className="font-medium text-white">
                                  ₹{Number(c.total_assets_found).toLocaleString("en-IN")} ({c.assets_count || c.assets?.length || 1} match)
                                </span>
                              ) : (
                                <span className="text-xs text-blue-200/70 italic">
                                  Scan in progress
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Actions: Continue Case or View Details */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-white/10">
                          <button
                            onClick={() => handleSelectCase(c.id)}
                            className="text-xs text-blue-100 hover:text-white font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>View Details</span>
                            <ChevronRight className="w-3.5 h-3.5 text-white" />
                          </button>

                          <div className="flex items-center gap-2">
                            {c.is_draft ? (
                              <button
                                onClick={() => onNavigate("/assets/discover")}
                                className="px-4 py-1.5 rounded-full bg-[#E5E0C9] text-[#102A56] text-xs font-semibold hover:bg-[#F1EEDC] transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                              >
                                <span>Continue Case</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ) : c.status === "READY_FOR_CLAIM" ? (
                              <a
                                href={`/results/${c.id}/`}
                                className="px-4 py-1.5 rounded-full bg-[#E5E0C9] text-[#102A56] text-xs font-semibold hover:bg-[#F1EEDC] transition-all flex items-center gap-1 shadow-sm"
                              >
                                <span>Claim Steps</span>
                                <ArrowRight className="w-3 h-3" />
                              </a>
                            ) : (
                              <a
                                href={`/print-forms/${c.id}/`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-1.5 rounded-full border border-white/10 bg-[#083B8A] hover:bg-[#0755C9] text-xs text-blue-100 hover:text-white transition-colors flex items-center gap-1.5"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Dossier</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : (
          /* =========================================================== */
          /* VIEW 2: DEDICATED SECURITY & SETTINGS PAGE */
          /* =========================================================== */
          <div className="space-y-8">
            {/* Settings Header & Return shortcut */}
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-medium text-white mb-1">
                  Account Security &amp; Settings
                </h1>
                <p className="text-xs text-blue-100">
                  Manage your credentials, active session authorizations, and audited regulatory acceptance records.
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab("cases");
                  onNavigate("/dashboard");
                }}
                className="px-4 py-2 rounded-full border border-white/10 bg-[#083B8A] hover:bg-[#0755C9] text-xs text-blue-100 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>← Back to Cases</span>
              </button>
            </div>

            {/* Profile & Credentials Panel */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0646AD] border border-white/10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-blue-200/70 text-[11px] tracking-[0.2em] uppercase font-mono block mb-1">
                    Credentials &amp; Authentication
                  </span>
                  <h2 className="text-lg font-medium text-white">
                    Account Security
                  </h2>
                  <p className="text-xs text-blue-100 mt-1">
                    Your password protects all private recovery documents and claimant records.
                  </p>
                </div>
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="px-4 py-2 rounded-full bg-[#E5E0C9] hover:bg-[#F1EEDC] text-[#102A56] font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Change Password</span>
                </button>
              </div>

              {/* User details summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
                <div className="p-3.5 rounded-xl bg-[#083B8A] border border-white/10">
                  <span className="text-[10px] uppercase text-blue-200/70 block mb-1">Legal Name</span>
                  <span className="text-white font-medium">{user?.full_name || "Valued User"}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#083B8A] border border-white/10">
                  <span className="text-[10px] uppercase text-blue-200/70 block mb-1">Registered Email</span>
                  <span className="text-white font-medium truncate block">{user?.email}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#083B8A] border border-white/10">
                  <span className="text-[10px] uppercase text-blue-200/70 block mb-1">Mobile Phone</span>
                  <span className="text-white font-medium">{user?.phone || "Not configured"}</span>
                </div>
              </div>
            </div>

            {/* Active Device Clearance & Session Management */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0646AD] border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-blue-200/70 text-[11px] tracking-[0.2em] uppercase font-mono block mb-1">
                    Device Authorization
                  </span>
                  <h2 className="text-lg font-medium text-white">
                    Active Session Management
                  </h2>
                  <p className="text-xs text-blue-100 mt-1 max-w-xl">
                    Terminate sessions across other browsers or devices. This genuinely invalidates other sessions by rotating your cryptographic session hash.
                  </p>
                </div>
                <button
                  onClick={handleTerminateOtherSessions}
                  disabled={isTerminatingSessions}
                  className="px-4 py-2 rounded-full border border-[#4A2020] bg-[#2A1515] hover:bg-[#381B1B] text-xs text-[#E07A7A] transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#E07A7A]" />
                  <span>{isTerminatingSessions ? "Terminating..." : "Sign Out Other Devices"}</span>
                </button>
              </div>

              {terminationMessage && (
                <div className="p-3.5 rounded-xl bg-[#132B1E] border border-[#1E4D30] text-xs text-[#85E0A3] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{terminationMessage}</span>
                </div>
              )}
            </div>

            {/* Recent Security Activity Panel */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0646AD] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-blue-200/70 text-[11px] tracking-[0.2em] uppercase font-mono block mb-1">
                    Security Audit Trail
                  </span>
                  <h2 className="text-lg font-medium text-white">
                    Recent Security Activity
                  </h2>
                </div>
                <button
                  onClick={fetchActivity}
                  disabled={isActivityLoading}
                  className="text-xs text-blue-100 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isActivityLoading ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {activities.length === 0 ? (
                <p className="text-xs text-blue-200/70 py-4">No recent security events logged.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                  {activities.slice(0, 8).map((act) => (
                    <div
                      key={act.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#083B8A] border border-white/10 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#777777] shrink-0" />
                        <span className="font-mono text-white font-medium">
                          {act.event_type.replace(/_/g, " ")}
                        </span>
                        {act.source && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#083B8A] text-blue-100 border border-white/10 hidden sm:inline">
                            {act.source}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-blue-200/70 text-[11px] font-mono">
                        <span>{act.ip_address || "Client IP"}</span>
                        <span>
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audited Legal Acceptance Records Panel */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0646AD] border border-white/10 space-y-4">
              <div>
                <span className="text-blue-200/70 text-[11px] tracking-[0.2em] uppercase font-mono block mb-1">
                  Compliance &amp; Governance
                </span>
                <h2 className="text-lg font-medium text-white">
                  Audited Legal Acceptance Records
                </h2>
                <p className="text-xs text-blue-100 mt-1">
                  Timestamps and policy versions formally consented to upon registration.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                <div className="p-4 rounded-xl bg-[#083B8A] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Terms &amp; Conditions</span>
                    <span className="text-[10px] font-mono text-white font-semibold">
                      {user?.terms_version || "v1.0"}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-100">
                    Accepted on {user?.terms_accepted_at ? new Date(user.terms_accepted_at).toLocaleString() : "Registration"}
                  </p>
                  <a
                    href="/terms"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate("/terms");
                    }}
                    className="text-xs text-white hover:underline flex items-center gap-1 pt-1"
                  >
                    <span>Read Terms of Service</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-[#083B8A] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Privacy Policy</span>
                    <span className="text-[10px] font-mono text-white font-semibold">
                      {user?.privacy_version || "v1.0"}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-100">
                    Acknowledged on {user?.privacy_acknowledged_at ? new Date(user.privacy_acknowledged_at).toLocaleString() : "Registration"}
                  </p>
                  <a
                    href="/privacy-policy"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate("/privacy-policy");
                    }}
                    className="text-xs text-white hover:underline flex items-center gap-1 pt-1"
                  >
                    <span>Read Privacy Policy</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================= */}
      {/* FOOTER: STATUTORY COMPLIANCE & LEGAL LINKS */}
      {/* ============================================================= */}
      <footer className="border-t border-white/10 mt-16 py-8 px-6 text-xs text-blue-200/70">
        <div className="max-w-[1440px] w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} WealthPass Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a
              href="/terms"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("/terms");
              }}
              className="text-blue-100 hover:text-white transition-colors"
            >
              Terms of Service
            </a>
            <span className="text-[#333333]">•</span>
            <a
              href="/privacy-policy"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("/privacy-policy");
              }}
              className="text-blue-100 hover:text-white transition-colors"
            >
              Privacy Policy
            </a>
            <span className="text-[#333333]">•</span>
            <button
              onClick={() => {
                setActiveTab("settings");
                onNavigate("/settings");
              }}
              className="text-blue-100 hover:text-white transition-colors cursor-pointer"
            >
              Security Settings
            </button>
          </div>
        </div>
      </footer>

      {/* ============================================================= */}
      {/* MODAL: CASE BREAKDOWN & DETAILS */}
      {/* ============================================================= */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-[#083B8A]/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0646AD] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCase(null)}
              className="absolute top-5 right-5 text-blue-100 hover:text-white p-1 rounded-full hover:bg-[#083B8A] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-blue-200/70 text-[11px] tracking-[0.2em] uppercase font-mono block mb-1">
              Case Dossier
            </span>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-medium text-white">
                {selectedCase.deceased_name}
              </h2>
              <div className="text-right">
                <span className="text-[10px] text-blue-200/70 uppercase tracking-wider block font-mono">Confirmed Capital</span>
                <span className="text-sm font-semibold text-white">
                  {selectedCase.total_assets_found > 0
                    ? `₹${Number(selectedCase.total_assets_found).toLocaleString("en-IN")}`
                    : "Pending Branch Valuation"}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-blue-100 mb-6 font-mono">
              <span>PAN: {maskPan(selectedCase.deceased_pan)}</span>
              <span>•</span>
              <span>Claimant: {selectedCase.claimant_name} ({selectedCase.relation || "Legal Heir"})</span>
              <span>•</span>
              <span className="text-white font-semibold">{selectedCase.status.replace(/_/g, " ")}</span>
            </div>

            {/* Discovered Assets List */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wider text-blue-200/70 font-semibold">
                  Discovered Asset Matches ({selectedCase.assets?.length || 0})
                </h3>
                <span className="text-[11px] text-blue-200/70">
                  {selectedCase.assets?.length || 0} Record(s) Logged
                </span>
              </div>

              {isDetailLoading ? (
                <div className="p-6 rounded-2xl bg-[#083B8A] border border-white/10 flex items-center justify-center gap-2 text-xs text-blue-100">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading case assets...</span>
                </div>
              ) : !selectedCase.assets || selectedCase.assets.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#083B8A] border border-white/10 text-center text-xs text-blue-100 space-y-1">
                  <p className="text-white font-medium">No confirmed asset disbursements logged yet.</p>
                  <p className="text-blue-200/70">Statutory registry searches are actively in progress across official channels below.</p>
                </div>
              ) : (
                selectedCase.assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="p-4 rounded-xl bg-[#083B8A] border border-white/10 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white block">
                            {asset.institution}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#083B8A] border border-white/10 font-mono text-blue-100">
                            {asset.verification_status || "UNVERIFIED"}
                          </span>
                        </div>
                        <span className="text-xs text-blue-100">{asset.situation_label}</span>
                        {asset.masked_reference && (
                          <span className="text-[11px] font-mono text-blue-200/70 block mt-0.5">
                            Ref: {asset.masked_reference}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        {asset.amount > 0 && !asset.is_amount_undisclosed ? (
                          <span className="text-sm font-semibold text-white">
                            ₹{Number(asset.amount).toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-xs text-[#E0B252] font-medium bg-[#2D2106] border border-[#523C0A] px-2 py-0.5 rounded block">
                            Valuation Pending Branch Verification
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-blue-100 leading-relaxed">
                      {asset.message}
                    </p>

                    {asset.documents_needed && asset.documents_needed.length > 0 && (
                      <div className="text-[11px] text-blue-100 pt-2 border-t border-white/10">
                        <strong className="text-white block mb-1">Required Documents:</strong>
                        <ul className="list-disc list-inside space-y-0.5 text-blue-100">
                          {asset.documents_needed.map((doc, idx) => (
                            <li key={idx}>{doc}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Statutory Discovery Channels & Jobs */}
            <div className="space-y-3 mb-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wider text-blue-200/70 font-semibold">
                  Statutory Discovery Registries ({selectedCase.source_jobs?.length || 0})
                </h3>
                <span className="text-[10px] text-blue-200/70 font-mono">
                  Official Channels
                </span>
              </div>

              {selectedCase.source_jobs && selectedCase.source_jobs.length > 0 ? (
                <div className="space-y-2.5">
                  {selectedCase.source_jobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-3.5 rounded-xl bg-[#083B8A] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-white">
                            {job.provider_name || job.source_id}
                          </span>
                          <span className="text-[10px] text-blue-200/70 font-mono">
                            ({job.asset_category})
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-blue-100">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                              job.status === "COMPLETED"
                                ? "bg-[#132B1E] text-[#85E0A3] border border-[#1E4D30]"
                                : job.status === "NO_MATCHES_FOUND"
                                ? "bg-[#1A1A1A] text-[#B8B8B8] border border-[#333333]"
                                : "bg-[#2D2106] text-[#E0B252] border border-[#523C0A]"
                            }`}
                          >
                            {job.status.replace(/_/g, " ")}
                          </span>

                          {job.external_reference_number && (
                            <span className="font-mono text-white">
                              Ref: {job.external_reference_number}
                            </span>
                          )}

                          {job.external_portal_url && (
                            <a
                              href={job.external_portal_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-100 hover:text-white underline underline-offset-2"
                            >
                              Official Portal ↗
                            </a>
                          )}

                          {job.consent_url && (
                            <a
                              href={job.consent_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#E0B252] hover:text-white underline underline-offset-2"
                            >
                              Approve AA Consent ↗
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {job.source_id === "SETU_AA_DISCOVERY" && (
                          <button
                            type="button"
                            onClick={() => handleCheckSetuStatus(selectedCase.id)}
                            disabled={isCheckingSetu}
                            className="px-2.5 py-1 rounded-full bg-[#083B8A] hover:bg-[#0755C9] border border-white/10 text-[11px] text-white transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isCheckingSetu ? "Checking..." : "Check AA Status"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setRecordSourceId(job.source_id);
                            setRecordCategory(job.asset_category);
                            setIsRecordRefModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-full bg-[#083B8A] hover:bg-[#0755C9] border border-white/10 text-[11px] text-white transition-colors cursor-pointer"
                        >
                          + Record Reference
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#083B8A] border border-white/10 text-xs text-blue-200/70 text-center">
                  Statutory search jobs queued for execution.
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <a
                  href={`/print-forms/${selectedCase.id}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-full border border-white/10 bg-[#083B8A] hover:bg-[#0755C9] text-xs text-blue-100 hover:text-white transition-colors flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-white" />
                  <span>Download Pre-filled Claim Dossier</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsRecordRefModalOpen(true)}
                  className="px-3.5 py-2 rounded-full border border-white/10 bg-[#083B8A] hover:bg-[#0755C9] text-xs text-white transition-colors cursor-pointer"
                >
                  + Record Reference
                </button>
              </div>

              <button
                onClick={() => setSelectedCase(null)}
                className="px-5 py-2 rounded-full bg-[#E5E0C9] text-[#102A56] font-semibold text-xs uppercase tracking-wider hover:bg-[#F1EEDC] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: RECORD OFFICIAL SEARCH REFERENCE */}
      {/* ============================================================= */}
      {isRecordRefModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 bg-[#083B8A]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0646AD] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => {
                setIsRecordRefModalOpen(false);
                setRecordRefError(null);
                setRecordRefSuccess(null);
              }}
              className="absolute top-5 right-5 text-blue-100 hover:text-white p-1 rounded-full hover:bg-[#083B8A] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-blue-200/70 text-[11px] tracking-[0.2em] uppercase font-mono block mb-1">
              Official Registry Record
            </span>
            <h2 className="text-lg sm:text-xl font-medium text-white mb-1">
              Record External Search Reference
            </h2>
            <p className="text-xs text-blue-100 mb-5 leading-relaxed">
              Record reference code from official search (e.g. RBI UDGAM, IRDAI Bima Bharosa, SEBI MITRA, IEPF, or EPFO).
            </p>

            {recordRefError && (
              <div className="p-3 rounded-xl bg-[#2A1515] border border-[#4A2020] text-[#E07A7A] text-xs mb-4">
                {recordRefError}
              </div>
            )}
            {recordRefSuccess && (
              <div className="p-3 rounded-xl bg-[#132B1E] border border-[#1E4D30] text-[#85E0A3] text-xs mb-4">
                {recordRefSuccess}
              </div>
            )}

            <form onSubmit={handleRecordReferenceSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-blue-100 block mb-1">Discovery Source</label>
                <select
                  value={recordSourceId}
                  onChange={(e) => {
                    const src = e.target.value;
                    setRecordSourceId(src);
                    if (src === "RBI_UDGAM") setRecordCategory("BANK_DEPOSITS");
                    else if (src === "SETU_AA_DISCOVERY") setRecordCategory("BANK_DEPOSITS");
                    else if (src === "IRDAI_BIMA_BHAROSA") setRecordCategory("INSURANCE");
                    else if (src === "SEBI_MITRA") setRecordCategory("MUTUAL_FUNDS");
                    else if (src === "IEPF") setRecordCategory("SHARES_DIVIDENDS");
                    else if (src === "EPFO_SERVICES") setRecordCategory("PENSION_EPFO");
                    else setRecordCategory("OTHER_INVESTMENTS");
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#083B8A] border border-white/10 text-xs text-white focus:outline-none focus:border-white/60"
                >
                  <option value="RBI_UDGAM">RBI UDGAM (Unclaimed Bank Deposits)</option>
                  <option value="SETU_AA_DISCOVERY">Setu Account Aggregator Gateway</option>
                  <option value="IRDAI_BIMA_BHAROSA">IRDAI Bima Bharosa (Insurance)</option>
                  <option value="SEBI_MITRA">SEBI MITRA &amp; MF Central (Mutual Funds)</option>
                  <option value="IEPF">IEPF Authority (Shares &amp; Dividends)</option>
                  <option value="EPFO_SERVICES">EPFO Services (PF &amp; Pension)</option>
                  <option value="OTHER_INVESTMENTS">Post Office &amp; NPS</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-blue-100 block mb-1">Official Search Outcome</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecordOutcome("MATCH_FOUND")}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      recordOutcome === "MATCH_FOUND"
                        ? "bg-[#132B1E] border-[#1E4D30] text-[#85E0A3]"
                        : "bg-[#083B8A] border-white/10 text-blue-100 hover:text-white"
                    }`}
                  >
                    Match Found
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecordOutcome("NO_MATCH_FOUND")}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      recordOutcome === "NO_MATCH_FOUND"
                        ? "bg-[#1A1A1A] border-[#333333] text-[#B8B8B8]"
                        : "bg-[#083B8A] border-white/10 text-blue-100 hover:text-white"
                    }`}
                  >
                    No Matches in Registry
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-blue-100 block mb-1">Holding Institution Name</label>
                <input
                  type="text"
                  placeholder="e.g. State Bank of India, HDFC Bank, LIC of India"
                  value={recordInstitution}
                  onChange={(e) => setRecordInstitution(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#083B8A] border border-white/10 text-xs text-white focus:outline-none focus:border-white/60"
                />
              </div>

              {recordOutcome === "MATCH_FOUND" && (
                <div>
                  <label className="text-xs text-blue-100 block mb-1">
                    Official Reference / Acknowledgement Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UDGAM-1049281, SRN-294812, etc."
                    value={recordRefNo}
                    onChange={(e) => setRecordRefNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#083B8A] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-white/60"
                  />
                  <span className="text-[10px] text-blue-200/70 mt-1 block">
                    UDGAM confirms account existence without publishing private balances. Recorded with undisclosed valuation.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsRecordRefModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-white/10 bg-[#083B8A] hover:bg-[#0755C9] text-xs text-blue-100 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecordingRef}
                  className="px-5 py-2 rounded-full bg-[#E5E0C9] text-[#102A56] font-semibold text-xs hover:bg-[#F1EEDC] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isRecordingRef ? "Recording..." : "Save Reference"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: CHANGE PASSWORD */}
      {/* ============================================================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#083B8A]/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0646AD] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute top-5 right-5 text-blue-100 hover:text-white p-1 rounded-full hover:bg-[#083B8A] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-blue-200/70 text-[11px] tracking-[0.2em] uppercase font-mono block mb-1">
              Security Clearance
            </span>
            <h2 className="text-xl font-medium text-white mb-2">
              Update Account Password
            </h2>
            <p className="text-blue-100 text-xs mb-6">
              Changing your password will automatically invalidate all other sessions across devices.
            </p>

            {passwordError && (
              <div className="p-3 rounded-xl bg-[#2A1515] border border-[#4A2020] text-[#E07A7A] text-xs mb-4">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-[#132B1E] border border-[#1E4D30] text-[#85E0A3] text-xs mb-4">
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs text-blue-100 font-medium block mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-[#083B8A] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/60"
                />
              </div>

              <div>
                <label className="text-xs text-blue-100 font-medium block mb-1.5">
                  New Password (min 8 chars, mixed case, number, symbol)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#083B8A] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/60"
                />
              </div>

              <div>
                <label className="text-xs text-blue-100 font-medium block mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#083B8A] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/60"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-white/10 bg-[#083B8A] hover:bg-[#0755C9] text-xs text-blue-100 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-6 py-2.5 rounded-full bg-[#E5E0C9] text-[#102A56] font-semibold text-xs uppercase tracking-wider hover:bg-[#F1EEDC] disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
                >
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
