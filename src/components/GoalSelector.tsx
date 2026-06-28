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
    <div className="flex flex-col items-center w-full mt-[24px] lg:mt-[36px]">
      <p className="font-secondary text-[18px] md:text-[20px] text-[#262525] mb-4 font-medium">
        I pursue to
      </p>
      <div className="flex flex-col md:flex-row items-center justify-center gap-[15px] md:gap-[24px] px-4 w-full relative z-50">
        {/* Input Container */}
        <div className="relative w-full max-w-[280px]" ref={dropdownRef}>
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between w-full h-[52px] px-4 border border-[#e4e8f2] bg-[#fbfbff] rounded-[18px] cursor-pointer hover:border-[#7655fb] transition-colors"
          >
            <span
              className={`font-secondary text-[15px] ${
                selectedGoal ? "text-[#262525] font-bold" : "text-[#717070]"
              }`}
            >
              {selectedGoal || "Select your Goal..."}
            </span>
            <ChevronDown
              className={`text-[#717070] transition-transform duration-300 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute top-[58px] left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 w-[90vw] max-w-[360px] md:w-[360px] bg-white rounded-[22px] shadow-2xl border border-[#eceff7] py-5 px-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Search Bar */}
              <div className="flex items-center gap-2 bg-[#F6F6F6] rounded-full px-3.5 py-2.5 mb-3 border border-gray-100">
                <SearchIcon className="text-[#878484] w-3.5 h-3.5 shrink-0" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent border-none outline-none text-[15px] text-[#262525] placeholder-[#878484] w-full font-secondary"
                  autoFocus
                />
              </div>

              {/* Goals List */}
              <div className="flex flex-col gap-1 max-h-[260px] overflow-y-auto custom-scrollbar">
                {filteredGoals.length > 0 ? (
                  filteredGoals.map((goal) => (
                    <div
                      key={goal}
                      onClick={() => handleSelect(goal)}
                      className="px-3.5 py-2.5 hover:bg-[#F9FAFF] hover:text-[#7655fb] rounded-[10px] cursor-pointer font-secondary text-[15px] font-medium text-[#262525] transition-colors"
                    >
                      {goal}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-3 text-gray-500 font-secondary text-sm">
                    No goals found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleHykeClick}
          className="flex items-center justify-center w-[110px] h-[52px] bg-[#7655fb] rounded-full text-white font-secondary text-[15px] font-bold hover:bg-[#6445e0] hover:shadow-[0_12px_24px_rgba(118,85,251,0.24)] transition-all cursor-pointer shadow-md hover:translate-y-[-1px] shrink-0"
        >
          HYKE
        </button>
      </div>
    </div>
  );
};

export default GoalSelector;
