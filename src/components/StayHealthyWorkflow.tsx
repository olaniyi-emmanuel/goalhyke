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

interface StayHealthyWorkflowProps {
  goalTitle?: string;
  onCancel: () => void;
}

interface StayHealthyWhyData {
  importance: string;
  doingFor: string;
  lifeChange: string;
  fear: string;
  ultimateWhy: string;
}

interface StayHealthyChallengesData {
  obstacle: string;
  distraction: string;
  giveUpMoment: string;
  trigger: string;
  supportPreference: string;
}

interface StayHealthyAccountabilityData {
  tool: string;
  checkInFrequency: string;
  helpfulSupport: string;
  visibleToOthers: string;
  rewardsOrConsequences: string;
}

interface StayHealthyVisualizationData {
  selfDescription: string;
  physicalChanges: string;
  lifestyleImprovements: string;
  unlockedAbility: string;
  visionBoard: string;
}

interface StayHealthyTargetData {
  primaryHealthGoal: string;
  timeCommitment: string;
  measurableTarget: string;
  focusActivity: string;
  timeframe: string;
  reminders: string;
}

const TOTAL_STEPS = 7;
const REQUIRED_COMMIT_TOKENS = 50;

const DEFAULT_WHY: StayHealthyWhyData = {
  importance: "",
  doingFor: "",
  lifeChange: "",
  fear: "",
  ultimateWhy: "",
};

const DEFAULT_CHALLENGES: StayHealthyChallengesData = {
  obstacle: "",
  distraction: "",
  giveUpMoment: "",
  trigger: "",
  supportPreference: "",
};

const DEFAULT_ACCOUNTABILITY: StayHealthyAccountabilityData = {
  tool: "",
  checkInFrequency: "",
  helpfulSupport: "",
  visibleToOthers: "",
  rewardsOrConsequences: "",
};

