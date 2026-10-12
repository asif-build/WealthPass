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
    { id: "RBI_UDGAM", name: "RBI UDGAM", category: "BANK DEPOSITS", status: "OFFICIAL_EXTERNAL_PROCESS", label: "Central Bank Portal" },
    { id: "IRDAI_BIMA_BHAROSA", name: "IRDAI Bima Bharosa", category: "INSURANCE", status: "OFFICIAL_EXTERNAL_PROCESS", label: "IRDAI Statutory Registry" },
    { id: "SEBI_MITRA", name: "SEBI MITRA & MF Central", category: "MUTUAL FUNDS", status: "OFFICIAL_EXTERNAL_PROCESS", label: "RTA Tracing (SEBI 2025)" },
    { id: "IEPF", name: "IEPF Authority (MCA21)", category: "SHARES & DIVIDENDS", status: "OFFICIAL_EXTERNAL_PROCESS", label: "IEPF-5 MCA Portal" },
    { id: "EPFO_SERVICES", name: "EPFO Services", category: "EPF & PENSION", status: "OFFICIAL_EXTERNAL_PROCESS", label: "EPFO Member Registry" },
    { id: "OTHER_INVESTMENTS", name: "Post Office Small Savings & NPS", category: "OTHER INVESTMENTS", status: "OFFICIAL_EXTERNAL_PROCESS", label: "POSB & CRA Portal" }
  ]);

  const [assets, setAssets] = useState<DiscoveredAssetItem[]>([]);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<"working" | "done" | "error">("working");
  const [scanError, setScanError] = useState<string | null>(null);
  const [activeAssetDetails, setActiveAssetDetails] = useState<DiscoveredAssetItem | null>(null);
  const [showWhatWeKnow, setShowWhatWeKnow] = useState(false);

  // External Reference Recording Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordSourceId, setRecordSourceId] = useState("RBI_UDGAM");
  const [recordRefNo, setRecordRefNo] = useState("");
  const [recordInstitution, setRecordInstitution] = useState("");
  const [recordCategory, setRecordCategory] = useState("BANK_DEPOSITS");
  const [isRecording, setIsRecording] = useState(false);
  const [recordSuccess, setRecordSuccess] = useState<string | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);

  // Partner Bridge Financing State
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false);
  const [bridgeConsent1, setBridgeConsent1] = useState(false);
  const [bridgeConsent2, setBridgeConsent2] = useState(false);
  const [isApplyingBridge, setIsApplyingBridge] = useState(false);
  const [bridgeSuccess, setBridgeSuccess] = useState<string | null>(null);
  const [bridgeError, setBridgeError] = useState<string | null>(null);

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

      if (res) {
        if (res.case_id) setCaseId(res.case_id);
        if (res.results) setAssets(res.results);

        if (res.sources_scanned && res.sources_scanned.length > 0) {
          setSources(res.sources_scanned.map(s => ({
            id: s.id,
            name: s.name,
            category: s.category,
            status: s.status === 'COMPLETED' ? 'completed' : s.status === 'IN_PROGRESS' ? 'scanning' : (s.integration_status as any || 'OFFICIAL_EXTERNAL_PROCESS'),
            label: s.integration_status === 'LIVE' ? 'LIVE GATEWAY' : s.integration_status === 'SANDBOX' ? 'SANDBOX' : 'OFFICIAL EXTERNAL PROCESS'
          })));
        }
        setScanStatus("done");
      }
    } catch (err: any) {
      setScanStatus("error");
      setScanError(err?.message || "Failed to reach statutory discovery endpoints. Please try again.");
    }
  }, [relationshipData]);

  const handleRecordExternalReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordRefNo.trim()) {
      setRecordError("Please enter the official reference number or search token.");
      return;
    }
    if (!caseId) {
      setRecordError("Active discovery case required. Please submit case intake first.");
      return;
    }

    setIsRecording(true);
    setRecordError(null);
    setRecordSuccess(null);

    try {
      await assetDiscoveryEngine.recordExternalReference({
        caseId: caseId,
        sourceId: recordSourceId,
        externalReferenceNumber: recordRefNo.trim(),
        institutionName: recordInstitution.trim() || undefined,
        assetCategory: recordCategory
      });

      setRecordSuccess(`Official search reference ${recordRefNo.trim()} recorded successfully.`);
      setTimeout(() => {
        setIsRecordModalOpen(false);
        setRecordRefNo("");
        setRecordInstitution("");
        setRecordSuccess(null);
        runDiscoveryScan();
      }, 1500);
    } catch (err: any) {
      setRecordError(err?.message || "Failed to record search reference.");
    } finally {
      setIsRecording(false);
    }
  };

  const handleApplyBridgeLiquidity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bridgeConsent1 || !bridgeConsent2) {
      setBridgeError("Please accept the statutory partner consent disclosures.");
      return;
    }
    if (!caseId) {
      setBridgeError("An active discovery case with identified assets is required.");
      return;
    }

    setIsApplyingBridge(true);
    setBridgeError(null);
    setBridgeSuccess(null);

    try {
      const res = await assetDiscoveryEngine.applyBridgeLiquidity({
        caseId: caseId,
        consentPartnership: bridgeConsent1,
        consentUnderwriting: bridgeConsent2
      });

      setBridgeSuccess(res.message || "Financing application submitted to regulated lending partner.");
      setTimeout(() => {
        setIsBridgeModalOpen(false);
        setBridgeSuccess(null);
      }, 2500);
    } catch (err: any) {
      setBridgeError(err?.message || "Application submission failed. Please try again.");
    } finally {
      setIsApplyingBridge(false);
    }
  };

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl font-light text-[#E1E0CC]">
                Potential Asset Matches <span className="text-sm font-mono text-white/50">({assets.length} identified)</span>
              </h2>
              <p className="text-xs text-white/50 mt-1">
                Matches are indicative signals; actual recovery requires statutory documentation and institution approval.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(true)}
                className="px-3.5 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>+ Record Portal Reference</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBridgeModalOpen(true)}
                className="px-3.5 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Partner Financing</span>
              </button>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#DEDBC8]">
                Pool: {assets.length > 0 ? `₹${assets.reduce((sum, a) => sum + (a.numericValue || 0), 0).toLocaleString('en-IN')}` : "Pending Verification"}
              </div>
            </div>
          </div>

          {assets.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#0e0e0e] border border-white/10 space-y-6 text-center max-w-3xl mx-auto">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-amber-300">
                <Landmark className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Statutory External Recovery Channels</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Bulk scraping or unauthorized automated querying of citizen financial data is prohibited by RBI, IRDAI and SEBI regulations. WealthPass provides guided statutory pathways. Search official registries below and record your reference number:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
                <a
                  href="https://udgam.rbi.org.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl border border-white/10 bg-black/60 hover:border-white/30 transition-all block group"
                >
                  <div className="text-xs font-medium text-white group-hover:text-amber-300 flex items-center justify-between">
                    <span>RBI UDGAM</span>
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
                    <span>SEBI MITRA & MF Central</span>
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

                <a
                  href="https://www.epfindia.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl border border-white/10 bg-black/60 hover:border-white/30 transition-all block group"
                >
                  <div className="text-xs font-medium text-white group-hover:text-amber-300 flex items-center justify-between">
                    <span>EPFO Member Portal</span>
                    <span className="text-[10px] text-white/40">↗</span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">Trace inoperative EPF balances, EPS pensions, and EDLI life assurance.</p>
                </a>

                <a
                  href="https://www.indiapost.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl border border-white/10 bg-black/60 hover:border-white/30 transition-all block group"
                >
                  <div className="text-xs font-medium text-white group-hover:text-amber-300 flex items-center justify-between">
                    <span>Post Office & NPS</span>
                    <span className="text-[10px] text-white/40">↗</span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">Recover Post Office Small Savings (PPF, NSC) & PFRDA CRA NPS accounts.</p>
                </a>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-primary text-black font-semibold text-xs hover:bg-white transition-all cursor-pointer shadow-md"
                >
                  + Record Reference from Official Search
                </button>
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

      {/* RECORD EXTERNAL SEARCH REFERENCE MODAL */}
      <AnimatePresence>
        {isRecordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0e0e0e] border border-white/15 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <div>
                  <h3 className="text-lg font-medium text-[#E1E0CC]">RECORD OFFICIAL PORTAL REFERENCE</h3>
                  <p className="text-xs text-white/50 mt-0.5">Attach your statutory search acknowledgment to this case dossier</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {recordError && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                  {recordError}
                </div>
              )}
              {recordSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300">
                  {recordSuccess}
                </div>
              )}

              <form onSubmit={handleRecordExternalReference} className="space-y-4 text-xs">
                <div>
                  <label className="text-white/70 block mb-1 font-medium">Statutory Portal / Source *</label>
                  <select
                    value={recordSourceId}
                    onChange={(e) => {
                      setRecordSourceId(e.target.value);
                      if (e.target.value === "RBI_UDGAM") setRecordCategory("BANK_DEPOSITS");
                      else if (e.target.value === "IRDAI_BIMA_BHAROSA") setRecordCategory("INSURANCE");
                      else if (e.target.value === "SEBI_MITRA") setRecordCategory("MUTUAL_FUNDS");
                      else if (e.target.value === "IEPF") setRecordCategory("SHARES_DIVIDENDS");
                      else if (e.target.value === "EPFO_SERVICES") setRecordCategory("PENSION_EPFO");
                      else if (e.target.value === "OTHER_INVESTMENTS") setRecordCategory("OTHER_INVESTMENTS");
                    }}
                    className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#E1E0CC] focus:outline-none focus:border-primary/60"
                  >
                    <option value="RBI_UDGAM">RBI UDGAM (Unclaimed Bank Deposits)</option>
                    <option value="IRDAI_BIMA_BHAROSA">IRDAI Bima Bharosa (Unclaimed Insurance Policies)</option>
                    <option value="SEBI_MITRA">SEBI MITRA &amp; MF Central (Inactive Mutual Funds)</option>
                    <option value="IEPF">IEPF Authority (Shares &amp; Unpaid Dividends - Form IEPF-5)</option>
                    <option value="EPFO_SERVICES">EPFO Services (Provident Fund &amp; EDLI)</option>
                    <option value="OTHER_INVESTMENTS">Post Office Small Savings &amp; NPS PRAN</option>
                  </select>
                </div>

                <div>
                  <label className="text-white/70 block mb-1 font-medium">Official Reference Number / SRN / Token *</label>
                  <input
                    type="text"
                    required
                    value={recordRefNo}
                    onChange={(e) => setRecordRefNo(e.target.value)}
                    placeholder="e.g. UDGAM/2024/78219 or BB-882109 or IEPF SRN"
                    className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-3 py-2.5 text-sm font-mono text-[#E1E0CC] focus:outline-none focus:border-primary/60"
                  />
                  <span className="text-[10px] text-white/40 mt-1 block">
                    Issued directly on the official government or regulator portal after query completion.
                  </span>
                </div>

                <div>
                  <label className="text-white/70 block mb-1 font-medium">Holding Institution / Bank / Insurer Name (Optional)</label>
                  <input
                    type="text"
                    value={recordInstitution}
                    onChange={(e) => setRecordInstitution(e.target.value)}
                    placeholder="e.g. State Bank of India, LIC of India, HDFC AMC"
                    className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#E1E0CC] focus:outline-none focus:border-primary/60"
                  />
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-[11px] text-white/50 leading-relaxed">
                  <strong>Truthful Audit Commitment: </strong>
                  WealthPass does not fabricate asset balances. Submitting an external reference establishes an official potential match with unverified valuation pending institution branch verification.
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsRecordModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRecording}
                    className="px-5 py-2.5 rounded-xl bg-primary text-black font-semibold uppercase tracking-wider text-xs hover:bg-white disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isRecording ? "Saving..." : "Save Reference"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REGULATED PARTNER FINANCING MODAL */}
      <AnimatePresence>
        {isBridgeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0e0e0e] border border-white/15 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <div>
                  <h3 className="text-lg font-medium text-white">EMERGENCY BRIDGE LIQUIDITY ASSISTANCE</h3>
                  <p className="text-xs text-white/50 mt-0.5">Financing pathway provided exclusively through regulated partner entities</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBridgeModalOpen(false)}
                  className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {bridgeError && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                  {bridgeError}
                </div>
              )}
              {bridgeSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300">
                  {bridgeSuccess}
                </div>
              )}

              <form onSubmit={handleApplyBridgeLiquidity} className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-purple-200/90 leading-relaxed space-y-2">
                  <div className="font-semibold text-purple-300 uppercase tracking-wider text-[11px]">
                    Statutory Regulatory Disclosure
                  </div>
                  <p>
                    WealthPass is a technology discovery platform and is NOT a bank, Non-Banking Financial Company (NBFC), or money lender.
                  </p>
                  <p>
                    Any emergency liquidity advance against verified deceased estate claims is underwritten, disbursed, and serviced independently by RBI-regulated NBFC/banking lending partners subject to their statutory credit policies.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer text-white/70">
                    <input
                      type="checkbox"
                      checked={bridgeConsent1}
                      onChange={(e) => setBridgeConsent1(e.target.checked)}
                      className="accent-primary rounded mt-0.5 cursor-pointer"
                    />
                    <span>
                      I authorize WealthPass to securely share my verified case dossier with regulated lending partner Northern Arc Capital / Partner NBFC for eligibility assessment.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-white/70">
                    <input
                      type="checkbox"
                      checked={bridgeConsent2}
                      onChange={(e) => setBridgeConsent2(e.target.checked)}
                      className="accent-primary rounded mt-0.5 cursor-pointer"
                    />
                    <span>
                      I understand that approval is not guaranteed, and advances are contingent on institution verification of legal heirship.
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsBridgeModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isApplyingBridge || !bridgeConsent1 || !bridgeConsent2}
                    className="px-5 py-2.5 rounded-xl bg-primary text-black font-semibold uppercase tracking-wider text-xs hover:bg-white disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isApplyingBridge ? "Submitting..." : "Submit Partner Application"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
