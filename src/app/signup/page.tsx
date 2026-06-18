"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, getRedirectUrl } from "@/lib/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function Signup() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/dashboard");
      }
    });
  }, [router]);

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
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setError(null);
    setIsLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: email.split("@")[0],
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
      if (typeof window !== "undefined") {
        localStorage.setItem("signup_email", email);
      }
      router.push("/verify-email");
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    const supabase = createClient();
    const { error: oAuthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getRedirectUrl(),
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
        redirectTo: getRedirectUrl(),
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
                      <input
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="gh-input"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#7a7f90]">
                        Confirm password
                      </label>
                      <input
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        className="gh-input"
                        required
                      />
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
                    <Link href="/login" className="font-bold text-[#7655fb] hover:underline">
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
