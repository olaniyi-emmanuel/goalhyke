"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
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

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 2000);
    } catch (err: any) {
      console.error("Reset password error:", err);
      setError(err?.message || "Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen gh-page-bg">
      <Navigation />

      <div className="gh-shell px-4 py-6 md:px-6 lg:px-10 lg:py-10">
        <div className="gh-panel overflow-hidden">
          <div className="grid min-h-[calc(100vh-210px)] grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Illustration Column */}
            <div className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#eef2ff_0%,#f8faff_46%,#ffffff_100%)] lg:flex lg:items-center lg:justify-center">
              <div className="absolute inset-x-10 top-10 flex items-center justify-between">
                <span className="gh-badge">Account Security</span>
                <span className="rounded-full bg-white/85 px-4 py-2 text-[13px] font-semibold text-[#4f5b7f] shadow-[0_8px_24px_rgba(24,33,77,0.06)]">
                  Create a strong new password
                </span>
              </div>
              <div className="absolute left-10 top-28 h-[180px] w-[180px] rounded-full bg-[#7655fb]/10 blur-3xl" />
              <div className="absolute bottom-10 right-12 h-[220px] w-[220px] rounded-full bg-[#4169e1]/10 blur-3xl" />
              <div className="relative h-full min-h-[780px] w-full">
                <Image
                  src="/images/login-illustration.png"
                  alt="Goal Hyke Reset Password Illustration"
                  fill
                  className="object-contain object-center scale-105"
                  priority
                />
              </div>
            </div>

            {/* Form Column */}
            <div className="flex flex-col justify-center bg-white px-6 py-12 md:px-10 lg:px-14">
              <div className="mx-auto w-full max-w-[520px] lg:mx-0">
                <span className="gh-badge mb-4">Set New Password</span>
                <h1 className="mb-3 text-[32px] font-bold leading-[1.05] text-[#262525] md:text-[40px]">
                  Choose New Password
                </h1>
                <p className="mb-10 text-[15px] leading-7 text-[#666f85]">
                  Please enter and confirm your new secure password below to regain full access to your account.
                </p>

                <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
                  {error && (
                    <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-500">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="rounded-[18px] border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
                      Password reset successful! Redirecting you to your dashboard...
                    </div>
                  )}

                  {!success && (
                    <>
                      {/* Password Input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#7a7f90]">
                          New Password
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            autoComplete="new-password"
                            placeholder="Create a new password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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

                        {password.length > 0 && unmetCriteria.length > 0 && (
                          <ul className="mt-2 list-disc list-inside text-sm text-red-600">
                            {unmetCriteria.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Confirm Password Input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#7a7f90]">
                          Confirm Password
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirm-password"
                            placeholder="Confirm your new password"
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
                            onMouseDown={(e) => e.preventDefault()}
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
                          <span className="text-[11px] font-bold text-red-500 mt-1">
                            Passwords do not match
                          </span>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="gh-btn-primary mt-4 h-[58px] w-full text-[16px] disabled:opacity-50"
                      >
                        {isLoading ? "Updating password..." : "Reset Password"}
                      </button>
                    </>
                  )}
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
