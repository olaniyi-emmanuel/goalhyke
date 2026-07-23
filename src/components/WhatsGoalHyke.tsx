import React from 'react';
import Image from 'next/image';

interface Testimonial {
  name: string;
  role: string;
  goal: string;
  testimonial: string;
  image?: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Emmanuel Olafusi",
    role: "Database Engineer",
    goal: "Daily Query Optimization",
    testimonial: "goalHyke keeps me highly accountable for daily indexing and DB checks. My query tuning workflows and DB uptime have never been better!",
    image: "/images/emmanuel-olafusi.png"
  },
  {
    name: "Adesoro Oluwatosin",
    role: "Product Engineer",
    goal: "Writing Product Specs",
    testimonial: "Balancing product design feedback with core engineering tasks is hard. goalHyke keeps me on track with daily document reviews.",
    image: "/images/adesoro-oluwatosin.png"
  },
  {
    name: "Miracle Adedoyin",
    role: "Environmental Scientist & Designer",
    goal: "Dual Research & Styling Workflows",
    testimonial: "Dividing my days between research papers and sketching fashion designs is easy now. goalHyke keeps both of my passions aligned.",
    image: "/images/miracle-adedoyin.png"
  },
  {
    name: "Emmanuel Akinbileje",
    role: "Software Engineer",
    goal: "Daily Open Source Commits",
    testimonial: "Maintaining a 100-day commit streak felt impossible, but goalHyke's daily accountability reminders helped me cross the finish line.",
    image: "/images/emmanuel-akinbileje.png"
  },
  {
    name: "Devas Beauty",
    role: "Hair & Beauty Specialist",
    goal: "Advanced Styling Masterclass",
    testimonial: "Tracking my styling training hours on goalHyke has allowed me to elevate our salon's bridal packages to a truly premium level.",
    image: "/images/devas-beauty.png"
  },
  {
    name: "BeautyBlazez",
    role: "Event Planner & Decorator",
    goal: "Daily Vendor Follow-Ups",
    testimonial: "Planning high-scale weddings requires solid organization. goalHyke keeps my decoration timelines and vendor logs perfectly synchronized.",
    image: "/images/beautyblazez.png"
  }
];

const TestimonialCard = ({ name, role, goal, testimonial, image }: Testimonial) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2);

  return (
    <div className="relative bg-white rounded-[24px] p-6 w-[340px] h-[250px] flex flex-col justify-between shadow-[0_15px_30px_rgba(24,33,77,0.06)] border border-white/60 hover:scale-[1.02] transition-transform duration-300 shrink-0 select-none">
      <div>
        <div className="flex items-center gap-3.5">
          <div className="relative w-[44px] h-[44px] rounded-full overflow-hidden border-2 border-[#d9e1ff] bg-gradient-to-tr from-[#7655fb]/15 to-[#4169e1]/15 flex items-center justify-center font-bold text-[#7655fb] text-[14px] uppercase shrink-0">
            {image ? (
              <Image src={image} alt={name} fill className="object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-primary text-[15px] font-bold text-[#262525] truncate">{name}</h4>
            <p className="font-secondary text-[11px] text-[#7d859a] font-medium truncate">{role}</p>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="inline-block bg-[#eef2ff] px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[#4169e1] uppercase tracking-wider mb-2">
            Goal: {goal}
          </div>
          <p className="font-secondary text-[13px] text-[#5e6677] leading-relaxed italic line-clamp-4">
            &ldquo;{testimonial}&rdquo;
          </p>
        </div>
      </div>
      
      {/* Star Icon Badge */}
      <div className="absolute -bottom-[18px] right-6 w-[36px] h-[36px] bg-white rounded-full shadow-[0_8px_20px_rgba(24,33,77,0.1)] border border-gray-50 flex items-center justify-center">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="#FFD54F" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      </div>
    </div>
  );
};

const WhatsGoalHyke = () => {
  return (
    <section id="about-us" className="w-full bg-[#4169e1] py-[60px] overflow-hidden scroll-mt-20">
      <div className="max-w-[1280px] mx-auto flex flex-col items-center">
        {/* Title with Yellow Circle Accent */}
        <div className="relative mb-[20px]">
          <div className="absolute -top-1.5 -right-4 w-[40px] h-[40px] bg-[#ffd54f] rounded-full opacity-100 -z-0" />
          <h2 className="relative z-10 text-white font-primary text-[32px] font-bold">
            What’s goalHYKE?
          </h2>
        </div>

        {/* Description */}
        <p className="text-white font-secondary text-[15px] lg:text-[16px] text-center max-w-[800px] mb-[45px] px-4 leading-[1.6]">
          goalHyke is an ever evolving commitment platform with the tools to help you achieve your
          goals. Here are some of our community members sharing their real accountability journeys.
        </p>

        {/* Sliding Infinite Marquee */}
        <div className="marquee-container py-4">
          <div className="marquee-track">
            {/* First Set of 6 */}
            {testimonials.map((t, idx) => (
              <TestimonialCard key={`set1-${idx}`} {...t} />
            ))}
            {/* Second Set of 6 (duplication for seamless infinite looping) */}
            {testimonials.map((t, idx) => (
              <TestimonialCard key={`set2-${idx}`} {...t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatsGoalHyke;
