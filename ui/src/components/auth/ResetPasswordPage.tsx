import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Check, AlertCircle, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { apiFetch } from "../../services/apiClient";

interface ResetPasswordPageProps {
  onNavigate: (path: string) => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onNavigate }) => {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setToken(urlToken);
    }
  }, []);

  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token.trim()) {
      setErrorMessage("Reset token is missing. Please use the link sent to your email.");
      return;
    }
    if (!hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setErrorMessage("Password does not meet complexity requirements.");
      return;
    }
    if (!passwordsMatch) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiFetch("/api/auth/reset-password/", {
        method: "POST",
        body: {
          token: token.trim(),
          password,
          confirm_password: confirmPassword,
        },
      });

      if (response.ok && response.data?.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(
          response.error ||
          response.data?.error ||
          "Password reset failed. The link may have expired."
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
            Create new password
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-xs">
            Enter your new password below.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-6 text-primary">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-medium text-white mb-2">Password updated!</h2>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-8">
              Your password has been reset. You can now sign in to your account.
            </p>
            <button
              onClick={() => onNavigate("/login")}
              className="group w-full flex items-center justify-between p-1.5 pl-6 pr-1.5 rounded-full bg-primary text-black font-semibold text-xs sm:text-sm uppercase tracking-wider hover:bg-white transition-all cursor-pointer shadow-lg"
            >
              <span>Sign In with New Password</span>
              <div className="bg-black rounded-full w-9 h-9 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ArrowRight className="w-4 h-4 text-primary" />
              </div>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!token && (
              <div>
                <label className="text-[11px] uppercase tracking-wider text-gray-300 font-medium block mb-1.5">
                  Reset Token
                </label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your reset token here"
                  className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-3 text-[#E1E0CC] placeholder-gray-500 text-sm focus:outline-none focus:border-primary/60 transition-colors"
                />
              </div>
            )}

            {/* New Password */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-300 font-medium block mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-3 pr-11 text-[#E1E0CC] placeholder-gray-500 text-sm focus:outline-none focus:border-primary/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password checklist */}
              <div className="grid grid-cols-2 gap-1.5 mt-2.5 p-3 rounded-lg bg-white/[0.02] border border-white/5 text-[11px]">
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
                  Number & symbol
                </span>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-300 font-medium block mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-3 pr-11 text-[#E1E0CC] placeholder-gray-500 text-sm focus:outline-none focus:border-primary/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <span className="text-[10px] text-red-400 mt-1 block">Passwords do not match.</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 group flex items-center justify-between p-1.5 pl-6 pr-1.5 rounded-full bg-primary text-black font-semibold text-xs sm:text-sm uppercase tracking-wider hover:bg-white disabled:opacity-50 transition-all cursor-pointer shadow-lg"
            >
              <span>{isLoading ? "Updating Password..." : "Update Password"}</span>
              <div className="bg-black rounded-full w-9 h-9 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Lock className="w-4 h-4 text-primary" />
              </div>
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
