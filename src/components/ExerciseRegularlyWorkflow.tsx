"use client";

import React, { type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import GoalRefereeForm, {
  type ExerciseRefereeFormData,
} from "@/components/GoalRefereeForm";
import GoalSupportersForm, {
  type ExerciseSupportersFormData,
} from "@/components/GoalSupportersForm";

interface ExerciseRegularlyWorkflowProps {
  goalTitle?: string;
  onCancel: () => void;
}

interface ExerciseTargetFormData {
  daysPerWeek: string;
  sessionDuration: string;
  exerciseType: string;
  startDate: string;
  reportingDay: string;
}

const TOTAL_STEPS = 4;
const MIN_COMMIT_TOKENS = 20;

const DEFAULT_TARGET: ExerciseTargetFormData = {
  daysPerWeek: "3 days",
  sessionDuration: "15 minutes",
  exerciseType: "Cardio",
  startDate: "Today",
  reportingDay: "Tuesday",
};

const DEFAULT_REFEREE: ExerciseRefereeFormData = {
  refereeType: "Individual referee",
  refereeContact: "",
  selfManaged: false,
};

const DEFAULT_SUPPORTERS: ExerciseSupportersFormData = {
  autoAccept: false,
  supporters: "",
};

const CHALLENGE_OPTIONS = [
  "Lack of time",
  "Lack of motivation",
  "Feeling tired or low energy",
  "Too many distractions",
  "No proper workout plan",
  "Lack of support or accountability",
  "Unhealthy eating habits",
  "Other",
];

function resolveStartDate(label: string) {
  const date = new Date();

  if (label === "Tomorrow") {
    date.setDate(date.getDate() + 1);
  } else if (label === "Next Week") {
    date.setDate(date.getDate() + 7);
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
  visualTitle,
  visualBody,
  visualImageSrc,
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
  visualTitle: string;
  visualBody: string;
  visualImageSrc: string;
  onBack: () => void;
  onCancel: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
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

        <ProgressBar currentStep={currentStep} />

        <div className="hidden w-[48px] lg:block" />
      </div>

      <div className="mt-12 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f1edff] text-[#262525]">
          {icon}
        </div>
        <h2 className="text-[28px] font-bold text-[#262525] font-secondary">
          {title}
        </h2>
      </div>

      <div className="mt-8 w-full px-4 lg:px-0">
        <h3 className="text-[30px] font-bold text-[#262525] font-secondary sm:text-[40px]">
          {goalTitle}
        </h3>
        <div className="mt-4">
          <PrivacyNotice />
        </div>
      </div>

      <div className="mt-8 grid w-full grid-cols-1 gap-8 px-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-0">
        <div className="gh-panel-soft p-6 sm:p-8">{children}</div>

        <div className="relative hidden overflow-hidden rounded-[28px] border border-[#eceff7] bg-white p-6 shadow-[0_20px_45px_rgba(24,33,77,0.08)] lg:flex lg:flex-col">
          <div className="absolute right-[-40px] top-[-40px] h-[120px] w-[120px] rounded-full bg-[#ebe5ff]" />
          <div className="absolute bottom-[-30px] left-[-20px] h-[90px] w-[90px] rounded-full bg-[#eef4ff]" />

          <div className="relative">
            <div className="relative mx-auto h-[180px] w-[180px]">
              <Image
                src={visualImageSrc}
                alt={visualTitle}
                fill
                className="object-contain"
              />
            </div>
            <div className="mt-6 rounded-[22px] bg-[#f7f8ff] p-5">
              <p className="text-[18px] font-semibold text-[#262525] font-secondary">
                {visualTitle}
              </p>
              <p className="mt-3 text-[14px] leading-6 text-[#5a6075]">
                {visualBody}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-10 mt-12 flex w-full flex-wrap items-center justify-center gap-5">
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

function ChallengeOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-4 rounded-[18px] border px-4 py-4 text-left transition-colors ${
        selected
          ? "border-[#7655fb] bg-[#f3efff]"
          : "border-[#e4e8f2] bg-white hover:border-[#7655fb]"
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] border-2 ${
          selected
            ? "border-[#7655fb] bg-[#7655fb]"
            : "border-[#d3d9e8] bg-[#fbfbff]"
        }`}
      >
        {selected && (
          <svg
            width="14"
            height="11"
            viewBox="0 0 14 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 5L5 9L13 1"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="text-[16px] text-[#262525] font-secondary">{label}</span>
    </button>
  );
}

export default function ExerciseRegularlyWorkflow({
  goalTitle = "Exercise regularly",
  onCancel,
}: ExerciseRegularlyWorkflowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [target, setTarget] = useState<ExerciseTargetFormData>(DEFAULT_TARGET);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [referee, setReferee] =
    useState<ExerciseRefereeFormData>(DEFAULT_REFEREE);
  const [supporters, setSupporters] =
    useState<ExerciseSupportersFormData>(DEFAULT_SUPPORTERS);
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
        return (
          target.daysPerWeek.length > 0 &&
          target.sessionDuration.length > 0 &&
          target.exerciseType.length > 0 &&
          target.startDate.length > 0 &&
          target.reportingDay.length > 0
        );
      case 2:
        return challenges.length > 0;
      case 3:
        return referee.selfManaged || referee.refereeContact.trim().length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      setErrorMessage("Complete this step before continuing.");
      return;
    }

    if (step < TOTAL_STEPS) {
      moveToStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      onCancel();
      return;
    }

    moveToStep(step - 1);
  };

  const handleToggleChallenge = (challenge: string) => {
    setErrorMessage(null);
    setChallenges((current) =>
      current.includes(challenge)
        ? current.filter((entry) => entry !== challenge)
        : [...current, challenge],
    );
  };

  const handleOpenCommitConfirm = () => {
    if (!validateStep(4)) {
      setErrorMessage("Complete this step before continuing.");
      return;
    }

    setErrorMessage(null);
    setShowCommitConfirm(true);
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

      if (!referee.selfManaged && referee.refereeContact.trim().length === 0) {
        setErrorMessage(
          "Enter your referee email or choose to do it on your own.",
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

      const startDate = resolveStartDate(target.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 84);

      const description = [
        `Exercise ${target.daysPerWeek}.`,
        `Each session lasts ${target.sessionDuration}.`,
        `Focus area: ${target.exerciseType}.`,
        `Reporting day: ${target.reportingDay}.`,
        challenges.length > 0 ? `Challenges: ${challenges.join(", ")}.` : null,
        referee.selfManaged
          ? "Referee preference: self-managed accountability."
          : `Referee type: ${referee.refereeType}. Referee contact: ${referee.refereeContact}.`,
        supporters.autoAccept
          ? "Supporters setting: auto-accept supporters enabled."
          : null,
        supporters.supporters.trim().length > 0
          ? `Invited supporters: ${supporters.supporters
              .split(/\r?\n/)
              .map((entry) => entry.trim())
              .filter(Boolean)
              .join(", ")}.`
          : null,
      ]
        .filter(Boolean)
        .join(" ");

      if (!referee.selfManaged) {
        localStorage.setItem(
          "goalhyke_referee",
          JSON.stringify({
            name: referee.refereeContact,
            email: referee.refereeContact,
            avatar: "",
          }),
        );
      } else {
        localStorage.removeItem("goalhyke_referee");
      }

      const metadata = {
        committed_tokens: tokenCommitment,
        remaining_committed: tokenCommitment,
        failures_count: 0,
        failures_logged: [],
        success_logged: [],
        deductions_history: [],
        submission_mode: submissionMode,
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

        {step === 1 && (
          <StepShell
            currentStep={1}
            title="Set Your Target"
            goalTitle={goalTitle}
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="8.5"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 7V12L15.5 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            }
            visualTitle="Define the workout commitment"
            visualBody="Set the cadence, session length, workout type, start timing, and reporting rhythm that shape the exercise commitment."
            visualImageSrc="/images/goal-exercise.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="How many days per week would you like to exercise?"
                value={target.daysPerWeek}
                onChange={(value) =>
                  setTarget((current) => ({ ...current, daysPerWeek: value }))
                }
                options={[
                  "1 day",
                  "2 days",
                  "3 days",
                  "4 days",
                  "5 days",
                  "6 days",
                  "7 days",
                ]}
              />
              <SelectQuestion
                label="How long do you plan to work out each session?"
                value={target.sessionDuration}
                onChange={(value) =>
                  setTarget((current) => ({
                    ...current,
                    sessionDuration: value,
                  }))
                }
                options={[
                  "15 minutes",
                  "30 minutes",
                  "45 minutes",
                  "1 hour",
                ]}
              />
              <SelectQuestion
                label="What type of exercise will you focus on?"
                value={target.exerciseType}
                onChange={(value) =>
                  setTarget((current) => ({ ...current, exerciseType: value }))
                }
                options={["Cardio", "Strength", "Yoga", "HIIT"]}
              />
              <SelectQuestion
                label="This commitment starts:"
                value={target.startDate}
                onChange={(value) =>
                  setTarget((current) => ({ ...current, startDate: value }))
                }
                options={["Today", "Tomorrow", "Next Week"]}
              />
              <SelectQuestion
                label="My reporting days will be:"
                value={target.reportingDay}
                onChange={(value) =>
                  setTarget((current) => ({ ...current, reportingDay: value }))
                }
                options={[
                  "Everyday",
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ]}
              />
            </div>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell
            currentStep={2}
            title="Identify Your Challenges"
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
                  d="M10.5 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V13.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M14 6L18 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M8 14L16 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            }
            visualTitle="Capture the blockers"
            visualBody="Select the obstacles that are most likely to interrupt the exercise routine so your accountability flow reflects the real friction."
            visualImageSrc="/images/progress-consistency-character.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-5">
              <p className="text-[18px] font-medium leading-7 text-[#262525] font-secondary">
                What challenges might stop you from achieving your goal?
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {CHALLENGE_OPTIONS.map((challenge) => (
                  <ChallengeOption
                    key={challenge}
                    label={challenge}
                    selected={challenges.includes(challenge)}
                    onClick={() => handleToggleChallenge(challenge)}
                  />
                ))}
              </div>
            </div>
          </StepShell>
        )}

        {step === 3 && (
          <GoalRefereeForm
            goalTitle={goalTitle}
            value={referee}
            onChange={(value) => {
              setErrorMessage(null);
              setReferee(value);
            }}
            onCancel={onCancel}
            onBack={handleBack}
            onNext={handleNext}
            progressSteps={TOTAL_STEPS}
            activeIndex={2}
            refereeOptions={["Individual referee", "On your Honor"]}
            selfManagedOptionLabel="On your Honor"
          />
        )}

        {step === 4 && (
          <GoalSupportersForm
            goalTitle={goalTitle}
            value={supporters}
            onChange={(value) => {
              setErrorMessage(null);
              setSupporters(value);
            }}
            onCancel={onCancel}
            onBack={handleBack}
            onSubmit={handleOpenCommitConfirm}
            isSubmitting={isSaving}
            submitLabel="Next"
            progressSteps={TOTAL_STEPS}
            activeIndex={3}
          />
        )}
      </div>

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
