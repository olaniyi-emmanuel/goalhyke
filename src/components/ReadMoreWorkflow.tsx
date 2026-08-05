"use client";

import React, { type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface ReadMoreWorkflowProps {
  goalTitle?: string;
  onCancel: () => void;
}

interface ReadMoreTargetData {
  readingFormat: string;
  intendedDuration: string;
  frequency: string;
  targetTimeline: string;
  dailyMinutes: number;
}

const TOTAL_STEPS = 3;
const MIN_COMMIT_TOKENS = 20;

const DEFAULT_DATA: ReadMoreTargetData = {
  readingFormat: "Physical Book",
  intendedDuration: "",
  frequency: "Everyday",
  targetTimeline: "1 Month",
  dailyMinutes: 45,
};

const FORMAT_OPTIONS = [
  "Physical Book",
  "E-Book (e.g. Kindle, iPad)",
  "Audiobook",
  "Online Articles / Papers",
];

const FREQUENCY_OPTIONS = [
  "Everyday",
  "3 days a week",
  "5 days a week",
  "Weekends",
];

const TIMELINE_OPTIONS = [
  "1 Month",
  "3 Months",
  "6 Months",
  "1 Year",
];

function resolveEndDate(timeline: string) {
  const date = new Date();
  switch (timeline) {
    case "1 Month":
      date.setMonth(date.getMonth() + 1);
      break;
    case "3 Months":
      date.setMonth(date.getMonth() + 3);
      break;
    case "6 Months":
      date.setMonth(date.getMonth() + 6);
      break;
    case "1 Year":
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
      break;
  }
  return date;
}

function formatDateForInput(date: Date) {
  return date.toISOString().split("T")[0];
}

function PrivacyNotice() {
  return (
    <p className="max-w-[720px] text-[14px] leading-6 text-[#5a6075] sm:text-[15px]">
      Your privacy is important to us. You can{" "}
      <span className="font-medium text-[#7655fb] underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current">
        adjust your privacy settings
      </span>{" "}
      once you&apos;re done creating your commitment.
    </p>
  );
}

function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="mx-auto flex w-full max-w-[520px] items-center gap-3">
      {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
        <div
          key={index}
          className={`h-2 flex-1 rounded-full border border-[#4169e1] ${
            index <= currentStep - 1 ? "bg-[#4169e1]" : "bg-transparent"
          }`}
        />
      ))}
    </div>
  );
}

