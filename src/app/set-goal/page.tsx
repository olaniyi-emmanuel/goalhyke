"use client";

import React from "react";
import NavigationRegistered from "@/components/NavigationRegistered";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import GoalCreationForm from "@/components/GoalCreationForm";
import RightSidebar from "@/components/RightSidebar";
import Footer from "@/components/Footer";

export default function SetGoal() {
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
            <div className="flex-1 bg-white rounded-[20px] p-8 h-full flex flex-col items-center">
              <h1 className="text-[28px] md:text-[32px] font-bold text-center mt-4 mb-8 text-[#262525] font-secondary">
                Set Your Goal
              </h1>

              <GoalCreationForm />
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
