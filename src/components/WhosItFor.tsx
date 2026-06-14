import React from 'react';
import Image from 'next/image';

const ListItem = ({ icon, text, color }: { icon: string; text: string; color: string }) => (
  <div className="flex items-center gap-4 mb-4">
    <div className={`w-[32px] h-[32px] rounded-[6px] flex items-center justify-center shrink-0`} style={{ backgroundColor: color }}>
      <Image src={icon} alt="" width={18} height={18} />
    </div>
    <span className="text-[#262525] font-secondary text-[15px]">{text}</span>
  </div>
);

const WhosItFor = () => {
  const avatars = [
    '/images/avatar-grid-1.png', '/images/avatar-grid-2.png', '/images/avatar-grid-3.png', '/images/avatar-grid-4.png',
    '/images/avatar-grid-5.png', '/images/avatar-grid-6.png', '/images/avatar-grid-7.png', '/images/avatar-grid-8.png',
    '/images/avatar-grid-9.png', '/images/avatar-grid-10.png', '/images/avatar-grid-11.png', '/images/avatar-grid-12.png',
  ];

  return (
    <section className="w-full max-w-[960px] mx-auto py-[50px] px-4 flex flex-col lg:flex-row gap-[40px] lg:gap-[60px]">
      {/* Left Content */}
      <div className="flex-1">
        <h2 className="text-[#262525] font-primary text-[32px] font-bold mb-4">Who’s it For?</h2>
        <p className="text-[#555] font-secondary text-[15px] mb-8 leading-[1.6]">
          Whether you’re a founder, self-improver, or doer, our
          accountability tool will accelerate your success.
        </p>
        
        <p className="text-[#262525] font-primary text-[16px] mb-6">
          goalHyke features are tailored to train you:
        </p>

        <div>
          <ListItem icon="/images/icon-1.svg" text="Overcome procrastination" color="#E8F1FF" />
          <ListItem icon="/images/icon-2.svg" text="Get in shape" color="#F3E5F5" />
          <ListItem icon="/images/icon-3.svg" text="Learn a language" color="#FFF3E0" />
          <ListItem icon="/images/icon-4.svg" text="Start meditating" color="#FFEBEE" />
          <ListItem icon="/images/icon-5.svg" text="Advance your career" color="#FFF8E1" />
          <ListItem icon="/images/icon-6.svg" text="Cultivate healthy habits" color="#E3F2FD" />
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-[32px] h-[32px] bg-[#E8EAF6] rounded-[6px] flex items-center justify-center shrink-0">
              <span className="text-[#3F51B5] font-bold tracking-widest text-[10px]">•••</span>
            </div>
            <span className="text-[#262525] font-secondary text-[15px]">And more...</span>
          </div>
        </div>
      </div>

      {/* Right Grid */}
      <div className="flex-1 flex items-center">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 lg:gap-4 w-full">
          {avatars.map((avatar, index) => (
            <div key={index} className="relative w-full aspect-square rounded-full overflow-hidden max-w-[80px] mx-auto">
              <Image 
                src={avatar} 
                alt={`User ${index + 1}`} 
                fill 
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhosItFor;
