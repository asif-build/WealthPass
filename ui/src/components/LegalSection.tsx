import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { WordsPullUpMultiStyle } from "./WordsPullUpMultiStyle";

export const LegalSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const heading1 = [
    { text: "Grounded in the trust rails India already knows.", className: "text-[#E1E0CC] font-normal" }
  ];

  const heading2 = [
    { text: "The design is elevated, but the message stays familiar.", className: "text-gray-500 font-normal" }
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        ease: [0.22, 1, 0.36, 1] as any,
        duration: 0.8,
      },
    },
  };

  const mandates = [
    {
      tag: "RBI",
      title: "Consent-first access",
      description: "Discovery cues and language mirror the seriousness expected from regulated financial journeys."
    },
    {
      tag: "IRDAI",
      title: "Insurance-ready workflow",
      description: "Clear benefit language explains how policy discovery fits into a premium recovery experience."
    },
    {
      tag: "EPFO",
      title: "Claim path precision",
      description: "Structured hierarchy and spacing make procedural clarity feel effortless on any screen size."
    },
    {
      tag: "UIDAI",
      title: "Identity confidence",
      description: "Verification signals are surfaced cleanly so the interface feels secure without becoming intimidating."
    }
  ];

  return (
    <section id="legal" className="py-24 px-4 md:px-6 bg-black relative overflow-hidden flex flex-col justify-center border-t border-white/5">
      {/* Background overlay noise */}
      <div className="absolute inset-0 bg-noise opacity-[0.05] pointer-events-none z-0" />
      
      <div className="w-full max-w-7xl mx-auto z-10 relative">
        {/* Header */}
        <div className="text-center mb-16 md:mb-24 flex flex-col gap-3">
          <span className="text-primary text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium block">
            Legal mandate
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal leading-tight max-w-2xl mx-auto">
            <WordsPullUpMultiStyle segments={heading1} />
          </h2>
          <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal leading-tight max-w-2xl mx-auto">
            <WordsPullUpMultiStyle segments={heading2} />
          </h3>
        </div>

        {/* Mandate Grid */}
        <motion.div
          ref={containerRef}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {mandates.map((item, idx) => (
            <motion.article
              key={idx}
              variants={cardVariants}
              className="bg-[#101010] border border-white/5 rounded-[2rem] p-8 flex flex-col justify-between min-h-[220px] relative group"
            >
              {/* Subtle hover indicator */}
              <div className="absolute inset-0 bg-primary/[0.01] rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div>
                <span className="bg-primary/10 text-primary px-3.5 py-1 text-[10px] sm:text-xs rounded-full uppercase tracking-widest font-semibold w-fit mb-6 block border border-primary/10">
                  {item.tag}
                </span>
                <h4 className="text-base sm:text-lg font-medium text-[#E1E0CC] mb-3 group-hover:text-primary transition-colors">
                  {item.title}
                </h4>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
