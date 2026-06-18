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

interface ReadMoreWorkflowProps {
  goalTitle?: string;
  onCancel: () => void;
}

interface ReadMoreWhyData {
  motivation: string;
  inspiration: string;
  longTermBenefit: string;
  lifeChange: string;
  ultimateWhy: string;
}

interface ReadMoreChallengesData {
  obstacle: string;
  skipTime: string;
  environment: string;
  internalStruggle: string;
  firstChallengeToSolve: string;
}

interface ReadMoreAccountabilityData {
  trackingMethod: string;
  reminders: string;
  journeyVisibility: string;
  milestoneCelebration: string;
  crushItGuidance: string;
}

interface ReadMoreVisualizationData {
  readerIdentity: string;
  lifeImprovement: string;
  proudMilestone: string;
  endOfSessionFeeling: string;
  readingJourneyVisualization: string;
}

interface ReadMoreTargetData {
  readingType: string;
  amountGoal: string;
  readingTimeCommitment: string;
  timeframe: string;
  reminderTiming: string;
  progressMetric: string;
}

const TOTAL_STEPS = 7;
const REQUIRED_COMMIT_TOKENS = 50;

const DEFAULT_WHY: ReadMoreWhyData = {
  motivation: "",
  inspiration: "",
  longTermBenefit: "",
  lifeChange: "",
  ultimateWhy: "",
};

const DEFAULT_CHALLENGES: ReadMoreChallengesData = {
  obstacle: "",
  skipTime: "",
  environment: "",
  internalStruggle: "",
  firstChallengeToSolve: "",
};

const DEFAULT_ACCOUNTABILITY: ReadMoreAccountabilityData = {
  trackingMethod: "",
  reminders: "",
  journeyVisibility: "",
  milestoneCelebration: "",
  crushItGuidance: "",
};

const DEFAULT_VISUALIZATION: ReadMoreVisualizationData = {
  readerIdentity: "",
  lifeImprovement: "",
  proudMilestone: "",
  endOfSessionFeeling: "",
  readingJourneyVisualization: "",
};

const DEFAULT_SUPPORTERS: ExerciseSupportersFormData = {
  autoAccept: false,
  supporters: "",
};

const DEFAULT_REFEREE: ExerciseRefereeFormData = {
  refereeType: "Individual referee",
  refereeContact: "",
  selfManaged: false,
};

const DEFAULT_TARGET: ReadMoreTargetData = {
  readingType: "",
  amountGoal: "",
  readingTimeCommitment: "",
  timeframe: "",
  reminderTiming: "",
  progressMetric: "",
};

function formatDateForInput(date: Date) {
  return date.toISOString().split("T")[0];
}

function resolveReadMoreEndDate(timeframe: string) {
  const start = new Date();
  const end = new Date(start);

  switch (timeframe) {
    case "2 weeks":
      end.setDate(end.getDate() + 14);
      break;
    case "1 month":
      end.setMonth(end.getMonth() + 1);
      break;
    case "3 months":
      end.setMonth(end.getMonth() + 3);
      break;
    case "6 months":
      end.setMonth(end.getMonth() + 6);
      break;
    case "1 year":
      end.setFullYear(end.getFullYear() + 1);
      break;
    default:
      end.setMonth(end.getMonth() + 1);
      break;
  }

  return {
    startDate: formatDateForInput(start),
    endDate: formatDateForInput(end),
  };
}

