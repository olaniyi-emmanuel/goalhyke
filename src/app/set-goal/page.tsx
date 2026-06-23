"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import NavigationRegistered from "@/components/NavigationRegistered";
import Sidebar from "@/components/Sidebar";
import GoalCreationForm from "@/components/GoalCreationForm";
import ExcelAcademicallyWorkflow from "@/components/ExcelAcademicallyWorkflow";
import ExerciseRegularlyWorkflow from "@/components/ExerciseRegularlyWorkflow";
import GrowWealthWorkflow from "@/components/GrowWealthWorkflow";
import LevelUpCareerWorkflow from "@/components/LevelUpCareerWorkflow";
import LoseWeightWorkflow from "@/components/LoseWeightWorkflow";
import ReadMoreWorkflow from "@/components/ReadMoreWorkflow";
import StayHealthyWorkflow from "@/components/StayHealthyWorkflow";
import StrengthenSpiritWorkflow from "@/components/StrengthenSpiritWorkflow";
import Footer from "@/components/Footer";
import Image from "next/image";

interface GoalTemplate {
  title: string;
  imageSrc: string;
  category: string;
}

export default function SetGoal() {
  const router = useRouter();
  const [view, setView] = useState<"select" | "form">("select");
  const [targetMode, setTargetMode] = useState<"custom" | "featured">(
    "featured",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

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
    setView("form");
  };

  const handleBackToFeatured = () => {
    setSelectedCategory("");
    setTargetMode("featured");
    setView("select");
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
                    <ExerciseRegularlyWorkflow
                      goalTitle={selectedCategory}
                      onCancel={handleBackToFeatured}
                    />
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
    </main>
  );
}
