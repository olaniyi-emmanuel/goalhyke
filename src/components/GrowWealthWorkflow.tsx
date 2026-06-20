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

interface GrowWealthWorkflowProps {
  goalTitle?: string;
  onCancel: () => void;
}

interface GrowWealthTargetData {
  specificGoal: string;
  targetAmount: string;
  timeline: string;
  howToAchieve: string[];
  challenges: string[];
  progressTracking: string;
}

interface GrowWealthWhyData {
  reason: string;
  lifeImpact: string;
  financialMotivation: string;
  commitmentReminder: string;
}

interface GrowWealthChallengesData {
  obstacles: string[];
  triedBefore: string;
  supportNeeded: string;
  accountabilityPlan: string;
}

interface GrowWealthAccountabilityData {
  accountabilityMethods: string[];
  reviewFrequency: string;
  reminderChannels: string[];
  invitePartner: string;
  accountabilityMotivation: string;
}

interface GrowWealthVisualizationData {
  lifeChanges: string[];
  successLook: string;
  reward: string;
  successStatement: string;
  motivationalMessages: string;
}

const TOTAL_STEPS = 7;
const REQUIRED_COMMIT_TOKENS = 50;

const DEFAULT_TARGET: GrowWealthTargetData = {
  specificGoal: "",
  targetAmount: "",
  timeline: "",
  howToAchieve: [],
  challenges: [],
  progressTracking: "",
};

const DEFAULT_WHY: GrowWealthWhyData = {
  reason: "",
  lifeImpact: "",
  financialMotivation: "",
  commitmentReminder: "",
};

const DEFAULT_CHALLENGES: GrowWealthChallengesData = {
  obstacles: [],
  triedBefore: "",
  supportNeeded: "",
  accountabilityPlan: "",
};

const DEFAULT_ACCOUNTABILITY: GrowWealthAccountabilityData = {
  accountabilityMethods: [],
  reviewFrequency: "",
  reminderChannels: [],
  invitePartner: "",
  accountabilityMotivation: "",
};

