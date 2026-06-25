"use client";

import React from "react";
import Image from "next/image";

interface GoalChallengesFormProps {
  goalTitle: string;
  value: string[];
  onChange: (value: string[]) => void;
  onCancel: () => void;
  onNext: () => Promise<void> | void;
  isSubmitting?: boolean;
}

const GoalChallengesForm = ({
  goalTitle,
  value,
  onChange,
  onCancel,
  onNext,
  isSubmitting = false,
}: GoalChallengesFormProps) => {
  const challenges = [
    "Lack of time",
    "Lack of motivation",
    "Feeling tired or low energy",
    "Too many distractions",
    "No proper workout plan",
    "Lack of support or accountability",
    "Unhealthy eating habits",
    "Other",
  ];

  const toggleChallenge = (challenge: string) => {
    onChange(
      value.includes(challenge)
        ? value.filter((current) => current !== challenge)
        : [...value, challenge]
    );
  };

  const progressSteps = 8;
  const currentStep = 3; // The 4th segment is active in the screenshot

  return (
    <div className="w-full max-w-[900px] mx-auto flex flex-col items-center">
      {/* Progress Bar */}
      <div className="flex gap-2 mb-12 w-full max-w-[400px]">
        {Array.from({ length: progressSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i <= currentStep ? "bg-[#4169e1]" : "bg-[#4169e1]/20"
            }`}
          />
        ))}
      </div>

      {/* Header with Icon */}
      <div className="flex items-center gap-3 mb-10">
        <div className="relative w-8 h-8 text-[#262525]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <h2 className="text-[28px] font-bold text-[#262525] font-secondary">Identify your challenges</h2>
      </div>

      {/* Goal Title & Privacy */}
      <div className="w-full text-left mb-8 px-4 lg:px-0">
        <h3 className="text-[24px] font-bold text-[#262525] font-secondary mb-4">{goalTitle}</h3>
        <p className="text-[#262525]/70 text-[15px] font-secondary">
          Your privacy is important to us. You can{" "}
          <span className="text-[#7655fb] cursor-pointer underline">adjust your privacy settings</span> once you&apos;re done creating your commitment
        </p>
      </div>

      {/* Form Card */}
      <div className="gh-panel w-full p-10 relative overflow-visible">
        <div className="flex flex-col gap-6 max-w-[600px]">
          <p className="text-[#262525] text-[16px] font-medium font-secondary mb-2">
            What challenges might stop you from achieving your goal?
          </p>
          
          <div className="flex flex-col gap-4">
            {challenges.map((challenge) => (
              <div 
                key={challenge} 
                className="flex items-center gap-4 cursor-pointer group"
                onClick={() => toggleChallenge(challenge)}
              >
                <div className={`w-6 h-6 rounded-[8px] border-2 flex items-center justify-center transition-all ${
                  value.includes(challenge)
                    ? "bg-[#7655fb] border-[#7655fb] shadow-[0_0_8px_rgba(118,85,251,0.3)]" 
                    : "border-[#e4e8f2] bg-[#fbfbff] group-hover:border-[#7655fb] shadow-sm"
                }`}>
                  {value.includes(challenge) && (
                    <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="text-[#262525] text-[16px] font-secondary">
                  {challenge}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Mascot */}
        <div className="absolute right-[-40px] top-[180px] w-[80px] h-[80px] bg-[#7655fb] rounded-full flex items-center justify-center shadow-xl z-20 hidden lg:flex">
          <div className="relative w-12 h-12">
            <Image
              src="/images/progress-consistency-character.png"
              alt="Mascot"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-6 mt-12 mb-12">
        <button
          onClick={onCancel}
          className="gh-btn-secondary px-10 py-3 min-w-[200px] cursor-pointer"
        >
          Choose a new goal
        </button>
        <button
          onClick={onNext}
          disabled={isSubmitting}
          className="gh-btn-primary px-10 py-3 flex items-center justify-center gap-2 min-w-[150px] cursor-pointer"
        >
          <span>{isSubmitting ? "Saving..." : "Next"}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default GoalChallengesForm;
