import React from "react";

interface MarqueeTrackProps {
  items: string[];
  durationSeconds?: number;
  itemClassName?: string;
  dotClassName?: string;
  className?: string;
  pauseOnHover?: boolean;
}

export const MarqueeTrack: React.FC<MarqueeTrackProps> = ({
  items,
  durationSeconds = 22,
  itemClassName = "text-sm md:text-base font-normal tracking-wide text-slate-600",
  dotClassName = "w-1.5 h-1.5 rounded-full bg-[#367BF5]/60 mx-5 shrink-0",
  className = "w-full overflow-hidden select-none py-2",
  pauseOnHover = true,
}) => {
  return (
    <div
      className={`group relative overflow-hidden ${className}`}
      role="region"
      aria-label="Features and principles marquee"
    >
      <div
        className={`flex w-max items-center ${pauseOnHover ? "hover:[animation-play-state:paused]" : ""}`}
        style={{
          animation: `wp-marquee ${durationSeconds}s linear infinite`,
        }}
      >
        {/* First set of items */}
        <div className="flex shrink-0 items-center">
          {items.map((item, idx) => (
            <React.Fragment key={`first-${idx}`}>
              <span className={`shrink-0 whitespace-nowrap ${itemClassName}`}>
                {item}
              </span>
              <span className={dotClassName} aria-hidden="true" />
            </React.Fragment>
          ))}
        </div>

        {/* Second duplicated set of items for seamless loop */}
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {items.map((item, idx) => (
            <React.Fragment key={`dup-${idx}`}>
              <span className={`shrink-0 whitespace-nowrap ${itemClassName}`}>
                {item}
              </span>
              <span className={dotClassName} aria-hidden="true" />
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
