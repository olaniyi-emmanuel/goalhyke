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
    <main className="min-h-screen bg-white">
      <Navigation />

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-110px)] max-w-[1280px] mx-auto">
        {/* Left Side - Illustration */}
        <div className="hidden lg:flex flex-1 items-center justify-center bg-white relative overflow-hidden">
          <div className="relative w-full h-full min-h-[800px]">
            <Image
              src="/images/verification-illustration.png"
              alt="Verification Illustration"
              fill
              className="object-contain object-center scale-90"
              priority
            />
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-12 lg:px-20 xl:px-32 bg-white">
          <div className="w-full max-w-[500px] mx-auto lg:mx-0">
            {/* Mobile Illustration */}
            <div className="lg:hidden w-full mb-8 relative h-[250px] md:h-[350px]">
              <Image
                src="/images/verification-illustration-mobile.png"
                alt="Verification Mobile Illustration"
                fill
                className="object-contain object-center"
                priority
              />
            </div>

            <h1 className="text-[28px] md:text-[32px] lg:text-[36px] font-medium text-[#262525] font-primary mb-6">
              Verification
            </h1>
            <p className="text-[#000000] text-[16px] font-secondary mb-10 leading-[27px]">
              <span className="text-[#4b4b4b]">
                Please enter the verification code sent to{" "}
              </span>
              <span className="font-bold">oluwatosinadesoro96@gmail.com</span>
            </p>

            <form className="flex flex-col gap-8">
              {/* OTP Inputs */}
              <div className="flex gap-2 sm:gap-4 justify-between max-w-[450px]">
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
                    className="w-[45px] h-[45px] sm:w-[56px] sm:h-[56px] rounded-[8px] border border-[#E0E0E0] bg-[#FAFAFA] text-[#262525] text-[18px] font-bold text-center font-secondary focus:outline-none focus:border-[#7655fb] transition-colors"
                  />
                ))}
              </div>

              {/* Verify Button */}
              <button
                type="button"
                className="w-full max-w-[306px] h-[50px] mt-4 bg-[#7655fb] text-white rounded-[48px] text-[16px] font-medium font-secondary hover:bg-[#6445e0] transition-colors shadow-lg shadow-[#7655fb]/20 mx-auto lg:mx-0"
              >
                Verify Now
              </button>

              {/* Resend Link */}
              <div className="flex items-center justify-between w-full max-w-[300px] mx-auto lg:mx-0 mt-2">
                <span className="text-[#262525] text-[15px] font-secondary">
                  Didn’t get code?
                </span>
                <button
                  type="button"
                  className="text-[#7655fb] text-[15px] font-secondary hover:underline"
                >
                  Resend code
                </button>
              </div>

              {/* Sign In Link */}
              <div className="flex items-center justify-between w-full max-w-[300px] mx-auto lg:mx-0 mt-1">
                <span className="text-[#262525] text-[15px] font-secondary">
                  Already have an account?
                </span>
                <Link
                  href="/login"
                  className="text-[#7655fb] text-[15px] font-secondary hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
