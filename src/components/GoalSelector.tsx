"use client";

import React, { useState, useEffect, useRef } from "react";

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

  const filteredGoals = goalsList.filter((goal) =>
    goal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-[15px] md:gap-[24px] mt-[24px] lg:mt-[36px] px-4 relative z-50">
      {/* Input Container */}
      <div className="relative w-full max-w-[280px]" ref={dropdownRef}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full h-[46px] px-[12px] bg-[#f4f0f0] rounded-[7px] cursor-pointer hover:bg-[#ebe7e7] transition-colors"
        >
          <span
            className={`font-secondary text-[15px] ${
              selectedGoal ? "text-[#262525]" : "text-[#717070]"
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
          <div className="absolute top-[52px] left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 w-[90vw] max-w-[360px] md:w-[360px] bg-white rounded-[16px] shadow-2xl border border-gray-100 py-5 px-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Search Bar */}
            <div className="flex items-center gap-2 bg-[#F6F6F6] rounded-[80px] px-3.5 py-2.5 mb-3">
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
                    className="px-3.5 py-2.5 hover:bg-[#F9FAFF] rounded-[8px] cursor-pointer font-secondary text-[15px] text-[#262525] transition-colors"
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
        onClick={() =>
          alert(
            selectedGoal
              ? `Starting goal: ${selectedGoal}`
              : "Please select a goal first!"
          )
        }
        className="flex items-center justify-center w-[90px] h-[40px] bg-[#7655fb] rounded-[60px] text-white font-secondary text-[15px] font-medium hover:bg-[#6445e0] transition-colors shadow-md hover:shadow-lg shrink-0"
      >
        HYKE
      </button>
    </div>
  );
};

export default GoalSelector;
