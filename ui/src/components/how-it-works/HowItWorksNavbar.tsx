import React from "react";
import { ArrowLeft, ArrowRight, Shield } from "lucide-react";

interface HowItWorksNavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const HowItWorksNavbar: React.FC<HowItWorksNavbarProps> = ({
  currentPath,
  onNavigate,
}) => {
  const steps = [
    { num: "01", name: "Verify & Match", path: "/how-it-works/verify-match" },
    { num: "02", name: "Claim Preparation", path: "/how-it-works/claim-preparation" },
    { num: "03", name: "Instant Liquidity", path: "/how-it-works/instant-liquidity" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-black/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Back Link */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate("/")}
            className="flex items-center gap-2.5 group text-left transition-colors cursor-pointer"
            aria-label="Return to homepage"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all shrink-0">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            </div>
            <span className="text-xs uppercase tracking-wider text-gray-400 group-hover:text-primary transition-colors">
              Back to Home
            </span>
          </button>
        </div>

        {/* Step Indicator Pills (Desktop) */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#121212] p-1.5 rounded-full border border-white/5 shadow-inner" aria-label="Process steps">
          {steps.map((step) => {
            const isActive = currentPath === step.path;
            return (
              <button
                key={step.path}
                onClick={() => onNavigate(step.path)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-[#242424] text-[#E1E0CC] shadow-md border border-white/10"
                    : "text-gray-400 hover:text-[#E1E0CC] hover:bg-white/[0.03]"
                }`}
              >
                <span className="font-serif italic text-primary/80 font-bold">{step.num}</span>
                <span>{step.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate("/sources")}
            className="hidden sm:inline-flex items-center text-xs text-white/60 hover:text-white px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 transition-all cursor-pointer"
          >
            Sources
          </button>
          <button
            type="button"
            onClick={() => onNavigate("/verify")}
            className="group inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-primary text-black text-xs sm:text-sm font-medium hover:bg-white transition-all duration-300 cursor-pointer shadow-md"
          >
            <Shield className="w-3.5 h-3.5 text-black" />
            <span>Verify Identity</span>
            <div className="bg-black rounded-full w-7 h-7 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowRight className="w-3.5 h-3.5 text-primary" />
            </div>
          </button>
        </div>
      </div>

      {/* Step Indicator Bar (Mobile) */}
      <div className="md:hidden flex border-t border-white/5 bg-[#0e0e0e] px-3 py-2 overflow-x-auto gap-2 scrollbar-none">
        {steps.map((step) => {
          const isActive = currentPath === step.path;
          return (
            <button
              key={step.path}
              onClick={() => onNavigate(step.path)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                isActive
                  ? "bg-[#252525] text-[#E1E0CC] border border-white/10"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <span className="font-serif italic text-primary font-bold">{step.num}</span>
              <span>{step.name}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
