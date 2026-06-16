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
    <main className="min-h-screen gh-page-bg">
      <NavigationRegistered />

      <div className="gh-shell flex min-h-[calc(100vh-110px)]">
        <Sidebar />

        <div className="flex-1 flex flex-col">
          <DashboardHeader />

          <div className="flex-1 p-4 pt-0 md:p-8 md:pt-0 flex flex-col lg:flex-row gap-8">
            <div className="gh-panel flex-1 h-full p-6 md:p-8 flex flex-col gap-8">
              <div>
                <span className="gh-badge mb-4">Profile controls</span>
                <h1 className="text-[32px] font-bold text-[#262525]">
                  Account Settings
                </h1>
                <p className="mt-2 text-[15px] leading-7 text-[#666f85]">
                  Manage your public profile and default configuration rules
                </p>
              </div>

              {successMessage && (
                <div className="rounded-[18px] border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleProfileSave} className="gh-panel-soft flex flex-col gap-4 p-6">
                <h3 className="text-[20px] font-bold text-[#262525]">
                  Profile Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2 text-[13px]">
                    <label className="font-bold uppercase tracking-[0.12em] text-[#7a7f90]">Display Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="gh-input"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2 text-[13px]">
                    <label className="font-bold uppercase tracking-[0.12em] text-[#7a7f90]">Username</label>
                    <input
                      type="text"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      className="gh-input"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-[13px]">
                  <label className="font-bold uppercase tracking-[0.12em] text-[#7a7f90]">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="gh-input cursor-not-allowed bg-[#f1f3f8] text-[#717070]"
                  />
                </div>

                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="gh-btn-primary px-6 py-3 text-[14px] disabled:opacity-50"
                  >
                    Save Profile
                  </button>
                </div>
              </form>

              <form onSubmit={handlePrefsSave} className="gh-panel-soft flex flex-col gap-4 p-6">
                <h3 className="text-[20px] font-bold text-[#262525]">
                  Referee Defaults
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2 text-[13px]">
                    <label className="font-bold uppercase tracking-[0.12em] text-[#7a7f90]">Default Referee Name</label>
                    <input
                      type="text"
                      value={refereePrefs.defaultRefereeName}
                      onChange={(e) => setRefereePrefs({ ...refereePrefs, defaultRefereeName: e.target.value })}
                      className="gh-input"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2 text-[13px]">
                    <label className="font-bold uppercase tracking-[0.12em] text-[#7a7f90]">Default Referee Email</label>
                    <input
                      type="email"
                      value={refereePrefs.defaultRefereeEmail}
                      onChange={(e) => setRefereePrefs({ ...refereePrefs, defaultRefereeEmail: e.target.value })}
                      className="gh-input"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-[13px]">
                  <label className="font-bold uppercase tracking-[0.12em] text-[#7a7f90]">Report Grace Period (Hours)</label>
                  <select
                    value={refereePrefs.gracePeriod}
                    onChange={(e) => setRefereePrefs({ ...refereePrefs, gracePeriod: Number(e.target.value) })}
                    className="gh-select cursor-pointer pr-10"
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
                    className="gh-btn-primary px-6 py-3 text-[14px] disabled:opacity-50"
                  >
                    Save Preferences
                  </button>
                </div>
              </form>

            </div>

            {/* Right Column - Configurations */}
            <div className="w-full lg:w-[350px] shrink-0 flex flex-col gap-6">
              <div className="gh-panel p-6 flex flex-col gap-5">
                <h3 className="font-bold text-[#262525] text-[20px]">
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
              <div className="gh-panel p-6 flex flex-col gap-4 font-secondary">
                <h3 className="font-bold text-[#262525] text-[20px]">
                  Preferences
                </h3>
                
                <button
                  onClick={() => alert("Change password function triggered.")}
                  className="gh-btn-secondary w-full py-3 text-[14px]"
                >
                  Change Password
                </button>

                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to deactivate your account? This action is permanent.")) {
                      alert("Deactivation request sent.");
                    }
                  }}
                  className="w-full rounded-full border border-red-100 py-3 text-[14px] font-bold text-red-500 transition-all hover:bg-red-50"
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
