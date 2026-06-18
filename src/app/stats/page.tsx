"use client";

import React, { useState, useEffect, useMemo } from "react";
import NavigationRegistered from "@/components/NavigationRegistered";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

interface Goal {
  id: string;
  title: string;
  category: string;
  streak: number;
  progress: number;
  status: string;
}

export default function Stats() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedGoalFilter, setSelectedGoalFilter] = useState("all");

  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        // 1. Fetch user's token balance
        const { data: profileData } = await supabase
          .from("profiles")
          .select("tokens")
          .eq("id", user.id)
          .single();
        if (profileData) {
          setTokenBalance(profileData.tokens ?? 0);
        }

        // 2. Fetch user's goals
        const { data: goalsData } = await supabase
          .from("goals")
          .select("*")
          .eq("user_id", user.id);
        
        if (goalsData) {
          setGoals(
            goalsData.map((g: any) => ({
              id: g.id,
              title: g.title,
              category: g.category,
              streak: g.streak ?? 0,
              progress: g.progress ?? 0,
              status: g.status,
            }))
          );
        }

        // 3. Fetch transactions
        const { data: txData } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (txData) {
          setTransactions(txData);
        }

      } catch (e) {
        console.error("Failed to load stats data:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStatsData();
  }, []);

  const filteredGoals = useMemo(() => {
    if (selectedGoalFilter === "all") return goals;
    return goals.filter((g) => g.id === selectedGoalFilter);
  }, [goals, selectedGoalFilter]);

  const currentStreak = useMemo(() => {
    if (filteredGoals.length === 0) return 0;
    return Math.max(...filteredGoals.map((g) => g.streak), 0);
  }, [filteredGoals]);

  const consistencyIndex = useMemo(() => {
    if (filteredGoals.length === 0) return 0;
    const totalProgress = filteredGoals.reduce((sum, g) => sum + g.progress, 0);
    return Math.round((totalProgress / filteredGoals.length) * 10) / 10;
  }, [filteredGoals]);

  const statCards = [
    {
      label: "Accountability Streak",
      value: goals.length > 0 ? `${currentStreak} Days` : "12 Days",
      subtext: goals.length > 0 ? `Max streak: ${currentStreak} Days` : "Personal best: 24 Days",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
        </svg>
      )
    },
    {
      label: "Consistency Index",
      value: goals.length > 0 ? `${consistencyIndex}%` : "94.2%",
      subtext: goals.length > 0 ? "Calculated across filtered goals" : "+2.4% vs last week",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      )
    },
    {
      label: "GoalHyke Balance",
      value: `${tokenBalance} HYKE`,
      subtext: "Current wallet balance",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-500">
          <circle cx="12" cy="12" r="8"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="12" y1="3" x2="12" y2="21"/>
        </svg>
      )
    }
  ];

  const weeklyData = useMemo(() => {
    const base = goals.length > 0 ? consistencyIndex : 90;
    return [
      { day: "Mon", score: Math.max(10, Math.round(base * 0.95)) },
      { day: "Tue", score: Math.max(10, Math.round(base * 0.85)) },
      { day: "Wed", score: Math.min(100, Math.max(10, Math.round(base * 1.0))) },
      { day: "Thu", score: Math.max(10, Math.round(base * 0.65)) },
      { day: "Fri", score: Math.min(100, Math.max(10, Math.round(base * 1.0))) },
      { day: "Sat", score: Math.max(10, Math.round(base * 0.9)) },
      { day: "Sun", score: Math.max(10, Math.round(base * 0.95)) }
    ];
  }, [consistencyIndex, goals]);

  const ledgerHistory = useMemo(() => {
    if (transactions.length > 0) {
      return transactions.slice(0, 5).map((tx) => ({
        id: tx.id,
        activity: `Recharged package (${tx.amount_tokens} tokens)`,
        change: `+${tx.amount_tokens} HYKE`,
        date: new Date(tx.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric"
        })
      }));
    }
    return [
      { id: "tx-1", activity: "Completed week 1 (Exercise Regularly)", change: "+50 HYKE", date: "Nov 09, 2024" },
      { id: "tx-2", activity: "Referee verification for Adesorotosin", change: "+20 HYKE", date: "Nov 07, 2024" },
      { id: "tx-3", activity: "Daily Check-in Streak Reward", change: "+10 HYKE", date: "Nov 06, 2024" },
      { id: "tx-4", activity: "Completed week 1 (Grow Wealth)", change: "+50 HYKE", date: "Nov 02, 2024" }
    ];
  }, [transactions]);

  const accountTier = useMemo(() => {
    if (tokenBalance >= 1000) {
      return { name: "Diamond Hiker", max: 2000, progress: Math.min(100, (tokenBalance / 2000) * 100), desc: "Top tier Hiker status unlocked!" };
    } else if (tokenBalance >= 300) {
      return { name: "Gold Hiker", max: 1000, progress: Math.min(100, (tokenBalance / 1000) * 100), desc: `Next tier: Diamond Hiker (+${1000 - tokenBalance} tokens)` };
    } else {
      return { name: "Bronze Hiker", max: 300, progress: Math.min(100, (tokenBalance / 300) * 100), desc: `Next tier: Gold Hiker (+${300 - tokenBalance} tokens)` };
    }
  }, [tokenBalance]);

  return (
    <main className="min-h-screen bg-white">
      <NavigationRegistered />

      <div className="flex max-w-[1280px] mx-auto min-h-[calc(100vh-110px)]">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 bg-[#f4f6fb] flex flex-col">
          {/* Header */}
          <DashboardHeader />

          {/* Content */}
          <div className="flex-1 p-8 pt-0 flex flex-col lg:flex-row gap-8">
            {/* Left Column - Stats Detail & Chart */}
            <div className="gh-panel flex-1 p-6 md:p-8 h-full flex flex-col gap-8">
              
              {/* Header Title */}
              <div>
                <h1 className="text-[28px] font-bold text-[#262525] font-secondary">
                  Performance Statistics
                </h1>
                <p className="text-gray-500 text-sm font-secondary mt-1">
                  Analyze your performance trends and accountability rewards
                </p>
              </div>

              {/* Goal selector filter */}
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <span className="text-[13px] font-bold text-gray-400 font-secondary uppercase tracking-wider">
                  Goal Filter
                </span>
                <select
                  value={selectedGoalFilter}
                  onChange={(e) => setSelectedGoalFilter(e.target.value)}
                  className="gh-select cursor-pointer max-w-[220px] h-[45px] text-[13px] font-secondary bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23717070%22%20stroke-width%3D%222%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-8"
                >
                  <option value="all">All Active Goals</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-20 text-[#7655fb]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7655fb]"></div>
                  <span className="ml-3 text-[14px] font-medium font-secondary">Loading statistics...</span>
                </div>
              ) : (
                <>
                  {/* Grid of Key Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {statCards.map((card, idx) => (
                      <div
                        key={idx}
                        className="gh-panel-soft p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-bold font-secondary text-gray-500 uppercase tracking-wide">
                            {card.label}
                          </span>
                          <div className="p-2 bg-white rounded-full shadow-inner border border-gray-100">
                            {card.icon}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-[24px] font-black text-[#262525] font-secondary leading-none">
                            {card.value}
                          </h3>
                          <span className="text-[11px] text-gray-400 font-secondary mt-1.5 block">
                            {card.subtext}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Custom CSS Chart Container */}
                  <div className="flex flex-col gap-4 mt-2">
                    <h3 className="text-[17px] font-bold text-[#262525] font-secondary">
                      Weekly Progress Activity
                    </h3>

                    <div className="gh-panel-soft p-6 flex flex-col justify-end min-h-[280px]">
                      {/* Grid Lines */}
                      <div className="flex-1 flex flex-col justify-between relative">
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                          <div className="border-b border-gray-200/40 w-full h-0" />
                          <div className="border-b border-gray-200/40 w-full h-0" />
                          <div className="border-b border-gray-200/40 w-full h-0" />
                          <div className="border-b border-gray-200/40 w-full h-0" />
                        </div>

                        {/* Bars Grid */}
                        <div className="flex items-end justify-between h-[180px] px-2 sm:px-6 relative z-10">
                          {weeklyData.map((data, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-2 group w-[10%]">
                              {/* Tooltip */}
                              <div className="opacity-0 group-hover:opacity-100 bg-[#262525] text-white text-[10px] font-bold font-secondary px-2 py-1 rounded-[4px] absolute -translate-y-[28px] transition-opacity pointer-events-none">
                                {data.score}%
                              </div>
                              
                              {/* Bar Fill */}
                              <div 
                                style={{ height: `${data.score}%` }} 
                                className="bg-gradient-to-t from-[#7655fb] to-[#4169e1] w-full rounded-full group-hover:shadow-[0_0_12px_rgba(118,85,251,0.4)] transition-all duration-300"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Day Labels */}
                      <div className="flex justify-between border-t border-gray-200 pt-3 mt-1 px-2 sm:px-6 text-[11px] font-bold text-gray-500 font-secondary">
                        {weeklyData.map((data, idx) => (
                          <span key={idx} className="w-[10%] text-center">{data.day}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>

            {/* Right Column - Rewards Ledger */}
            <div className="w-full lg:w-[350px] shrink-0 flex flex-col gap-6">
              
              {/* Token Summary details card */}
              <div className="gh-panel p-6 flex flex-col gap-5">
                <h3 className="font-bold text-[#262525] text-[17px] font-secondary">
                  Token Ledger
                </h3>
                <p className="text-[13px] text-gray-500 font-secondary leading-relaxed">
                  Earn tokens (HYKE) by verifying check-ins, completing consistency goals, and validating accountability requests.
                </p>

                <div className="flex flex-col gap-3">
                  {ledgerHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 gap-2"
                    >
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[13px] font-bold text-[#262525] font-secondary truncate">
                          {item.activity}
                        </span>
                        <span className="text-[10px] text-gray-400 font-secondary">
                          {item.date}
                        </span>
                      </div>
                      <span className="text-[13px] font-bold font-secondary text-[#7655fb] shrink-0">
                        {item.change}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Level up summary */}
              <div className="gh-panel p-6 flex flex-col gap-4">
                <h3 className="font-bold text-[#262525] text-[17px] font-secondary">
                  Account Tier
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600 font-black shrink-0">
                    {accountTier.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[15px] font-bold text-[#262525] font-secondary">
                      {accountTier.name}
                    </span>
                    <span className="text-[11px] text-gray-400 font-secondary">
                      {accountTier.desc}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-gray-100 h-2.5 rounded-full mt-2 relative overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${accountTier.progress}%` }}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
