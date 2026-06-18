"use client";

import React from "react";

export interface ExerciseRefereeFormData {
  refereeType: string;
  refereeContact: string;
  selfManaged: boolean;
}

interface GoalRefereeFormProps {
  goalTitle: string;
  value: ExerciseRefereeFormData;
  onChange: (value: ExerciseRefereeFormData) => void;
  onCancel: () => void;
  onBack: () => void;
  onNext: () => Promise<void> | void;
  isSubmitting?: boolean;
  progressSteps?: number;
  activeIndex?: number;
  refereeOptions?: string[];
  selfManagedOptionLabel?: string;
}

const GoalRefereeForm = ({
  goalTitle,
  value,
  onChange,
  onCancel,
  onBack,
  onNext,
  isSubmitting = false,
  progressSteps = 7,
  activeIndex = 5,
  refereeOptions = ["Individual referee", "Trusted accountability partner"],
  selfManagedOptionLabel,
}: GoalRefereeFormProps) => {
  const handleToggleSelfManaged = () => {
    onChange({
      ...value,
      selfManaged: !value.selfManaged,
      refereeType:
        !value.selfManaged && selfManagedOptionLabel
          ? selfManagedOptionLabel
          : refereeOptions[0] ?? value.refereeType,
      refereeContact: !value.selfManaged ? "" : value.refereeContact,
    });
  };

  return (
    <div className="relative mx-auto flex w-full max-w-[980px] flex-col items-center">
      <div className="absolute left-0 top-0 hidden lg:flex">
        <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gradient-to-br from-[#8a6dff] to-[#7655fb] shadow-[0_16px_28px_rgba(118,85,251,0.28)]">
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 3C12 6.31371 9.31371 9 6 9"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M12 21C12 17.6863 14.6863 15 18 15"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M15 3H19V7"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 21H5V17"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" fill="white" fillOpacity="0.9" />
          </svg>
        </div>
      </div>

      <div className="flex w-full items-center justify-between gap-4 px-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-[48px] w-[48px] items-center justify-center rounded-full text-[#262525] transition-colors hover:bg-[#f3f6ff]"
          aria-label="Go back"
        >
          <svg
            width="34"
            height="34"
            viewBox="0 0 39 31"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M38 29.5H26.5C20.4249 29.5 15.5 24.5751 15.5 18.5V10.7071M15.5 10.7071L1.5 10.7071M15.5 10.7071L8.5 1.5"
              stroke="#262525"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="mx-auto flex w-full max-w-[520px] items-center gap-3">
          {Array.from({ length: progressSteps }).map((_, index) => (
            <div
              key={index}
              className={`h-2 flex-1 rounded-full border border-[#4169e1] ${
                index === activeIndex ? "bg-[#4169e1]" : "bg-transparent"
              }`}
            />
          ))}
        </div>

        <div className="hidden w-[48px] lg:block" />
      </div>

      <div className="mt-14 flex items-center gap-3">
        <svg
          width="28"
          height="24"
          viewBox="0 0 25 21"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="1"
            y="3"
            width="18"
            height="14"
            rx="3"
            stroke="#262525"
            strokeWidth="2"
          />
          <path
            d="M8 10H12"
            stroke="#262525"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="7" cy="10" r="1" fill="#262525" />
          <path
            d="M20 7L24 10.5L20 14"
            stroke="#262525"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h2 className="text-[28px] font-bold text-[#262525] font-secondary">
          Referee
        </h2>
      </div>

      <div className="mt-10 w-full px-4 lg:px-0">
        <h3 className="text-[32px] font-bold text-[#262525] font-secondary sm:text-[40px]">
          {goalTitle}
        </h3>
      </div>

      <div className="mt-8 flex w-full flex-col gap-8 px-4 lg:px-0">
        <p className="text-[20px] leading-7 text-[#262525] font-secondary">
          Choose a Referee - people who do are twice as successful!
        </p>

        <div className="gh-panel-soft p-6 sm:p-8">
          <div className="flex flex-col gap-7">
            <div className="flex flex-col gap-3">
              <label className="text-[20px] font-semibold text-[#262525] font-secondary">
                Who will be your Referee:
              </label>
              <div className="relative max-w-[478px]">
                <select
                  value={value.refereeType}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      refereeType: e.target.value,
                      selfManaged:
                        selfManagedOptionLabel !== undefined &&
                        e.target.value === selfManagedOptionLabel,
                      refereeContact:
                        selfManagedOptionLabel !== undefined &&
                        e.target.value === selfManagedOptionLabel
                          ? ""
                          : value.refereeContact,
                    })
                  }
                  className="gh-select h-[60px] rounded-[14px] border-[#535353] bg-white pr-12 text-[20px] font-secondary shadow-none"
                >
                  {refereeOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2">
                  <svg
                    width="16"
                    height="8"
                    viewBox="0 0 16 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 1L8 7L15 1"
                      stroke="#262525"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleSelfManaged}
              className={`flex h-[58px] w-full max-w-[478px] items-center justify-center rounded-full px-6 text-[18px] font-medium font-secondary transition-all ${
                value.selfManaged
                  ? "bg-[#262525] text-white shadow-[0_14px_30px_rgba(38,37,37,0.16)]"
                  : "bg-gradient-to-r from-[#8a6dff] to-[#7655fb] text-white shadow-[0_16px_34px_rgba(118,85,251,0.22)]"
              }`}
            >
              No, thanks I will do it on my own
            </button>

            <div className="flex flex-col gap-3">
              <label className="text-[20px] font-semibold text-[#262525] font-secondary">
                Invite your Referee:
              </label>
              <p className="max-w-[430px] text-[20px] leading-8 text-[#262525] font-secondary">
                Enter your Referee&apos;s{" "}
                <span className="font-semibold">email address</span> or{" "}
                <span className="font-semibold">goalHyke username.</span>
              </p>
              <input
                type="text"
                value={value.refereeContact}
                onChange={(e) =>
                  onChange({ ...value, refereeContact: e.target.value })
                }
                disabled={value.selfManaged}
                placeholder="Email"
                className={`h-[60px] w-full max-w-[478px] rounded-[14px] border px-5 text-[20px] font-secondary outline-none transition-colors ${
                  value.selfManaged
                    ? "cursor-not-allowed border-[#d7d7d7] bg-[#f3f4f8] text-[#9a9a9a]"
                    : "border-[#535353] bg-white text-[#262525] placeholder:text-[#d7d7d7] focus:border-[#7655fb]"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-10 mt-14 flex w-full flex-wrap items-center justify-center gap-5">
        <button
          type="button"
          onClick={onCancel}
          className="gh-btn-secondary min-w-[242px] px-10 py-3 text-[18px] cursor-pointer"
        >
          Choose a new goal
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={isSubmitting}
          className="gh-btn-primary flex min-w-[162px] items-center justify-center gap-2 px-10 py-3 text-[18px] cursor-pointer disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
        >
          <span>{isSubmitting ? "Saving..." : "Next"}</span>
          <svg
            width="18"
            height="14"
            viewBox="0 0 18 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 7H17M17 7L11 1M17 7L11 13"
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

export default GoalRefereeForm;
