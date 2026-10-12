import React from "react";
import { ArrowRight } from "lucide-react";

interface FinalCTASectionProps {
  onNavigate: (route: string) => void;
}

export const FinalCTASection: React.FC<FinalCTASectionProps> = ({ onNavigate }) => {
  return (
    <section
      className="bg-[#F5F8FC] px-6 py-16 md:py-24"
      aria-label="Call to Action"
    >
      <div className="max-w-[88rem] mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#174EA6] via-[#103D85] to-[#0B1F3A] p-10 sm:p-12 md:p-16 lg:p-20 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
          {/* Ambient glow effects */}
          <div
            className="absolute -top-32 -right-32 w-80 h-80 bg-[#367BF5]/25 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          {/* Left Text Block */}
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-white/15 text-white border border-white/20 mb-6">
              Begin Today
            </span>
            <h2
              className="text-4xl sm:text-5xl md:text-6xl font-medium leading-[1.1] mb-5 tracking-tight text-white"
              style={{ letterSpacing: "-0.04em" }}
            >
              Take the next step
              <br />
              toward financial clarity.
            </h2>
            <p className="text-white/80 text-base sm:text-lg md:text-xl leading-relaxed max-w-xl">
              Start organizing your discovery journey and understand the steps that may help your family pursue eligible claims.
            </p>
          </div>

          {/* Right Action Button */}
          <div className="relative z-10 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate("/discover-assets")}
              className="inline-flex items-center gap-4 bg-white text-[#0B1F3A] hover:bg-[#E5EFFD] pl-8 pr-2.5 py-2.5 rounded-full text-base sm:text-lg font-medium transition-all duration-200 group shadow-lg cursor-pointer hover:scale-105"
            >
              <span>Find Assets</span>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#E5EFFD] flex items-center justify-center shrink-0 group-hover:bg-[#367BF5] transition-colors">
                <ArrowRight className="w-5 h-5 text-[#174EA6] group-hover:text-white transition-colors" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
