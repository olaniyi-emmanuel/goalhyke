import React from 'react';
import Image from 'next/image';

const Milestones = () => {
  return (
    <section className="w-full max-w-[960px] mx-auto bg-[#4169e1] rounded-[10px] overflow-hidden flex flex-col lg:flex-row min-h-[280px]">
      {/* Left Section - Yellow with Curved Edge */}
      <div className="relative w-full lg:w-[40%] bg-[#ffd54f] rounded-tr-[80px] lg:rounded-tr-[140px] flex items-end justify-center pt-8 px-4">
        <div className="relative w-[200px] h-[200px] lg:w-[260px] lg:h-[260px]">
          <Image
            src="/images/milestones-character.png"
            alt="Milestones Character"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Right Section - Content */}
      <div className="flex-1 flex flex-col justify-center p-6 lg:pl-[60px] lg:pr-[40px] gap-[16px] lg:gap-[24px]">
        <h2 className="text-white font-primary text-[24px] lg:text-[28px] font-medium leading-[34px]">
          Milestones
        </h2>
        <p className="text-white font-secondary text-[15px] lg:text-[16px] leading-[24px] max-w-[480px]">
          As you hit your targets, goalHyke will award you special milestones! It’s
          our way of celebrating your journey and encouraging you to continue
          striving for growth and success.
        </p>
      </div>
    </section>
  );
};

export default Milestones;