function isFilled(value: string) {
  return value.trim().length > 0;
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
      <div className="relative max-w-[460px]">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="gh-select h-[58px] w-full rounded-[16px] border-[#ccd2e2] bg-white pr-12 text-[16px] font-secondary shadow-none"
        >
          <option value="">--select--</option>
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

function TextQuestion({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex flex-col gap-3">
      <span className="text-[18px] font-medium leading-7 text-[#262525] font-secondary">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-[58px] w-full max-w-[620px] rounded-[16px] border border-[#ccd2e2] bg-white px-5 text-[16px] text-[#262525] outline-none transition-colors placeholder:text-[#9fa6bb] focus:border-[#7655fb]"
      />
    </label>
  );
}

function TextareaQuestion({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex flex-col gap-3">
      <span className="text-[18px] font-medium leading-7 text-[#262525] font-secondary">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-[120px] w-full max-w-[620px] rounded-[18px] border border-[#ccd2e2] bg-white px-5 py-4 text-[16px] text-[#262525] outline-none transition-colors placeholder:text-[#9fa6bb] focus:border-[#7655fb]"
      />
    </label>
  );
}

export default function ReadMoreWorkflow({
  goalTitle = "Read More",
  onCancel,
}: ReadMoreWorkflowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [why, setWhy] = useState<ReadMoreWhyData>(DEFAULT_WHY);
  const [challenges, setChallenges] =
    useState<ReadMoreChallengesData>(DEFAULT_CHALLENGES);
  const [accountability, setAccountability] =
    useState<ReadMoreAccountabilityData>(DEFAULT_ACCOUNTABILITY);
  const [visualization, setVisualization] =
    useState<ReadMoreVisualizationData>(DEFAULT_VISUALIZATION);
  const [supporters, setSupporters] =
    useState<ExerciseSupportersFormData>(DEFAULT_SUPPORTERS);
  const [referee, setReferee] =
    useState<ExerciseRefereeFormData>(DEFAULT_REFEREE);
  const [target, setTarget] = useState<ReadMoreTargetData>(DEFAULT_TARGET);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCommitConfirm, setShowCommitConfirm] = useState(false);
  const [showInsufficientTokens, setShowInsufficientTokens] = useState(false);
  const [showGoalCreated, setShowGoalCreated] = useState(false);

  const moveToStep = (nextStep: number) => {
    setErrorMessage(null);
    setStep(nextStep);
  };

  const validateStep = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        return (
          isFilled(why.motivation) &&
          isFilled(why.inspiration) &&
          isFilled(why.longTermBenefit) &&
          isFilled(why.lifeChange) &&
          isFilled(why.ultimateWhy)
        );
      case 2:
        return (
          isFilled(challenges.obstacle) &&
          isFilled(challenges.skipTime) &&
          isFilled(challenges.environment) &&
          isFilled(challenges.internalStruggle) &&
          isFilled(challenges.firstChallengeToSolve)
        );
      case 3:
        return (
          isFilled(accountability.trackingMethod) &&
          isFilled(accountability.reminders) &&
          isFilled(accountability.journeyVisibility) &&
          isFilled(accountability.milestoneCelebration) &&
          isFilled(accountability.crushItGuidance)
        );
      case 4:
        return (
          isFilled(visualization.readerIdentity) &&
          isFilled(visualization.lifeImprovement) &&
          isFilled(visualization.proudMilestone) &&
          isFilled(visualization.endOfSessionFeeling) &&
          isFilled(visualization.readingJourneyVisualization)
        );
      case 5:
        return true;
      case 6:
        return referee.selfManaged || isFilled(referee.refereeContact);
      case 7:
        return (
          isFilled(target.readingType) &&
          isFilled(target.amountGoal) &&
          isFilled(target.readingTimeCommitment) &&
          isFilled(target.timeframe) &&
          isFilled(target.reminderTiming) &&
          isFilled(target.progressMetric)
        );
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

  const handleOpenCommitConfirm = () => {
    if (!validateStep(7)) {
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("tokens")
        .eq("id", user.id)
        .maybeSingle();

      const tokenBalance =
        profile && typeof profile.tokens === "number" ? profile.tokens : 0;

      if (tokenBalance < REQUIRED_COMMIT_TOKENS) {
        setShowCommitConfirm(false);
        setShowInsufficientTokens(true);
        return;
      }

      const { startDate, endDate } = resolveReadMoreEndDate(target.timeframe);

      const description = [
        `Why read more: ${why.motivation}.`,
        `Inspiration source: ${why.inspiration}.`,
        `Expected long-term benefit: ${why.longTermBenefit}.`,
        `Life change if successful: ${why.lifeChange}.`,
        `Ultimate reading why: ${why.ultimateWhy}.`,
        `Main obstacle: ${challenges.obstacle}.`,
        `Most likely skip-reading time: ${challenges.skipTime}.`,
        `Hard environment: ${challenges.environment}.`,
        `Internal struggle: ${challenges.internalStruggle}.`,
        `Challenge for CrushIT to solve first: ${challenges.firstChallengeToSolve}.`,
        `Tracking method: ${accountability.trackingMethod}.`,
        `Reminder preference: ${accountability.reminders}.`,
        `Journey visibility: ${accountability.journeyVisibility}.`,
        `Milestone celebration: ${accountability.milestoneCelebration}.`,
        `CrushIT guidance: ${accountability.crushItGuidance}.`,
        `Desired reader identity: ${visualization.readerIdentity}.`,
        `How reading improves life: ${visualization.lifeImprovement}.`,
        `Proud milestone: ${visualization.proudMilestone}.`,
        `Desired end-of-session feeling: ${visualization.endOfSessionFeeling}.`,
        `Reading journey visualization: ${visualization.readingJourneyVisualization}.`,
        supporters.autoAccept
          ? "Supporters setting: auto-accept enabled."
          : "Supporters setting: manual supporter approval.",
        supporters.supporters.trim().length > 0
          ? `Invited supporters: ${supporters.supporters
              .split(/\r?\n/)
              .map((entry) => entry.trim())
              .filter(Boolean)
              .join(", ")}.`
          : null,
        referee.selfManaged
          ? "Referee preference: On your Honor."
          : `Referee: ${referee.refereeType} (${referee.refereeContact}).`,
        `Reading focus: ${target.readingType}.`,
        `Reading amount target: ${target.amountGoal}.`,
        `Reading time commitment: ${target.readingTimeCommitment}.`,
        `Target timeframe: ${target.timeframe}.`,
        `Reminder timing: ${target.reminderTiming}.`,
        `Progress metric: ${target.progressMetric}.`,
      ]
        .filter(Boolean)
        .join(" ");

      if (referee.selfManaged) {
        localStorage.removeItem("goalhyke_referee");
      } else {
        localStorage.setItem(
          "goalhyke_referee",
          JSON.stringify({
            name: referee.refereeContact,
            email: referee.refereeContact,
            avatar: "/images/nav-avatar.png",
          }),
        );
      }

      const { error } = await supabase.from("goals").insert({
        user_id: user.id,
        title: goalTitle,
        category: "Read more",
        description,
        start_date: startDate,
        end_date: endDate,
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
            title="Set Your Why"
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
                  d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 8V12L15 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            }
            visualTitle="Define your reading reason"
            visualBody="This step captures why reading matters to you so the goal feels meaningful and personal from the beginning."
            visualImageSrc="/images/progress-consistency-character.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="Why do you want to read more?"
                value={why.motivation}
                onChange={(value) =>
                  setWhy((current) => ({ ...current, motivation: value }))
                }
                options={[
                  "To gain knowledge and learn new things",
                  "To improve my vocabulary and communication",
                  "To relax and reduce stress",
                  "To boost my career or academic performance",
                  "To spark creativity and imagination",
                ]}
              />
              <SelectQuestion
                label="Who or what is inspiring you to read more?"
                value={why.inspiration}
                onChange={(value) =>
                  setWhy((current) => ({ ...current, inspiration: value }))
                }
                options={[
                  "Myself (self-growth)",
                  "A mentor or teacher",
                  "Family or friends",
                  "Role models or authors",
                ]}
              />
              <SelectQuestion
                label="What long-term benefits do you expect from reading more?"
                value={why.longTermBenefit}
                onChange={(value) =>
                  setWhy((current) => ({ ...current, longTermBenefit: value }))
                }
                options={[
                  "Smarter decision-making",
                  "Improved focus and discipline",
                  "Better career opportunities",
                  "Personal enjoyment and fulfillment",
                ]}
              />
              <TextareaQuestion
                label="What will change in your life if you succeed in this reading goal?"
                value={why.lifeChange}
                onChange={(value) =>
                  setWhy((current) => ({ ...current, lifeChange: value }))
                }
                placeholder="Reading more will change my life because..."
              />
              <TextareaQuestion
                label="In one sentence, describe your ultimate “Why” for wanting to read more."
                value={why.ultimateWhy}
                onChange={(value) =>
                  setWhy((current) => ({ ...current, ultimateWhy: value }))
                }
                placeholder="I want to read more so I can..."
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
            visualTitle="Spot what gets in the way"
            visualBody="This step makes the real reading blockers visible so the rest of the workflow can support the habit more effectively."
            visualImageSrc="/images/goal-exercise.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="What usually stops you from reading more?"
                value={challenges.obstacle}
                onChange={(value) =>
                  setChallenges((current) => ({ ...current, obstacle: value }))
                }
                options={[
                  "Lack of time",
                  "Getting easily distracted (social media, TV, etc)",
                  "Not finding books that interest me",
                  "Losing motivation after starting a book",
                  "Feeling too tired or stressed to read",
                ]}
              />
              <SelectQuestion
                label="When are you most likely to skip reading?"
                value={challenges.skipTime}
                onChange={(value) =>
                  setChallenges((current) => ({ ...current, skipTime: value }))
                }
                options={[
                  "Early morning",
                  "During the day",
                  "At night",
                  "Weekdays",
                  "Weekends",
                ]}
              />
              <SelectQuestion
                label="What environment makes it harder for you to read?"
                value={challenges.environment}
                onChange={(value) =>
                  setChallenges((current) => ({ ...current, environment: value }))
                }
                options={[
                  "Noisy surroundings",
                  "Too many responsibilities at home or work",
                  "Not having a comfortable reading space",
                  "Too many interruptions around me",
                ]}
              />
              <SelectQuestion
                label="What’s your biggest internal struggle with reading?"
                value={challenges.internalStruggle}
                onChange={(value) =>
                  setChallenges((current) => ({
                    ...current,
                    internalStruggle: value,
                  }))
                }
                options={[
                  "I get bored quickly",
                  "I don’t understand complex content",
                  "I read slowly and lose momentum",
                  "I lack discipline to be consistent",
                ]}
              />
              <SelectQuestion
                label="Which challenge do you want CrushIT to help you overcome first?"
                value={challenges.firstChallengeToSolve}
                onChange={(value) =>
                  setChallenges((current) => ({
                    ...current,
                    firstChallengeToSolve: value,
                  }))
                }
                options={[
                  "Distraction, suggest an accountability tool",
                  "Finding books, recommend book lists",
                  "Consistency, push reminders and check-ins",
                  "Momentum, help me finish what I start",
                ]}
              />
            </div>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell
            currentStep={3}
            title="Choose Your Accountability Tool"
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
                  x="4"
                  y="5"
                  width="16"
                  height="14"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M8 10H16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M8 14H13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            }
            visualTitle="Choose your reading system"
            visualBody="This step defines how progress will be tracked, who can see it, and how GoalHyke will help keep the reading habit alive."
            visualImageSrc="/images/milestones-character.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="How would you like to track your reading progress?"
                value={accountability.trackingMethod}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    trackingMethod: value,
                  }))
                }
                options={[
                  "Daily reading logs (minutes or pages)",
                  "Book completion tracker",
                  "Streak counter",
                  "Reading calendar",
                ]}
              />
              <SelectQuestion
                label="Would you like reminders to help you stay on track?"
                value={accountability.reminders}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    reminders: value,
                  }))
                }
                options={[
                  "Yes, daily reminders",
                  "Yes, weekly progress check-ins",
                  "No, I prefer self motivation",
                ]}
              />
              <SelectQuestion
                label="Do you want to share your reading journey with others?"
                value={accountability.journeyVisibility}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    journeyVisibility: value,
                  }))
                }
                options={[
                  "Join a reading buddy or group",
                  "Share progress with a friend or family member",
                  "Keep it private",
                ]}
              />
              <SelectQuestion
                label="How do you want to celebrate milestones?"
                value={accountability.milestoneCelebration}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    milestoneCelebration: value,
                  }))
                }
                options={[
                  "Virtual badges or trophies",
                  "Unlock book recommendations",
                  "Share achievement on social media",
                  "Personal reflection journal",
                ]}
              />
              <SelectQuestion
                label="Would you like CrushIT to guide your accountability?"
                value={accountability.crushItGuidance}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    crushItGuidance: value,
                  }))
                }
                options={[
                  "Yes, get personalized book suggestions and motivational nudges",
                  "No, I’ll set my own rules",
                ]}
              />
            </div>
          </StepShell>
        )}

        {step === 4 && (
          <StepShell
            currentStep={4}
            title="Visualize Success"
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
                  r="9"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            }
            visualTitle="Picture the reader you are becoming"
            visualBody="This step makes the outcome vivid so the reading habit feels connected to a bigger identity, not just a checklist."
            visualImageSrc="/images/behavioural-solution.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="Imagine yourself a year from now, what kind of reader do you want to be?"
                value={visualization.readerIdentity}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    readerIdentity: value,
                  }))
                }
                options={[
                  "A consistent reader (finishing books regularly)",
                  "A fast learner (reading for knowledge)",
                  "A relaxed reader (reading for joy and calm)",
                ]}
              />
              <SelectQuestion
                label="How will building a reading habit improve your life?"
                value={visualization.lifeImprovement}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    lifeImprovement: value,
                  }))
                }
                options={[
                  "Expand my knowledge and skills",
                  "Reduce stress and improve focus",
                  "Boost my career or academic performance",
                  "Strengthen my imagination and creativity",
                ]}
              />
              <SelectQuestion
                label="What milestone would make you proud?"
                value={visualization.proudMilestone}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    proudMilestone: value,
                  }))
                }
                options={[
                  "Reading 7 books in a year",
                  "Reading at least 3 hours daily",
                  "Completing a book every month",
                  "Finishing books I’ve always wanted to read",
                ]}
              />
              <SelectQuestion
                label="How do you want to feel at the end of each reading session?"
                value={visualization.endOfSessionFeeling}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    endOfSessionFeeling: value,
                  }))
                }
                options={[
                  "Inspired",
                  "Relaxed",
                  "Accomplished",
                  "Curious to learn more",
                ]}
              />
              <SelectQuestion
                label="Would you like to visualize your reading journey?"
                value={visualization.readingJourneyVisualization}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    readingJourneyVisualization: value,
                  }))
                }
                options={[
                  "Yes, show progress chart, virtual bookshelf, badges",
                  "No, keep it simple with numbers",
                ]}
              />
            </div>
          </StepShell>
        )}

        {step === 5 && (
          <GoalSupportersForm
            goalTitle={goalTitle}
            value={supporters}
            onChange={(value) => {
              setErrorMessage(null);
              setSupporters(value);
            }}
            onCancel={onCancel}
            onBack={handleBack}
            onSubmit={handleNext}
            submitLabel="Next"
            progressSteps={TOTAL_STEPS}
            activeIndex={4}
          />
        )}

        {step === 6 && (
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
            activeIndex={5}
            refereeOptions={["Individual referee", "On your Honor"]}
            selfManagedOptionLabel="On your Honor"
          />
        )}

        {step === 7 && (
          <StepShell
            currentStep={7}
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
            visualTitle="Turn reading into a measurable commitment"
            visualBody="The final step defines what you will read, how much progress you want, the timeframe, and how GoalHyke should measure the commitment."
            visualImageSrc="/images/goal-exercise.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleOpenCommitConfirm}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="What type of reading do you want to focus on?"
                value={target.readingType}
                onChange={(value) =>
                  setTarget((current) => ({ ...current, readingType: value }))
                }
                options={[
                  "Books (fiction, non-fiction, self-help, etc)",
                  "Articles, blogs, newspaper",
                  "Academic papers or study material",
                  "Audiobooks",
                  "A mix of everything",
                ]}
              />
              <TextQuestion
                label="How many books/pages/chapters do you want to read?"
                value={target.amountGoal}
                onChange={(value) =>
                  setTarget((current) => ({ ...current, amountGoal: value }))
                }
                placeholder="e.g. 12 books, 40 pages a week, 3 chapters daily"
              />
              <SelectQuestion
                label="How much time do you want to dedicate to reading daily or weekly?"
                value={target.readingTimeCommitment}
                onChange={(value) =>
                  setTarget((current) => ({
                    ...current,
                    readingTimeCommitment: value,
                  }))
                }
                options={[
                  "15 minutes daily",
                  "30 minutes daily",
                  "1 hour daily",
                  "3 hours weekly",
                ]}
              />
              <SelectQuestion
                label="What’s your target timeframe for this goal?"
                value={target.timeframe}
                onChange={(value) =>
                  setTarget((current) => ({ ...current, timeframe: value }))
                }
                options={["2 weeks", "1 month", "3 months", "6 months", "1 year"]}
              />
              <SelectQuestion
                label="Do you want reminders to read? If yes, when?"
                value={target.reminderTiming}
                onChange={(value) =>
                  setTarget((current) => ({
                    ...current,
                    reminderTiming: value,
                  }))
                }
                options={[
                  "Yes, morning reminders",
                  "Yes, evening reminders",
                  "Yes, weekends only",
                  "No reminders",
                ]}
              />
              <SelectQuestion
                label="Do you want to track your progress by pages, time, or books completed?"
                value={target.progressMetric}
                onChange={(value) =>
                  setTarget((current) => ({ ...current, progressMetric: value }))
                }
                options={[
                  "Pages read",
                  "Time spent reading",
                  "Books completed",
                  "A mix of pages, time, and books",
                ]}
              />
            </div>
          </StepShell>
        )}
      </div>

      {showGoalCreated && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1b1a1a]/50 px-4">
          <div className="relative w-full max-w-[820px] rounded-[18px] bg-white px-8 py-10 shadow-[0_30px_60px_rgba(16,24,40,0.2)] sm:px-14 sm:py-12">
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
              <h2 className="mt-7 text-[28px] font-semibold text-[#262525] font-secondary">
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
        <div className="fixed inset-0 z-[79] flex items-center justify-center bg-[#1b1a1a]/50 px-4">
          <div className="relative w-full max-w-[820px] rounded-[18px] bg-white px-8 py-10 shadow-[0_30px_60px_rgba(16,24,40,0.2)] sm:px-14 sm:py-12">
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
              <p className="mt-10 text-[24px] font-medium leading-[1.6] text-[#262525] font-secondary sm:text-[28px]">
                You will be charged {REQUIRED_COMMIT_TOKENS} points if you fail to
                complete the goal
              </p>

              <div className="mt-16 flex flex-wrap items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving}
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
                  No, cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInsufficientTokens && (
        <div className="fixed inset-0 z-[81] flex items-center justify-center bg-[#1b1a1a]/50 px-4">
          <div className="relative w-full max-w-[820px] rounded-[18px] bg-white px-8 py-10 shadow-[0_30px_60px_rgba(16,24,40,0.2)] sm:px-14 sm:py-12">
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
              <p className="mt-10 text-[24px] font-medium leading-[1.6] text-[#262525] font-secondary sm:text-[28px]">
                You don&apos;t have enough token to activate this goal
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
