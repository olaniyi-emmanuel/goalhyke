"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import NavigationRegistered from "@/components/NavigationRegistered";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

interface GoalDetail {
  id: string;
  title: string;
  category: string;
  description?: string;
  start_date: string;
  end_date: string;
  status?: string;
  progress?: number;
  streak?: number;
}

interface ReportEntry {
  id: string;
  periodLabel: string;
  status: "Successful" | "Not Successful";
  userReport: string;
}

type JournalTab = "posts" | "photos" | "reports";

const fallbackGoal: GoalDetail = {
  id: "mock-1",
  title: "Exercise Regularly",
  category: "Exercise regularly",
  description: "Exercise 1 day each week and report your progress consistently.",
  start_date: "2024-11-01",
  end_date: "2025-01-24",
  status: "active",
  progress: 12,
  streak: 1,
};

const fallbackReportEntries: ReportEntry[] = [
  {
    id: "report-1",
    periodLabel: "February 11 to February 18",
    status: "Not Successful",
    userReport: "No report submitted",
  },
  {
    id: "report-2",
    periodLabel: "February 4 to February 11",
    status: "Not Successful",
    userReport: "No report submitted",
  },
];

function formatLongDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatMonthLabel(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatShortMonthDay(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

function getWeekProgress(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalWeeks = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7)),
  );
  const elapsedWeeks = Math.max(
    1,
    Math.min(
      totalWeeks,
      Math.ceil(
        (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24 * 7) || 1,
      ),
    ),
  );

  return { totalWeeks, elapsedWeeks };
}

