"use client";

import React, { useState, useEffect, useRef } from "react";
import NavigationRegistered from "@/components/NavigationRegistered";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import RightSidebar from "@/components/RightSidebar";
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
  week_current?: number;
  week_total?: number;
  is_completed?: boolean;
}

function getCategoryStyle(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("weight") || normalized.includes("health")) {
    return { bg: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" };
  }
  if (normalized.includes("wealth") || normalized.includes("finance")) {
    return { bg: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" };
  }
  if (normalized.includes("career") || normalized.includes("academically") || normalized.includes("tech")) {
    return { bg: "bg-indigo-50 text-indigo-700 border-indigo-100", dot: "bg-indigo-500" };
  }
  if (normalized.includes("read") || normalized.includes("spirit")) {
    return { bg: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" };
  }
  return { bg: "bg-purple-50 text-purple-700 border-purple-100", dot: "bg-purple-500" };
}

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const categories = [
    "Grow wealth",
    "Lose weight",
    "Master tech skill",
    "Exercise regularly",
    "Strengthen your spirit",
    "Level up your career",
    "Excel academically",
    "Read more",
    "Stay healthy",
  ];

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from("goals")
            .select("*")
            .eq("user_id", user.id);

          if (error) throw error;

          if (data && data.length > 0) {
            const mappedGoals = data.map((g: any) => ({
              id: g.id,
              title: g.title,
              category: g.category,
              start_date: g.start_date,
              end_date: g.end_date,
              description: g.description,
              week_current: 1,
              week_total: 12,
              is_completed: false,
            }));
            setGoals(mappedGoals);
          } else {
            setGoals([]);
          }
        } else {
          setGoals([]);
        }
      } catch (err) {
        console.error("Error fetching goals:", err);
        setGoals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleComplete = (id: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          return { ...g, is_completed: !g.is_completed };
        }
        return g;
      })
    );
  };

  const filteredGoals = goals.filter((g) => {
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (g.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || g.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const activeGoals = filteredGoals.filter((g) => !g.is_completed);
  const completedGoals = filteredGoals.filter((g) => g.is_completed);

  return (
    <main className="min-h-screen bg-[#f4f6fb]">
      <NavigationRegistered />

      <div className="flex max-w-[1280px] mx-auto min-h-[calc(100vh-110px)]">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 bg-[#f4f6fb] flex flex-col">
          {/* Header */}
          <DashboardHeader />

          {/* Content */}
          <div className="flex-1 p-8 pt-0 flex gap-8">
            <div className="gh-panel flex-1 p-6 md:p-8 h-full flex flex-col">
              
              {/* Title Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h1 className="text-[28px] font-bold text-[#262525] font-secondary">
                    My Goals
                  </h1>
                  <p className="text-gray-500 text-sm font-secondary mt-1">
                    Manage and track your active habit commitments
                  </p>
                </div>
              </div>

              {/* Filters Block */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search goals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-[46px] w-full rounded-[12px] border border-[#ccd2e2] bg-white pl-11 pr-4 text-[14px] text-[#262525] outline-none transition-all placeholder:text-[#9fa6bb] focus:border-[#7655fb] focus:ring-2 focus:ring-[#f2edff]"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </div>
                </div>

                <div className="w-full md:w-[240px]" ref={dropdownRef}>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                      className={`flex h-[46px] w-full items-center justify-between rounded-[12px] border bg-white px-4 text-[14px] text-left font-secondary outline-none transition-all ${
                        isCategoryOpen ? "border-[#7655fb] ring-2 ring-[#f2edff]" : "border-[#ccd2e2] hover:border-[#b0b8c9]"
                      }`}
                    >
                      <span className="text-[#262525]">
                        {categoryFilter === "all" ? "All Categories" : categoryFilter}
                      </span>
                      <div className={`text-[#717070] transition-transform duration-200 ${isCategoryOpen ? "rotate-180" : ""}`}>
                        <svg
                          width="12"
                          height="8"
                          viewBox="0 0 12 8"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1 1.5L6 6.5L11 1.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </button>

                    {isCategoryOpen && (
                      <div className="absolute right-0 top-[52px] z-50 w-full max-h-[260px] overflow-y-auto rounded-[12px] border border-[#ccd2e2] bg-white py-1 shadow-[0_12px_36px_rgba(24,33,77,0.12)]">
                        <button
                          type="button"
                          onClick={() => {
                            setCategoryFilter("all");
                            setIsCategoryOpen(false);
                          }}
                          className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[14px] transition-colors ${
                            categoryFilter === "all"
                              ? "bg-[#f2edff] text-[#7655fb] font-medium"
                              : "text-[#262525] hover:bg-[#f7f8ff]"
                          }`}
                        >
                          <span>All Categories</span>
                          {categoryFilter === "all" && (
                            <svg width="12" height="9" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1 5L5 9L13 1" stroke="#7655fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setCategoryFilter(cat);
                              setIsCategoryOpen(false);
                            }}
                            className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[14px] transition-colors ${
                              categoryFilter === cat
                                ? "bg-[#f2edff] text-[#7655fb] font-medium"
                                : "text-[#262525] hover:bg-[#f7f8ff]"
                            }`}
                          >
                            <span>{cat}</span>
                            {categoryFilter === cat && (
                              <svg width="12" height="9" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 5L5 9L13 1" stroke="#7655fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Goals Lists */}
              {loading ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-[#7655fb] border-t-transparent animate-spin"></div>
                  <p className="text-gray-500 font-secondary text-sm">Loading your Goals...</p>
                </div>
              ) : (
                <div className="flex flex-col gap-8 flex-1">
                  
                  {/* Active Goals Section */}
                  <div>
                    <h3 className="text-[18px] font-bold text-[#262525] font-secondary mb-4 flex items-center gap-2">
                      <span>Active</span>
                      <span className="bg-[#f2edff] text-[#7655fb] text-[12px] font-bold px-2.5 py-0.5 rounded-full">
                        {activeGoals.length}
                      </span>
                    </h3>

                    {activeGoals.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {activeGoals.map((goal) => {
                          const catStyle = getCategoryStyle(goal.category);
                          const currentWeek = goal.week_current || 1;
                          const totalWeeks = goal.week_total || 12;
                          const progressPercentage = Math.min(100, Math.max(0, (currentWeek / totalWeeks) * 100));

                          return (
                            <div
                              key={goal.id}
                              className="group relative flex flex-col justify-between rounded-[20px] border border-[#eceff7] bg-white p-6 shadow-[0_4px_20px_rgba(24,33,77,0.02)] transition-all duration-300 hover:-translate-y-1 hover:border-[#7655fb]/30 hover:shadow-[0_16px_36px_rgba(118,85,251,0.08)]"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide font-secondary ${catStyle.bg}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${catStyle.dot}`} />
                                    {goal.category}
                                  </span>
                                  <span className="text-[11px] text-gray-400 font-medium font-secondary">
                                    {formatDate(goal.start_date)}
                                  </span>
                                </div>
                                
                                <h4 className="text-[18px] font-bold text-[#262525] font-secondary mt-3 group-hover:text-[#7655fb] transition-colors line-clamp-1">
                                  {goal.title}
                                </h4>
                                
                                {goal.description && (
                                  <p className="text-[13px] leading-relaxed text-gray-500 font-secondary mt-2 line-clamp-2">
                                    {goal.description}
                                  </p>
                                )}
                              </div>

                              <div className="mt-5">
                                {/* Sleek Progress Bar */}
                                <div className="flex items-center justify-between text-[11px] font-semibold text-[#5a6075] font-secondary mb-1.5">
                                  <span>Week {currentWeek} of {totalWeeks}</span>
                                  <span>{Math.round(progressPercentage)}%</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-[#e9edf8]">
                                  <div
                                    className="h-full bg-gradient-to-r from-[#8a6dff] to-[#7655fb] transition-all duration-500 ease-out"
                                    style={{ width: `${progressPercentage}%` }}
                                  />
                                </div>

                                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                                  <span className="text-[11px] font-medium text-gray-400 font-secondary">
                                    Ends: {formatDate(goal.end_date)}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <Link
                                      href={`/goals/${goal.id}`}
                                      className="gh-btn-secondary px-3.5 py-2 text-[12px] font-medium hover:bg-[#f7f8ff] hover:text-[#7655fb] cursor-pointer"
                                    >
                                      Open Goal
                                    </Link>
                                    <button
                                      onClick={() => handleToggleComplete(goal.id)}
                                      className="flex items-center justify-center rounded-full bg-[#f2edff] text-[#7655fb] border border-[#f2edff] px-3.5 py-2 text-[12px] font-medium transition-all hover:bg-[#7655fb] hover:text-white cursor-pointer"
                                    >
                                      Complete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-12 border-2 border-dashed border-gray-200 rounded-[20px] text-center flex flex-col items-center justify-center gap-4 bg-white/40">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f2edff] text-[#7655fb]">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v8" />
                            <path d="M8 12h8" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[#262525] font-semibold font-secondary text-[16px]">No active goals set yet</p>
                          <p className="text-gray-400 font-secondary text-sm mt-1">Kickstart your consistency journey by setting your first goal.</p>
                        </div>
                        <Link href="/set-goal">
                          <button className="gh-btn-primary px-6 py-3 text-[14px] hover:shadow-lg cursor-pointer">
                            Set New Goal
                          </button>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Completed Goals Section */}
                  <div>
                    <h3 className="text-[18px] font-bold text-[#262525] font-secondary mb-4 flex items-center gap-2">
                      <span>Completed</span>
                      <span className="bg-emerald-100 text-emerald-700 text-[12px] font-bold px-2.5 py-0.5 rounded-full">
                        {completedGoals.length}
                      </span>
                    </h3>

                    {completedGoals.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {completedGoals.map((goal) => {
                          const catStyle = getCategoryStyle(goal.category);
                          return (
                            <div
                              key={goal.id}
                              className="relative flex flex-col justify-between rounded-[20px] border border-[#eceff7] bg-white/70 p-6 shadow-[0_4px_20px_rgba(24,33,77,0.01)] opacity-75 hover:opacity-100 transition-all duration-300"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide font-secondary ${catStyle.bg} opacity-60`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${catStyle.dot}`} />
                                    {goal.category}
                                  </span>
                                  <span className="text-[11px] text-gray-400 font-medium font-secondary">
                                    {formatDate(goal.start_date)}
                                  </span>
                                </div>
                                <h4 className="text-[18px] font-bold text-gray-400 line-through font-secondary mt-3">
                                  {goal.title}
                                </h4>
                                {goal.description && (
                                  <p className="text-[13px] text-gray-400 font-secondary mt-1.5 line-clamp-2">
                                    {goal.description}
                                  </p>
                                )}
                              </div>

                              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-[12px] font-bold text-emerald-600 font-secondary flex items-center gap-1.5">
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                      <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                  </span>
                                  Completed
                                </span>
                                <div className="flex items-center gap-3">
                                  <Link
                                    href={`/goals/${goal.id}`}
                                    className="text-[#7655fb] hover:text-[#6445e0] text-[12px] font-semibold font-secondary transition-colors"
                                  >
                                    Open Details
                                  </Link>
                                  <button
                                    onClick={() => handleToggleComplete(goal.id)}
                                    className="text-[#8f8e98] hover:text-[#7655fb] text-[12px] font-semibold font-secondary transition-colors"
                                  >
                                    Re-activate
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-8 border border-dashed border-gray-200 rounded-[20px] text-center bg-white/40">
                        <p className="text-gray-400 font-secondary text-sm">No completed goals found.</p>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>

            {/* Right Sidebar - Suggestions */}
            <RightSidebar />
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
