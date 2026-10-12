import React from "react";
import { motion } from "framer-motion";

interface HowItWorksSectionProps {
  id?: string;
  sectionNumber: string;
  badge?: string;
  title: string;
  description: string;
  points?: string[];
  disclaimer?: string;
  children?: React.ReactNode;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({
  id,
  sectionNumber,
  badge,
  title,
  description,
  points,
  disclaimer,
  children,
}) => {
  return (
    <section id={id} className="py-16 md:py-24 border-b border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT: Large Section Number (Desktop) */}
          <div className="lg:col-span-2 flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:pt-2">
            <span className="font-serif italic text-3xl sm:text-4xl lg:text-5xl text-primary/40 font-light select-none">
              {sectionNumber}
            </span>
            {badge && (
              <span className="text-[10px] uppercase tracking-widest text-primary/70 bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full font-medium">
                {badge}
              </span>
            )}
          </div>

          {/* CENTER: Main Explanation & Checklist */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-normal text-[#E1E0CC] tracking-tight mb-5 leading-snug">
                {title}
              </h2>
              <p className="text-sm sm:text-base text-gray-200 leading-relaxed font-light mb-8">
                {description}
              </p>

              {/* Bullet / Check Points if provided */}
              {points && points.length > 0 && (
                <ul className="flex flex-col gap-3.5 mb-8 bg-[#121212] p-5 sm:p-6 rounded-2xl border border-white/5 shadow-inner">
                  {points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-gray-200">
                      <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold">
                        ✓
                      </span>
                      <span className="leading-snug pt-0.5">{point}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Disclaimer / Important Note if provided */}
              {disclaimer && (
                <div className="p-4 sm:p-5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed font-light">
                  <span className="font-semibold block uppercase tracking-wider text-[10px] text-amber-300 mb-1">
                    Regulatory & Legal Note
                  </span>
                  {disclaimer}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Interactive Visual / Diagram / Checklist */}
          <div className="lg:col-span-5 w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="bg-[#141414] rounded-3xl p-6 sm:p-8 border border-white/5 shadow-2xl relative overflow-hidden"
            >
              {children}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