function StepShell({
  currentStep,
  title,
  goalTitle,
  icon,
  children,
  onBack,
  onCancel,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
}: {
  currentStep: number;
  title: string;
  goalTitle: string;
  icon: ReactNode;
  children: ReactNode;
  onBack: () => void;
  onCancel: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="relative mx-auto flex w-full max-w-[1080px] flex-col items-center">
      {/* Top Navigation */}
      <div className="flex w-full items-center justify-between gap-4 px-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-[48px] w-[48px] items-center justify-center rounded-full text-[#262525] transition-colors hover:bg-[#f3f6ff]"
          aria-label="Go back"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 12H5M12 19L5 12L12 5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <ProgressBar currentStep={currentStep} />

        <div className="hidden w-[48px] lg:block" />
      </div>

      {/* Header Badge */}
      <div className="mt-12 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f1edff] text-[#7655fb]">
          {icon}
        </div>
        <h2 className="text-[26px] font-bold text-[#262525] font-secondary sm:text-[28px]">
          {title}
        </h2>
      </div>

      {/* Title & Privacy Notice */}
      <div className="mt-8 w-full px-4 lg:px-0">
        <h3 className="text-[32px] font-bold text-[#262525] font-secondary sm:text-[40px]">
          {goalTitle}
        </h3>
        <div className="mt-4">
          <PrivacyNotice />
        </div>
      </div>

      {/* Main Panel */}
      <div className="mt-8 w-full max-w-[760px] px-4 lg:px-0">
        <div className="gh-panel-soft p-6 sm:p-10">{children}</div>
      </div>

      {/* Circular illustration avatar */}
      <div className="mt-10 flex justify-center">
        <div className="relative h-[120px] w-[120px] overflow-hidden rounded-full border border-[#eceff7] bg-white shadow-[0_8px_24px_rgba(24,33,77,0.06)]">
          <Image
            src="/images/goal-read-more.png"
            alt="Read More illustration"
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-10 mt-10 flex w-full flex-wrap items-center justify-center gap-5">
        <button
          type="button"
          onClick={onCancel}
          className="gh-btn-secondary min-w-[220px] px-10 py-3 text-[18px]"
        >
          Choose a new goal
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="gh-btn-primary flex min-w-[170px] items-center justify-center gap-2 px-10 py-3 text-[18px] disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
        >
          <span>{nextLabel}</span>
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
}

function SelectQuestion({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-3">
      <span className="text-[18px] font-medium leading-7 text-[#262525] font-secondary">
        {label}
      </span>
      <div className="relative max-w-[620px]">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="gh-select h-[58px] w-full rounded-[16px] border-[#ccd2e2] bg-white pr-12 text-[16px] font-secondary shadow-none"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#262525]">
          <svg
            width="14"
            height="8"
            viewBox="0 0 14 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 1L7 7L13 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </label>
  );
}

export default function ReadMoreWorkflow({
  goalTitle = "Read More",
  onCancel,
}: ReadMoreWorkflowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ReadMoreTargetData>(DEFAULT_DATA);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCommitConfirm, setShowCommitConfirm] = useState(false);
  const [showInsufficientTokens, setShowInsufficientTokens] = useState(false);
  const [showGoalCreated, setShowGoalCreated] = useState(false);
  const [tokenCommitment, setTokenCommitment] = useState<number>(20);
  const [submissionMode, setSubmissionMode] = useState("image");
  const [isCustomToken, setIsCustomToken] = useState(false);
  const [customTokenValue, setCustomTokenValue] = useState("");

  const moveToStep = (nextStep: number) => {
    setErrorMessage(null);
    setStep(nextStep);
  };

  const validateStep = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        return formData.readingFormat.trim().length > 0;
      case 2:
        return (
          formData.frequency.trim().length > 0 &&
          formData.targetTimeline.trim().length > 0
        );
      case 3:
        return formData.dailyMinutes > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      setErrorMessage("Please complete all required fields before continuing.");
      return;
    }

    if (step < TOTAL_STEPS) {
      moveToStep(step + 1);
    } else {
      setShowCommitConfirm(true);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      onCancel();
      return;
    }
    moveToStep(step - 1);
  };

  const handleGoToDashboard = () => {
    setShowGoalCreated(false);
    router.push("/dashboard");
  };

  const handleGoToGetToken = () => {
    setShowInsufficientTokens(false);
    router.push("/get-token");
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMessage("You must be logged in to create a goal.");
        return;
      }

      if (tokenCommitment < MIN_COMMIT_TOKENS) {
        setErrorMessage(
          `Minimum token commitment is ${MIN_COMMIT_TOKENS} tokens.`,
        );
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("tokens")
        .eq("id", user.id)
        .maybeSingle();

      const tokenBalance =
        profile && typeof profile.tokens === "number" ? profile.tokens : 0;

      if (tokenBalance < tokenCommitment) {
        setShowCommitConfirm(false);
        setShowInsufficientTokens(true);
        return;
      }

      const startDate = new Date();
      const endDate = resolveEndDate(formData.targetTimeline);

      const description = [
        `Reading Format: ${formData.readingFormat}.`,
        formData.intendedDuration ? `Intended Plan: ${formData.intendedDuration}.` : "",
        `Frequency: ${formData.frequency}.`,
        `Daily Target: ${formData.dailyMinutes} mins.`,
      ]
        .filter(Boolean)
        .join(" ");

      const metadata = {
        committed_tokens: tokenCommitment,
        remaining_committed: tokenCommitment,
        failures_count: 0,
        failures_logged: [],
        success_logged: [],
        deductions_history: [],
        submission_mode: submissionMode,
        reading_format: formData.readingFormat,
        intended_duration: formData.intendedDuration,
        frequency: formData.frequency,
        target_timeline: formData.targetTimeline,
        daily_minutes: formData.dailyMinutes,
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ tokens: tokenBalance - tokenCommitment })
        .eq("id", user.id);

      if (profileError) {
        throw new Error(`Profile update failed: ${profileError.message}`);
      }

      const { error } = await supabase.from("goals").insert({
        user_id: user.id,
        title: goalTitle,
        category: goalTitle,
        description,
        start_date: formatDateForInput(startDate),
        end_date: formatDateForInput(endDate),
        metadata,
      });

      if (error) {
        throw error;
      }

      setShowCommitConfirm(false);
      setShowGoalCreated(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not save this goal.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="w-full">
        {errorMessage && (
          <div className="mb-6 w-full rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        {/* Step 1: Define the Reading mode */}
        {step === 1 && (
          <StepShell
            currentStep={1}
            title="Define the Reading mode"
            goalTitle={goalTitle}
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="Format of Reading"
                value={formData.readingFormat}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, readingFormat: val }))
                }
                options={FORMAT_OPTIONS}
              />
              <label className="flex flex-col gap-3">
                <span className="text-[18px] font-medium leading-7 text-[#262525] font-secondary">
                  How long do you intend to read
                </span>
                <textarea
                  value={formData.intendedDuration}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      intendedDuration: e.target.value,
                    }))
                  }
                  placeholder="Describe your reading goal (e.g. I plan to read 30 mins a day for 30 days to complete 2 books)"
                  className="min-h-[120px] w-full max-w-[620px] rounded-[18px] border border-[#ccd2e2] bg-white px-5 py-4 text-[16px] text-[#262525] outline-none transition-colors placeholder:text-[#9fa6bb] focus:border-[#7655fb]"
                />
              </label>
            </div>
          </StepShell>
        )}

        {/* Step 2: Set the Timeline */}
        {step === 2 && (
          <StepShell
            currentStep={2}
            title="Set the Timeline"
            goalTitle={goalTitle}
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M16 2V6M8 2V6M3 10H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            }
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="Frequency"
                value={formData.frequency}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, frequency: val }))
                }
                options={FREQUENCY_OPTIONS}
              />
              <SelectQuestion
                label="Target End Date"
                value={formData.targetTimeline}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, targetTimeline: val }))
                }
                options={TIMELINE_OPTIONS}
              />
            </div>
          </StepShell>
        )}

        {/* Step 3: Look in the Mirror */}
        {step === 3 && (
          <StepShell
            currentStep={3}
            title="Look in the Mirror"
            goalTitle={goalTitle}
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4.5V19.5M4.5 12H19.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            }
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
            nextLabel="Commit"
          >
            <div className="flex flex-col gap-6">
              <div>
                <span className="text-[18px] font-medium leading-7 text-[#262525] font-secondary">
                  Set your daily target mins
                </span>

                {/* Range Slider Container matching design mockup */}
                <div className="mt-8 px-2 py-4">
                  <div className="relative mb-6 flex items-center justify-between">
                    <span className="rounded-full bg-[#7655fb] px-3.5 py-1 text-[13px] font-bold text-white shadow-sm">
                      Target: {formData.dailyMinutes} mins
                    </span>
                    <span className="rounded-full bg-[#4169e1] px-3.5 py-1 text-[13px] font-bold text-white shadow-sm">
                      Goal: 80 mins
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="120"
                    step="5"
                    value={formData.dailyMinutes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dailyMinutes: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-[#e2e7f5] accent-[#7655fb]"
                  />

                  <div className="mt-3 flex justify-between text-[13px] font-semibold text-gray-500">
                    <span>0 mins</span>
                    <span>45 mins</span>
                    <span>80 mins</span>
                  </div>
                </div>
              </div>
            </div>
          </StepShell>
        )}
      </div>

      {/* Goal Created Modal */}
      {showGoalCreated && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1b1a1a]/55 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-[820px] rounded-[28px] border border-white/80 bg-white/95 px-8 py-10 shadow-[0_32px_80px_rgba(24,33,77,0.16)] sm:px-14 sm:py-12">
            <button
              type="button"
              onClick={() => setShowGoalCreated(false)}
              className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full text-[#262525] transition-colors hover:bg-[#f4f6fb]"
              aria-label="Close success dialog"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 6L18 18M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="relative h-[112px] w-[150px]">
                <Image
                  src="/images/progress-consistency-character.png"
                  alt="Goal created"
                  fill
                  className="object-contain"
                />
              </div>
              <h2 className="mt-7 text-[28px] font-bold text-[#262525] font-secondary">
                Goal created
              </h2>
              <button
                type="button"
                onClick={handleGoToDashboard}
                className="gh-btn-primary mt-14 min-w-[185px] px-8 py-3 text-[18px]"
              >
                Go To Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commit Confirmation Modal */}
      {showCommitConfirm && (
        <div className="fixed inset-0 z-[79] flex items-center justify-center bg-[#1b1a1a]/55 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-[820px] rounded-[28px] border border-white/80 bg-white/95 px-8 py-10 shadow-[0_32px_80px_rgba(24,33,77,0.16)] sm:px-14 sm:py-12">
            <button
              type="button"
              onClick={() => setShowCommitConfirm(false)}
              className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full text-[#262525] transition-colors hover:bg-[#f4f6fb]"
              aria-label="Close commit dialog"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 6L18 18M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div className="flex flex-col items-center text-center">
              <p className="mt-6 text-[22px] font-medium leading-[1.6] text-[#262525] font-secondary sm:text-[26px]">
                Commit tokens to your goal
              </p>
              <p className="mt-2 max-w-lg text-[14px] text-gray-500">
                Your committed tokens are staked. If you fail the weekly consistency
                target, tokens will be deducted.
              </p>

              <div className="mt-6 w-full max-w-md rounded-[18px] border border-gray-100 bg-[#f7f8ff] p-5 text-left">
                <div className="mb-5">
                  <p className="mb-2 text-[13px] font-bold uppercase tracking-wider text-[#262525]">
                    Mandatory submission mode
                  </p>
                  <select
                    value={submissionMode}
                    onChange={(event) => setSubmissionMode(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] outline-none focus:border-[#7655fb]"
                  >
                    <option value="image">Image / Screenshot upload</option>
                    <option value="video">Video / Screen recording upload</option>
                    <option value="text">Text log / Written proof</option>
                  </select>
                </div>

                <p className="mb-3 text-[13px] font-bold uppercase tracking-wider text-[#262525]">
                  Select token commitment (Min 20)
                </p>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomToken(false);
                      setTokenCommitment(20);
                      setCustomTokenValue("");
                    }}
                    className={`flex-1 rounded-xl border px-4 py-3 text-[14px] font-semibold transition-all ${
                      !isCustomToken
                        ? "border-[#7655fb] bg-[#7655fb]/5 font-bold text-[#7655fb] shadow-sm"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Standard (20 tokens)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCustomToken(true)}
                    className={`flex-1 rounded-xl border px-4 py-3 text-[14px] font-semibold transition-all ${
                      isCustomToken
                        ? "border-[#7655fb] bg-[#7655fb]/5 font-bold text-[#7655fb] shadow-sm"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Custom Amount
                  </button>
                </div>

                {isCustomToken && (
                  <div className="mt-4">
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Enter custom tokens
                    </label>
                    <input
                      type="number"
                      min="20"
                      value={customTokenValue}
                      onChange={(event) => {
                        const value = event.target.value;
                        setCustomTokenValue(value);
                        setTokenCommitment(Number.parseInt(value, 10) || 0);
                      }}
                      placeholder="e.g. 50"
                      className={`w-full rounded-xl border px-4 py-2.5 text-[14px] outline-none focus:border-[#7655fb] ${
                        customTokenValue &&
                        Number.parseInt(customTokenValue, 10) < MIN_COMMIT_TOKENS
                          ? "border-rose-500 bg-rose-50/10 focus:border-rose-500"
                          : "border-[#ccd2e2]"
                      }`}
                    />
                    {customTokenValue &&
                      Number.parseInt(customTokenValue, 10) <
                        MIN_COMMIT_TOKENS && (
                        <p className="mt-1.5 text-[12px] font-semibold text-rose-600">
                          Custom commitment must be at least {MIN_COMMIT_TOKENS} tokens.
                        </p>
                      )}
                  </div>
                )}
              </div>

              <p className="mt-8 text-[18px] font-bold text-[#7655fb]">
                Total Staked Commitment: {tokenCommitment} tokens
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    isSaving ||
                    (isCustomToken &&
                      (!customTokenValue ||
                        Number.parseInt(customTokenValue, 10) <
                          MIN_COMMIT_TOKENS))
                  }
                  className="gh-btn-primary min-w-[150px] px-8 py-3 text-[18px] disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
                >
                  {isSaving ? "Saving..." : "Yes, commit"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCommitConfirm(false)}
                  disabled={isSaving}
                  className="flex min-w-[150px] items-center justify-center rounded-full border border-[#ff8b97] bg-white px-8 py-3 text-[18px] font-medium text-[#ff6f7d] transition-colors hover:bg-[#fff5f7] disabled:opacity-50"
                >
                  No, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insufficient Tokens Modal */}
      {showInsufficientTokens && (
        <div className="fixed inset-0 z-[81] flex items-center justify-center bg-[#1b1a1a]/55 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-[820px] rounded-[28px] border border-white/80 bg-white/95 px-8 py-10 shadow-[0_32px_80px_rgba(24,33,77,0.16)] sm:px-14 sm:py-12">
            <button
              type="button"
              onClick={() => setShowInsufficientTokens(false)}
              className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full text-[#262525] transition-colors hover:bg-[#f4f6fb]"
              aria-label="Close insufficient tokens dialog"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 6L18 18M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div className="flex flex-col items-center text-center">
              <p className="mt-10 text-[24px] font-bold leading-[1.6] text-[#262525] font-secondary sm:text-[28px]">
                You don&apos;t have enough tokens to activate this goal
              </p>

              <div className="mt-16 flex flex-wrap items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={handleGoToGetToken}
                  className="gh-btn-primary min-w-[150px] px-8 py-3 text-[18px]"
                >
                  Get token
                </button>
                <button
                  type="button"
                  onClick={() => setShowInsufficientTokens(false)}
                  className="flex min-w-[150px] items-center justify-center rounded-full border border-[#ff8b97] bg-white px-8 py-3 text-[18px] font-medium text-[#ff6f7d] transition-colors hover:bg-[#fff5f7]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
