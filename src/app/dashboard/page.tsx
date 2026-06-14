"use client";

import React, { useState, useEffect } from "react";
import NavigationRegistered from "@/components/NavigationRegistered";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import Footer from "@/components/Footer";
import Image from "next/image";
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
  commit_text?: string;
  successful_periods?: number;
  unsuccessful_periods?: number;
  last_reported?: string;
  next_report_due?: string;
  next_report_time?: string;
  referee_name?: string;
  referee_email?: string;
  is_completed?: boolean;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  
  // Referee state (persisted in localStorage)
  const [referee, setReferee] = useState({
    name: "Adesorotosin",
    email: "referee@goalhyke.com",
    avatar: "/images/nav-avatar.png",
  });
  const [isEditingReferee, setIsEditingReferee] = useState(false);
  const [tempReferee, setTempReferee] = useState({ name: "", email: "" });

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date(2024, 10, 9)); // Default to Nov 9, 2024 per mockup
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2024, 10, 9));

  // Video clips state (mock)
  const [clips, setClips] = useState<{ name: string; url: string; date: string }[]>([
    { name: "Week 1 Workout Check-in", url: "#", date: "Nov 07, 2024" }
  ]);
  const [isUploading, setIsUploading] = useState(false);

  // Default fallback goal (matches Figma mockup details)
  const defaultGoal: Goal = {
    id: "featured-mock-goal",
    title: "Exercise Regularly",
    category: "Exercise regularly",
    start_date: "2024-11-01",
    end_date: "2025-01-24",
    description: "Build a solid fitness routine by exercising at least once a week.",
    week_current: 1,
    week_total: 12,
    commit_text: "Exercise 1 day each week",
    successful_periods: 0,
    unsuccessful_periods: 0,
    last_reported: "No report submitted",
    next_report_due: "February 19",
    next_report_time: "12:00 AM CET",
    referee_name: "Adesorotosin",
    referee_email: "referee@goalhyke.com",
    is_completed: false,
  };

  useEffect(() => {
    // Load referee from localStorage if available
    const savedReferee = localStorage.getItem("goalhyke_referee");
    if (savedReferee) {
      try {
        setReferee(JSON.parse(savedReferee));
      } catch (e) {
        console.error("Failed to load referee from localstorage", e);
      }
    }

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
              commit_text: g.category || "Commit to this habit",
              successful_periods: 0,
              unsuccessful_periods: 0,
              last_reported: "No report submitted",
              next_report_due: "February 19",
              next_report_time: "12:00 AM CET",
              is_completed: false,
            }));
            setGoals(mappedGoals);
          } else {
            setGoals([defaultGoal]);
          }
        } else {
          setGoals([defaultGoal]);
        }
      } catch (err) {
        console.error("Error fetching goals, using fallback:", err);
        setGoals([defaultGoal]);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  // Calendar logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    // Days from previous month to pad the start
    const prevMonthDays = [];
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      prevMonthDays.push({
        day: prevMonthLastDate - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDate - i)
      });
    }

    // Days for current month
    const currentMonthDays = [];
    for (let i = 1; i <= totalDays; i++) {
      currentMonthDays.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }

    // Days for next month to pad the grid to a multiple of 7
    const totalGridDays = prevMonthDays.length + currentMonthDays.length;
    const nextMonthDays = [];
    const nextPadding = totalGridDays % 7 === 0 ? 0 : 7 - (totalGridDays % 7);
    for (let i = 1; i <= nextPadding; i++) {
      nextMonthDays.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const calendarDays = getDaysInMonth(currentDate);

  // Referee submit handler
  const handleRefereeSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempReferee.name || !tempReferee.email) return;
    const updated = {
      ...referee,
      name: tempReferee.name,
      email: tempReferee.email
    };
    setReferee(updated);
    localStorage.setItem("goalhyke_referee", JSON.stringify(updated));
    setIsEditingReferee(false);
  };

  // Mock video upload handler
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsUploading(true);
      
      setTimeout(() => {
        setClips((prev) => [
          {
            name: file.name.substring(0, 25) + (file.name.length > 25 ? "..." : ""),
            url: URL.createObjectURL(file),
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
          },
          ...prev,
        ]);
        setIsUploading(false);
      }, 1500);
    }
  };

  const activeGoals = goals.filter((g) => !g.is_completed);
  const completedGoals = goals.filter((g) => g.is_completed);

  return (
    <main className="min-h-screen bg-white">
      <NavigationRegistered />

      <div className="flex max-w-[1280px] mx-auto min-h-[calc(100vh-110px)]">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 bg-[#f4f6fb] flex flex-col">
          {/* Header */}
          <DashboardHeader />

          {/* Core Content Grid */}
          <div className="flex-1 p-8 pt-0 flex flex-col lg:flex-row gap-8">
            
            {/* Left Section - Goal Cards */}
            <div className="flex-1 flex flex-col gap-6">
              
              {/* Active / Completed Custom Tabs (Figma layout) */}
              <div className="flex items-center gap-6 pb-2">
                <button
                  onClick={() => setActiveTab("active")}
                  className={`px-5 py-2.5 rounded-[12px] font-secondary text-[15px] font-bold transition-all ${
                    activeTab === "active"
                      ? "bg-[#f3f6ff] text-[#262525] shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Active
                </button>
                <div className="w-[1px] h-6 bg-gray-300" />
                <button
                  onClick={() => setActiveTab("completed")}
                  className={`px-5 py-2.5 rounded-[12px] font-secondary text-[15px] font-bold transition-all ${
                    activeTab === "completed"
                      ? "bg-[#f3f6ff] text-[#262525] shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Completed
                </button>
              </div>

              {/* Goals Feed */}
              {loading ? (
                <div className="bg-white rounded-[20px] p-12 text-center shadow-sm flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                  <p className="text-gray-500 font-secondary text-sm">Loading your Goals...</p>
                </div>
              ) : activeTab === "active" ? (
                activeGoals.length > 0 ? (
                  activeGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className="bg-[#fafafa] rounded-[16px] border border-[#e8e8e8] shadow-sm p-6 flex flex-col gap-6 relative overflow-hidden"
                    >
                      {/* Top labels */}
                      <div>
                        <span className="text-[11px] font-bold text-[#7655fb] tracking-wider uppercase font-secondary">
                          Featured
                        </span>
                        <h2 className="text-[19px] font-bold text-[#262525] font-secondary mt-1">
                          {goal.title}
                        </h2>
                      </div>

                      {/* Progress bar */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[12px] font-bold text-[#262525] font-secondary">
                          <span>Week {goal.week_current || 1} of {goal.week_total || 12}</span>
                        </div>
                        
                        {/* 12-segment progress bar */}
                        <div className="flex items-center gap-[3px] w-full mt-1">
                          {Array.from({ length: goal.week_total || 12 }).map((_, idx) => {
                            const isFilled = idx < (goal.week_current || 1);
                            return (
                              <div
                                key={idx}
                                className={`h-[13px] flex-1 rounded-[3px] transition-colors ${
                                  isFilled 
                                    ? "bg-[#4f0c81]" 
                                    : "border border-[#5a5a5a] bg-transparent"
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Detail Dates */}
                      <div className="flex justify-between items-center text-[12px] text-[#262525] font-secondary border-t border-[#d9d6d6] pt-4 mt-2">
                        <div>
                          <p className="text-gray-500 text-[11px]">Next report due:</p>
                          <p className="font-semibold">{goal.next_report_due || "February 28"} at {goal.next_report_time || "12:00 PM"}</p>
                        </div>
                      </div>

                      {/* Commit details layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#d9d6d6]">
                        <div className="flex flex-col gap-2 font-secondary text-[13px] text-[#262525]">
                          <p className="font-semibold text-gray-500 uppercase text-[11px] tracking-wider">I commit to:</p>
                          <p className="font-medium text-[14px]">{goal.commit_text || "Exercise 1 day each week"}</p>
                          
                          <div className="flex flex-col gap-1 mt-3">
                            <p>
                              Successful Periods: <span className="font-bold ml-1">{goal.successful_periods ?? 0}</span>
                            </p>
                            <p>
                              Unsuccessful Periods: <span className="font-bold ml-1">{goal.unsuccessful_periods ?? 0}</span>
                            </p>
                          </div>
                        </div>

                        {/* Yellow warning reporting block */}
                        <div className="bg-[#fefab8] rounded-[8px] p-4 flex flex-col gap-2 text-[12px] font-secondary text-[#262525] shadow-inner relative overflow-hidden border border-[#efebb1]">
                          <div className="h-2 w-full bg-[#efebb1] absolute top-0 left-0" />
                          <div className="pt-1">
                            <p className="font-medium">
                              Last reported: <span className="font-bold">{goal.last_reported || "No report submitted"}</span>
                            </p>
                            <div className="h-[1px] bg-[#b7b5b5] my-2" />
                            <p className="font-medium text-gray-600">Next report due:</p>
                            <p className="font-bold text-[18px] text-[#262525] mt-1">
                              {goal.next_report_due || "February 19"}
                            </p>
                            <p className="text-[11px] text-gray-500">{goal.next_report_time || "12:00 AM CET"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-end gap-3 mt-4 border-t border-gray-100 pt-4">
                        <button
                          onClick={() => setSelectedGoal(goal)}
                          className="px-6 py-2 border border-[#7655fb] rounded-[24px] text-[#7655fb] hover:bg-[#7655fb] hover:text-white transition-all text-[14px] font-bold font-secondary"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-[20px] p-12 text-center shadow-sm">
                    <p className="text-gray-500 font-secondary">No active goals found. Create one to begin your hyke!</p>
                  </div>
                )
              ) : completedGoals.length > 0 ? (
                completedGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="bg-[#fafafa] rounded-[16px] border border-[#e8e8e8] shadow-sm p-6 flex flex-col gap-4"
                  >
                    <h2 className="text-[19px] font-bold text-[#262525] font-secondary">
                      {goal.title}
                    </h2>
                    <p className="text-sm text-gray-600 font-secondary">{goal.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="bg-green-100 text-green-800 text-[12px] font-bold font-secondary px-3 py-1 rounded-[50px]">
                        Completed
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-[20px] p-12 text-center shadow-sm">
                  <p className="text-gray-500 font-secondary">No completed goals yet. Complete your first goal to unlock achievements!</p>
                </div>
              )}
            </div>

            {/* Right Section - Calendar, Referee, Video Upload */}
            <div className="w-full lg:w-[350px] shrink-0 flex flex-col gap-6">
              
              {/* 1. Calendar Panel */}
              <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={handlePrevMonth}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <svg width="6" height="10" viewBox="0 0 6 10" fill="none" className="rotate-180">
                      <path d="M1 9L5 5L1 1" stroke="#262525" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div className="text-center font-secondary flex flex-col items-center">
                    <span className="font-bold text-[#262525] text-[14px]">
                      {monthNames[currentDate.getMonth()]}, {currentDate.getFullYear()}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-0.5">
                      {selectedDate.toDateString()}
                    </span>
                  </div>
                  <button 
                    onClick={handleNextMonth}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                      <path d="M1 9L5 5L1 1" stroke="#262525" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 font-secondary mt-2">
                  <span>SUN</span>
                  <span>MON</span>
                  <span>TUE</span>
                  <span>WED</span>
                  <span>THU</span>
                  <span>FRI</span>
                  <span>SAT</span>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mt-2">
                  {calendarDays.map((dayObj, idx) => {
                    const isSelected = selectedDate.getDate() === dayObj.day && 
                                     selectedDate.getMonth() === dayObj.date.getMonth() &&
                                     selectedDate.getFullYear() === dayObj.date.getFullYear();
                    const isToday = new Date().getDate() === dayObj.day && 
                                  new Date().getMonth() === dayObj.date.getMonth() &&
                                  new Date().getFullYear() === dayObj.date.getFullYear();

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDate(dayObj.date)}
                        className={`h-[32px] w-full rounded-full flex items-center justify-center text-[11px] font-secondary font-medium transition-all relative ${
                          !dayObj.isCurrentMonth ? "text-gray-300" : "text-[#141d33]"
                        } ${
                          isSelected 
                            ? "bg-[#7655fb] text-white font-bold" 
                            : isToday 
                            ? "border border-[#7655fb] text-[#7655fb]" 
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {dayObj.day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. GoalHyke Clip Panel */}
              <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="font-bold text-[#262525] text-[15px] font-secondary flex items-center gap-1.5">
                    <span>GoalHyke</span>
                    <span className="text-[#7655fb]">Clip</span>
                  </h3>
                  <label className="cursor-pointer bg-[#7655fb] hover:bg-[#6445e0] text-white text-[12px] font-bold font-secondary px-3 py-1.5 rounded-[16px] transition-colors flex items-center gap-1">
                    <span>Add</span>
                    <input 
                      type="file" 
                      accept="video/*" 
                      onChange={handleVideoUpload} 
                      className="hidden" 
                      disabled={isUploading}
                    />
                  </label>
                </div>

                {isUploading ? (
                  <div className="py-6 flex flex-col items-center justify-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    <p className="text-[12px] text-gray-500 font-secondary">Uploading verification clip...</p>
                  </div>
                ) : clips.length > 0 ? (
                  <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {clips.map((clip, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-[#f9faff] rounded-[8px] border border-gray-100">
                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#7655fb]">
                              <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
                            </svg>
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-[12px] font-semibold font-secondary text-[#262525] truncate">
                              {clip.name}
                            </span>
                            <span className="text-[9px] text-gray-400 font-secondary">
                              {clip.date}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => setClips((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center border-2 border-dashed border-gray-100 rounded-[12px] flex flex-col items-center justify-center gap-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300">
                      <polygon points="23 7 16 12 23 17 23 7"/>
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                    <p className="text-[12px] text-gray-400 font-secondary">No verification videos uploaded.</p>
                  </div>
                )}
              </div>

              {/* 3. Referee Panel */}
              <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="font-bold text-[#262525] text-[15px] font-secondary">
                    Referee
                  </h3>
                  {!isEditingReferee && (
                    <button 
                      onClick={() => {
                        setTempReferee({ name: referee.name, email: referee.email });
                        setIsEditingReferee(true);
                      }}
                      className="text-[#7655fb] hover:text-[#6445e0] text-[12px] font-bold font-secondary transition-colors"
                    >
                      Change
                    </button>
                  )}
                </div>

                {isEditingReferee ? (
                  <form onSubmit={handleRefereeSave} className="flex flex-col gap-3 font-secondary text-[12px]">
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-gray-500">Referee Name</label>
                      <input 
                        type="text" 
                        value={tempReferee.name}
                        onChange={(e) => setTempReferee({...tempReferee, name: e.target.value})}
                        className="w-full border border-gray-200 rounded-[8px] px-3 py-1.5 focus:outline-none focus:border-[#7655fb] text-[#262525]"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-gray-500">Referee Email</label>
                      <input 
                        type="email" 
                        value={tempReferee.email}
                        onChange={(e) => setTempReferee({...tempReferee, email: e.target.value})}
                        className="w-full border border-gray-200 rounded-[8px] px-3 py-1.5 focus:outline-none focus:border-[#7655fb] text-[#262525]"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button 
                        type="button"
                        onClick={() => setIsEditingReferee(false)}
                        className="px-3 py-1.5 border border-gray-200 text-gray-500 rounded-[6px] hover:bg-gray-50 font-bold"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-3 py-1.5 bg-[#7655fb] text-white rounded-[6px] hover:bg-[#6445e0] font-bold shadow-sm"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-[40px] h-[40px] rounded-full overflow-hidden border border-gray-200 shrink-0">
                        <Image
                          src={referee.avatar}
                          alt={referee.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold font-secondary text-[#262525]">
                          {referee.name}
                        </span>
                        <span className="text-[11px] text-gray-400 font-secondary truncate max-w-[170px]">
                          {referee.email}
                        </span>
                      </div>
                    </div>
                    <div className="bg-[#f0f0f0] rounded-full p-2.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#717070" strokeWidth="2.5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </div>

      <Footer />

      {/* Goal Details Modal */}
      {selectedGoal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[20px] shadow-2xl max-w-[600px] w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <span className="bg-indigo-50 text-[#7655fb] text-[11px] font-bold font-secondary px-3 py-1 rounded-[50px] uppercase">
                {selectedGoal.category}
              </span>
              <button 
                onClick={() => setSelectedGoal(null)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <h3 className="text-[22px] font-bold font-secondary text-[#262525] mb-2">{selectedGoal.title}</h3>
            {selectedGoal.description && (
              <p className="text-[14px] text-gray-600 font-secondary mb-6">{selectedGoal.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-100 py-4 mb-6">
              <div className="font-secondary">
                <p className="text-[11px] text-gray-400">Start Date</p>
                <p className="text-[14px] font-semibold text-[#262525]">{new Date(selectedGoal.start_date).toLocaleDateString()}</p>
              </div>
              <div className="font-secondary">
                <p className="text-[11px] text-gray-400">End Date</p>
                <p className="text-[14px] font-semibold text-[#262525]">{new Date(selectedGoal.end_date).toLocaleDateString()}</p>
              </div>
              <div className="font-secondary">
                <p className="text-[11px] text-gray-400">Referee</p>
                <p className="text-[14px] font-semibold text-[#262525]">{referee.name}</p>
              </div>
              <div className="font-secondary">
                <p className="text-[11px] text-gray-400">Commitment</p>
                <p className="text-[14px] font-semibold text-[#262525]">{selectedGoal.commit_text || "1 day/week"}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  // Mock toggle completion state
                  const updatedGoals = goals.map((g) => {
                    if (g.id === selectedGoal.id) {
                      return { ...g, is_completed: !g.is_completed };
                    }
                    return g;
                  });
                  setGoals(updatedGoals);
                  setSelectedGoal(null);
                }}
                className="px-6 py-2.5 bg-[#7655fb] hover:bg-[#6445e0] text-white rounded-[24px] transition-all text-[14px] font-bold font-secondary shadow-md hover:shadow-lg"
              >
                Mark as {selectedGoal.is_completed ? "Active" : "Completed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
