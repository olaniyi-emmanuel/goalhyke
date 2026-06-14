"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError(null);
    setIsLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    const supabase = createClient();
    const { error: oAuthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oAuthError) {
      setError(oAuthError.message);
    }
  };

  const handleAppleLogin = async () => {
    setError(null);
    const supabase = createClient();
    const { error: oAuthError } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oAuthError) {
      setError(oAuthError.message);
    }
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
              src="/images/login-illustration-desktop.png"
              alt="Goal Hyke Login Illustration"
              fill
              className="object-contain object-center scale-110"
              priority
            />
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-12 lg:px-20 xl:px-32 bg-white">
          <div className="w-full max-w-[500px] mx-auto lg:mx-0">
            {/* Mobile Illustration - Hidden as per screenshot request */}
            {/* <div className="lg:hidden w-full mb-8 relative h-[250px] md:h-[350px]">
              <Image
                src="/images/login-illustration-mobile.png"
                alt="Goal Hyke Login Mobile Illustration"
                fill
                className="object-contain object-center"
                priority
              />
            </div> */}

            <h1 className="text-[28px] md:text-[32px] lg:text-[36px] font-bold text-[#262525] font-secondary mb-2">
              Log In
            </h1>
            <p className="text-[#666666] text-[14px] font-secondary mb-10">
              Welcome back! Please enter your details.
            </p>

            <form onSubmit={handleLogin} className="flex flex-col gap-6">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-[8px] border border-red-200">
                  {error}
                </div>
              )}

              {/* Email Input */}
              <div className="flex flex-col gap-2">
                <label className="text-[#262525] text-[14px] font-bold font-secondary">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-[56px] px-4 rounded-[12px] border border-[#E0E0E0] bg-[#FAFAFA] text-[#262525] font-secondary focus:outline-none focus:border-[#7655fb] transition-colors"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-2">
                <label className="text-[#262525] text-[14px] font-bold font-secondary">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-[56px] px-4 rounded-[12px] border border-[#E0E0E0] bg-[#FAFAFA] text-[#262525] font-secondary focus:outline-none focus:border-[#7655fb] transition-colors"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[56px] mt-2 bg-[#7655fb] text-white rounded-[60px] text-[16px] font-bold font-secondary hover:bg-[#6445e0] transition-colors shadow-lg shadow-[#7655fb]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-[1px] bg-[#E0E0E0]"></div>
                <p className="text-[#666666] font-secondary text-[14px]">or</p>
                <div className="flex-1 h-[1px] bg-[#E0E0E0]"></div>
              </div>

              {/* Social Login Buttons */}
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-3 w-full h-[56px] bg-white border border-[#E0E0E0] rounded-[10px] text-[#262525] text-[14px] font-secondary hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Image
                    src="/images/google-icon.svg"
                    width={24}
                    height={24}
                    alt="Google"
                  />
                  Sign in with Google
                </button>
                <button
                  type="button"
                  onClick={handleAppleLogin}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-3 w-full h-[56px] bg-[#2D2C2C] rounded-[10px] text-white text-[14px] font-secondary hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
                >
                  <Image
                    src="/images/apple-icon.svg"
                    width={20}
                    height={24}
                    alt="Apple"
                  />
                  Sign in with Apple
                </button>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-center mt-6">
                <Link
                  href="/forgot-password"
                  className="text-[#666666] text-[14px] font-secondary"
                >
                  Forgot your password?{" "}
                  <span className="text-[#7655fb] font-bold hover:underline">
                    Reset it
                  </span>
                </Link>
              </div>

              {/* Sign Up Link */}
              <p className="text-center text-[#666666] font-secondary mt-2">
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  className="text-[#7655fb] font-bold hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
