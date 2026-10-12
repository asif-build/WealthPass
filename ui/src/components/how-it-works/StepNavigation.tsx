import React from "react";
import { ArrowLeft, ArrowRight, Home } from "lucide-react";

interface StepNavigationProps {
  prevStep?: {
    name: string;
    path: string;
  };
  nextStep?: {
    name: string;
    path: string;
  };
  onNavigate: (path: string) => void;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  prevStep,
  nextStep,
  onNavigate,
}) => {
  return (
    <nav className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-[#090909] border-t border-white/5" aria-label="Step navigation">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Previous Button */}
        {prevStep ? (
          <button
            onClick={() => onNavigate(prevStep.path)}
            className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-full bg-[#181818] border border-white/10 text-xs sm:text-sm font-medium text-[#E1E0CC] hover:bg-white hover:text-black hover:border-white transition-all duration-300 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-primary group-hover:text-black transition-transform group-hover:-translate-x-1" />
            <span>← {prevStep.name}</span>
          </button>
        ) : (
          <button
            onClick={() => onNavigate("/")}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#181818] border border-white/10 text-xs sm:text-sm font-medium text-[#E1E0CC] hover:bg-white hover:text-black hover:border-white transition-all duration-300 group cursor-pointer"
          >
            <Home className="w-4 h-4 text-primary group-hover:text-black" />
            <span>← Back to WealthPass</span>
          </button>
        )}

        {/* Center: Back to Home link */}
        <button
          onClick={() => onNavigate("/")}
          className="text-xs uppercase tracking-widest text-gray-400 hover:text-primary transition-colors cursor-pointer"
        >
          Overview & Home
        </button>

        {/* Next Button */}
        {nextStep ? (
          <button
            onClick={() => onNavigate(nextStep.path)}
            className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-full bg-primary text-black text-xs sm:text-sm font-medium hover:bg-white transition-all duration-300 group cursor-pointer shadow-lg shadow-primary/10"
          >
            <span>{nextStep.name} →</span>
            <ArrowRight className="w-4 h-4 text-black transition-transform group-hover:translate-x-1" />
          </button>
        ) : (
          <button
            onClick={() => onNavigate("/")}
            className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-full bg-primary text-black text-xs sm:text-sm font-medium hover:bg-white transition-all duration-300 group cursor-pointer shadow-lg shadow-primary/10"
          >
            <span>Back to WealthPass →</span>
            <ArrowRight className="w-4 h-4 text-black transition-transform group-hover:translate-x-1" />
          </button>
        )}
      </div>
    </nav>
  );
};
