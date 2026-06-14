"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

const DashboardHeader = () => {
  return (
    <div className="flex items-center justify-end w-full py-[27px] px-[50px] bg-[#f4f6fb]">
      <Link href="/set-goal">
        <button className="flex items-center justify-center gap-[8px] bg-[#7655fb] rounded-[5px] px-[16px] py-[8px] w-[176px] h-[50px] hover:bg-[#6445e0] transition-colors shadow-lg shadow-[#7655fb]/20 cursor-pointer">
          <span className="text-white text-[19px] font-medium font-secondary whitespace-nowrap">Create a goal</span>
          <div className="relative w-[14px] h-[14px]">
            <Image
              src="/images/create-goal-plus.svg"
              alt="Plus"
              fill
              className="object-contain brightness-0 invert"
            />
          </div>
        </button>
      </Link>
    </div>
  );
};

export default DashboardHeader;
