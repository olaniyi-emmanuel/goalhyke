import React from 'react';

const HowItWorksLabel = () => {
  return (
    <div className="relative w-[220px] h-[50px] mx-auto">
      {/* Blue Circle Background */}
      <div className="absolute top-0 left-[3px] w-[50px] h-[50px] rounded-full bg-[#3e6cf4]" />
      
      {/* Text Layer */}
      <h2 className="absolute top-[6px] left-[28px] text-[32px] font-medium leading-[38px] font-primary tracking-normal whitespace-nowrap z-10">
        <span className="text-white">H</span>
        <span className="text-[#262525]">ow it works</span>
      </h2>
    </div>
  );
};

export default HowItWorksLabel;
