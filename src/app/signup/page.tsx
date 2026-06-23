"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, getRedirectUrl } from "@/lib/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SearchableCountrySelect from "@/components/SearchableCountrySelect";
import { countries, countryStates } from "@/lib/countries";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [stateName, setStateName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const selectedCountryObj = countries.find(c => c.name === country) || countries.find(c => c.name === "Nigeria") || countries[0];
  const dialCode = selectedCountryObj.dial_code;

  const [statesList, setStatesList] = useState<string[]>([]);
  const [isStatesLoading, setIsStatesLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const score = Object.values(rules).filter(Boolean).length;

  const unmetCriteria = [];
  if (!rules.length) unmetCriteria.push("8+ characters");
  if (!rules.uppercase) unmetCriteria.push("1+ uppercase letter");
  if (!rules.lowercase) unmetCriteria.push("1+ lowercase letter");
  if (!rules.number) unmetCriteria.push("1+ number digit");
  if (!rules.special) unmetCriteria.push("1+ special character (e.g. @$!%*?&)");

  useEffect(() => {
    let active = true;
    const fetchStates = async () => {
      const localPresets = countryStates[country] || [];
      setStatesList(localPresets);
      
      if (localPresets.length > 0 && !localPresets.includes(stateName)) {
        setStateName(localPresets[0]);
      } else if (localPresets.length === 0) {
        setStateName("");
      }

      setIsStatesLoading(true);
      try {
        const res = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ country: country }),
        });
        const data = await res.json();
        
        if (active && !data.error && data.data?.states) {
          const fetchedList = data.data.states.map((s: any) => s.name);
          setStatesList(fetchedList);
          if (fetchedList.length > 0) {
            if (!fetchedList.includes(stateName)) {
              setStateName(fetchedList[0]);
            }
          } else {
            setStateName("");
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
  }, [country]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const target = redirectTo || "/dashboard";
        router.push(target);
      }
    });

    const detectLocation = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (res.ok) {
          const data = await res.json();
          if (data.country !== "NG") {
            setCountry("Global");
          }
        } else {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (!tz.includes("Lagos") && !tz.includes("Africa/Lagos") && !tz.includes("Africa/Abidjan")) {
            setCountry("Global");
          }
        }
      } catch (e) {
        console.warn("Location detection failed, defaulting to Nigeria.", e);
      }
    };
    detectLocation();
  }, [router, redirectTo]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (score !== 5) {
      setError("Please create a strong password that meets all complexity requirements.");
      return;
    }

    setError(null);
    setIsLoading(true);
    const supabase = createClient();
    const fullPhoneNumber = `${dialCode} ${phoneNumber}`.trim();
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: email.split("@")[0],
          country: country,
          phone_number: fullPhoneNumber,
          state: stateName,
          avatar_url: "/images/nav-avatar.png",
        },
        emailRedirectTo: getRedirectUrl(),
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
    } else {
      setSuccess(true);
      setIsLoading(false);
      if (signUpData?.session) {
        const target = redirectTo || "/dashboard";
        router.push(target);
        router.refresh();
      } else {
        if (typeof window !== "undefined") {
          localStorage.setItem("signup_email", email);
        }
        router.push("/verify-email");
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    const supabase = createClient();
    
    let redirectUrl = getRedirectUrl();
    if (redirectTo) {
      const urlObj = new URL(redirectUrl);
      urlObj.searchParams.set("next", redirectTo);
      redirectUrl = urlObj.toString();
    }

    const { error: oAuthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });
    if (oAuthError) {
      setError(oAuthError.message);
    }
  };

  const handleAppleLogin = async () => {
    setError(null);
    const supabase = createClient();
    
    let redirectUrl = getRedirectUrl();
    if (redirectTo) {
      const urlObj = new URL(redirectUrl);
      urlObj.searchParams.set("next", redirectTo);
      redirectUrl = urlObj.toString();
    }

    const { error: oAuthError } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: redirectUrl,
      },
    });
    if (oAuthError) {
      setError(oAuthError.message);
    }
  };

  return (
    <main className="min-h-screen gh-page-bg">
      <Navigation />

      <div className="gh-shell px-4 py-6 md:px-6 lg:px-10 lg:py-10">
        <div className="gh-panel overflow-hidden">
          <div className="grid min-h-[calc(100vh-210px)] grid-cols-1 lg:grid-cols-[1fr_1fr]">
            <div className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#f4f7ff_0%,#f7efff_46%,#ffffff_100%)] lg:flex lg:items-center lg:justify-center">
              <div className="absolute inset-x-10 top-10 flex items-center justify-between">
                <span className="gh-badge">Start strong</span>
                <span className="rounded-full bg-white/85 px-4 py-2 text-[13px] font-semibold text-[#4f5b7f] shadow-[0_8px_24px_rgba(24,33,77,0.06)]">
                  Design goals you can keep
                </span>
              </div>
              <div className="absolute left-10 top-28 h-[180px] w-[180px] rounded-full bg-[#7655fb]/10 blur-3xl" />
              <div className="absolute bottom-10 right-12 h-[220px] w-[220px] rounded-full bg-[#4169e1]/10 blur-3xl" />
              <div className="relative h-full min-h-[780px] w-full">
                <Image
                  src="/images/signup-illustration.png"
                  alt="Goal Hyke Illustration"
                  fill
                  className="object-contain object-center scale-105"
                  priority
                />
              </div>
            </div>

            <div className="flex flex-col justify-center bg-white px-6 py-12 md:px-10 lg:px-14">
              <div className="mx-auto w-full max-w-[540px] lg:mx-0">
                <h1 className="mb-10 text-[32px] font-bold leading-[1.05] text-[#262525] md:text-[40px]">
                  Sign Up
                </h1>

                <form onSubmit={handleSignup} className="flex flex-col gap-5">
                  {error && (
                    <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-500">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="rounded-[18px] border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
                      Account created! Please check your email to verify.
                    </div>
                  )}

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#7a7f90]">
                        Full name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={isLoading}
                        className="gh-input"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#7a7f90]">
                        Email address
                      </label>
                      <input
                        type="email"
                        name="email"
                        autoComplete="username"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="gh-input"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#7a7f90]">
                        Password
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          autoComplete="new-password"
                          placeholder="Create a password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setIsPasswordFocused(true)}
                          onBlur={() => setIsPasswordFocused(false)}
                          disabled={isLoading}
                          className={`gh-input w-full pr-12 transition-all ${
                            password.length > 0
                              ? score === 5
                                ? "border-green-500 focus:border-green-600 focus:ring-green-600"
                                : score >= 3
                                ? "border-amber-400 focus:border-amber-500 focus:ring-amber-500"
                                : "border-red-500 focus:border-red-500 focus:ring-red-500"
                              : ""
                          }`}
                          required
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          onMouseDown={(e) => e.preventDefault()}
                          className="absolute right-4 text-[#7a7f90] hover:text-[#7655fb] focus:outline-none transition-colors cursor-pointer"
                        >
                          {showPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {isPasswordFocused && password.length > 0 && unmetCriteria.length > 0 && (
                        <ul className="mt-2 list-disc list-inside text-sm text-red-600">
                          {unmetCriteria.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#7a7f90]">
                        Confirm password
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirm-password"
                          autoComplete="new-password"
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={isLoading}
                          className={`gh-input w-full pr-12 transition-all ${
                            confirmPassword.length > 0
                              ? password === confirmPassword
                                ? "border-green-500 focus:border-green-600 focus:ring-green-600"
                                : "border-red-400 focus:border-red-500 focus:ring-red-500"
                              : ""
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 text-[#7a7f90] hover:text-[#7655fb] focus:outline-none transition-colors cursor-pointer"
                        >
                          {showConfirmPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {confirmPassword.length > 0 && password !== confirmPassword && (
                        <span className="text-[11px] font-bold text-red-500 mt-1 animate-fadeIn">
                          Passwords do not match
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#7a7f90]">
                        Country / Region
                      </label>
                      <SearchableCountrySelect
                        value={country}
                        onChange={(val) => setCountry(val)}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#7a7f90]">
                        State / Province
                      </label>
                      {isStatesLoading ? (
                        <div className="relative flex items-center">
                          <span className="text-sm text-gray-500">Loading states...</span>
                          <div className="absolute right-10 animate-spin rounded-full h-4 w-4 border-b-2 border-[#7655fb]" />
                        </div>
                      ) : statesList.length > 0 ? (
                        <select
                           value={stateName}
                           onChange={(e) => setStateName(e.target.value)}
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
                          placeholder="e.g. Lagos or California"
                          value={stateName}
                          onChange={(e) => setStateName(e.target.value)}
                          disabled={isLoading}
                          className="gh-input"
                          required
                        />
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#7a7f90]">
                        Phone Number
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-4 text-[14px] font-bold text-[#8b93a7] select-none border-r border-[#e4e8f2] pr-3 h-5 flex items-center justify-center font-mono">
                          {dialCode}
                        </span>
                        <input
                          type="tel"
                          placeholder="Enter your phone number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                          disabled={isLoading}
                          className="gh-input w-full"
                          style={{ paddingLeft: `${(dialCode.length * 9) + 40}px` }}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="gh-btn-primary mt-2 h-[58px] w-full text-[16px] disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
                  >
                    {isLoading ? "Signing up..." : "Sign up"}
                  </button>

                  <div className="my-2 flex items-center gap-4">
                    <div className="h-px flex-1 bg-[#e8ebf4]" />
                    <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#9aa1b4]">
                      Or continue with
                    </p>
                    <div className="h-px flex-1 bg-[#e8ebf4]" />
                  </div>

                  <div className="grid gap-4">
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="gh-panel-soft flex h-[58px] items-center justify-center gap-3 px-4 text-[14px] font-semibold text-[#262525] transition-colors hover:bg-[#f5f7ff] disabled:opacity-50"
                    >
                      <Image src="/images/google-icon.svg" width={24} height={24} alt="Google" />
                      Sign in with Google
                    </button>
                    <button
                      type="button"
                      onClick={handleAppleLogin}
                      disabled={isLoading}
                      className="flex h-[58px] items-center justify-center gap-3 rounded-[22px] bg-[#20232d] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#161922] disabled:opacity-50"
                    >
                      <Image src="/images/apple-icon.svg" width={20} height={24} alt="Apple" />
                      Sign in with Apple
                    </button>
                  </div>

                  <p className="mt-4 text-center text-[14px] text-[#666f85] lg:text-left">
                    Already have an account?{" "}
                    <Link 
                      href={`/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`} 
                      className="font-bold text-[#7655fb] hover:underline"
                    >
                      Login
                    </Link>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default function Signup() {
  return (
    <Suspense fallback={
      <main className="min-h-screen gh-page-bg flex items-center justify-center">
        <div className="text-xl font-semibold text-[#7655fb]">Loading...</div>
      </main>
    }>
      <SignupContent />
    </Suspense>
  );
}
