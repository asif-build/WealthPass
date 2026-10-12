import React, { useState } from "react";
import { Search, ArrowRight, ShieldCheck, Landmark, FileCheck, Lock } from "lucide-react";

interface HaloHeroProps {
  onNavigate: (route: string) => void;
  onSearch?: (query: string) => void;
}

export const HaloHero: React.FC<HaloHeroProps> = ({ onNavigate, onSearch }) => {
  const [videoError, setVideoError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (onSearch && query) {
      onSearch(query);
    } else {
      onNavigate("/discover-assets");
    }
  };

  const handleQuickSuggestion = (name: string) => {
    setSearchQuery(name);
    if (onSearch) {
      onSearch(name);
    } else {
      onNavigate("/discover-assets");
    }
  };

  return (
    <section
      className="relative flex flex-col overflow-hidden bg-[#F5F8FC] pt-24 md:pt-28 pb-8 px-4 sm:px-6"
      aria-label="Hero Section"
    >
      <div className="max-w-[88rem] mx-auto w-full">
        {/* Inner Hero Card */}
        <div className="relative w-full rounded-3xl overflow-hidden min-h-[580px] lg:min-h-[640px] bg-[#0B1F3A] shadow-2xl border border-[#DFE7F1]/20 flex flex-col justify-center">
          {/* Background Video */}
          {!videoError ? (
            <video
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4"
              autoPlay
              loop
              muted
              playsInline
              onError={() => setVideoError(true)}
              className="absolute inset-0 w-full h-full object-cover z-0 opacity-70"
            />
          ) : (
            <div
              className="absolute inset-0 w-full h-full bg-gradient-to-tr from-[#0B1F3A] via-[#10233F] to-[#174EA6] opacity-90 z-0"
              aria-hidden="true"
            />
          )}

          {/* Vignette Overlay for High Legibility */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A]/95 via-[#0B1F3A]/80 to-[#0B1F3A]/40 z-10 pointer-events-none"
            aria-hidden="true"
          />

          {/* Clean Content Overlay */}
          <div className="relative z-20 flex flex-col items-start justify-center p-6 sm:p-10 md:p-14 lg:p-16 max-w-4xl">
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs sm:text-sm font-medium mb-6 backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Official Indian Financial Asset Discovery & Online Claim Prep</span>
            </div>

            {/* Headline */}
            <h1
              className="text-white text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.08] mb-5 tracking-tight"
              style={{ letterSpacing: "-0.04em" }}
            >
              Find & Claim Unclaimed Assets
              <br />
              Left by Your Loved Ones
            </h1>

            {/* Supporting Paragraph */}
            <p className="text-white/85 text-base sm:text-lg md:text-xl max-w-2xl mb-8 leading-relaxed font-normal">
              Search across 100+ Indian banks, LIC policies, mutual funds, EPF, and shares. Fill official claim forms online with step-by-step guidance.
            </p>

            {/* Clean, Prominent Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="w-full max-w-2xl bg-white p-2 sm:p-2.5 rounded-2xl sm:rounded-full shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-5 border border-[#DFE7F1]"
            >
              <div className="flex items-center gap-3 pl-3 sm:pl-4 flex-1">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter deceased relative's name (e.g. Arun Mehta)"
                  className="w-full bg-transparent border-none text-[#10233F] text-sm sm:text-base placeholder:text-slate-400 focus:outline-none focus:ring-0 py-2"
                  aria-label="Deceased relative full name"
                />
              </div>

              <button
                type="submit"
                className="bg-[#174EA6] hover:bg-[#103D85] text-white text-sm sm:text-base font-medium px-6 sm:px-8 py-3 rounded-xl sm:rounded-full transition-all duration-200 inline-flex items-center justify-center gap-2 group cursor-pointer shadow-md"
              >
                <span>Search Assets</span>
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            {/* Quick Suggestions & Clean Hints */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/70 mb-10">
              <span className="font-medium text-white/80">Quick search:</span>
              <button
                type="button"
                onClick={() => handleQuickSuggestion("Arun Mehta")}
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-white/90"
              >
                Arun Mehta (Sample Case)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSuggestion("Ramesh Sharma")}
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-white/90"
              >
                Ramesh Sharma
              </button>
              <span className="hidden sm:inline text-white/40">·</span>
              <span className="text-white/60">Free search across RBI, IRDAI, SEBI, EPFO</span>
            </div>

            {/* Clean Static Trust Badges (Replaces the noisy moving marquee) */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6 border-t border-white/15">
              <div className="flex items-center gap-2.5 text-white/85">
                <Landmark className="w-4 h-4 text-[#367BF5] shrink-0" />
                <span className="text-xs sm:text-sm font-medium">100+ Indian Banks</span>
              </div>
              <div className="flex items-center gap-2.5 text-white/85">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium">LIC & Insurers</span>
              </div>
              <div className="flex items-center gap-2.5 text-white/85">
                <FileCheck className="w-4 h-4 text-[#367BF5] shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Online Form Filling</span>
              </div>
              <div className="flex items-center gap-2.5 text-white/85">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Zero Data Selling</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
