import React from "react";
import { ArrowLeft } from "lucide-react";

interface AuthSplitLayoutProps {
  children: React.ReactNode;
  onNavigate: (path: string) => void;
}

export const AuthSplitLayout: React.FC<AuthSplitLayoutProps> = ({
  children,
  onNavigate,
}) => {
  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-[#E1E0CC] flex flex-col justify-between items-center px-4 py-6 sm:py-10 font-['Almarai'] selection:bg-primary selection:text-black">
      
      {/* Minimal Top Navigation (No Logo) */}
      <header className="w-full max-w-md flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={() => onNavigate("/")}
          className="group flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Home</span>
        </button>
      </header>

      {/* Centered Minimal Authentication Card */}
      <main className="w-full max-w-md my-auto flex justify-center">
        {children}
      </main>

      {/* Minimal Footer */}
      <footer className="w-full max-w-md mt-6 sm:mt-8 pt-4 text-center text-xs text-gray-500 flex justify-center items-center gap-4 border-t border-white/5">
        <a
          href="/terms"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("/terms");
          }}
          className="hover:text-primary transition-colors cursor-pointer"
        >
          Terms &amp; Conditions
        </a>
        <span className="text-white/20">•</span>
        <a
          href="/privacy-policy"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("/privacy-policy");
          }}
          className="hover:text-primary transition-colors cursor-pointer"
        >
          Privacy Policy
        </a>
      </footer>

    </div>
  );
};

export const AuthLayout = AuthSplitLayout;
