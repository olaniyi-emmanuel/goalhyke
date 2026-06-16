"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function VerifyEmail() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if value is entered
    if (value && index < 5) {
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
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
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
                  Confirm your account and unlock your
                  <span className="bg-gradient-to-r from-[#4169e1] to-[#7655fb] bg-clip-text text-transparent">
                    {" "}goal dashboard
                  </span>
                </h1>
                <p className="mb-10 max-w-[470px] text-[15px] leading-7 text-[#666f85]">
                  Please enter the verification code sent to{" "}
                  <span className="font-bold text-[#262525]">
                    oluwatosinadesoro96@gmail.com
                  </span>
                  . Once verified, you can continue setting goals and tracking habits.
                </p>

                <form className="flex flex-col gap-8">
                  <div className="gh-panel-soft px-5 py-6">
                    <div className="mb-4 text-[13px] font-bold uppercase tracking-[0.12em] text-[#7a7f90]">
                      Verification code
                    </div>
                    <div className="flex justify-between gap-2 sm:gap-4">
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
                          className="h-[54px] w-[44px] rounded-[16px] border border-[#dde3f2] bg-white text-center text-[18px] font-bold text-[#262525] outline-none transition-[border,box-shadow] focus:border-[#7655fb] focus:shadow-[0_0_0_4px_rgba(118,85,251,0.10)] sm:h-[62px] sm:w-[58px]"
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="gh-btn-primary h-[58px] w-full max-w-[320px] text-[16px]"
                  >
                    Verify Now
                  </button>

                  <div className="flex flex-col gap-3 text-[14px] text-[#666f85]">
                    <div className="flex items-center justify-between rounded-[18px] border border-[#eceff7] bg-[#fbfbff] px-4 py-3">
                      <span>Didn&apos;t get a code?</span>
                      <button type="button" className="font-bold text-[#7655fb] hover:underline">
                        Resend code
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
