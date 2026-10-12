import React, { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Check, AlertCircle, Mail, ArrowRight, Lock } from "lucide-react";
import { AuthSplitLayout } from "./AuthSplitLayout";
import { apiFetch } from "../../services/apiClient";
import BorderGlow from "../BorderGlow/BorderGlow";

interface RegisterPageProps {
  onNavigate: (path: string) => void;
}

export function validateAndNormalizeIndianPhone(phone: string): {
  isValid: boolean;
  normalized: string;
  error: string | null;
} {
  const errorMsg = "Enter a valid 10-digit Indian mobile number.";
  if (!phone || typeof phone !== "string") {
    return { isValid: false, normalized: "", error: errorMsg };
  }

  const trimmed = phone.trim();
  if (!trimmed) {
    return { isValid: false, normalized: "", error: errorMsg };
  }

  // Reject if contains characters other than digits, +, -, spaces, (), .
  if (/[^\d+\-\s().]/.test(trimmed)) {
    return { isValid: false, normalized: "", error: errorMsg };
  }

  const cleaned = trimmed.replace(/[\s\-.()]/g, "");

  let nationalNumber = "";
  if (cleaned.startsWith("+91")) {
    nationalNumber = cleaned.slice(3);
  } else if (cleaned.startsWith("+")) {
    return { isValid: false, normalized: "", error: errorMsg };
  } else if (cleaned.startsWith("91") && cleaned.length === 12) {
    nationalNumber = cleaned.slice(2);
  } else if (cleaned.startsWith("0") && cleaned.length === 11) {
    nationalNumber = cleaned.slice(1);
  } else if (cleaned.length === 10) {
    nationalNumber = cleaned;
  } else {
    return { isValid: false, normalized: "", error: errorMsg };
  }

  // Must be exactly 10 digits and start with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(nationalNumber)) {
    return { isValid: false, normalized: "", error: errorMsg };
  }

  return { isValid: true, normalized: `+91${nationalNumber}`, error: null };
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Client-side password strength criteria
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPhoneError(null);

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    const phoneCheck = validateAndNormalizeIndianPhone(phone);
    if (!phoneCheck.isValid) {
      const err = phoneCheck.error || "Enter a valid 10-digit Indian mobile number.";
      setPhoneError(err);
      setErrorMessage(err);
      return;
    }
    if (!hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setErrorMessage("Please ensure your password meets all requirements below.");
      return;
    }
    if (!passwordsMatch) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (!termsAccepted) {
      setErrorMessage("Please accept the Terms & Conditions.");
      return;
    }
    if (!privacyAcknowledged) {
      setErrorMessage("Please accept the Privacy Policy.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiFetch("/api/auth/register/", {
        method: "POST",
        body: {
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phoneCheck.normalized,
          password,
          confirm_password: confirmPassword,
          terms_accepted: termsAccepted,
          privacy_acknowledged: privacyAcknowledged,
        },
      });

      if (!response.ok || !response.data?.success) {
        setErrorMessage(
          response.error ||
          response.data?.error ||
          "Registration could not be completed. Please try again."
        );
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      startResendTimer();
    } catch {
      setErrorMessage("Network error occurred. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const startResendTimer = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendStatus("Resending verification link...");
    try {
      const res = await apiFetch("/api/auth/resend-verification/", {
        method: "POST",
        body: { email: email.trim().toLowerCase() },
      });
      if (res.ok && res.data?.success) {
        setResendStatus("Verification email sent! Check your inbox.");
        startResendTimer();
      } else {
        setResendStatus(res.error || res.data?.error || "Unable to resend right now.");
      }
    } catch {
      setResendStatus("Failed to resend. Please check your connection.");
    }
  };

  if (isSuccess) {
    return (
      <AuthSplitLayout onNavigate={onNavigate}>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
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
            <div className="p-7 sm:p-9 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-5 text-primary">
                <Mail className="w-7 h-7" />
              </div>

              <h2 className="text-2xl font-medium text-white mb-2">
                Verify your email
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                We sent a verification link to <span className="text-white font-medium">{email}</span>. Click the link to activate your account.
              </p>

              <p className="text-xs text-gray-500 mb-6">
                The link is valid for 24 hours. Don&apos;t see it? Check your spam folder.
              </p>

              {resendStatus && (
                <p className="text-xs text-primary mb-4">{resendStatus}</p>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => onNavigate("/login")}
                  className="w-full group flex items-center justify-between p-1.5 pl-6 pr-1.5 rounded-full bg-primary text-black font-semibold text-xs uppercase tracking-wider hover:bg-white transition-all cursor-pointer shadow-lg"
                >
                  <span>Go to Sign In</span>
                  <div className="bg-black rounded-full w-8 h-8 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </div>
                </button>

                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="w-full text-xs text-gray-400 hover:text-white py-2 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  {resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : "Resend verification email"}
                </button>
              </div>
            </div>
          </BorderGlow>
        </motion.div>
      </AuthSplitLayout>
    );
  }

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
            Create account
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Sign up to find and reclaim your family&apos;s assets.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-2.5 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Full Name */}
          <div>
            <label className="text-xs text-gray-300 font-medium block mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Arun Sharma"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3.5 py-2.5 text-[#E1E0CC] placeholder-gray-500 text-sm focus:outline-none focus:border-primary/60 transition-colors"
            />
          </div>

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
            <span className="text-[11px] text-gray-500 mt-1 block">
              We&apos;ll send a verification link to this email.
            </span>
          </div>

          {/* Mobile Number */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-300 font-medium">
                Mobile Number
              </label>
              {phoneError && (
                <span className="text-[11px] text-red-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {phoneError}
                </span>
              )}
            </div>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (phoneError) setPhoneError(null);
              }}
              onBlur={() => {
                if (phone.trim()) {
                  const check = validateAndNormalizeIndianPhone(phone);
                  if (!check.isValid) {
                    setPhoneError(check.error || "Enter a valid 10-digit Indian mobile number.");
                  } else {
                    setPhoneError(null);
                  }
                }
              }}
              placeholder="+91 98765 43210"
              className={`w-full bg-[#1a1a1a] border ${
                phoneError
                  ? "border-red-500/80 focus:border-red-500 ring-1 ring-red-500/30"
                  : "border-white/10 focus:border-primary/60"
              } rounded-xl px-3.5 py-2.5 text-[#E1E0CC] placeholder-gray-500 text-sm focus:outline-none transition-colors`}
            />
            {!phoneError && (
              <span className="text-[11px] text-gray-500 mt-1 block">
                Enter 10-digit Indian mobile number (e.g., 98765 43210 or +91 98765 43210).
              </span>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="text-xs text-gray-300 font-medium block mb-1">
              Password
            </label>
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

            {/* Password checklist */}
            <div className="grid grid-cols-2 gap-1.5 mt-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-[11px]">
              <span className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-400" : "text-gray-500"}`}>
                <Check className={`w-3.5 h-3.5 ${hasMinLength ? "opacity-100" : "opacity-30"}`} />
                8+ characters
              </span>
              <span className={`flex items-center gap-1.5 ${hasUpper ? "text-emerald-400" : "text-gray-500"}`}>
                <Check className={`w-3.5 h-3.5 ${hasUpper ? "opacity-100" : "opacity-30"}`} />
                Uppercase letter
              </span>
              <span className={`flex items-center gap-1.5 ${hasLower ? "text-emerald-400" : "text-gray-500"}`}>
                <Check className={`w-3.5 h-3.5 ${hasLower ? "opacity-100" : "opacity-30"}`} />
                Lowercase letter
              </span>
              <span className={`flex items-center gap-1.5 ${hasNumber && hasSpecial ? "text-emerald-400" : "text-gray-500"}`}>
                <Check className={`w-3.5 h-3.5 ${hasNumber && hasSpecial ? "opacity-100" : "opacity-30"}`} />
                Number &amp; symbol
              </span>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs text-gray-300 font-medium block mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3.5 py-2.5 pr-10 text-[#E1E0CC] placeholder-gray-500 text-sm focus:outline-none focus:border-primary/60 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <span className="text-[11px] text-red-400 mt-1 block">Passwords do not match.</span>
            )}
          </div>

          {/* Checkboxes */}
          <div className="flex flex-col gap-2.5 my-1 pt-2 border-t border-white/5">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-white/20 bg-[#1a1a1a] text-primary focus:ring-primary/40 cursor-pointer accent-[#C9A84C]"
              />
              <span className="text-xs text-gray-300 leading-snug select-none">
                I agree to the{" "}
                <a
                  href="/terms"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate("/terms");
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Terms &amp; Conditions
                </a>
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={privacyAcknowledged}
                onChange={(e) => setPrivacyAcknowledged(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-white/20 bg-[#1a1a1a] text-primary focus:ring-primary/40 cursor-pointer accent-[#C9A84C]"
              />
              <span className="text-xs text-gray-300 leading-snug select-none">
                I have read and agree to the{" "}
                <a
                  href="/privacy-policy"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate("/privacy-policy");
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Privacy Policy
                </a>
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 group flex items-center justify-between p-1 pl-5 pr-1 rounded-full bg-primary text-black font-semibold text-xs sm:text-sm uppercase tracking-wider hover:bg-white disabled:opacity-50 transition-all cursor-pointer shadow-lg"
          >
            <span>{isLoading ? "Creating..." : "Create Account"}</span>
            <div className="bg-black rounded-full w-8 h-8 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Lock className="w-4 h-4 text-primary" />
            </div>
          </button>
        </form>

        {/* Existing account */}
        <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs text-gray-400">
          Already have an account?{" "}
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("/login");
            }}
            className="text-primary hover:underline font-medium ml-1"
          >
            Sign in &rarr;
          </a>
        </div>
          </div>
        </BorderGlow>
      </motion.div>
    </AuthSplitLayout>
  );
};
