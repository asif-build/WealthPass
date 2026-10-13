import React, { useId } from "react";

export interface ClaimSuccessBadgeProps {
  /**
   * Outer dimension (width/height) in pixels.
   * Responsive default: 156px on desktop, 120px on mobile.
   */
  size?: number | string;
  className?: string;
  /**
   * If true, disables the intro entrance animation and renders the static final badge.
   */
  disableAnimation?: boolean;
}

/**
 * ClaimSuccessBadge
 *
 * A premium 3D verification seal with 12 soft, inflated lobes,
 * rich multi-stop blue dimensional lighting, and a thick, raised white checkmark.
 *
 * Renders on a strictly transparent SVG canvas with zero background frames,
 * discs, or rectangular containers. Optimized for WealthPass's pitch-black background.
 */
export const ClaimSuccessBadge: React.FC<ClaimSuccessBadgeProps> = ({
  size = 156,
  className = "",
  disableAnimation = false,
}) => {
  const uniqueId = useId().replace(/:/g, "_");

  // 12-lobed smoothly curved scalloped silhouette (viewBox: 0 0 256 256, center: 128, 128)
  const SCALLOP_PATH =
    "M 128.00 14.00 C 143.47 14.00, 136.61 36.10, 151.55 40.10 " +
    "C 166.49 44.10, 171.60 21.54, 185.00 29.27 " +
    "C 198.40 37.01, 181.41 52.72, 192.35 63.65 " +
    "C 203.28 74.59, 218.99 57.60, 226.73 71.00 " +
    "C 234.46 84.40, 211.90 89.51, 215.90 104.45 " +
    "C 219.90 119.39, 242.00 112.53, 242.00 128.00 " +
    "C 242.00 143.47, 219.90 136.61, 215.90 151.55 " +
    "C 211.90 166.49, 234.46 171.60, 226.73 185.00 " +
    "C 218.99 198.40, 203.28 181.41, 192.35 192.35 " +
    "C 181.41 203.28, 198.40 218.99, 185.00 226.73 " +
    "C 171.60 234.46, 166.49 211.90, 151.55 215.90 " +
    "C 136.61 219.90, 143.47 242.00, 128.00 242.00 " +
    "C 112.53 242.00, 119.39 219.90, 104.45 215.90 " +
    "C 89.51 211.90, 84.40 234.46, 71.00 226.73 " +
    "C 57.60 218.99, 74.59 203.28, 63.65 192.35 " +
    "C 52.72 181.41, 37.01 198.40, 29.27 185.00 " +
    "C 21.54 171.60, 44.10 166.49, 40.10 151.55 " +
    "C 36.10 136.61, 14.00 143.47, 14.00 128.00 " +
    "C 14.00 112.53, 36.10 119.39, 40.10 104.45 " +
    "C 44.10 89.51, 21.54 84.40, 29.27 71.00 " +
    "C 37.01 57.60, 52.72 74.59, 63.65 63.65 " +
    "C 74.59 52.72, 57.60 37.01, 71.00 29.27 " +
    "C 84.40 21.54, 89.51 44.10, 104.45 40.10 " +
    "C 119.39 36.10, 112.53 14.00, 128.00 14.00 Z";

  // Thick, balanced, optically centered checkmark coordinates
  const CHECK_PATH = "M 91 130 L 116 157 L 166 98";

  const filterShadowId = `badgeShadow_${uniqueId}`;
  const gradBaseId = `badgeBase_${uniqueId}`;
  const gradPillowId = `badgePillow_${uniqueId}`;
  const gradDepthId = `badgeDepth_${uniqueId}`;
  const gradRimId = `badgeRim_${uniqueId}`;
  const gradCheckId = `checkGrad_${uniqueId}`;
  const filterCheckShadowId = `checkShadow_${uniqueId}`;

  return (
    <div
      className={`inline-flex items-center justify-center relative select-none ${className}`}
      style={{
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
      }}
    >
      <style>{`
        /* 5-Phase Animation (Total duration: 1.6s) */
        @keyframes wpSealEntrance_${uniqueId} {
          /* Phase 1: Appear (0ms to 250ms) */
          0% {
            opacity: 0;
            transform: scale(0.65) rotate(0deg);
          }
          15.6% {
            opacity: 1;
            transform: scale(1.0) rotate(0deg);
          }
          /* Phase 2: Soft Expansion (250ms to 600ms) */
          37.5% {
            opacity: 1;
            transform: scale(1.06) rotate(3deg);
          }
          /* Phase 3: Settle (600ms to 950ms) */
          59.4% {
            opacity: 1;
            transform: scale(1.0) rotate(0deg);
          }
          /* Phase 5: Final Settled State (1000ms to 1600ms) */
          100% {
            opacity: 1;
            transform: scale(1.0) rotate(0deg);
          }
        }

        /* Phase 4: Checkmark Reveal (Starts after seal begins settling at ~720ms, draws over 400ms) */
        @keyframes wpCheckmarkDraw_${uniqueId} {
          0%, 45% {
            stroke-dashoffset: 130;
            opacity: 0;
          }
          48% {
            opacity: 1;
          }
          75% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        /* Checkmark shadow reveal */
        @keyframes wpCheckShadowDraw_${uniqueId} {
          0%, 45% {
            stroke-dashoffset: 130;
            opacity: 0;
          }
          50% {
            opacity: 0.35;
          }
          75%, 100% {
            stroke-dashoffset: 0;
            opacity: 0.35;
          }
        }

        .wp-seal-anim-${uniqueId} {
          transform-origin: 128px 128px;
          animation: wpSealEntrance_${uniqueId} 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .wp-check-anim-${uniqueId} {
          stroke-dasharray: 130;
          stroke-dashoffset: 0;
          animation: wpCheckmarkDraw_${uniqueId} 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .wp-check-shadow-anim-${uniqueId} {
          stroke-dasharray: 130;
          stroke-dashoffset: 0;
          animation: wpCheckShadowDraw_${uniqueId} 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .wp-seal-anim-${uniqueId},
          .wp-check-anim-${uniqueId},
          .wp-check-shadow-anim-${uniqueId} {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            stroke-dashoffset: 0 !important;
          }
        }
      `}</style>

      <svg
        viewBox="0 0 256 256"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
        aria-label="Claim Verification Seal"
        role="img"
      >
        <defs>
          {/* Ambient Blue Edge Separation Filter on Black Background */}
          <filter
            id={filterShadowId}
            x="-20%"
            y="-20%"
            width="140%"
            height="145%"
            filterUnits="userSpaceOnUse"
          >
            {/* Deep rich ambient blue aura for clear contrast against #000000 */}
            <feDropShadow
              dx="0"
              dy="10"
              stdDeviation="14"
              floodColor="#1243B7"
              floodOpacity="0.5"
            />
            {/* Grounding contact shadow */}
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="6"
              floodColor="#07194A"
              floodOpacity="0.65"
            />
          </filter>

          {/* Directional 3D Material Gradient (Top-Left Highlight to Lower-Right Shadow) */}
          <linearGradient
            id={gradBaseId}
            x1="30"
            y1="20"
            x2="226"
            y2="236"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#65A0FF" />
            <stop offset="28%" stopColor="#3478F6" />
            <stop offset="65%" stopColor="#2468E8" />
            <stop offset="100%" stopColor="#1243B7" />
          </linearGradient>

          {/* Upper-Left Inflated Specular Dome */}
          <radialGradient
            id={gradPillowId}
            cx="96"
            cy="88"
            r="110"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="35%" stopColor="#65A0FF" stopOpacity="0.25" />
            <stop offset="70%" stopColor="#3478F6" stopOpacity="0" />
            <stop offset="100%" stopColor="#1243B7" stopOpacity="0" />
          </radialGradient>

          {/* Bottom-Right Underside Dimensional Depth Shading */}
          <radialGradient
            id={gradDepthId}
            cx="170"
            cy="180"
            r="105"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#0B2368" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#1243B7" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#1243B7" stopOpacity="0" />
          </radialGradient>

          {/* Subtle Perimeter Bevel Highlight */}
          <linearGradient
            id={gradRimId}
            x1="40"
            y1="20"
            x2="216"
            y2="236"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="30%" stopColor="#65A0FF" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#1243B7" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#0A1F5C" stopOpacity="0.4" />
          </linearGradient>

          {/* Checkmark Solid White Surface Gradient */}
          <linearGradient
            id={gradCheckId}
            x1="91"
            y1="98"
            x2="166"
            y2="157"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F5F7FD" />
          </linearGradient>

          {/* Checkmark 3D Raised Elevation Drop Shadow */}
          <filter id={filterCheckShadowId} x="-25%" y="-25%" width="150%" height="155%">
            <feDropShadow
              dx="0"
              dy="3.5"
              stdDeviation="3"
              floodColor="#0A2260"
              floodOpacity="0.5"
            />
          </filter>
        </defs>

        {/* Animated Badge Group */}
        <g className={!disableAnimation ? `wp-seal-anim-${uniqueId}` : ""}>
          {/* 1. Base 12-Lobed Scalloped Badge with Ambient Blue Shadow */}
          <path
            d={SCALLOP_PATH}
            fill={`url(#${gradBaseId})`}
            filter={`url(#${filterShadowId})`}
          />

          {/* 2. Soft Inflated 3D Specular Highlight Dome */}
          <path d={SCALLOP_PATH} fill={`url(#${gradPillowId})`} />

          {/* 3. Bottom-Right Dimensional Underside Shading */}
          <path d={SCALLOP_PATH} fill={`url(#${gradDepthId})`} />

          {/* 4. Subtle Perimeter Bevel Rim */}
          <path
            d={SCALLOP_PATH}
            fill="none"
            stroke={`url(#${gradRimId})`}
            strokeWidth="1.5"
            opacity="0.65"
          />

          {/* 5. Dimensional Raised Shadow beneath the White Checkmark */}
          <path
            d="M 91 133 L 116 160 L 166 101"
            fill="none"
            stroke="#0C2569"
            strokeWidth="25"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.35"
            className={!disableAnimation ? `wp-check-shadow-anim-${uniqueId}` : ""}
          />

          {/* 6. Thick Raised White Checkmark */}
          <path
            d={CHECK_PATH}
            fill="none"
            stroke={`url(#${gradCheckId})`}
            strokeWidth="25"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${filterCheckShadowId})`}
            className={!disableAnimation ? `wp-check-anim-${uniqueId}` : ""}
          />
        </g>
      </svg>
    </div>
  );
};

export default ClaimSuccessBadge;
