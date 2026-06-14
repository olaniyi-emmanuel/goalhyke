import React from 'react';
import Image from 'next/image';

const BehaviouralSolution = () => {
  return (
    <section className="w-full max-w-[960px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-[40px] lg:gap-[60px] px-4">
      {/* Left Section - Image Card */}
      <div className="bg-white rounded-[8px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] p-[16px] w-full max-w-[280px] shrink-0">
        <div className="relative w-full aspect-[354/295]">
          <Image
            src="/images/behavioural-solution.png"
            alt="GoalHyke Behavioural Solution"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Right Section - Content */}
      <div className="flex-1 flex flex-col items-start gap-[15px]">
        {/* Title */}
        <div className="flex flex-col">
          <h3 className="text-[#262525] font-secondary text-[28px] leading-[36px]">
            goalHyke
          </h3>
          <span className="text-[#262525] font-secondary text-[24px] leading-[30px]">
            commit
          </span>
        </div>

        {/* Description */}
        <p className="text-[#262525] font-secondary text-[15px] leading-[22px] max-w-[380px]">
          Provides an incentive and accountability tool for committed
          individuals that are looking to leverage behavioral techniques to
          their advantage and goalHyke their goals. Like-minded goal setters can
          interact, offer support, and share best practices.
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-[20px] mt-[24px]">
          <button className="flex items-center justify-center w-[110px] h-[40px] bg-[#7655fb] rounded-[70px] text-white text-[14px] font-bold hover:bg-[#6445e0] transition-colors shadow-sm cursor-pointer">
            SIGN UP
          </button>
          <button className="flex items-center justify-center w-[130px] h-[40px] bg-white border border-[#7655fb] rounded-[70px] text-[#7655fb] text-[14px] font-bold hover:bg-gray-50 transition-colors cursor-pointer">
            LEARN MORE
          </button>
        </div>
      </div>
    </section>
  );
};

export default BehaviouralSolution;
