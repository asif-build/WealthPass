import React from "react";
import { Search, FileEdit, CheckCircle2, ArrowRight } from "lucide-react";

interface HowItWorksSectionProps {
  onNavigate: (route: string) => void;
}

const STEPS = [
  {
    num: "01",
    icon: Search,
    title: "Search Across Institutions",
    description:
      "Enter your loved one’s name. We search official registries across 100+ banks (UDGAM), LIC & private insurers, mutual funds, and EPF.",
  },
  {
    num: "02",
    icon: FileEdit,
    title: "Fill Official Claim Forms Online",
    description:
      "No running around to bank branches. Fill the official RBI standard claim Annexures (with or without nomination) directly on screen.",
  },
  {
    num: "03",
    icon: CheckCircle2,
    title: "Download Ready-to-Submit Packet",
    description:
      "Generate clean, print-ready claim documents with exact branch checklist, required KYC attachments, and submission guidelines.",
  },
];

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onNavigate }) => {
  return (
    <section
      id="how-it-works"
      className="bg-white px-6 py-20 md:py-24 border-b border-[#DFE7F1]"
      aria-label="How WealthPass Works"
    >
      <div className="max-w-[88rem] mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#174EA6] mb-3 inline-block">
            Simple 3-Step Process
          </span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-medium text-[#10233F] leading-tight mb-4"
            style={{ letterSpacing: "-0.04em" }}
          >
            How WealthPass Works
          </h2>
          <p className="text-[#65758B] text-base md:text-lg leading-relaxed">
            We turn a confusing, multi-month bureaucratic maze into three simple, guided steps you can complete from home.
          </p>
        </div>

        {/* 3 Clean Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-14">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="bg-[#F5F8FC] rounded-2xl border border-[#DFE7F1] p-8 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-[#367BF5]/40 hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#DFE7F1] flex items-center justify-center text-[#174EA6] shadow-sm">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-semibold text-[#DFE7F1] select-none">
                      {step.num}
                    </span>
                  </div>

                  <h3 className="text-xl font-medium text-[#0B1F3A] mb-3 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-[#65758B] text-sm md:text-base leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Action Banner */}
        <div className="bg-[#E5EFFD] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#DFE7F1]">
          <div className="text-center sm:text-left">
            <h4 className="text-base sm:text-lg font-medium text-[#0B1F3A]">
              Ready to find potential assets?
            </h4>
            <p className="text-xs sm:text-sm text-[#65758B]">
              It takes less than 2 minutes to run an initial search across supported institutions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("/discover-assets")}
            className="bg-[#174EA6] hover:bg-[#103D85] text-white text-sm sm:text-base font-medium px-6 py-3 rounded-full transition-colors inline-flex items-center gap-2 shrink-0 cursor-pointer shadow-sm"
          >
            <span>Start Free Discovery</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </section>
  );
};
