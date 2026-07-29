"use client";

import React, { useState } from "react";
import GoalRecommendationsBanner from "@/components/GoalRecommendationsBanner";

export interface ExerciseTargetFormData {
  daysPerWeek: string;
  sessionDuration: string;
  exerciseType: string;
  startDate: string;
  reportingDay: string;
  targetMeasure?: string;
  standardVolumeSize?: string;
  volumeUnit?: string;
  targetVolume?: string;
}

interface GoalTargetFormProps {
  goalTitle: string;
  value: ExerciseTargetFormData;
  onChange: (value: ExerciseTargetFormData) => void;
  onCancel: () => void;
  onNext: () => void;
}

const GoalTargetForm = ({
  goalTitle,
  value,
  onChange,
  onCancel,
  onNext,
}: GoalTargetFormProps) => {
  const progressSteps = 8;
  const currentStep = 1;
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateMilestones = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-[900px] mx-auto flex flex-col items-center">
      {/* Progress Bar */}
      <div className="flex gap-2.5 mb-12 w-full max-w-[400px]">
        {Array.from({ length: progressSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
              i < currentStep
                ? "bg-gradient-to-r from-[#4169e1] to-[#7655fb] shadow-sm"
                : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Header with Icon */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative w-8 h-8 text-[#262525]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
        <h2 className="text-[28px] font-bold text-[#262525] font-secondary">
          Set Your Target
        </h2>
      </div>

      {/* Goal Title & Privacy */}
      <div className="w-full text-left mb-6 px-4 lg:px-0">
        <div className="inline-block rounded-full bg-[#3b82f6]/10 px-4 py-1.5 text-sm font-semibold text-[#3b82f6] mb-3">
          {goalTitle}
        </div>
        <p className="text-[#262525]/70 text-[15px] font-secondary">
          Your privacy is important to us. You can{" "}
          <span className="text-[#7655fb] cursor-pointer underline">
            adjust your privacy settings
          </span>{" "}
          once you&apos;re done creating your commitment
        </p>
      </div>

      {/* Form Card: Form Accountability */}
      <div className="gh-panel w-full p-6 sm:p-10 relative overflow-visible border-t-[5px] border-t-[#7655fb] shadow-[0_20px_50px_rgba(24,33,77,0.06)] transition-all duration-300">
        <div className="mb-6 border-b border-gray-100 pb-4">
          <h3 className="text-[22px] font-bold text-[#262525] font-secondary">
            Form Accountability
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            You are strong and accountable to yourself. Let&apos;s get moving,
            choose your preferred path to stay accountable:
          </p>
        </div>

        <div className="flex flex-col gap-6 max-w-[650px]">
          {/* Target Measure Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-[#262525] text-[15px] font-semibold font-secondary">
              Select Goal Target Measure
            </label>
            <div className="relative">
              <select
                className="gh-select cursor-pointer w-full text-[15px] font-secondary"
                value={value.targetMeasure || "volume size"}
                onChange={(e) =>
                  onChange({ ...value, targetMeasure: e.target.value })
                }
              >
                <option value="volume size">volume size</option>
                <option value="time based">time based</option>
                <option value="custom plan">custom plan</option>
              </select>
            </div>
          </div>

          {/* Standard Target Volume Size */}
          <div className="flex flex-col gap-2">
            <label className="text-[#262525] text-[15px] font-semibold font-secondary">
              Pick standard target volume size (e.g. 5, 10, 15...)
            </label>
            <div className="relative">
              <select
                className="gh-select cursor-pointer w-full text-[15px] font-secondary"
                value={value.standardVolumeSize || "10"}
                onChange={(e) =>
                  onChange({ ...value, standardVolumeSize: e.target.value })
                }
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>

          {/* Volume Unit */}
          <div className="flex flex-col gap-2">
            <label className="text-[#262525] text-[15px] font-semibold font-secondary">
              Volume unit (e.g. Pages, Hours)
            </label>
            <div className="relative">
              <select
                className="gh-select cursor-pointer w-full text-[15px] font-secondary"
                value={value.volumeUnit || "Pages"}
                onChange={(e) =>
                  onChange({ ...value, volumeUnit: e.target.value })
                }
              >
                <option value="Pages">Pages</option>
                <option value="Hours">Hours</option>
                <option value="Modules">Modules</option>
                <option value="Sessions">Sessions</option>
              </select>
            </div>
          </div>

          {/* Target Volume Size Input */}
          <div className="flex flex-col gap-2">
            <label className="text-[#262525] text-[15px] font-semibold font-secondary">
              Target volume size (e.g. 50 pages)
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                className="gh-input w-full pr-10 text-[15px] font-secondary"
                placeholder="Enter your target volume (e.g. 50 pages if reading a book)"
                value={value.targetVolume || ""}
                onChange={(e) =>
                  onChange({ ...value, targetVolume: e.target.value })
                }
              />
              <div className="absolute right-3 text-[#7655fb]">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="4"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Generate Milestone Target Schedule Button */}
          <div className="mt-2">
            <button
              type="button"
              onClick={handleGenerateMilestones}
              disabled={isGenerating}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#7655fb] hover:bg-[#6442e4] text-white font-semibold text-[15px] transition-all shadow-[0_4px_14px_rgba(118,85,251,0.35)] flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2L15 8L21 9L16.5 14L18 20L12 17L6 20L7.5 14L3 9L9 8L12 2Z"
                      fill="currentColor"
                    />
                  </svg>
                  Generate Milestone Target Schedule
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* GoalHyke Recommendation Banner */}
      <div className="w-full mt-6">
        <GoalRecommendationsBanner />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-6 mt-8 mb-12">
        <button
          onClick={onCancel}
          className="gh-btn-secondary px-8 py-3 min-w-[180px] cursor-pointer"
        >
          Previous Step
        </button>
        <button
          onClick={onNext}
          className="gh-btn-primary px-10 py-3 flex items-center justify-center gap-2 min-w-[150px] cursor-pointer bg-[#7655fb] hover:bg-[#6442e4]"
        >
          <span>Next Step</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 12H19M19 12L12 5M19 12L12 19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default GoalTargetForm;
