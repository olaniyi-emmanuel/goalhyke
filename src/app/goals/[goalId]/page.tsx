"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import NavigationRegistered from "@/components/NavigationRegistered";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";
import { processGoalPenalties } from "@/lib/penalties";

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
  metadata?: any;
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
  metadata: {},
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

function buildCalendarDaysForMonth(year: number, month: number) {
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
  const [refereeName, setRefereeName] = useState("");
  const [reportSort, setReportSort] = useState<"newest" | "oldest">("newest");
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Re-added lost states
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isEditingReferee, setIsEditingReferee] = useState(false);
  const [newRefereeInput, setNewRefereeInput] = useState("");
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [leaderboardProfiles, setLeaderboardProfiles] = useState<any[]>([]);
  const [leaderboardGoals, setLeaderboardGoals] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardCategory, setLeaderboardCategory] = useState<string>("all");
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [profileTokens, setProfileTokens] = useState<number>(0);

  const photosCarouselRef = useRef<HTMLDivElement>(null);
  const postsCarouselRef = useRef<HTMLDivElement>(null);
  const reportsCarouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
    if (ref.current) {
      const { scrollLeft, clientWidth } = ref.current;
      const scrollAmount = direction === "left" ? -clientWidth * 0.75 : clientWidth * 0.75;
      ref.current.scrollTo({
        left: scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const fetchGoalAndSubmissions = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !goalId) {
        setGoal(fallbackGoal);
        return;
      }

      setCurrentUserId(user.id);

      // Fetch user profile tokens
      const { data: profileData } = await supabase
        .from("profiles")
        .select("tokens")
        .eq("id", user.id)
        .single();
      if (profileData) {
        setProfileTokens(profileData.tokens);
      }

      // Fetch Goal
      const { data: goalData, error: goalError } = await supabase
        .from("goals")
        .select("*")
        .eq("id", goalId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (goalError || !goalData) {
        setGoal(fallbackGoal);
        return;
      }

      // Fetch submissions
      const { data: subsData, error: subsError } = await supabase
        .from("progress_submissions")
        .select("*")
        .eq("goal_id", goalId)
        .order("created_at", { ascending: false });

      const fetchedSubs = subsData || [];
      setSubmissions(fetchedSubs);

      // Run dynamic weekly penalty check
      const { updatedGoal, wasUpdated } = await processGoalPenalties(goalData, fetchedSubs);
      setGoal({
        id: updatedGoal.id,
        title: updatedGoal.title,
        category: updatedGoal.category,
        description: updatedGoal.description,
        start_date: updatedGoal.start_date,
        end_date: updatedGoal.end_date,
        status: updatedGoal.status ?? "active",
        progress: updatedGoal.progress ?? 0,
        streak: updatedGoal.streak ?? 0,
        metadata: updatedGoal.metadata ?? {},
      });

      if (wasUpdated && updatedGoal.metadata?.remaining_committed !== goalData.metadata?.remaining_committed) {
        // If profile was penalized, update token balance
        const { data: newProfile } = await supabase
          .from("profiles")
          .select("tokens")
          .eq("id", user.id)
          .single();
        if (newProfile) {
          setProfileTokens(newProfile.tokens);
        }
      }

      // Set referee state
      if (updatedGoal.metadata?.referee_name) {
        setRefereeName(updatedGoal.metadata.referee_name);
      } else {
        setRefereeName("");
      }
    } catch (error) {
      console.error("Failed to fetch goal detail.", error);
      setGoal(fallbackGoal);
    } finally {
      setLoading(false);
    }
  };

  // Initialize currentCalendarMonth when goal loads
  useEffect(() => {
    if (goal.start_date) {
      const start = new Date(goal.start_date + "T00:00:00");
      setCurrentCalendarMonth(new Date(start.getFullYear(), start.getMonth(), 1));
    }
  }, [goal.start_date]);

  useEffect(() => {
    fetchGoalAndSubmissions();
  }, [goalId]);

  // Fetch leaderboard data when modal opens
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLeaderboardLoading(true);
      try {
        const supabase = createClient();
        const { data: profData, error: profError } = await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url, tokens")
          .order("tokens", { ascending: false });

        const { data: goalData, error: goalError } = await supabase
          .from("goals")
          .select("id, user_id, title, category, status, progress, streak");

        if (!profError && profData) {
          setLeaderboardProfiles(profData);
        }
        if (!goalError && goalData) {
          setLeaderboardGoals(goalData);
        }
      } catch (err) {
        console.error("Failed to load leaderboard data:", err);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    if (showLeaderboardModal) {
      fetchLeaderboardData();
    }
  }, [showLeaderboardModal]);

  const handlePrevMonth = () => {
    setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 1));
  };

  const handleSaveReferee = async () => {
    if (!newRefereeInput.trim()) return;
    try {
      const supabase = createClient();
      const updatedMetadata = {
        ...(goal.metadata || {}),
        referee_name: newRefereeInput.trim(),
        referee_contact: newRefereeInput.trim(),
      };
      const { error } = await supabase
        .from("goals")
        .update({ metadata: updatedMetadata })
        .eq("id", goalId);
      if (error) throw error;
      setGoal(prev => ({ ...prev, metadata: updatedMetadata }));
      setRefereeName(newRefereeInput.trim());
      setIsEditingReferee(false);
      setNewRefereeInput("");
    } catch (err) {
      console.error("Failed to save referee:", err);
    }
  };

  const handleRemoveReferee = async () => {
    try {
      const supabase = createClient();
      const updatedMetadata = { ...(goal.metadata || {}) };
      delete updatedMetadata.referee_name;
      delete updatedMetadata.referee_contact;
      const { error } = await supabase
        .from("goals")
        .update({ metadata: updatedMetadata })
        .eq("id", goalId);
      if (error) throw error;
      setGoal(prev => ({ ...prev, metadata: updatedMetadata }));
      setRefereeName("");
    } catch (err) {
      console.error("Failed to remove referee:", err);
    }
  };

  const handleReactivateGoal = async () => {
    const initialTokens = typeof goal.metadata?.committed_tokens === "number" ? goal.metadata.committed_tokens : 20;
    const cost = Math.round(initialTokens * 1.2);
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Check profile balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("tokens")
        .eq("id", user.id)
        .single();
      
      const currentTokens = profile?.tokens ?? 0;
      if (currentTokens < cost) {
        alert(`Insufficient tokens! Reactivation requires ${cost} tokens, but you only have ${currentTokens} tokens.`);
        return;
      }

      // 2. Calculate new dates (keep same length in days/weeks)
      const durationMs = new Date(goal.end_date).getTime() - new Date(goal.start_date).getTime();
      const start = new Date();
      const end = new Date(start.getTime() + durationMs);

      const startDateStr = start.toISOString().split("T")[0];
      const endDateStr = end.toISOString().split("T")[0];

      // 3. Reset metadata
      const updatedMetadata = {
        ...(goal.metadata || {}),
        committed_tokens: initialTokens,
        remaining_committed: initialTokens,
        failures_count: 0,
        failures_logged: [],
        success_logged: [],
        deductions_history: [],
      };

      // 4. Update goal
      const { error: goalError } = await supabase
        .from("goals")
        .update({
          status: "active",
          start_date: startDateStr,
          end_date: endDateStr,
          metadata: updatedMetadata,
          progress: 0,
          streak: 0,
        })
        .eq("id", goalId);
      
      if (goalError) throw goalError;

      // 5. Deduct tokens
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ tokens: currentTokens - cost })
        .eq("id", user.id);
      
      if (profileError) throw profileError;

      // Reload
      await fetchGoalAndSubmissions();
    } catch (err) {
      console.error("Reactivation failed:", err);
      alert("Failed to reactivate goal.");
    }
  };

  const { totalWeeks, elapsedWeeks } = useMemo(
    () => getWeekProgress(goal.start_date, goal.end_date),
    [goal.start_date, goal.end_date],
  );

  const calendarDays = useMemo(() => {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();
    const days = buildCalendarDaysForMonth(year, month);
    
    return days.map(item => {
      if (item.muted) {
        return { ...item, status: "none", date: null };
      }
      
      const itemDate = new Date(year, month, item.day);
      const start = new Date(goal.start_date + "T00:00:00");
      start.setHours(0,0,0,0);
      const end = new Date(goal.end_date + "T23:59:59");
      end.setHours(23,59,59,999);
      
      const today = new Date();
      today.setHours(0,0,0,0);
      
      if (itemDate < start || itemDate > end) {
        return { ...item, status: "none", date: itemDate };
      }
      
      const daySubmissions = submissions.filter(sub => {
        const subDate = new Date(sub.created_at);
        return (
          subDate.getFullYear() === itemDate.getFullYear() &&
          subDate.getMonth() === itemDate.getMonth() &&
          subDate.getDate() === itemDate.getDate()
        );
      });
      
      const hasVerified = daySubmissions.some(s => s.verified === "verified");
      const hasFailed = daySubmissions.some(s => s.verified === "failed");
      const hasPending = daySubmissions.some(s => s.verified === "pending");
      
      if (hasVerified) {
        return { ...item, status: "verified", date: itemDate };
      }
      
      if (itemDate <= today) {
        if (hasFailed) {
          return { ...item, status: "failed", date: itemDate };
        }
        if (hasPending) {
          return { ...item, status: "pending", date: itemDate };
        }
        if (itemDate < today) {
          return { ...item, status: "missed", date: itemDate };
        }
      }
      
      return { ...item, status: "none", date: itemDate };
    });
  }, [goal.start_date, goal.end_date, submissions, currentCalendarMonth]);

  const monthLabel = useMemo(() => {
    return currentCalendarMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [currentCalendarMonth]);

  const nextReportDue = goal.metadata?.next_report_due || formatShortMonthDay(goal.start_date);
  const reportTime = goal.metadata?.report_time || "12:00 AM CAT";
  const successfulPeriods = submissions.filter((submission) => submission.verified === "verified").length;
  const unsuccessfulPeriods = submissions.filter((submission) => submission.verified === "failed").length;
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

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmissionStatus(null);

    const submissionMode = goal.metadata?.submission_mode || "image";

    if (submissionMode === "image") {
      if (!selectedFile) {
        setSubmissionStatus({ type: "error", message: "Please select an image file as proof of your activity." });
        setIsSubmitting(false);
        return;
      }
      if (!selectedFile.type.startsWith("image/")) {
        setSubmissionStatus({ type: "error", message: "Selected file must be an image." });
        setIsSubmitting(false);
        return;
      }
    } else if (submissionMode === "video") {
      if (!selectedFile) {
        setSubmissionStatus({ type: "error", message: "Please select a video file as proof of your activity." });
        setIsSubmitting(false);
        return;
      }
      if (!selectedFile.type.startsWith("video/")) {
        setSubmissionStatus({ type: "error", message: "Selected file must be a video." });
        setIsSubmitting(false);
        return;
      }
    } else if (submissionMode === "text") {
      if (!submissionNotes.trim()) {
        setSubmissionStatus({ type: "error", message: "Please write a description of your accomplished activity." });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setSubmissionStatus({ type: "error", message: "User not authenticated" });
        setIsSubmitting(false);
        return;
      }

      let fileUrl = "";

      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${user.id}/${goalId}_${Date.now()}.${fileExt}`;
        const filePath = fileName;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("submissions")
          .upload(filePath, selectedFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Upload error: ${uploadError.message}`);
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("submissions")
          .getPublicUrl(filePath);

        fileUrl = publicUrlData.publicUrl;
      } else if (submissionMode === "text") {
        fileUrl = "text-only";
      }

      // Insert record
      const { data: insertData, error: insertError } = await supabase
        .from("progress_submissions")
        .insert({
          goal_id: goalId,
          user_id: user.id,
          notes: submissionNotes,
          image_url: fileUrl,
          verified: "pending",
        })
        .select()
        .single();

      if (insertError || !insertData) {
        throw new Error(`Insert error: ${insertError?.message || "Failed to create entry"}`);
      }

      setSubmissionStatus({ type: "success", message: "Uploading proof & invoking AI verification..." });

      // Call Edge Function for AI verification
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
        "verify-upload",
        {
          body: { submissionId: insertData.id },
        }
      );

      if (verifyError) {
        throw new Error(`Verification service error: ${verifyError.message}`);
      }

      if (verifyData && verifyData.error) {
        throw new Error(`Verification failed: ${verifyData.error}`);
      }

      if (verifyData && verifyData.verified === "failed") {
        setSubmissionStatus({
          type: "error",
          message: `Rejected: ${verifyData.feedback || "Submission did not pass AI verification."}`,
        });
      } else {
        setSubmissionStatus({
          type: "success",
          message: "Check-in verified successfully!",
        });
        setSubmissionNotes("");
        setSelectedFile(null);
      }

      // Refresh data
      await fetchGoalAndSubmissions();
    } catch (err: any) {
      console.error("Proof submission failed:", err);
      setSubmissionStatus({
        type: "error",
        message: err.message || "An unexpected error occurred during submission.",
      });
    } finally {
      setIsSubmitting(false);
    }
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
                    <div className="mb-8 flex flex-wrap items-center gap-4">
                      <div className="inline-flex items-center rounded-full border border-[#dddaf8] bg-white p-1 shadow-[0_8px_24px_rgba(24,33,77,0.04)]">
                        {[
                          { label: "Active", active: goal.status === "active" },
                          { label: "Completed", active: goal.status === "completed" },
                        ].map((item) => (
                          <span
                            key={item.label}
                            className={`rounded-full px-5 py-2 text-[12px] font-bold transition-colors ${
                              item.active ? "bg-[#eef2ff] text-[#7655fb]" : "text-[#7f7e87]"
                            }`}
                          >
                            {item.label}
                          </span>
                        ))}
                      </div>
                      {goal.status === "failed" ? (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-red-600">
                          Failed
                        </span>
                      ) : null}
                    </div>

                    <div className="gh-panel-soft rounded-[24px] border border-[#eceff7] bg-white p-5 shadow-[0_16px_36px_rgba(24,33,77,0.06)] md:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <span className="rounded-full bg-[#f3ecff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7655fb]">
                            Featured
                          </span>
                          <h1 className="mt-3 text-[22px] font-bold text-[#262525] md:text-[24px]">
                            {goal.title}
                          </h1>
                          <p className="mt-1 text-[13px] text-[#7f7e87]">
                            Week {elapsedWeeks} of {totalWeeks}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowDetailsModal(true)}
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#cfc7ff] bg-white text-[#7655fb] transition-colors hover:bg-[#f7f8ff] cursor-pointer"
                          aria-label="Open goal details"
                        >
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
                        </button>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-1.5">
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

                      <div className="mt-5 grid gap-6">
                        <div>
                          <div className="grid gap-3 text-[12px] text-[#787783] sm:grid-cols-3">
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

                          <div className="mt-6 rounded-[20px] border border-[#eceff7] bg-[#fbfbff] p-4 md:p-5">
                            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px] md:items-start">
                              <div className="grid gap-2 text-[13px] text-[#555463]">
                                <p className="font-semibold text-[#262525]">I commit to:</p>
                                <p>{goal.description || "Exercise 1 day each week"}</p>
                                <p>Successful Periods: {successfulPeriods}</p>
                                <p>Unsuccessful Periods: {unsuccessfulPeriods}</p>
                              </div>

                              <div className="rounded-[18px] border border-[#efe8b8] bg-gradient-to-br from-[#fffbe0] to-[#f7efb2] p-4 text-[#4f5b7f] shadow-[0_8px_18px_rgba(223,207,111,0.18)]">
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#938b52]">
                                  Last reported
                                </p>
                                <p className="mt-2 text-[13px] font-medium leading-relaxed text-[#6b6650]">
                                  {submissions.length > 0
                                    ? `Reported on ${new Date(submissions[0].created_at).toLocaleDateString()}`
                                    : "No report submitted"}
                                </p>
                                <div className="my-4 border-t border-[#d8cf95]" />
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#938b52]">
                                  Next report due
                                </p>
                                <p className="mt-3 text-[28px] font-bold tracking-tight leading-none text-[#6d5d12]">
                                  {nextReportDue}
                                </p>
                                <p className="mt-4 text-[11px] font-semibold text-[#938b52]">
                                  {reportTime}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex justify-center">
                        <button
                          type="button"
                          onClick={() => setShowDetailsModal(true)}
                          className="gh-btn-secondary min-w-[140px] px-8 py-2.5 text-[14px]"
                        >
                          Details
                        </button>
                      </div>
                    </div>

                    {/* Progress Submission Card */}
                    <div className="rounded-[18px] border border-[#eceff7] bg-white p-6 shadow-[0_12px_30px_rgba(24,33,77,0.05)] mt-6">
                      <h3 className="text-[16px] font-bold text-[#262525] font-secondary mb-3 flex items-center gap-2">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#7655fb]">
                          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                          <path d="M12 6v6l4 2"/>
                        </svg>
                        Report Progress Check-in
                      </h3>
                      
                      {submissionStatus && (
                        <div className={`p-4 rounded-[12px] mb-4 text-[13px] font-semibold flex items-center gap-2 ${
                          submissionStatus.type === "success" 
                            ? "bg-green-50 text-green-700 border border-green-200" 
                            : "bg-red-50 text-red-600 border border-red-200"
                        }`}>
                          <span>{submissionStatus.message}</span>
                        </div>
                      )}

                      <form onSubmit={handleSubmitProof} className="space-y-4">
                        <div>
                          <label className="block text-[12px] font-bold text-[#555463] mb-1.5 uppercase tracking-wider">
                            Activity Notes / Description
                          </label>
                          <textarea
                            value={submissionNotes}
                            onChange={(e) => setSubmissionNotes(e.target.value)}
                            placeholder="Describe what you accomplished today (e.g., ran 5k, completed Chapter 2, lost 1kg)..."
                            className="w-full min-h-[90px] border border-[#eceff7] rounded-[12px] p-3 text-[13px] outline-none focus:border-[#7655fb] resize-none"
                            required
                          />
                        </div>

                        {(goal.metadata?.submission_mode || "image") !== "text" && (
                          <div>
                            <label className="block text-[12px] font-bold text-[#555463] mb-1.5 uppercase tracking-wider">
                              {(goal.metadata?.submission_mode || "image") === "video"
                                ? "Upload Proof (Video / Screen Recording)"
                                : "Upload Proof (Image / Screenshot)"}
                            </label>
                            <div className="flex items-center gap-3">
                              <input
                                type="file"
                                accept={(goal.metadata?.submission_mode || "image") === "video" ? "video/*" : "image/*"}
                                id="proof-image-upload"
                                className="hidden"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                              />
                              <button
                                type="button"
                                onClick={() => document.getElementById("proof-image-upload")?.click()}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] border border-[#ccd2e2] bg-white text-[13px] font-semibold text-[#262525] hover:bg-[#f7f8ff] transition-all cursor-pointer"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-gray-500">
                                  {(goal.metadata?.submission_mode || "image") === "video" ? (
                                    <>
                                      <polygon points="23 7 16 12 23 17 23 7" />
                                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                    </>
                                  ) : (
                                    <>
                                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                      <circle cx="8.5" cy="8.5" r="1.5" />
                                      <polyline points="21 15 16 10 5 21" />
                                    </>
                                  )}
                                </svg>
                                <span>
                                  {selectedFile
                                    ? ((goal.metadata?.submission_mode || "image") === "video" ? "Change Video" : "Change Image")
                                    : ((goal.metadata?.submission_mode || "image") === "video" ? "Choose Video" : "Choose Image")}
                                </span>
                              </button>
                              <span className="text-[12px] text-gray-500 truncate max-w-[200px]">
                                {selectedFile ? selectedFile.name : `No ${(goal.metadata?.submission_mode || "image") === "video" ? "video" : "image"} selected`}
                              </span>
                            </div>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-3 bg-[#7655fb] hover:bg-[#6445e0] disabled:opacity-50 text-white rounded-[14px] text-[14px] font-bold transition-all shadow-md shadow-[#7655fb]/20 cursor-pointer flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <span>Submit & Verify with AI</span>
                          )}
                        </button>
                      </form>
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
                        <div className="py-6 text-center text-[14px] leading-7 text-[#717070]">
                          {activeTab === "posts" && (
                            submissions.filter(s => s.notes).length > 0 ? (
                              <div className="relative group/posts">
                                <button
                                  type="button"
                                  onClick={() => scrollCarousel(postsCarouselRef, "left")}
                                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-md border border-gray-100 opacity-0 group-hover/posts:opacity-100 transition-all cursor-pointer flex items-center justify-center h-8 w-8"
                                >
                                  ‹
                                </button>

                                <div
                                  ref={postsCarouselRef}
                                  className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none py-2 px-1"
                                  style={{ scrollbarWidth: "none" }}
                                >
                                  {submissions.filter(s => s.notes).map((sub, index) => (
                                    <div
                                      key={sub.id || index}
                                      className="min-w-[280px] sm:min-w-[320px] max-w-[320px] snap-start rounded-[16px] border border-[#eceff7] bg-white p-4 text-left shadow-[0_4px_20px_rgba(24,33,77,0.02)] flex flex-col justify-between"
                                    >
                                      <div>
                                        <div className="flex items-center justify-between gap-2 mb-2.5">
                                          <span className="text-[11px] text-[#8c8b94] font-semibold">
                                            {new Date(sub.created_at).toLocaleDateString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                            })}
                                          </span>
                                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                            sub.verified === "verified"
                                              ? "bg-green-100 text-green-700"
                                              : sub.verified === "failed"
                                                ? "bg-red-100 text-red-600"
                                                : "bg-amber-100 text-amber-700"
                                          }`}>
                                            {sub.verified}
                                          </span>
                                        </div>
                                        <p className="text-[13px] text-[#262525] font-medium leading-relaxed line-clamp-3 font-secondary">
                                          {sub.notes}
                                        </p>
                                      </div>
                                      
                                      {sub.image_url && (
                                        <div className="mt-3 rounded-[8px] overflow-hidden border border-gray-100 h-16 w-full relative">
                                          <img src={sub.image_url} alt="Proof screenshot" className="object-cover w-full h-full" />
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => scrollCarousel(postsCarouselRef, "right")}
                                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-md border border-gray-100 opacity-0 group-hover/posts:opacity-100 transition-all cursor-pointer flex items-center justify-center h-8 w-8"
                                >
                                  ›
                                </button>
                              </div>
                            ) : (
                              <p>{journalEmptyState.posts}</p>
                            )
                          )}

                          {activeTab === "photos" && (
                            submissions.filter(s => s.image_url).length > 0 ? (
                              <div className="relative group/photos">
                                <button
                                  type="button"
                                  onClick={() => scrollCarousel(photosCarouselRef, "left")}
                                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-md border border-gray-100 opacity-0 group-hover/photos:opacity-100 transition-all cursor-pointer flex items-center justify-center h-8 w-8"
                                >
                                  ‹
                                </button>

                                <div
                                  ref={photosCarouselRef}
                                  className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none py-2 px-1"
                                  style={{ scrollbarWidth: "none" }}
                                >
                                  {submissions.filter(s => s.image_url).slice(0, 7).map((sub, index) => (
                                    <div
                                      key={sub.id || index}
                                      className="min-w-[140px] h-[140px] snap-start rounded-[16px] overflow-hidden border border-[#eceff7] bg-white relative group cursor-pointer shadow-[0_4px_12px_rgba(24,33,77,0.03)]"
                                    >
                                      <img src={sub.image_url} alt="Proof gallery item" className="object-cover w-full h-full" />
                                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2.5 text-left text-white">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                                          {new Date(sub.created_at).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                          })}
                                        </p>
                                        <p className="text-[11px] font-medium leading-snug line-clamp-2 mt-0.5 text-white/90">
                                          {sub.notes || "Check-in Photo"}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => scrollCarousel(photosCarouselRef, "right")}
                                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-md border border-gray-100 opacity-0 group-hover/photos:opacity-100 transition-all cursor-pointer flex items-center justify-center h-8 w-8"
                                >
                                  ›
                                </button>
                              </div>
                            ) : (
                              <p>{journalEmptyState.photos}</p>
                            )
                          )}

                          {activeTab === "reports" && (
                            Array.from({ length: elapsedWeeks }).map((_, i) => {
                              const weekNum = i + 1;
                              const isFailure = goal.metadata?.failures_logged?.includes(weekNum);
                              const isSuccess = goal.metadata?.success_logged?.includes(weekNum);
                              
                              return {
                                id: `week-${weekNum}`,
                                periodLabel: `Week ${weekNum}`,
                                status: isFailure ? "Not Successful" : isSuccess ? "Successful" : "Pending",
                                userReport: isFailure 
                                  ? "Missed consistency target (< 5 check-ins)" 
                                  : isSuccess 
                                    ? "Achieved weekly show-up target" 
                                    : "Week is in progress or evaluating",
                              };
                            }).length > 0 ? (
                              <div className="relative group/reports">
                                <button
                                  type="button"
                                  onClick={() => scrollCarousel(reportsCarouselRef, "left")}
                                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-md border border-gray-100 opacity-0 group-hover/reports:opacity-100 transition-all cursor-pointer flex items-center justify-center h-8 w-8"
                                >
                                  ‹
                                </button>

                                <div
                                  ref={reportsCarouselRef}
                                  className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none py-2 px-1"
                                  style={{ scrollbarWidth: "none" }}
                                >
                                  {Array.from({ length: elapsedWeeks }).map((_, i) => {
                                    const weekNum = i + 1;
                                    const isFailure = goal.metadata?.failures_logged?.includes(weekNum);
                                    const isSuccess = goal.metadata?.success_logged?.includes(weekNum);
                                    const status = isFailure ? "Not Successful" : isSuccess ? "Successful" : "Pending";
                                    const desc = isFailure 
                                      ? "Missed consistency target (< 5 check-ins)" 
                                      : isSuccess 
                                        ? "Achieved weekly show-up target" 
                                        : "Week is in progress or evaluating";
                                    
                                    return (
                                      <div
                                        key={weekNum}
                                        className="min-w-[260px] snap-start rounded-[16px] border border-[#eceff7] bg-white p-4 text-left shadow-[0_4px_20px_rgba(24,33,77,0.02)] flex flex-col justify-between"
                                      >
                                        <div>
                                          <div className="flex items-center justify-between gap-2 mb-2">
                                            <span className="text-[13px] font-bold text-[#262525] font-secondary">
                                              Week {weekNum} Report
                                            </span>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                              status === "Successful"
                                                ? "bg-green-100 text-green-700"
                                                : status === "Not Successful"
                                                  ? "bg-red-100 text-red-600"
                                                  : "bg-amber-100 text-amber-700"
                                            }`}>
                                              {status}
                                            </span>
                                          </div>
                                          <p className="text-[12px] text-gray-500 font-medium leading-relaxed font-secondary">
                                            {desc}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => scrollCarousel(reportsCarouselRef, "right")}
                                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-md border border-gray-100 opacity-0 group-hover/reports:opacity-100 transition-all cursor-pointer flex items-center justify-center h-8 w-8"
                                >
                                  ›
                                </button>
                              </div>
                            ) : (
                              <p>{journalEmptyState.reports}</p>
                            )
                          )}
                        </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <aside className="hidden xl:flex flex-col gap-6">
                    <div className="gh-panel-soft p-5">
                      <div className="mb-4 flex items-center justify-between text-[#7655fb]">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7655fb] hover:bg-[#6445e0] transition-colors text-white cursor-pointer font-bold"
                        >
                          ‹
                        </button>
                        <div className="text-center">
                          <p className="text-[14px] font-bold text-[#262525]">
                            {monthLabel}
                          </p>
                          <p className="text-[10px] text-[#8c8b94] font-semibold mt-0.5">
                            Show-up history
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleNextMonth}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7655fb] hover:bg-[#6445e0] transition-colors text-white cursor-pointer font-bold"
                        >
                          ›
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase text-[#9a99a3] font-bold">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                          <span key={day}>{day}</span>
                        ))}
                      </div>

                      <div className="mt-3 grid grid-cols-7 gap-y-3 text-center text-[12px] text-[#3f3e4a]">
                        {calendarDays.map((item, index) => {
                          let cellClass = "relative flex items-center justify-center h-7 w-7 mx-auto rounded-full transition-all ";
                          let statusIndicator = null;
                          
                          if (item.muted) {
                            cellClass += "text-[#c8c7cf] cursor-default";
                          } else {
                            cellClass += "hover:bg-gray-100 cursor-pointer ";
                            if (item.status === "verified") {
                              cellClass += "bg-green-50 text-green-700 font-bold border border-green-200";
                              statusIndicator = <span className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />;
                            } else if (item.status === "failed" || item.status === "missed") {
                              cellClass += "bg-red-50 text-red-700 font-semibold border border-red-200";
                              statusIndicator = <span className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />;
                            } else if (item.status === "pending") {
                              cellClass += "bg-amber-50 text-amber-700 font-semibold border border-amber-200";
                              statusIndicator = <span className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />;
                            }
                          }

                          return (
                            <div
                              key={`${item.day}-${index}`}
                              className={cellClass}
                              title={
                                item.status === "verified" ? "Verified Check-in" :
                                item.status === "failed" ? "Failed Verification" :
                                item.status === "missed" ? "Missed Day" :
                                item.status === "pending" ? "Pending AI Review" : undefined
                              }
                            >
                              <span className={item.status !== "none" && !item.muted ? "translate-y-[-2px]" : ""}>
                                {item.day}
                              </span>
                              {statusIndicator}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="gh-panel-soft p-5 text-center">
                      <p className="text-[14px] font-bold text-[#7655fb]">
                        GoalHykeClip
                      </p>
                      <button
                        type="button"
                        onClick={() => document.getElementById("proof-image-upload")?.click()}
                        className="gh-btn-primary mt-5 min-w-[120px] px-6 py-2.5 text-[13px] cursor-pointer"
                      >
                        Add proof video!
                      </button>
                    </div>

                    <div className="gh-panel-soft p-5 text-center">
                      <p className="text-[20px] font-semibold text-[#4f4d4d] font-secondary">
                        Referee
                      </p>
                      
                      {refereeName ? (
                        <div className="mt-4">
                          <div className="flex items-center justify-center gap-2 text-[#6a6880] mb-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span className="text-[14px] font-semibold text-[#7655fb] truncate max-w-[150px]" title={refereeName}>
                              {refereeName}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveReferee}
                            className="text-[12px] font-bold text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            Remove Referee
                          </button>
                        </div>
                      ) : isEditingReferee ? (
                        <div className="mt-4 space-y-3">
                          <input
                            type="text"
                            value={newRefereeInput}
                            onChange={(e) => setNewRefereeInput(e.target.value)}
                            placeholder="Enter referee contact..."
                            className="w-full px-3 py-2 border border-[#ccd2e2] rounded-[10px] text-[12px] outline-none focus:border-[#7655fb]"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingReferee(false);
                                setNewRefereeInput("");
                              }}
                              className="flex-1 py-1.5 border border-[#ccd2e2] rounded-[10px] text-[11px] font-bold hover:bg-gray-50 cursor-pointer text-[#262525]"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveReferee}
                              disabled={!newRefereeInput.trim()}
                              className="flex-1 py-1.5 bg-[#7655fb] text-white rounded-[10px] text-[11px] font-bold hover:bg-[#6445e0] disabled:opacity-50 cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4">
                          <p className="text-[11px] text-[#8c8b94] leading-normal max-w-[200px] mx-auto">
                            No Referee assigned. Add a mentor/buddy to verify checks!
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsEditingReferee(true)}
                            className="gh-btn-primary mt-4 w-full py-2.5 text-[12px] font-semibold cursor-pointer"
                          >
                            Add Referee
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Token Commitment Stakes Ledger Card */}
                    <div className="rounded-[22px] border border-[#eceff7] bg-white p-5 shadow-[0_12px_30px_rgba(24,33,77,0.05)] text-left flex flex-col gap-4">
                      <div>
                        <h4 className="text-[16px] font-bold text-[#262525] font-secondary mb-1">
                          Token Stakes Ledger
                        </h4>
                        <p className="text-[11px] text-gray-400 font-semibold font-secondary">
                          Goal Accountability Stakes
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 border-y border-gray-100 py-3.5">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Staked tokens
                          </p>
                          <p className="text-[18px] font-black text-[#7655fb] mt-0.5">
                            {typeof goal.metadata?.committed_tokens === "number" ? goal.metadata.committed_tokens : 20}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Current Value
                          </p>
                          <p className="text-[18px] font-black text-[#10b981] mt-0.5">
                            {typeof goal.metadata?.remaining_committed === "number" ? goal.metadata.remaining_committed : 20}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[13px] text-[#555463]">
                        <span className="font-semibold font-secondary">Weekly Failures:</span>
                        <span className={`font-bold font-secondary ${
                          (goal.metadata?.failures_count ?? 0) >= 3 
                            ? "text-red-500" 
                            : (goal.metadata?.failures_count ?? 0) > 0 
                              ? "text-amber-500" 
                              : "text-green-500"
                        }`}>
                          {goal.metadata?.failures_count ?? 0} / 3
                        </span>
                      </div>

                      {goal.status === "failed" && (
                        <div className="p-3 bg-red-50 rounded-[12px] border border-red-200">
                          <p className="text-[11px] font-medium text-red-700 leading-normal mb-2">
                            This goal failed. Reactivate to resume tracking! Cost: {Math.round((typeof goal.metadata?.committed_tokens === "number" ? goal.metadata.committed_tokens : 20) * 1.2)} tokens.
                          </p>
                          <button
                            type="button"
                            onClick={handleReactivateGoal}
                            className="w-full py-2 bg-gradient-to-r from-red-500 to-[#7655fb] text-white rounded-[10px] text-[12px] font-bold hover:opacity-95 shadow-sm cursor-pointer"
                          >
                            Reactivate Goal
                          </button>
                        </div>
                      )}

                      {/* Deductions History Timeline */}
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                          Deductions History
                        </p>
                        {goal.metadata?.deductions_history && goal.metadata.deductions_history.length > 0 ? (
                          <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                            {goal.metadata.deductions_history.map((h: any, idx: number) => (
                              <div key={idx} className="text-[11px] leading-relaxed border-b border-gray-50 pb-1.5 last:border-b-0">
                                <div className="flex justify-between font-bold text-red-500">
                                  <span>-{h.deducted_amount} tokens</span>
                                  <span className="text-gray-400 font-semibold">
                                    {new Date(h.timestamp).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                </div>
                                <p className="text-gray-500">{h.reason}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-400 italic font-semibold">
                            No deductions yet. Keep showing up!
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="gh-panel-soft p-5 text-center">
                      <p className="text-[20px] font-semibold text-[#4f4d4d] font-secondary">
                        Leaderboard
                      </p>
                      <div className="mt-4 flex justify-center text-[#f59e0b]">
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
                      <p className="text-[11px] text-gray-400 mt-2 font-medium">
                        See how you rank in {goal.category} standings
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setLeaderboardCategory(goal.category);
                          setShowLeaderboardModal(true);
                        }}
                        className="gh-btn-primary mt-4 w-full py-2.5 text-[12px] font-semibold cursor-pointer"
                      >
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

      {showLeaderboardModal && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-[#1b1a1a]/55 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-[560px] rounded-[28px] border border-white/80 bg-white/95 px-6 py-8 shadow-[0_32px_80px_rgba(24,33,77,0.16)] sm:px-8 flex flex-col max-h-[85vh]">
            <button
              type="button"
              onClick={() => setShowLeaderboardModal(false)}
              className="absolute right-6 top-5 flex h-10 w-10 items-center justify-center rounded-full text-[#262525] transition-colors hover:bg-[#f4f6fb] cursor-pointer z-10"
              aria-label="Close leaderboard dialog"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <h2 className="text-[24px] font-bold text-[#262525] font-secondary flex items-center justify-center gap-2">
                <span className="text-[#f59e0b]">🏆</span> Standings Leaderboard
              </h2>
              <p className="text-[12px] text-gray-500 font-secondary mt-1">
                See who leads in consistency and habit streaks
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 font-secondary">
                Filter by Category
              </label>
              <select
                value={leaderboardCategory}
                onChange={(e) => setLeaderboardCategory(e.target.value)}
                className="w-full h-[46px] rounded-[14px] border border-[#ccd2e2] bg-white px-4 text-[14px] font-semibold text-[#262525] outline-none focus:border-[#7655fb] cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="Exercise regularly">Exercise regularly</option>
                <option value="Lose weight">Lose weight</option>
                <option value="Read more">Read more</option>
                <option value="Grow wealth">Grow wealth</option>
                <option value="Stay healthy">Stay healthy</option>
                <option value="Strengthen your spirit">Strengthen your spirit</option>
                <option value="Excel academically">Excel academically</option>
                <option value="Level up career">Level up career</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3.5">
              {leaderboardLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7655fb] border-t-transparent" />
                  <p className="text-[13px] font-medium text-gray-500 font-secondary">Loading standings...</p>
                </div>
              ) : (
                (() => {
                  const standings = leaderboardProfiles
                    .map(profile => {
                      const userGoals = leaderboardGoals.filter(g => g.user_id === profile.id);
                      const filteredGoals = leaderboardCategory === "all"
                        ? userGoals
                        : userGoals.filter(g => g.category?.toLowerCase() === leaderboardCategory.toLowerCase());
                      
                      const totalGoals = filteredGoals.length;
                      const maxStreak = filteredGoals.length > 0 
                        ? Math.max(...filteredGoals.map(g => g.streak ?? 0), 0)
                        : 0;

                      return {
                        id: profile.id,
                        name: profile.full_name || profile.username || "GoalHyker",
                        avatar_url: profile.avatar_url,
                        totalGoals,
                        maxStreak,
                        isCurrentUser: profile.id === currentUserId,
                      };
                    })
                    .filter(entry => entry.totalGoals > 0)
                    .sort((a, b) => b.maxStreak - a.maxStreak || b.totalGoals - a.totalGoals);

                  if (standings.length === 0) {
                    return (
                      <div className="py-16 text-center text-gray-400 text-[13px] font-secondary font-medium">
                        No active participants in this category yet.
                      </div>
                    );
                  }

                  return (
                    <div className="border border-[#eceff7] rounded-[20px] overflow-hidden bg-white shadow-[0_4px_24px_rgba(24,33,77,0.01)]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#fcfcff] border-b border-[#eceff7] text-[11px] font-bold uppercase tracking-wider text-gray-400 font-secondary">
                            <th className="py-3.5 px-4 text-center w-16">Rank</th>
                            <th className="py-3.5 px-3">User</th>
                            <th className="py-3.5 px-3 text-center">Goals</th>
                            <th className="py-3.5 px-4 text-right">Max Streak</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f7f8fa]">
                          {standings.map((user, idx) => {
                            const rank = idx + 1;
                            const rankBadge = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
                            
                            return (
                              <tr
                                key={user.id}
                                className={`transition-colors text-[13px] ${
                                  user.isCurrentUser 
                                    ? "bg-[#7655fb]/5 hover:bg-[#7655fb]/8 text-[#7655fb] font-semibold" 
                                    : "hover:bg-[#fcfcff] text-[#262525]"
                                }`}
                              >
                                <td className="py-3 px-4 text-center font-bold">
                                  {rankBadge ? (
                                    <span className="text-[16px]">{rankBadge}</span>
                                  ) : (
                                    <span>{rank}</span>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="h-6 w-6 rounded-full bg-[#f2edff] text-[#7655fb] overflow-hidden flex items-center justify-center font-bold text-[10px] shrink-0 border border-white">
                                      {user.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" />
                                      ) : (
                                        user.name.slice(0, 1).toUpperCase()
                                      )}
                                    </div>
                                    <span className="truncate max-w-[140px] font-secondary flex items-center gap-1.5">
                                      {user.name}
                                      {user.isCurrentUser && (
                                        <span className="bg-[#7655fb] text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] shrink-0">
                                          You
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-center font-bold font-secondary opacity-80">
                                  {user.totalGoals}
                                </td>
                                <td className="py-3 px-4 text-right font-black text-[14px] font-secondary">
                                  {user.maxStreak}d
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()
              )}
            </div>

            <div className="mt-6 flex justify-center shrink-0">
              <button
                type="button"
                onClick={() => setShowLeaderboardModal(false)}
                className="gh-btn-primary min-w-[100px] py-2.5 px-6 text-[14px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