const DEFAULT_VISUALIZATION: GrowWealthVisualizationData = {
  lifeChanges: [],
  successLook: "",
  reward: "",
  successStatement: "",
  motivationalMessages: "",
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

const WEALTH_GOAL_OPTIONS = [
  "Save a specific amount of money",
  "Invest in stocks or crypto",
  "Pay off debt",
  "Build an emergency fund",
  "Increase monthly income",
  "Start a business",
];

const TIMELINE_OPTIONS = ["3 months", "6 months", "1 year", "Custom"];

const HOW_TO_ACHIEVE_OPTIONS = [
  "Save a percentage of my income",
  "Invest in stocks, real estate, or crypto",
  "Start a side hustle",
  "Reduce unnecessary expenses",
];

const TARGET_CHALLENGE_OPTIONS = [
  "Low income or lack of job opportunities",
  "High expenses and poor budgeting habits",
  "Unexpected financial emergencies",
  "Debt repayment burden",
  "Lack of investment knowledge",
  "Fear of taking financial risks",
  "Impulse spending and lack of financial discipline",
];

const PROGRESS_TRACKING_OPTIONS = [
  "A financial milestone tracker",
  "A quote or personal mantra",
  "A vision board of financial goals",
];

const WHY_OPTIONS = [
  "Achieve financial freedom",
  "Retire early or comfortably",
  "Reduce financial stress",
  "Provide for my family",
  "Travel and enjoy life experiences",
  "Buy a home or property",
];

const LIFE_IMPACT_OPTIONS = [
  "I will have peace of mind knowing I'm financially stable",
  "I will have more opportunities to invest and grow",
  "I will be able to support my loved ones",
];

const MOTIVATION_OPTIONS = [
  "My family and loved ones",
  "My future self",
  "My retirement plans",
  "My dream lifestyle",
];

const REMINDER_OPTIONS = [
  "A financial milestone tracker",
  "A quote or personal mantra",
  "A vision board of financial goals",
];

const TRIED_BEFORE_OPTIONS = [
  "Yes, but I lack consistency",
  "Yes, but unexpected expenses got in the way",
  "No, this is my first time setting this goal",
];

const SUPPORT_NEEDED_OPTIONS = [
  "A financial mentor or advisor",
  "A budgeting and expense tracking tool",
  "An emergency fund plan",
  "An investment education course",
];

const CHALLENGE_ACCOUNTABILITY_OPTIONS = [
  "Remind myself why I started",
  "Track my progress weekly",
  "Join an accountability group",
  "Automate my savings and investments",
];

const ACCOUNTABILITY_METHOD_OPTIONS = [
  "Daily reminders and progress check-ins",
  "Weekly financial reports and tracking",
  "Joining an accountability group with similar goals",
  "Partnering with a financial mentor or coach",
  "Using an expense and investment tracking tool",
];

const REVIEW_FREQUENCY_OPTIONS = ["Daily", "Weekly", "Monthly", "Custom"];

const REMINDER_CHANNEL_OPTIONS = [
  "Email",
  "WhatsApp",
  "In-app notifications",
  "SMS",
];

const PARTNER_INVITE_OPTIONS = [
  "Yes, let me invite someone",
  "No, I will stay accountable on my own",
];

const ACCOUNTABILITY_MOTIVATION_OPTIONS = [
  "Seeing my savings/investments grow",
  "Avoiding financial stress and debt",
  "The rewards I'll get at the end",
];

const LIFE_CHANGES_OPTIONS = [
  "I will feel financially secure and stress-free",
  "I will have freedom to travel and enjoy experiences",
  "I will be able to invest in my future confidently",
  "I will have peace of mind knowing I am prepared for emergencies",
  "I will be able to give back and support loved ones",
];

const REWARD_OPTIONS = [
  "A vacation or experience",
  "Investing in a passion project",
  "Upgrading my lifestyle (home, cars, gadgets)",
  "Giving back to family or charity",
];

const MOTIVATIONAL_MESSAGE_OPTIONS = ["Yes", "No"];

function formatDateForInput(date: Date) {
  return date.toISOString().split("T")[0];
}

function resolveGrowWealthEndDate(timeframe: string) {
  const start = new Date();
  const end = new Date(start);

  switch (timeframe) {
    case "3 months":
      end.setMonth(end.getMonth() + 3);
      break;
    case "6 months":
      end.setMonth(end.getMonth() + 6);
      break;
    case "1 year":
      end.setFullYear(end.getFullYear() + 1);
      break;
    case "Custom":
      end.setMonth(end.getMonth() + 9);
      break;
    default:
      end.setMonth(end.getMonth() + 6);
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

function arrayFilled(value: string[]) {
  return value.length > 0;
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
      <div className="relative max-w-[520px]">
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

function CheckboxQuestion({
  label,
  values,
  onChange,
  options,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: string[];
}) {
  const toggle = (option: string) => {
    if (values.includes(option)) {
      onChange(values.filter((value) => value !== option));
      return;
    }

    onChange([...values, option]);
  };

  return (
    <div className="flex flex-col gap-4">
      <span className="text-[18px] font-medium leading-7 text-[#262525] font-secondary">
        {label}
      </span>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const checked = values.includes(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={`rounded-full border px-4 py-2 text-left text-[14px] transition-colors sm:text-[15px] ${
                checked
                  ? "border-[#7655fb] bg-[#f2edff] text-[#4a33a4]"
                  : "border-[#d8deeb] bg-white text-[#4f5670] hover:border-[#bfc7db]"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function GrowWealthWorkflow({
  goalTitle = "Grow wealth",
  onCancel,
}: GrowWealthWorkflowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [target, setTarget] = useState<GrowWealthTargetData>(DEFAULT_TARGET);
  const [why, setWhy] = useState<GrowWealthWhyData>(DEFAULT_WHY);
  const [challenges, setChallenges] =
    useState<GrowWealthChallengesData>(DEFAULT_CHALLENGES);
  const [accountability, setAccountability] =
    useState<GrowWealthAccountabilityData>(DEFAULT_ACCOUNTABILITY);
  const [visualization, setVisualization] =
    useState<GrowWealthVisualizationData>(DEFAULT_VISUALIZATION);
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
          isFilled(target.specificGoal) &&
          isFilled(target.targetAmount) &&
          isFilled(target.timeline) &&
          arrayFilled(target.howToAchieve) &&
          arrayFilled(target.challenges) &&
          isFilled(target.progressTracking)
        );
      case 2:
        return (
          isFilled(why.reason) &&
          isFilled(why.lifeImpact) &&
          isFilled(why.financialMotivation) &&
          isFilled(why.commitmentReminder)
        );
      case 3:
        return (
          arrayFilled(challenges.obstacles) &&
          isFilled(challenges.triedBefore) &&
          isFilled(challenges.supportNeeded) &&
          isFilled(challenges.accountabilityPlan)
        );
      case 4:
        return (
          arrayFilled(accountability.accountabilityMethods) &&
          isFilled(accountability.reviewFrequency) &&
          arrayFilled(accountability.reminderChannels) &&
          isFilled(accountability.invitePartner) &&
          isFilled(accountability.accountabilityMotivation)
        );
      case 5:
        return (
          arrayFilled(visualization.lifeChanges) &&
          isFilled(visualization.successLook) &&
          isFilled(visualization.reward) &&
          isFilled(visualization.successStatement) &&
          isFilled(visualization.motivationalMessages)
        );
      case 6:
        return referee.selfManaged || isFilled(referee.refereeContact);
      case 7:
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

      const { startDate, endDate } = resolveGrowWealthEndDate(target.timeline);

      const description = [
        `Specific financial goal: ${target.specificGoal}.`,
        `Target amount: ${target.targetAmount}.`,
        `Timeline: ${target.timeline}.`,
        `How to achieve it: ${target.howToAchieve.join(", ")}.`,
        `Potential obstacles: ${target.challenges.join(", ")}.`,
        `Progress tracking: ${target.progressTracking}.`,
        `Why grow wealth: ${why.reason}.`,
        `Life impact: ${why.lifeImpact}.`,
        `Biggest financial motivation: ${why.financialMotivation}.`,
        `Commitment reminder: ${why.commitmentReminder}.`,
        `Biggest obstacles: ${challenges.obstacles.join(", ")}.`,
        `Tried before: ${challenges.triedBefore}.`,
        `Support needed: ${challenges.supportNeeded}.`,
        `Accountability when challenged: ${challenges.accountabilityPlan}.`,
        `Accountability methods: ${accountability.accountabilityMethods.join(", ")}.`,
        `Review frequency: ${accountability.reviewFrequency}.`,
        `Reminder channels: ${accountability.reminderChannels.join(", ")}.`,
        `Invite accountability partner: ${accountability.invitePartner}.`,
        `Accountability motivation: ${accountability.accountabilityMotivation}.`,
        `Life changes after success: ${visualization.lifeChanges.join(", ")}.`,
        `Success looks like: ${visualization.successLook}.`,
        `Reward after success: ${visualization.reward}.`,
        `Success statement: ${visualization.successStatement}.`,
        `Motivational messages: ${visualization.motivationalMessages}.`,
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
        title: target.specificGoal,
        category: "Grow wealth",
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
            visualTitle="Set the financial target first"
            visualBody="The wealth workflow starts by making the goal concrete: the amount, timeline, strategy, obstacles, and how progress gets measured."
            visualImageSrc="/images/goal-wealth.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="What is your specific financial goal?"
                value={target.specificGoal}
                onChange={(value) =>
                  setTarget((current) => ({ ...current, specificGoal: value }))
                }
                options={WEALTH_GOAL_OPTIONS}
              />
              <TextQuestion
                label="What is your target amount?"
                value={target.targetAmount}
                onChange={(value) =>
                  setTarget((current) => ({ ...current, targetAmount: value }))
                }
                placeholder="Enter the amount you want to achieve e.g. $150,000"
              />
              <SelectQuestion
                label="What is your timeline to achieve this goal?"
                value={target.timeline}
                onChange={(value) =>
                  setTarget((current) => ({ ...current, timeline: value }))
                }
                options={TIMELINE_OPTIONS}
              />
              <CheckboxQuestion
                label="How will you achieve this goal?"
                values={target.howToAchieve}
                onChange={(value) =>
                  setTarget((current) => ({ ...current, howToAchieve: value }))
                }
                options={HOW_TO_ACHIEVE_OPTIONS}
              />
              <CheckboxQuestion
                label="What challenges might stop you from achieving this goal?"
                values={target.challenges}
                onChange={(value) =>
                  setTarget((current) => ({ ...current, challenges: value }))
                }
                options={TARGET_CHALLENGE_OPTIONS}
              />
              <SelectQuestion
                label="How will you measure your progress?"
                value={target.progressTracking}
                onChange={(value) =>
                  setTarget((current) => ({ ...current, progressTracking: value }))
                }
                options={PROGRESS_TRACKING_OPTIONS}
              />
            </div>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell
            currentStep={2}
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
            visualTitle="Connect wealth to meaning"
            visualBody="This step defines the personal reason behind the money goal so the target stays emotionally relevant, not just numeric."
            visualImageSrc="/images/progress-consistency-character.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="Why do you want to grow your wealth?"
                value={why.reason}
                onChange={(value) =>
                  setWhy((current) => ({ ...current, reason: value }))
                }
                options={WHY_OPTIONS}
              />
              <SelectQuestion
                label="How will achieving this goal impact your life?"
                value={why.lifeImpact}
                onChange={(value) =>
                  setWhy((current) => ({ ...current, lifeImpact: value }))
                }
                options={LIFE_IMPACT_OPTIONS}
              />
              <SelectQuestion
                label="Who or what is your biggest financial motivation?"
                value={why.financialMotivation}
                onChange={(value) =>
                  setWhy((current) => ({
                    ...current,
                    financialMotivation: value,
                  }))
                }
                options={MOTIVATION_OPTIONS}
              />
              <SelectQuestion
                label="What is one thing that will remind you to stay committed?"
                value={why.commitmentReminder}
                onChange={(value) =>
                  setWhy((current) => ({
                    ...current,
                    commitmentReminder: value,
                  }))
                }
                options={REMINDER_OPTIONS}
              />
            </div>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell
            currentStep={3}
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
            visualTitle="Name the money blockers"
            visualBody="This step surfaces the patterns and constraints that usually slow down wealth growth so the workflow can support the right habits."
            visualImageSrc="/images/goal-wealth.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <CheckboxQuestion
                label="What are the biggest obstacles that could stop you from growing your wealth?"
                values={challenges.obstacles}
                onChange={(value) =>
                  setChallenges((current) => ({ ...current, obstacles: value }))
                }
                options={TARGET_CHALLENGE_OPTIONS}
              />
              <SelectQuestion
                label="Have you tried to achieve this financial goal before? If so, what went wrong?"
                value={challenges.triedBefore}
                onChange={(value) =>
                  setChallenges((current) => ({ ...current, triedBefore: value }))
                }
                options={TRIED_BEFORE_OPTIONS}
              />
              <SelectQuestion
                label="What support or resources do you think would help you overcome these challenges?"
                value={challenges.supportNeeded}
                onChange={(value) =>
                  setChallenges((current) => ({
                    ...current,
                    supportNeeded: value,
                  }))
                }
                options={SUPPORT_NEEDED_OPTIONS}
              />
              <SelectQuestion
                label="How will you stay accountable when challenges arise?"
                value={challenges.accountabilityPlan}
                onChange={(value) =>
                  setChallenges((current) => ({
                    ...current,
                    accountabilityPlan: value,
                  }))
                }
                options={CHALLENGE_ACCOUNTABILITY_OPTIONS}
              />
            </div>
          </StepShell>
        )}

        {step === 4 && (
          <StepShell
            currentStep={4}
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
            visualTitle="Define how the pressure works"
            visualBody="This step sets the review rhythm, reminder channels, and accountability style that will keep the wealth plan moving."
            visualImageSrc="/images/milestones-character.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <CheckboxQuestion
                label="How would you like to stay accountable to your financial goal?"
                values={accountability.accountabilityMethods}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    accountabilityMethods: value,
                  }))
                }
                options={ACCOUNTABILITY_METHOD_OPTIONS}
              />
              <SelectQuestion
                label="How often would you like to review your progress?"
                value={accountability.reviewFrequency}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    reviewFrequency: value,
                  }))
                }
                options={REVIEW_FREQUENCY_OPTIONS}
              />
              <CheckboxQuestion
                label="Where should we send your accountability reminders?"
                values={accountability.reminderChannels}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    reminderChannels: value,
                  }))
                }
                options={REMINDER_CHANNEL_OPTIONS}
              />
              <SelectQuestion
                label="Would you like to invite an accountability partner to track your progress with you?"
                value={accountability.invitePartner}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    invitePartner: value,
                  }))
                }
                options={PARTNER_INVITE_OPTIONS}
              />
              <SelectQuestion
                label="What motivates you to stay accountable?"
                value={accountability.accountabilityMotivation}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    accountabilityMotivation: value,
                  }))
                }
                options={ACCOUNTABILITY_MOTIVATION_OPTIONS}
              />
            </div>
          </StepShell>
        )}

        {step === 5 && (
          <StepShell
            currentStep={5}
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
            visualTitle="Make the outcome vivid"
            visualBody="This step turns the financial goal into a felt future, with a success image, reward, and personal statement that reinforce follow-through."
            visualImageSrc="/images/behavioural-solution.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <CheckboxQuestion
                label="Imagine yourself achieving your financial goal. How will your life change?"
                values={visualization.lifeChanges}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    lifeChanges: value,
                  }))
                }
                options={LIFE_CHANGES_OPTIONS}
              />
              <TextareaQuestion
                label="What does success look like to you?"
                value={visualization.successLook}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    successLook: value,
                  }))
                }
                placeholder="Describe the image, moment, or lifestyle that represents financial success for you."
              />
              <SelectQuestion
                label="When you achieve your financial goal, what will be your first reward to yourself?"
                value={visualization.reward}
                onChange={(value) =>
                  setVisualization((current) => ({ ...current, reward: value }))
                }
                options={REWARD_OPTIONS}
              />
              <TextareaQuestion
                label="Write a personal success statement"
                value={visualization.successStatement}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    successStatement: value,
                  }))
                }
                placeholder='Example: "By [date], I will achieve [goal] and enjoy the financial freedom I deserve."'
              />
              <SelectQuestion
                label="Would you like to receive motivational messages based on your vision?"
                value={visualization.motivationalMessages}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    motivationalMessages: value,
                  }))
                }
                options={MOTIVATIONAL_MESSAGE_OPTIONS}
              />
            </div>
          </StepShell>
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
            submitLabel="Submit"
            progressSteps={TOTAL_STEPS}
            activeIndex={6}
          />
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
