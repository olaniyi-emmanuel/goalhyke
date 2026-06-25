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
  const [copied, setCopied] = React.useState(false);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${encodeURIComponent(goalTitle)}`;
  const shareText = `Hey! Support my goal "${goalTitle}" on goalHyke and keep me accountable! ${shareUrl}`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
                index <= activeIndex ? "bg-[#4169e1]" : "bg-transparent"
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

        <div className="relative flex flex-col justify-start gap-4 pt-0">
          <h4 className="text-[15px] font-bold uppercase tracking-wider text-[#555c72] mb-1 font-secondary">
            Quick Invite
          </h4>

          {/* WhatsApp Card */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-4 rounded-[22px] border border-[#eceff7] bg-white p-5 shadow-[0_10px_25px_rgba(24,33,77,0.02)] hover:shadow-[0_14px_35px_rgba(37,211,102,0.08)] hover:border-[#25D366]/30 transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-[#25D366] transition-colors">
                Invite friends on
              </p>
              <p className="text-[17px] font-extrabold text-[#262525] mt-0.5 font-secondary">
                WhatsApp
              </p>
            </div>
            <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#e8faf0] group-hover:bg-[#25D366] text-[#25D366] group-hover:text-white shadow-sm transition-all duration-300 shrink-0">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.16 1.448 4.795 1.449 5.513 0 10.005-4.492 10.007-10.007.001-2.67-1.03-5.181-2.906-7.058-1.877-1.877-4.389-2.906-7.067-2.907-5.523 0-10.016 4.493-10.018 10.012-.001 1.708.452 3.377 1.313 4.887L1.13 22.87l4.316-1.134c1.558.85 3.12 1.296 4.678 1.296h-.002zm11.393-7.618c-.3-.15-1.782-.879-2.057-.979-.275-.1-.475-.15-.675.15-.2.3-.775.979-.95 1.179-.175.2-.35.225-.65.075-3.037-1.518-4.697-3.111-5.4-4.318-.175-.3-.025-.463.125-.613.138-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.629-.925-2.229-.244-.588-.491-.508-.675-.518-.175-.008-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.11 3.224 5.112 4.521.714.308 1.272.492 1.707.63.717.228 1.37.196 1.887.119.577-.085 1.782-.729 2.032-1.433.25-.704.25-1.309.175-1.433-.075-.125-.275-.2-.575-.35z" />
              </svg>
            </div>
          </a>

          {/* Facebook Card */}
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-4 rounded-[22px] border border-[#eceff7] bg-white p-5 shadow-[0_10px_25px_rgba(24,33,77,0.02)] hover:shadow-[0_14px_35px_rgba(24,119,242,0.08)] hover:border-[#1877F2]/30 transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-[#1877F2] transition-colors">
                Invite friends on
              </p>
              <p className="text-[17px] font-extrabold text-[#262525] mt-0.5 font-secondary">
                Facebook
              </p>
            </div>
            <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#eaf2ff] group-hover:bg-[#1877F2] text-[#1877F2] group-hover:text-white shadow-sm transition-all duration-300 shrink-0">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
          </a>

          {/* Copy Link Card */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full text-left items-center justify-between gap-4 rounded-[22px] border border-[#eceff7] bg-white p-5 shadow-[0_10px_25px_rgba(24,33,77,0.02)] hover:shadow-[0_14px_35px_rgba(118,85,251,0.08)] hover:border-[#7655fb]/30 transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-[#7655fb] transition-colors">
                Invite via link
              </p>
              <p className="text-[17px] font-extrabold text-[#262525] mt-0.5 font-secondary">
                {copied ? "Link Copied!" : "Copy Invite Link"}
              </p>
            </div>
            <div className={`flex h-[48px] w-[48px] items-center justify-center rounded-full transition-all duration-300 shrink-0 ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-[#f1edff] group-hover:bg-[#7655fb] text-[#7655fb] group-hover:text-white'} shadow-sm`}>
              {copied ? (
                <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              )}
            </div>
          </button>
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
