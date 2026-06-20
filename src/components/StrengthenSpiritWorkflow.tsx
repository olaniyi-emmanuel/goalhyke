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

interface StrengthenSpiritWorkflowProps {
  goalTitle?: string;
  onCancel: () => void;
}

interface SpiritWhyData {
  reason: string;
  dailyChange: string;
  biggerValue: string;
  futureFeeling: string;
  inspiration: string;
  missOut: string;
}

interface SpiritChallengesData {
  distraction: string;
  innerStruggle: string;
  externalObstacle: string;
  driftFeeling: string;
  difficultyLevel: string;
  habitToChange: string;
}

interface SpiritAccountabilityData {
  accountabilityStyle: string;
  reminderFrequency: string;
  wantsPartner: string;
  struggleMotivation: string;
  reflectionLocation: string;
  upliftingPrompts: string;
}

interface SpiritVisualizationData {
  futureFeeling: string;
  desiredChange: string;
  consistentPractice: string;
  firstNotice: string;
  affirmation: string;
}

interface SpiritTargetData {
  spiritualPractice: string;
  practiceFrequency: string;
  sessionLength: string;
  thirtyDayMilestone: string;
  trackingStyle: string;
  reminderSystem: string;
}

const TOTAL_STEPS = 7;
const REQUIRED_COMMIT_TOKENS = 50;

const DEFAULT_WHY: SpiritWhyData = {
  reason: "",
  dailyChange: "",
  biggerValue: "",
  futureFeeling: "",
  inspiration: "",
  missOut: "",
};

const DEFAULT_CHALLENGES: SpiritChallengesData = {
  distraction: "",
  innerStruggle: "",
  externalObstacle: "",
  driftFeeling: "",
  difficultyLevel: "",
  habitToChange: "",
};

const DEFAULT_ACCOUNTABILITY: SpiritAccountabilityData = {
  accountabilityStyle: "",
  reminderFrequency: "",
  wantsPartner: "",
  struggleMotivation: "",
  reflectionLocation: "",
  upliftingPrompts: "",
};

const DEFAULT_VISUALIZATION: SpiritVisualizationData = {
  futureFeeling: "",
  desiredChange: "",
  consistentPractice: "",
  firstNotice: "",
  affirmation: "",
};

