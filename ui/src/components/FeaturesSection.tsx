import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { WordsPullUpMultiStyle } from "./WordsPullUpMultiStyle";

export const FeaturesSection = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const isGridInView = useInView(gridRef, { once: true, margin: "-100px" });

  const heading1 = [
    { text: "Institutional-grade discovery for family wealth.", className: "text-[#E1E0CC] font-normal" }
  ];

  const heading2 = [
    { text: "Built for trust. Driven by security.", className: "text-gray-500 font-normal" }
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
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        ease: [0.22, 1, 0.36, 1] as any,
        duration: 0.8,
      },
    },
  };

  // Checklist items for the cards
  const card2Items = [
    "Consent-based database check",
    "Real-time PAN validation",
    "Multi-source tracking",
    "Encrypted data privacy"
  ];

  const card3Items = [
    "Nominee vs legal-heir logic",
    "Automated form pre-filling",
    "Legal guidance and NOC templates"
  ];

  const card4Items = [
    "Zero-upfront processing fee",
    "Immediate cash flow for families",
    "Secure, automated payback path"
  ];

  return (
    <section id="features" className="min-h-screen bg-black py-24 px-4 md:px-6 relative overflow-hidden flex flex-col justify-center">
      {/* Subtle .bg-noise overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.15] pointer-events-none z-0" />
      
      {/* Container for header and cards */}
      <div className="w-full max-w-7xl mx-auto z-10 relative">
        {/* Header section */}
        <div className="text-center mb-16 md:mb-24 flex flex-col gap-3">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal leading-tight">
            <WordsPullUpMultiStyle segments={heading1} />
          </h2>
          <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal leading-tight">
            <WordsPullUpMultiStyle segments={heading2} />
          </h3>
        </div>

        {/* 4-column Card Grid */}
        <motion.div
          ref={gridRef}
          variants={containerVariants}
          initial="hidden"
          animate={isGridInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-3 lg:gap-2"
        >
          {/* Card 1: Video Card */}
          <motion.div
            variants={cardVariants}
            className="lg:h-[480px] h-[350px] rounded-3xl overflow-hidden relative group border border-white/5 shadow-xl"
          >
            <video
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_133058_0504132a-0cf3-4450-a370-8ea3b05c95d4.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
            
            <div className="absolute bottom-6 left-6 right-6 z-20">
              <span className="text-xs text-primary/70 uppercase tracking-widest block mb-2 font-medium">
                Security Vault
              </span>
              <p className="text-lg md:text-xl font-medium text-[#E1E0CC]">
                Your family's secure vault.
              </p>
            </div>
          </motion.div>

          {/* Card 2: Storyboard Card */}
          <motion.div
            variants={cardVariants}
            className="lg:h-[480px] min-h-[380px] bg-[#212121] rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-white/5 shadow-xl relative group"
          >
            <div>
              {/* Card Header (Icon, Number, Title) */}
              <div className="flex justify-between items-start mb-6">
                <img
                  src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171918_4a5edc79-d78f-4637-ac8b-53c43c220606.png&w=1280&q=85"
                  alt="Search icon"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover bg-white/5 border border-white/10"
                />
                <span className="font-serif italic text-primary/40 text-2xl font-semibold select-none">
                  01
                </span>
              </div>
              <h4 className="text-lg sm:text-xl font-medium text-[#E1E0CC] mb-4">
                Verify & Match.
              </h4>

              {/* Checklist */}
              <ul className="flex flex-col gap-3">
                {card2Items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-400">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Link */}
            <div className="mt-8 flex justify-start">
              <a
                href="#inquiries"
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-primary font-medium group/link hover:text-white transition-colors"
              >
                <span>Learn more</span>
                <ArrowRight className="w-4 h-4 rotate-[-45deg] transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
              </a>
            </div>
          </motion.div>

          {/* Card 3: Critiques Card */}
          <motion.div
            variants={cardVariants}
            className="lg:h-[480px] min-h-[380px] bg-[#212121] rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-white/5 shadow-xl relative group"
          >
            <div>
              {/* Card Header (Icon, Number, Title) */}
              <div className="flex justify-between items-start mb-6">
                <img
                  src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171741_ed9845ab-f5b2-4018-8ce7-07cc01823522.png&w=1280&q=85"
                  alt="Claims icon"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover bg-white/5 border border-white/10"
                />
                <span className="font-serif italic text-primary/40 text-2xl font-semibold select-none">
                  02
                </span>
              </div>
              <h4 className="text-lg sm:text-xl font-medium text-[#E1E0CC] mb-4">
                Claim Preparation.
              </h4>

              {/* Checklist */}
              <ul className="flex flex-col gap-3">
                {card3Items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-400">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Link */}
            <div className="mt-8 flex justify-start">
              <a
                href="#inquiries"
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-primary font-medium group/link hover:text-white transition-colors"
              >
                <span>Learn more</span>
                <ArrowRight className="w-4 h-4 rotate-[-45deg] transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
              </a>
            </div>
          </motion.div>

          {/* Card 4: Immersion Capsule Card */}
          <motion.div
            variants={cardVariants}
            className="lg:h-[480px] min-h-[380px] bg-[#212121] rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-white/5 shadow-xl relative group"
          >
            <div>
              {/* Card Header (Icon, Number, Title) */}
              <div className="flex justify-between items-start mb-6">
                <img
                  src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171809_f56666dc-c099-4778-ad82-9ad4f209567b.png&w=1280&q=85"
                  alt="Liquidity icon"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover bg-white/5 border border-white/10"
                />
                <span className="font-serif italic text-primary/40 text-2xl font-semibold select-none">
                  03
                </span>
              </div>
              <h4 className="text-lg sm:text-xl font-medium text-[#E1E0CC] mb-4">
                Instant Liquidity.
              </h4>

              {/* Checklist */}
              <ul className="flex flex-col gap-3">
                {card4Items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-400">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Link */}
            <div className="mt-8 flex justify-start">
              <a
                href="#inquiries"
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-primary font-medium group/link hover:text-white transition-colors"
              >
                <span>Learn more</span>
                <ArrowRight className="w-4 h-4 rotate-[-45deg] transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
