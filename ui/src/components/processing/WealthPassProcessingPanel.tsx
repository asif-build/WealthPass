import React from "react";
import {
  Search, FileText, Users, ShieldCheck,
  AlertCircle, RefreshCw, X, ArrowRight,
  Landmark
} from "lucide-react";
import { LatticeLoader } from "../LatticeLoader/LatticeLoader";
import type { LatticeStatus } from "../LatticeLoader/LatticeLoader";

export type ProcessingOperation =
  | "ASSET_DISCOVERY"
  | "DOCUMENT_PROCESSING"
  | "RELATIONSHIP_ASSESSMENT"
  | "CLAIM_PREPARATION";

export interface SourceScanItem {
  id?: string;
  name: string;
  category?: string;
  status: "LIVE" | "CONNECTED" | "OFFICIAL_EXTERNAL_PROCESS" | "PROTOTYPE" | "NOT_CONFIGURED" | "FAILED" | "pending" | "scanning" | "completed";
  label?: string;
}

export interface ExtractedDocInfo {
  filename?: string;
  sizeBytes?: number;
  hasKeyword?: boolean;
  textPreview?: string;
}

export interface ChecklistItem {
  id: string;
  name: string;
  status: string;
  required?: boolean;
}

export interface WealthPassProcessingPanelProps {
  operation: ProcessingOperation;
  status: LatticeStatus;
  label: string;
  description?: string;
  subNotice?: string;
  startedAt?: number;
  errorMessage?: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  sources?: SourceScanItem[];
  extractedFields?: ExtractedDocInfo;
  checklist?: ChecklistItem[];
  children?: React.ReactNode;
  className?: string;
}

const OPERATION_METADATA: Record<ProcessingOperation, { title: string; subtitle: string; icon: React.FC<{ className?: string }>; badge: string }> = {
  ASSET_DISCOVERY: {
    title: "Statutory Asset Discovery",
    subtitle: "Searching official registries (RBI UDGAM, IRDAI Bima Bharosa, SEBI Mitra, IEPF).",
    icon: Search,
    badge: "MULTI-REGISTRY DISCOVERY"
  },
  DOCUMENT_PROCESSING: {
    title: "Uploaded Document OCR",
    subtitle: "Analyzing certificate structure and extracting institutional identifiers.",
    icon: FileText,
    badge: "OPTICAL TEXT EXTRACTION"
  },
  RELATIONSHIP_ASSESSMENT: {
    title: "Kinship Evidence Review",
    subtitle: "Assessing claimant kinship declaration against institutional evidence criteria.",
    icon: Users,
    badge: "RELATIONSHIP ADJUDICATION"
  },
  CLAIM_PREPARATION: {
    title: "Claim Dossier Assembly",
    subtitle: "Generating custodian checklists, legal heir mandates, and pre-filled statutory forms.",
    icon: ShieldCheck,
    badge: "STATUTORY DOSSIER GENERATION"
  }
};