const DEFAULT_TARGET: SpiritTargetData = {
  spiritualPractice: "",
  practiceFrequency: "",
  sessionLength: "",
  thirtyDayMilestone: "",
  trackingStyle: "",
  reminderSystem: "",
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

const DAILY_CHANGE_OPTIONS = [
  "More peace and calm",
  "Better self-control",
  "More gratitude and joy",
  "Clearer purpose and direction",
];

const BIGGER_VALUE_OPTIONS = [
  "Faith and closeness to God",
  "Inner peace",
  "Purpose-driven living",
  "Compassion and kindness",
  "Discipline and consistency",
];

const FUTURE_FEELING_OPTIONS = [
  "Peaceful",
  "Grounded",
  "Hopeful",
  "Disciplined",
  "Spiritually strong",
];

const INSPIRATION_OPTIONS = [
  "Scripture or sacred text",
  "A spiritual leader or mentor",
  "My family or loved ones",
  "My future self",
  "Past moments of spiritual growth",
];

const MISS_OUT_OPTIONS = [
  "Peace of mind",
  "A stronger sense of purpose",
  "Consistency in my faith practice",
  "Healing and emotional stability",
];

const DISTRACTION_OPTIONS = [
  "Busyness and lack of time",
  "Digital distractions",
  "Stress and mental exhaustion",
  "Inconsistent routine",
  "Lack of a quiet space",
];

const INNER_STRUGGLE_OPTIONS = [
  "Doubt",
  "Fear and anxiety",
  "Guilt or shame",
  "Lack of focus",
  "Feeling disconnected",
];

const EXTERNAL_OBSTACLE_OPTIONS = [
  "Unsupportive environment",
  "Lack of community",
  "Work or family pressure",
  "Limited access to spiritual resources",
  "Frequent life disruptions",
];

const DRIFT_FEELING_OPTIONS = [
  "Empty and disconnected",
  "Guilty",
  "Stressed and unsettled",
  "Unmotivated",
  "Spiritually dry",
];

const DIFFICULTY_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

const ACCOUNTABILITY_STYLE_OPTIONS = [
  "Daily reminders",
  "Weekly reflection check-ins",
  "A referee or mentor review",
  "Journaling and self-tracking",
  "Support from friends or community",
];

const REMINDER_FREQUENCY_OPTIONS = [
  "Daily",
  "A few times a week",
  "Weekly",
  "Only when I miss a day",
];

const YES_NO_OPTIONS = ["Yes", "No"];

const STRUGGLE_MOTIVATION_OPTIONS = [
  "Encouraging words and scripture",
  "A reminder of my why",
  "Accountability from someone I trust",
  "Tracking visible progress",
];

const REFLECTION_LOCATION_OPTIONS = [
  "In-app journal",
  "Notes app",
  "Private physical journal",
  "Shared check-in with a mentor or friend",
];

const CONSISTENT_PRACTICE_OPTIONS = [
  "Prayer",
  "Meditation",
  "Reading spiritual books or scripture",
  "Journaling",
  "Acts of service",
];

const FIRST_NOTICE_OPTIONS = [
  "My family",
  "Close friends",
  "My spiritual mentor",
  "Myself",
  "My community",
];

const SPIRITUAL_PRACTICE_OPTIONS = [
  "Prayer",
  "Meditation",
  "Reading scripture or spiritual books",
  "Journaling",
  "Worship and reflection",
  "Acts of service",
];

const PRACTICE_FREQUENCY_OPTIONS = [
  "Daily",
  "4-5 times a week",
  "3 times a week",
  "Weekends only",
];

const SESSION_LENGTH_OPTIONS = [
  "5 minutes",
  "10 minutes",
  "15 minutes",
  "30 minutes",
  "1 hour",
];

const TRACKING_STYLE_OPTIONS = [
  "Quantity",
  "Consistency",
  "Both quantity and consistency",
];

function formatDateForInput(date: Date) {
  return date.toISOString().split("T")[0];
}

function resolveSpiritEndDate(frequency: string) {
  const start = new Date();
  const end = new Date(start);

  switch (frequency) {
    case "Daily":
    case "4-5 times a week":
      end.setDate(end.getDate() + 30);
      break;
    case "3 times a week":
      end.setDate(end.getDate() + 45);
      break;
    default:
      end.setDate(end.getDate() + 60);
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
  placeholder = "--select--",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
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
          <option value="">{placeholder}</option>
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

export default function StrengthenSpiritWorkflow({
  goalTitle = "Strengthen your spirit",
  onCancel,
}: StrengthenSpiritWorkflowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [why, setWhy] = useState<SpiritWhyData>(DEFAULT_WHY);
  const [challenges, setChallenges] =
    useState<SpiritChallengesData>(DEFAULT_CHALLENGES);
  const [accountability, setAccountability] =
    useState<SpiritAccountabilityData>(DEFAULT_ACCOUNTABILITY);
  const [visualization, setVisualization] =
    useState<SpiritVisualizationData>(DEFAULT_VISUALIZATION);
  const [target, setTarget] = useState<SpiritTargetData>(DEFAULT_TARGET);
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
          isFilled(why.reason) &&
          isFilled(why.dailyChange) &&
          isFilled(why.biggerValue) &&
          isFilled(why.futureFeeling) &&
          isFilled(why.inspiration) &&
          isFilled(why.missOut)
        );
      case 2:
        return (
          isFilled(challenges.distraction) &&
          isFilled(challenges.innerStruggle) &&
          isFilled(challenges.externalObstacle) &&
          isFilled(challenges.driftFeeling) &&
          isFilled(challenges.difficultyLevel) &&
          isFilled(challenges.habitToChange)
        );
      case 3:
        return (
          isFilled(accountability.accountabilityStyle) &&
          isFilled(accountability.reminderFrequency) &&
          isFilled(accountability.wantsPartner) &&
          isFilled(accountability.struggleMotivation) &&
          isFilled(accountability.reflectionLocation) &&
          isFilled(accountability.upliftingPrompts)
        );
      case 4:
        return (
          isFilled(visualization.futureFeeling) &&
          isFilled(visualization.desiredChange) &&
          isFilled(visualization.consistentPractice) &&
          isFilled(visualization.firstNotice) &&
          isFilled(visualization.affirmation)
        );
      case 5:
        return referee.selfManaged || isFilled(referee.refereeContact);
      case 6:
        return true;
      case 7:
        return (
          isFilled(target.spiritualPractice) &&
          isFilled(target.practiceFrequency) &&
          isFilled(target.sessionLength) &&
          isFilled(target.thirtyDayMilestone) &&
          isFilled(target.trackingStyle) &&
          isFilled(target.reminderSystem)
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

      const { startDate, endDate } = resolveSpiritEndDate(
        target.practiceFrequency,
      );

      const description = [
        `Reason to strengthen spirit: ${why.reason}.`,
        `Positive daily change: ${why.dailyChange}.`,
        `Bigger life value: ${why.biggerValue}.`,
        `Desired feeling in 3 months: ${why.futureFeeling}.`,
        `Spiritual inspiration: ${why.inspiration}.`,
        `What may be missed: ${why.missOut}.`,
        `Main distraction: ${challenges.distraction}.`,
        `Inner struggle: ${challenges.innerStruggle}.`,
        `External obstacle: ${challenges.externalObstacle}.`,
        `Feeling when drifting away: ${challenges.driftFeeling}.`,
        `Challenge difficulty: ${challenges.difficultyLevel}/10.`,
        `Habit or thought to change: ${challenges.habitToChange}.`,
        `Accountability preference: ${accountability.accountabilityStyle}.`,
        `Reminder frequency: ${accountability.reminderFrequency}.`,
        `Track progress with someone else: ${accountability.wantsPartner}.`,
        `Motivation when struggling: ${accountability.struggleMotivation}.`,
        `Reflection location: ${accountability.reflectionLocation}.`,
        `Receive uplifting prompts: ${accountability.upliftingPrompts}.`,
        `Future strengthened feeling: ${visualization.futureFeeling}.`,
        `Specific change in self: ${visualization.desiredChange}.`,
        `Consistent practice vision: ${visualization.consistentPractice}.`,
        `First person to notice change: ${visualization.firstNotice}.`,
        `Future-self affirmation: ${visualization.affirmation}.`,
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
        `Spiritual practice focus: ${target.spiritualPractice}.`,
        `Practice frequency: ${target.practiceFrequency}.`,
        `Time per session: ${target.sessionLength}.`,
        `30-day milestone: ${target.thirtyDayMilestone}.`,
        `Tracking style: ${target.trackingStyle}.`,
        `Reminder system: ${target.reminderSystem}.`,
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
        title: target.spiritualPractice,
        category: "Strengthen your spirit",
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
            visualTitle="Define the deeper reason"
            visualBody="This workflow begins with meaning, grounding the spiritual commitment in purpose, inspiration, and the personal cost of not pursuing it."
            visualImageSrc="/images/milestones-character.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <TextareaQuestion
                label="Why do you want to strengthen your spirit?"
                value={why.reason}
                onChange={(value) =>
                  setWhy((current) => ({ ...current, reason: value }))
                }
                placeholder='E.g. "To find peace, grow closer to God, reduce stress"'
              />
              <SelectQuestion
                label="What positive change do you hope this will bring to your daily life?"
                value={why.dailyChange}
                onChange={(value) =>
                  setWhy((current) => ({ ...current, dailyChange: value }))
                }
                options={DAILY_CHANGE_OPTIONS}
              />
              <SelectQuestion
                label="Is this connected to a bigger life goal or value you hold?"
                value={why.biggerValue}
                onChange={(value) =>
                  setWhy((current) => ({ ...current, biggerValue: value }))
                }
                options={BIGGER_VALUE_OPTIONS}
              />
              <SelectQuestion
                label="How do you want to feel differently 3 months from now?"
                value={why.futureFeeling}
                onChange={(value) =>
                  setWhy((current) => ({ ...current, futureFeeling: value }))
                }
                options={FUTURE_FEELING_OPTIONS}
              />
              <SelectQuestion
                label="Who or what inspires you to grow spiritually?"
                value={why.inspiration}
                onChange={(value) =>
                  setWhy((current) => ({ ...current, inspiration: value }))
                }
                options={INSPIRATION_OPTIONS}
              />
              <SelectQuestion
                label="If you don’t pursue this, what do you feel you might miss out on?"
                value={why.missOut}
                onChange={(value) =>
                  setWhy((current) => ({ ...current, missOut: value }))
                }
                options={MISS_OUT_OPTIONS}
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
            visualTitle="Name the blockers"
            visualBody="This step captures the distractions, inner struggles, and environmental obstacles that typically pull the user away from spiritual consistency."
            visualImageSrc="/images/behavioural-solution.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="What usually distracts you from your spiritual growth?"
                value={challenges.distraction}
                onChange={(value) =>
                  setChallenges((current) => ({ ...current, distraction: value }))
                }
                options={DISTRACTION_OPTIONS}
              />
              <SelectQuestion
                label="What inner struggles do you face most often?"
                value={challenges.innerStruggle}
                onChange={(value) =>
                  setChallenges((current) => ({ ...current, innerStruggle: value }))
                }
                options={INNER_STRUGGLE_OPTIONS}
              />
              <SelectQuestion
                label="Are there external obstacles affecting your spiritual journey?"
                value={challenges.externalObstacle}
                onChange={(value) =>
                  setChallenges((current) => ({
                    ...current,
                    externalObstacle: value,
                  }))
                }
                options={EXTERNAL_OBSTACLE_OPTIONS}
              />
              <SelectQuestion
                label="How do you usually feel when you drift away from your spiritual goals?"
                value={challenges.driftFeeling}
                onChange={(value) =>
                  setChallenges((current) => ({ ...current, driftFeeling: value }))
                }
                options={DRIFT_FEELING_OPTIONS}
              />
              <SelectQuestion
                label="On a scale of 1-10, how difficult do you feel it is to overcome these challenges?"
                value={challenges.difficultyLevel}
                onChange={(value) =>
                  setChallenges((current) => ({
                    ...current,
                    difficultyLevel: value,
                  }))
                }
                options={DIFFICULTY_OPTIONS}
              />
              <TextQuestion
                label="What’s one habit or thought you’d like to change that holds you back?"
                value={challenges.habitToChange}
                onChange={(value) =>
                  setChallenges((current) => ({
                    ...current,
                    habitToChange: value,
                  }))
                }
                placeholder="Text here"
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
                <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
                <path d="M8 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M8 14H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            }
            visualTitle="Design the support system"
            visualBody="This step defines how reminders, reflection, encouragement, and shared accountability should work inside the spiritual workflow."
            visualImageSrc="/images/progress-consistency-character.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="How do you prefer to stay accountable?"
                value={accountability.accountabilityStyle}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    accountabilityStyle: value,
                  }))
                }
                options={ACCOUNTABILITY_STYLE_OPTIONS}
              />
              <SelectQuestion
                label="How often would you like to be reminded of your commitments?"
                value={accountability.reminderFrequency}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    reminderFrequency: value,
                  }))
                }
                options={REMINDER_FREQUENCY_OPTIONS}
              />
              <SelectQuestion
                label="Would you like someone else to track your progress with you?"
                value={accountability.wantsPartner}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    wantsPartner: value,
                  }))
                }
                options={YES_NO_OPTIONS}
              />
              <SelectQuestion
                label="What motivates you most when you’re struggling?"
                value={accountability.struggleMotivation}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    struggleMotivation: value,
                  }))
                }
                options={STRUGGLE_MOTIVATION_OPTIONS}
              />
              <SelectQuestion
                label="Where do you want your accountability reflections recorded?"
                value={accountability.reflectionLocation}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    reflectionLocation: value,
                  }))
                }
                options={REFLECTION_LOCATION_OPTIONS}
              />
              <SelectQuestion
                label="Would you like to receive uplifting prompts when you miss a day?"
                value={accountability.upliftingPrompts}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    upliftingPrompts: value,
                  }))
                }
                options={YES_NO_OPTIONS}
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
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            }
            visualTitle="Picture the transformed self"
            visualBody="This step frames the emotional outcome, the daily changes, the visible signs of growth, and the affirmation that defines spiritual progress."
            visualImageSrc="/images/goal-exercise.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="How will your life feel when your spirit is strengthened?"
                value={visualization.futureFeeling}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    futureFeeling: value,
                  }))
                }
                options={FUTURE_FEELING_OPTIONS}
              />
              <TextQuestion
                label="What specific change do you hope to see in yourself?"
                value={visualization.desiredChange}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    desiredChange: value,
                  }))
                }
                placeholder="E.g. I will be calmer in stressful situations"
              />
              <SelectQuestion
                label="What habits or practices do you see yourself doing consistently?"
                value={visualization.consistentPractice}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    consistentPractice: value,
                  }))
                }
                options={CONSISTENT_PRACTICE_OPTIONS}
              />
              <SelectQuestion
                label="Who will notice the positive change in you first?"
                value={visualization.firstNotice}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    firstNotice: value,
                  }))
                }
                options={FIRST_NOTICE_OPTIONS}
              />
              <TextQuestion
                label="If you could write a short affirmation of your future self, what would it be?"
                value={visualization.affirmation}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    affirmation: value,
                  }))
                }
                placeholder="E.g. I am spiritually grounded and unshakable"
              />
            </div>
          </StepShell>
        )}

        {step === 5 && (
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
            activeIndex={4}
            refereeOptions={["Individual referee", "On your Honor"]}
            selfManagedOptionLabel="On your Honor"
          />
        )}

        {step === 6 && (
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
            activeIndex={5}
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
                <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M12 7V12L15.5 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            }
            visualTitle="Turn practice into a measurable target"
            visualBody="The final step converts spiritual intention into a concrete practice, cadence, session length, and measurable 30-day milestone."
            visualImageSrc="/images/behavioural-solution.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleOpenCommitConfirm}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="What spiritual practice do you want to focus on?"
                value={target.spiritualPractice}
                onChange={(value) =>
                  setTarget((current) => ({
                    ...current,
                    spiritualPractice: value,
                  }))
                }
                options={SPIRITUAL_PRACTICE_OPTIONS}
              />
              <SelectQuestion
                label="How often do you want to commit to this practice?"
                value={target.practiceFrequency}
                onChange={(value) =>
                  setTarget((current) => ({
                    ...current,
                    practiceFrequency: value,
                  }))
                }
                options={PRACTICE_FREQUENCY_OPTIONS}
              />
              <SelectQuestion
                label="How much time will you dedicate to each session?"
                value={target.sessionLength}
                onChange={(value) =>
                  setTarget((current) => ({
                    ...current,
                    sessionLength: value,
                  }))
                }
                options={SESSION_LENGTH_OPTIONS}
              />
              <TextQuestion
                label="What specific milestone do you want to achieve in the next 30 days?"
                value={target.thirtyDayMilestone}
                onChange={(value) =>
                  setTarget((current) => ({
                    ...current,
                    thirtyDayMilestone: value,
                  }))
                }
                placeholder='E.g. Complete one spiritual book or meditate 10 minutes daily for 30 days'
              />
              <SelectQuestion
                label="Do you want to track progress in quantity, consistency, or both?"
                value={target.trackingStyle}
                onChange={(value) =>
                  setTarget((current) => ({
                    ...current,
                    trackingStyle: value,
                  }))
                }
                options={TRACKING_STYLE_OPTIONS}
              />
              <SelectQuestion
                label="Would you like to set a reminder system to help you stay consistent?"
                value={target.reminderSystem}
                onChange={(value) =>
                  setTarget((current) => ({
                    ...current,
                    reminderSystem: value,
                  }))
                }
                options={YES_NO_OPTIONS}
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
