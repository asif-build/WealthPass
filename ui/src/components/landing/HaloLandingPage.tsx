import React, { useEffect } from "react";
import { HaloNavbar } from "./HaloNavbar";
import { HaloHero } from "./HaloHero";
import { MeetWealthPass } from "./MeetWealthPass";
import { TrustSection } from "./TrustSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { AssetCategoriesSection } from "./AssetCategoriesSection";
import { FinalCTASection } from "./FinalCTASection";
import { HaloFooter } from "./HaloFooter";

interface HaloLandingPageProps {
  onNavigate: (route: string) => void;
  onSearch?: (query: string) => void;
  currentUser?: any;
}

export const HaloLandingPage: React.FC<HaloLandingPageProps> = ({
  onNavigate,
  onSearch,
  currentUser,
}) => {
  useEffect(() => {
    // Ensure smooth scrolling and page title
    document.title = "WealthPass — Your Family's Financial Future";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F8FC] text-[#10233F] font-editorial selection:bg-[#E5EFFD] selection:text-[#174EA6] relative overflow-x-hidden">
      {/* 1. Navbar + Cinematic Hero */}
      <div className="relative">
        <HaloNavbar onNavigate={onNavigate} currentUser={currentUser} />
        <HaloHero onNavigate={onNavigate} onSearch={onSearch} />
      </div>

      {/* 2. Meet WealthPass */}
      <MeetWealthPass />

      {/* 3. Backed By / Built Around Trusted Financial Processes */}
      <TrustSection />

      {/* 4. How WealthPass Works */}
      <HowItWorksSection onNavigate={onNavigate} />

      {/* 5. Asset Categories */}
      <AssetCategoriesSection onNavigate={onNavigate} />

      {/* 6. Final CTA */}
      <FinalCTASection onNavigate={onNavigate} />

      {/* 7. Footer */}
      <HaloFooter onNavigate={onNavigate} />
    </div>
  );
};