function buildCalendarDays(dateString: string) {
  const baseDate = new Date(dateString);
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekDay = firstDay.getDay();
  const days: Array<{ day: number; muted: boolean }> = [];

  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startWeekDay - 1; i >= 0; i -= 1) {
    days.push({ day: prevMonthLastDay - i, muted: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({ day, muted: false });
  }

  while (days.length < 35) {
    days.push({ day: days.length - (startWeekDay + daysInMonth) + 1, muted: true });
  }

  return days;
}

export default function GoalDashboardDetailPage() {
  const params = useParams<{ goalId: string }>();
  const goalId = Array.isArray(params?.goalId) ? params.goalId[0] : params?.goalId;

  const [goal, setGoal] = useState<GoalDetail>(fallbackGoal);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<JournalTab>("posts");
  const [journalEntry, setJournalEntry] = useState("");
  const [journalPosts, setJournalPosts] = useState<string[]>([]);
  const [refereeName, setRefereeName] = useState("Adesorotos...");
  const [reportSort, setReportSort] = useState<"newest" | "oldest">("newest");
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const savedReferee = localStorage.getItem("goalhyke_referee");
    if (savedReferee) {
      try {
        const parsed = JSON.parse(savedReferee);
        setRefereeName(parsed?.name || parsed?.email || "Adesorotos...");
      } catch {
        setRefereeName("Adesorotos...");
      }
    }
  }, []);

  useEffect(() => {
    const fetchGoal = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || !goalId) {
          setGoal(fallbackGoal);
          return;
        }

        const { data, error } = await supabase
          .from("goals")
          .select("*")
          .eq("id", goalId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (error || !data) {
          setGoal(fallbackGoal);
          return;
        }

        setGoal({
          id: data.id,
          title: data.title,
          category: data.category,
          description: data.description,
          start_date: data.start_date,
          end_date: data.end_date,
          status: data.status ?? "active",
          progress: data.progress ?? 12,
          streak: data.streak ?? 1,
        });
      } catch (error) {
        console.error("Failed to fetch goal detail.", error);
        setGoal(fallbackGoal);
      } finally {
        setLoading(false);
      }
    };

    fetchGoal();
  }, [goalId]);

  const { totalWeeks, elapsedWeeks } = useMemo(
    () => getWeekProgress(goal.start_date, goal.end_date),
    [goal.start_date, goal.end_date],
  );

  const calendarDays = useMemo(
    () => buildCalendarDays(goal.start_date),
    [goal.start_date],
  );

  const monthLabel = formatMonthLabel(goal.start_date);
  const nextReportDue = formatShortMonthDay(goal.start_date);
  const reportTime = "12:00 PM";
  const contractId = goal.id === fallbackGoal.id ? "122345" : goal.id.slice(0, 6);
  const contractLengthLabel = `${totalWeeks} ${totalWeeks === 1 ? "(week)" : "(weeks)"}`;
  const reportEntries = useMemo(() => {
    const entries = [...fallbackReportEntries];
    return reportSort === "newest" ? entries : entries.reverse();
  }, [reportSort]);
  const isReportsView = activeTab === "reports";
  const journalEmptyState: Record<JournalTab, string> = {
    posts: "No one has written in this commitment journal yet!",
    photos: "This Commitment has no photos.",
    reports: "This Commitment has no reports.",
  };

  const handlePostJournal = () => {
    const trimmed = journalEntry.trim();
    if (!trimmed) {
      return;
    }

    setJournalPosts((prev) => [trimmed, ...prev]);
    setJournalEntry("");
    setActiveTab("posts");
  };

  return (
    <main className="min-h-screen bg-white">
      <NavigationRegistered />

      <div className="gh-shell flex min-h-[calc(100vh-110px)]">
        <Sidebar />

        <div className="flex-1 bg-[#f4f6fb] flex flex-col">
          <DashboardHeader />

          <div className="flex-1 px-8 pb-12">
            {loading ? (
              <div className="gh-panel flex items-center gap-4 p-10">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#7655fb] border-t-transparent" />
                <p className="text-[15px] font-medium text-[#6f6f78]">
                  Loading goal dashboard...
                </p>
              </div>
            ) : (
              <div className="gh-panel p-6 md:p-8">
                <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_260px]">
                  <section className="min-w-0">
                    <div className="mb-8 flex items-center justify-between border-b border-[#eceff7] pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] text-gray-500 font-semibold font-secondary">Goal Status:</span>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${
                          goal.status === "completed" 
                            ? "bg-green-100 text-green-700" 
                            : goal.status === "failed"
                            ? "bg-red-100 text-red-600"
                            : "bg-[#eef2ff] text-[#7655fb]"
                        }`}>
                          {goal.status || "active"}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-[18px] border border-[#eceff7] bg-white p-5 shadow-[0_12px_30px_rgba(24,33,77,0.05)]">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <span className="rounded-full bg-[#f3ecff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7655fb]">
                            Featured
                          </span>
                          <h1 className="mt-3 text-[20px] font-bold text-[#262525]">
                            {goal.title}
                          </h1>
                          <p className="mt-1 text-[12px] text-[#7f7e87]">
                            Week {elapsedWeeks} of {totalWeeks}
                          </p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#cfc7ff] text-[#7655fb]">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M5 12H19M19 12L12 5M19 12L12 19"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {Array.from({ length: totalWeeks }).map((_, index) => (
                          <div
                            key={index}
                            className={`h-3 w-6 rounded-[4px] border ${
                              index === 0
                                ? "border-[#7655fb] bg-[#7655fb]"
                                : index < elapsedWeeks
                                  ? "border-[#b2b0bd] bg-[#f7f7fa]"
                                  : "border-[#b2b0bd] bg-white"
                            }`}
                          />
                        ))}
                      </div>

                      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_180px]">
                        <div>
                          <div className="grid gap-2 text-[12px] text-[#787783] sm:grid-cols-3">
                            <div>
                              <p className="font-medium text-[#262525]">Next report due:</p>
                              <p className="mt-1">{nextReportDue}</p>
                            </div>
                            <div>
                              <p className="font-medium text-[#262525]">Report time</p>
                              <p className="mt-1">{reportTime}</p>
                            </div>
                            <div>
                              <p className="font-medium text-[#262525]">Goal cycle</p>
                              <p className="mt-1">{formatLongDate(goal.end_date)}</p>
                            </div>
                          </div>

                          <div className="mt-6 grid gap-2 text-[13px] text-[#555463]">
                            <p>I commit to:</p>
                            <p>{goal.description || "Exercise 1 day each week"}</p>
                            <p>Successful Periods: 0</p>
                            <p>Unsuccessful Periods: 0</p>
                          </div>
                        </div>

                        <div className="rounded-[22px] border border-[#eceff7] bg-gradient-to-br from-white to-[#f4f6fb] p-5 text-[#4f5b7f] shadow-sm">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Last reported
                          </p>
                          <p className="text-[13px] font-medium text-gray-600 mt-1">No report submitted</p>
                          <div className="my-4 border-t border-gray-100" />
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Next report due</p>
                          <p className="mt-2 text-[26px] font-bold text-[#7655fb] tracking-tight leading-none">
                            {nextReportDue}
                          </p>
                          <p className="mt-4 text-[11px] text-gray-400 font-semibold">12:00 AM CAT</p>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-center">
                        <button
                          type="button"
                          onClick={() => setShowDetailsModal(true)}
                          className="gh-btn-secondary min-w-[140px] px-8 py-2.5 text-[14px]"
                        >
                          Details
                        </button>
                      </div>
                    </div>

                    <div className="mt-10 border-t border-[#d8dbe5] pt-8">
                      <div className="gh-panel-soft p-6">
                        <div className="mb-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2 text-[14px] font-bold text-[#262525]">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                  d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                              />
                            </svg>
                            <span>My Commitment Journal</span>
                          </div>
                          <button className="flex items-center gap-2 rounded-full border border-[#cfd7ff] bg-white text-[#7655fb] hover:bg-[#f7f8ff] transition-all px-4 py-2 text-[12px] font-bold cursor-pointer">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M4 7H20V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7Z"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <path
                                d="M9 11H15M12 8V14"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M9 3L7 7M15 3L17 7"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                            <span>Add Photos</span>
                          </button>
                        </div>

                        <div
                          className={`rounded-[18px] border border-[#e4e8f2] bg-white p-4 ${
                            isReportsView ? "xl:hidden" : ""
                          }`}
                        >
                          <textarea
                            value={journalEntry}
                            onChange={(event) => setJournalEntry(event.target.value)}
                            placeholder="How's the commitment going?"
                            className="min-h-[120px] w-full resize-none bg-transparent text-[14px] text-[#262525] outline-none placeholder:text-[#a0a0a8]"
                          />
                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={handlePostJournal}
                              className="gh-btn-primary min-w-[88px] px-6 py-2 text-[13px] cursor-pointer"
                            >
                              Post
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 pb-2">
                          <div className="flex items-center gap-8">
                            {(["posts", "photos", "reports"] as JournalTab[]).map((tab) => (
                              <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`border-b-2 pb-2 text-[12px] font-bold capitalize transition-colors cursor-pointer ${
                                  activeTab === tab
                                    ? "border-[#7655fb] text-[#7655fb]"
                                    : "border-transparent text-[#717070] hover:text-[#7655fb]/80"
                                }`}
                              >
                                {tab}
                              </button>
                            ))}
                          </div>

                          {isReportsView && (
                            <div className="flex items-center gap-2 rounded-full border border-[#e4e8f2] bg-[#fbfbff] px-4 py-2">
                              <span className="text-[12px] font-bold text-gray-500">
                                Sort by
                              </span>
                              <select
                                value={reportSort}
                                onChange={(event) =>
                                  setReportSort(
                                    event.target.value as "newest" | "oldest",
                                  )
                                }
                                className="bg-transparent text-[12px] font-bold text-[#7655fb] outline-none cursor-pointer"
                              >
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="py-10 text-center text-[14px] leading-7 text-[#717070]">
                          {activeTab === "posts" && journalPosts.length === 0 && (
                            <p>{journalEmptyState.posts}</p>
                          )}
                          {activeTab === "posts" && journalPosts.length > 0 && (
                            <div className="space-y-3 text-left">
                              {journalPosts.map((post, index) => (
                                <div
                                  key={`${post}-${index}`}
                                  className="rounded-[14px] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(24,33,77,0.06)]"
                                >
                                  {post}
                                </div>
                              ))}
                            </div>
                          )}
                          {activeTab !== "posts" && (
                            <>
                              {activeTab === "reports" && reportEntries.length > 0 ? (
                                <div className="space-y-8 text-left">
                                  <p className="text-right text-[13px] text-[#6f6f78]">
                                    Displaying 1-{reportEntries.length} of {reportEntries.length} results.
                                  </p>
                                  {reportEntries.map((entry) => (
                                    <div
                                      key={entry.id}
                                      className="grid gap-3 border-b border-[#eceff7] pb-6 last:border-b-0 last:pb-0 sm:grid-cols-[170px_minmax(0,1fr)]"
                                    >
                                      <div className="space-y-2 text-[14px] text-[#555151]">
                                        <p>Reporting period</p>
                                        <p>Period status:</p>
                                        <p>User report:</p>
                                      </div>
                                      <div className="space-y-2 text-[14px] text-[#555151] sm:text-right">
                                        <p>{entry.periodLabel}</p>
                                        <p
                                          className={
                                            entry.status === "Successful"
                                              ? "text-green-600"
                                              : "text-[#ff6f7d]"
                                          }
                                        >
                                          {entry.status}
                                        </p>
                                        <p>{entry.userReport}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p>{journalEmptyState[activeTab]}</p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  <aside className="hidden xl:flex flex-col gap-6">
                    <div className="gh-panel-soft p-5">
                      <div className="mb-4 flex items-center justify-between text-[#7655fb]">
                        <button className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7655fb] hover:bg-[#6445e0] transition-colors text-white cursor-pointer">
                          ‹
                        </button>
                        <div className="text-center">
                          <p className="text-[14px] font-bold text-[#262525]">
                            {monthLabel}
                          </p>
                          <p className="text-[11px] text-[#8c8b94]">
                            Wed 5:00 to 9:00 p.m.
                          </p>
                        </div>
                        <button className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7655fb] hover:bg-[#6445e0] transition-colors text-white cursor-pointer">
                          ›
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase text-[#9a99a3]">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                          <span key={day}>{day}</span>
                        ))}
                      </div>

                      <div className="mt-3 grid grid-cols-7 gap-y-3 text-center text-[12px] text-[#3f3e4a]">
                        {calendarDays.map((item, index) => (
                          <span
                            key={`${item.day}-${index}`}
                            className={item.muted ? "text-[#c8c7cf]" : ""}
                          >
                            {item.day}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="gh-panel-soft p-5 text-center">
                      <p className="text-[14px] font-bold text-[#7655fb]">
                        GoalHykeClip
                      </p>
                      <button className="gh-btn-primary mt-5 min-w-[120px] px-6 py-2.5 text-[13px] cursor-pointer">
                        Add a video!
                      </button>
                    </div>

                    <div className="gh-panel-soft p-5 text-center">
                      <p className="text-[22px] font-semibold text-[#4f4d4d]">
                        Referee
                      </p>
                      <div className="mt-6 flex items-center justify-center gap-3 text-[#6a6880]">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle
                            cx="12"
                            cy="7"
                            r="4"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                        </svg>
                        <span className="text-[14px] font-semibold text-[#7655fb]">
                          {refereeName}
                        </span>
                      </div>
                      <button className="gh-btn-primary mt-5 min-w-[110px] px-6 py-2.5 text-[13px] cursor-pointer">
                        Add
                      </button>
                    </div>

                    <div className="gh-panel-soft p-5 text-center">
                      <p className="text-[22px] font-semibold text-[#4f4d4d]">
                        Leaderboard
                      </p>
                      <div className="mt-6 flex justify-center text-[#f59e0b]">
                        <svg
                          width="26"
                          height="26"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M8 21H16M12 17V21M7 4H17V7C17 10.3137 14.3137 13 11 13H13C9.68629 13 7 10.3137 7 7V4Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M7 5H5C3.89543 5 3 5.89543 3 7V8C3 10.2091 4.79086 12 7 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M17 5H19C20.1046 5 21 5.89543 21 7V8C21 10.2091 19.2091 12 17 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <button className="gh-btn-primary mt-5 min-w-[110px] px-6 py-2.5 text-[13px] cursor-pointer">
                        View
                      </button>
                    </div>
                  </aside>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />

      {showDetailsModal && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-[#1b1a1a]/55 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-[440px] rounded-[28px] border border-white/80 bg-white/95 px-9 py-10 shadow-[0_32px_80px_rgba(24,33,77,0.16)] sm:px-10">
            <button
              type="button"
              onClick={() => setShowDetailsModal(false)}
              className="absolute right-6 top-5 flex h-10 w-10 items-center justify-center rounded-full text-[#262525] transition-colors hover:bg-[#f4f6fb]"
              aria-label="Close details dialog"
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

            <div className="text-center">
              <h2 className="text-[22px] font-bold text-[#262525] font-secondary">
                Details
              </h2>
            </div>

            <div className="mt-10 space-y-5">
              <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-4 text-[16px] leading-[1.5] text-[#262525]">
                <p className="font-semibold">Contract ID:</p>
                <p className="text-[#6f6f78]">{contractId}</p>
              </div>
              <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-4 text-[16px] leading-[1.5] text-[#262525]">
                <p className="font-semibold">Contract Start:</p>
                <p className="text-[#6f6f78]">{formatLongDate(goal.start_date)}</p>
              </div>
              <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-4 text-[16px] leading-[1.5] text-[#262525]">
                <p className="font-semibold">Contract End:</p>
                <p className="text-[#6f6f78]">{formatLongDate(goal.end_date)}</p>
              </div>
              <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-4 text-[16px] leading-[1.5] text-[#262525]">
                <p className="font-semibold">Contract Length:</p>
                <p className="text-[#6f6f78]">{contractLengthLabel}</p>
              </div>
              <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-4 text-[16px] leading-[1.5] text-[#262525]">
                <p className="font-semibold">Recipient of Stakes:</p>
                <p className="text-[#6f6f78]">No stakes</p>
              </div>
            </div>

            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="gh-btn-primary min-w-[84px] px-8 py-2 text-[15px] cursor-pointer"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
