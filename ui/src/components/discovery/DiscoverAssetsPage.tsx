import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Shield, CheckCircle2, ArrowRight,
  Info, X, HelpCircle, Lock, Landmark
} from "lucide-react";
import { assetDiscoveryEngine } from "../../services/AssetDiscoveryEngine";
import type { DiscoveredAssetItem } from "../../services/AssetDiscoveryEngine";
import type { VerificationResult } from "../../services/IdentityVerificationProvider";
import { WealthPassProcessingPanel } from "../processing/WealthPassProcessingPanel";
import type { SourceScanItem } from "../processing/WealthPassProcessingPanel";

interface DiscoverAssetsPageProps {
  verificationResult: VerificationResult;
  relationshipData: {
    relationship: string;
    claimantName: string;
    deceasedName: string;
    consentGranted: boolean;
  };
  onSelectAssetForClaim: (asset: DiscoveredAssetItem) => void;
  onNavigateSources: () => void;
  onNavigateHome: () => void;
}

export function DiscoverAssetsPage({
  verificationResult,
  relationshipData,
  onSelectAssetForClaim,
  onNavigateSources,
  onNavigateHome
}: DiscoverAssetsPageProps) {
  const [sources, setSources] = useState<SourceScanItem[]>([
    { id: "RBI_UDGAM", name: "RBI UDGAM", category: "BANK DEPOSITS", status: "OFFICIAL_EXTERNAL_PROCESS", label: "Central Portal" },
    { id: "IRDAI_BIMA_BHAROSA", name: "IRDAI Bima Bharosa / Insurers", category: "INSURANCE", status: "OFFICIAL_EXTERNAL_PROCESS", label: "IRDAI Pathway" },
    { id: "SEBI_MITRA", name: "SEBI MITRA", category: "MUTUAL FUNDS", status: "OFFICIAL_EXTERNAL_PROCESS", label: "RTA Tracing" },
    { id: "IEPF", name: "IEPF Authority", category: "CORPORATE ASSETS", status: "OFFICIAL_EXTERNAL_PROCESS", label: "MCA21 Registry" }
  ]);

  const [assets, setAssets] = useState<DiscoveredAssetItem[]>([]);
  const [scanStatus, setScanStatus] = useState<"working" | "done" | "error">("working");
  const [scanError, setScanError] = useState<string | null>(null);
  const [activeAssetDetails, setActiveAssetDetails] = useState<DiscoveredAssetItem | null>(null);
  const [showWhatWeKnow, setShowWhatWeKnow] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const runDiscoveryScan = useCallback(async () => {
    setScanStatus("working");
    setScanError(null);

    try {
      const res = await assetDiscoveryEngine.searchAllSources({
        claimantName: relationshipData.claimantName,
        deceasedName: relationshipData.deceasedName,
        relationship: relationshipData.relationship
      });

      if (res && res.results) {
        setAssets(res.results);
        setScanStatus("done");
        setSources(prev => prev.map(s => ({ ...s, status: "completed", label: "Completed" })));
      } else {
        setScanStatus("done");
      }
    } catch (err: any) {
      setScanStatus("error");
      setScanError(err?.message || "Failed to reach statutory discovery endpoints. Please try again.");
    }
  }, [relationshipData]);

  useEffect(() => {
    runDiscoveryScan();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [runDiscoveryScan]);

  return (
    <div className="min-h-screen bg-black text-[#E1E0CC] font-['Almarai'] selection:bg-white/20 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-black/85 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="text-xs text-white/50 hover:text-[#E1E0CC] transition-colors flex items-center gap-1.5 group cursor-pointer"
            >
              <span className="group-hover:text-white/80">← Home</span>
            </button>
            <span className="text-white/20">/</span>
            <span className="text-sm text-[#E1E0CC] font-medium">Asset Discovery Engine</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={onNavigateSources}
              className="px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-white/80 hover:text-white hover:border-white/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              Where We Look (/sources)
            </button>

            <button
              type="button"
              onClick={() => setShowWhatWeKnow(true)}
              className="px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              What WealthPass Knows
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 lg:py-14 space-y-12">
        {/* Verification & Relationship Status Banner */}
        <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6 sm:gap-10">
            <div>
              <div className="text-xs font-mono text-white/40 uppercase tracking-widest mb-1">Identity Token</div>
              <div className="text-sm text-emerald-400 font-mono font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {verificationResult.reference}
              </div>
            </div>

            <div>
              <div className="text-xs font-mono text-white/40 uppercase tracking-widest mb-1">Discovery Consent</div>
              <div className="text-sm text-white/90 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Active (v1.0)
              </div>
            </div>

            <div>
              <div className="text-xs font-mono text-white/40 uppercase tracking-widest mb-1">Claimant & Deceased</div>
              <div className="text-sm text-[#E1E0CC]">
                {relationshipData.claimantName} ({relationshipData.relationship}) → <span className="text-white/60">{relationshipData.deceasedName}</span>
              </div>
            </div>
          </div>

          <div className="px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-mono">
            INSTITUTIONAL VERIFICATION PENDING
          </div>
        </div>

        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono tracking-widest uppercase text-white/60 mb-3">
            <Search className="w-3.5 h-3.5 text-[#DEDBC8]" /> Multi-Source Channel Scanner
          </div>
          <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-[#E1E0CC] mb-3">
            Discover Potential <span className="font-['Instrument_Serif'] italic text-white">Assets</span>
          </h1>
          <p className="text-white/60 text-sm sm:text-base leading-relaxed">
            Searching public registries, dormant pools, and regulatory channels without scraping or compromising account secrets.
          </p>
        </div>

        {/* Unified Lattice Processing Panel */}
        <WealthPassProcessingPanel
          operation="ASSET_DISCOVERY"
          status={scanStatus}
          label={scanStatus === "working" ? "Querying statutory registries" : scanStatus === "error" ? "Query failed" : "Statutory queries completed"}
          description="Connecting to official regulatory discovery channels (RBI UDGAM, IRDAI Bima Bharosa, SEBI Mitra, IEPF) to trace inactive deposits, policy folios, and corporate dividends."
          subNotice="WealthPass guides institutional recovery under official mandates. We never maintain private banking keys or access credentials."
          errorMessage={scanError}
          onRetry={runDiscoveryScan}
          sources={sources}
        />

        {/* Discovered Potential Assets Cards (Part 15) */}
        {/* Discovered Potential Assets Cards */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-xl font-light text-[#E1E0CC]">
                Potential Asset Matches <span className="text-sm font-mono text-white/50">({assets.length} identified)</span>
              </h2>
              <p className="text-xs text-white/50 mt-1">
                Matches are indicative signals; actual recovery requires statutory documentation and institution approval.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#DEDBC8]">
              Estimated Pool: {assets.length > 0 ? `₹${assets.reduce((sum, a) => sum + (a.numericValue || 0), 0).toLocaleString('en-IN')}` : "Pending Institutional Query"}
            </div>
          </div>

          {assets.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#0e0e0e] border border-white/10 space-y-6 text-center max-w-2xl mx-auto">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-amber-300">
                <Landmark className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Statutory External Recovery Channels</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Bulk scraping or automated unauthorized querying of citizen financial data is strictly prohibited by RBI and regulatory mandates. To trace unclaimed deposits or insurance policies, access the official statutory portals below:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <a
                  href="https://udgam.rbi.org.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl border border-white/10 bg-black/60 hover:border-white/30 transition-all block group"
                >
                  <div className="text-xs font-medium text-white group-hover:text-amber-300 flex items-center justify-between">
                    <span>RBI UDGAM Portal</span>
                    <span className="text-[10px] text-white/40">↗</span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">Search unclaimed bank deposits across 30+ commercial banks.</p>
                </a>

                <a
                  href="https://bimabharosa.irdai.gov.in/Home/UnclaimedAmountsQuery"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl border border-white/10 bg-black/60 hover:border-white/30 transition-all block group"
                >
                  <div className="text-xs font-medium text-white group-hover:text-amber-300 flex items-center justify-between">
                    <span>IRDAI Bima Bharosa</span>
                    <span className="text-[10px] text-white/40">↗</span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">Trace unclaimed life and general insurance policy amounts.</p>
                </a>

                <a
                  href="https://app.mfcentral.com/links/inactive-folios"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl border border-white/10 bg-black/60 hover:border-white/30 transition-all block group"
                >
                  <div className="text-xs font-medium text-white group-hover:text-amber-300 flex items-center justify-between">
                    <span>SEBI / MF Central</span>
                    <span className="text-[10px] text-white/40">↗</span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">Trace dormant or inactive mutual fund folios via investor PAN.</p>
                </a>

                <a
                  href="https://www.iepf.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl border border-white/10 bg-black/60 hover:border-white/30 transition-all block group"
                >
                  <div className="text-xs font-medium text-white group-hover:text-amber-300 flex items-center justify-between">
                    <span>IEPF Authority (MCA)</span>
                    <span className="text-[10px] text-white/40">↗</span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">Recover unclaimed dividends and equity shares via Form IEPF-5.</p>
                </a>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNavigateSources}
                  className="text-xs text-white/70 hover:text-white underline underline-offset-4 cursor-pointer"
                >
                  View full source transparency and permitted identifiers →
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assets.map(asset => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0e0e0e] border border-white/10 rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-white/20 transition-all shadow-xl"
                >
                  <div>
                    {/* Top Tags */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-white/5 border border-white/10 text-white/70">
                        {asset.assetType}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-300">
                        {asset.status}
                      </span>
                    </div>

                    {/* Institution & Value */}
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-white mb-1">{asset.institution}</h3>
                      <div className="text-xs text-white/50 flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-[#DEDBC8]" />
                        Source: {asset.sourceName}
                      </div>
                    </div>

                    {/* Potential Value */}
                    <div className="p-4 rounded-xl bg-black/60 border border-white/10 mb-5">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-1">
                        Potential Value
                      </div>
                      <div className="text-2xl font-light font-['Instrument_Serif'] text-white">
                        {asset.potentialValue}
                      </div>
                    </div>

                    {/* Match Signals */}
                    {asset.matchSignals && asset.matchSignals.length > 0 && (
                      <div className="mb-5">
                        <div className="text-[11px] font-mono text-white/50 uppercase tracking-wider mb-2">
                          Match Signals:
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {asset.matchSignals.map((signal, sIdx) => (
                            <span key={sIdx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/5 text-white/80">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              {signal}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Legal Disclaimer Box */}
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs text-white/50 leading-relaxed mb-6">
                      <strong className="text-white/70">Important: </strong>
                      {asset.disclaimer}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveAssetDetails(asset)}
                      className="w-full sm:w-auto text-xs text-white/70 hover:text-white flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      How did we find this?
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectAssetForClaim(asset)}
                      className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-[#E1E0CC] hover:bg-white text-black font-medium text-xs transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      Start claim preparation
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Global Platform Disclaimer */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-white/60 leading-relaxed text-center max-w-3xl mx-auto">
          <strong className="text-white/80">Regulatory Notice: </strong>
          WealthPass is an automated discovery and recovery assistance layer. A potential match does not establish ownership or legal entitlement. Final verification, eligibility, and claim settlement are determined exclusively by the custodian institution and applicable Indian law.
        </div>
      </main>

      {/* "HOW DID WE FIND THIS?" MODAL (Part 16) */}
      <AnimatePresence>
        {activeAssetDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0e0e0e] border border-white/15 rounded-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div>
                  <h3 className="text-lg font-medium text-[#E1E0CC]">HOW WE FOUND THIS ASSET</h3>
                  <p className="text-xs text-white/50 mt-0.5">{activeAssetDetails.institution} — {activeAssetDetails.assetType}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveAssetDetails(null)}
                  className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 6 Step Flow */}
              <div className="space-y-4 mb-8">
                {activeAssetDetails.howFound.steps.map((st, i) => (
                  <div key={i} className="flex items-start gap-4 p-3.5 rounded-xl bg-black/50 border border-white/5">
                    <span className="font-['Instrument_Serif'] text-lg italic text-[#DEDBC8] shrink-0 w-6">
                      {st.step}
                    </span>
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wider text-white font-medium mb-0.5">
                        {st.title}
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">{st.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Data Used vs Data Not Stored Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs">
                <div className="p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20">
                  <div className="font-mono text-emerald-400 font-semibold uppercase mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> DATA USED
                  </div>
                  <ul className="space-y-1.5 text-white/70">
                    {(activeAssetDetails.howFound.dataUsed || []).map((d: string, dIdx: number) => (
                      <li key={dIdx}>• {d}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-red-500/[0.04] border border-red-500/20">
                  <div className="font-mono text-red-400 font-semibold uppercase mb-2 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> DATA NOT STORED
                  </div>
                  <ul className="space-y-1.5 text-white/70">
                    {(activeAssetDetails.howFound.dataNotStored || []).map((d: string, dIdx: number) => (
                      <li key={dIdx}>✕ {d}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const chosen = activeAssetDetails;
                    setActiveAssetDetails(null);
                    onSelectAssetForClaim(chosen);
                  }}
                  className="py-2.5 px-5 rounded-xl bg-[#E1E0CC] hover:bg-white text-black font-medium text-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Proceed with this asset
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* "WHAT WEALTHPASS KNOWS" PANEL (Part 17) */}
      <AnimatePresence>
        {showWhatWeKnow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0e0e0e] border border-white/15 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-[#E1E0CC]">WHAT WEALTHPASS KNOWS</h3>
                    <p className="text-xs text-white/50">Transparency Ledger & Active Data Minimization</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWhatWeKnow(false)}
                  className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs mb-8">
                <div className="p-3 rounded-xl bg-black/60 border border-white/5 flex items-center justify-between">
                  <span className="text-white/80 font-medium">Claimant Identity Status</span>
                  <span className="text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/60 border border-white/5 flex items-center justify-between">
                  <span className="text-white/80 font-medium">Full Aadhaar Number</span>
                  <span className="text-red-400 font-mono">✕ Not stored</span>
                </div>

                <div className="p-3 rounded-xl bg-black/60 border border-white/5 flex items-center justify-between">
                  <span className="text-white/80 font-medium">Aadhaar PDF / Image / Biometrics</span>
                  <span className="text-red-400 font-mono">✕ Not stored</span>
                </div>

                <div className="p-3 rounded-xl bg-black/60 border border-white/5 flex items-center justify-between">
                  <span className="text-white/80 font-medium">Verification Token Reference</span>
                  <span className="text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Stored ({verificationResult.reference})
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/60 border border-white/5 flex items-center justify-between">
                  <span className="text-white/80 font-medium">Explicit Discovery Consent</span>
                  <span className="text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Stored (v1.0)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/60 border border-white/5 flex items-center justify-between">
                  <span className="text-white/80 font-medium">Potential Asset Match Findings</span>
                  <span className="text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Stored in Session
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/60 border border-white/5 flex items-center justify-between">
                  <span className="text-white/80 font-medium">Full Bank Account / Demat Credentials</span>
                  <span className="text-red-400 font-mono">✕ Never stored or requested</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/60 leading-relaxed italic mb-6">
                "We don't need to store what we don't need. Your Aadhaar verifies you; it does not become our database."
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowWhatWeKnow(false)}
                  className="py-2 px-5 rounded-xl bg-[#E1E0CC] hover:bg-white text-black font-medium text-xs transition-all cursor-pointer"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
