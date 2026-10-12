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
  situation_label: string;
  color: string;
  message: string;
  documents_needed: string[];
  next_steps: string[];
  time_estimate: string;
  loan_amount: number;
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

  // Keep activeTab in sync if initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Fetch Cases from API (enforces server-side user isolation)
  const fetchCases = async () => {
    setIsCasesLoading(true);
    setCasesError(null);
    try {
      const res = await apiFetch<{ success: boolean; claims: ClaimCase[] }>("/api/user/claims/");
      if (res.ok && res.data?.success) {
        setCases(res.data.claims || []);
      } else {
        setCasesError(res.error || "Unable to load discovery cases.");
      }
    } catch {
      setCasesError("Network error loading discovery cases.");
    } finally {
      setIsCasesLoading(false);
    }
  };

  // Fetch Identity Verification Status
  const fetchIdentityStatus = async () => {
    try {
      const res = await apiFetch<{ success: boolean; verified: boolean; status: string; reference?: string }>("/api/verify/");
      if (res.ok && res.data?.success) {
        setIdentityRecord({
          verified: res.data.verified,
          status: res.data.status,
          reference: res.data.reference,
        });
      }
    } catch {
      // Non-critical
    }
  };

  // Fetch Activity Log from API (for Security Settings)
  const fetchActivity = async () => {
    setIsActivityLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; activity: ActivityItem[] }>("/api/auth/activity/");
      if (res.ok && res.data?.success) {
        setActivities(res.data.activity || []);
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

  // Helper: Relationship Status derivation
  const getRelationshipStatus = (): {
    label: string;
    badgeStyle: string;
    subtext: string;
    actionable: boolean;
  } => {
    if (cases.length === 0) {
      return {
        label: "Not required yet",
        badgeStyle: "bg-white/5 text-gray-400 border-white/10",
        subtext: "Begins when you start your first recovery case",
        actionable: false,
      };
    }

    const relStatus = user?.relationship_status;
    if (relStatus === "VERIFIED") {
      return {
        label: "Verified",
        badgeStyle: "bg-emerald-950/60 text-emerald-400 border-emerald-500/30",
        subtext: "Kinship established per Indian Succession Act",
        actionable: false,
      };
    }
    if (relStatus === "DOCUMENTS_REQUIRED" || relStatus === "NEEDS_CLARIFICATION") {
      return {
        label: "Additional evidence required",
        badgeStyle: "bg-amber-950/60 text-amber-300 border-amber-500/30",
        subtext: "Upload civil documents to substantiate relationship",
        actionable: true,
      };
    }
    if (relStatus === "EVIDENCE_SUBMITTED" || relStatus === "UNDER_REVIEW") {
      return {
        label: "Under review",
        badgeStyle: "bg-blue-950/60 text-blue-300 border-blue-500/30",
        subtext: "Submitted civil records currently under review",
        actionable: false,
      };
    }
    return {
      label: "In progress",
      badgeStyle: "bg-white/10 text-gray-300 border-white/15",
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

  return (
    <div className="min-h-screen bg-black text-[#E1E0CC] selection:bg-primary selection:text-black">
      {/* ============================================================= */}
      {/* STICKY PORTAL HEADER & NAVIGATION TABS */}
      {/* ============================================================= */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Brand & Navigation Switcher */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => {
                setActiveTab("cases");
                onNavigate("/dashboard");
              }}
              className="text-left cursor-pointer"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-primary block">
                WealthPass
              </span>
              <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">
                Asset Recovery Portal
              </span>
            </button>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 text-xs">
              <button
                onClick={() => {
                  setActiveTab("cases");
                  onNavigate("/dashboard");
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-medium ${
                  activeTab === "cases"
                    ? "bg-primary text-black shadow-sm"
                    : "text-gray-400 hover:text-white"
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
                    ? "bg-primary text-black shadow-sm"
                    : "text-gray-400 hover:text-white"
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
              <span className="text-[10px] text-gray-400 block font-mono truncate max-w-[160px]">
                {user?.email}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-gray-300 hover:text-white transition-all cursor-pointer"
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {activeTab === "cases" ? (
          /* =========================================================== */
          /* VIEW 1: RECOVERY DASHBOARD */
          /* =========================================================== */
          <>
            {/* 1. WELCOME BANNER */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#121212] border border-white/10 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-primary text-[10px] tracking-[0.2em] uppercase font-semibold">
                      Personal Recovery Dashboard
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-gray-400 font-mono">
                      Active
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-medium text-white tracking-tight">
                    Welcome, {user?.full_name || "Valued User"}
                  </h1>

                  {/* Verification badges & contact info */}
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-400 pt-1">
                    {/* Email badge with live action if unverified */}
                    <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      <span className="text-gray-300">{user?.email}</span>
                      {user?.is_email_verified ? (
                        <span className="text-emerald-400 text-[10px] font-semibold ml-1 flex items-center gap-0.5">
                          <Check className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => onNavigate("/verify-email")}
                          className="text-amber-300 hover:text-amber-200 text-[10px] font-semibold ml-1 underline cursor-pointer"
                        >
                          Verify Email
                        </button>
                      )}
                    </div>

                    {/* Phone badge */}
                    <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <span className="text-gray-300">
                        {user?.phone || "No phone added"}
                      </span>
                      {user?.is_phone_verified && (
                        <span className="text-emerald-400 text-[10px] font-semibold ml-1">
                          ✓ Verified
                        </span>
                      )}
                    </div>

                    {user?.created_at && (
                      <span className="flex items-center gap-1.5 text-gray-500 font-mono text-[11px] hidden sm:flex">
                        <Clock className="w-3 h-3" />
                        Member since {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary Landing Page Styled CTA "FIND ASSETS" */}
                <div className="shrink-0">
                  <button
                    onClick={() => onNavigate("/assets/discover")}
                    className="group flex items-center gap-2 hover:gap-3 p-1.5 pl-6 pr-1.5 rounded-full bg-primary text-black font-semibold transition-all duration-300 text-sm sm:text-base hover:bg-white cursor-pointer shadow-lg shadow-primary/10"
                  >
                    <span>Find Assets</span>
                    <div className="bg-black rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                  </button>
                </div>
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
            </div>

            {/* UNVERIFIED EMAIL NOTIFICATION BANNER (Action-oriented) */}
            {!user?.is_email_verified && (
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Action Required: Please verify your email address (<strong>{user?.email}</strong>) to receive official recovery dossier alerts and statutory match updates.
                  </span>
                </div>
                <button
                  onClick={() => onNavigate("/verify-email")}
                  className="px-4 py-1.5 rounded-full bg-amber-400 text-black font-semibold text-xs hover:bg-white transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  Verify Email
                </button>
              </div>
            )}

            {/* 2. COMPACT "YOUR VERIFICATION STATUS" SECTION */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xs uppercase tracking-widest text-gray-400 font-semibold">
                    Your Verification Status
                  </h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Clearance credentials required by financial institutions to process asset recovery.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Email Verification */}
                <div
                  onClick={() => {
                    if (!user?.is_email_verified) onNavigate("/verify-email");
                  }}
                  className={`p-4 rounded-2xl bg-[#121212] border border-white/10 flex flex-col justify-between transition-all ${
                    !user?.is_email_verified ? "hover:border-amber-500/40 cursor-pointer" : ""
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                        <Mail className="w-4 h-4" />
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          user?.is_email_verified
                            ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-950/60 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {user?.is_email_verified ? "Verified" : "Verification required"}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-white mb-1">
                      Email Verification
                    </h3>
                    <p className="text-[11px] text-gray-400 leading-normal">
                      {user?.is_email_verified
                        ? "Active channel for case correspondence and claim packets."
                        : "Required to receive statutory case match notifications."}
                    </p>
                  </div>
                  {!user?.is_email_verified && (
                    <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1 mt-3">
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
                  className={`p-4 rounded-2xl bg-[#121212] border border-white/10 flex flex-col justify-between transition-all ${
                    !isIdentityVerified ? "hover:border-primary/40 cursor-pointer" : ""
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isIdentityVerified
                            ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30"
                            : rawIdStatus === "UNDER_REVIEW" || rawIdStatus === "IN_PROGRESS"
                            ? "bg-blue-950/60 text-blue-300 border-blue-500/30"
                            : "bg-amber-950/60 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {identityStatusLabel}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-white mb-1">
                      Identity Verification
                    </h3>
                    <p className="text-[11px] text-gray-400 leading-normal">
                      {isIdentityVerified
                        ? "Claimant identity authenticated. Ready for institutional filings."
                        : "Verify your legal identity prior to formal asset claim submission."}
                    </p>
                  </div>
                  {!isIdentityVerified && (
                    <span className="text-[11px] text-primary font-medium flex items-center gap-1 mt-3">
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
                  className={`p-4 rounded-2xl bg-[#121212] border border-white/10 flex flex-col justify-between transition-all ${
                    relStatusInfo.actionable ? "hover:border-primary/40 cursor-pointer" : ""
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${relStatusInfo.badgeStyle}`}
                      >
                        {relStatusInfo.label}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-white mb-1">
                      Relationship Evidence
                    </h3>
                    <p className="text-[11px] text-gray-400 leading-normal">
                      {relStatusInfo.subtext}
                    </p>
                  </div>
                  {relStatusInfo.actionable && (
                    <span className="text-[11px] text-primary font-medium flex items-center gap-1 mt-3">
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
                  <h2 className="text-sm uppercase tracking-widest text-gray-400 font-semibold">
                    Your Asset Recovery Cases
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-white font-medium">
                    {cases.length} {cases.length === 1 ? "Case" : "Cases"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchCases}
                    disabled={isCasesLoading}
                    className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                    title="Refresh Cases"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCasesLoading ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    onClick={() => onNavigate("/assets/discover")}
                    className="group flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-black text-xs font-semibold hover:bg-white transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Find Assets</span>
                  </button>
                </div>
              </div>

              {casesError && (
                <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
                  {casesError}
                </div>
              )}

              {isCasesLoading && cases.length === 0 ? (
                <div className="p-12 rounded-3xl bg-[#121212] border border-white/10 flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                  <span className="text-xs text-gray-400 font-mono">
                    Loading your recovery cases...
                  </span>
                </div>
              ) : cases.length === 0 ? (
                /* CLEAN USER-FRIENDLY EMPTY STATE (NO MOCK DATA) */
                <div className="p-12 sm:p-16 rounded-3xl bg-[#121212] border border-white/10 flex flex-col items-center text-center max-w-2xl mx-auto space-y-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Search className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-medium text-white mb-2">
                      Your family&apos;s assets deserve to be found.
                    </h3>
                    <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
                      Start by telling us about the person whose assets you want to discover across official banking, insurance, and statutory registries.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => onNavigate("/assets/discover")}
                      className="group flex items-center gap-2.5 p-1.5 pl-6 pr-1.5 rounded-full bg-primary text-black font-semibold text-xs sm:text-sm uppercase tracking-wider hover:bg-white transition-all cursor-pointer shadow-lg shadow-primary/10"
                    >
                      <span>+ Find Assets</span>
                      <div className="bg-black rounded-full w-8 h-8 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ArrowRight className="w-4 h-4 text-primary" />
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                /* POPULATED CASES GRID */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {cases.map((c) => {
                    const nextAction = getNextActionForCase(c);
                    const formattedDate = new Date(c.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                    const hasGenuineMatches = Number(c.total_assets_found) > 0;

                    return (
                      <div
                        key={c.id}
                        className="p-6 rounded-2xl bg-[#121212] border border-white/10 hover:border-primary/40 transition-all flex flex-col justify-between space-y-5"
                      >
                        <div>
                          {/* Case Header: Ref & Status */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-mono uppercase text-primary font-semibold">
                                  CASE-{c.id.slice(0, 8).toUpperCase()}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-white/30" />
                                <span className="text-[10px] text-gray-500 font-mono">
                                  {formattedDate}
                                </span>
                              </div>
                              <h3 className="text-lg font-medium text-white">
                                {c.deceased_name}
                              </h3>
                              <span className="text-xs text-gray-400">
                                Claimed Relationship:{" "}
                                <strong className="text-gray-200">
                                  {c.relation || "Legal Heir"}
                                </strong>
                              </span>
                            </div>

                            {/* Status Badge */}
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border shrink-0 ${
                                c.status === "READY_FOR_CLAIM" || c.status === "verified"
                                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30"
                                  : c.status === "loan_accepted"
                                  ? "bg-purple-950/60 text-purple-300 border-purple-500/30"
                                  : c.status === "UNDER_REVIEW" || c.status === "PENDING"
                                  ? "bg-blue-950/60 text-blue-300 border-blue-500/30"
                                  : "bg-white/5 text-gray-300 border-white/10"
                              }`}
                            >
                              {c.status.replace(/_/g, " ")}
                            </span>
                          </div>

                          {/* Next Required Action Box */}
                          <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 space-y-1 mb-4 text-left">
                            <span className="text-[10px] uppercase tracking-wider text-primary font-semibold block">
                              Next Required Action
                            </span>
                            <p className="text-xs text-gray-300 leading-normal">
                              {nextAction}
                            </p>
                          </div>

                          {/* Genuine Discovery Summary (No fake values) */}
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                              <span className="text-[10px] uppercase text-gray-500 block">
                                Deceased PAN
                              </span>
                              <span className="font-mono text-gray-300">
                                {maskPan(c.deceased_pan)}
                              </span>
                            </div>
                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                              <span className="text-[10px] uppercase text-gray-500 block">
                                Discovered Matches
                              </span>
                              {hasGenuineMatches ? (
                                <span className="font-semibold text-primary">
                                  ₹{Number(c.total_assets_found).toLocaleString("en-IN")} ({c.assets_count || c.assets?.length || 1} match)
                                </span>
                              ) : (
                                <span className="text-[11px] text-gray-400 italic">
                                  Scan in progress
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Actions: Continue Case or View Details */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
                          <button
                            onClick={() => handleSelectCase(c.id)}
                            className="text-xs text-gray-300 hover:text-white font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>View Details</span>
                            <ChevronRight className="w-3.5 h-3.5 text-primary" />
                          </button>

                          <div className="flex items-center gap-2">
                            {c.is_draft ? (
                              <button
                                onClick={() => onNavigate("/assets/discover")}
                                className="px-4 py-1.5 rounded-full bg-primary text-black text-xs font-semibold hover:bg-white transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                              >
                                <span>Continue Case</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ) : c.status === "READY_FOR_CLAIM" ? (
                              <a
                                href={`/results/${c.id}/`}
                                className="px-4 py-1.5 rounded-full bg-primary text-black text-xs font-semibold hover:bg-white transition-all flex items-center gap-1 shadow-sm"
                              >
                                <span>Claim Steps</span>
                                <ArrowRight className="w-3 h-3" />
                              </a>
                            ) : (
                              <a
                                href={`/print-forms/${c.id}/`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
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
                <p className="text-xs text-gray-400">
                  Manage your credentials, active session authorizations, and audited regulatory acceptance records.
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab("cases");
                  onNavigate("/dashboard");
                }}
                className="px-4 py-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-xs text-gray-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>← Back to Cases</span>
              </button>
            </div>

            {/* Profile & Credentials Panel */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#121212] border border-white/10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-primary text-[10px] tracking-[0.2em] uppercase font-semibold block mb-1">
                    Credentials &amp; Authentication
                  </span>
                  <h2 className="text-lg font-medium text-white">
                    Account Security
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Your password protects all private recovery documents and claimant records.
                  </p>
                </div>
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-primary text-black font-semibold text-xs uppercase tracking-wider hover:bg-white transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto shadow-md"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Change Password</span>
                </button>
              </div>

              {/* User details summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5 text-xs">
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[10px] uppercase text-gray-500 block mb-1">Legal Name</span>
                  <span className="text-white font-medium">{user?.full_name || "Valued User"}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[10px] uppercase text-gray-500 block mb-1">Registered Email</span>
                  <span className="text-white font-medium truncate block">{user?.email}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[10px] uppercase text-gray-500 block mb-1">Mobile Phone</span>
                  <span className="text-white font-medium">{user?.phone || "Not configured"}</span>
                </div>
              </div>
            </div>

            {/* Active Device Clearance & Session Management */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#121212] border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-primary text-[10px] tracking-[0.2em] uppercase font-semibold block mb-1">
                    Device Authorization
                  </span>
                  <h2 className="text-lg font-medium text-white">
                    Active Session Management
                  </h2>
                  <p className="text-xs text-gray-400 mt-1 max-w-xl">
                    Terminate sessions across other browsers or devices. This genuinely invalidates other sessions by rotating your cryptographic session hash.
                  </p>
                </div>
                <button
                  onClick={handleTerminateOtherSessions}
                  disabled={isTerminatingSessions}
                  className="px-4 py-2 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 text-xs text-red-300 hover:text-red-200 transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                  <span>{isTerminatingSessions ? "Terminating..." : "Sign Out Other Devices"}</span>
                </button>
              </div>

              {terminationMessage && (
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{terminationMessage}</span>
                </div>
              )}
            </div>

            {/* Recent Security Activity Panel */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#121212] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-primary text-[10px] tracking-[0.2em] uppercase font-semibold block mb-1">
                    Security Audit Trail
                  </span>
                  <h2 className="text-lg font-medium text-white">
                    Recent Security Activity
                  </h2>
                </div>
                <button
                  onClick={fetchActivity}
                  disabled={isActivityLoading}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isActivityLoading ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {activities.length === 0 ? (
                <p className="text-xs text-gray-500 py-4">No recent security events logged.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                  {activities.slice(0, 8).map((act) => (
                    <div
                      key={act.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span className="font-mono text-gray-200 font-medium">
                          {act.event_type.replace(/_/g, " ")}
                        </span>
                        {act.source && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5 hidden sm:inline">
                            {act.source}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-gray-500 text-[11px] font-mono">
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
            <div className="p-6 sm:p-8 rounded-3xl bg-[#121212] border border-white/10 space-y-4">
              <div>
                <span className="text-primary text-[10px] tracking-[0.2em] uppercase font-semibold block mb-1">
                  Compliance &amp; Governance
                </span>
                <h2 className="text-lg font-medium text-white">
                  Audited Legal Acceptance Records
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Timestamps and policy versions formally consented to upon registration.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Terms &amp; Conditions</span>
                    <span className="text-[10px] font-mono text-primary font-semibold">
                      {user?.terms_version || "v1.0"}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Accepted on {user?.terms_accepted_at ? new Date(user.terms_accepted_at).toLocaleString() : "Registration"}
                  </p>
                  <a
                    href="/terms"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate("/terms");
                    }}
                    className="text-xs text-primary hover:underline flex items-center gap-1 pt-1"
                  >
                    <span>Read Terms of Service</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Privacy Policy</span>
                    <span className="text-[10px] font-mono text-primary font-semibold">
                      {user?.privacy_version || "v1.0"}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Acknowledged on {user?.privacy_acknowledged_at ? new Date(user.privacy_acknowledged_at).toLocaleString() : "Registration"}
                  </p>
                  <a
                    href="/privacy-policy"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate("/privacy-policy");
                    }}
                    className="text-xs text-primary hover:underline flex items-center gap-1 pt-1"
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
      <footer className="border-t border-white/10 mt-16 py-8 px-6 text-xs text-gray-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} WealthPass Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a
              href="/terms"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("/terms");
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Terms of Service
            </a>
            <span className="text-white/20">•</span>
            <a
              href="/privacy-policy"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("/privacy-policy");
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </a>
            <span className="text-white/20">•</span>
            <button
              onClick={() => {
                setActiveTab("settings");
                onNavigate("/settings");
              }}
              className="text-gray-400 hover:text-primary transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#141414] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCase(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-primary text-[10px] tracking-[0.2em] uppercase font-semibold block mb-1">
              Case Dossier
            </span>
            <h2 className="text-xl sm:text-2xl font-medium text-white mb-1">
              {selectedCase.deceased_name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-6 font-mono">
              <span>PAN: {maskPan(selectedCase.deceased_pan)}</span>
              <span>•</span>
              <span>Claimant: {selectedCase.claimant_name} ({selectedCase.relation || "Legal Heir"})</span>
              <span>•</span>
              <span className="text-primary font-semibold">{selectedCase.status.replace(/_/g, " ")}</span>
            </div>

            {/* Discovered Assets List */}
            <div className="space-y-4 mb-6">
              <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                Discovered Asset Matches ({selectedCase.assets?.length || 0})
              </h3>

              {isDetailLoading ? (
                <div className="p-6 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading case assets...</span>
                </div>
              ) : !selectedCase.assets || selectedCase.assets.length === 0 ? (
                <div className="p-6 rounded-2xl bg-black/40 border border-white/5 text-center text-xs text-gray-400">
                  Discovery scan currently evaluating statutory matches across official registries.
                </div>
              ) : (
                selectedCase.assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-sm font-medium text-white block">
                          {asset.institution}
                        </span>
                        <span className="text-xs text-gray-400">{asset.situation_label}</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        ₹{Number(asset.amount).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed">
                      {asset.message}
                    </p>

                    {asset.documents_needed && asset.documents_needed.length > 0 && (
                      <div className="text-[11px] text-gray-400 pt-2 border-t border-white/5">
                        <strong className="text-gray-300 block mb-1">Required Documents:</strong>
                        <ul className="list-disc list-inside space-y-0.5 text-gray-400">
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

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
              <a
                href={`/print-forms/${selectedCase.id}/`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-gray-300 hover:text-white transition-colors flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>Download Pre-filled Claim Dossier</span>
              </a>

              <button
                onClick={() => setSelectedCase(null)}
                className="px-5 py-2 rounded-xl bg-primary text-black font-semibold text-xs uppercase tracking-wider hover:bg-white transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: CHANGE PASSWORD */}
      {/* ============================================================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#141414] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-primary text-[10px] tracking-[0.2em] uppercase font-semibold block mb-1">
              Security Clearance
            </span>
            <h2 className="text-xl font-medium text-white mb-2">
              Update Account Password
            </h2>
            <p className="text-gray-400 text-xs mb-6">
              Changing your password will automatically invalidate all other sessions across devices.
            </p>

            {passwordError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs mb-4">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs mb-4">
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs text-gray-300 font-medium block mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#E1E0CC] focus:outline-none focus:border-primary/60"
                />
              </div>

              <div>
                <label className="text-xs text-gray-300 font-medium block mb-1.5">
                  New Password (min 8 chars, mixed case, number, symbol)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#E1E0CC] focus:outline-none focus:border-primary/60"
                />
              </div>

              <div>
                <label className="text-xs text-gray-300 font-medium block mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#E1E0CC] focus:outline-none focus:border-primary/60"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-6 py-2.5 rounded-xl bg-primary text-black font-semibold text-xs uppercase tracking-wider hover:bg-white disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
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
