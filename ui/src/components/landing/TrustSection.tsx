import React from "react";
import { ShieldCheck, Landmark, Lock, CheckCircle } from "lucide-react";

export const TrustSection: React.FC = () => {
  return (
    <section
      id="trust-process"
      className="bg-[#F5F8FC] px-6 py-12 border-y border-[#DFE7F1]"
      aria-label="Trusted Financial Standards"
    >
      <div className="max-w-[88rem] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#E5EFFD] text-[#174EA6] flex items-center justify-center shrink-0 mt-0.5">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#0B1F3A]">RBI Standard Forms</h4>
              <p className="text-xs text-[#65758B] mt-0.5 leading-relaxed">
                Annexure I-A to I-H compliant with RBI 2025/26 deceased depositor rules.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#E5EFFD] text-[#174EA6] flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#0B1F3A]">Statutory Sources</h4>
              <p className="text-xs text-[#65758B] mt-0.5 leading-relaxed">
                Direct verified guidance from RBI UDGAM, IRDAI, SEBI, and EPFO.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#E5EFFD] text-[#174EA6] flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#0B1F3A]">Privacy-First Design</h4>
              <p className="text-xs text-[#65758B] mt-0.5 leading-relaxed">
                Your family data is protected with 256-bit encryption. Never sold.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#E5EFFD] text-[#174EA6] flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#0B1F3A]">No Hidden Bureaucracy</h4>
              <p className="text-xs text-[#65758B] mt-0.5 leading-relaxed">
                Clear checklists and step-by-step branch submission instructions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
