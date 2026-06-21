"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient, getRedirectUrl } from "@/lib/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      const supabase = createClient();
      // Redirect to /auth/callback which will log the user in and route them to /reset-password
      const redirectUrl = `${getRedirectUrl()}?next=/reset-password`;
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
    } catch (err: any) {
      console.error("Reset password request error:", err);
      setError(err?.message || "An error occurred. Please try again.");
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
                <span className="gh-badge">Security Reset</span>
                <span className="rounded-full bg-white/85 px-4 py-2 text-[13px] font-semibold text-[#4f5b7f] shadow-[0_8px_24px_rgba(24,33,77,0.06)]">
                  Restore access to your habits
                </span>
              </div>
              <div className="absolute left-10 top-28 h-[180px] w-[180px] rounded-full bg-[#7655fb]/10 blur-3xl" />
              <div className="absolute bottom-10 right-12 h-[220px] w-[220px] rounded-full bg-[#4169e1]/10 blur-3xl" />
              <div className="relative h-full min-h-[780px] w-full">
                <Image
                  src="/images/login-illustration.png"
                  alt="Goal Hyke Forgot Password Illustration"
                  fill
                  className="object-contain object-center scale-105"
                  priority
                />
              </div>
            </div>

            {/* Form Column */}
            <div className="flex flex-col justify-center bg-white px-6 py-12 md:px-10 lg:px-14">
              <div className="mx-auto w-full max-w-[520px] lg:mx-0">
                <span className="gh-badge mb-4">Reset Password</span>
                <h1 className="mb-3 text-[32px] font-bold leading-[1.05] text-[#262525] md:text-[40px]">
                  Forgot Password?
                </h1>
                <p className="mb-10 text-[15px] leading-7 text-[#666f85]">
                  Enter your email address below and we will send you a secure link to reset your account password.
                </p>

                <form onSubmit={handleResetRequest} className="flex flex-col gap-6">
                  {error && (
                    <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-500">
                      {error}
                    </div>
                  )}

                  {success ? (
                    <div className="rounded-[18px] border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-600">
                      <p className="font-bold text-[15px] mb-1">Link Sent Successfully!</p>
                      Please check your inbox for the password reset email. Follow the instructions in the email to set a new password.
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#7a7f90]">
                          Email Address
                        </label>
                        <input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                          className="gh-input"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="gh-btn-primary h-[58px] w-full text-[16px] disabled:opacity-50"
                      >
                        {isLoading ? "Sending link..." : "Send Reset Link"}
                      </button>
                    </>
                  )}

                  <div className="mt-4 text-center text-[14px] text-[#666f85]">
                    Remembered your password?{" "}
                    <Link href="/login" className="font-bold text-[#7655fb] hover:underline">
                      Log In
                    </Link>
                  </div>
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
