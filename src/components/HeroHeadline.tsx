import React from 'react';

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

const HeroHeadline = () => {
  return (
    <div className="flex justify-center items-center w-full px-4 mt-[30px] lg:mt-[60px]">
      <div className="w-full max-w-[1000px] text-center relative">
        <h1 className="text-[36px] sm:text-[44px] md:text-[56px] lg:text-[68px] leading-[1.15] md:leading-[1.1] font-bold font-primary text-[#262525] tracking-tight">
          <span>Ready to finally embark on</span>
          <br className="hidden md:block" />
          <div className="relative inline-block mt-2 lg:mt-4">
            <span>your </span>
            <span className="relative inline-flex items-center mx-2 z-10">
              {/* Background Blob/Highlight */}
              <div className="absolute inset-0 bg-[#eef2fa] rounded-xl -z-10 transform scale-x-110 scale-y-125 md:scale-x-125 md:scale-y-150 skew-x-[-2deg] skew-y-[1deg]"></div>
              
              {/* Text */}
              <span className="text-[#7655fb] font-extrabold tracking-normal">goalHYKE</span>

              {/* Sparkles */}
              <Sparkle className="absolute -top-4 -left-4 md:-top-6 md:-left-8 text-[#FFB800] w-4 h-4 md:w-7 md:h-7 animate-pulse" />
              <Sparkle className="absolute -bottom-3 -left-1 md:-bottom-4 md:-left-2 text-[#FF4D4D] w-3 h-3 md:w-5 md:h-5 animate-bounce delay-100" />
              <Sparkle className="absolute -top-1 -right-2 md:-top-2 md:-right-3 text-[#FF4D4D] w-3 h-3 md:w-5 md:h-5 animate-pulse delay-75" />
              <Sparkle className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-8 text-[#FFB800] w-4 h-4 md:w-6 md:h-6 animate-bounce delay-150" />
            </span>
            <span> to your</span>
          </div>
          <br className="hidden md:block" />
          <div className="mt-2 lg:mt-4">goals?</div>
        </h1>
      </div>
    </div>
  );
};

export default HeroHeadline;
