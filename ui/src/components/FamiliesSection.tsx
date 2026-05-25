import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Star, ShieldCheck } from "lucide-react";
import { WordsPullUpMultiStyle } from "./WordsPullUpMultiStyle";

export const FamiliesSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const heading1 = [
    { text: "What families say.", className: "text-[#E1E0CC] font-normal" }
  ];

  const heading2 = [
    { text: "Recovery stories, presented with trust.", className: "text-gray-500 font-normal" }
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const cardVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        ease: [0.22, 1, 0.36, 1] as any,
        duration: 0.8,
      },
    },
  };

  const stories = [
    {
      initials: "AS",
      name: "Ananya Sharma",
      badge: "Verified family recovery",
      quote: "My father had a policy none of us knew existed. WealthPass found the path quickly and made the process feel clear from day one.",
      location: "Delhi",
      stat: "₹4.2L recovered"
    },
    {
      initials: "VN",
      name: "Vikram Nair",
      badge: "Verified bridge-loan case",
      quote: "Rent was due and time mattered. The experience felt calm, secure, and premium when our family needed certainty the most.",
      location: "Bengaluru",
      stat: "Bridge-loan support"
    },
    {
      initials: "MP",
      name: "Meena Pillai",
      badge: "Verified multi-asset recovery",
      quote: "Three accounts and one provident fund surfaced together. The flow looked refined, but more importantly, it made the next steps obvious.",
      location: "Chennai",
      stat: "₹8.6L recovered"
    }
  ];

  return (
    <section id="families" className="py-24 px-4 md:px-6 bg-black relative overflow-hidden flex flex-col justify-center border-t border-white/5">
      {/* Soft atmospheric gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="w-full max-w-7xl mx-auto z-10 relative">
        {/* Header */}
        <div className="text-center mb-16 md:mb-24 flex flex-col gap-3">
          <span className="text-primary text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium block">
            Families
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal leading-tight">
            <WordsPullUpMultiStyle segments={heading1} />
          </h2>
          <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal leading-tight">
            <WordsPullUpMultiStyle segments={heading2} />
          </h3>
        </div>

        {/* Testimonials Grid */}
        <motion.div
          ref={containerRef}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 lg:gap-3"
        >
          {stories.map((story, idx) => (
            <motion.article
              key={idx}
              variants={cardVariants}
              className="bg-[#101010] border border-white/5 rounded-[2rem] p-8 sm:p-10 shadow-2xl flex flex-col justify-between min-h-[350px] relative group"
            >
              {/* Highlight bar on hover */}
              <div className="absolute top-0 left-12 right-12 h-[1px] bg-primary/0 group-hover:bg-primary/30 transition-all duration-500" />
              
              <div>
                {/* Header info */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-primary/10 text-primary w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm select-none shrink-0">
                    {story.initials}
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-medium text-[#E1E0CC]">{story.name}</h4>
                    <span className="text-[10px] sm:text-xs text-primary/50 flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary/70" />
                      {story.badge}
                    </span>
                  </div>
                </div>

                {/* Rating stars */}
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed italic mb-8">
                  "{story.quote}"
                </p>
              </div>

              {/* Footer */}
              <div className="border-t border-white/5 pt-4 flex justify-between items-center text-[10px] sm:text-xs text-primary/60 uppercase tracking-widest font-medium">
                <span>{story.location}</span>
                <span className="text-[#E1E0CC]">{story.stat}</span>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
