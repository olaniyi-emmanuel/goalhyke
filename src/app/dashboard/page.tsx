"use client";

import React, { useEffect, useMemo, useState } from "react";
import NavigationRegistered from "@/components/NavigationRegistered";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import Footer from "@/components/Footer";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Goal {
  id: string;
  title: string;
  category: string;
  start_date: string;
  end_date: string;
  description?: string;
  status: "active" | "completed" | "failed";
  progress: number;
  streak: number;
}

const fallbackGoals: Goal[] = [
  {
    id: "goal-1",
    title: "Morning Meditation",
    category: "Strengthen your spirit",
    start_date: "2026-02-01",
    end_date: "2026-05-01",
    description: "Start each day with 15 minutes of quiet reflection.",
    status: "active",
    progress: 82,
    streak: 12,
  },
  {
    id: "goal-2",
    title: "Read 20 Pages",
    category: "Read more",
    start_date: "2026-02-04",
    end_date: "2026-04-30",
    description: "Build a stronger reading rhythm each day.",
    status: "active",
    progress: 48,
    streak: 8,
  },
  {
    id: "goal-3",
    title: "Workout Session",
    category: "Exercise regularly",
    start_date: "2026-02-03",
    end_date: "2026-06-12",
    description: "Stay active with a consistent workout schedule.",
    status: "active",
    progress: 34,
    streak: 3,
  },
  {
    id: "goal-4",
    title: "Save Weekly",
    category: "Grow wealth",
    start_date: "2026-01-10",
    end_date: "2026-03-20",
    description: "Automate weekly savings and stay accountable.",
    status: "completed",
    progress: 100,
    streak: 16,
  },
];

const trendLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function FireIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.2179 5C24.6881 11.1639 18.2974 13.7518 20.3183 18.6513C21.4216 21.3244 24.1404 21.7083 25.7481 20.6504C27.2738 19.6467 28.0913 17.7847 27.7806 15.7486C33.1226 19.8596 34.968 25.1942 33.5481 29.5942C32.194 33.7906 28.0581 36.6667 23.6232 36.6667C18.0399 36.6667 13.699 33.4337 12.3795 28.2442C10.8537 22.251 14.2279 16.5931 18.3276 13.5494C18.2298 16.9242 20.9674 18.2069 22.6243 17.2055C24.8525 15.8584 25.4488 10.8781 23.2179 5Z" fill="#FFD166" />
      <path d="M20.965 21.7692C22.7358 23.1319 24.3149 25.2936 23.6372 27.9271C23.1694 29.7454 21.4403 31 19.6021 31C17.2871 31 15.4879 29.5893 14.9409 27.3151C14.3086 24.6873 15.8425 22.3048 17.7791 20.9231C17.8444 22.3747 19.1113 22.9097 19.868 22.4874C20.4193 22.1797 20.8022 21.9952 20.965 21.7692Z" fill="#F97316" />
    </svg>
  );
}

function CheckBadgeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="#EEF2FF" />
      <path d="M7 12.5L10.5 16L17 9" stroke="#7655fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default function Dashboard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setGoals(fallbackGoals);
          return;
        }

        const { data, error } = await supabase
          .from("goals")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (!data || data.length === 0) {
          setGoals(fallbackGoals);
          return;
        }

        setGoals(
          data.map((goal: any) => ({
            id: goal.id,
            title: goal.title,
            category: goal.category,
            start_date: goal.start_date,
            end_date: goal.end_date,
            description: goal.description,
            status: goal.status,
            progress: goal.progress ?? 0,
            streak: goal.streak ?? 0,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch dashboard goals, using fallback data.", error);
        setGoals(fallbackGoals);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  const activeGoals = goals.filter((goal) => goal.status !== "completed");
  const completedGoals = goals.filter((goal) => goal.status === "completed");

  const streakDays = useMemo(
    () => Math.max(...goals.map((goal) => goal.streak), 0),
    [goals]
  );

  const completionRate = useMemo(() => {
    if (goals.length === 0) {
      return 0;
    }

    const totalProgress = goals.reduce((sum, goal) => sum + goal.progress, 0);
    return Math.round(totalProgress / goals.length);
  }, [goals]);

  const weeklyTrend = useMemo(() => {
    const base = completionRate || 42;
    return trendLabels.map((label, index) => ({
      label,
      value: Math.max(
        18,
        Math.min(
          95,
          Math.round(
            base * 0.45 +
              (index % 2 === 0 ? 10 : 20) +
              activeGoals.length * 4 -
              index * 2
          )
        )
      ),
    }));
  }, [completionRate, activeGoals.length]);

  const featuredHabits = activeGoals.slice(0, 3);
  const focusCategory = featuredHabits[0]?.category ?? "No active focus";

  const longestStreakLabel =
    streakDays > 0 ? `${streakDays} Days` : "Start today";
  const consistencyChange = completionRate >= 50 ? "+24%" : "+12%";

  return (
    <main className="min-h-screen bg-white">
      <NavigationRegistered />

      <div className="mx-auto flex max-w-[1280px] min-h-[calc(100vh-110px)]">
        <Sidebar />

        <div className="flex-1 bg-[#f4f6fb]">
          <DashboardHeader />

          <div className="px-8 pb-12 pt-0">
            <div className="mb-6 flex flex-col gap-2">
              <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#7655fb]">
                Goal Dashboard
              </p>
              <h1 className="text-[32px] font-bold text-[#262525]">
                Build better habits with GoalHyke
              </h1>
              <p className="max-w-[720px] text-[15px] text-[#6f6f78]">
                A GoalHyke-styled habit dashboard inspired by the reference
                layout, with your streak, today&apos;s habits, and weekly
                consistency front and center.
              </p>
            </div>

            {loading ? (
              <div className="rounded-[28px] border border-white/70 bg-white p-12 shadow-[0_20px_60px_rgba(24,33,77,0.08)]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#7655fb] border-t-transparent" />
                  <p className="text-[15px] font-medium text-[#6f6f78]">
                    Loading your dashboard...
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
                <section className="flex flex-col gap-6">
                  <div className="rounded-[30px] border border-white/60 bg-white p-6 shadow-[0_24px_70px_rgba(24,33,77,0.08)]">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-semibold text-[#8b8a96]">
                          {formatToday()}
                        </p>
                        <h2 className="mt-1 text-[26px] font-bold text-[#262525]">
                          Your momentum
                        </h2>
                      </div>
                      <div className="rounded-full bg-[#eef2ff] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#4169e1]">
                        Current Streak
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-[24px] bg-gradient-to-br from-[#4169e1] via-[#5c61f2] to-[#7655fb] p-6 text-white shadow-[0_18px_36px_rgba(118,85,251,0.28)]">
                      <div>
                        <p className="text-[46px] font-black leading-none">
                          {streakDays || 12}
                        </p>
                        <p className="mt-1 text-[18px] font-semibold">days</p>
                        <p className="mt-3 max-w-[220px] text-[14px] text-white/85">
                          You&apos;re staying consistent. Keep going to beat your
                          personal best this week.
                        </p>
                      </div>
                      <div className="rounded-[22px] bg-white/12 p-3 backdrop-blur-sm">
                        <FireIcon />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[30px] border border-white/60 bg-white p-6 shadow-[0_24px_70px_rgba(24,33,77,0.08)]">
                    <div className="mb-5 flex items-center justify-between">
                      <h3 className="text-[24px] font-bold text-[#262525]">
                        Today&apos;s Habits
                      </h3>
                      <Link
                        href="/goals"
                        className="text-[13px] font-bold text-[#7655fb] hover:text-[#6445e0]"
                      >
                        View all
                      </Link>
                    </div>

                    <div className="flex flex-col gap-4">
                      {featuredHabits.length > 0 ? (
                        featuredHabits.map((goal, index) => (
                          <div
                            key={goal.id}
                            className="rounded-[22px] border border-[#ececf2] bg-[#fcfcff] p-4 shadow-[0_10px_24px_rgba(24,33,77,0.05)]"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-12 w-12 items-center justify-center rounded-[16px] ${
                                  index === 0
                                    ? "bg-gradient-to-br from-[#4169e1] to-[#7655fb]"
                                    : "bg-[#eef2ff]"
                                }`}
                              >
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M7 12.5L10.5 16L17 8.5"
                                    stroke={index === 0 ? "#ffffff" : "#7655fb"}
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <h4 className="truncate text-[16px] font-bold text-[#262525]">
                                    {goal.title}
                                  </h4>
                                  <span className="text-[12px] font-bold text-[#7655fb]">
                                    {goal.progress}%
                                  </span>
                                </div>
                                <div className="mt-2 h-2 rounded-full bg-[#ececf7]">
                                  <div
                                    className="h-2 rounded-full bg-gradient-to-r from-[#4169e1] to-[#7655fb]"
                                    style={{ width: `${Math.max(goal.progress, 10)}%` }}
                                  />
                                </div>
                                <div className="mt-2 flex items-center justify-between text-[11px] text-[#8f8e98]">
                                  <span>{goal.category}</span>
                                  <span>{goal.streak || index + 1}/14 days</span>
                                </div>
                              </div>

                              <div className="shrink-0">
                                <CheckBadgeIcon />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[22px] border border-dashed border-[#d9def4] bg-[#fbfbff] p-8 text-center text-[14px] text-[#7b7a86]">
                          No active habits yet. Create one to start your GoalHyke
                          streak.
                        </div>
                      )}
                    </div>

                    <Link
                      href="/set-goal"
                      className="mt-5 flex h-[68px] items-center justify-center rounded-[22px] border border-dashed border-[#cfd7ff] bg-[#fbfbff] text-[15px] font-bold text-[#5d5c66] transition-colors hover:border-[#7655fb] hover:text-[#7655fb]"
                    >
                      New Habit
                    </Link>
                  </div>
                </section>

                <section className="flex flex-col gap-6">
                  <div className="rounded-[30px] border border-white/60 bg-white p-6 shadow-[0_24px_70px_rgba(24,33,77,0.08)]">
                    <div className="rounded-[24px] bg-gradient-to-br from-[#7655fb] to-[#4169e1] p-6 text-white shadow-[0_18px_36px_rgba(118,85,251,0.24)]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[48px] font-black leading-none">
                            {completionRate}%
                          </p>
                          <p className="mt-1 text-[18px] font-semibold">
                            Completion
                          </p>
                        </div>
                        <div className="rounded-[18px] bg-white/12 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/90">
                          This Week
                        </div>
                      </div>
                      <p className="mt-4 max-w-[250px] text-[14px] text-white/85">
                        You&apos;ve completed {completionRate}% of your habits
                        this week. Keep the GoalHyke momentum going.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[30px] border border-white/60 bg-white p-6 shadow-[0_24px_70px_rgba(24,33,77,0.08)]">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-[24px] font-bold text-[#262525]">
                        Weekly Trend
                      </h3>
                      <div className="rounded-full bg-[#f2f4ff] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#7655fb]">
                        This Week
                      </div>
                    </div>

                    <div className="grid grid-cols-7 items-end gap-3">
                      {weeklyTrend.map((bar) => (
                        <div
                          key={bar.label}
                          className="flex flex-col items-center gap-2"
                        >
                          <div className="flex h-[150px] items-end">
                            <div className="h-full w-10 rounded-full bg-[#f3ecf0] p-[4px]">
                              <div
                                className="w-full rounded-full bg-gradient-to-t from-[#7655fb] to-[#4169e1]"
                                style={{ height: `${bar.value}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-[11px] font-bold uppercase text-[#8e8d97]">
                            {bar.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[24px] border border-white/60 bg-white p-5 shadow-[0_18px_44px_rgba(24,33,77,0.08)]">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#eef2ff]">
                        <FireIcon />
                      </div>
                      <p className="text-[32px] font-black leading-none text-[#262525]">
                        {longestStreakLabel}
                      </p>
                      <p className="mt-2 text-[13px] text-[#7c7b85]">
                        Longest streak
                      </p>
                    </div>

                    <div className="rounded-[24px] border border-white/60 bg-white p-5 shadow-[0_18px_44px_rgba(24,33,77,0.08)]">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#eef2ff]">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 3V21M3 12H21" stroke="#7655fb" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>
                      <p className="text-[32px] font-black leading-none text-[#262525]">
                        {consistencyChange}
                      </p>
                      <p className="mt-2 text-[13px] text-[#7c7b85]">
                        Consistency
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[30px] border border-white/60 bg-white p-6 shadow-[0_24px_70px_rgba(24,33,77,0.08)]">
                    <h3 className="text-[22px] font-bold text-[#262525]">
                      Quick Snapshot
                    </h3>
                    <div className="mt-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between rounded-[18px] bg-[#fbfbff] px-4 py-3">
                        <span className="text-[14px] text-[#6f6f78]">
                          Active goals
                        </span>
                        <span className="text-[18px] font-bold text-[#262525]">
                          {activeGoals.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-[18px] bg-[#fbfbff] px-4 py-3">
                        <span className="text-[14px] text-[#6f6f78]">
                          Completed goals
                        </span>
                        <span className="text-[18px] font-bold text-[#262525]">
                          {completedGoals.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-[18px] bg-[#fbfbff] px-4 py-3">
                        <span className="text-[14px] text-[#6f6f78]">
                          Focus category
                        </span>
                        <span className="text-[18px] font-bold text-[#262525]">
                          {focusCategory}
                        </span>
                      </div>
                    </div>
                    <Link
                      href="/goals"
                      className="mt-5 inline-flex items-center gap-2 text-[14px] font-bold text-[#7655fb] hover:text-[#6445e0]"
                    >
                      <span>Open full goals list</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
