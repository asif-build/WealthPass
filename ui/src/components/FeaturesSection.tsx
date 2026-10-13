import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { WordsPullUpMultiStyle } from "./WordsPullUpMultiStyle";
import vaultCoinsWebp from "../assets/security-vault-coins.webp";
import vaultCoinsPng from "../assets/security-vault-coins.png";
import blueVerifiedBadgeWebp from "../assets/blue-verified-badge.webp";
import blueVerifiedBadgePng from "../assets/blue-verified-badge.png";

interface FeaturesSectionProps {
  onNavigate?: (path: string) => void;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ onNavigate }) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const isGridInView = useInView(gridRef, { once: true, margin: "-100px" });

  const heading1 = [
    { text: "Statutory asset discovery for your family's inheritance.", className: "text-white font-medium" }
  ];

  const heading2 = [
    { text: "RBI-grounded, 256-bit encrypted, and completely transparent.", className: "text-[#EAF2FF] font-medium" }
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
    "Official RBI UDGAM & statutory database matches",
    "Instant NSDL / UIDAI identity verification",
    "Consolidated portfolio (SBI, LIC, IEPF, PPF)",
    "256-Bit bank-grade encryption & zero data retention"
  ];

  const card3Items = [
    "RBI Annex I-A to I-H standard documentation",
    "Pre-filled Bank Form 14 & affidavit dossiers",
    "Grounded legal copilot with step-by-step guidance"
  ];

  const card4Items = [
    "Zero Upfront Fee — success-based pricing only",
    "0% Bridge Advance while bank claims process",
    "Direct NEFT / RTGS settlement to verified legal heir"
  ];

  return (
    <section id="features" className="min-h-screen bg-[#0755C9] py-24 px-4 md:px-6 relative overflow-hidden flex flex-col justify-center">
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
          {/* Card 1: Security Vault */}
          <motion.div
            variants={cardVariants}
            className="lg:h-[480px] h-[350px] rounded-3xl overflow-hidden relative group border border-white/10 shadow-xl bg-[#083B8A]"
          >
            {/* Scoped CSS animation for continuous 3D weightless floating coins loop */}
            <style>{`
              @keyframes wpFloatingCoinsLoop {
                0% {
                  transform: perspective(1000px) translate3d(0, 0px, 0) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1);
                  filter: drop-shadow(0 16px 28px rgba(36, 104, 232, 0.35)) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.7));
                }
                25% {
                  transform: perspective(1000px) translate3d(2px, -14px, 0) rotateX(3deg) rotateY(-2.5deg) rotateZ(1.5deg) scale(1.025);
                  filter: drop-shadow(0 26px 38px rgba(52, 120, 246, 0.5)) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5));
                }
                50% {
                  transform: perspective(1000px) translate3d(0, -24px, 0) rotateX(0deg) rotateY(3deg) rotateZ(-1.2deg) scale(1.04);
                  filter: drop-shadow(0 32px 48px rgba(65, 140, 255, 0.65)) drop-shadow(0 0 24px rgba(225, 224, 204, 0.2));
                }
                75% {
                  transform: perspective(1000px) translate3d(-2px, -11px, 0) rotateX(-2.5deg) rotateY(-1.5deg) rotateZ(-2deg) scale(1.02);
                  filter: drop-shadow(0 24px 36px rgba(36, 104, 232, 0.45)) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.6));
                }
                100% {
                  transform: perspective(1000px) translate3d(0, 0px, 0) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1);
                  filter: drop-shadow(0 16px 28px rgba(36, 104, 232, 0.35)) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.7));
                }
              }

              @keyframes wpAuraPulse {
                0%, 100% {
                  opacity: 0.25;
                  transform: scale(0.85) translate3d(0, 5px, 0);
                }
                50% {
                  opacity: 0.55;
                  transform: scale(1.2) translate3d(0, -12px, 0);
                }
              }

              @media (prefers-reduced-motion: reduce) {
                .wp-floating-coins-cluster,
                .wp-floating-coins-aura {
                  animation: none !important;
                  transform: none !important;
                }
              }
            `}</style>

            {/* 3D Floating Indian Currency Coins Composition */}
            <div className="absolute inset-0 pb-20 flex items-center justify-center p-4 overflow-hidden pointer-events-none">
              {/* Ambient vault backlight glow pulsing in rhythm with the coins */}
              <div
                className="wp-floating-coins-aura absolute w-[220px] h-[220px] rounded-full bg-gradient-to-tr from-primary/30 to-blue-500/20 blur-[50px] pointer-events-none"
                style={{
                  animation: "wpAuraPulse 4.5s ease-in-out infinite",
                  willChange: "transform, opacity",
                }}
              />

              <div
                className="wp-floating-coins-cluster w-full h-full max-w-[270px] sm:max-w-[300px] lg:max-w-[320px] flex items-center justify-center relative z-10"
                style={{
                  animation: "wpFloatingCoinsLoop 4.5s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite",
                  willChange: "transform, filter",
                }}
              >
                <picture className="w-full h-full flex items-center justify-center">
                  <source srcSet={vaultCoinsWebp || "/static/assets/security-vault-coins.webp"} type="image/webp" />
                  <img
                    src={vaultCoinsPng || "/static/assets/security-vault-coins.png"}
                    alt="Floating 3D Indian Rupee Currency Coins"
                    className="w-full h-full object-contain object-center select-none transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.src.endsWith("/static/assets/security-vault-coins.png")) {
                        img.src = "/static/assets/security-vault-coins.png";
                      }
                    }}
                  />
                </picture>
              </div>
            </div>

            {/* Dark gradient overlay for bottom text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#083B8A]/95 via-[#083B8A]/40 to-transparent z-10 pointer-events-none" />
            
            <div className="absolute bottom-6 left-6 right-6 z-20">
              <span className="text-xs text-[#EAF2FF] uppercase tracking-widest block mb-2 font-medium">
                Security Vault
              </span>
              <p className="text-lg md:text-xl font-medium text-white">
                Your family's secure vault.
              </p>
            </div>
          </motion.div>

          {/* Card 2: Storyboard Card */}
          <motion.div
            variants={cardVariants}
            className="lg:h-[480px] min-h-[380px] bg-[#0646AD] rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-white/10 shadow-xl relative group"
          >
            <div>
              {/* Card Header (Icon, Number, Title) */}
              <div className="flex justify-between items-start mb-6">
                <picture className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
                  <source srcSet={blueVerifiedBadgeWebp || "/static/assets/blue-verified-badge.webp"} type="image/webp" />
                  <img
                    src={blueVerifiedBadgePng || "/static/assets/blue-verified-badge.png"}
                    alt="Verified badge"
                    className="w-full h-full object-contain select-none drop-shadow-[0_4px_14px_rgba(36,104,232,0.5)] transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.src.endsWith("/static/assets/blue-verified-badge.png")) {
                        img.src = "/static/assets/blue-verified-badge.png";
                      }
                    }}
                  />
                </picture>
                <span className="font-serif italic text-primary/70 text-2xl font-semibold select-none">
                  01
                </span>
              </div>
              <h4 className="text-lg sm:text-xl font-medium text-white mb-4">
                Verify & Match.
              </h4>

              {/* Checklist */}
              <ul className="flex flex-col gap-3">
                {card2Items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#EAF2FF]">
                    <Check className="w-4 h-4 text-[#DEDBC8] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Link */}
            <div className="mt-8 flex justify-start">
              <a
                href="/how-it-works/verify-match"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigate) {
                    onNavigate("/how-it-works/verify-match");
                  } else {
                    window.location.href = "/how-it-works/verify-match";
                  }
                }}
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-primary font-medium group/link hover:text-white transition-colors cursor-pointer"
              >
                <span>Learn more</span>
                <ArrowRight className="w-4 h-4 rotate-[-45deg] transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
              </a>
            </div>
          </motion.div>

          {/* Card 3: Critiques Card */}
          <motion.div
            variants={cardVariants}
            className="lg:h-[480px] min-h-[380px] bg-[#0646AD] rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-white/10 shadow-xl relative group"
          >
            <div>
              {/* Card Header (Icon, Number, Title) */}
              <div className="flex justify-between items-start mb-6">
                <picture className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
                  <source srcSet={blueVerifiedBadgeWebp || "/static/assets/blue-verified-badge.webp"} type="image/webp" />
                  <img
                    src={blueVerifiedBadgePng || "/static/assets/blue-verified-badge.png"}
                    alt="Verified badge"
                    className="w-full h-full object-contain select-none drop-shadow-[0_4px_14px_rgba(36,104,232,0.5)] transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.src.endsWith("/static/assets/blue-verified-badge.png")) {
                        img.src = "/static/assets/blue-verified-badge.png";
                      }
                    }}
                  />
                </picture>
                <span className="font-serif italic text-primary/70 text-2xl font-semibold select-none">
                  02
                </span>
              </div>
              <h4 className="text-lg sm:text-xl font-medium text-white mb-4">
                Claim Preparation.
              </h4>

              {/* Checklist */}
              <ul className="flex flex-col gap-3">
                {card3Items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#EAF2FF]">
                    <Check className="w-4 h-4 text-[#DEDBC8] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Link */}
            <div className="mt-8 flex justify-start">
              <a
                href="/how-it-works/claim-preparation"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigate) {
                    onNavigate("/how-it-works/claim-preparation");
                  } else {
                    window.location.href = "/how-it-works/claim-preparation";
                  }
                }}
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-primary font-medium group/link hover:text-white transition-colors cursor-pointer"
              >
                <span>Learn more</span>
                <ArrowRight className="w-4 h-4 rotate-[-45deg] transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
              </a>
            </div>
          </motion.div>

          {/* Card 4: Immersion Capsule Card */}
          <motion.div
            variants={cardVariants}
            className="lg:h-[480px] min-h-[380px] bg-[#0646AD] rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-white/10 shadow-xl relative group"
          >
            <div>
              {/* Card Header (Icon, Number, Title) */}
              <div className="flex justify-between items-start mb-6">
                <picture className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
                  <source srcSet={blueVerifiedBadgeWebp || "/static/assets/blue-verified-badge.webp"} type="image/webp" />
                  <img
                    src={blueVerifiedBadgePng || "/static/assets/blue-verified-badge.png"}
                    alt="Verified badge"
                    className="w-full h-full object-contain select-none drop-shadow-[0_4px_14px_rgba(36,104,232,0.5)] transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.src.endsWith("/static/assets/blue-verified-badge.png")) {
                        img.src = "/static/assets/blue-verified-badge.png";
                      }
                    }}
                  />
                </picture>
                <span className="font-serif italic text-primary/70 text-2xl font-semibold select-none">
                  03
                </span>
              </div>
              <h4 className="text-lg sm:text-xl font-medium text-white mb-4">
                Instant Liquidity.
              </h4>

              {/* Checklist */}
              <ul className="flex flex-col gap-3">
                {card4Items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#EAF2FF]">
                    <Check className="w-4 h-4 text-[#DEDBC8] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Link */}
            <div className="mt-8 flex justify-start">
              <a
                href="/how-it-works/instant-liquidity"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigate) {
                    onNavigate("/how-it-works/instant-liquidity");
                  } else {
                    window.location.href = "/how-it-works/instant-liquidity";
                  }
                }}
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-primary font-medium group/link hover:text-white transition-colors cursor-pointer"
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
