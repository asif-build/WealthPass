import { useState, useEffect } from "react";
import { ArrowRight, Mail, CheckCircle } from "lucide-react";
import { HowItWorksNavbar } from "./components/how-it-works/HowItWorksNavbar";
import { VerifyMatchPage } from "./components/how-it-works/VerifyMatchPage";
import { ClaimPreparationPage } from "./components/how-it-works/ClaimPreparationPage";
import { InstantLiquidityPage } from "./components/how-it-works/InstantLiquidityPage";
import { VerifyPage } from "./components/verification/VerifyPage";
import { RelationshipVerification } from "./components/verification/RelationshipVerification";
import { DiscoverAssetsPage } from "./components/discovery/DiscoverAssetsPage";
import { SourcesPage } from "./components/sources/SourcesPage";
import { ClaimPreparationView } from "./components/claim/ClaimPreparationView";
import { RegisterPage } from "./components/auth/RegisterPage";
import { LoginPage } from "./components/auth/LoginPage";
import { VerifyEmailPage } from "./components/auth/VerifyEmailPage";
import { ForgotPasswordPage } from "./components/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/auth/ResetPasswordPage";
import { TermsPage } from "./components/legal/TermsPage";
import { PrivacyPolicyPage } from "./components/legal/PrivacyPolicyPage";
import { DashboardPage } from "./components/dashboard/DashboardPage";
import { AssetDiscoveryWorkflowPage } from "./components/discovery/AssetDiscoveryWorkflowPage";
import { NotFoundPage } from "./components/NotFoundPage";
import { apiFetch } from "./services/apiClient";
import type { VerificationResult } from "./services/IdentityVerificationProvider";
import type { DiscoveredAssetItem } from "./services/AssetDiscoveryEngine";
import { NotificationProvider, useNotifications } from "./components/notifications/NotificationContext";
import { DynamicIslandNotification } from "./components/notifications/DynamicIslandNotification";
import { NotificationCenter } from "./components/notifications/NotificationCenter";
import { EnergyDashboardPage } from "./components/energy/EnergyDashboardPage";
import { HaloLandingPage } from "./components/landing/HaloLandingPage";

const VALID_PATHS = [
  "/how-it-works/verify-match",
  "/how-it-works/claim-preparation",
  "/how-it-works/instant-liquidity",
  "/how-it-works",
  "/verify",
  "/relationship",
  "/discover-assets",
  "/sources",
  "/energy",
  "/document-intelligence",
  "/claim",
  "/register",
  "/login",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/terms",
  "/privacy-policy",
  "/dashboard",
  "/settings",
  "/assets/discover",
  "/404"
];

function NotificationOverlay({ onNavigate }: { onNavigate: (route: string) => void }) {
  const { activeToast, dismissToast } = useNotifications();
  return (
    <>
      <DynamicIslandNotification
        notification={activeToast}
        onDismiss={dismissToast}
        onNavigate={onNavigate}
      />
      <NotificationCenter onNavigate={onNavigate} />
    </>
  );
}

