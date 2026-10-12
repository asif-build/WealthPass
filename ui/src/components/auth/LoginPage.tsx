import React, { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
import { AuthSplitLayout } from "./AuthSplitLayout";
import { apiFetch } from "../../services/apiClient";
import BorderGlow from "../BorderGlow/BorderGlow";

interface LoginPageProps {
  onNavigate: (path: string) => void;
  onLoginSuccess: (user: any) => void;
  nextUrl?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigate,
  onLoginSuccess,
  nextUrl = "/dashboard",
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setRequiresVerification(false);
    setResendStatus(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiFetch("/api/auth/login/", {
        method: "POST",
        body: {
          email: email.trim().toLowerCase(),
          password,
          remember_me: rememberMe,
        },
      });

      if (!response.ok || !response.data?.success) {
        if (response.data?.requires_verification) {
          setRequiresVerification(true);
        }
        setErrorMessage(
          response.error ||
          response.data?.error ||
          "Incorrect email or password. Please try again."
        );
        setIsLoading(false);
        return;
      }

      onLoginSuccess(response.data.user);
      onNavigate(nextUrl);
    } catch {
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendStatus(null);
    try {
      const response = await apiFetch("/api/auth/resend-verification/", {
        method: "POST",
        body: { email: email.trim().toLowerCase() },
      });
      if (response.ok && response.data?.success) {
        setResendStatus("A fresh verification link has been sent to your email.");
      } else {
        setResendStatus(
          response.error ||
          response.data?.error ||
          "Unable to resend verification link."
        );
      }
    } catch {
      setResendStatus("Failed to send verification link.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthSplitLayout onNavigate={onNavigate}>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full relative z-10"
      >
        <BorderGlow
          edgeSensitivity={30}
          glowColor="40 80 80"
          backgroundColor="#120F17"
          borderRadius={24}
          glowRadius={40}
          glowIntensity={1.0}
          coneSpread={25}
          animated={true}
          colors={["#c084fc", "#f472b6", "#38bdf8"]}
          className="w-full"
        >
          <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6 text-left">
          <h1 className="text-2xl font-medium text-white tracking-tight">
            Welcome back
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Sign in to continue to your account.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            {requiresVerification && (
              <div className="mt-2 pt-2 border-t border-red-500/20">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="text-primary hover:underline font-semibold cursor-pointer"
                >
                  {isResending ? "Sending link..." : "Resend verification email &rarr;"}
                </button>
                {resendStatus && (
                  <p className="text-[11px] text-gray-300 mt-1">{resendStatus}</p>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email Address */}
          <div>
            <label className="text-xs text-gray-300 font-medium block mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3.5 py-2.5 text-[#E1E0CC] placeholder-gray-500 text-sm focus:outline-none focus:border-primary/60 transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-gray-300 font-medium">
                Password
              </label>
              <a
                href="/forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("/forgot-password");
                }}
                className="text-xs text-primary hover:underline font-medium"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3.5 py-2.5 pr-10 text-[#E1E0CC] placeholder-gray-500 text-sm focus:outline-none focus:border-primary/60 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center my-0.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-[#1a1a1a] text-primary focus:ring-primary/40 cursor-pointer accent-[#C9A84C]"
              />
              <span className="text-xs text-gray-400 select-none">Remember me</span>
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-1 group flex items-center justify-between p-1 pl-5 pr-1 rounded-full bg-primary text-black font-semibold text-xs sm:text-sm uppercase tracking-wider hover:bg-white disabled:opacity-50 transition-all cursor-pointer shadow-lg"
          >
            <span>{isLoading ? "Signing in..." : "Sign In"}</span>
            <div className="bg-black rounded-full w-8 h-8 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowRight className="w-4 h-4 text-primary" />
            </div>
          </button>
        </form>

        {/* Link to Registration */}
        <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs text-gray-400">
          Don&apos;t have an account?{" "}
          <a
            href="/register"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("/register");
            }}
            className="text-primary hover:underline font-medium ml-1"
          >
            Create one &rarr;
          </a>
        </div>
          </div>
        </BorderGlow>
      </motion.div>
    </AuthSplitLayout>
  );
};
