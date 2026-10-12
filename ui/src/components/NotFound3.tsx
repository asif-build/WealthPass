import React from "react";
import { motion } from "framer-motion";
import { Home, Search } from "lucide-react";

interface NotFoundProps {
  onNavigate?: (path: string) => void;
  attemptedPath?: string;
  title?: string;
  description?: string;
  backHomeText?: string;
  className?: string;
}

/**
 * 404-3 Block from React Bits Pro
 * Centered 404 page with large blurred numerals and a compact CTA.
 * Adapted to WealthPass luxury dark fintech design tokens.
 */
export const NotFound3: React.FC<NotFoundProps> = ({
  onNavigate,
  attemptedPath = typeof window !== "undefined" ? window.location.pathname : "/404",
  title = "Page not found",
  description = "Sorry, we couldn't find the page you're looking for or it has been relocated.",
  backHomeText = "Back to home",
  className = ""
}) => {
  const handleHomeClick = () => {
    if (onNavigate) {
      onNavigate("/");
    } else if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <div
      className={`relative min-h-screen w-full flex flex-col items-center justify-center bg-black text-[#E1E0CC] overflow-hidden px-4 selection:bg-primary selection:text-black font-['Almarai'] ${className}`}
    >
      {/* Background Subtle Gradient & Radial Glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.04] via-black to-black" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/[0.03] rounded-full blur-[140px] pointer-events-none" />

      {/* Layer 1: Massive Blurred 404 Numerals (React Bits Pro 404-3 Signature Effect) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, filter: "blur(40px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(28px)" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-[14rem] sm:text-[22rem] md:text-[28rem] lg:text-[34rem] font-black tracking-tighter text-white/[0.07] leading-none select-none font-sans"
        >
          404
        </motion.div>
      </div>

      {/* Subtle Foreground Floating Glowing Outline Numerals */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 0.15, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-[12rem] sm:text-[18rem] md:text-[24rem] lg:text-[28rem] font-black tracking-tighter text-transparent leading-none select-none font-sans"
          style={{
            WebkitTextStroke: "1px rgba(222, 219, 200, 0.4)"
          }}
        >
          404
        </motion.div>
      </div>

      {/* Layer 2: Centered Foreground Content & Compact CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-lg w-full text-center flex flex-col items-center space-y-6"
      >
        {/* Subtle Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md text-xs text-white/70">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="font-mono tracking-wider text-[11px] uppercase">Error 404</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[#E1E0CC]">
          {title}
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-gray-400 max-w-md mx-auto leading-relaxed">
          {description}
        </p>

        {attemptedPath && attemptedPath !== "/404" && (
          <p className="text-xs font-mono text-gray-500 bg-white/[0.02] border border-white/5 px-3 py-1 rounded-md">
            Unresolved path: <span className="text-[#E1E0CC]">{attemptedPath}</span>
          </p>
        )}

        {/* Compact Call to Action (CTA) */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleHomeClick}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-primary text-black hover:bg-white text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/40 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            <span>{backHomeText}</span>
          </button>

          {onNavigate && (
            <button
              onClick={() => onNavigate("/discover-assets")}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-[#E1E0CC] hover:text-white text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-primary" />
              <span>Search assets</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Technical Footer Trace */}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none z-10">
        <span className="text-[11px] font-mono text-gray-600">
          WealthPass Protocol • All assets protected
        </span>
      </div>
    </div>
  );
};

export default NotFound3;
