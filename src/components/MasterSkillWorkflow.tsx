"use client";

import React, { type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import GoalRefereeForm, {
  type ExerciseRefereeFormData,
} from "@/components/GoalRefereeForm";

interface MasterSkillWorkflowProps {
  goalTitle?: string;
  onCancel: () => void;
}

interface MasterSkillTargetData {
  skillFocus: string;
  customSkill: string;
  specificTarget: string;
  topicToLearn: string;
  timeframe: string;
  keyOutcome: string;
  targetIntensity: string;
  frequency: string;
  targetDeadline: string;
  stakedVolume: number;
}

const TOTAL_STEPS = 4;

const SKILL_FOCUS_OPTIONS = [
  {
    id: "public_speaking",
    title: "Public Speaking",
    iconSrc: "/images/behavioural-solution.png",
  },
  {
    id: "tech_skill",
    title: "Software / Tech Skill",
    iconSrc: "/images/milestones-character.png",
  },
  {
    id: "creative_design",
    title: "Creative Design",
    iconSrc: "/images/goal-tech-skill.png",
  },
  {
    id: "cooking",
    title: "Cooking",
    iconSrc: "/images/goal-stay-healthy.png",
  },
  {
    id: "playing_instrument",
    title: "Playing an instrument",
    iconSrc: "/images/goal-exercise.png",
  },
  {
    id: "writing_storytelling",
    title: "Writing / Storytelling",
    iconSrc: "/images/goal-read-more.png",
  },
];

const DEFAULT_TARGET: MasterSkillTargetData = {
  skillFocus: "Software / Tech Skill",
  customSkill: "",
  specificTarget: "",
  topicToLearn: "Frontend Development",
  timeframe: "3 months",
  keyOutcome: "Build 2 portfolio projects using Figma components",
  targetIntensity: "10 hrs per week",
  frequency: "Weekly/Monthly",
  targetDeadline: "3 months",
  stakedVolume: 50,
};

const DEFAULT_REFEREE: ExerciseRefereeFormData = {
  refereeType: "Individual referee",
  refereeContact: "",
  selfManaged: false,
};

function PrivacyNotice() {
  return (
    <p className="max-w-[720px] text-[14px] leading-6 text-[#5a6075] sm:text-[15px] font-secondary">
      Your privacy is important to us. You can{" "}
      <span className="font-medium text-[#7655fb] underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current cursor-pointer">
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

      <div className="mt-10 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f1edff] text-[#7655fb]">
          {icon}
        </div>
        <h2 className="text-[28px] font-bold text-[#262525] font-secondary">
          {title}
        </h2>
      </div>

      <div className="mt-6 w-full text-left px-4 lg:px-0">
        <h3 className="text-[30px] font-bold text-[#262525] font-secondary sm:text-[38px]">
          {goalTitle}
        </h3>
        <div className="mt-3">
          <PrivacyNotice />
        </div>
      </div>

      <div className="mt-8 w-full px-4 lg:px-0">
        <div className="gh-panel-soft p-6 sm:p-10">{children}</div>
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
          className="gh-btn-primary flex min-w-[170px] items-center justify-center gap-2 px-10 py-3 text-[18px] bg-[#7655fb] hover:bg-[#6442e4]"
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

export default function MasterSkillWorkflow({
  goalTitle = "Master A Skill",
  onCancel,
}: MasterSkillWorkflowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [target, setTarget] = useState<MasterSkillTargetData>(DEFAULT_TARGET);
  const [referee, setReferee] = useState<ExerciseRefereeFormData>(DEFAULT_REFEREE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCommitConfirm, setShowCommitConfirm] = useState(false);
  const [showGoalCreated, setShowGoalCreated] = useState(false);
  const [tokenCommitment, setTokenCommitment] = useState<number>(50);

  const handleNext = () => {
    setErrorMessage(null);
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      onCancel();
      return;
    }
    setStep(step - 1);
  };

  const handleOpenCommitConfirm = () => {
    setErrorMessage(null);
    setShowCommitConfirm(true);
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

      setShowCommitConfirm(false);
      setShowGoalCreated(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not save goal.",
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

        {/* Step 1: Define the Learning Goal */}
        {step === 1 && (
          <StepShell
            currentStep={1}
            title="Define the Learning Goal"
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
                <path d="M12 7V12L15.5 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            }
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-8">
              <div>
                <label className="text-[18px] font-bold text-[#262525] font-secondary mb-4 block">
                  What is the focus?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {SKILL_FOCUS_OPTIONS.map((item) => {
                    const isSelected = target.skillFocus === item.title;
                    return (
                      <div
                        key={item.id}
                        onClick={() =>
                          setTarget((c) => ({ ...c, skillFocus: item.title }))
                        }
                        className={`group relative flex flex-col items-center justify-between rounded-[20px] border-2 bg-white p-5 text-center cursor-pointer transition-all duration-200 hover:shadow-lg ${
                          isSelected
                            ? "border-[#7655fb] ring-2 ring-[#7655fb]/20 shadow-md"
                            : "border-[#e5e9f2] hover:border-[#7655fb]/50"
                        }`}
                      >
                        <div className="absolute top-4 left-4 h-5 w-5 rounded border border-[#ccd2e2] flex items-center justify-center bg-white">
                          {isSelected && (
                            <div className="h-3 w-3 rounded-xs bg-[#7655fb]" />
                          )}
                        </div>
                        <p className="mt-4 text-[16px] font-bold text-[#262525] font-secondary">
                          {item.title}
                        </p>
                        <div className="relative mt-4 h-[100px] w-[100px] transition-transform group-hover:scale-105">
                          <Image
                            src={item.iconSrc}
                            alt={item.title}
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Other (Custom input)"
                    value={target.customSkill}
                    onChange={(e) =>
                      setTarget((c) => ({ ...c, customSkill: e.target.value }))
                    }
                    className="h-[54px] w-full max-w-[500px] rounded-[16px] border border-[#ccd2e2] bg-white px-5 text-[15px] font-secondary outline-none focus:border-[#7655fb]"
                  />
                </div>
              </div>

              {/* Question: What is the specific target? */}
              <div className="flex flex-col gap-3">
                <label className="text-[18px] font-bold text-[#262525] font-secondary">
                  What is the specific target?
                </label>
                <textarea
                  value={target.specificTarget}
                  onChange={(e) =>
                    setTarget((c) => ({ ...c, specificTarget: e.target.value }))
                  }
                  placeholder="Complete 3 LeetCode problems, Build 2 portfolio projects using Figma components, Finish module 2 of Python course"
                  className="min-h-[110px] w-full max-w-[650px] rounded-[18px] border border-[#ccd2e2] bg-white px-5 py-4 text-[15px] text-[#262525] outline-none placeholder:text-[#9fa6bb] focus:border-[#7655fb]"
                />
              </div>

              {/* Additional questions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectQuestion
                  label="What topic do you want to learn?"
                  value={target.topicToLearn}
                  onChange={(val) =>
                    setTarget((c) => ({ ...c, topicToLearn: val }))
                  }
                  options={[
                    "Frontend Development",
                    "Backend & Databases",
                    "UI/UX Design",
                    "Data Science & AI",
                    "Mobile App Development",
                  ]}
                />
                <SelectQuestion
                  label="When do you want to achieve this goal?"
                  value={target.timeframe}
                  onChange={(val) => setTarget((c) => ({ ...c, timeframe: val }))}
                  options={["1 month", "3 months", "6 months", "1 year"]}
                />
                <SelectQuestion
                  label="Which key outcome will help track your progress?"
                  value={target.keyOutcome}
                  onChange={(val) => setTarget((c) => ({ ...c, keyOutcome: val }))}
                  options={[
                    "Build 2 portfolio projects",
                    "Complete a certified course",
                    "Pass a technical interview",
                    "Publish a case study",
                  ]}
                />
                <SelectQuestion
                  label="How will you measure your target intensity?"
                  value={target.targetIntensity}
                  onChange={(val) =>
                    setTarget((c) => ({ ...c, targetIntensity: val }))
                  }
                  options={[
                    "5 hrs per week",
                    "10 hrs per week",
                    "15+ hrs per week",
                    "Daily 1 hour session",
                  ]}
                />
              </div>
            </div>
          </StepShell>
        )}

        {/* Step 2: Set The Timeline */}
        {step === 2 && (
          <StepShell
            currentStep={2}
            title="Set The Timeline"
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
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleNext}
          >
            <div className="flex flex-col gap-6 max-w-[600px]">
              <SelectQuestion
                label="Frequency"
                value={target.frequency}
                onChange={(val) => setTarget((c) => ({ ...c, frequency: val }))}
                options={["Daily", "Weekly/Monthly", "One-time project deadline"]}
              />
              <SelectQuestion
                label="Target Deadline"
                value={target.targetDeadline}
                onChange={(val) =>
                  setTarget((c) => ({ ...c, targetDeadline: val }))
                }
                options={["1 month", "3 months", "6 months", "1 year", "Custom"]}
              />
            </div>
          </StepShell>
        )}

        {/* Step 3: Referee */}
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

        {/* Step 4: Lock In The Goal / Stake */}
        {step === 4 && (
          <StepShell
            currentStep={4}
            title="Lock In The Goal"
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
            onBack={handleBack}
            onCancel={onCancel}
            onNext={handleOpenCommitConfirm}
            nextLabel="Submit"
          >
            <div className="flex flex-col gap-6 py-2">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[18px] font-bold text-[#262525] font-secondary">
                    Set your token stake
                  </span>
                  <span className="rounded-full bg-[#7655fb]/10 px-3.5 py-1 text-sm font-bold text-[#7655fb]">
                    {tokenCommitment} Tokens
                  </span>
                </div>

                <div className="relative mt-4 flex items-center">
                  <input
                    type="range"
                    min="20"
                    max="200"
                    step="5"
                    value={tokenCommitment}
                    onChange={(e) => setTokenCommitment(Number(e.target.value))}
                    className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-[#e2e8f0] accent-[#7655fb]"
                  />
                </div>

                <div className="flex justify-between text-xs font-semibold text-gray-500 mt-1">
                  <span>20 Tokens</span>
                  <span>100 Tokens</span>
                  <span>200 Tokens</span>
                </div>
              </div>
            </div>
          </StepShell>
        )}
      </div>

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

      {/* Stake Confirmation Modal */}
      {showCommitConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1b1a1a]/60 px-4 backdrop-blur-xs">
          <div className="relative w-full max-w-[440px] rounded-[24px] bg-white p-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.2)]">
            <h3 className="text-[20px] font-bold text-[#262525] font-secondary leading-snug">
              You will be charged {tokenCommitment} Tokens if you miss your target goal
            </h3>
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="gh-btn-primary px-6 py-2.5 text-[15px] bg-[#7655fb]"
              >
                {isSaving ? "Saving..." : "Accept stake"}
              </button>
              <button
                type="button"
                onClick={() => setShowCommitConfirm(false)}
                disabled={isSaving}
                className="flex items-center justify-center rounded-full border border-[#ff8b97] bg-white px-6 py-2.5 text-[15px] font-medium text-[#ff6f7d] transition-colors hover:bg-[#fff5f7]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goal Created Modal */}
      {showGoalCreated && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1b1a1a]/50 px-4">
          <div className="relative w-full max-w-[500px] rounded-[24px] bg-white p-8 text-center shadow-[0_30px_60px_rgba(0,0,0,0.2)]">
            <h2 className="text-[24px] font-bold text-[#262525] font-secondary">
              Goal Created!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your skill learning commitment has been created successfully.
            </p>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="gh-btn-primary mt-6 w-full py-3 text-[16px] bg-[#7655fb]"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </>
  );
}
