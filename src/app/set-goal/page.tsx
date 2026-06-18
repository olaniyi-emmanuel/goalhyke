"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import NavigationRegistered from "@/components/NavigationRegistered";
import Sidebar from "@/components/Sidebar";
import GoalCreationForm from "@/components/GoalCreationForm";
import GoalTargetForm, {
  type ExerciseTargetFormData,
} from "@/components/GoalTargetForm";
import GoalChallengesForm from "@/components/GoalChallengesForm";
import GoalRefereeForm, {
  type ExerciseRefereeFormData,
} from "@/components/GoalRefereeForm";
import GoalSupportersForm, {
  type ExerciseSupportersFormData,
} from "@/components/GoalSupportersForm";
import ExcelAcademicallyWorkflow from "@/components/ExcelAcademicallyWorkflow";
import GrowWealthWorkflow from "@/components/GrowWealthWorkflow";
import LevelUpCareerWorkflow from "@/components/LevelUpCareerWorkflow";
import LoseWeightWorkflow from "@/components/LoseWeightWorkflow";
import ReadMoreWorkflow from "@/components/ReadMoreWorkflow";
import StayHealthyWorkflow from "@/components/StayHealthyWorkflow";
import StrengthenSpiritWorkflow from "@/components/StrengthenSpiritWorkflow";
import Footer from "@/components/Footer";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface GoalTemplate {
  title: string;
  imageSrc: string;
  category: string;
}

const DEFAULT_EXERCISE_TARGET: ExerciseTargetFormData = {
  daysPerWeek: "3 days",
  sessionDuration: "15 minutes",
  exerciseType: "Cardio",
  startDate: "Today",
  reportingDay: "Tuesday",
};

const DEFAULT_EXERCISE_REFEREE: ExerciseRefereeFormData = {
  refereeType: "Individual referee",
  refereeContact: "",
  selfManaged: false,
};

const DEFAULT_EXERCISE_SUPPORTERS: ExerciseSupportersFormData = {
  autoAccept: false,
  supporters: "",
};

const REQUIRED_COMMIT_TOKENS = 50;

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

