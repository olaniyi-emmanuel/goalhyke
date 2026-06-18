"use client";

import React, { useState, useEffect } from "react";
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

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const defaultGoals: Goal[] = [
    {
      id: "mock-1",
      title: "Exercise Regularly",
      category: "Exercise regularly",
      start_date: "2024-11-01",
      end_date: "2025-01-24",
      description: "Build a solid fitness routine by exercising at least once a week.",
      week_current: 2,
      week_total: 12,
      is_completed: false,
    },
    {
      id: "mock-2",
      title: "Grow Wealth",
      category: "Grow wealth",
      start_date: "2024-10-15",
      end_date: "2025-10-15",
      description: "Save and invest at least 15% of monthly income.",
      week_current: 8,
      week_total: 52,
      is_completed: false,
    },
    {
      id: "mock-3",
      title: "Master Next.js",
      category: "Master tech skill",
      start_date: "2024-09-01",
      end_date: "2024-10-01",
      description: "Learn Next.js App Router and server actions in depth.",
      week_current: 4,
      week_total: 4,
      is_completed: true,
    }
  ];

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
            setGoals(defaultGoals);
          }
        } else {
          setGoals(defaultGoals);
        }
      } catch (err) {
        console.error("Error fetching goals, using fallback:", err);
        setGoals(defaultGoals);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
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
                    className="gh-input pl-10 pr-4 text-[14px] font-secondary"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </div>
                </div>

                <div className="w-full md:w-[200px]">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="gh-select cursor-pointer pr-10 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23717070%22%20stroke-width%3D%222%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_16px_center] bg-no-repeat text-[14px] font-secondary"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Goals Lists */}
              {loading ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                  <p className="text-gray-500 font-secondary text-sm">Loading your Goals...</p>
                </div>
              ) : (
                <div className="flex flex-col gap-8 flex-1">
                  
                  {/* Active Goals Section */}
                  <div>
                    <h3 className="text-[18px] font-bold text-[#262525] font-secondary mb-4 flex items-center gap-2">
                      <span>Active</span>
                      <span className="bg-indigo-100 text-[#7655fb] text-[12px] font-bold px-2 py-0.5 rounded-full">
                        {activeGoals.length}
                      </span>
                    </h3>

                    {activeGoals.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeGoals.map((goal) => (
                          <div
                            key={goal.id}
                            className="gh-panel-soft p-5 flex flex-col justify-between min-h-[180px] hover:shadow-md transition-all relative overflow-hidden"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-[10px] font-bold text-[#7655fb] tracking-wider uppercase font-secondary">
                                  {goal.category}
                                </span>
                              </div>
                              <h4 className="text-[16px] font-bold text-[#262525] font-secondary mt-1">
                                {goal.title}
                              </h4>
                              {goal.description && (
                                <p className="text-[12px] text-gray-500 font-secondary mt-1.5 line-clamp-2">
                                  {goal.description}
                                </p>
                              )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-gray-500 font-secondary">
                                Week {goal.week_current || 1} of {goal.week_total || 12}
                              </span>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/goals/${goal.id}`}
                                  className="gh-btn-secondary px-3.5 py-1.5 text-[11px] hover:bg-[#f7f8ff] cursor-pointer"
                                >
                                  Open Goal
                                </Link>
                                <button
                                  onClick={() => handleToggleComplete(goal.id)}
                                  className="gh-btn-secondary px-3.5 py-1.5 text-[11px] hover:bg-[#f7f8ff] cursor-pointer"
                                >
                                  Mark Complete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 border-2 border-dashed border-gray-100 rounded-[16px] text-center flex flex-col items-center justify-center gap-3">
                        <p className="text-gray-400 font-secondary text-sm">No active goals found matching the filters.</p>
                        <Link href="/set-goal">
                          <button className="gh-btn-primary px-5 py-2.5 text-[13px] hover:shadow-lg cursor-pointer">
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
                      <span className="bg-green-100 text-green-700 text-[12px] font-bold px-2 py-0.5 rounded-full">
                        {completedGoals.length}
                      </span>
                    </h3>

                    {completedGoals.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {completedGoals.map((goal) => (
                          <div
                            key={goal.id}
                            className="gh-panel-soft p-5 flex flex-col justify-between min-h-[160px] opacity-75 hover:opacity-90 transition-opacity"
                          >
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase font-secondary">
                                {goal.category}
                              </span>
                              <h4 className="text-[16px] font-bold text-[#717070] line-through font-secondary mt-1">
                                {goal.title}
                              </h4>
                              {goal.description && (
                                <p className="text-[12px] text-gray-400 font-secondary mt-1">
                                  {goal.description}
                                </p>
                              )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between">
                              <span className="text-[11px] font-bold text-green-600 font-secondary flex items-center gap-1">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                Completed
                              </span>
                              <div className="flex items-center gap-3">
                                <Link
                                  href={`/goals/${goal.id}`}
                                  className="text-[#7655fb] hover:text-[#6445e0] text-[11px] font-bold font-secondary transition-colors"
                                >
                                  Open Goal
                                </Link>
                                <button
                                  onClick={() => handleToggleComplete(goal.id)}
                                  className="text-[#8f8e98] hover:text-[#7655fb] text-[11px] font-bold font-secondary transition-colors"
                                >
                                  Re-activate
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 border border-dashed border-gray-100 rounded-[16px] text-center">
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
