"use client";

import React from "react";

export interface ExerciseSupportersFormData {
  autoAccept: boolean;
  supporters: string;
}

interface GoalSupportersFormProps {
  goalTitle: string;
  value: ExerciseSupportersFormData;
  onChange: (value: ExerciseSupportersFormData) => void;
  onCancel: () => void;
  onBack: () => void;
  onSubmit: () => Promise<void> | void;
  isSubmitting?: boolean;
  submitLabel?: string;
  progressSteps?: number;
  activeIndex?: number;
}

const GoalSupportersForm = ({
  goalTitle,
  value,
  onChange,
  onCancel,
  onBack,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Submit",
  progressSteps = 7,
  activeIndex = 6,
}: GoalSupportersFormProps) => {
  return (
    <div className="relative mx-auto flex w-full max-w-[1080px] flex-col items-center">
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
          width="24"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 21V19C16 17.3431 14.6569 16 13 16H5C3.34315 16 2 17.3431 2 19V21"
            stroke="#262525"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="9"
            cy="7"
            r="4"
            stroke="#262525"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22 21V19C21.9989 17.6547 21.0922 16.4784 19.8 16.13"
            stroke="#262525"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 3.13C17.293 3.47831 18.2005 4.65518 18.2005 6.0015C18.2005 7.34782 17.293 8.52469 16 8.873"
            stroke="#262525"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h2 className="text-[28px] font-bold text-[#262525] font-secondary">
          Add friends for support
        </h2>
      </div>

      <div className="mt-10 w-full px-4 lg:px-0">
        <h3 className="text-[32px] font-bold text-[#262525] font-secondary sm:text-[40px]">
          {goalTitle}
        </h3>
      </div>

      <div className="mt-8 grid w-full grid-cols-1 gap-8 px-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-0">
        <div className="flex flex-col gap-6">
          <div className="rounded-[24px] border border-[#eceff7] bg-white px-0 py-0 shadow-[0_12px_34px_rgba(24,33,77,0.05)]">
            <div className="border-b border-[#d9dde7] px-0 pb-4 pt-0">
              <div className="flex items-center justify-between gap-4 px-0">
                <h4 className="text-[22px] font-medium text-[#262525] font-secondary">
                  Auto accept
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    onChange({ ...value, autoAccept: !value.autoAccept })
                  }
                  className={`relative flex h-[28px] w-[56px] items-center rounded-full p-1 transition-colors ${
                    value.autoAccept ? "bg-[#7655fb]" : "bg-[#e8ebf4]"
                  }`}
                  aria-label="Toggle auto accept"
                >
                  <span
                    className={`h-[20px] w-[20px] rounded-full bg-white shadow-sm transition-transform ${
                      value.autoAccept ? "translate-x-[28px]" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <p className="mt-4 text-[15px] leading-7 text-[#555c72] font-secondary">
                Let goalHyke members automatically become your Supporter
              </p>
            </div>

            <div className="mt-6 border-t border-[#d9dde7] px-0 pt-6">
              <h4 className="text-[22px] font-medium text-[#262525] font-secondary">
                Get support from your friends and family!
              </h4>
              <p className="mt-3 text-[15px] leading-7 text-[#555c72] font-secondary">
                Invite your friends and family to view your progress and cheer
                you on
              </p>

              <label className="mt-6 block text-[20px] font-medium text-[#262525] font-secondary">
                Invite Supporters:
              </label>
              <textarea
                value={value.supporters}
                onChange={(e) =>
                  onChange({ ...value, supporters: e.target.value })
                }
                className="mt-3 min-h-[110px] w-full max-w-[420px] rounded-[2px] border border-[#bfc5d4] bg-white px-4 py-3 text-[16px] text-[#262525] outline-none transition-colors focus:border-[#7655fb]"
              />
              <p className="mt-3 text-[14px] leading-6 text-[#555c72] font-secondary">
                Email addresses/goalHyke usernames must be entered on a separate
                line.
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex flex-col justify-center gap-6 pt-10 lg:pt-24">
          <div className="flex items-center justify-between gap-6 rounded-[24px] border border-[#eceff7] bg-white px-6 py-6 shadow-[0_12px_34px_rgba(24,33,77,0.05)]">
            <p className="text-[18px] leading-8 text-[#262525] font-secondary">
              Invite your
              <br />
              friends on
              <br />
              Facebook
            </p>
            <div className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#4267b2] text-white shadow-[0_12px_22px_rgba(66,103,178,0.24)]">
              <span className="text-[34px] font-black">f</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-6 rounded-[24px] border border-[#eceff7] bg-white px-6 py-6 shadow-[0_12px_34px_rgba(24,33,77,0.05)]">
            <p className="text-[18px] leading-8 text-[#262525] font-secondary">
              Invite your
              <br />
              friends on
              <br />
              WhatsApp
            </p>
            <div className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#4ecb71] text-white shadow-[0_12px_22px_rgba(78,203,113,0.24)]">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 11.5C20 16.1944 16.1944 20 11.5 20C9.93731 20 8.47311 19.5782 7.21474 18.8427L4 20L5.22201 16.9266C4.44777 15.5657 4 13.9891 4 12.3077C4 7.61331 7.80558 3.80774 12.5 3.80774C17.1944 3.80774 21 7.61331 21 12.3077"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 9.5C9 12.1 11.1 14.2 13.7 14.2C14.1 14.2 14.4 14.1 14.7 13.9L16 13.3C16.2 13.2 16.3 12.9 16.2 12.7L15.4 11C15.3 10.8 15.1 10.7 14.9 10.8L13.8 11.2C13.6 11.3 13.4 11.2 13.3 11C12.9 10.4 12.4 9.9 11.8 9.5C11.6 9.4 11.5 9.2 11.6 9L12 7.9C12.1 7.7 12 7.5 11.8 7.4L10.1 6.6C9.9 6.5 9.6 6.6 9.5 6.8L8.9 8.1C8.7 8.4 8.6 8.8 8.6 9.1"
                  fill="white"
                />
              </svg>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-[-20px] right-0 hidden lg:flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gradient-to-br from-[#8a6dff] to-[#7655fb] shadow-[0_16px_28px_rgba(118,85,251,0.28)]">
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
          onClick={onSubmit}
          disabled={isSubmitting}
          className="gh-btn-primary flex min-w-[162px] items-center justify-center gap-2 px-10 py-3 text-[18px] cursor-pointer disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
        >
          <span>{isSubmitting ? "Submitting..." : submitLabel}</span>
          {submitLabel === "Next" && (
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
          )}
        </button>
      </div>
    </div>
  );
};

export default GoalSupportersForm;
