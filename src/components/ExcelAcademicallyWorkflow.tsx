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

import GoalRecommendationsBanner from "@/components/GoalRecommendationsBanner";

interface ExcelAcademicallyWorkflowProps {
  goalTitle?: string;
  onCancel: () => void;
}

interface ExcelAcademicallyWhyData {
  reason: string;
  doingFor: string;
  successChange: string;
  missOutOn: string;
  endSemesterFeeling: string;
}

interface ExcelAcademicallyChallengesData {
  struggleArea: string;
  challengePeriod: string;
  externalFactors: string;
  reactionToChallenges: string;
  biggestObstacle: string;
}

interface ExcelAcademicallyAccountabilityData {
  accountabilityType: string;
  accountabilityStyle: string;
  reminderPreference: string;
  studyHabitTracking: string;
  progressSharing: string;
}

interface ExcelAcademicallyVisualizationData {
  successLook: string;
  successFeeling: string;
  whoBenefits: string;
  endSemesterVision: string;
  selfReward: string;
}

interface ExcelAcademicallyTargetData {
  mainGoal: string;
  focusSubjects: string;
  targetGrade: string;
  studyTimePerWeek: string;
  skillsToBuild: string;
  targetTimeline: string;
  goalImportance: string;
  targetMeasure?: string;
  standardVolumeSize?: string;
  volumeUnit?: string;
  targetVolume?: string;
  weeklySchedule?: string;
  sessionVolume?: string;
  stakedVolume?: number;
}

const TOTAL_STEPS = 7;

const DEFAULT_WHY: ExcelAcademicallyWhyData = {
  reason: "",
  doingFor: "",
  successChange: "",
  missOutOn: "",
  endSemesterFeeling: "",
};

const DEFAULT_CHALLENGES: ExcelAcademicallyChallengesData = {
  struggleArea: "",
  challengePeriod: "",
  externalFactors: "",
  reactionToChallenges: "",
  biggestObstacle: "",
};

const DEFAULT_ACCOUNTABILITY: ExcelAcademicallyAccountabilityData = {
  accountabilityType: "",
  accountabilityStyle: "",
  reminderPreference: "",
  studyHabitTracking: "",
  progressSharing: "",
};

