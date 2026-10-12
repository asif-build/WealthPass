import React, { useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { LogoIcon } from "./LogoIcon";

interface HaloNavbarProps {
  onNavigate: (route: string) => void;
  currentUser?: any;
}

export const HaloNavbar: React.FC<HaloNavbarProps> = ({ onNavigate, currentUser }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleScrollTo = (sectionId: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className="absolute top-0 left-0 right-0 z-30 px-6 py-5"
      aria-label="Main Navigation"
    >
      <div className="max-w-[88rem] mx-auto flex items-center justify-between">
        {/* Left: WealthPass Logo */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("/");
          }}
          className="group flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#174EA6] rounded-lg"
          aria-label="WealthPass Home"
        >
          <LogoIcon />
        </a>

        {/* Center: Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8 lg:gap-10">
          <button
            type="button"
            onClick={() => handleScrollTo("how-it-works")}
            className="text-base font-medium text-slate-700 hover:text-[#174EA6] transition-colors duration-200 cursor-pointer"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => handleScrollTo("asset-categories")}
            className="text-base font-medium text-slate-700 hover:text-[#174EA6] transition-colors duration-200 cursor-pointer"
          >
            Asset Categories
          </button>
          <button
            type="button"
            onClick={() => handleScrollTo("trust-process")}
            className="text-base font-medium text-slate-700 hover:text-[#174EA6] transition-colors duration-200 cursor-pointer"
          >
            Security & Trust
          </button>
          <button
            type="button"
            onClick={() => handleScrollTo("meet-wealthpass")}
            className="text-base font-medium text-slate-700 hover:text-[#174EA6] transition-colors duration-200 cursor-pointer"
          >
            About
          </button>
        </div>

        {/* Right: Actions */}
        <div className="hidden sm:flex items-center gap-4">
          {currentUser ? (
            <button
              type="button"
              onClick={() => onNavigate("/dashboard")}
              className="text-sm font-medium text-[#174EA6] hover:text-[#0B1F3A] px-3 py-2 transition-colors"
            >
              Dashboard
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate("/login")}
              className="text-sm font-medium text-slate-600 hover:text-[#174EA6] px-3 py-2 transition-colors"
            >
              Sign In
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate("/discover-assets")}
            className="bg-[#174EA6] text-white px-7 py-3 rounded-full hover:bg-[#103D85] transition-colors duration-200 text-sm md:text-base font-medium shadow-sm hover:shadow inline-flex items-center gap-2 group cursor-pointer"
          >
            <span>Find Assets</span>
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Mobile Menu Hamburger Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate("/discover-assets")}
            className="bg-[#174EA6] text-white px-4 py-2 rounded-full text-xs font-medium"
          >
            Find Assets
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:text-[#174EA6] focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 p-5 bg-white rounded-2xl shadow-xl border border-[#DFE7F1] flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            type="button"
            onClick={() => handleScrollTo("how-it-works")}
            className="text-left text-base font-medium text-slate-700 hover:text-[#174EA6] py-1"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => handleScrollTo("asset-categories")}
            className="text-left text-base font-medium text-slate-700 hover:text-[#174EA6] py-1"
          >
            Asset Categories
          </button>
          <button
            type="button"
            onClick={() => handleScrollTo("trust-process")}
            className="text-left text-base font-medium text-slate-700 hover:text-[#174EA6] py-1"
          >
            Security & Trust
          </button>
          <button
            type="button"
            onClick={() => handleScrollTo("meet-wealthpass")}
            className="text-left text-base font-medium text-slate-700 hover:text-[#174EA6] py-1"
          >
            About
          </button>
          <hr className="border-[#DFE7F1]" />
          <div className="flex flex-col gap-2 pt-1">
            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate("/dashboard");
                }}
                className="w-full text-left py-2 font-medium text-[#174EA6]"
              >
                Go to Dashboard
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate("/login");
                }}
                className="w-full text-left py-2 font-medium text-slate-600 hover:text-[#174EA6]"
              >
                Sign In
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate("/discover-assets");
              }}
              className="w-full bg-[#174EA6] text-white py-3 rounded-full text-center font-medium"
            >
              Start Discovery
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
