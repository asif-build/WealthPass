import React from "react";
import { ArrowRight, Search, FileCheck, HelpCircle, CheckSquare } from "lucide-react";

export const MeetWealthPass: React.FC = () => {
  const handleScrollToHowItWorks = () => {
    const el = document.getElementById("how-it-works");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="meet-wealthpass"
      className="bg-[#F5F8FC] px-6 py-24 select-none"
      aria-label="Meet WealthPass"
    >
      <div className="max-w-[88rem] mx-auto">
        {/* ROW 1: Two-column editorial header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 mb-16 items-start">
          {/* Left Column */}
          <div>
            <h2
              className="text-4xl md:text-6xl font-medium leading-tight mb-8 text-[#10233F]"
              style={{ letterSpacing: "-0.04em" }}
            >
              Meet WealthPass.
            </h2>
            <button
              type="button"
              onClick={handleScrollToHowItWorks}
              className="inline-flex items-center gap-3 bg-[#174EA6] text-white pl-6 pr-2 py-2 rounded-full hover:bg-[#103D85] transition-all duration-200 group text-sm md:text-base font-medium shadow-sm cursor-pointer"
            >
              <span>Discover How It Works</span>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ArrowRight className="w-4 h-4 text-[#174EA6]" />
              </div>
            </button>
          </div>

          {/* Right Column */}
          <div>
            <p className="text-[#65758B] text-2xl md:text-3xl leading-relaxed font-normal">
              WealthPass helps families navigate the complex journey of finding and claiming financial assets left behind by loved ones.
            </p>
          </div>
        </div>

        {/* ROW 2: 4-Column Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* CARD 1: Spans two columns on large screens */}
          <div className="lg:col-span-2 rounded-2xl min-h-[320px] p-8 flex flex-col justify-between bg-gradient-to-br from-[#E5EFFD] via-white to-[#DFE7F1] border border-[#DFE7F1] transition-all duration-300 hover:-translate-y-1 hover:border-[#367BF5]/40 shadow-sm relative overflow-hidden group">
            {/* Subtle decorative background watermarks */}
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 group-hover:opacity-15 transition-opacity">
              <Search className="w-48 h-48 text-[#174EA6]" />
            </div>

            <div className="relative z-10">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#174EA6] bg-white border border-[#DFE7F1] mb-6">
                Discovery Engine
              </span>
              <h3 className="text-2xl sm:text-3xl font-medium text-[#10233F] leading-snug mb-3">
                Find What Belongs to You
              </h3>
            </div>

            <div className="relative z-10">
              <p className="text-[#65758B] text-sm sm:text-base max-w-sm leading-relaxed">
                Bring relevant information together and identify potential unclaimed assets through supported discovery workflows.
              </p>
            </div>
          </div>

          {/* CARD 2: Deep Primary Blue */}
          <div className="rounded-2xl min-h-[320px] p-7 flex flex-col justify-between bg-[#174EA6] text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg shadow-sm">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-6 border border-white/20">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-medium leading-snug text-white whitespace-pre-line mb-3">
                Clear Steps.{"\n"}Less Confusion.
              </h3>
            </div>
            <div>
              <p className="text-white/75 text-sm leading-relaxed">
                Understand the documents, requirements, and next steps associated with your claim.
              </p>
            </div>
          </div>

          {/* CARD 3: Pale Blue */}
          <div className="rounded-2xl min-h-[320px] p-7 flex flex-col justify-between bg-[#E5EFFD] border border-[#DFE7F1] transition-all duration-300 hover:-translate-y-1 hover:border-[#367BF5]/40 shadow-sm">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-6 border border-[#DFE7F1]">
                <HelpCircle className="w-5 h-5 text-[#174EA6]" />
              </div>
              <h3 className="text-2xl font-medium text-[#0B1F3A] leading-snug whitespace-pre-line mb-3">
                Guidance{"\n"}That Helps
              </h3>
            </div>
            <div>
              <p className="text-[#65758B] text-sm leading-relaxed">
                Get simple explanations of claim fields and document requirements with WealthPass Claim Copilot.
              </p>
            </div>
          </div>

          {/* CARD 4: Clean White */}
          <div className="rounded-2xl min-h-[320px] p-7 flex flex-col justify-between bg-[#FFFFFF] border border-[#DFE7F1] transition-all duration-300 hover:-translate-y-1 hover:border-[#367BF5]/40 shadow-sm">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#F5F8FC] flex items-center justify-center mb-6 border border-[#DFE7F1]">
                <CheckSquare className="w-5 h-5 text-[#174EA6]" />
              </div>
              <h3 className="text-2xl font-medium text-[#0B1F3A] leading-snug whitespace-pre-line mb-3">
                Track Your{"\n"}Progress
              </h3>
            </div>
            <div>
              <p className="text-[#65758B] text-sm leading-relaxed">
                Keep prepared claims, outstanding tasks, and recorded status updates organized in one place.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
