"use client";

import React, { useState, useEffect } from "react";
import NavigationRegistered from "@/components/NavigationRegistered";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import SearchableCountrySelect from "@/components/SearchableCountrySelect";
import { countries, countryStates } from "@/lib/countries";
import InitialsAvatar from "@/components/InitialsAvatar";

const resizeImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to convert image to blob."));
            }
          }, "image/jpeg", 0.85);
        } else {
          reject(new Error("Failed to get canvas context."));
        }
      };
      img.onerror = () => reject(new Error("Failed to load image."));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function Settings() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    username: "",
    avatarUrl: "",
    country: "Nigeria",
    phoneNumber: "",
    state: "",
  });

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(false);

  const [refereePrefs, setRefereePrefs] = useState({
    defaultRefereeName: "Adesorotosin",
    defaultRefereeEmail: "referee@goalhyke.com",
    gracePeriod: 24, // hours
  });

  const [statesList, setStatesList] = useState<string[]>([]);
  const [isStatesLoading, setIsStatesLoading] = useState(false);

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

    const fetchProfileAndPrefs = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: dbProfile } = await supabase
            .from("profiles")
            .select("country, full_name, username, avatar_url, phone_number, state")
            .eq("id", user.id)
            .maybeSingle();

          const dbPhone = dbProfile?.phone_number || user.user_metadata?.phone_number || "";
          let parsedPhone = dbPhone;
          let matchedCountryName = dbProfile?.country || user.user_metadata?.country || "Nigeria";

          if (dbPhone.startsWith("+")) {
            const sortedCountriesByPrefix = [...countries].sort((a, b) => b.dial_code.length - a.dial_code.length);
            const matchedCountry = sortedCountriesByPrefix.find(c => dbPhone.startsWith(c.dial_code));
            if (matchedCountry) {
              matchedCountryName = matchedCountry.name;
              parsedPhone = dbPhone.substring(matchedCountry.dial_code.length).trim();
            }
          }

          setProfile({
            name: dbProfile?.full_name || user.user_metadata?.name || user.user_metadata?.full_name || "",
            email: user.email || "",
            username: dbProfile?.username || user.user_metadata?.username || "",
            avatarUrl: dbProfile?.avatar_url || user.user_metadata?.avatar_url || "",
            country: matchedCountryName,
            phoneNumber: parsedPhone,
            state: dbProfile?.state || user.user_metadata?.state || "",
          });

          // Fetch user notification preferences
          const { data: prefs } = await supabase
            .from("notification_preferences")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (prefs) {
            setEmailEnabled(prefs.email_enabled);
            setPushEnabled(prefs.push_enabled);
          } else {
            // Setup default record if missing
            await supabase.from("notification_preferences").insert({
              user_id: user.id,
              email_enabled: true,
              push_enabled: false
            });
            setEmailEnabled(true);
            setPushEnabled(false);
          }
        }
      } catch (e) {
        console.error("Failed to load profile and preferences:", e);
      }
    };
    fetchProfileAndPrefs();
  }, []);

  // Synchronize country selection changes and sanitize state/province values
  useEffect(() => {
    let active = true;
    const fetchStates = async () => {
      const localPresets = countryStates[profile.country] || [];
      setStatesList(localPresets);
      
      if (localPresets.length > 0 && !localPresets.includes(profile.state)) {
        setProfile(prev => ({ ...prev, state: localPresets[0] }));
      } else if (localPresets.length === 0) {
        const isPreset = Object.values(countryStates).some(list => list.includes(profile.state));
        if (isPreset) {
          setProfile(prev => ({ ...prev, state: "" }));
        }
      }

      setIsStatesLoading(true);
      try {
        const res = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ country: profile.country }),
        });
        const data = await res.json();
        
        if (active && !data.error && data.data?.states) {
          const fetchedList = data.data.states.map((s: any) => s.name);
          setStatesList(fetchedList);
          if (fetchedList.length > 0) {
            if (!fetchedList.includes(profile.state)) {
              setProfile(prev => ({ ...prev, state: fetchedList[0] }));
            }
          } else {
            const isPreset = Object.values(countryStates).some(list => list.includes(profile.state));
            if (isPreset) {
              setProfile(prev => ({ ...prev, state: "" }));
            }
          }
        }
      } catch (e) {
        console.warn("API state fetch failed, using local fallback or text input:", e);
      } finally {
        if (active) {
          setIsStatesLoading(false);
        }
      }
    };

    fetchStates();
    return () => {
      active = false;
    };
  }, [profile.country]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          alert("Please log in to change your avatar.");
          return;
        }

        const resizedBlob = await resizeImage(file);
        
        // Upload to storage bucket 'avatars'
        const fileExt = "jpg";
        const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, resizedBlob, {
            upsert: true,
            contentType: "image/jpeg",
          });

        if (uploadError) {
          if (uploadError.message.includes("not found") || uploadError.message.includes("does not exist") || (uploadError as any).status === 404) {
            throw new Error(
              "Storage bucket 'avatars' not found. Please make sure to create a public storage bucket named 'avatars' in your Supabase project dashboard, or execute the SQL migration."
            );
          }
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        setProfile((prev) => ({
          ...prev,
          avatarUrl: publicUrl,
        }));
      } catch (err) {
        console.error(err);
        alert(err instanceof Error ? err.message : "Could not upload image.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No active user session found.");
      }

      const selectedCountryObj = countries.find(c => c.name === profile.country) || countries.find(c => c.name === "Nigeria") || countries[0];
      const dialCode = selectedCountryObj.dial_code;
      const fullPhoneNumber = `${dialCode} ${profile.phoneNumber}`.trim();

      // 1. Update Supabase Auth Session Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name: profile.name,
          full_name: profile.name,
          username: profile.username,
          avatar_url: profile.avatarUrl,
          country: profile.country,
          phone_number: fullPhoneNumber,
          state: profile.state,
        },
      });

      if (authError) {
        throw authError;
      }

      // 2. Update Postgres database profiles table
      const { error: dbError } = await supabase
        .from("profiles")
        .update({
          full_name: profile.name,
          username: profile.username,
          avatar_url: profile.avatarUrl,
          country: profile.country,
          phone_number: fullPhoneNumber,
          state: profile.state,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (dbError) {
        throw dbError;
      }

      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Profile save error:", err);
      const msg = err instanceof Error 
        ? err.message 
        : (err && typeof err === "object" && "message" in err) 
          ? (err as any).message 
          : JSON.stringify(err);
      alert("Failed to update profile: " + msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrefsSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage(null);

    // Save referee defaults to localStorage to keep it in sync with dashboard
    const refereeObj = {
      name: refereePrefs.defaultRefereeName,
      email: refereePrefs.defaultRefereeEmail,
      avatar: "",
    };
    localStorage.setItem("goalhyke_referee", JSON.stringify(refereeObj));

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage("Referee preferences saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    }, 1200);
  };

  const handleToggleEmail = async (enabled: boolean) => {
    setEmailEnabled(enabled);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("notification_preferences")
          .upsert({
            user_id: user.id,
            email_enabled: enabled,
            updated_at: new Date().toISOString()
          });
      }
    } catch (err) {
      console.error("Failed to save email preference:", err);
    }
  };

  const handleTogglePush = async (enabled: boolean) => {
    setPrefsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in first.");
        setPrefsLoading(false);
        return;
      }

      if (enabled) {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          alert("Browser push notifications are not supported in this browser.");
          setPrefsLoading(false);
          return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          alert("Notification permission was denied.");
          setPrefsLoading(false);
          return;
        }

        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/"
        });

        await navigator.serviceWorker.ready;

        const applicationServerKey = urlBase64ToUint8Array("BMmQ0FebFhkN6PjT5xf3RL65sRbxHCML0419RGrH87rOdYhWN2VUPn_-KyqMOYzdZh34K5P-MyojI0E01aJMO0k");
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey
        });

        const subscriptionJson = subscription.toJSON();
        const p256dh = subscriptionJson.keys?.p256dh;
        const auth = subscriptionJson.keys?.auth;

        if (!subscription.endpoint || !p256dh || !auth) {
          throw new Error("Invalid push subscription returned by browser.");
        }

        const { error: subErr } = await supabase
          .from("push_subscriptions")
          .upsert({
            user_id: user.id,
            endpoint: subscription.endpoint,
            p256dh: p256dh,
            auth: auth
          }, { onConflict: "endpoint" });

        if (subErr) throw subErr;

        const { error: prefErr } = await supabase
          .from("notification_preferences")
          .upsert({
            user_id: user.id,
            push_enabled: true,
            updated_at: new Date().toISOString()
          });

        if (prefErr) throw prefErr;

        setPushEnabled(true);
        setSuccessMessage("Push notifications registered successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", subscription.endpoint);
          }
        } catch (unsubErr) {
          console.warn("Browser unsubscribe issue:", unsubErr);
        }

        const { error: prefErr } = await supabase
          .from("notification_preferences")
          .upsert({
            user_id: user.id,
            push_enabled: false,
            updated_at: new Date().toISOString()
          });

        if (prefErr) throw prefErr;

        setPushEnabled(false);
        setSuccessMessage("Push notifications disabled.");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to toggle push notifications:", err);
      alert("Failed to configure push: " + (err instanceof Error ? err.message : JSON.stringify(err)));
    } finally {
      setPrefsLoading(false);
    }
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

                {/* Avatar Uploader Grid */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-gray-100">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[#7655fb]/20 bg-gray-50 flex items-center justify-center group shadow-sm">
                    <InitialsAvatar
                      src={profile.avatarUrl}
                      name={profile.name || profile.username || user?.email || "User"}
                      seed={user?.id}
                      size={96}
                    />
                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[11px] font-bold uppercase tracking-wider">
                      Upload
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarChange} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                  <div className="flex flex-col gap-1 text-center sm:text-left">
                    <h4 className="text-[15px] font-bold text-[#262525]">Profile Photo</h4>
                    <p className="text-[12px] text-gray-500">JPG or PNG. Max size 5MB (will be optimized automatically).</p>
                    <label className="gh-btn-secondary px-4 py-1.5 text-[12px] cursor-pointer mt-1 self-center sm:self-start">
                      Choose Image
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarChange} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2 text-[13px]">
                    <label className="font-bold uppercase tracking-[0.12em] text-[#7a7f90]">Email Address</label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="gh-input cursor-not-allowed bg-[#f1f3f8] text-[#717070]"
                    />
                  </div>

                  <div className="flex flex-col gap-2 text-[13px]">
                    <label className="font-bold uppercase tracking-[0.12em] text-[#7a7f90]">Country / Region</label>
                    <SearchableCountrySelect
                      value={profile.country}
                      onChange={(val) => setProfile({ ...profile, country: val })}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex flex-col gap-2 text-[13px]">
                    <label className="font-bold uppercase tracking-[0.12em] text-[#7a7f90]">State / Province</label>
                    {isStatesLoading ? (
                      <div className="relative flex items-center">
                        <select disabled className="gh-select cursor-not-allowed w-full bg-[#f8fafc] text-gray-400">
                          <option>Loading states from API...</option>
                        </select>
                        <div className="absolute right-10 animate-spin rounded-full h-4 w-4 border-b-2 border-[#7655fb]" />
                      </div>
                    ) : statesList.length > 0 ? (
                      <select
                        value={profile.state}
                        onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                        disabled={isLoading}
                        className="gh-select cursor-pointer w-full"
                        required
                      >
                        {statesList.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={profile.state}
                        onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                        placeholder="e.g. Lagos"
                        className="gh-input"
                        required
                      />
                    )}
                  </div>

                  <div className="flex flex-col gap-2 text-[13px]">
                    <label className="font-bold uppercase tracking-[0.12em] text-[#7a7f90]">Phone Number</label>
                    {(() => {
                      const selectedCountryObj = countries.find(c => c.name === profile.country) || countries.find(c => c.name === "Nigeria") || countries[0];
                      const dialCode = selectedCountryObj.dial_code;
                      return (
                        <div className="relative flex items-center">
                          <span className="absolute left-4 text-[14px] font-bold text-[#8b93a7] select-none border-r border-[#e4e8f2] pr-3 h-5 flex items-center justify-center font-mono">
                            {dialCode}
                          </span>
                          <input
                            type="tel"
                            value={profile.phoneNumber}
                            onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value.replace(/\D/g, "") })}
                            placeholder="Enter your phone number"
                            className="gh-input w-full"
                            style={{ paddingLeft: `${(dialCode.length * 9) + 40}px` }}
                            required
                          />
                        </div>
                      );
                    })()}
                  </div>
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
                      <span className="font-bold text-[#262525]">Email Notifications</span>
                      <span className="text-[11px] text-gray-400">Check-in alerts and updates</span>
                    </div>
                    <input
                      type="checkbox"
                      disabled={prefsLoading}
                      checked={emailEnabled}
                      onChange={(e) => handleToggleEmail(e.target.checked)}
                      className="w-4 h-4 text-[#7655fb] border-gray-300 rounded focus:ring-[#7655fb] disabled:opacity-50"
                    />
                  </label>

                  {/* Toggle 2 */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-[#262525]">Push Notifications</span>
                      <span className="text-[11px] text-gray-400">Browser and desktop system alerts</span>
                    </div>
                    <input
                      type="checkbox"
                      disabled={prefsLoading}
                      checked={pushEnabled}
                      onChange={(e) => handleTogglePush(e.target.checked)}
                      className="w-4 h-4 text-[#7655fb] border-gray-300 rounded focus:ring-[#7655fb] disabled:opacity-50"
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
