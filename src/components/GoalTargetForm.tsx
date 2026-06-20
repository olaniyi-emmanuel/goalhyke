"use client";

import React from "react";
import Image from "next/image";

export interface ExerciseTargetFormData {
  daysPerWeek: string;
  sessionDuration: string;
  exerciseType: string;
  startDate: string;
  reportingDay: string;
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
      <div className="flex items-center gap-3 mb-10">
        <div className="relative w-8 h-8 text-[#262525]">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
           </svg>
        </div>
        <h2 className="text-[28px] font-bold text-[#262525] font-secondary">Set Your Target</h2>
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
      <div className="gh-panel w-full p-10 relative overflow-visible border-t-[5px] border-t-[#7655fb] shadow-[0_20px_50px_rgba(24,33,77,0.06)] hover:shadow-[0_24px_60px_rgba(24,33,77,0.09)] transition-all duration-300">
        <div className="flex flex-col gap-8 max-w-[600px]">
          {/* Question 1 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <label className="text-[#262525] text-[16px] font-medium font-secondary">
              How many days per week would you like to exercise?
            </label>
            <div className="relative min-w-[120px]">
              <select 
                className="gh-select cursor-pointer text-[15px] font-secondary"
                value={value.daysPerWeek}
                onChange={(e) => onChange({ ...value, daysPerWeek: e.target.value })}
              >
                <option>1 day</option>
                <option>2 days</option>
                <option>3 days</option>
                <option>4 days</option>
                <option>5 days</option>
                <option>6 days</option>
                <option>7 days</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="#262525" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Question 2 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <label className="text-[#262525] text-[16px] font-medium font-secondary">
              How long do you plan to work out each session?
            </label>
            <div className="relative min-w-[120px]">
              <select 
                className="gh-select cursor-pointer text-[15px] font-secondary"
                value={value.sessionDuration}
                onChange={(e) =>
                  onChange({ ...value, sessionDuration: e.target.value })
                }
              >
                <option>15 minutes</option>
                <option>30 minutes</option>
                <option>45 minutes</option>
                <option>1 hour</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="#262525" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Question 3 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <label className="text-[#262525] text-[16px] font-medium font-secondary">
              What type of exercise will you focus on?
            </label>
            <div className="relative min-w-[150px]">
              <select 
                className="gh-select cursor-pointer text-[15px] font-secondary"
                value={value.exerciseType}
                onChange={(e) => onChange({ ...value, exerciseType: e.target.value })}
              >
                <option>Cardio</option>
                <option>Strength</option>
                <option>Yoga</option>
                <option>HIIT</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="#262525" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Question 4 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <label className="text-[#262525] text-[16px] font-medium font-secondary">
              This commitment starts:
            </label>
            <div className="relative min-w-[120px]">
              <select 
                className="gh-select cursor-pointer text-[15px] font-secondary"
                value={value.startDate}
                onChange={(e) => onChange({ ...value, startDate: e.target.value })}
              >
                <option>Today</option>
                <option>Tomorrow</option>
                <option>Next Week</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="#262525" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Question 5 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <label className="text-[#262525] text-[16px] font-medium font-secondary">
              My Reporting Days will be:
            </label>
            <div className="relative min-w-[150px]">
              <select 
                className="gh-select cursor-pointer text-[15px] font-secondary"
                value={value.reportingDay}
                onChange={(e) => onChange({ ...value, reportingDay: e.target.value })}
              >
                <option>Everyday</option>
                <option>Monday</option>
                <option>Tuesday</option>
                <option>Wednesday</option>
                <option>Thursday</option>
                <option>Friday</option>
                <option>Saturday</option>
                <option>Sunday</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="#262525" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
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
          className="gh-btn-primary px-10 py-3 flex items-center justify-center gap-2 min-w-[150px] cursor-pointer"
        >
          <span>Next</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default GoalTargetForm;
