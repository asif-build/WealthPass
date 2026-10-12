import React from "react";
import {
  Landmark,
  ShieldCheck,
  TrendingUp,
  FileText,
  Wallet,
  Search,
  ArrowRight,
} from "lucide-react";

interface AssetCategoriesSectionProps {
  onNavigate: (route: string) => void;
}

const CATEGORIES = [
  {
    icon: Landmark,
    title: "Bank Deposits",
    description:
      "Understand potential unclaimed deposits and the applicable bank claim process.",
    actionText: "View bank directory",
    route: "/guide/banks/",
    isExternal: true,
  },
  {
    icon: ShieldCheck,
    title: "Insurance",
    description:
      "Explore relevant policy-search and death-claim workflows across verified insurers.",
    actionText: "Explore workflow",
    route: "/discover-assets",
    isExternal: false,
  },
  {
    icon: TrendingUp,
    title: "Mutual Funds",
    description:
      "Understand applicable unclaimed folio and transmission processes.",
    actionText: "Explore transmission",
    route: "/discover-assets",
    isExternal: false,
  },
  {
    icon: FileText,
    title: "Shares and Dividends",
    description:
      "Review relevant unclaimed investment and transmission procedures.",
    actionText: "Explore securities",
    route: "/discover-assets",
    isExternal: false,
  },
  {
    icon: Wallet,
    title: "EPF & Retirement",
    description:
      "Explore applicable claim workflows and required documents for retirement benefits.",
    actionText: "Explore benefits",
    route: "/discover-assets",
    isExternal: false,
  },
  {
    icon: Search,
    title: "Other Financial Assets",
    description:
      "Organize other supported discovery and claim processes with unified checklists.",
    actionText: "Explore discovery",
    route: "/discover-assets",
    isExternal: false,
  },
];

export const AssetCategoriesSection: React.FC<AssetCategoriesSectionProps> = ({
  onNavigate,
}) => {
  return (
    <section
      id="asset-categories"
      className="bg-[#F5F8FC] px-6 py-24 border-b border-[#DFE7F1]"
      aria-label="Asset Categories"
    >
      <div className="max-w-[88rem] mx-auto">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#174EA6] mb-3 inline-block">
            Comprehensive Scope
          </span>
          <h2
            className="text-4xl sm:text-5xl md:text-6xl font-medium text-[#10233F] leading-tight mb-4"
            style={{ letterSpacing: "-0.04em" }}
          >
            One clearer path
            <br />
            across asset categories.
          </h2>
          <p className="text-[#65758B] text-base md:text-lg leading-relaxed">
            Explore supported workflows for different types of financial assets and understand the claim process that may apply.
          </p>
        </div>

        {/* 6-Card Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#DFE7F1] p-7 md:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-[#367BF5]/40 hover:shadow-md group"
              >
                <div>
                  {/* Restrained blue icon background */}
                  <div className="w-12 h-12 rounded-xl bg-[#E5EFFD] text-[#174EA6] flex items-center justify-center mb-6 group-hover:bg-[#174EA6] group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-medium text-[#0B1F3A] mb-3 tracking-tight">
                    {cat.title}
                  </h3>
                  <p className="text-[#65758B] text-sm md:text-base leading-relaxed mb-6">
                    {cat.description}
                  </p>
                </div>

                {/* Bottom Action Link */}
                <div className="pt-4 border-t border-[#DFE7F1]/60">
                  {cat.isExternal ? (
                    <a
                      href={cat.route}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#174EA6] hover:text-[#0B1F3A] transition-colors"
                    >
                      <span>{cat.actionText}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onNavigate(cat.route)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#174EA6] hover:text-[#0B1F3A] transition-colors cursor-pointer"
                    >
                      <span>{cat.actionText}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
