"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

export default function VerifyEmail() {
  const [email, setEmail] = useState("your email");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
    if (typeof window !== "undefined") {
      const storedEmail = localStorage.getItem("signup_email");
      if (storedEmail) {
        setEmail(storedEmail);
      }
    }
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otp.join("");
    if (token.length !== otp.length) {
      setError(`Please enter the ${otp.length}-digit verification code.`);
      return;
    }

    if (email === "your email") {
      setError("Email address not found. Please sign up again.");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsVerifying(true);

    try {
      const supabase = createClient();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      if (verifyError) {
        throw verifyError;
      }

      setSuccess("Account successfully confirmed! Redirecting...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err?.message || "Invalid or expired verification code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (email === "your email") {
      setError("Email address not found. Please sign up again.");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsResending(true);

    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.signInWithOtp({
        email,
      });

      if (resendError) {
        throw resendError;
      }

      setSuccess("Verification code has been resent to your email!");
    } catch (err: any) {
      console.error("Resend error:", err);
      setError(err?.message || "Failed to resend verification code. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if value is entered
    if (value && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    // Move to previous input on Backspace if current is empty
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, otp.length);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, i) => {
      if (i < otp.length) newOtp[i] = char;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, otp.length - 1)]?.focus();
  };

  return (
    <main className="min-h-screen gh-page-bg">
      <Navigation />

      <div className="gh-shell px-4 py-6 md:px-6 lg:px-10 lg:py-10">
        <div className="gh-panel overflow-hidden">
          <div className="grid min-h-[calc(100vh-210px)] grid-cols-1 lg:grid-cols-[1fr_0.92fr]">
            <div className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#eef2ff_0%,#f8faff_46%,#ffffff_100%)] lg:flex lg:items-center lg:justify-center">
              <div className="absolute inset-x-10 top-10 flex items-center justify-between">
                <span className="gh-badge">Secure access</span>
                <span className="rounded-full bg-white/85 px-4 py-2 text-[13px] font-semibold text-[#4f5b7f] shadow-[0_8px_24px_rgba(24,33,77,0.06)]">
                  One more step to begin
                </span>
              </div>
              <div className="absolute left-10 top-28 h-[180px] w-[180px] rounded-full bg-[#7655fb]/10 blur-3xl" />
              <div className="absolute bottom-10 right-12 h-[220px] w-[220px] rounded-full bg-[#4169e1]/10 blur-3xl" />
              <div className="relative h-full min-h-[760px] w-full">
                <Image
                  src="/images/verification-illustration.png"
                  alt="Verification Illustration"
                  fill
                  className="object-contain object-center scale-95"
                  priority
                />
              </div>
            </div>

            <div className="flex flex-col justify-center bg-white px-6 py-12 md:px-10 lg:px-14">
              <div className="mx-auto w-full max-w-[520px] lg:mx-0">
                <span className="gh-badge mb-4">Verify email</span>
                <h1 className="mb-3 text-[32px] font-bold leading-[1.05] text-[#262525] md:text-[40px]">
                  Confirm your account
                </h1>
                <p className="mb-10 max-w-[470px] text-[15px] leading-7 text-[#666f85]">
                  Please enter the verification code sent to{" "}
                  <span className="font-bold text-[#262525]">
                    {email}
                  </span>
                  .
                </p>

                <form onSubmit={handleVerify} className="flex flex-col gap-8">
                  <div className="gh-panel-soft px-5 py-6">
                    <div className="mb-4 text-[13px] font-bold uppercase tracking-[0.12em] text-[#7a7f90]">
                      Verification code
                    </div>
                    <div className="grid grid-cols-6 gap-2 sm:gap-4">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            inputRefs.current[index] = el;
                          }}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={index === 0 ? handlePaste : undefined}
                          className="h-[54px] w-full min-w-0 sm:h-[62px] rounded-[16px] border border-[#dde3f2] bg-white text-center text-[18px] font-bold text-[#262525] outline-none transition-[border,box-shadow] focus:border-[#7655fb] focus:shadow-[0_0_0_4px_rgba(118,85,251,0.10)]"
                        />
                      ))}
                    </div>
                  </div>

                  {error && (
                    <p className="text-[12px] text-red-500 font-semibold -mt-4">{error}</p>
                  )}
                  {success && (
                    <p className="text-[12px] text-green-600 font-semibold -mt-4">{success}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="gh-btn-primary h-[58px] w-full text-[16px] disabled:opacity-50"
                  >
                    {isVerifying ? "Verifying..." : "Verify Now"}
                  </button>

                  <div className="flex flex-col gap-3 text-[14px] text-[#666f85]">
                    <div className="flex items-center justify-between rounded-[18px] border border-[#eceff7] bg-[#fbfbff] px-4 py-3">
                      <span>Didn&apos;t get a code?</span>
                      <button 
                        type="button" 
                        onClick={handleResendCode}
                        disabled={isResending}
                        className="font-bold text-[#7655fb] hover:underline disabled:opacity-50"
                      >
                        {isResending ? "Resending..." : "Resend code"}
                      </button>
                    </div>
                    <div className="flex items-center justify-between rounded-[18px] border border-[#eceff7] bg-[#fbfbff] px-4 py-3">
                      <span>Already have an account?</span>
                      <Link href="/login" className="font-bold text-[#7655fb] hover:underline">
                        Sign in
                      </Link>
                    </div>
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
