"use client";

import React, { useState, useEffect } from 'react';

const Sparkle = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 0L14.595 9.405L24 12L14.595 14.595L12 24L9.405 14.595L0 12L9.405 9.405L12 0Z"
      fill="currentColor"
    />
  </svg>
);

const badgePhrases = [
  { text: "Bigger Goals.", colorClass: "text-[#7655fb] font-extrabold" },
  { text: "Without Burnout.", colorClass: "bg-gradient-to-r from-[#7655fb] via-[#4169e1] to-[#ff4d4d] bg-clip-text text-transparent font-extrabold" },
];

const HeroHeadline = () => {
  const [index, setIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setIndex((prevIndex) => (prevIndex + 1) % badgePhrases.length);
        setIsFading(false);
      }, 350); // 350ms fade transition
    }, 3400); // Cycles every 3.4 seconds

    return () => clearInterval(interval);
  }, []);

  const currentBadge = badgePhrases[index];

  return (
    <div className="flex justify-center items-center w-full px-4 mt-[30px] lg:mt-[60px]">
      <div className="w-full max-w-[1000px] text-center relative">
        <h1 className="text-[38px] sm:text-[50px] md:text-[62px] lg:text-[74px] leading-[1.15] font-bold font-primary text-[#262525] tracking-tight">
          {/* Line 1: Build New Habits. */}
          <span className="block mb-2 md:mb-3">Build New Habits.</span>

          {/* Line 2: Achieve [Bigger Goals. / Without Burnout.] */}
          <div className="inline-flex items-center justify-center gap-2 sm:gap-4.5 flex-nowrap whitespace-nowrap max-w-full">
            <span className="shrink-0">Achieve</span>
            <span className="relative inline-flex items-center px-3.5 md:px-6 py-1 md:py-2 z-10 shrink-0 min-h-[54px] sm:min-h-[66px] md:min-h-[80px]">
              {/* Background Blob/Highlight */}
              <div className="absolute inset-0 bg-[#eef2fa] rounded-2xl -z-10 transform skew-x-[-2deg] skew-y-[1deg]"></div>

              {/* Animated Badge Text */}
              <span
                className={`transition-all duration-500 ease-out inline-block transform whitespace-nowrap ${
                  isFading
                    ? "opacity-0 translate-y-2 scale-95"
                    : "opacity-100 translate-y-0 scale-100"
                } ${currentBadge.colorClass}`}
              >
                {currentBadge.text}
              </span>

              {/* Sparkles */}
              <Sparkle className="absolute -top-3 -left-3 md:-top-5 md:-left-6 text-[#FFB800] w-4 h-4 md:w-6 md:h-6 animate-pulse" />
              <Sparkle className="absolute -bottom-2 -left-1 md:-bottom-3 md:-left-2 text-[#FF4D4D] w-3 h-3 md:w-5 md:h-5 animate-bounce delay-100" />
              <Sparkle className="absolute -top-1 -right-2 md:-top-2 md:-right-3 text-[#FF4D4D] w-3 h-3 md:w-4 md:h-4 animate-pulse delay-75" />
              <Sparkle className="absolute -bottom-3 -right-3 md:-bottom-5 md:-right-6 text-[#FFB800] w-4 h-4 md:w-5 md:h-5 animate-bounce delay-150" />
            </span>
          </div>
        </h1>

        {/* Subheadline */}
        <p className="mt-5 text-[17px] sm:text-[19px] md:text-[21px] text-[#5e6677] font-secondary max-w-[760px] mx-auto leading-relaxed px-2">
          Lock stakes, stay accountable with peers &amp; referees, and turn ambition into daily consistency.
        </p>
      </div>
    </div>
  );
};

export default HeroHeadline;
