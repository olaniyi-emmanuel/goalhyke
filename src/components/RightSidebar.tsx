"use client";

import React from "react";
import Image from "next/image";

const RightSidebar = () => {
  const goalCards = [
    {
      title: "Lose weight",
      image: "/images/goal-weight.png",
      alt: "Lose weight"
    },
    {
      title: "Grow wealth",
      image: "/images/goal-wealth.png",
      alt: "Grow wealth"
    },
    {
      title: "Exercise regularly",
      image: "/images/goal-exercise.png",
      alt: "Exercise regularly"
    }
  ];

  return (
    <aside className="hidden xl:flex flex-col w-[350px] min-h-[calc(100vh-110px)] bg-white border-l border-[#f0f0f0] p-6 overflow-y-auto">
      <div className="flex flex-col gap-6">
        <h3 className="text-[#262525] text-[18px] font-bold font-secondary">
          Goal Suggestions
        </h3>
        
        <div className="flex flex-col gap-4">
          {goalCards.map((card, index) => (
            <div 
              key={index}
              className="relative w-full h-[160px] rounded-[16px] overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow"
            >
              <Image
                src={card.image}
                alt={card.alt}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
              
              {/* Title Overlay */}
              <div className="absolute bottom-4 left-4">
                <span className="text-white text-[16px] font-bold font-secondary bg-black/30 px-3 py-1 rounded-[8px] backdrop-blur-sm">
                  {card.title}
                </span>
              </div>
              
              {/* Arrow Icon */}
              <div className="absolute top-4 right-4 w-[28px] h-[28px] bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 11L11 1M11 1H3M11 1V9" stroke="#262525" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