const DEFAULT_VISUALIZATION: StayHealthyVisualizationData = {
  selfDescription: "",
  physicalChanges: "",
  lifestyleImprovements: "",
  unlockedAbility: "",
  visionBoard: "",
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

const DEFAULT_TARGET: StayHealthyTargetData = {
  primaryHealthGoal: "",
  timeCommitment: "",
  measurableTarget: "",
  focusActivity: "",
  timeframe: "",
  reminders: "",
};

function formatDateForInput(date: Date) {
  return date.toISOString().split("T")[0];
}

function resolveStayHealthyEndDate(timeframe: string) {
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

export default function StayHealthyWorkflow({
  goalTitle = "Stay Healthy",
  onCancel,
}: StayHealthyWorkflowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [why, setWhy] = useState<StayHealthyWhyData>(DEFAULT_WHY);
  const [challenges, setChallenges] =
    useState<StayHealthyChallengesData>(DEFAULT_CHALLENGES);
  const [accountability, setAccountability] =
    useState<StayHealthyAccountabilityData>(DEFAULT_ACCOUNTABILITY);
  const [visualization, setVisualization] =
    useState<StayHealthyVisualizationData>(DEFAULT_VISUALIZATION);
  const [supporters, setSupporters] =
    useState<ExerciseSupportersFormData>(DEFAULT_SUPPORTERS);
  const [referee, setReferee] =
    useState<ExerciseRefereeFormData>(DEFAULT_REFEREE);
  const [target, setTarget] = useState<StayHealthyTargetData>(DEFAULT_TARGET);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCommitConfirm, setShowCommitConfirm] = useState(false);
  const [showInsufficientTokens, setShowInsufficientTokens] = useState(false);
  const [showGoalCreated, setShowGoalCreated] = useState(false);
  const [tokenCommitment, setTokenCommitment] = useState<number>(20);
  const [isCustomToken, setIsCustomToken] = useState<boolean>(false);
  const [customTokenValue, setCustomTokenValue] = useState<string>("");
  const [submissionMode, setSubmissionMode] = useState<string>("image");

  const moveToStep = (nextStep: number) => {
    setErrorMessage(null);
    setStep(nextStep);
  };

  const validateStep = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        return (
          isFilled(why.importance) &&
          isFilled(why.doingFor) &&
          isFilled(why.lifeChange) &&
          isFilled(why.fear) &&
          isFilled(why.ultimateWhy)
        );
      case 2:
        return (
          isFilled(challenges.obstacle) &&
          isFilled(challenges.distraction) &&
          isFilled(challenges.giveUpMoment) &&
          isFilled(challenges.trigger) &&
          isFilled(challenges.supportPreference)
        );
      case 3:
        return (
          isFilled(accountability.tool) &&
          isFilled(accountability.checkInFrequency) &&
          isFilled(accountability.helpfulSupport) &&
          isFilled(accountability.visibleToOthers) &&
          isFilled(accountability.rewardsOrConsequences)
        );
      case 4:
        return (
          isFilled(visualization.selfDescription) &&
          isFilled(visualization.physicalChanges) &&
          isFilled(visualization.lifestyleImprovements) &&
          isFilled(visualization.unlockedAbility) &&
          isFilled(visualization.visionBoard)
        );
      case 5:
        return true;
      case 6:
        return referee.selfManaged || isFilled(referee.refereeContact);
      case 7:
        return (
          isFilled(target.primaryHealthGoal) &&
          isFilled(target.timeCommitment) &&
          isFilled(target.measurableTarget) &&
          isFilled(target.focusActivity) &&
          isFilled(target.timeframe) &&
          isFilled(target.reminders)
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

      if (tokenCommitment < 20) {
        setErrorMessage("Minimum token commitment is 20 tokens.");
        return;
      }

      if (tokenBalance < tokenCommitment) {
        setShowCommitConfirm(false);
        setShowInsufficientTokens(true);
        return;
      }

      const { startDate, endDate } = resolveStayHealthyEndDate(target.timeframe);

      const description = [
        `Why now: ${why.importance}.`,
        `Doing this for: ${why.doingFor}.`,
        `Life change: ${why.lifeChange}.`,
        `Fear if unsuccessful: ${why.fear}.`,
        `Ultimate why: ${why.ultimateWhy}.`,
        `Biggest obstacle: ${challenges.obstacle}.`,
        `Main distraction: ${challenges.distraction}.`,
        `Most likely give-up moment: ${challenges.giveUpMoment}.`,
        `Trigger for unhealthy habits: ${challenges.trigger}.`,
        `Preferred support from GoalHyke + CrushIT: ${challenges.supportPreference}.`,
        `Accountability tool: ${accountability.tool}.`,
        `Check-in frequency: ${accountability.checkInFrequency}.`,
        `Helpful support: ${accountability.helpfulSupport}.`,
        `Visibility to others: ${accountability.visibleToOthers}.`,
        `Rewards or consequences: ${accountability.rewardsOrConsequences}.`,
        `Success identity: ${visualization.selfDescription}.`,
        `Wanted physical changes: ${visualization.physicalChanges}.`,
        `Lifestyle improvements: ${visualization.lifestyleImprovements}.`,
        `Unlocked ability: ${visualization.unlockedAbility}.`,
        `Vision board preference: ${visualization.visionBoard}.`,
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
        `Primary health goal: ${target.primaryHealthGoal}.`,
        `Time commitment: ${target.timeCommitment}.`,
        `Measurable target: ${target.measurableTarget}.`,
        `Focus activity: ${target.focusActivity}.`,
        `Timeframe: ${target.timeframe}.`,
        `Reminders: ${target.reminders}.`,
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
        title: target.primaryHealthGoal,
        category: "Stay healthy",
        description,
        start_date: startDate,
        end_date: endDate,
        metadata
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
            visualTitle="Anchor your motivation"
            visualBody="This step turns a vague health intention into a personal reason you can return to when motivation drops."
            visualImageSrc="/images/progress-consistency-character.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="Why is staying healthy important to you right now?"
                value={why.importance}
                onChange={(value) => setWhy((current) => ({ ...current, importance: value }))}
                options={[
                  "I want more energy",
                  "I want to prevent illness",
                  "I want to feel stronger",
                  "I want to improve my mental well-being",
                ]}
              />
              <SelectQuestion
                label="Who are you doing this for?"
                value={why.doingFor}
                onChange={(value) => setWhy((current) => ({ ...current, doingFor: value }))}
                options={["Myself", "My family", "My partner", "My children"]}
              />
              <SelectQuestion
                label="What will change in your life if you succeed?"
                value={why.lifeChange}
                onChange={(value) => setWhy((current) => ({ ...current, lifeChange: value }))}
                options={[
                  "I will feel more confident",
                  "I will have more daily energy",
                  "I will be more present for others",
                  "I will trust myself more",
                ]}
              />
              <SelectQuestion
                label="What do you fear will happen if you don’t stay healthy?"
                value={why.fear}
                onChange={(value) => setWhy((current) => ({ ...current, fear: value }))}
                options={[
                  "My energy will keep dropping",
                  "My health risks will increase",
                  "I will keep feeling stuck",
                  "I will miss out on life experiences",
                ]}
              />
              <TextareaQuestion
                label="In one sentence, how would you describe your ultimate “Why” for staying healthy?"
                value={why.ultimateWhy}
                onChange={(value) => setWhy((current) => ({ ...current, ultimateWhy: value }))}
                placeholder="I want to stay healthy so I can..."
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
            visualTitle="Name the friction"
            visualBody="Knowing what normally knocks you off track makes it easier to design support around the real problem."
            visualImageSrc="/images/goal-exercise.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="What are the biggest obstacles that might stop you from staying healthy?"
                value={challenges.obstacle}
                onChange={(value) =>
                  setChallenges((current) => ({ ...current, obstacle: value }))
                }
                options={[
                  "Lack of time",
                  "Low motivation",
                  "Stress and overwhelm",
                  "Inconsistent routine",
                ]}
              />
              <SelectQuestion
                label="Which distractions affect your health habits the most?"
                value={challenges.distraction}
                onChange={(value) =>
                  setChallenges((current) => ({ ...current, distraction: value }))
                }
                options={[
                  "Work demands",
                  "Phone or social media",
                  "Family obligations",
                  "Poor sleep habits",
                ]}
              />
              <SelectQuestion
                label="When are you most likely to give up on healthy habits?"
                value={challenges.giveUpMoment}
                onChange={(value) =>
                  setChallenges((current) => ({ ...current, giveUpMoment: value }))
                }
                options={[
                  "When I miss a day",
                  "When results feel slow",
                  "When life gets busy",
                  "When I feel tired",
                ]}
              />
              <SelectQuestion
                label="What usually triggers unhealthy habits for you?"
                value={challenges.trigger}
                onChange={(value) =>
                  setChallenges((current) => ({ ...current, trigger: value }))
                }
                options={[
                  "Stress",
                  "Boredom",
                  "Social pressure",
                  "Feeling discouraged",
                ]}
              />
              <SelectQuestion
                label="How would you like goalHyke + CrushIT to help you overcome these challenges?"
                value={challenges.supportPreference}
                onChange={(value) =>
                  setChallenges((current) => ({
                    ...current,
                    supportPreference: value,
                  }))
                }
                options={[
                  "Reminders and nudges",
                  "Progress check-ins",
                  "Consequences for missed goals",
                  "Encouragement from supporters",
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
            visualTitle="Pick your system"
            visualBody="Choose the style of accountability that will actually keep you moving when life gets noisy."
            visualImageSrc="/images/milestones-character.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="How would you like to stay accountable to your health goals?"
                value={accountability.tool}
                onChange={(value) =>
                  setAccountability((current) => ({ ...current, tool: value }))
                }
                options={[
                  "Daily habit tracking",
                  "Weekly referee check-ins",
                  "Supporter encouragement",
                  "Token commitment",
                ]}
              />
              <SelectQuestion
                label="How often do you want to check in with your accountability tool?"
                value={accountability.checkInFrequency}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    checkInFrequency: value,
                  }))
                }
                options={["Daily", "3 times a week", "Weekly", "Every two weeks"]}
              />
              <SelectQuestion
                label="What kind of support helps you the most?"
                value={accountability.helpfulSupport}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    helpfulSupport: value,
                  }))
                }
                options={[
                  "Encouragement",
                  "Direct accountability",
                  "Gentle reminders",
                  "Public progress sharing",
                ]}
              />
              <SelectQuestion
                label="Do you want your accountability progress to be visible to others?"
                value={accountability.visibleToOthers}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    visibleToOthers: value,
                  }))
                }
                options={[
                  "Yes, supporters only",
                  "Yes, community visible",
                  "No, keep it private",
                ]}
              />
              <SelectQuestion
                label="Would you like to set up rewards or consequences linked to accountability?"
                value={accountability.rewardsOrConsequences}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    rewardsOrConsequences: value,
                  }))
                }
                options={[
                  "Rewards only",
                  "Consequences only",
                  "Both rewards and consequences",
                  "Not right now",
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
            visualTitle="Make success concrete"
            visualBody="The clearer your picture of success, the easier it becomes to recognize what you are building toward."
            visualImageSrc="/images/behavioural-solution.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="Imagine you’ve achieved your health goal, how would you describe yourself?"
                value={visualization.selfDescription}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    selfDescription: value,
                  }))
                }
                options={[
                  "Energetic and disciplined",
                  "Strong and confident",
                  "Calm and healthy",
                  "Consistent and proud",
                ]}
              />
              <SelectQuestion
                label="What physical changes do you want to see?"
                value={visualization.physicalChanges}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    physicalChanges: value,
                  }))
                }
                options={[
                  "More stamina",
                  "Better strength",
                  "Healthier weight",
                  "Better sleep and recovery",
                ]}
              />
              <SelectQuestion
                label="What lifestyle improvements are you aiming for?"
                value={visualization.lifestyleImprovements}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    lifestyleImprovements: value,
                  }))
                }
                options={[
                  "A stable routine",
                  "Better eating habits",
                  "Less stress",
                  "More confidence in my habits",
                ]}
              />
              <SelectQuestion
                label="What will success allow you to do that you can’t do now?"
                value={visualization.unlockedAbility}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    unlockedAbility: value,
                  }))
                }
                options={[
                  "Keep up with daily demands",
                  "Show up fully for loved ones",
                  "Enjoy activities without exhaustion",
                  "Trust my body again",
                ]}
              />
              <SelectQuestion
                label="Do you want to create a success vision board inside goalHyke?"
                value={visualization.visionBoard}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    visionBoard: value,
                  }))
                }
                options={["Yes, create one", "Maybe later", "No, not now"]}
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
            visualTitle="Turn it into a plan"
            visualBody="Your final target defines what progress looks like, how much time you will commit, and the timeframe you are aiming for."
            visualImageSrc="/images/goal-exercise.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleOpenCommitConfirm}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="What’s your primary health goal?"
                value={target.primaryHealthGoal}
                onChange={(value) =>
                  setTarget((current) => ({ ...current, primaryHealthGoal: value }))
                }
                options={[
                  "Improve my overall fitness",
                  "Lose weight in a healthy way",
                  "Build consistent healthy habits",
                  "Improve my energy and stamina",
                ]}
              />
              <SelectQuestion
                label="How much time do you want to commit daily or weekly?"
                value={target.timeCommitment}
                onChange={(value) =>
                  setTarget((current) => ({ ...current, timeCommitment: value }))
                }
                options={[
                  "15 minutes daily",
                  "30 minutes daily",
                  "3 focused sessions weekly",
                  "5 healthy actions weekly",
                ]}
              />
              <SelectQuestion
                label="What’s your measurable target?"
                value={target.measurableTarget}
                onChange={(value) =>
                  setTarget((current) => ({ ...current, measurableTarget: value }))
                }
                options={[
                  "Hit my routine 4 times a week",
                  "Stay consistent for 30 days",
                  "Improve my energy score",
                  "Reduce unhealthy choices each week",
                ]}
              />
              <SelectQuestion
                label="Which activity do you want to focus on most?"
                value={target.focusActivity}
                onChange={(value) =>
                  setTarget((current) => ({ ...current, focusActivity: value }))
                }
                options={[
                  "Movement and exercise",
                  "Nutrition",
                  "Sleep",
                  "Stress management",
                ]}
              />
              <SelectQuestion
                label="What’s your timeframe for this target?"
                value={target.timeframe}
                onChange={(value) =>
                  setTarget((current) => ({ ...current, timeframe: value }))
                }
                options={["2 weeks", "1 month", "3 months", "6 months"]}
              />
              <SelectQuestion
                label="Do you want reminders to help you stay on track?"
                value={target.reminders}
                onChange={(value) =>
                  setTarget((current) => ({ ...current, reminders: value }))
                }
                options={[
                  "Yes, every day",
                  "Yes, a few times a week",
                  "Only on check-in days",
                  "No reminders",
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <div className="flex flex-col items-center text-center">
              <p className="mt-6 text-[22px] font-medium leading-[1.6] text-[#262525] font-secondary sm:text-[26px]">
                Commit Tokens to Your Goal
              </p>
              
              <p className="mt-2 text-[14px] text-gray-500 max-w-lg">
                Your committed tokens are staked. If you fail the weekly consistency target (&gt;= 5 verified check-ins), tokens will be deducted.
              </p>

              <div className="w-full max-w-md mx-auto mt-6 p-5 rounded-[18px] border border-gray-100 bg-[#f7f8ff] text-left">
                <div className="mb-5">
                  <p className="text-[13px] font-bold text-[#262525] uppercase tracking-wider mb-2">
                    Mandatory Submission Mode:
                  </p>
                  <select
                    value={submissionMode}
                    onChange={(e) => setSubmissionMode(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-[14px] outline-none focus:border-[#7655fb]"
                  >
                    <option value="image">Image / Screenshot upload</option>
                    <option value="video">Video / Screen recording upload</option>
                    <option value="text">Text Log / Written proof (no file)</option>
                  </select>
                </div>

                <p className="text-[13px] font-bold text-[#262525] uppercase tracking-wider mb-3">
                  Select Token Commitment (Min 20):
                </p>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomToken(false);
                      setTokenCommitment(20);
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl border text-[14px] font-semibold transition-all cursor-pointer ${
                      !isCustomToken
                        ? "border-[#7655fb] bg-[#7655fb]/5 text-[#7655fb] shadow-sm font-bold"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Standard (20 tokens)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomToken(true);
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl border text-[14px] font-semibold transition-all cursor-pointer ${
                      isCustomToken
                        ? "border-[#7655fb] bg-[#7655fb]/5 text-[#7655fb] shadow-sm font-bold"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Custom Amount
                  </button>
                </div>

                {isCustomToken && (
                  <div className="mt-4">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Enter Custom Tokens (Min 20):
                    </label>
                    <input
                      type="number"
                      min="20"
                      value={customTokenValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomTokenValue(val);
                        const num = parseInt(val) || 0;
                        setTokenCommitment(num);
                      }}
                      placeholder="e.g. 50"
                      className={`w-full px-4 py-2.5 border rounded-xl text-[14px] outline-none focus:border-[#7655fb] ${
                        customTokenValue && parseInt(customTokenValue) < 20
                          ? "border-rose-500 focus:border-rose-500 bg-rose-50/10"
                          : "border-[#ccd2e2]"
                      }`}
                    />
                    {customTokenValue && parseInt(customTokenValue) < 20 && (
                      <p className="mt-1.5 text-[12px] font-semibold text-rose-600 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Custom commitment must be at least 20 tokens.
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
                  disabled={isSaving || (isCustomToken && (!customTokenValue || parseInt(customTokenValue) < 20))}
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