export const WealthPassProcessingPanel: React.FC<WealthPassProcessingPanelProps> = ({
  operation,
  status,
  label,
  description,
  subNotice,
  errorMessage,
  onRetry,
  onCancel,
  onContinue,
  continueLabel = "Continue to Results",
  sources,
  extractedFields,
  checklist,
  children,
  className = ""
}) => {
  const meta = OPERATION_METADATA[operation];
  const Icon = meta.icon;

  const getSourceBadgeColor = (st: string) => {
    switch (st) {
      case "LIVE":
      case "CONNECTED":
      case "completed":
        return "bg-emerald-950/60 text-emerald-400 border-emerald-500/30";
      case "OFFICIAL_EXTERNAL_PROCESS":
        return "bg-blue-950/60 text-blue-300 border-blue-500/30";
      case "PROTOTYPE":
        return "bg-amber-950/60 text-amber-300 border-amber-500/30";
      case "scanning":
        return "bg-primary/20 text-primary border-primary/40 animate-pulse";
      case "FAILED":
        return "bg-red-950/60 text-red-300 border-red-500/30";
      case "NOT_CONFIGURED":
      default:
        return "bg-white/5 text-gray-400 border-white/10";
    }
  };

  return (
    <div
      className={`w-full bg-[#121212] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all text-left ${className}`}
      data-testid="wealthpass-processing-panel"
      data-operation={operation}
      data-status={status}
    >
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] tracking-[0.18em] uppercase font-mono text-primary font-semibold">
                {meta.badge}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.2 rounded-full border ${
                  status === "done"
                    ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30"
                    : status === "error"
                    ? "bg-red-950/60 text-red-300 border-red-500/30"
                    : "bg-primary/10 text-primary border-primary/30"
                }`}
              >
                {status === "done" ? "COMPLETED" : status === "error" ? "ERROR" : "PROCESSING"}
              </span>
            </div>
            <h3 className="text-lg font-medium text-white tracking-tight">
              {meta.title}
            </h3>
          </div>
        </div>

        {/* Unified React Bits LatticeLoader */}
        <div className="bg-black/60 px-4 py-2.5 rounded-2xl border border-white/10 self-start sm:self-auto shrink-0">
          <LatticeLoader
            status={status}
            label={label}
            doneLabel="Completed in"
            errorLabel="Failed after"
            pattern="orbit"
            grid={3}
            shape="round"
            color="#E5E1CF"
            doneColor="#4ADE80"
            errorColor="#F87171"
            cellSize={7}
            gap={3}
            fontSize={13}
            step={90}
            idleOpacity={0.15}
            glow={true}
            glowColor="#E5E1CF"
            showTimer={true}
          />
        </div>
      </div>

      {/* Description & Notice */}
      <div className="space-y-2 mb-6">
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
          {description || meta.subtitle}
        </p>
        {subNotice && (
          <p className="text-[11px] text-gray-400 leading-relaxed font-mono">
            {subNotice}
          </p>
        )}
      </div>

      {/* Operation Specific Content */}

      {/* 1. ASSET DISCOVERY: Sources Registry Grid */}
      {sources && sources.length > 0 && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>DISCOVERY SOURCES QUERIED</span>
            <span>{sources.filter(s => s.status === "completed" || s.status === "CONNECTED" || s.status === "OFFICIAL_EXTERNAL_PROCESS").length} / {sources.length} QUERIED</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {sources.map((s, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Landmark className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-xs font-medium text-gray-200 block truncate">
                      {s.name}
                    </span>
                    {s.category && (
                      <span className="text-[10px] text-gray-400 font-mono block">
                        {s.category}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border shrink-0 ${getSourceBadgeColor(s.status)}`}
                >
                  {s.label || s.status.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-gray-400 italic">
            * Statutory sources require authorized institutional review. WealthPass never claims private banking database custody.
          </p>
        </div>
      )}

      {/* 2. DOCUMENT PROCESSING: Extracted Fields Preview */}
      {extractedFields && (
        <div className="mb-6 p-4 rounded-xl bg-black/50 border border-white/10 space-y-2.5 text-xs font-mono">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[11px] text-gray-400">
            <span>OCR EXTRACTION AUDIT</span>
            <span>{extractedFields.filename || "Uploaded File"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-300">
            <div>
              <span className="text-gray-400 block text-[10px]">FILE SIZE:</span>
              <span>{extractedFields.sizeBytes ? `${(extractedFields.sizeBytes / 1024).toFixed(1)} KB` : "Document loaded"}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">CERTIFICATE KEYWORD:</span>
              <span className={extractedFields.hasKeyword ? "text-emerald-400 font-semibold" : "text-amber-400"}>
                {extractedFields.hasKeyword ? "✓ Detected in OCR text" : "Manual review advised"}
              </span>
            </div>
          </div>

          {extractedFields.textPreview && (
            <div className="pt-2 border-t border-white/5">
              <span className="text-gray-400 block text-[10px] mb-1">OCR EXTRACTED PREVIEW:</span>
              <p className="text-[11px] text-gray-300 bg-black/40 p-2.5 rounded-lg border border-white/5 leading-relaxed font-mono">
                {extractedFields.textPreview}
              </p>
            </div>
          )}

          <div className="pt-2 text-[10px] text-gray-400 leading-normal">
            Notice: OCR extraction confirms textual content. Official verification requires physical submission of certified documents.
          </div>
        </div>
      )}

      {/* 3. CLAIM PREPARATION: Generated Checklist Preview */}
      {checklist && checklist.length > 0 && (
        <div className="mb-6 space-y-2.5">
          <span className="text-xs font-mono text-gray-400 block">
            STATUTORY DOCUMENT CHECKLIST ({checklist.length} ITEMS)
          </span>
          <div className="space-y-1.5">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${item.status === "COMPLETED" ? "bg-emerald-400" : item.status === "IN_PROGRESS" ? "bg-amber-400" : "bg-gray-600"}`} />
                  <span className="text-gray-200">{item.name}</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    item.status === "COMPLETED"
                      ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30"
                      : item.status === "IN_PROGRESS"
                      ? "bg-amber-950/60 text-amber-300 border-amber-500/30"
                      : "bg-white/5 text-gray-400 border-white/10"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Any Custom Embedded Children */}
      {children}

      {/* Error Message Box */}
      {status === "error" && errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block font-medium">Processing Error</strong>
            <p className="leading-relaxed text-red-300/90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          {status === "error" && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-2 rounded-xl bg-primary text-black font-semibold text-xs uppercase tracking-wider hover:bg-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Operation</span>
            </button>
          )}

          {status === "working" && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-white/10 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>

        {status === "done" && onContinue && (
          <button
            type="button"
            onClick={onContinue}
            className="group px-5 py-2.5 rounded-full bg-primary text-black font-semibold text-xs uppercase tracking-wider hover:bg-white transition-all cursor-pointer flex items-center gap-2 shadow-lg ml-auto"
          >
            <span>{continueLabel}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};

export default WealthPassProcessingPanel;
