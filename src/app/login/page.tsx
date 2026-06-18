"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, getRedirectUrl } from "@/lib/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError(null);
    setIsLoading(true);

    if (typeof window !== "undefined") {
      localStorage.setItem("signup_email", email);
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
      if (
        signInError.message.toLowerCase().includes("confirm") ||
        signInError.message.toLowerCase().includes("verify")
      ) {
        router.push("/verify-email");
      }
    } else {
      router.push("/dashboard");
      router.refresh();
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
          <div className="grid min-h-[calc(100vh-210px)] grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#eef2ff_0%,#f8faff_46%,#ffffff_100%)] lg:flex lg:items-center lg:justify-center">
              <div className="absolute inset-x-10 top-10 flex items-center justify-between">
                <span className="gh-badge">GoalHyke Access</span>
                <span className="rounded-full bg-white/85 px-4 py-2 text-[13px] font-semibold text-[#4f5b7f] shadow-[0_8px_24px_rgba(24,33,77,0.06)]">
                  Build habits with clarity
                </span>
              </div>
              <div className="absolute left-10 top-28 h-[180px] w-[180px] rounded-full bg-[#7655fb]/10 blur-3xl" />
              <div className="absolute bottom-10 right-12 h-[220px] w-[220px] rounded-full bg-[#4169e1]/10 blur-3xl" />
              <div className="relative h-full min-h-[780px] w-full">
                <Image
                  src="/images/login-illustration-desktop.png"
                  alt="Goal Hyke Login Illustration"
                  fill
                  className="object-contain object-center scale-105"
                  priority
                />
              </div>
            </div>

            <div className="flex flex-col justify-center bg-white px-6 py-12 md:px-10 lg:px-14">
              <div className="mx-auto w-full max-w-[520px] lg:mx-0">
                <h1 className="mb-10 text-[32px] font-bold leading-[1.05] text-[#262525] md:text-[40px]">
                  Log In
                </h1>

                <form onSubmit={handleLogin} className="flex flex-col gap-5">
                  {error && (
                    <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-500">
                      {error}
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#7a7f90]">
                      Email
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
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="gh-input"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="gh-btn-primary mt-2 h-[58px] w-full text-[16px] disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
                  >
                    {isLoading ? "Logging in..." : "Login"}
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
                      className="flex h-[58px] items-center justify-center gap-3 rounded-[22px] bg-[#20232d] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#161922] disabled:opacity-50"
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

                  <div className="mt-4 flex flex-col gap-3 text-center text-[14px] text-[#666f85] lg:text-left">
                    <Link href="/forgot-password" className="hover:text-[#7655fb]">
                      Forgot your password? <span className="font-bold text-[#7655fb]">Reset it</span>
                    </Link>
                    <p>
                      Don&apos;t have an account?{" "}
                      <Link href="/signup" className="font-bold text-[#7655fb] hover:underline">
                        Sign up
                      </Link>
                    </p>
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
