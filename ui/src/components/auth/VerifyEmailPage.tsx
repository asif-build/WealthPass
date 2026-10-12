import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, ArrowRight, Mail, RefreshCw } from "lucide-react";
import { apiFetch } from "../../services/apiClient";

interface VerifyEmailPageProps {
  onNavigate: (path: string) => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ onNavigate }) => {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "input">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [resendEmail, setResendEmail] = useState<string>("");
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");

    if (urlToken) {
      verifyToken(urlToken);
    } else {
      setStatus("input");
    }
  }, []);

  const verifyToken = async (tok: string) => {
    setStatus("loading");
    try {
      const response = await apiFetch(`/api/auth/verify-email/?token=${encodeURIComponent(tok)}`);

      if (response.ok && response.data?.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(
          response.error ||
          response.data?.error ||
          "Verification link is invalid or has expired."
        );
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error connecting to verification service.");
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setIsResending(true);
    setResendStatus(null);

    try {
      const response = await apiFetch("/api/auth/resend-verification/", {
        method: "POST",
        body: { email: resendEmail.trim().toLowerCase() },
      });

      if (response.ok && response.data?.success) {
        setResendStatus("A new verification link has been sent to your email.");
      } else {
        setResendStatus(
          response.error ||
          response.data?.error ||
          "Unable to resend verification link."
        );
      }
    } catch {
      setResendStatus("Network error occurred.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#E1E0CC] flex flex-col justify-center items-center px-4 py-16 selection:bg-primary selection:text-black">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#1d1a13]/30 via-transparent to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative z-10"
      >

        {status === "loading" && (
          <div className="py-8 flex flex-col items-center">
            <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
            <h2 className="text-xl font-medium text-white mb-2">Verifying your email...</h2>
            <p className="text-gray-400 text-xs">
              Please wait a moment while we verify your link.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="py-4 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mb-6 text-primary">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-medium text-white mb-2">
              Email verified!
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-8">
              Your email address has been verified. You can now sign in to your account.
            </p>
            <button
              onClick={() => onNavigate("/login")}
              className="group w-full flex items-center justify-between p-1.5 pl-6 pr-1.5 rounded-full bg-primary text-black font-semibold text-xs sm:text-sm uppercase tracking-wider hover:bg-white transition-all cursor-pointer shadow-lg"
            >
              <span>Sign In to Your Account</span>
              <div className="bg-black rounded-full w-9 h-9 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ArrowRight className="w-4 h-4 text-primary" />
              </div>
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="py-4 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-500/40 flex items-center justify-center mb-6 text-red-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <span className="text-red-400 text-[10px] tracking-[0.2em] uppercase font-semibold block mb-1">
              Verification Issue
            </span>
            <h2 className="text-xl font-medium text-white mb-3">
              Link Expired or Invalid
            </h2>
            <p className="text-gray-300 text-xs leading-relaxed mb-6">
              {errorMessage}
            </p>

            <form onSubmit={handleResend} className="w-full flex flex-col gap-3 pt-4 border-t border-white/10">
              <span className="text-xs text-gray-400 text-left">
                Enter your email address to receive a fresh verification link:
              </span>
              <input
                type="email"
                required
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-[#E1E0CC] placeholder-gray-500 focus:outline-none focus:border-primary/60 transition-colors"
              />
              <button
                type="submit"
                disabled={isResending}
                className="w-full py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition-colors cursor-pointer"
              >
                {isResending ? "Sending..." : "Request New Verification Link"}
              </button>
              {resendStatus && (
                <p className="text-xs text-primary mt-1">{resendStatus}</p>
              )}
            </form>

            <div className="mt-6">
              <a
                href="/login"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("/login");
                }}
                className="text-xs text-primary hover:underline"
              >
                Return to Sign In
              </a>
            </div>
          </div>
        )}

        {status === "input" && (
          <div className="py-4 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-primary">
              <Mail className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-medium text-white mb-3">
              Email Verification
            </h2>
            <p className="text-gray-400 text-xs leading-relaxed mb-6">
              If you received a verification link by email, please click the link directly from your email inbox.
            </p>
            <form onSubmit={handleResend} className="w-full flex flex-col gap-3">
              <input
                type="email"
                required
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="Enter your registered email address"
                className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-[#E1E0CC] placeholder-gray-500 focus:outline-none focus:border-primary/60 transition-colors"
              />
              <button
                type="submit"
                disabled={isResending}
                className="w-full py-2.5 px-4 rounded-full bg-primary text-black font-semibold text-xs uppercase tracking-wider hover:bg-white transition-all cursor-pointer"
              >
                {isResending ? "Sending..." : "Resend Verification Email"}
              </button>
              {resendStatus && (
                <p className="text-xs text-primary mt-1">{resendStatus}</p>
              )}
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};
