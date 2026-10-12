import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink, ArrowRight, CheckCircle2, Lock, FileSearch } from "lucide-react";

interface SourcesPageProps {
  onNavigateHome: () => void;
  onNavigateVerify: () => void;
}

interface SourceDetail {
  id: string;
  category: string;
  name: string;
  official_url: string;
  integration_status: string;
  what_it_discovers: string;
  permitted_identifiers: string[];
  what_wealthpass_receives: string;
  what_wealthpass_does_not_receive: string;
}

export function SourcesPage({ onNavigateHome, onNavigateVerify }: SourcesPageProps) {
  const [sources, setSources] = useState<SourceDetail[]>([]);

  useEffect(() => {
    fetch("/api/sources/")
      .then(res => res.json())
      .then(data => {
        if (data.sources) {
          setSources(data.sources);
        }
      })
      .catch(() => {
        // Fallback static data
        setSources([
          {
            id: "01",
            category: "BANK DEPOSITS",
            name: "RBI UDGAM",
            official_url: "https://udgam.rbi.org.in/",
            integration_status: "OFFICIAL EXTERNAL DISCOVERY",
            what_it_discovers: "Eligible unclaimed deposits/accounts across 30+ participating public and private commercial banks in India.",
            permitted_identifiers: ["Account holder name", "PAN (where recorded)", "Driving Licence", "Voter ID", "Passport", "Date of Birth"],
            what_wealthpass_receives: "Potential match confirmation, participating bank name, and public branch identifier.",
            what_wealthpass_does_not_receive: "Full account balance, netbanking credentials, account numbers, or transaction statements."
          },
          {
            id: "02",
            category: "INSURANCE",
            name: "IRDAI Bima Bharosa / Insurers",
            official_url: "https://bimabharosa.irdai.gov.in/",
            integration_status: "OFFICIAL EXTERNAL DISCOVERY",
            what_it_discovers: "Unclaimed maturity amounts, survival benefits, premium refunds, and claim settlements held by registered life and general insurance companies.",
            permitted_identifiers: ["Policyholder name", "Date of birth", "PAN or Policy Number (if known)", "Registered mobile indicator"],
            what_wealthpass_receives: "Insurer name, masked policy reference, and potential unclaimed bucket status.",
            what_wealthpass_does_not_receive: "Medical records, nominee passwords, complete policy schedule, or underwriting documents."
          },
          {
            id: "03",
            category: "MUTUAL FUNDS",
            name: "SEBI MITRA",
            official_url: "https://app.mfcentral.com/links/inactive-folios",
            integration_status: "OFFICIAL EXTERNAL DISCOVERY",
            what_it_discovers: "Inactive, unclaimed, or dormant mutual fund folios across Asset Management Companies (AMCs) and RTAs (CAMS, KFintech).",
            permitted_identifiers: ["First/Sole investor name", "PAN / Tax identification number", "Date of birth", "RTA registered record"],
            what_wealthpass_receives: "AMC name, folio count status, and designated transmission service desk details.",
            what_wealthpass_does_not_receive: "Demat trading passwords, complete portfolio valuation history, or bank mandates."
          },
          {
            id: "04",
            category: "CORPORATE ASSETS",
            name: "IEPF Authority (Ministry of Corporate Affairs)",
            official_url: "https://www.iepf.gov.in/",
            integration_status: "OFFICIAL EXTERNAL DISCOVERY",
            what_it_discovers: "Unclaimed dividends, matured deposits, debentures, and underlying equity shares transferred to the Investor Education and Protection Fund under Section 124(5) of the Companies Act.",
            permitted_identifiers: ["Shareholder / Investor name", "Company CIN or name", "Folio / DP-ID Client ID", "Former registered address"],
            what_wealthpass_receives: "Company name, IEPF transfer financial year, and Form IEPF-5 filing requirements.",
            what_wealthpass_does_not_receive: "Share certificate vault custody, demat account keys, or personal banking credentials."
          },
          {
            id: "05",
            category: "FUTURE SOURCES",
            name: "Authorized Integrations (DigiLocker, Depository & Pensions)",
            official_url: "https://www.digilocker.gov.in/",
            integration_status: "PLANNED",
            what_it_discovers: "Direct institutional consent architecture for EPF/NPS unclaimed pensions and depository holdings (CDSL / NSDL).",
            permitted_identifiers: ["Consent-based electronic document tokens", "PRAN / UAN permitted lookups"],
            what_wealthpass_receives: "Standardized transmission status tokens only upon explicit e-sign consent.",
            what_wealthpass_does_not_receive: "WealthPass will never maintain or cache raw credential tokens."
          }
        ]);
      });
  }, []);

  return (
    <div className="min-h-screen bg-black text-[#E1E0CC] font-['Almarai'] selection:bg-white/20 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="text-xs text-white/50 hover:text-[#E1E0CC] transition-colors flex items-center gap-1.5 group cursor-pointer"
            >
              <span className="group-hover:text-white/80">← Home</span>
            </button>
            <span className="text-white/20">/</span>
            <span className="text-sm text-[#E1E0CC] font-medium tracking-wide">Source Transparency</span>
          </div>

          <button
            onClick={onNavigateVerify}
            className="py-1.5 px-4 rounded-full bg-[#E1E0CC] hover:bg-white text-black text-xs font-medium transition-all shadow-sm cursor-pointer"
          >
            Start Verification →
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 lg:py-16 space-y-12">
        {/* Editorial Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono tracking-widest uppercase text-white/60 mb-4">
            <FileSearch className="w-3.5 h-3.5 text-[#DEDBC8]" /> Complete Transparency Registry
          </div>
          <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-[#E1E0CC] mb-4">
            Where WealthPass <span className="font-['Instrument_Serif'] italic text-white">Looks</span>
          </h1>
          <p className="text-white/60 text-sm sm:text-base leading-relaxed">
            "WealthPass does not maintain a private database of your financial life. We use supported discovery channels and guide you through institutional recovery."
          </p>
        </motion.div>

        {/* Source Cards Grid */}
        <div className="space-y-6">
          {sources.map((src) => (
            <motion.div
              key={src.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-[#0e0e0e] border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-white/20 transition-all shadow-xl"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <span className="font-['Instrument_Serif'] text-2xl italic text-[#DEDBC8]">
                    {src.id}
                  </span>
                  <div>
                    <div className="text-[10px] font-mono tracking-widest uppercase text-white/40">
                      {src.category}
                    </div>
                    <h2 className="text-xl font-medium text-white">{src.name}</h2>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-mono border ${
                    src.integration_status === "OFFICIAL EXTERNAL DISCOVERY"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-blue-500/10 border-blue-500/30 text-blue-300"
                  }`}>
                    {src.integration_status}
                  </span>

                  <a
                    href={src.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors"
                    title="Visit Official Portal"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* What it discovers */}
              <div className="py-5 border-b border-white/5">
                <div className="text-xs font-mono uppercase tracking-wider text-white/40 mb-1.5">
                  What It Can Help Discover
                </div>
                <p className="text-sm text-white/80 leading-relaxed">{src.what_it_discovers}</p>
              </div>

              {/* Permitted Identifiers */}
              <div className="py-5 border-b border-white/5">
                <div className="text-xs font-mono uppercase tracking-wider text-white/40 mb-2">
                  Permitted Discovery Identifiers
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {src.permitted_identifiers.map((ident, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/10 text-white/70"
                    >
                      {ident}
                    </span>
                  ))}
                </div>
              </div>

              {/* Data Ingestion Boundaries: What we receive vs do NOT receive */}
              <div className="pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/20">
                  <div className="font-mono text-emerald-400 font-semibold uppercase mb-1.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> What WealthPass Receives:
                  </div>
                  <p className="text-white/70 leading-relaxed">{src.what_wealthpass_receives}</p>
                </div>

                <div className="p-4 rounded-xl bg-red-500/[0.03] border border-red-500/20">
                  <div className="font-mono text-red-400 font-semibold uppercase mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> What WealthPass NEVER Receives:
                  </div>
                  <p className="text-white/70 leading-relaxed">{src.what_wealthpass_does_not_receive}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Regulatory Trust Note */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-white/60 leading-relaxed text-center max-w-3xl mx-auto space-y-2">
          <div className="text-white font-medium">Regulatory & Legal Note</div>
          <p>
            WealthPass is an automated discovery and recovery assistance layer. A potential match does not establish ownership or legal entitlement. WealthPass is not a bank, insurer, depository, or government body. Settlement is processed directly by the custodian institution under applicable statutory regulations.
          </p>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-4">
          <button
            onClick={onNavigateVerify}
            className="py-3.5 px-8 rounded-xl bg-[#E1E0CC] hover:bg-white text-black font-medium text-sm transition-all inline-flex items-center gap-2 shadow-lg cursor-pointer"
          >
            Start Identity Verification
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
}