function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const p = window.location.pathname.replace(/\/$/, "");
      if (VALID_PATHS.includes(p)) {
        return p === "/how-it-works" ? "/how-it-works/verify-match" : p;
      }
      if (p !== "" && p !== "/") {
        return "/404";
      }
    }
    return "/";
  });

  const [verificationResult, setVerificationResult] = useState<VerificationResult>({
    success: true,
    reference: "WP-VRF-82A91",
    maskedIdentifier: "XXXX XXXX 4821",
    status: "VERIFIED",
    provider: "DEMO_PROVIDER (Sandbox Mode)",
    isDemo: true,
    verifiedAt: new Date().toISOString(),
    dataProtectionGuarantees: [
      "Full Aadhaar not retained",
      "Aadhaar document not retained",
      "OTP not retained",
      "Biometric data not retained",
      "Verification event recorded"
    ]
  });

  const [relationshipData, setRelationshipData] = useState({
    relationship: "Parent",
    claimantName: "Rohan Mehta",
    deceasedName: "Arun Mehta",
    consentGranted: true
  });

  const [selectedAsset, setSelectedAsset] = useState<DiscoveredAssetItem | null>(null);

  // Authentication & session management state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me/", {
        headers: { Accept: "application/json" },
        cache: "no-store",
        credentials: "same-origin"
      });
      const data = await res.json();
      if (data.isAuthenticated && data.user) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    // Listen to cross-tab logout events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "wealthpass_logout_event") {
        setCurrentUser(null);
        if (window.location.pathname.startsWith("/dashboard")) {
          window.location.href = "/login";
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout/", {
        method: "POST"
      });
    } catch (err) {
      console.error("Logout network error:", err);
    } finally {
      // 1. Clear in-memory user state
      setCurrentUser(null);

      // 2. Clear client-side storage & notify other tabs
      try {
        localStorage.removeItem("wealthpass_user");
        sessionStorage.clear();
        localStorage.setItem("wealthpass_logout_event", Date.now().toString());
      } catch {
        // Storage might be restricted
      }

      // 3. Clear sensitive state caches
      setSelectedAsset(null);

      // 4. Force full page redirection to /login to purge any residual React memory
      window.location.href = "/login";
    }
  };

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync with browser Back and Forward history navigation
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname.replace(/\/$/, "");
      if (VALID_PATHS.includes(p)) {
        setCurrentPath(p === "/how-it-works" ? "/how-it-works/verify-match" : p);
      } else {
        setCurrentPath("/");
      }
      // Re-verify session on navigation
      fetchCurrentUser();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleNavigate = (path: string) => {
    const normalized = path.replace(/\/$/, "");
    if (normalized === "" || normalized === "/") {
      window.history.pushState({}, "", "/");
      setCurrentPath("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        const el = document.getElementById("features");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      window.history.pushState({}, "", normalized);
      setCurrentPath(normalized);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;

    setIsSubmitting(true);

    try {
      await fetch("/api/contact/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          message: contactMessage,
        }),
      });
    } catch (err) {
      console.log("Backend submit attempt:", err);
    }

    const subject = encodeURIComponent(`WealthPass Search Inquiry from ${contactName}`);
    const body = encodeURIComponent(
      `Name: ${contactName}\nEmail: ${contactEmail}\n\nSearch Inquiry / Message:\n${contactMessage}`
    );
    const mailtoUrl = `mailto:wealthpass.official@gmail.com?subject=${subject}&body=${body}`;

    window.location.href = mailtoUrl;

    setSubmittedName(contactName);
    setContactSubmitted(true);
    setIsSubmitting(false);
    setContactName("");
    setContactEmail("");
    setContactMessage("");
  };

  // Reusable footer shared between homepage and How-It-Works views
  const renderFooter = () => (
    <footer id="inquiries" className="relative pt-24 pb-16 px-6 sm:px-8 border-t border-white/10 bg-[#0a0a0a]">
      <div className="w-full max-w-7xl mx-auto z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          {/* Left Info Column */}
          <div className="flex flex-col justify-between">
            <div>
              <span className="text-primary text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-4 block font-medium">
                Connect
              </span>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[#E1E0CC] mb-6 leading-none">
                Let's secure your family's inheritance.
              </h3>
              <p className="text-gray-200 text-sm sm:text-base leading-relaxed max-w-md mb-8">
                Have a claim, a question, or need assistance recovering family wealth? Reach out to our advisors directly. We are here to bring closure to your search.
              </p>
            </div>

            {/* Contact details */}
            <div className="flex flex-col gap-4 mt-8">
              <a
                href="mailto:wealthpass.official@gmail.com"
                className="flex items-center gap-3 text-[#E1E0CC] hover:text-white transition-colors text-sm sm:text-base"
              >
                <Mail className="w-5 h-5 text-primary" />
                <span>wealthpass.official@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Right Contact Form Column */}
          <div className="bg-[#121212] p-8 md:p-12 rounded-[2rem] border border-white/5 shadow-2xl">
            {contactSubmitted ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-2">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-medium text-[#E1E0CC]">Inquiry Sent!</h4>
                <p className="text-gray-200 text-sm max-w-sm leading-relaxed">
                  Thank you, <span className="text-[#E1E0CC] font-medium">{submittedName}</span>! Your inquiry has been submitted and your email client has opened to send to <span className="text-primary font-medium">wealthpass.official@gmail.com</span>. We will get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setContactSubmitted(false)}
                  className="mt-4 px-6 py-2.5 rounded-full border border-white/10 text-xs uppercase tracking-widest text-gray-300 hover:text-white hover:border-white/30 transition-all cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="flex flex-col gap-6">
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-200 block mb-2 font-medium">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl px-4 py-3 text-[#E1E0CC] placeholder-gray-400 focus:outline-none focus:border-primary/50 text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-200 block mb-2 font-medium">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl px-4 py-3 text-[#E1E0CC] placeholder-gray-400 focus:outline-none focus:border-primary/50 text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-200 block mb-2 font-medium">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="How can we help? Tell us what you are looking for..."
                    className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl px-4 py-3 text-[#E1E0CC] placeholder-gray-400 focus:outline-none focus:border-primary/50 text-sm transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full group flex items-center justify-between p-1.5 pl-6 pr-1.5 rounded-full bg-primary text-black font-medium transition-all duration-300 text-sm sm:text-base hover:bg-white disabled:opacity-50 cursor-pointer"
                >
                  <span>{isSubmitting ? "Sending..." : "Send Message"}</span>
                  <div className="bg-black rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="border-t border-white/5 mt-16 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} WealthPass Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <a
              href="/terms"
              onClick={(e) => {
                e.preventDefault();
                handleNavigate("/terms");
              }}
              className="text-gray-400 hover:text-primary transition-colors cursor-pointer"
            >
              Terms &amp; Conditions
            </a>
            <span className="text-white/20">•</span>
            <a
              href="/privacy-policy"
              onClick={(e) => {
                e.preventDefault();
                handleNavigate("/privacy-policy");
              }}
              className="text-gray-400 hover:text-primary transition-colors cursor-pointer"
            >
              Privacy Policy
            </a>
            <span className="text-white/20">•</span>
            <span className="text-primary/90">RBI Aligned</span>
            <span className="text-primary/90">IRDAI Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );

  const renderScreen = () => {
    // ROUTE 1: CARD 01 - VERIFY & MATCH
    if (currentPath === "/how-it-works/verify-match") {
    return (
      <div className="bg-black text-[#E1E0CC] selection:bg-primary selection:text-black min-h-screen">
        <HowItWorksNavbar currentPath={currentPath} onNavigate={handleNavigate} />
        <main>
          <VerifyMatchPage onNavigate={handleNavigate} />
        </main>
        {renderFooter()}
      </div>
    );
  }

  // ROUTE 2: CARD 02 - CLAIM PREPARATION
  if (currentPath === "/how-it-works/claim-preparation") {
    return (
      <div className="bg-black text-[#E1E0CC] selection:bg-primary selection:text-black min-h-screen">
        <HowItWorksNavbar currentPath={currentPath} onNavigate={handleNavigate} />
        <main>
          <ClaimPreparationPage onNavigate={handleNavigate} />
        </main>
        {renderFooter()}
      </div>
    );
  }

  // ROUTE 3: CARD 03 - INSTANT LIQUIDITY
  if (currentPath === "/how-it-works/instant-liquidity") {
    return (
      <div className="bg-black text-[#E1E0CC] selection:bg-primary selection:text-black min-h-screen">
        <HowItWorksNavbar currentPath={currentPath} onNavigate={handleNavigate} />
        <main>
          <InstantLiquidityPage onNavigate={handleNavigate} />
        </main>
        {renderFooter()}
      </div>
    );
  }

  // ROUTE 4: PRIVACY-PRESERVING IDENTITY VERIFICATION (/verify)
  if (currentPath === "/verify") {
    return (
      <div className="bg-black text-[#E1E0CC] selection:bg-primary selection:text-black min-h-screen">
        <VerifyPage
          onVerificationComplete={(res) => {
            setVerificationResult(res);
            handleNavigate("/relationship");
          }}
          onNavigateHome={() => handleNavigate("/")}
        />
        {renderFooter()}
      </div>
    );
  }

  // ROUTE 5: CLAIMANT RELATIONSHIP & EVIDENCE (/relationship)
  if (currentPath === "/relationship") {
    return (
      <div className="bg-black text-[#E1E0CC] selection:bg-primary selection:text-black min-h-screen">
        <RelationshipVerification
          verificationResult={verificationResult}
          onProceedToDiscovery={(relData) => {
            setRelationshipData(relData);
            handleNavigate("/discover-assets");
          }}
          onBack={() => handleNavigate("/verify")}
        />
        {renderFooter()}
      </div>
    );
  }

  // ROUTE 6: MULTI-SOURCE ASSET DISCOVERY DASHBOARD (/discover-assets)
  if (currentPath === "/discover-assets") {
    return (
      <div className="bg-black text-[#E1E0CC] selection:bg-primary selection:text-black min-h-screen">
        <DiscoverAssetsPage
          verificationResult={verificationResult}
          relationshipData={relationshipData}
          onSelectAssetForClaim={(asset) => {
            setSelectedAsset(asset);
            handleNavigate("/claim");
          }}
          onNavigateSources={() => handleNavigate("/sources")}
          onNavigateHome={() => handleNavigate("/")}
        />
        {renderFooter()}
      </div>
    );
  }

  // ROUTE 7: SOURCE TRANSPARENCY REGISTRY (/sources)
  if (currentPath === "/sources") {
    return (
      <div className="bg-black text-[#E1E0CC] selection:bg-primary selection:text-black min-h-screen">
        <SourcesPage
          onNavigateHome={() => handleNavigate("/")}
          onNavigateVerify={() => handleNavigate("/verify")}
        />
        {renderFooter()}
      </div>
    );
  }

  // ROUTE: GREEN AI DOCUMENT INTELLIGENCE & ENERGY TELEMETRY (/energy)
  if (currentPath === "/energy" || currentPath === "/document-intelligence") {
    return (
      <div className="bg-black text-[#E1E0CC] selection:bg-primary selection:text-black min-h-screen">
        <EnergyDashboardPage onNavigateHome={() => handleNavigate("/")} />
        {renderFooter()}
      </div>
    );
  }

  // ROUTE 8: CLAIM PREPARATION DOSSIER (/claim)
  if (currentPath === "/claim") {
    return (
      <div className="bg-black text-[#E1E0CC] selection:bg-primary selection:text-black min-h-screen">
        <ClaimPreparationView
          selectedAsset={selectedAsset}
          verificationResult={verificationResult}
          relationshipData={relationshipData}
          onNavigateDiscovery={() => handleNavigate("/discover-assets")}
          onNavigateHome={() => handleNavigate("/")}
        />
        {renderFooter()}
      </div>
    );
  }

  // ROUTE: REGISTER (/register)
  if (currentPath === "/register") {
    return <RegisterPage onNavigate={handleNavigate} />;
  }

  // ROUTE: LOGIN (/login)
  if (currentPath === "/login") {
    return (
      <LoginPage
        onNavigate={handleNavigate}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  // ROUTE: EMAIL VERIFICATION (/verify-email)
  if (currentPath === "/verify-email") {
    return <VerifyEmailPage onNavigate={handleNavigate} />;
  }

  // ROUTE: FORGOT PASSWORD (/forgot-password)
  if (currentPath === "/forgot-password") {
    return <ForgotPasswordPage onNavigate={handleNavigate} />;
  }

  // ROUTE: RESET PASSWORD (/reset-password)
  if (currentPath === "/reset-password") {
    return <ResetPasswordPage onNavigate={handleNavigate} />;
  }

  // ROUTE: TERMS & CONDITIONS (/terms)
  if (currentPath === "/terms") {
    return <TermsPage onNavigate={handleNavigate} />;
  }

  // ROUTE: PRIVACY POLICY (/privacy-policy)
  if (currentPath === "/privacy-policy") {
    return <PrivacyPolicyPage onNavigate={handleNavigate} />;
  }

  // ROUTE: AUTHENTICATED DASHBOARD & SETTINGS (/dashboard, /settings)
  if (currentPath === "/dashboard" || currentPath === "/settings") {
    if (isAuthLoading) {
      return (
        <div className="min-h-screen bg-black text-[#E1E0CC] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-gray-400">Verifying session clearance...</span>
          </div>
        </div>
      );
    }

    if (!currentUser) {
      return (
        <LoginPage
          onNavigate={handleNavigate}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
          }}
          nextUrl={currentPath}
        />
      );
    }

    return (
      <DashboardPage
        user={currentUser}
        initialTab={currentPath === "/settings" ? "settings" : "cases"}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onRefreshUser={fetchCurrentUser}
      />
    );
  }

  // ROUTE: DEDICATED ASSET DISCOVERY WORKFLOW (/assets/discover)
  if (currentPath === "/assets/discover") {
    if (isAuthLoading) {
      return (
        <div className="min-h-screen bg-black text-[#E1E0CC] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-gray-400">Verifying session clearance...</span>
          </div>
        </div>
      );
    }

    if (!currentUser) {
      return (
        <LoginPage
          onNavigate={handleNavigate}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
          }}
          nextUrl="/assets/discover"
        />
      );
    }

    return (
      <AssetDiscoveryWorkflowPage
        user={currentUser}
        onNavigate={handleNavigate}
      />
    );
  }

  // ROUTE: 404 NOT FOUND (/404 or unmapped path)
  if (currentPath === "/404") {
    return <NotFoundPage onNavigate={handleNavigate} />;
  }

  // DEFAULT ROUTE: HOMEPAGE (Halo-inspired WealthPass Blue/White Landing Page)
  return (
    <HaloLandingPage
      onNavigate={handleNavigate}
      onSearch={(deceasedName: string) => {
        setRelationshipData((prev) => ({ ...prev, deceasedName }));
        handleNavigate("/discover-assets");
      }}
      currentUser={currentUser}
    />
  );
  };

  return (
    <NotificationProvider user={currentUser}>
      <NotificationOverlay onNavigate={handleNavigate} />
      {renderScreen()}
    </NotificationProvider>
  );
}

export default App;
