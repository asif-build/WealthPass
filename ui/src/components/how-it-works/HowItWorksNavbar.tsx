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
    <header className="sticky top-0 z-50 w-full bg-[#083B8A]/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Back Link */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate("/")}
            className="flex items-center gap-2.5 group text-left transition-colors cursor-pointer"
            aria-label="Return to homepage"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-[#102A56] transition-all shrink-0">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            </div>
            <span className="text-xs uppercase tracking-wider text-[#EAF2FF] group-hover:text-white transition-colors">
              Back to Home
            </span>
          </button>
        </div>

        {/* Step Indicator Pills (Desktop) */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#0646AD] p-1.5 rounded-full border border-white/10 shadow-inner" aria-label="Process steps">
          {steps.map((step) => {
            const isActive = currentPath === step.path;
            return (
              <button
                key={step.path}
                onClick={() => onNavigate(step.path)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-[#083B8A] text-white shadow-md border border-white/20"
                    : "text-[#EAF2FF] hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="font-serif italic text-primary/90 font-bold">{step.num}</span>
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
            className="hidden sm:inline-flex items-center text-xs text-[#EAF2FF] hover:text-white px-3 py-1.5 rounded-full border border-white/15 hover:border-white/30 transition-all cursor-pointer"
          >
            Sources
          </button>
          <button
            type="button"
            onClick={() => onNavigate("/verify")}
            className="group inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-primary text-[#102A56] text-xs sm:text-sm font-medium hover:bg-white transition-all duration-300 cursor-pointer shadow-md"
          >
            <Shield className="w-3.5 h-3.5 text-[#102A56]" />
            <span>Verify Identity</span>
            <div className="bg-[#083B8A] rounded-full w-7 h-7 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowRight className="w-3.5 h-3.5 text-primary" />
            </div>
          </button>
        </div>
      </div>

      {/* Step Indicator Bar (Mobile) */}
      <div className="md:hidden flex border-t border-white/10 bg-[#0646AD] px-3 py-2 overflow-x-auto gap-2 scrollbar-none">
        {steps.map((step) => {
          const isActive = currentPath === step.path;
          return (
            <button
              key={step.path}
              onClick={() => onNavigate(step.path)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                isActive
                  ? "bg-[#083B8A] text-white border border-white/20"
                  : "text-[#EAF2FF] hover:text-white"
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
