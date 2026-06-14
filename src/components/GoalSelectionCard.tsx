"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface GoalSelectionCardProps {
  title: string;
  imageSrc: string;
  href?: string;
}

const GoalSelectionCard = ({ title, imageSrc, href = "#" }: GoalSelectionCardProps) => {
  return (
    <div className="flex flex-col items-center justify-center bg-white rounded-[20px] p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 w-full max-w-[350px] h-[350px]">
      {/* Image Container */}
      <div className="relative w-[180px] h-[180px] mb-4">
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-contain"
        />
      </div>

      {/* Title */}
      <h3 className="text-[#262525] text-[18px] font-medium font-secondary mb-4">
        {title}
      </h3>

      {/* Start Goal Button */}
      <Link
        href={href}
        className="flex items-center justify-center gap-2 bg-[#7655fb] text-white rounded-[25px] px-6 py-2 hover:bg-[#6445e0] transition-colors"
      >
        <span className="text-[14px] font-medium font-secondary">Start goal</span>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 11L11 1M11 1H3M11 1V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
    </div>
  );
};

export default GoalSelectionCard;
