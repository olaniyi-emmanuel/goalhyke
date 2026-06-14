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
      <div className="w-full max-w-[895px] text-center relative">
        <h1 className="text-[26px] sm:text-[34px] md:text-[38px] lg:text-[48px] leading-[1.2] md:leading-[1.3] font-medium font-primary text-[#262525]">
          <span>Ready to finally embark on</span>
          <br className="hidden md:block" />
          <div className="relative inline-block mt-2 lg:mt-3">
            <span>your </span>
            <span className="relative inline-flex items-center mx-2 z-10">
              {/* Background Blob/Highlight */}
              <div className="absolute inset-0 bg-[#7655fb]/10 rounded-lg blur-sm scale-110 -z-10"></div>
              
              {/* Text */}
              <span className="text-[#7655fb] font-semibold">goalHYKE</span>

              {/* Sparkles */}
              <Sparkle className="absolute -top-3 -left-3 md:-top-5 md:-left-5 text-[#FFB800] w-3 h-3 md:w-5 md:h-5 animate-pulse" />
              <Sparkle className="absolute -bottom-2.5 -right-2.5 md:-bottom-3 md:-right-3 text-[#FF4D4D] w-2 h-2 md:w-4 md:h-4 animate-bounce delay-100" />
              <Sparkle className="absolute top-0 -right-5 md:-right-7 text-[#FFB800] w-2 h-2 md:w-3.5 md:h-3.5 animate-pulse delay-75" />
            </span>
            <span> to your goals?</span>
          </div>
        </h1>
      </div>
    </div>
  );
};

export default HeroHeadline;
