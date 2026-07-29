import React from "react";

interface GoalRecommendationsBannerProps {
  planTypeLabel?: string;
  text?: string;
  className?: string;
}

export const GoalRecommendationsBanner: React.FC<GoalRecommendationsBannerProps> = ({
  planTypeLabel = "For standard Plan",
  text = "Goal hyke recommendations if you need an inspiration on setting target volume size",
  className = "",
}) => {
  return (
    <div
      className={`w-full rounded-[18px] bg-[#3b82f6] text-white p-5 md:p-6 shadow-[0_10px_30px_rgba(59,130,246,0.25)] flex flex-col sm:flex-row items-center sm:items-start gap-4 transition-all duration-300 ${className}`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-white shadow-inner">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      </div>
      <div className="flex flex-col text-center sm:text-left gap-1">
        <span className="inline-block w-fit rounded-full bg-white/25 px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase backdrop-blur-sm">
          {planTypeLabel}
        </span>
        <p className="text-sm md:text-base font-medium leading-snug text-white/95 mt-1 font-secondary">
          {text}
        </p>
      </div>
    </div>
  );
};

export default GoalRecommendationsBanner;
