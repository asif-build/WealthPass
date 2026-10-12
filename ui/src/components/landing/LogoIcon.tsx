import React from "react";

interface LogoIconProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  isDark?: boolean;
}

export const LogoIcon: React.FC<LogoIconProps> = ({
  className = "flex items-center gap-2.5",
  iconClassName = "w-8 h-8 text-[#174EA6]",
  textClassName = "text-xl font-semibold tracking-tight text-[#0B1F3A]",
  isDark = false,
}) => {
  return (
    <div className={className}>
      <svg
        className={iconClassName}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Outer pass badge geometry */}
        <rect
          x="3"
          y="4"
          width="30"
          height="28"
          rx="7"
          className={isDark ? "fill-white/10 stroke-white/20" : "fill-[#E5EFFD] stroke-[#DFE7F1]"}
          strokeWidth="1.5"
        />
        {/* Inner vault fold / pass lines */}
        <path
          d="M10 13H26"
          className={isDark ? "stroke-white" : "stroke-[#174EA6]"}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M10 18H21"
          className={isDark ? "stroke-white/80" : "stroke-[#367BF5]"}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M10 23H17"
          className={isDark ? "stroke-white/60" : "stroke-[#174EA6]/70"}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Verified security pip */}
        <circle
          cx="25"
          cy="22"
          r="2.5"
          className={isDark ? "fill-white" : "fill-[#174EA6]"}
        />
      </svg>
      <span className={textClassName}>WealthPass</span>
    </div>
  );
};
