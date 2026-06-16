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
import RightSidebar from "@/components/RightSidebar";
import Footer from "@/components/Footer";
import Image from "next/image";

import SetGoalTitle from "@/components/SetGoalTitle";
import UserTestimonials from "@/components/UserTestimonials";
import OurHabitSolutions from "@/components/OurHabitSolutions";
import BehaviouralSolution from "@/components/BehaviouralSolution";
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
  const [step, setStep] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [exerciseTarget, setExerciseTarget] = useState<ExerciseTargetFormData>(
    DEFAULT_EXERCISE_TARGET,
  );
  const [exerciseChallenges, setExerciseChallenges] = useState<string[]>([]);
  const [isSavingExerciseGoal, setIsSavingExerciseGoal] = useState(false);
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

  const handleSelectTemplate = (category: string) => {
    setSelectedCategory(category);
    setStep(1);
    setExerciseTarget(DEFAULT_EXERCISE_TARGET);
    setExerciseChallenges([]);
    setExerciseGoalError(null);
    setView("form");
  };

  const handleCustomGoal = () => {
    setSelectedCategory("");
    setStep(1);
    setExerciseTarget(DEFAULT_EXERCISE_TARGET);
    setExerciseChallenges([]);
    setExerciseGoalError(null);
    setView("form");
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
      ]
        .filter(Boolean)
        .join(" ");

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

      router.push("/goals");
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
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 bg-[#f4f6fb] flex flex-col">
          {/* Header Row */}
          <div className="flex items-center justify-end w-full py-[27px] px-[50px] bg-[#f4f6fb]">
            {view === "select" && (
              <button
                onClick={handleCustomGoal}
                className="flex items-center justify-center gap-[8px] bg-[#7655fb] rounded-[5px] px-[16px] py-[8px] w-[176px] h-[50px] hover:bg-[#6445e0] transition-colors shadow-lg shadow-[#7655fb]/20 cursor-pointer"
              >
                <span className="text-white text-[19px] font-medium font-secondary whitespace-nowrap">
                  Create a goal
                </span>
                <div className="relative w-[14px] h-[14px]">
                  <Image
                    src="/images/create-goal-plus.svg"
                    alt="Plus"
                    fill
                    className="object-contain brightness-0 invert"
                  />
                </div>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 px-8 pb-12 flex flex-col gap-12">
            <div className="w-full bg-white rounded-[20px] p-8 flex flex-col items-center shadow-sm">
              {view === "select" ? (
                <div className="w-full flex flex-col items-center py-6">
                  {/* Select View Title */}
                  <div className="mb-12">
                    <SetGoalTitle />
                  </div>

                  {/* Template grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full max-w-[950px] justify-items-center">
                    {templates.map((tpl, index) => (
                      <div
                        key={index}
                        className="flex flex-col items-center justify-between bg-white rounded-[20px] p-6 border border-gray-100 w-full max-w-[280px] h-[310px] shadow-sm hover:shadow-md hover:border-[#7655fb]/20 transition-all group"
                      >
                        {/* Image */}
                        <div className="relative w-[120px] h-[120px] flex items-center justify-center bg-gray-50/50 rounded-full p-2 group-hover:scale-105 transition-transform duration-300">
                          <Image
                            src={tpl.imageSrc}
                            alt={tpl.title}
                            fill
                            className="object-contain"
                          />
                        </div>

                        {/* Title */}
                        <h3 className="text-[#262525] text-[15px] font-bold font-secondary text-center">
                          {tpl.title}
                        </h3>

                        {/* Action Button */}
                        <button
                          onClick={() => handleSelectTemplate(tpl.category)}
                          className="flex items-center justify-center gap-2 bg-[#7655fb] hover:bg-[#6445e0] text-white rounded-[25px] px-6 py-2 transition-colors cursor-pointer shadow-sm"
                        >
                          <span className="text-[12px] font-bold font-secondary">
                            Start goal
                          </span>
                          <svg
                            width="8"
                            height="8"
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M1 11L11 1M11 1H3M11 1V9"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center">
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
                          onCancel={() => setView("select")}
                          onNext={() => setStep(2)}
                        />
                      )}
                      {step === 2 && (
                        <GoalChallengesForm
                          goalTitle={selectedCategory}
                          value={exerciseChallenges}
                          onChange={setExerciseChallenges}
                          onCancel={() => setView("select")}
                          onNext={handleExerciseGoalSubmit}
                          isSubmitting={isSavingExerciseGoal}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      {/* Form View Title */}
                      <h1 className="text-[28px] md:text-[32px] font-bold text-center mt-4 mb-8 text-[#262525] font-secondary">
                        {selectedCategory
                          ? `Set Goal: ${selectedCategory}`
                          : "Set Your Custom Goal"}
                      </h1>

                      <GoalCreationForm
                        initialCategory={selectedCategory}
                        onCancel={() => setView("select")}
                      />
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Testimonials Section (Only visible in select view) */}
            {view === "select" && <UserTestimonials />}

            {/* Our Habit Solutions Section (Only visible in select view) */}
            {view === "select" && (
              <div className="flex flex-col gap-12 pb-12">
                <OurHabitSolutions />
                <BehaviouralSolution />
              </div>
            )}

            {/* Right Sidebar - Suggestions (Visible in form view) */}
            {view === "form" && selectedCategory !== "Exercise regularly" && (
              <RightSidebar />
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
