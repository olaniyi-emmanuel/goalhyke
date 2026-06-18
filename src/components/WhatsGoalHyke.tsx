import React from 'react';
import Image from 'next/image';

const TestimonialCard = ({ image, name, goal }: { image: string; name: string; goal: string }) => (
  <div className="relative bg-white rounded-[15px] p-5 w-full max-w-[300px] h-[190px] flex flex-col gap-3.5 shadow-lg">
    <div className="flex items-center gap-4">
      <div className="relative w-[40px] h-[40px] rounded-full overflow-hidden">
        <Image src={image} alt={name} fill className="object-cover" />
      </div>
      <span className="font-primary text-[16px] text-[#262525]">{name}</span>
    </div>
    <p className="font-primary text-[18px] text-[#262525]">{goal}</p>
    
    {/* Star Icon Badge */}
    <div className="absolute -bottom-[20px] left-1/2 -translate-x-1/2 w-[40px] h-[40px] bg-white rounded-full shadow-md flex items-center justify-center">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#FFD54F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  </div>
);

const WhatsGoalHyke = () => {
  return (
    <section id="about-us" className="w-full bg-[#4169e1] py-[50px] px-4 scroll-mt-20">
      <div className="max-w-[960px] mx-auto flex flex-col items-center">
        {/* Title with Yellow Circle Accent */}
        <div className="relative mb-[20px]">
          <div className="absolute -top-1.5 -right-4 w-[40px] h-[40px] bg-[#ffd54f] rounded-full opacity-100 -z-0" />
          <h2 className="relative z-10 text-white font-primary text-[32px] font-bold">
            What’s goalHYKE?
          </h2>
        </div>

        {/* Description */}
        <p className="text-white font-secondary text-[15px] lg:text-[16px] text-center max-w-[800px] mb-[40px] leading-[1.6]">
          goalHyke is an ever evolving commitment platform with the tools to help you achieve your
          goals. Here are some people from around the world who are goalhyking theirs.
        </p>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px] lg:gap-[32px] w-full justify-items-center">
          <TestimonialCard 
            image="/images/avatar-testimonial-1.png"
            name="John Doe"
            goal="Quit smoking"
          />
          <TestimonialCard 
            image="/images/avatar-testimonial-2.png"
            name="John Doe"
            goal="Quit smoking"
          />
          <TestimonialCard 
            image="/images/avatar-testimonial-3.png"
            name="John Doe"
            goal="Quit smoking"
          />
        </div>
      </div>
    </section>
  );
};

export default WhatsGoalHyke;
