import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { WordsPullUpMultiStyle } from "./WordsPullUpMultiStyle";

export const LegalSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [activeIndex, setActiveIndex] = useState(0);

  const heading1 = [
    { text: "Grounded strictly in India's official regulatory frameworks.", className: "text-white font-medium" }
  ];

  const heading2 = [
    { text: "RBI Master Directions 2025, IRDAI guidelines, and IEPF claim protocols.", className: "text-[#EAF2FF] font-medium" }
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
      institution: "Reserve Bank of India",
      logo: "/static/assets/institutions/rbi.svg",
      title: "RBI Master Directions 2025",
      description: "Direct claim pathways aligned with Annex I-A through I-H standard banking settlement procedures."
    },
    {
      tag: "IRDAI",
      institution: "Insurance Regulatory & Development Authority",
      logo: "/static/assets/institutions/irdai.svg",
      title: "Policy & Death Claim Portals",
      description: "Structured recovery workflows across LIC and private life insurance policy settlements."
    },
    {
      tag: "IEPF",
      institution: "Investor Education & Protection Fund Authority",
      logo: "/static/assets/institutions/iepf.svg",
      title: "IEPF-5 Verification Dossiers",
      description: "Statutory documentation for recovering unpaid dividends, shares, and matured debentures."
    },
    {
      tag: "UIDAI",
      institution: "Unique Identification Authority of India",
      logo: "/static/assets/institutions/uidai.svg",
      title: "Aadhaar e-KYC Verification",
      description: "Bank-grade identity clearance without storing full biometric data or plaintext credentials."
    }
  ];

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, offsetWidth } = scrollRef.current;
    const index = Math.round(scrollLeft / (offsetWidth * 0.82));
    setActiveIndex(Math.min(Math.max(index, 0), mandates.length - 1));
  };

  const scrollToCard = (index: number) => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.offsetWidth * 0.82;
    scrollRef.current.scrollTo({
      left: index * cardWidth,
      behavior: "smooth"
    });
    setActiveIndex(index);
  };

  return (
    <section id="legal" className="py-24 px-4 md:px-6 bg-[#0755C9] relative overflow-hidden flex flex-col justify-center border-t border-white/10">
      {/* Background overlay noise */}
      <div className="absolute inset-0 bg-noise opacity-[0.05] pointer-events-none z-0" />
      
      <div className="w-full max-w-7xl mx-auto z-10 relative">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20 flex flex-col gap-3">
          <span className="text-primary text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium block">
            LEGAL MANDATE
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal leading-tight max-w-2xl mx-auto">
            <WordsPullUpMultiStyle segments={heading1} />
          </h2>
          <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal leading-tight max-w-2xl mx-auto">
            <WordsPullUpMultiStyle segments={heading2} />
          </h3>
        </div>

        {/* Mandate Cards Carousel / Grid */}
        <div className="relative">
          <motion.div
            ref={containerRef}
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="w-full"
          >
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex lg:grid lg:grid-cols-4 gap-4 overflow-x-auto lg:overflow-x-visible snap-x snap-mandatory scroll-smooth pb-4 lg:pb-0 px-2 lg:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {mandates.map((item, idx) => (
                <motion.article
                  key={idx}
                  variants={cardVariants}
                  className="bg-[#0646AD] border border-white/10 rounded-[2rem] p-7 sm:p-8 flex flex-col justify-between min-h-[290px] lg:min-h-[300px] relative group shrink-0 w-[82vw] sm:w-[320px] lg:w-auto snap-center select-none transition-all duration-300 hover:border-white/20 shadow-xl"
                >
                  {/* Subtle hover indicator */}
                  <div className="absolute inset-0 bg-primary/[0.015] rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  <div className="flex flex-col h-full justify-between">
                    <div>
                      {/* Top Institutional Logo & Tag */}
                      <div className="flex flex-col gap-3.5 mb-6">
                        <div className="h-12 flex items-center justify-start">
                          <img
                            src={item.logo}
                            alt={item.institution}
                            loading="lazy"
                            className="max-h-10 sm:max-h-11 max-w-[130px] w-auto h-auto object-contain select-none transition-all duration-300 opacity-90 group-hover:opacity-100"
                            onError={(e) => {
                              // Direct root fallback if static prefix fails
                              if (e.currentTarget.src.includes("/static/")) {
                                e.currentTarget.src = item.logo.replace("/static", "");
                              }
                            }}
                          />
                        </div>
                        <span className="bg-primary/10 text-primary px-3 py-0.5 text-[10px] sm:text-xs rounded-full uppercase tracking-widest font-semibold w-fit border border-primary/10">
                          {item.tag}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-base sm:text-lg font-medium text-white mb-2.5 group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>

                      {/* Description */}
                      <p className="text-[#EAF2FF] text-xs sm:text-sm leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Institution Full Name Footer */}
                    <div className="pt-6 border-t border-white/[0.04] mt-4">
                      <span className="text-[10px] uppercase tracking-wider text-blue-200/70 font-medium line-clamp-1">
                        {item.institution}
                      </span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.div>

          {/* Mobile Carousel Pagination Indicators */}
          <div className="flex justify-center items-center gap-2 mt-4 lg:hidden">
            {mandates.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to institutional mandate card ${i + 1}`}
                onClick={() => scrollToCard(i)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  activeIndex === i ? "w-6 bg-primary" : "w-1.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Subtle Informational Disclaimer */}
        <p className="text-center text-[11px] sm:text-xs text-[#EAF2FF]/80 max-w-xl mx-auto mt-10 md:mt-14 font-normal leading-relaxed">
          Institutional references are for informational purposes only and do not imply endorsement, partnership, or affiliation.
        </p>
      </div>
    </section>
  );
};

export default LegalSection;
