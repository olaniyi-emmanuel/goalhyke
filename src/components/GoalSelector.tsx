"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ChevronDown = ({ className }: { className?: string }) => (
  <svg
    width="16"
    height="10"
    viewBox="0 0 16 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M1 1L8 8L15 1"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 14L11.1 11.1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const goalsList = [
  "Grow wealth",
  "Lose weight",
  "Master tech skill",
  "Exercise regularly",
  "Strengthen your spirit",
  "Level up your career",
  "Excel academically",
  "Read more",
  "Stay healthy",
  "Create Custom Goal",
];

const GoalSelector = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (goal: string) => {
    setSelectedGoal(goal);
    setIsOpen(false);
    setSearchQuery(""); // Reset search on select
  };

  const handleHykeClick = async () => {
    if (!selectedGoal) {
      alert("Please select a goal first!");
      return;
    }
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    const targetPath = `/set-goal?category=${encodeURIComponent(selectedGoal)}`;
    if (session) {
      router.push(targetPath);
    } else {
      router.push(`/login?redirectTo=${encodeURIComponent(targetPath)}`);
    }
  };

  const filteredGoals = goalsList.filter((goal) =>
    goal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col items-center w-full mt-[28px] sm:mt-[38px] lg:mt-[48px]">
      <div className="flex flex-col md:flex-row items-center justify-center gap-[14px] sm:gap-[20px] md:gap-[24px] px-4 w-full relative z-50">
        
        {/* Sentence start */}
        <p className="font-primary text-[22px] sm:text-[28px] md:text-[32px] text-[#262525] font-black tracking-tight text-center whitespace-nowrap mb-1 md:mb-0">
          I pursue to
        </p>

        {/* Input Wrapper */}
        <div className="flex flex-col items-center w-full max-w-[320px] sm:max-w-[380px] md:max-w-[420px]">
          {/* Input Container */}
          <div className="relative w-full" ref={dropdownRef}>
            <div
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-between w-full h-[54px] sm:h-[62px] md:h-[68px] px-5 sm:px-6 border-2 border-[#e4e8f2] bg-[#fbfbff] rounded-[20px] sm:rounded-[24px] cursor-pointer hover:border-[#7655fb] focus:ring-2 focus:ring-[#7655fb]/20 transition-all shadow-md"
            >
              <span
                className={`font-primary text-[15px] sm:text-[17px] md:text-[19px] ${
                  selectedGoal ? "text-[#262525] font-extrabold" : "text-[#717070] font-medium"
                }`}
              >
                {selectedGoal || "Select your Goal..."}
              </span>
              <ChevronDown
                className={`text-[#717070] w-4 h-4 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute top-[64px] sm:top-[72px] left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 w-[90vw] max-w-[380px] md:w-[420px] bg-white rounded-[24px] shadow-2xl border border-[#eceff7] py-5 px-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Search Bar */}
                <div className="flex items-center gap-2 bg-[#F6F6F6] rounded-full px-4 py-3 mb-3 border border-gray-100 focus-within:ring-2 focus-within:ring-[#7655fb]/20 focus-within:border-[#7655fb] transition-all">
                  <SearchIcon className="text-[#878484] w-4 h-4 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search goals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent border-none outline-none text-[15px] sm:text-[16px] text-[#262525] placeholder-[#878484] w-full font-primary text-left font-medium"
                    autoFocus
                  />
                </div>

                {/* Goals List */}
                <div className="flex flex-col gap-1 max-h-[280px] overflow-y-auto custom-scrollbar">
                  {filteredGoals.length > 0 ? (
                    filteredGoals.map((goal) => (
                      <div
                        key={goal}
                        onClick={() => handleSelect(goal)}
                        className="px-4 py-3 hover:bg-[#F9FAFF] hover:text-[#7655fb] rounded-[12px] cursor-pointer font-primary text-[15px] sm:text-[16px] font-bold text-[#262525] transition-colors text-left w-full"
                      >
                        {goal}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3 text-gray-500 font-primary text-sm">
                      No goals found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleHykeClick}
          className="flex items-center justify-center h-[54px] sm:h-[62px] md:h-[68px] px-8 sm:px-10 bg-gradient-to-r from-[#7655fb] via-[#5c61f2] to-[#4169e1] rounded-full text-white font-primary text-[16px] sm:text-[18px] md:text-[20px] font-black hover:shadow-[0_16px_36px_rgba(118,85,251,0.35)] hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer shadow-lg shrink-0 tracking-wide"
        >
          HYKE
        </button>
      </div>
    </div>
  );
};

export default GoalSelector;