export default function SetGoal() {
  const router = useRouter();
  const [view, setView] = useState<"select" | "form">("select");
  const [targetMode, setTargetMode] = useState<"custom" | "featured">(
    "featured",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [exerciseTarget, setExerciseTarget] = useState<ExerciseTargetFormData>(
    DEFAULT_EXERCISE_TARGET,
  );
  const [exerciseChallenges, setExerciseChallenges] = useState<string[]>([]);
  const [exerciseReferee, setExerciseReferee] =
    useState<ExerciseRefereeFormData>(DEFAULT_EXERCISE_REFEREE);
  const [exerciseSupporters, setExerciseSupporters] =
    useState<ExerciseSupportersFormData>(DEFAULT_EXERCISE_SUPPORTERS);
  const [isSavingExerciseGoal, setIsSavingExerciseGoal] = useState(false);
  const [showExerciseCommitConfirm, setShowExerciseCommitConfirm] =
    useState(false);
  const [showExerciseInsufficientTokens, setShowExerciseInsufficientTokens] =
    useState(false);
  const [showExerciseGoalCreated, setShowExerciseGoalCreated] = useState(false);
  const [exerciseGoalError, setExerciseGoalError] = useState<string | null>(
    null,
  );

  const templates: GoalTemplate[] = [
    {
      title: "Lose weight",
      imageSrc: "/images/goal-weight.png",
      category: "Lose weight",
    },
    {
      title: "Exercise regularly",
      imageSrc: "/images/goal-exercise.png",
      category: "Exercise regularly",
    },
    {
      title: "Grow wealth",
      imageSrc: "/images/goal-wealth.png",
      category: "Grow wealth",
    },
    {
      title: "Strengthen your spirit",
      imageSrc: "/images/behavioural-solution.png",
      category: "Strengthen your spirit",
    },
    {
      title: "Level up your career",
      imageSrc: "/images/milestones-character.png",
      category: "Level up your career",
    },
    {
      title: "Excel academically",
      imageSrc: "/images/progress-consistency-character.png",
      category: "Excel academically",
    },
    {
      title: "Master tech skill",
      imageSrc: "/images/behavioural-solution.png",
      category: "Master tech skill",
    },
    {
      title: "Read more",
      imageSrc: "/images/goal-exercise.png",
      category: "Read more",
    },
    {
      title: "Stay healthy",
      imageSrc: "/images/goal-exercise.png",
      category: "Stay healthy",
    },
  ];

  const filteredTemplates = templates.filter((template) =>
    template.title.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  const handleSelectTemplate = (category: string) => {
    if (
      category !== "Exercise regularly" &&
      category !== "Grow wealth" &&
      category !== "Level up your career" &&
      category !== "Lose weight" &&
      category !== "Stay healthy" &&
      category !== "Strengthen your spirit" &&
      category !== "Read more" &&
      category !== "Excel academically"
    ) {
      setSelectedCategory(category);
      setTargetMode("custom");
      setView("select");
      return;
    }

    setSelectedCategory(category);
    setStep(1);
    setExerciseTarget(DEFAULT_EXERCISE_TARGET);
    setExerciseChallenges([]);
    setExerciseReferee(DEFAULT_EXERCISE_REFEREE);
    setExerciseSupporters(DEFAULT_EXERCISE_SUPPORTERS);
    setExerciseGoalError(null);
    setShowExerciseCommitConfirm(false);
    setShowExerciseInsufficientTokens(false);
    setShowExerciseGoalCreated(false);
    setView("form");
  };

  const handleBackToFeatured = () => {
    setSelectedCategory("");
    setTargetMode("featured");
    setView("select");
  };

  const handleGoToDashboard = () => {
    setShowExerciseGoalCreated(false);
    router.push("/dashboard");
  };

  const handleGoToGetToken = () => {
    setShowExerciseInsufficientTokens(false);
    router.push("/get-token");
  };

  const handleOpenExerciseCommitConfirm = () => {
    setExerciseGoalError(null);
    setShowExerciseInsufficientTokens(false);
    setShowExerciseCommitConfirm(true);
  };

  const handleExerciseGoalSubmit = async () => {
    setIsSavingExerciseGoal(true);
    setExerciseGoalError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setExerciseGoalError("You must be logged in to create a goal.");
        return;
      }

      if (
        !exerciseReferee.selfManaged &&
        exerciseReferee.refereeContact.trim().length === 0
      ) {
        setExerciseGoalError(
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

      if (tokenBalance < REQUIRED_COMMIT_TOKENS) {
        setShowExerciseCommitConfirm(false);
        setShowExerciseInsufficientTokens(true);
        return;
      }

      const startDate = resolveStartDate(exerciseTarget.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 84);

      const description = [
        `Exercise ${exerciseTarget.daysPerWeek}.`,
        `Each session lasts ${exerciseTarget.sessionDuration}.`,
        `Focus area: ${exerciseTarget.exerciseType}.`,
        `Reporting day: ${exerciseTarget.reportingDay}.`,
        exerciseChallenges.length > 0
          ? `Challenges: ${exerciseChallenges.join(", ")}.`
          : null,
        exerciseReferee.selfManaged
          ? "Referee preference: self-managed accountability."
          : `Referee type: ${exerciseReferee.refereeType}. Referee contact: ${exerciseReferee.refereeContact}.`,
        exerciseSupporters.autoAccept
          ? "Supporters setting: auto-accept supporters enabled."
          : null,
        exerciseSupporters.supporters.trim().length > 0
          ? `Invited supporters: ${exerciseSupporters.supporters
              .split(/\r?\n/)
              .map((entry) => entry.trim())
              .filter(Boolean)
              .join(", ")}.`
          : null,
      ]
        .filter(Boolean)
        .join(" ");

      if (!exerciseReferee.selfManaged) {
        localStorage.setItem(
          "goalhyke_referee",
          JSON.stringify({
            name: exerciseReferee.refereeContact,
            email: exerciseReferee.refereeContact,
            avatar: "/images/nav-avatar.png",
          }),
        );
      }

      const { error } = await supabase.from("goals").insert({
        user_id: user.id,
        title: selectedCategory,
        category: selectedCategory,
        description,
        start_date: formatDateForInput(startDate),
        end_date: formatDateForInput(endDate),
      });

      if (error) {
        throw error;
      }

      setShowExerciseCommitConfirm(false);
      setShowExerciseGoalCreated(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save this goal.";
      setExerciseGoalError(message);
    } finally {
      setIsSavingExerciseGoal(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <NavigationRegistered />

      <div className="flex max-w-[1280px] mx-auto min-h-[calc(100vh-110px)]">
        <Sidebar />

        <div className="flex-1 bg-[#f4f6fb] flex flex-col">
          <div className="flex-1 px-4 pb-12 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1120px] pt-6 sm:pt-8">
              {view === "select" ? (
                <div className="flex flex-col gap-8">
                  <div className="flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={
                        targetMode === "custom"
                          ? handleBackToFeatured
                          : () => router.back()
                      }
                      className="flex h-11 w-11 items-center justify-center rounded-full text-[#262525] transition-colors hover:bg-white"
                      aria-label="Go back"
                    >
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15 18L9 12L15 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    <label className="relative block w-full max-w-[240px] sm:max-w-[280px]">
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search targets..."
                        className="w-full rounded-full border border-[#e4e8f2] bg-[#fbfbff] px-4 py-2.5 pr-10 text-[13px] text-[#262525] outline-none transition-[border,box-shadow] focus:border-[#7655fb] focus:shadow-[0_0_0_4px_rgba(118,85,251,0.10)]"
                      />
                      <svg
                        className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b0b0b0]"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M21 21L16.65 16.65M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </label>
                  </div>

                  <div className="flex justify-center">
                    <div className="flex bg-[#eef2ff] p-1 rounded-full w-fit shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetMode("featured");
                          setSelectedCategory("");
                        }}
                        className={`rounded-full px-5 py-2 text-[13px] font-bold transition-all duration-300 cursor-pointer ${
                          targetMode === "featured"
                            ? "bg-gradient-to-r from-[#4169e1] to-[#7655fb] text-white shadow-sm"
                            : "text-[#7a7f90] hover:text-[#4f5b7f]"
                        }`}
                      >
                        Featured target
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetMode("custom");
                          setSelectedCategory("");
                        }}
                        className={`rounded-full px-5 py-2 text-[13px] font-bold transition-all duration-300 cursor-pointer ${
                          targetMode === "custom"
                            ? "bg-gradient-to-r from-[#4169e1] to-[#7655fb] text-white shadow-sm"
                            : "text-[#7a7f90] hover:text-[#4f5b7f]"
                        }`}
                      >
                        Custom target
                      </button>
                    </div>
                  </div>

                  {targetMode === "custom" ? (
                    <div className="gh-panel px-6 py-8 md:px-10 md:py-10 shadow-[0_24px_70px_rgba(24,33,77,0.08)]">
                      <GoalCreationForm
                        initialCategory={selectedCategory}
                        onCancel={handleBackToFeatured}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                        {filteredTemplates.map((tpl) => (
                          <div
                            key={tpl.category}
                            className="gh-panel-soft flex min-h-[250px] flex-col items-center justify-between p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#cfc7ff] hover:shadow-[0_16px_36px_rgba(118,85,251,0.1)]"
                          >
                            <div className="relative h-[103px] w-[103px] sm:h-[120px] sm:w-[120px]">
                              <Image
                                src={tpl.imageSrc}
                                alt={tpl.title}
                                fill
                                className="object-contain"
                              />
                            </div>

                            <h3 className="text-center text-[14px] font-bold text-[#262525] sm:text-[16px]">
                              {tpl.title}
                            </h3>

                            <button
                              type="button"
                              onClick={() => handleSelectTemplate(tpl.category)}
                              className="gh-btn-primary flex items-center justify-center gap-2 px-4 py-2 text-[12px] cursor-pointer"
                            >
                              <span>Start goal</span>
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 12 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M1 11L11 1M11 1H3M11 1V9"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>

                      {filteredTemplates.length === 0 && (
                        <div className="rounded-[22px] border border-dashed border-[#d9d6e9] bg-white px-6 py-12 text-center text-[14px] text-[#717070]">
                          No featured targets match your search.
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="gh-panel px-6 py-8 md:px-10 md:py-10 shadow-[0_24px_70px_rgba(24,33,77,0.08)]">
                  {selectedCategory === "Exercise regularly" ? (
                    <>
                      {exerciseGoalError && (
                        <div className="mb-6 w-full max-w-[900px] rounded-[10px] border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                          {exerciseGoalError}
                        </div>
                      )}
                      {step === 1 && (
                        <GoalTargetForm
                          goalTitle={selectedCategory}
                          value={exerciseTarget}
                          onChange={setExerciseTarget}
                          onCancel={handleBackToFeatured}
                          onNext={() => setStep(2)}
                        />
                      )}
                      {step === 2 && (
                        <GoalChallengesForm
                          goalTitle={selectedCategory}
                          value={exerciseChallenges}
                          onChange={setExerciseChallenges}
                          onCancel={handleBackToFeatured}
                          onNext={() => setStep(3)}
                        />
                      )}
                      {step === 3 && (
                        <GoalRefereeForm
                          goalTitle={selectedCategory}
                          value={exerciseReferee}
                          onChange={setExerciseReferee}
                          onCancel={handleBackToFeatured}
                          onBack={() => setStep(2)}
                          onNext={() => setStep(4)}
                        />
                      )}
                      {step === 4 && (
                        <GoalSupportersForm
                          goalTitle={selectedCategory}
                          value={exerciseSupporters}
                          onChange={setExerciseSupporters}
                          onCancel={handleBackToFeatured}
                          onBack={() => setStep(3)}
                          onSubmit={handleOpenExerciseCommitConfirm}
                          isSubmitting={isSavingExerciseGoal}
                          submitLabel="Next"
                        />
                      )}
                    </>
                  ) : selectedCategory === "Stay healthy" ? (
                    <StayHealthyWorkflow
                      goalTitle={selectedCategory}
                      onCancel={handleBackToFeatured}
                    />
                  ) : selectedCategory === "Grow wealth" ? (
                    <GrowWealthWorkflow
                      goalTitle={selectedCategory}
                      onCancel={handleBackToFeatured}
                    />
                  ) : selectedCategory === "Level up your career" ? (
                    <LevelUpCareerWorkflow
                      goalTitle={selectedCategory}
                      onCancel={handleBackToFeatured}
                    />
                  ) : selectedCategory === "Lose weight" ? (
                    <LoseWeightWorkflow
                      goalTitle={selectedCategory}
                      onCancel={handleBackToFeatured}
                    />
                  ) : selectedCategory === "Strengthen your spirit" ? (
                    <StrengthenSpiritWorkflow
                      goalTitle={selectedCategory}
                      onCancel={handleBackToFeatured}
                    />
                  ) : selectedCategory === "Read more" ? (
                    <ReadMoreWorkflow
                      goalTitle={selectedCategory}
                      onCancel={handleBackToFeatured}
                    />
                  ) : selectedCategory === "Excel academically" ? (
                    <ExcelAcademicallyWorkflow
                      goalTitle={selectedCategory}
                      onCancel={handleBackToFeatured}
                    />
                  ) : (
                    <GoalCreationForm
                      initialCategory={selectedCategory}
                      onCancel={handleBackToFeatured}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {showExerciseGoalCreated && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1b1a1a]/55 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-[820px] rounded-[28px] border border-white/80 bg-white/95 px-8 py-10 shadow-[0_32px_80px_rgba(24,33,77,0.16)] sm:px-14 sm:py-12">
            <button
              type="button"
              onClick={() => setShowExerciseGoalCreated(false)}
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
                className="gh-btn-primary mt-14 min-w-[185px] px-8 py-3 text-[18px] cursor-pointer"
              >
                Go To Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {showExerciseCommitConfirm && (
        <div className="fixed inset-0 z-[79] flex items-center justify-center bg-[#1b1a1a]/55 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-[820px] rounded-[28px] border border-white/80 bg-white/95 px-8 py-10 shadow-[0_32px_80px_rgba(24,33,77,0.16)] sm:px-14 sm:py-12">
            <button
              type="button"
              onClick={() => setShowExerciseCommitConfirm(false)}
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
              <p className="mt-10 text-[24px] font-bold leading-[1.6] text-[#262525] font-secondary sm:text-[28px]">
                You will be charged {REQUIRED_COMMIT_TOKENS} points if you fail to complete this goal
              </p>

              <div className="mt-16 flex flex-wrap items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={handleExerciseGoalSubmit}
                  disabled={isSavingExerciseGoal}
                  className="gh-btn-primary min-w-[150px] px-8 py-3 text-[18px] cursor-pointer disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
                >
                  {isSavingExerciseGoal ? "Saving..." : "Yes, commit"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowExerciseCommitConfirm(false)}
                  disabled={isSavingExerciseGoal}
                  className="flex min-w-[150px] items-center justify-center rounded-full border border-[#ff8b97] bg-white px-8 py-3 text-[18px] font-medium text-[#ff6f7d] transition-colors hover:bg-[#fff5f7] disabled:opacity-50 cursor-pointer"
                >
                  No, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExerciseInsufficientTokens && (
        <div className="fixed inset-0 z-[81] flex items-center justify-center bg-[#1b1a1a]/55 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-[820px] rounded-[28px] border border-white/80 bg-white/95 px-8 py-10 shadow-[0_32px_80px_rgba(24,33,77,0.16)] sm:px-14 sm:py-12">
            <button
              type="button"
              onClick={() => setShowExerciseInsufficientTokens(false)}
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
                  className="gh-btn-primary min-w-[150px] px-8 py-3 text-[18px] cursor-pointer"
                >
                  Get token
                </button>
                <button
                  type="button"
                  onClick={() => setShowExerciseInsufficientTokens(false)}
                  className="flex min-w-[150px] items-center justify-center rounded-full border border-[#ff8b97] bg-white px-8 py-3 text-[18px] font-medium text-[#ff6f7d] transition-colors hover:bg-[#fff5f7] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
