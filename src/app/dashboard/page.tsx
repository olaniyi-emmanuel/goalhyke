"use client";

import React, { useEffect, useMemo, useState } from "react";
import NavigationRegistered from "@/components/NavigationRegistered";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import Footer from "@/components/Footer";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { processGoalPenalties } from "@/lib/penalties";

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

export default function Dashboard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [rechargeToast, setRechargeToast] = useState<{ show: boolean; amount: number } | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareToast, setShareToast] = useState<{ show: boolean; message: string } | null>(null);

  // Consistency calendar states
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("all");
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());

  useEffect(() => {
    const fetchGoalsAndBalance = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setGoals(fallbackGoals);
          setTokenBalance(0);
          return;
        }

        // 1. Fetch user's token balance and first name from public.profiles
        const { data: profileData } = await supabase
          .from("profiles")
          .select("tokens, full_name, first_name")
          .eq("id", user.id)
          .single();

        let currentTokens = profileData?.tokens ?? 0;
        setTokenBalance(currentTokens);

        const rawFirstName = profileData?.first_name || user?.user_metadata?.first_name;
        const rawFullName = profileData?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "";
        const resolvedFirstName = rawFirstName || rawFullName.trim().split(/\s+/)[0] || "GoalHyker";
        setFirstName(resolvedFirstName);

        // 2. Check for URL redirect parameters from Paystack
        const params = new URLSearchParams(window.location.search);
        const isSuccess = params.get("payment") === "success";
        const amountStr = params.get("amount");
        const reference = params.get("reference") || params.get("trxref") || (params.get("mock") === "paystack" ? `mock-ref-${Date.now()}` : null);

        if (isSuccess && amountStr && reference) {
          const amount = Number(amountStr);
          const txKey = `goalhyke_tx_processed_${reference}`;
          
          if (!localStorage.getItem(txKey)) {
            localStorage.setItem(txKey, "true");
            
            // Invoke server-side checkout verification API
            fetch("/api/checkout/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                reference,
                amount,
                price: params.get("price") ? Number(params.get("price")) : 0,
                currency: params.get("currency") || "USD",
              }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.success) {
                  setTokenBalance(data.balance);
                  setRechargeToast({ show: true, amount: data.amount || amount });
                  setTimeout(() => setRechargeToast(null), 5000);
                } else {
                  console.error("Failed to verify transaction securely:", data.error);
                  alert(`Payment verification failed: ${data.error}`);
                }
              })
              .catch((err) => {
                console.error("Verification connection error:", err);
              });
          }
          
          // Clear query parameters from URL
          window.history.replaceState(null, "", window.location.pathname);
        }

        // 3. Fetch goals
        const { data: goalsData, error: goalsError } = await supabase
          .from("goals")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (goalsError) {
          throw goalsError;
        }

        if (!goalsData || goalsData.length === 0) {
          setGoals([]);
          return;
        }

        // 4. Fetch submissions
        const { data: subsData, error: subsError } = await supabase
          .from("progress_submissions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        const fetchedSubs = subsData || [];
        setSubmissions(fetchedSubs);

        // 5. Evaluate penalties dynamically for each active goal on dashboard mount
        let anyPenaltiesUpdated = false;
        const processedGoals = [];
        for (const goal of goalsData) {
          if (goal.status === "active") {
            const goalSubs = fetchedSubs.filter((sub: any) => sub.goal_id === goal.id);
            const { updatedGoal, wasUpdated } = await processGoalPenalties(goal, goalSubs);
            processedGoals.push(updatedGoal);
            if (wasUpdated) {
              anyPenaltiesUpdated = true;
            }
          } else {
            processedGoals.push(goal);
          }
        }

        setGoals(
          processedGoals.map((goal: any) => ({
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

        if (anyPenaltiesUpdated) {
          // Re-fetch profile token balance
          const { data: updatedProfile } = await supabase
            .from("profiles")
            .select("tokens")
            .eq("id", user.id)
            .single();
          if (updatedProfile) {
            setTokenBalance(updatedProfile.tokens);
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard goals/balance.", error);
        setGoals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGoalsAndBalance();
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
    if (goals.length === 0) {
      return trendLabels.map((label) => ({ label, value: 0 }));
    }
    const base = completionRate;
    return trendLabels.map((label, index) => ({
      label,
      value: Math.max(
        0,
        Math.min(
          100,
          Math.round(
            base * 0.45 +
              (index % 2 === 0 ? 10 : 20) +
              activeGoals.length * 4 -
              index * 2
          )
        )
      ),
    }));
  }, [goals.length, completionRate, activeGoals.length]);

  const featuredHabits = activeGoals.slice(0, 3);
  const focusCategory = featuredHabits[0]?.category ?? "No active focus";

  const longestStreakLabel =
    streakDays > 0 ? `${streakDays} Days` : "Start today";
  const consistencyChange =
    goals.length === 0
      ? "0%"
      : completionRate >= 50
      ? "+24%"
      : "+12%";
  const handlePrevMonth = () => {
    setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 1));
  };

  const calendarDays = useMemo(() => {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();
    const days = buildCalendarDaysForMonth(year, month);
    
    return days.map(item => {
      if (item.muted) {
        return { ...item, status: "none" };
      }
      
      const itemDate = new Date(year, month, item.day);
      const today = new Date();
      today.setHours(0,0,0,0);
      
      // Filter goals that are active on this day
      const activeGoalsOnDay = goals.filter(g => {
        if (selectedGoalId !== "all" && g.id !== selectedGoalId) {
          return false;
        }
        const start = new Date(g.start_date);
        start.setHours(0,0,0,0);
        const end = new Date(g.end_date);
        end.setHours(23,59,59,999);
        return itemDate >= start && itemDate <= end;
      });
      
      if (activeGoalsOnDay.length === 0) {
        return { ...item, status: "none", date: itemDate };
      }
      
      // Filter submissions for active goals on this day
      const daySubmissions = submissions.filter(sub => {
        const subDate = new Date(sub.created_at);
        const isSameDay = subDate.getFullYear() === itemDate.getFullYear() &&
                          subDate.getMonth() === itemDate.getMonth() &&
                          subDate.getDate() === itemDate.getDate();
        if (!isSameDay) return false;
        
        if (selectedGoalId !== "all") {
          return sub.goal_id === selectedGoalId;
        } else {
          return goals.some(g => g.id === sub.goal_id);
        }
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
  }, [goals, submissions, selectedGoalId, currentCalendarMonth]);

  const monthLabel = currentCalendarMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const shareText = `I am on a ${longestStreakLabel} habit streak on GoalHyke! 🚀 Keeping my commitments alive and building consistency. Join me!`;
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";

  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

  const shareLinks = [
    {
      name: "WhatsApp",
      url: `https://api.whatsapp.com/send?text=${encodedText}`,
      icon: (
        <svg className="w-4 h-4 fill-current text-[#25D366]" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.688 1.97 14.218 1.05 11.587 1.05 6.155 1.05 1.733 5.42 1.73 10.85c-.001 1.702.447 3.367 1.3 4.85l-.995 3.635 3.737-.98c1.476.804 3.008 1.229 4.585 1.229zm9.693-6.853c-.26-.13-1.534-.757-1.771-.843-.237-.086-.41-.13-.582.13-.172.26-.668.843-.819.1.017-.15.151-.336.336-.582.13-.26.26-.54.388-.813.13-.27.065-.508-.033-.703-.097-.195-.771-1.859-1.056-2.548-.278-.669-.559-.579-.769-.59-.199-.01-.427-.012-.655-.012-.228 0-.6.086-.913.43-.313.344-1.194 1.166-1.194 2.842s1.22 3.293 1.39 3.52c.17.227 2.399 3.662 5.811 5.132.812.35 1.446.559 1.94.716.816.26 1.559.223 2.146.136.655-.098 1.534-.627 1.75-1.234.216-.607.216-1.127.151-1.234-.064-.108-.237-.195-.497-.325z"/>
        </svg>
      )
    },
    {
      name: "Twitter (X)",
      url: `https://twitter.com/intent/tweet?text=${encodedText}`,
      icon: (
        <svg className="w-4 h-4 fill-current text-[#000000]" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    {
      name: "Facebook",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      icon: (
        <svg className="w-4 h-4 fill-current text-[#1877F2]" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
    {
      name: "LinkedIn",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: (
        <svg className="w-4 h-4 fill-current text-[#0A66C2]" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
      )
    },
    {
      name: "Instagram",
      action: "instagram",
      icon: (
        <svg className="w-4 h-4 fill-current text-[#E1306C]" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
      )
    },
    {
      name: "Copy Message",
      action: "copy",
      icon: (
        <svg className="w-4 h-4 fill-none stroke-current text-[#4f5b7f]" viewBox="0 0 24 24">
          <path d="M8 16H6a4 4 0 010-8h2M16 8h2a4 4 0 110 8h-2M8 12h8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
  ];

  const handleShareClick = (link: any) => {
    if (link.action === "instagram") {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
        setShareToast({ show: true, message: "Streak message copied! Open Instagram to paste and share on your story/post." });
        setTimeout(() => setShareToast(null), 5000);
      }).catch(err => {
        console.error("Failed to copy text: ", err);
      });
    } else if (link.action === "copy") {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
        setShareToast({ show: true, message: "Streak message and link copied to clipboard!" });
        setTimeout(() => setShareToast(null), 5000);
      }).catch(err => {
        console.error("Failed to copy text: ", err);
      });
    } else {
      window.open(link.url, "_blank", "noopener,noreferrer");
    }
    setIsShareOpen(false);
  };

  return (
    <main className="min-h-screen bg-white">
      <NavigationRegistered />

      {rechargeToast?.show && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-300 bg-gradient-to-r from-[#4169e1] to-[#7655fb] text-white px-6 py-4 rounded-[20px] shadow-[0_12px_40px_rgba(118,85,251,0.3)] border border-white/20 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center font-bold text-white text-[14px] shrink-0">
            ✓
          </div>
          <div>
            <p className="font-bold text-[15px]">Recharge Successful!</p>
            <p className="text-[12px] opacity-90">+{rechargeToast.amount} tokens have been added to your balance.</p>
          </div>
        </div>
      )}

      {shareToast?.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-300 bg-gradient-to-r from-[#7655fb] to-[#4169e1] text-white px-6 py-4 rounded-[20px] shadow-[0_12px_40px_rgba(118,85,251,0.3)] border border-white/20 flex items-center gap-3 max-w-[90vw] text-left">
          <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center font-bold text-white text-[14px] shrink-0">
            ✓
          </div>
          <div>
            <p className="font-bold text-[15px]">Streak Shared!</p>
            <p className="text-[12px] opacity-90">{shareToast.message}</p>
          </div>
        </div>
      )}

      <div className="gh-page-end-gap mx-auto flex max-w-[1280px] min-h-[calc(100vh-110px)]">
        <Sidebar />

        <div className="flex-1 bg-[#f4f6fb]">
          <div className="px-8 py-8">
            <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-gray-100 pb-6">
              <div>
                <h1 className="text-[32px] font-bold text-[#262525]">
                  Welcome, {firstName || "User"}!
                </h1>
                <p className="text-[14px] text-[#6f6f78] mt-1">
                  Here is a snapshot of your habits and commitments today.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 shrink-0">
                {/* High-attention Token Balance Card */}
                <Link 
                  href="/get-token"
                  className="flex items-center gap-4 bg-gradient-to-r from-[#7655fb] to-[#4169e1] rounded-[24px] px-6 text-white shadow-[0_12px_36px_rgba(118,85,251,0.22)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer h-[62px] md:min-w-[240px]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/10 text-[#FFD166] backdrop-blur-md shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 7H5C3.89543 7 3 7.89543 3 9V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V9C21 7.89543 20.1046 7 19 7Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 13H7C8.10457 13 9 12.1046 9 11V9C9 7.89543 8.10457 7 7 7H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 13H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="17" cy="13" r="1" fill="currentColor"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/70">
                      Your GoalHyke Balance
                    </div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-[26px] font-black leading-none text-[#FFD166]">{tokenBalance}</span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-white/80">Tokens Left</span>
                    </div>
                  </div>
                </Link>

                {/* Create Goal Button */}
                <Link href="/set-goal">
                  <button className="flex items-center justify-center gap-[8px] bg-[#7655fb] text-white rounded-[24px] px-6 h-[62px] font-bold text-[15px] hover:bg-[#6445e0] hover:translate-y-[-1px] transition-all duration-300 shadow-lg shadow-[#7655fb]/20 cursor-pointer">
                    <span>Create a goal</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </Link>
              </div>
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
                          {streakDays}
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
                          <Link
                            key={goal.id}
                            href={`/goals/${goal.id}`}
                            className="rounded-[22px] border border-[#ececf2] bg-[#fcfcff] p-4 shadow-[0_10px_24px_rgba(24,33,77,0.05)] transition-all hover:-translate-y-0.5 hover:border-[#cfc7ff] hover:shadow-[0_14px_32px_rgba(24,33,77,0.08)]"
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
                          </Link>
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

                  {/* Consistency Calendar Widget */}
                  <div className="rounded-[30px] border border-white/60 bg-white p-6 shadow-[0_24px_70px_rgba(24,33,77,0.08)]">
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="text-[22px] font-bold text-[#262525]">
                          Consistency Calendar
                        </h3>
                        <p className="text-[12px] text-gray-500 font-secondary mt-0.5">
                          Track daily show-up history
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {/* Goal selector filter */}
                        <select
                          value={selectedGoalId}
                          onChange={(e) => setSelectedGoalId(e.target.value)}
                          className="h-[38px] rounded-[10px] border border-[#ccd2e2] bg-white px-3 text-[12px] font-semibold text-[#262525] outline-none focus:border-[#7655fb] cursor-pointer"
                        >
                          <option value="all">All Goals</option>
                          {goals.map(g => (
                            <option key={g.id} value={g.id}>{g.title}</option>
                          ))}
                        </select>

                        {/* Month navigation */}
                        <div className="flex items-center gap-1.5 bg-[#f4f6fb] p-1 rounded-full">
                          <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white hover:bg-gray-100 text-[#7655fb] shadow-sm transition-all cursor-pointer font-bold"
                          >
                            ‹
                          </button>
                          <span className="text-[12px] font-bold text-[#262525] px-1 whitespace-nowrap">
                            {monthLabel}
                          </span>
                          <button
                            type="button"
                            onClick={handleNextMonth}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white hover:bg-gray-100 text-[#7655fb] shadow-sm transition-all cursor-pointer font-bold"
                          >
                            ›
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase text-[#9a99a3] font-bold border-t border-gray-100 pt-4">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <span key={day}>{day}</span>
                      ))}
                    </div>

                    <div className="mt-3 grid grid-cols-7 gap-y-3 text-center text-[12px] text-[#3f3e4a]">
                      {calendarDays.map((item, index) => {
                        let cellClass = "relative flex flex-col items-center justify-center h-9 w-9 mx-auto rounded-full transition-all ";
                        let statusIndicator = null;
                        
                        if (item.muted) {
                          cellClass += "text-[#c8c7cf] cursor-default";
                        } else {
                          cellClass += "hover:bg-gray-100 cursor-pointer ";
                          if (item.status === "verified") {
                            cellClass += "bg-green-50 text-green-700 font-bold border border-green-200";
                            statusIndicator = <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />;
                          } else if (item.status === "failed" || item.status === "missed") {
                            cellClass += "bg-red-50 text-red-700 font-medium border border-red-200";
                            statusIndicator = <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />;
                          } else if (item.status === "pending") {
                            cellClass += "bg-amber-50 text-amber-700 font-medium border border-amber-200";
                            statusIndicator = <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />;
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

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="relative rounded-[24px] border border-white/60 bg-white p-5 shadow-[0_18px_44px_rgba(24,33,77,0.08)] flex flex-col justify-between">
                      <div>
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

                      <div className="mt-4 pt-3 border-t border-gray-100/70">
                        <p className="text-[10px] font-bold text-[#8f8e98] uppercase tracking-wider mb-2">
                          Share Streak
                        </p>
                        <div className="flex items-center gap-2">
                          {shareLinks.map((link) => (
                            <button
                              key={link.name}
                              onClick={() => handleShareClick(link)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4f6fb] hover:bg-[#7655fb]/10 transition-all duration-300 cursor-pointer"
                              title={`Share on ${link.name}`}
                            >
                              <span className="shrink-0 transition-transform hover:scale-110">{link.icon}</span>
                            </button>
                          ))}
                        </div>
                      </div>
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
                          Token balance
                        </span>
                        <span className="text-[18px] font-bold text-[#7655fb]">
                          {tokenBalance} tokens
                        </span>
                      </div>
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
