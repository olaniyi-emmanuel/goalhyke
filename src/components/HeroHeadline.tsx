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
    <div className="flex justify-center items-center w-full px-4 mt-6 sm:mt-10 lg:mt-14 overflow-x-clip max-w-full">
      <div className="w-full text-center relative">
        <h1
          className="font-black font-primary text-[#262525] tracking-[-0.03em]"
          style={{ fontSize: 'clamp(2rem, 7.2vw, 8.5rem)', lineHeight: 1.08 }}
        >
          {/* Line 1: Build New Habits. */}
          <span className="block mb-2 sm:mb-4 md:mb-5">Build New Habits.</span>

          {/* Line 2: Achieve [Bigger Goals. / Without Burnout.] */}
          <div className="inline-flex items-center justify-center gap-[0.15em] flex-wrap sm:flex-nowrap max-w-full">
            <span className="shrink-0">Achieve</span>
            <span className="relative inline-flex items-center justify-center px-[0.3em] py-[0.12em] rounded-[0.25em] bg-gradient-to-r from-[#eef2fa] to-[#f4f0ff] shadow-sm border border-[#7655fb]/10 z-10 shrink-0">
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

              {/* Sparkles — sized with em so they scale with the headline */}
              <Sparkle className="absolute -top-[0.15em] -left-[0.15em] text-[#FFB800] w-[0.22em] h-[0.22em] animate-pulse" />
              <Sparkle className="absolute -bottom-[0.1em] -left-[0.1em] text-[#FF4D4D] w-[0.17em] h-[0.17em] animate-bounce delay-100" />
              <Sparkle className="absolute -top-[0.1em] -right-[0.1em] text-[#FF4D4D] w-[0.17em] h-[0.17em] animate-pulse delay-75" />
              <Sparkle className="absolute -bottom-[0.15em] -right-[0.15em] text-[#FFB800] w-[0.2em] h-[0.2em] animate-bounce delay-150" />
            </span>
          </div>
        </h1>

        {/* Subheadline */}
        <p
          className="font-medium text-[#5e6677] font-secondary max-w-[54ch] mx-auto leading-relaxed px-2"
          style={{ fontSize: 'clamp(0.94rem, 1.8vw, 1.75rem)', marginTop: 'clamp(1.25rem, 2.5vw, 2.5rem)' }}
        >
          Lock stakes, stay accountable with peers &amp; referees, and turn ambition into daily consistency.
        </p>
      </div>
    </div>
  );
};

export default HeroHeadline;

