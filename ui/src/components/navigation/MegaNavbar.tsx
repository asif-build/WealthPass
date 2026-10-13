import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Zap,
  Search,
  Lock,
  Scale,
  Database,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  Building2,
  Sparkles,
  FileText,
  Menu,
  X,
  UserCheck,
  TrendingUp,
} from "lucide-react";

interface MegaNavbarProps {
  onNavigate: (path: string) => void;
  currentUser?: any;
}

interface MenuItem {
  title: string;
  desc: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
}

export const MegaNavbar: React.FC<MegaNavbarProps> = ({ onNavigate, currentUser }) => {
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [direction, setDirection] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = (idx: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (activeTab !== null && activeTab !== idx) {
      setDirection(idx > activeTab ? 1 : -1);
    } else if (activeTab === null) {
      setDirection(0);
    }
    setActiveTab(idx);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveTab(null);
    }, 180);
  };

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setActiveTab(null);
    setMobileOpen(false);

    if (href.startsWith("#")) {
      const id = href.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        onNavigate("/");
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
    } else {
      onNavigate(href);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Menu items data
  const solutionsItems: MenuItem[] = [
    {
      title: "Statutory Asset Discovery",
      desc: "Cross-depository scan across RBI, SEBI, IEPF & insurance holdings.",
      href: "/verify",
      icon: Search,
      tag: "Live Search",
    },
    {
      title: "Nominee & Heir Verification",
      desc: "Cryptographic identity matching without retaining raw credentials.",
      href: "/verify",
      icon: UserCheck,
    },
    {
      title: "Instant Bridge Liquidity",
      desc: "0% liquidity advances while statutory custodian claims settle.",
      href: "/how-it-works/instant-liquidity",
      icon: Zap,
      tag: "0% APR",
    },
    {
      title: "Claim Preparation & Legal Pack",
      desc: "Automated succession affidavits, indemnity bonds, and claim dockets.",
      href: "/how-it-works/claim-preparation",
      icon: FileText,
    },
  ];

  const howItWorksSteps: MenuItem[] = [
    {
      title: "01. Verify & Match",
      desc: "Identity and genealogical authentication against institutional registries.",
      href: "/how-it-works/verify-match",
      icon: CheckCircle2,
    },
    {
      title: "02. Claim Preparation",
      desc: "Automated forms, notarized affidavits, and legal partner review.",
      href: "/how-it-works/claim-preparation",
      icon: FileText,
    },
    {
      title: "03. Instant Liquidity",
      desc: "Up to 40% advance liquidity disbursed directly to nominee accounts.",
      href: "/how-it-works/instant-liquidity",
      icon: TrendingUp,
    },
  ];

  const securityItems: MenuItem[] = [
    {
      title: "Security Vault",
      desc: "256-bit AES client isolation and encrypted inheritance storage.",
      href: "#features",
      icon: Lock,
    },
    {
      title: "Zero Raw Data Retention",
      desc: "Biometrics, OTPs, and Aadhaar numbers are never persisted or cached.",
      href: "/privacy-policy",
      icon: ShieldCheck,
      tag: "Statutory",
    },
    {
      title: "RBI Master Directions 2025",
      desc: "Regulated custody framework and transparent institutional settlement.",
      href: "#legal",
      icon: Scale,
    },
    {
      title: "Source Transparency",
      desc: "Audited discovery channels across regulated depositories & banks.",
      href: "/sources",
      icon: Database,
    },
  ];

  // Motion variants for directional sliding
  const contentVariants: any = {
    enter: (dir: number) => ({
      x: dir > 0 ? 32 : dir < 0 ? -32 : 0,
      opacity: 0,
      filter: "blur(4px)",
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        x: { type: "spring", stiffness: 380, damping: 32 },
        opacity: { duration: 0.2 },
        filter: { duration: 0.2 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -32 : dir < 0 ? 32 : 0,
      opacity: 0,
      filter: "blur(4px)",
      transition: {
        x: { type: "spring", stiffness: 380, damping: 32 },
        opacity: { duration: 0.15 },
        filter: { duration: 0.15 },
      },
    }),
  };

  return (
    <nav
      className="absolute top-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-7xl px-4 sm:px-6 pt-3 flex flex-col items-center"
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Navbar Pill */}
      <div className="bg-[#0646AD]/95 backdrop-blur-xl rounded-full px-4 py-2 sm:px-6 sm:py-2.5 flex items-center justify-between sm:justify-center gap-2 sm:gap-6 md:gap-8 border border-white/20 shadow-[0_20px_50px_rgba(6,70,173,0.5)] relative">
        {/* Brand mark for compact screens */}
        <button
          onClick={(e) => handleLinkClick(e, "/")}
          className="text-xs sm:text-sm font-semibold tracking-wider text-white hover:text-primary transition-colors md:hidden mr-1"
        >
          WEALTHPASS
        </button>

        {/* Desktop Nav Triggers */}
        <div className="hidden md:flex items-center gap-1 sm:gap-2">
          {/* Tab 0: Solutions */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter(0)}
          >
            <button
              className={`px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-medium tracking-wide transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 0
                  ? "text-white bg-white/15"
                  : "text-[#EAF2FF] hover:text-white hover:bg-white/10"
              }`}
            >
              <span>Solutions</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-300 text-blue-200 ${
                  activeTab === 0 ? "rotate-180 text-white" : ""
                }`}
              />
            </button>
          </div>

          {/* Tab 1: How It Works */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter(1)}
          >
            <button
              className={`px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-medium tracking-wide transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 1
                  ? "text-white bg-white/15"
                  : "text-[#EAF2FF] hover:text-white hover:bg-white/10"
              }`}
            >
              <span>How It Works</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-300 text-blue-200 ${
                  activeTab === 1 ? "rotate-180 text-white" : ""
                }`}
              />
            </button>
          </div>

          {/* Tab 2: Security & Vault */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter(2)}
          >
            <button
              className={`px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-medium tracking-wide transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 2
                  ? "text-white bg-white/15"
                  : "text-[#EAF2FF] hover:text-white hover:bg-white/10"
              }`}
            >
              <span>Security & Vault</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-300 text-blue-200 ${
                  activeTab === 2 ? "rotate-180 text-white" : ""
                }`}
              />
            </button>
          </div>

          {/* Direct link: Inquiries */}
          <a
            href="#inquiries"
            onClick={(e) => handleLinkClick(e, "#inquiries")}
            onMouseEnter={() => setActiveTab(null)}
            className="px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-medium tracking-wide text-[#EAF2FF] hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
          >
            Inquiries
          </a>
        </div>

        {/* Separator */}
        <div className="h-4 w-[1px] bg-white/10 hidden md:block" />

        {/* Right CTA */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <button
              onClick={(e) => handleLinkClick(e, "/dashboard")}
              className="text-xs lg:text-sm font-medium px-4 py-1.5 rounded-full bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 transition-all cursor-pointer"
            >
              Dashboard
            </button>
          ) : (
            <button
              onClick={(e) => handleLinkClick(e, "/login")}
              className="text-xs lg:text-sm font-medium px-4 py-1.5 rounded-full text-primary hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Sign In
            </button>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white md:hidden focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Directional Mega-Menu Dropdown Panel */}
      <AnimatePresence>
        {activeTab !== null && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 8, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
            }}
            onMouseLeave={handleMouseLeave}
            className="hidden md:block w-full max-w-3xl bg-[#0646AD]/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_30px_90px_rgba(8,59,138,0.7)] overflow-hidden relative"
          >
            {/* Top subtle highlight line */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            <div className="p-6">
              <AnimatePresence custom={direction} mode="popLayout" initial={false}>
                {/* Panel 0: Solutions */}
                {activeTab === 0 && (
                  <motion.div
                    key="tab-solutions"
                    custom={direction}
                    variants={contentVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="grid grid-cols-12 gap-6"
                  >
                    {/* Left: 4 Solution Items */}
                    <div className="col-span-8 grid grid-cols-2 gap-3">
                      {solutionsItems.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                          <a
                            key={idx}
                            href={item.href}
                            onClick={(e) => handleLinkClick(e, item.href)}
                            className="p-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all group flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                                  <Icon className="w-4 h-4" />
                                </div>
                                {item.tag && (
                                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    {item.tag}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-medium text-white group-hover:text-primary transition-colors">
                                {item.title}
                              </h4>
                              <p className="text-xs text-[#EAF2FF] mt-1 leading-relaxed line-clamp-2">
                                {item.desc}
                              </p>
                            </div>
                            <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-primary/80 group-hover:text-primary">
                              <span>Explore</span>
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </a>
                        );
                      })}
                    </div>

                    {/* Right: Featured Card */}
                    <div className="col-span-4 bg-gradient-to-b from-[#083B8A] to-[#0646AD] rounded-xl p-4 border border-white/15 flex flex-col justify-between">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono uppercase tracking-wider mb-3">
                          <Sparkles className="w-3 h-3" />
                          <span>Statutory Pool</span>
                        </div>
                        <h4 className="text-base font-semibold text-white leading-tight">
                          ₹11 Lakh Crore in Unclaimed Assets
                        </h4>
                        <p className="text-xs text-[#EAF2FF] mt-2 leading-relaxed">
                          Over seven years of institutional deposits awaiting verified legal heirs under RBI custody guidelines.
                        </p>
                      </div>

                      <button
                        onClick={(e) => handleLinkClick(e, "/verify")}
                        className="mt-4 w-full py-2.5 px-3 rounded-lg bg-primary hover:bg-white text-[#102A56] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                      >
                        <span>Start Discovery</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Panel 1: How It Works */}
                {activeTab === 1 && (
                  <motion.div
                    key="tab-how-it-works"
                    custom={direction}
                    variants={contentVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="flex flex-col gap-4"
                  >
                    <div className="grid grid-cols-3 gap-4">
                      {howItWorksSteps.map((step, idx) => {
                        const Icon = step.icon;
                        return (
                          <a
                            key={idx}
                            href={step.href}
                            onClick={(e) => handleLinkClick(e, step.href)}
                            className="p-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all group flex flex-col justify-between"
                          >
                            <div>
                              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white group-hover:bg-primary group-hover:text-black transition-colors mb-3">
                                <Icon className="w-4 h-4" />
                              </div>
                              <h4 className="text-sm font-semibold text-white group-hover:text-primary transition-colors">
                                {step.title}
                              </h4>
                              <p className="text-xs text-[#EAF2FF] mt-1.5 leading-relaxed">
                                {step.desc}
                              </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-200/70 group-hover:text-white">
                              <span>View details</span>
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform text-primary" />
                            </div>
                          </a>
                        );
                      })}
                    </div>

                    {/* Bottom bar */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-blue-200/70">
                      <div className="flex items-center gap-4">
                        <a
                          href="/sources"
                          onClick={(e) => handleLinkClick(e, "/sources")}
                          className="hover:text-white transition-colors flex items-center gap-1.5"
                        >
                          <Database className="w-3.5 h-3.5 text-primary" />
                          <span>Source Transparency</span>
                        </a>
                        <span className="text-white/20">•</span>
                        <a
                          href="/energy"
                          onClick={(e) => handleLinkClick(e, "/energy")}
                          className="hover:text-white transition-colors flex items-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Green AI Telemetry</span>
                        </a>
                      </div>
                      <span className="text-[11px] text-blue-200/60 font-mono">
                        Step-by-step statutory execution
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Panel 2: Security & Vault */}
                {activeTab === 2 && (
                  <motion.div
                    key="tab-security"
                    custom={direction}
                    variants={contentVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="flex flex-col gap-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      {securityItems.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                          <a
                            key={idx}
                            href={item.href}
                            onClick={(e) => handleLinkClick(e, item.href)}
                            className="p-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all group flex items-start gap-3.5"
                          >
                            <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 group-hover:bg-primary group-hover:text-black transition-colors shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-white group-hover:text-primary transition-colors">
                                  {item.title}
                                </h4>
                                {item.tag && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                                    {item.tag}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#EAF2FF] mt-1 leading-relaxed">
                                {item.desc}
                              </p>
                            </div>
                          </a>
                        );
                      })}
                    </div>

                    {/* Bottom compliance guarantee */}
                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs text-blue-200/80">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary shrink-0" />
                        <span>Regulated Statutory Banking Custody Framework • RBI Master Directions 2025</span>
                      </div>
                      <a
                        href="/privacy-policy"
                        onClick={(e) => handleLinkClick(e, "/privacy-policy")}
                        className="text-primary hover:underline text-[11px] font-medium"
                      >
                        Privacy Guarantees →
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden w-full mt-3 bg-[#0646AD] border border-white/20 rounded-2xl p-5 shadow-2xl overflow-hidden flex flex-col gap-4"
          >
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-primary mb-2">
                Solutions
              </div>
              <div className="flex flex-col gap-2">
                {solutionsItems.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.href}
                    onClick={(e) => handleLinkClick(e, item.href)}
                    className="text-sm text-[#EAF2FF] hover:text-white py-1 flex items-center justify-between"
                  >
                    <span>{item.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-200" />
                  </a>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <div className="text-[11px] font-mono uppercase tracking-wider text-primary mb-2">
                How It Works
              </div>
              <div className="flex flex-col gap-2">
                {howItWorksSteps.map((step, idx) => (
                  <a
                    key={idx}
                    href={step.href}
                    onClick={(e) => handleLinkClick(e, step.href)}
                    className="text-sm text-[#EAF2FF] hover:text-white py-1 flex items-center justify-between"
                  >
                    <span>{step.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-200" />
                  </a>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <div className="text-[11px] font-mono uppercase tracking-wider text-primary mb-2">
                Security & Inquiries
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href="#legal"
                  onClick={(e) => handleLinkClick(e, "#legal")}
                  className="text-sm text-[#EAF2FF] hover:text-white py-1"
                >
                  Legal Mandate (RBI 2025)
                </a>
                <a
                  href="#inquiries"
                  onClick={(e) => handleLinkClick(e, "#inquiries")}
                  className="text-sm text-[#EAF2FF] hover:text-white py-1"
                >
                  Contact & Inquiries
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