const DEFAULT_VISUALIZATION: ExcelAcademicallyVisualizationData = {
  successLook: "",
  successFeeling: "",
  whoBenefits: "",
  endSemesterVision: "",
  selfReward: "",
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

const DEFAULT_TARGET: ExcelAcademicallyTargetData = {
  mainGoal: "Improve grades",
  focusSubjects: "Math",
  targetGrade: "A",
  studyTimePerWeek: "10 hrs",
  skillsToBuild: "Consistency and active recall",
  targetTimeline: "End of the semester",
  goalImportance: "To build confidence in my abilities",
  targetMeasure: "volume size",
  standardVolumeSize: "10",
  volumeUnit: "Pages",
  targetVolume: "50",
  weeklySchedule: "1x Weekly schedule",
  sessionVolume: "10 pages",
  stakedVolume: 50,
};

function formatDateForInput(date: Date) {
  return date.toISOString().split("T")[0];
}

function resolveExcelAcademicallyEndDate(timeframe: string) {
  const start = new Date();
  const end = new Date(start);

  switch (timeframe) {
    case "By next test":
      end.setDate(end.getDate() + 30);
      break;
    case "End of the semester":
      end.setMonth(end.getMonth() + 4);
      break;
    case "3 months":
      end.setMonth(end.getMonth() + 3);
      break;
    case "6 months":
      end.setMonth(end.getMonth() + 6);
      break;
    default:
      end.setMonth(end.getMonth() + 3);
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

export default function ExcelAcademicallyWorkflow({
  goalTitle = "Excel Academically",
  onCancel,
}: ExcelAcademicallyWorkflowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [why, setWhy] = useState<ExcelAcademicallyWhyData>(DEFAULT_WHY);
  const [challenges, setChallenges] =
    useState<ExcelAcademicallyChallengesData>(DEFAULT_CHALLENGES);
  const [accountability, setAccountability] =
    useState<ExcelAcademicallyAccountabilityData>(DEFAULT_ACCOUNTABILITY);
  const [visualization, setVisualization] =
    useState<ExcelAcademicallyVisualizationData>(DEFAULT_VISUALIZATION);
  const [supporters, setSupporters] =
    useState<ExerciseSupportersFormData>(DEFAULT_SUPPORTERS);
  const [referee, setReferee] =
    useState<ExerciseRefereeFormData>(DEFAULT_REFEREE);
  const [target, setTarget] =
    useState<ExcelAcademicallyTargetData>(DEFAULT_TARGET);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCommitConfirm, setShowCommitConfirm] = useState(false);
  const [showInsufficientTokens, setShowInsufficientTokens] = useState(false);
  const [showGoalCreated, setShowGoalCreated] = useState(false);
  const [tokenCommitment, setTokenCommitment] = useState<number>(20);
  const [isCustomToken, setIsCustomToken] = useState<boolean>(false);
  const [customTokenValue, setCustomTokenValue] = useState<string>("");
  const [submissionMode, setSubmissionMode] = useState<string>("image");
  const [targetSubStep, setTargetSubStep] = useState<1 | 2 | 3>(1);
  const [showNoCommitmentModal, setShowNoCommitmentModal] = useState<boolean>(false);
  const [isGeneratingMilestone, setIsGeneratingMilestone] = useState<boolean>(false);

  const moveToStep = (nextStep: number) => {
    setErrorMessage(null);
    setStep(nextStep);
  };

  const validateStep = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        return (
          isFilled(why.reason) &&
          isFilled(why.doingFor) &&
          isFilled(why.successChange) &&
          isFilled(why.missOutOn) &&
          isFilled(why.endSemesterFeeling)
        );
      case 2:
        return (
          isFilled(challenges.struggleArea) &&
          isFilled(challenges.challengePeriod) &&
          isFilled(challenges.externalFactors) &&
          isFilled(challenges.reactionToChallenges) &&
          isFilled(challenges.biggestObstacle)
        );
      case 3:
        return (
          isFilled(accountability.accountabilityType) &&
          isFilled(accountability.accountabilityStyle) &&
          isFilled(accountability.reminderPreference) &&
          isFilled(accountability.studyHabitTracking) &&
          isFilled(accountability.progressSharing)
        );
      case 4:
        return (
          isFilled(visualization.successLook) &&
          isFilled(visualization.successFeeling) &&
          isFilled(visualization.whoBenefits) &&
          isFilled(visualization.endSemesterVision) &&
          isFilled(visualization.selfReward)
        );
      case 5:
        return true;
      case 6:
        return referee.selfManaged || isFilled(referee.refereeContact);
      case 7:
        return (
          isFilled(target.mainGoal) &&
          isFilled(target.focusSubjects) &&
          isFilled(target.targetGrade) &&
          isFilled(target.studyTimePerWeek) &&
          isFilled(target.skillsToBuild) &&
          isFilled(target.targetTimeline) &&
          isFilled(target.goalImportance)
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

      const { startDate, endDate } = resolveExcelAcademicallyEndDate(
        target.targetTimeline,
      );

      const description = [
        `Why excel academically: ${why.reason}.`,
        `Doing this for: ${why.doingFor}.`,
        `Success changes: ${why.successChange}.`,
        `What I will miss out on: ${why.missOutOn}.`,
        `End-of-semester feeling: ${why.endSemesterFeeling}.`,
        `Main struggle area: ${challenges.struggleArea}.`,
        `Most difficult period: ${challenges.challengePeriod}.`,
        `External factors: ${challenges.externalFactors}.`,
        `Reaction to challenges: ${challenges.reactionToChallenges}.`,
        `Biggest obstacle: ${challenges.biggestObstacle}.`,
        `Accountability type: ${accountability.accountabilityType}.`,
        `Accountability style: ${accountability.accountabilityStyle}.`,
        `Reminder preference: ${accountability.reminderPreference}.`,
        `Study habit tracking: ${accountability.studyHabitTracking}.`,
        `Progress sharing: ${accountability.progressSharing}.`,
        `How success looks: ${visualization.successLook}.`,
        `How success feels: ${visualization.successFeeling}.`,
        `Who benefits besides me: ${visualization.whoBenefits}.`,
        `End-of-semester vision: ${visualization.endSemesterVision}.`,
        `Self-reward: ${visualization.selfReward}.`,
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
        `Main academic goal: ${target.mainGoal}.`,
        `Focus subjects: ${target.focusSubjects}.`,
        `Target grade or score: ${target.targetGrade}.`,
        `Study time per week: ${target.studyTimePerWeek}.`,
        `Skills or habits to build: ${target.skillsToBuild}.`,
        `Target timeline: ${target.targetTimeline}.`,
        `Goal importance: ${target.goalImportance}.`,
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
            avatar: "",
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
        title: target.mainGoal,
        category: "Excel academically",
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
            visualTitle="Clarify your academic reason"
            visualBody="This step anchors the goal in a personal academic purpose so the rest of the workflow feels intentional and motivating."
            visualImageSrc="/images/progress-consistency-character.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="Why do you want to excel academically?"
                value={why.reason}
                onChange={(value) =>
                  setWhy((current) => ({ ...current, reason: value }))
                }
                options={[
                  "To qualify for a scholarship",
                  "To make my parents or mentor proud",
                  "To build confidence in my abilities",
                  "To prepare for future opportunities",
                  "To overcome past struggles",
                ]}
              />
              <SelectQuestion
                label="Who are you doing this for?"
                value={why.doingFor}
                onChange={(value) =>
                  setWhy((current) => ({ ...current, doingFor: value }))
                }
                options={[
                  "Myself",
                  "My family",
                  "My community",
                  "My future career",
                ]}
              />
              <TextareaQuestion
                label="What will success in your academic change for you?"
                value={why.successChange}
                onChange={(value) =>
                  setWhy((current) => ({ ...current, successChange: value }))
                }
                placeholder="E.g. I’ll be able to pursue medicine."
              />
              <TextareaQuestion
                label="If you don’t reach your academic goals, what will you miss out on?"
                value={why.missOutOn}
                onChange={(value) =>
                  setWhy((current) => ({ ...current, missOutOn: value }))
                }
                placeholder="What opportunities, confidence, or outcomes would you lose?"
              />
              <SelectQuestion
                label="Imagine yourself at the end of the semester, how do you want to feel?"
                value={why.endSemesterFeeling}
                onChange={(value) =>
                  setWhy((current) => ({
                    ...current,
                    endSemesterFeeling: value,
                  }))
                }
                options={[
                  "Proud",
                  "Relieved",
                  "Motivated to do more",
                  "Ready for the next challenge",
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
            visualTitle="Surface the blockers"
            visualBody="This step identifies what usually disrupts your learning rhythm so the workflow can support the right habits and pressure points."
            visualImageSrc="/images/goal-exercise.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="Which area do you struggle with most?"
                value={challenges.struggleArea}
                onChange={(value) =>
                  setChallenges((current) => ({
                    ...current,
                    struggleArea: value,
                  }))
                }
                options={[
                  "Time management",
                  "Concentration or staying focused",
                  "Understanding certain subjects",
                  "Test or exam anxiety",
                  "Procrastination",
                  "Poor study habits",
                  "Lack of motivation",
                ]}
              />
              <SelectQuestion
                label="When do you usually face the most academic challenges?"
                value={challenges.challengePeriod}
                onChange={(value) =>
                  setChallenges((current) => ({
                    ...current,
                    challengePeriod: value,
                  }))
                }
                options={[
                  "At the beginning of the semester",
                  "Mid-semester",
                  "During exams or tests",
                  "Consistently throughout",
                ]}
              />
              <SelectQuestion
                label="What external factors affect your academic performance?"
                value={challenges.externalFactors}
                onChange={(value) =>
                  setChallenges((current) => ({
                    ...current,
                    externalFactors: value,
                  }))
                }
                options={[
                  "Family responsibilities",
                  "Part-time job or workload",
                  "Financial stress",
                  "Peer pressure or distractions",
                  "Limited study resources",
                  "Health or well-being issues",
                ]}
              />
              <SelectQuestion
                label="How do you usually react when you face challenges?"
                value={challenges.reactionToChallenges}
                onChange={(value) =>
                  setChallenges((current) => ({
                    ...current,
                    reactionToChallenges: value,
                  }))
                }
                options={[
                  "I avoid the work",
                  "I rush through at the last minute",
                  "I ask for help",
                  "I try to push through on my own",
                ]}
              />
              <TextareaQuestion
                label="What’s your biggest obstacle right now?"
                value={challenges.biggestObstacle}
                onChange={(value) =>
                  setChallenges((current) => ({
                    ...current,
                    biggestObstacle: value,
                  }))
                }
                placeholder="Describe the main thing slowing down your academic progress."
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
            visualTitle="Pick your academic support system"
            visualBody="This step defines how you want pressure, reminders, and visible progress to reinforce your study commitment."
            visualImageSrc="/images/milestones-character.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="Which type of accountability works best for you?"
                value={accountability.accountabilityType}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    accountabilityType: value,
                  }))
                }
                options={[
                  "Study partner or accountability buddy",
                  "Study group",
                  "Family member checking progress",
                  "Mentor or tutor",
                  "Digital tool (apps, reminders, trackers)",
                ]}
              />
              <SelectQuestion
                label="How do you prefer to stay accountable?"
                value={accountability.accountabilityStyle}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    accountabilityStyle: value,
                  }))
                }
                options={[
                  "Regular check-ins (daily or weekly)",
                  "Progress reports (grades, test scores)",
                  "Sharing goals publicly",
                  "Reward system for milestones",
                  "Penalty system for missed targets",
                ]}
              />
              <SelectQuestion
                label="Would you like automated reminders and nudges?"
                value={accountability.reminderPreference}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    reminderPreference: value,
                  }))
                }
                options={[
                  "Yes, daily reminders",
                  "Yes, weekly reminders",
                  "Only before deadlines",
                  "No reminders, I’ll track myself",
                ]}
              />
              <SelectQuestion
                label="Do you want to track your study habits?"
                value={accountability.studyHabitTracking}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    studyHabitTracking: value,
                  }))
                }
                options={[
                  "Hours studied",
                  "Subjects covered",
                  "Assignments completed",
                  "Quizzes or tests taken",
                ]}
              />
              <SelectQuestion
                label="Who do you want to share your progress with (if any)?"
                value={accountability.progressSharing}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    progressSharing: value,
                  }))
                }
                options={[
                  "Nobody (keep private)",
                  "Friends or study partners",
                  "Parents or guardians",
                  "Mentor or tutor",
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
            visualTitle="Picture the result clearly"
            visualBody="This step turns academic success into something vivid and emotional so it feels worth the effort when studying gets hard."
            visualImageSrc="/images/behavioural-solution.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="How will success look like for you academically?"
                value={visualization.successLook}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    successLook: value,
                  }))
                }
                options={[
                  "Getting top grades in exams",
                  "Scoring above a specific GPA",
                  "Finishing assignments on time",
                  "Gaining recognition",
                  "Being admitted to my dream school or program",
                ]}
              />
              <SelectQuestion
                label="How will you feel once you achieve this?"
                value={visualization.successFeeling}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    successFeeling: value,
                  }))
                }
                options={[
                  "Confident and capable",
                  "Relieved and stress-free",
                  "Proud of myself",
                  "Motivated to achieve more",
                  "Grateful and fulfilled",
                ]}
              />
              <SelectQuestion
                label="Who will benefit from your success besides you?"
                value={visualization.whoBenefits}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    whoBenefits: value,
                  }))
                }
                options={[
                  "Parents or family",
                  "Friends and classmates",
                  "Future employers or mentors",
                  "Community",
                ]}
              />
              <TextareaQuestion
                label="Imagine it’s the end of the semester, what do you see?"
                value={visualization.endSemesterVision}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    endSemesterVision: value,
                  }))
                }
                placeholder="E.g. I am holding my report card and smiling because..."
              />
              <SelectQuestion
                label="What reward will you give yourself when you succeed?"
                value={visualization.selfReward}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    selfReward: value,
                  }))
                }
                options={[
                  "Treat (food or outing)",
                  "Buy something I’ve wanted",
                  "Take a break or short vacation",
                  "Share achievement with loved ones",
                  "Invest in my future",
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
            title={
              targetSubStep === 1
                ? "Set Your Target"
                : targetSubStep === 2
                ? "Set The Weekly Schedule"
                : "Lock In The Goal"
            }
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
            visualTitle="Turn ambition into a concrete academic target"
            visualBody="This step defines the measurable academic result, the study commitment behind it, and why the target matters enough to follow through."
            visualImageSrc="/images/goal-exercise.png"
            onBack={() => {
              if (targetSubStep > 1) {
                setTargetSubStep((prev) => (prev - 1) as 1 | 2 | 3);
              } else {
                handleBack();
              }
            }}
            onCancel={onCancel}
            onNext={() => {
              if (targetSubStep === 1) {
                if (!target.targetVolume && !target.standardVolumeSize) {
                  setShowNoCommitmentModal(true);
                } else {
                  setTargetSubStep(2);
                }
              } else if (targetSubStep === 2) {
                setTargetSubStep(3);
              } else {
                handleOpenCommitConfirm();
              }
            }}
            nextLabel={targetSubStep === 3 ? "Submit" : "Next Step"}
          >
            <div className="flex flex-col gap-6">
              {/* Form Accountability Section */}
              <div className="border-b border-gray-100 pb-4">
                <h4 className="text-[22px] font-bold text-[#262525] font-secondary">
                  Form Accountability
                </h4>
                <p className="mt-1 text-[14px] text-gray-600 font-secondary leading-relaxed">
                  You are strong and accountable to yourself. Let&apos;s get moving, choose your preferred path to stay accountable:
                </p>
              </div>

              {/* Sub-step 1: Set Your Target */}
              {targetSubStep === 1 && (
                <div className="flex flex-col gap-5">
                  <SelectQuestion
                    label="Select Goal Target Measure"
                    value={target.targetMeasure || "volume size"}
                    onChange={(value) =>
                      setTarget((current) => ({ ...current, targetMeasure: value }))
                    }
                    options={["volume size", "time based", "custom plan"]}
                  />

                  <SelectQuestion
                    label="Pick standard target volume size (e.g. 5, 10, 15...)"
                    value={target.standardVolumeSize || "10"}
                    onChange={(value) =>
                      setTarget((current) => ({ ...current, standardVolumeSize: value }))
                    }
                    options={["5", "10", "15", "20", "50"]}
                  />

                  <SelectQuestion
                    label="Volume unit (e.g. Pages, Hours)"
                    value={target.volumeUnit || "Pages"}
                    onChange={(value) =>
                      setTarget((current) => ({ ...current, volumeUnit: value }))
                    }
                    options={["Pages", "Hours", "Modules", "Books"]}
                  />

                  <TextQuestion
                    label="Target volume size (e.g. 50 pages)"
                    value={target.targetVolume || ""}
                    onChange={(value) =>
                      setTarget((current) => ({ ...current, targetVolume: value }))
                    }
                    placeholder="Enter your target volume (e.g. 50 pages if reading a book)"
                  />

                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsGeneratingMilestone(true);
                        setTimeout(() => setIsGeneratingMilestone(false), 600);
                      }}
                      disabled={isGeneratingMilestone}
                      className="inline-flex items-center gap-2 rounded-full bg-[#7655fb] px-6 py-3 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(118,85,251,0.35)] transition-all hover:bg-[#6442e4]"
                    >
                      {isGeneratingMilestone ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
              )}

              {/* Sub-step 2: Set The Weekly Schedule */}
              {targetSubStep === 2 && (
                <div className="flex flex-col gap-5">
                  <SelectQuestion
                    label="Set Weekly Schedule"
                    value={target.weeklySchedule || "1x Weekly schedule"}
                    onChange={(value) =>
                      setTarget((current) => ({ ...current, weeklySchedule: value }))
                    }
                    options={[
                      "1x Weekly schedule",
                      "2x Weekly schedule",
                      "3x Weekly schedule",
                      "Custom schedule",
                    ]}
                  />

                  <SelectQuestion
                    label="Target volume per weekly schedule session (e.g. 10 pages)"
                    value={target.sessionVolume || "10 pages"}
                    onChange={(value) =>
                      setTarget((current) => ({ ...current, sessionVolume: value }))
                    }
                    options={["5 pages", "10 pages", "15 pages", "20 pages", "50 pages"]}
                  />
                </div>
              )}

              {/* Sub-step 3: Lock In The Goal */}
              {targetSubStep === 3 && (
                <div className="flex flex-col gap-6 py-2">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[18px] font-bold text-[#262525] font-secondary">
                        Self Staked Target Volume
                      </span>
                      <span className="rounded-full bg-[#7655fb]/10 px-3.5 py-1 text-sm font-bold text-[#7655fb]">
                        {target.stakedVolume || 50} {target.volumeUnit || "Pages"}
                      </span>
                    </div>

                    <div className="relative mt-4 flex items-center">
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={target.stakedVolume || 50}
                        onChange={(e) =>
                          setTarget((current) => ({
                            ...current,
                            stakedVolume: Number(e.target.value),
                          }))
                        }
                        className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-[#e2e8f0] accent-[#7655fb]"
                      />
                    </div>

                    <div className="flex justify-between text-xs font-semibold text-gray-500 mt-1">
                      <span>Min (10)</span>
                      <span>50 Pages</span>
                      <span>Max (100)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* GoalHyke Recommendations Banner */}
              <div className="mt-4">
                <GoalRecommendationsBanner />
              </div>
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

      {/* Floating AI Assistant Button */}
      <button
        type="button"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#7655fb] text-white shadow-[0_8px_25px_rgba(118,85,251,0.4)] transition-all hover:scale-105 hover:bg-[#6442e4]"
        aria-label="Open AI Assistant"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L15 8L21 9L16.5 14L18 20L12 17L6 20L7.5 14L3 9L9 8L12 2Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {/* No Commitment Selected Modal */}
      {showNoCommitmentModal && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-[#1b1a1a]/60 px-4 backdrop-blur-xs">
          <div className="relative w-full max-w-[420px] rounded-[24px] bg-white p-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.2)]">
            <h3 className="text-[20px] font-bold text-[#262525] font-secondary leading-snug">
              No commitment selected. Set standard goal target volume
            </h3>
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setTarget((c) => ({ ...c, targetVolume: c.standardVolumeSize || "50" }));
                  setShowNoCommitmentModal(false);
                  setTargetSubStep(2);
                }}
                className="gh-btn-primary px-6 py-2.5 text-[15px] bg-[#7655fb]"
              >
                Accept Plan
              </button>
              <button
                type="button"
                onClick={() => setShowNoCommitmentModal(false)}
                className="flex items-center justify-center rounded-full border border-[#ff8b97] bg-white px-6 py-2.5 text-[15px] font-medium text-[#ff6f7d] transition-colors hover:bg-[#fff5f7]"
              >
                Custom
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
