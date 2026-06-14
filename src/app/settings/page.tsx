"use client";

import React, { useState, useEffect } from "react";
import NavigationRegistered from "@/components/NavigationRegistered";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

export default function Settings() {
  const [profile, setProfile] = useState({
    name: "Olaniyi Emmanuel",
    email: "user@example.com",
    username: "goalhyker_emmanuel",
  });

  const [notifications, setNotifications] = useState({
    checkInAlerts: true,
    verificationAlerts: true,
    buddyMilestones: false,
  });

  const [refereePrefs, setRefereePrefs] = useState({
    defaultRefereeName: "Adesorotosin",
    defaultRefereeEmail: "referee@goalhyke.com",
    gracePeriod: 24, // hours
  });

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load referee from localStorage if available
    const savedReferee = localStorage.getItem("goalhyke_referee");
    if (savedReferee) {
      try {
        const parsed = JSON.parse(savedReferee);
        setRefereePrefs((prev) => ({
          ...prev,
          defaultRefereeName: parsed.name,
          defaultRefereeEmail: parsed.email,
        }));
      } catch (e) {
        console.error(e);
      }
    }

    const fetchProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setProfile({
            name: user.user_metadata?.name || "Olaniyi Emmanuel",
            email: user.email || "user@example.com",
            username: user.user_metadata?.username || "goalhyker_emmanuel",
          });
        }
      } catch (e) {
        console.error("Failed to load profile:", e);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage(null);

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    }, 1200);
  };

  const handlePrefsSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage(null);

    // Save referee defaults to localStorage to keep it in sync with dashboard
    const refereeObj = {
      name: refereePrefs.defaultRefereeName,
      email: refereePrefs.defaultRefereeEmail,
      avatar: "/images/nav-avatar.png",
    };
    localStorage.setItem("goalhyke_referee", JSON.stringify(refereeObj));

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage("Referee preferences saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    }, 1200);
  };

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
            {/* Left Column - Forms */}
            <div className="flex-1 bg-white rounded-[20px] p-6 md:p-8 h-full flex flex-col gap-8">
              
              {/* Header Title */}
              <div>
                <h1 className="text-[28px] font-bold text-[#262525] font-secondary">
                  Account Settings
                </h1>
                <p className="text-gray-500 text-sm font-secondary mt-1">
                  Manage your public profile and default configuration rules
                </p>
              </div>

              {successMessage && (
                <div className="p-3 text-sm text-green-600 bg-green-50 rounded-[8px] border border-green-200">
                  {successMessage}
                </div>
              )}

              {/* Form 1: Profile Details */}
              <form onSubmit={handleProfileSave} className="flex flex-col gap-4 border-b border-gray-100 pb-8">
                <h3 className="text-[17px] font-bold text-[#262525] font-secondary">
                  Profile Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 font-secondary text-[13px]">
                    <label className="font-bold text-[#262525]">Display Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="h-[46px] px-3.5 rounded-[10px] border border-[#E0E0E0] bg-[#FAFAFA] text-[#262525]"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 font-secondary text-[13px]">
                    <label className="font-bold text-[#262525]">Username</label>
                    <input
                      type="text"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      className="h-[46px] px-3.5 rounded-[10px] border border-[#E0E0E0] bg-[#FAFAFA] text-[#262525]"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 font-secondary text-[13px]">
                  <label className="font-bold text-[#262525]">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="h-[46px] px-3.5 rounded-[10px] border border-[#E0E0E0] bg-gray-100 text-[#717070] cursor-not-allowed"
                  />
                </div>

                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#7655fb] hover:bg-[#6445e0] text-white rounded-[24px] px-6 py-2.5 text-[13px] font-bold font-secondary shadow-md hover:shadow-lg transition-all"
                  >
                    Save Profile
                  </button>
                </div>
              </form>

              {/* Form 2: Default Referee Configuration */}
              <form onSubmit={handlePrefsSave} className="flex flex-col gap-4">
                <h3 className="text-[17px] font-bold text-[#262525] font-secondary">
                  Referee Defaults
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 font-secondary text-[13px]">
                    <label className="font-bold text-[#262525]">Default Referee Name</label>
                    <input
                      type="text"
                      value={refereePrefs.defaultRefereeName}
                      onChange={(e) => setRefereePrefs({ ...refereePrefs, defaultRefereeName: e.target.value })}
                      className="h-[46px] px-3.5 rounded-[10px] border border-[#E0E0E0] bg-[#FAFAFA] text-[#262525]"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 font-secondary text-[13px]">
                    <label className="font-bold text-[#262525]">Default Referee Email</label>
                    <input
                      type="email"
                      value={refereePrefs.defaultRefereeEmail}
                      onChange={(e) => setRefereePrefs({ ...refereePrefs, defaultRefereeEmail: e.target.value })}
                      className="h-[46px] px-3.5 rounded-[10px] border border-[#E0E0E0] bg-[#FAFAFA] text-[#262525]"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 font-secondary text-[13px]">
                  <label className="font-bold text-[#262525]">Report Grace Period (Hours)</label>
                  <select
                    value={refereePrefs.gracePeriod}
                    onChange={(e) => setRefereePrefs({ ...refereePrefs, gracePeriod: Number(e.target.value) })}
                    className="h-[46px] px-4 rounded-[10px] border border-[#E0E0E0] bg-[#FAFAFA] text-[#262525] focus:outline-none focus:border-[#7655fb] transition-colors cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23717070%22%20stroke-width%3D%222%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[right_16px_center] bg-no-repeat pr-10"
                  >
                    <option value={12}>12 Hours</option>
                    <option value={24}>24 Hours</option>
                    <option value={48}>48 Hours</option>
                    <option value={72}>72 Hours</option>
                  </select>
                </div>

                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#7655fb] hover:bg-[#6445e0] text-white rounded-[24px] px-6 py-2.5 text-[13px] font-bold font-secondary shadow-md hover:shadow-lg transition-all"
                  >
                    Save Preferences
                  </button>
                </div>
              </form>

            </div>

            {/* Right Column - Configurations */}
            <div className="w-full lg:w-[350px] shrink-0 flex flex-col gap-6">
              
              {/* Card 1: Notifications Settings */}
              <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
                <h3 className="font-bold text-[#262525] text-[17px] font-secondary">
                  Notifications
                </h3>

                <div className="flex flex-col gap-4 font-secondary text-[13px]">
                  {/* Toggle 1 */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-[#262525]">Email check-in alerts</span>
                      <span className="text-[11px] text-gray-400">Reminders for active goals</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.checkInAlerts}
                      onChange={(e) => setNotifications({ ...notifications, checkInAlerts: e.target.checked })}
                      className="w-4 h-4 text-[#7655fb] border-gray-300 rounded focus:ring-[#7655fb]"
                    />
                  </label>

                  {/* Toggle 2 */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-[#262525]">Referee requests</span>
                      <span className="text-[11px] text-gray-400">When buddies link you as referee</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.verificationAlerts}
                      onChange={(e) => setNotifications({ ...notifications, verificationAlerts: e.target.checked })}
                      className="w-4 h-4 text-[#7655fb] border-gray-300 rounded focus:ring-[#7655fb]"
                    />
                  </label>

                  {/* Toggle 3 */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-[#262525]">Buddy milestones</span>
                      <span className="text-[11px] text-gray-400">Weekly success accomplishments</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.buddyMilestones}
                      onChange={(e) => setNotifications({ ...notifications, buddyMilestones: e.target.checked })}
                      className="w-4 h-4 text-[#7655fb] border-gray-300 rounded focus:ring-[#7655fb]"
                    />
                  </label>
                </div>
              </div>

              {/* Card 2: Security Actions */}
              <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6 flex flex-col gap-4 font-secondary">
                <h3 className="font-bold text-[#262525] text-[17px]">
                  Preferences
                </h3>
                
                <button
                  onClick={() => alert("Change password function triggered.")}
                  className="w-full py-2.5 border border-gray-200 text-[#262525] hover:bg-gray-50 rounded-[20px] text-[13px] font-bold transition-all text-center"
                >
                  Change Password
                </button>

                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to deactivate your account? This action is permanent.")) {
                      alert("Deactivation request sent.");
                    }
                  }}
                  className="w-full py-2.5 border border-red-100 hover:bg-red-50 text-red-500 rounded-[20px] text-[13px] font-bold transition-all text-center"
                >
                  Deactivate Account
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
