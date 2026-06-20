"use client";

import React, { type ReactNode, useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import GoalRefereeForm, {
  type ExerciseRefereeFormData,
} from "@/components/GoalRefereeForm";
import GoalSupportersForm, {
  type ExerciseSupportersFormData,
} from "@/components/GoalSupportersForm";

interface LoseWeightWorkflowProps {
  goalTitle?: string;
  onCancel: () => void;
}

interface LoseWeightTargetData {
  currentWeight: string;
  weightUnit: "kg" | "pounds";
  currentHeight: string;
  heightUnit: "m" | "cm";
  targetWeight: string;
  targetWeightUnit: "kg" | "pounds";
  timeframeValue: string;
  timeframeUnit: "days" | "weeks";
  starts: string;
}

interface LoseWeightWhyData {
  primaryReason: string;
  lifeImpact: string;
  motivation: string;
  successFeeling: string;
}

interface LoseWeightChallengesData {
  challenges: string[];
}

interface LoseWeightAccountabilityData {
  accountabilityStyle: string;
  checkInFrequency: string;
  motivationType: string;
}

interface LoseWeightVisualizationData {
  desiredFeeling: string;
  firstReward: string;
  biggestBenefitArea: string;
}

const TOTAL_STEPS = 7;
const REQUIRED_COMMIT_TOKENS = 50;

const DEFAULT_TARGET: LoseWeightTargetData = {
  currentWeight: "",
  weightUnit: "kg",
  currentHeight: "",
  heightUnit: "m",
  targetWeight: "",
  targetWeightUnit: "kg",
  timeframeValue: "",
  timeframeUnit: "weeks",
  starts: "Today",
};

const DEFAULT_WHY: LoseWeightWhyData = {
  primaryReason: "",
  lifeImpact: "",
  motivation: "",
  successFeeling: "",
};

const DEFAULT_CHALLENGES: LoseWeightChallengesData = {
  challenges: [],
};

const DEFAULT_ACCOUNTABILITY: LoseWeightAccountabilityData = {
  accountabilityStyle: "",
  checkInFrequency: "",
  motivationType: "",
};

const DEFAULT_VISUALIZATION: LoseWeightVisualizationData = {
  desiredFeeling: "",
  firstReward: "",
  biggestBenefitArea: "",
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

const PRIMARY_REASON_OPTIONS = [
  "Improve my health",
  "Feel more confident in my body",
  "Reduce health risks",
  "Have more energy every day",
  "Look and feel better",
];

const LIFE_IMPACT_OPTIONS = [
  "I will be more active and energetic",
  "I will feel more confident and comfortable",
  "I will improve my long-term health",
  "I will reduce stress and feel lighter",
];

const MOTIVATION_OPTIONS = [
  "My family and loved ones",
  "My future self",
  "My health goals",
  "A major upcoming event",
  "Proving to myself that I can do it",
];

const SUCCESS_FEELING_OPTIONS = [
  "Proud",
  "Confident",
  "Relieved",
  "Excited",
  "Strong and healthy",
];

const CHALLENGE_OPTIONS = [
  "Craving & unhealthy eating",
  "Lack of motivation",
  "Busy schedule",
  "Emotional eating",
  "Inconsistent routine",
  "Social influences",
  "Lack of access to healthy food or gym",
  "Slow or no visible results",
  "Sleep issues",
];

const ACCOUNTABILITY_STYLE_OPTIONS = [
  "Daily habit reminders",
  "Weekly progress check-ins",
  "A workout or nutrition partner",
  "A referee who reviews my progress",
  "Tracking my meals and workouts",
];

const CHECK_IN_OPTIONS = ["Daily", "Twice a week", "Weekly", "Bi-weekly"];

const ACCOUNTABILITY_MOTIVATION_OPTIONS = [
  "Encouragement and praise",
  "Consequences if I miss my target",
  "Seeing visible progress",
  "A structured routine with deadlines",
];

const DESIRED_FEELING_OPTIONS = [
  "Energetic & active",
  "Confident in my body",
  "Healthier and free from illness risks",
  "Happier and less stressed",
];

const FIRST_REWARD_OPTIONS = [
  "Buy new clothes",
  "Travel or go to the beach",
  "Share my transformation with friends/family",
  "Just enjoy being healthy and fit",
];

const BIGGEST_BENEFIT_OPTIONS = [
  "Physical health",
  "Mental well-being",
  "Social life",
  "Professional life",
];

function formatDateForInput(date: Date) {
  return date.toISOString().split("T")[0];
}

function isFilled(value: string) {
  return value.trim().length > 0;
}

function toKilograms(weight: number, unit: "kg" | "pounds") {
  return unit === "kg" ? weight : weight * 0.45359237;
}

function toMeters(height: number, unit: "m" | "cm") {
  return unit === "m" ? height : height / 100;
}

function resolveLoseWeightEndDate(target: LoseWeightTargetData) {
  const start = new Date();
  const end = new Date(start);
  const amount = Number.parseInt(target.timeframeValue, 10);
  const duration = Number.isFinite(amount) && amount > 0 ? amount : 4;

  if (target.timeframeUnit === "days") {
    end.setDate(end.getDate() + duration);
  } else {
    end.setDate(end.getDate() + duration * 7);
  }

  return {
    startDate: formatDateForInput(start),
    endDate: formatDateForInput(end),
  };
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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-3" ref={containerRef}>
      <span className="text-[18px] font-medium leading-7 text-[#262525] font-secondary">
        {label}
      </span>
      <div className="relative w-full max-w-[620px]">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex h-[58px] w-full items-center justify-between rounded-[16px] border bg-white px-5 text-[16px] text-left font-secondary outline-none transition-all ${
            isOpen ? "border-[#7655fb] ring-2 ring-[#f2edff]" : "border-[#ccd2e2]"
          }`}
        >
          <span className={value ? "text-[#262525]" : "text-[#9fa6bb]"}>
            {value || placeholder}
          </span>
          <div className={`text-[#262525] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
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
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-[66px] z-50 max-h-[260px] overflow-y-auto rounded-[16px] border border-[#ccd2e2] bg-white py-2 shadow-[0_12px_36px_rgba(24,33,77,0.12)]">
            <button
              type="button"
              onClick={() => handleSelect("")}
              className="flex w-full px-5 py-3 text-left text-[16px] text-[#9fa6bb] hover:bg-[#f7f8ff] transition-colors"
            >
              {placeholder}
            </button>
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={`flex w-full items-center justify-between px-5 py-3 text-left text-[16px] transition-colors ${
                  value === option
                    ? "bg-[#f2edff] text-[#7655fb] font-medium"
                    : "text-[#262525] hover:bg-[#f7f8ff]"
                }`}
              >
                <span>{option}</span>
                {value === option && (
                  <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 5L5 9L13 1" stroke="#7655fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TextQuestion({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "number";
}) {
  return (
    <label className="flex flex-col gap-3">
      <span className="text-[18px] font-medium leading-7 text-[#262525] font-secondary">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-[58px] w-full max-w-[620px] rounded-[16px] border border-[#ccd2e2] bg-white px-5 text-[16px] text-[#262525] outline-none transition-colors placeholder:text-[#9fa6bb] focus:border-[#7655fb]"
      />
    </label>
  );
}

function SegmentedChoice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[18px] font-medium leading-7 text-[#262525] font-secondary">
        {label}
      </span>
      <div className="inline-flex w-fit rounded-full border border-[#d9deea] bg-white p-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full px-4 py-2 text-[14px] transition-colors sm:text-[15px] ${
              value === option
                ? "bg-[#7655fb] text-white"
                : "text-[#5a6075] hover:bg-[#f4f6ff]"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChipGrid({
  label,
  value,
  options,
  onChange,
  multiSelect = false,
}: {
  label: string;
  value: string | string[];
  options: string[];
  onChange: (value: string | string[]) => void;
  multiSelect?: boolean;
}) {
  const selected = Array.isArray(value) ? value : [value].filter(Boolean);

  const handleClick = (option: string) => {
    if (multiSelect) {
      if (selected.includes(option)) {
        onChange(selected.filter((item) => item !== option));
      } else {
        onChange([...selected, option]);
      }
      return;
    }

    onChange(option);
  };

  return (
    <div className="flex flex-col gap-4">
      <span className="text-[18px] font-medium leading-7 text-[#262525] font-secondary">
        {label}
      </span>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => handleClick(option)}
              className={`rounded-[18px] border px-4 py-3 text-left text-[14px] transition-colors sm:text-[15px] ${
                active
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

function BmiCard({
  currentWeight,
  weightUnit,
  currentHeight,
  heightUnit,
}: {
  currentWeight: string;
  weightUnit: "kg" | "pounds";
  currentHeight: string;
  heightUnit: "m" | "cm";
}) {
  const bmiData = useMemo(() => {
    const weightNumber = Number.parseFloat(currentWeight);
    const heightNumber = Number.parseFloat(currentHeight);

    if (!Number.isFinite(weightNumber) || !Number.isFinite(heightNumber)) {
      return null;
    }

    const heightInMeters = toMeters(heightNumber, heightUnit);
    const weightInKg = toKilograms(weightNumber, weightUnit);

    if (heightInMeters <= 0 || weightInKg <= 0) {
      return null;
    }

    const bmi = weightInKg / (heightInMeters * heightInMeters);

    if (bmi < 18.5) {
      return {
        value: bmi,
        status: "Underweight",
        guidance: "You’re below the healthy range. A steady plan can help you build toward a balanced target.",
      };
    }

    if (bmi < 25) {
      return {
        value: bmi,
        status: "Healthy",
        guidance: "You’re in the healthy range. A focused goal can help you maintain or refine your target safely.",
      };
    }

    if (bmi < 30) {
      return {
        value: bmi,
        status: "Overweight",
        guidance: "You’re in the overweight range. Setting a weight-loss goal can help you move into the healthy range.",
      };
    }

    return {
      value: bmi,
      status: "Obese",
      guidance: "You’re in the obese range. We suggest consulting a professional or adopting a gradual, healthy routine to manage your weight.",
    };
  }, [currentHeight, currentWeight, heightUnit, weightUnit]);

  const percentage = useMemo(() => {
    if (!bmiData) return 0;
    const minBmi = 15;
    const maxBmi = 40;
    return Math.max(0, Math.min(100, ((bmiData.value - minBmi) / (maxBmi - minBmi)) * 100));
  }, [bmiData]);

  return (
    <div className="rounded-[24px] border border-[#eceff7] bg-white p-6 shadow-[0_20px_45px_rgba(24,33,77,0.08)]">
      <p className="text-[20px] font-semibold text-[#262525] font-secondary">
        BMI Status
      </p>
      <p className="mt-2 text-[14px] leading-6 text-[#5a6075]">
        Your BMI shows if your weight is healthy for your height.
      </p>

      {bmiData ? (
        <>
          <p className="mt-4 text-[44px] font-bold text-[#262525] font-secondary">
            {bmiData.value.toFixed(1)}
          </p>

          <div className="relative mt-6 h-3 w-full rounded-full bg-transparent">
            {/* Colored segments */}
            <div className="absolute inset-0 flex overflow-hidden rounded-full">
              <div className="h-full bg-[#5aa4ff]" style={{ width: "14%" }} />
              <div className="h-full bg-[#29b36a]" style={{ width: "26%" }} />
              <div className="h-full bg-[#ff8c5a]" style={{ width: "20%" }} />
              <div className="h-full bg-[#ff6f7d]" style={{ width: "40%" }} />
            </div>

            {/* Sliding pointer */}
            <div
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-300 ease-out"
              style={{ left: `${percentage}%` }}
            >
              <div
                className="h-6 w-6 -translate-x-1/2 rounded-full border-4 border-white shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                style={{
                  backgroundColor:
                    bmiData.status === "Healthy"
                      ? "#29b36a"
                      : bmiData.status === "Underweight"
                        ? "#5aa4ff"
                        : bmiData.status === "Overweight"
                          ? "#ff8c5a"
                          : "#ff6f7d",
                }}
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 text-center text-[10px] font-semibold text-[#7a8198] sm:text-[11px]">
            <div className="text-left text-[#5aa4ff]">Underweight</div>
            <div className="text-[#29b36a]">Healthy</div>
            <div className="text-[#ff8c5a]">Overweight</div>
            <div className="text-right text-[#ff6f7d]">Obese</div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 rounded-[18px] bg-[#f7f8ff] p-4 text-[14px] text-[#4f5670]">
            <div>
              <p className="text-[#8a90a3]">Height</p>
              <p className="mt-1 font-semibold text-[#262525]">
                {currentHeight || "--"} {heightUnit}
              </p>
            </div>
            <div>
              <p className="text-[#8a90a3]">Weight</p>
              <p className="mt-1 font-semibold text-[#262525]">
                {currentWeight || "--"} {weightUnit}
              </p>
            </div>
          </div>

          <p
            className="mt-4 text-[16px] font-bold"
            style={{
              color:
                bmiData.status === "Healthy"
                  ? "#29b36a"
                  : bmiData.status === "Underweight"
                    ? "#5aa4ff"
                    : bmiData.status === "Overweight"
                      ? "#ff8c5a"
                      : "#ff6f7d",
            }}
          >
            {bmiData.status}
          </p>
          <p className="mt-2 text-[14px] leading-6 text-[#5a6075]">
            {bmiData.guidance}
          </p>
        </>
      ) : (
        <p className="mt-5 text-[14px] leading-6 text-[#5a6075]">
          Enter your current weight and height to preview your BMI and the healthy-range guidance from the workflow.
        </p>
      )}

      <p className="mt-5 rounded-[18px] bg-[#f7f8ff] px-4 py-3 text-[12px] leading-5 text-[#6a738c]">
        BMI = Body Mass Index, calculated by dividing your weight by your height squared.
      </p>
    </div>
  );
}

export default function LoseWeightWorkflow({
  goalTitle = "Lose weight",
  onCancel,
}: LoseWeightWorkflowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [target, setTarget] = useState<LoseWeightTargetData>(DEFAULT_TARGET);
  const [why, setWhy] = useState<LoseWeightWhyData>(DEFAULT_WHY);
  const [challenges, setChallenges] =
    useState<LoseWeightChallengesData>(DEFAULT_CHALLENGES);
  const [accountability, setAccountability] =
    useState<LoseWeightAccountabilityData>(DEFAULT_ACCOUNTABILITY);
  const [visualization, setVisualization] =
    useState<LoseWeightVisualizationData>(DEFAULT_VISUALIZATION);
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
          isFilled(target.currentWeight) &&
          isFilled(target.currentHeight) &&
          isFilled(target.targetWeight) &&
          isFilled(target.timeframeValue)
        );
      case 2:
        return (
          isFilled(why.primaryReason) &&
          isFilled(why.lifeImpact) &&
          isFilled(why.motivation) &&
          isFilled(why.successFeeling)
        );
      case 3:
        return challenges.challenges.length > 0;
      case 4:
        return (
          isFilled(accountability.accountabilityStyle) &&
          isFilled(accountability.checkInFrequency) &&
          isFilled(accountability.motivationType)
        );
      case 5:
        return (
          isFilled(visualization.desiredFeeling) &&
          isFilled(visualization.firstReward) &&
          isFilled(visualization.biggestBenefitArea)
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

      const { startDate, endDate } = resolveLoseWeightEndDate(target);

      const title = `Lose weight to ${target.targetWeight} ${target.targetWeightUnit}`;

      const description = [
        `Current weight: ${target.currentWeight} ${target.weightUnit}.`,
        `Current height: ${target.currentHeight} ${target.heightUnit}.`,
        `Target weight: ${target.targetWeight} ${target.targetWeightUnit}.`,
        `Timeframe: ${target.timeframeValue} ${target.timeframeUnit}.`,
        `Commitment starts: ${target.starts}.`,
        `Primary reason: ${why.primaryReason}.`,
        `Life impact: ${why.lifeImpact}.`,
        `Main motivation: ${why.motivation}.`,
        `Expected feeling after success: ${why.successFeeling}.`,
        `Challenges: ${challenges.challenges.join(", ")}.`,
        `Accountability style: ${accountability.accountabilityStyle}.`,
        `Check-in frequency: ${accountability.checkInFrequency}.`,
        `Most motivating accountability: ${accountability.motivationType}.`,
        `Desired feeling at goal: ${visualization.desiredFeeling}.`,
        `First reward: ${visualization.firstReward}.`,
        `Biggest benefit area: ${visualization.biggestBenefitArea}.`,
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
        target: {
          current_weight: target.currentWeight,
          weight_unit: target.weightUnit,
          current_height: target.currentHeight,
          height_unit: target.heightUnit,
          target_weight: target.targetWeight,
          target_weight_unit: target.targetWeightUnit,
          timeframe_value: target.timeframeValue,
          timeframe_unit: target.timeframeUnit,
          starts: target.starts,
        },
        why: {
          primary_reason: why.primaryReason,
          life_impact: why.lifeImpact,
          motivation: why.motivation,
          success_feeling: why.successFeeling,
        },
        challenges: challenges.challenges,
        accountability: {
          style: accountability.accountabilityStyle,
          check_in_frequency: accountability.checkInFrequency,
          motivation_type: accountability.motivationType,
        },
        visualization: {
          desired_feeling: visualization.desiredFeeling,
          first_reward: visualization.firstReward,
          biggest_benefit_area: visualization.biggestBenefitArea,
        },
        referee: {
          type: referee.refereeType,
          contact: referee.refereeContact,
          self_managed: referee.selfManaged,
        },
        supporters: {
          auto_accept: supporters.autoAccept,
          names: supporters.supporters.split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
        },
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
        title,
        category: "Lose weight",
        description,
        start_date: startDate,
        end_date: endDate,
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
                <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M12 7V12L15.5 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            }
            visualTitle="Set the weight target first"
            visualBody="The workflow starts by defining your current stats, target weight, time horizon, and BMI guidance so the commitment begins with a measurable destination."
            visualImageSrc="/images/progress-consistency-character.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="flex flex-col gap-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextQuestion
                    label="Current weight"
                    value={target.currentWeight}
                    onChange={(value) =>
                      setTarget((current) => ({ ...current, currentWeight: value }))
                    }
                    placeholder="Enter current weight"
                    type="number"
                  />
                  <SegmentedChoice
                    label="Weight unit"
                    value={target.weightUnit}
                    options={["kg", "pounds"] as const}
                    onChange={(value) =>
                      setTarget((current) => ({ ...current, weightUnit: value }))
                    }
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <TextQuestion
                    label="Current height"
                    value={target.currentHeight}
                    onChange={(value) =>
                      setTarget((current) => ({ ...current, currentHeight: value }))
                    }
                    placeholder="Enter current height"
                    type="number"
                  />
                  <SegmentedChoice
                    label="Height unit"
                    value={target.heightUnit}
                    options={["m", "cm"] as const}
                    onChange={(value) =>
                      setTarget((current) => ({ ...current, heightUnit: value }))
                    }
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <TextQuestion
                    label="Target weight"
                    value={target.targetWeight}
                    onChange={(value) =>
                      setTarget((current) => ({ ...current, targetWeight: value }))
                    }
                    placeholder="Enter target weight"
                    type="number"
                  />
                  <SegmentedChoice
                    label="Target unit"
                    value={target.targetWeightUnit}
                    options={["kg", "pounds"] as const}
                    onChange={(value) =>
                      setTarget((current) => ({
                        ...current,
                        targetWeightUnit: value,
                      }))
                    }
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <TextQuestion
                    label="Timeframe"
                    value={target.timeframeValue}
                    onChange={(value) =>
                      setTarget((current) => ({ ...current, timeframeValue: value }))
                    }
                    placeholder="Enter number"
                    type="number"
                  />
                  <SegmentedChoice
                    label="Time unit"
                    value={target.timeframeUnit}
                    options={["days", "weeks"] as const}
                    onChange={(value) =>
                      setTarget((current) => ({ ...current, timeframeUnit: value }))
                    }
                  />
                </div>

                <SelectQuestion
                  label="This commitment starts"
                  value={target.starts}
                  onChange={(value) =>
                    setTarget((current) => ({ ...current, starts: value }))
                  }
                  options={["Today"]}
                />
              </div>

              <BmiCard
                currentWeight={target.currentWeight}
                weightUnit={target.weightUnit}
                currentHeight={target.currentHeight}
                heightUnit={target.heightUnit}
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
            visualTitle="Connect the goal to a reason"
            visualBody="This step locks in the personal reason, life impact, motivation source, and emotional payoff behind your weight-loss commitment."
            visualImageSrc="/images/milestones-character.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="What is your primary reason for wanting to lose weight?"
                value={why.primaryReason}
                onChange={(value) =>
                  setWhy((current) => ({ ...current, primaryReason: value }))
                }
                options={PRIMARY_REASON_OPTIONS}
                placeholder="Choose one or enter your reason"
              />
              <SelectQuestion
                label="How do you want losing weight to impact your life?"
                value={why.lifeImpact}
                onChange={(value) =>
                  setWhy((current) => ({ ...current, lifeImpact: value }))
                }
                options={LIFE_IMPACT_OPTIONS}
              />
              <SelectQuestion
                label="Who or what motivates you the most on this journey?"
                value={why.motivation}
                onChange={(value) =>
                  setWhy((current) => ({ ...current, motivation: value }))
                }
                options={MOTIVATION_OPTIONS}
                placeholder="Choose one or enter your reason"
              />
              <SelectQuestion
                label="How would achieving your weight loss goal make you feel?"
                value={why.successFeeling}
                onChange={(value) =>
                  setWhy((current) => ({ ...current, successFeeling: value }))
                }
                options={SUCCESS_FEELING_OPTIONS}
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
            visualTitle="Name the blockers"
            visualBody="This step matches the exported workflow’s challenge cards so the commitment reflects the real patterns that could derail progress."
            visualImageSrc="/images/goal-exercise.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <ChipGrid
              label="Select one or more"
              value={challenges.challenges}
              options={CHALLENGE_OPTIONS}
              onChange={(value) =>
                setChallenges({
                  challenges: Array.isArray(value) ? value : [value],
                })
              }
              multiSelect
            />
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
            visualTitle="Define the accountability system"
            visualBody="This step mirrors the workflow’s accountability choices: how support shows up, how often check-ins happen, and what type of accountability keeps you moving."
            visualImageSrc="/images/progress-consistency-character.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6">
              <SelectQuestion
                label="How would you like to stay accountable during your weight loss journey?"
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
                label="How often would you like accountability check-ins?"
                value={accountability.checkInFrequency}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    checkInFrequency: value,
                  }))
                }
                options={CHECK_IN_OPTIONS}
              />
              <SelectQuestion
                label="Which type of accountability motivates you the most?"
                value={accountability.motivationType}
                onChange={(value) =>
                  setAccountability((current) => ({
                    ...current,
                    motivationType: value,
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
            visualTitle="Make the result emotionally vivid"
            visualBody="This step captures how success should feel, what you’ll do first, and the life area that benefits most when the goal is achieved."
            visualImageSrc="/images/behavioural-solution.png"
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-8">
              <ChipGrid
                label="How do you want to feel when you reach your weight goal?"
                value={visualization.desiredFeeling}
                options={DESIRED_FEELING_OPTIONS}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    desiredFeeling: Array.isArray(value) ? value[0] ?? "" : value,
                  }))
                }
              />
              <ChipGrid
                label="What’s the first thing you would do when you achieve your goal?"
                value={visualization.firstReward}
                options={FIRST_REWARD_OPTIONS}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    firstReward: Array.isArray(value) ? value[0] ?? "" : value,
                  }))
                }
              />
              <ChipGrid
                label="Which area of your life will benefit most from losing weight?"
                value={visualization.biggestBenefitArea}
                options={BIGGEST_BENEFIT_OPTIONS}
                onChange={(value) =>
                  setVisualization((current) => ({
                    ...current,
                    biggestBenefitArea: Array.isArray(value) ? value[0] ?? "" : value,
                  }))
                }
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
