import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiFetch } from "../../services/apiClient";

interface ForgotPasswordPageProps {
  onNavigate: (path: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiFetch("/api/auth/forgot-password/", {
        method: "POST",
        body: { email: email.trim().toLowerCase() },
      });

      if (response.ok && response.data?.success) {
        setIsSubmitted(true);
      } else {
        setErrorMessage(
          response.error ||
          response.data?.error ||
          "Unable to process request."
        );
      }
    } catch {
      setErrorMessage("Network error connecting to WealthPass security services.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#E1E0CC] flex flex-col justify-center items-center px-4 py-16 selection:bg-primary selection:text-black">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#1d1a13]/30 via-transparent to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <h1 className="text-2xl font-medium text-white tracking-tight">
            Reset your password
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-xs">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSubmitted ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-6 text-primary">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-medium text-white mb-2">Check your email</h2>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-6">
              We sent a password reset link to <span className="text-[#E1E0CC] font-semibold">{email}</span>.
            </p>
            <p className="text-xs text-gray-500 mb-8">
              The link is valid for 1 hour. Be sure to check your spam folder if it doesn&apos;t appear.
            </p>
            <button
              onClick={() => onNavigate("/login")}
              className="group w-full flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-primary text-black font-semibold text-xs uppercase tracking-wider hover:bg-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-300 font-medium block mb-1.5">
                Registered Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-3 text-[#E1E0CC] placeholder-gray-500 text-sm focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 group flex items-center justify-between p-1.5 pl-6 pr-1.5 rounded-full bg-primary text-black font-semibold text-xs sm:text-sm uppercase tracking-wider hover:bg-white disabled:opacity-50 transition-all cursor-pointer shadow-lg"
            >
              <span>{isLoading ? "Sending Instructions..." : "Send Reset Link"}</span>
              <div className="bg-black rounded-full w-9 h-9 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ArrowRight className="w-4 h-4 text-primary" />
              </div>
            </button>

            <div className="mt-6 text-center">
              <a
                href="/login"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("/login");
                }}
                className="text-xs text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </a>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
