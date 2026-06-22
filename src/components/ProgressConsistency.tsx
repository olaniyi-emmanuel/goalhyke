"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

const ProgressConsistency = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      ref={ref}
      className={`w-full max-w-[960px] mx-auto bg-[#7152ed] rounded-[10px] overflow-hidden flex flex-col-reverse lg:flex-row min-h-[280px] transition-all duration-[1000ms] ease-out ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
      }`}
    >
      {/* Left Section - Content */}
      <div className="flex-1 flex flex-col justify-center p-6 lg:pl-[40px] gap-[16px] lg:gap-[24px]">
        <h2 className="text-white font-primary text-[24px] lg:text-[28px] font-medium leading-[34px]">
          Progress Consistency
        </h2>
        <p className="text-white font-secondary text-[15px] lg:text-[16px] leading-[24px] max-w-[480px]">
          Define meaningful goals and habits to align with your
          long-term aspirations. Each day, goalHyke will review
          your progress submissions to ensure you stay on track
          and accountable
        </p>
      </div>

      {/* Right Section - Red/Pink with Curved Edge */}
      <div className="relative w-full lg:w-[40%] bg-[#f23753] rounded-tl-[80px] lg:rounded-tl-[140px] flex items-end justify-center pt-8 px-4">
        <div className="relative w-[240px] h-[210px] lg:w-[310px] lg:h-[270px]">
          <Image
            src="/images/progress-consistency-character.png"
            alt="Progress Consistency Character"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    </section>
  );
};

export default ProgressConsistency;
