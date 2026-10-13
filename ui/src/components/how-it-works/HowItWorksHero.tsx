import React from "react";
import { motion } from "framer-motion";

interface HowItWorksHeroProps {
  stepNumber: string;
  stepLabel: string;
  title: string;
  quote: string;
  supportingText: string;
}

export const HowItWorksHero: React.FC<HowItWorksHeroProps> = ({
  stepNumber,
  stepLabel,
  title,
  quote,
  supportingText,
}) => {
  return (
    <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-4 sm:px-6 lg:px-8 border-b border-white/5 overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          {/* Left Column: Number, Tag, Title */}
          <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-6">
              <span className="font-serif italic font-light text-5xl sm:text-6xl md:text-7xl text-primary/40 leading-none select-none">
                {stepNumber}
              </span>
              <div className="h-8 w-[1px] bg-white/10" />
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-primary font-medium block">
                {stepLabel}
              </span>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight text-white leading-[1.05] mb-6"
            >
              {title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl sm:text-2xl md:text-3xl font-serif italic text-primary/90 leading-snug mb-6"
            >
              "{quote}"
            </motion.p>
          </div>

          {/* Right Column: Supporting Description */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:max-w-md lg:pb-3"
          >
            <div className="bg-[#0646AD] p-6 rounded-2xl border border-white/10 shadow-xl">
              <span className="text-[10px] uppercase tracking-widest text-primary/80 font-semibold block mb-2">
                Overview & Context
              </span>
              <p className="text-sm sm:text-base text-[#EAF2FF] leading-relaxed font-light">
                {supportingText}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
