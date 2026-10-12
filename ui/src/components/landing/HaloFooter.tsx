import React from "react";
import { LogoIcon } from "./LogoIcon";

interface HaloFooterProps {
  onNavigate: (route: string) => void;
}

export const HaloFooter: React.FC<HaloFooterProps> = ({ onNavigate }) => {
  const handleScrollTo = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer
      className="bg-[#0B1F3A] text-white pt-14 pb-12 px-6 border-t border-white/10"
      aria-label="Footer"
    >
      <div className="max-w-[88rem] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 pb-12 border-b border-white/10">
          {/* Brand Column (2 cols) */}
          <div className="lg:col-span-2">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("/");
              }}
              className="inline-block mb-4"
            >
              <LogoIcon
                isDark={true}
                iconClassName="w-8 h-8 text-white"
                textClassName="text-xl font-semibold tracking-tight text-white"
              />
            </a>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm mb-4">
              WealthPass helps families discover potential unclaimed financial assets and prepare official claim procedures across supported financial institutions.
            </p>
          </div>

          {/* Navigation Column 1: Explore */}
          <div>
            <h4 className="text-sm font-semibold tracking-wider uppercase text-white/90 mb-4">
              Explore
            </h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li>
                <button
                  type="button"
                  onClick={() => handleScrollTo("how-it-works")}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleScrollTo("asset-categories")}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Asset Categories
                </button>
              </li>
              <li>
                <a
                  href="/guide/banks/"
                  className="hover:text-white transition-colors block text-left"
                >
                  Bank Directory
                </a>
              </li>
            </ul>
          </div>

          {/* Navigation Column 2: Claim Workflows */}
          <div>
            <h4 className="text-sm font-semibold tracking-wider uppercase text-white/90 mb-4">
              Workflows
            </h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("/discover-assets")}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Search Assets
                </button>
              </li>
              <li>
                <a
                  href="/guide/fill-form/"
                  className="hover:text-white transition-colors block text-left"
                >
                  Fill Claim Forms Online
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("/verify")}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Identity Verification
                </button>
              </li>
            </ul>
          </div>

          {/* Navigation Column 3: Legal & Trust */}
          <div>
            <h4 className="text-sm font-semibold tracking-wider uppercase text-white/90 mb-4">
              Legal & Privacy
            </h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("/privacy-policy")}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("/terms")}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleScrollTo("trust-process")}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Security Standards
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Statutory Disclaimer & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs text-white/60">
          <p className="max-w-3xl leading-relaxed">
            WealthPass helps organize asset discovery and claim preparation. Potential matches and prepared documents do not guarantee ownership, eligibility, or successful recovery. Final requirements and decisions depend on the relevant institution and applicable law.
          </p>
          <div className="shrink-0 text-white/40">
            © {new Date().getFullYear()} WealthPass. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
