"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      setUser(sessionUser);
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <nav className="flex items-center bg-white py-4 w-full h-[76px] lg:h-[80px] border-b border-gray-100 relative z-50">
      <div className="relative flex items-center justify-between w-full max-w-[1280px] mx-auto px-6 lg:px-12">
        {/* Logo */}
        <div className="relative w-[120px] lg:w-[150px] h-[32px] lg:h-[40px] shrink-0">
          <Link href="/">
            <Image
              src="/images/mku9ytzu-u6m6vhm.png"
              alt="Goal Hyke"
              fill
              className="object-contain cursor-pointer"
              priority
            />
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center justify-center gap-6 rounded-[56px] bg-[#4169e1] w-[420px] h-[40px] px-4 shrink-0">
          {["HOW IT WORKS", "ABOUT US", "HELP CENTER"].map((text) => (
            <Link
              key={text}
              href="#"
              className="text-white text-[13px] xl:text-[14px] font-bold tracking-wide font-secondary hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              {text}
            </Link>
          ))}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:inline-flex items-center gap-[12px] xl:gap-[16px] shrink-0">
          {user ? (
            <>
              <Link
                href="/set-goal"
                className="text-[#7655fb] text-[14px] font-bold font-secondary hover:underline"
              >
                CREATE GOAL
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center rounded-[60px] bg-[#7655fb] w-[96px] h-[38px] text-white text-[14px] font-bold font-secondary hover:bg-[#6445e0] transition-colors shadow-md hover:shadow-lg cursor-pointer"
              >
                LOG OUT
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center justify-center border border-[#7655fb] rounded-[50px] w-[96px] h-[38px] text-[#7655fb] text-[14px] font-bold font-secondary hover:bg-[#7655fb] hover:text-white transition-all duration-300"
              >
                LOG IN
              </Link>
              <Link
                href="/signup"
                className="flex items-center justify-center rounded-[60px] bg-[#7655fb] w-[96px] h-[38px] text-white text-[14px] font-bold font-secondary hover:bg-[#6445e0] transition-colors shadow-md hover:shadow-lg"
              >
                SIGN UP
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden ml-auto">
          <button
            className="text-[#262525] p-2 focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-right duration-300">
          {/* Mobile Header */}
          <div className="flex items-center justify-between px-[20px] py-4 h-[76px] border-b border-gray-100">
            {/* Logo */}
            <div className="relative w-[120px] h-[32px]">
              <Link href="/" onClick={() => setIsMenuOpen(false)}>
                <Image
                  src="/images/mku9ytzu-u6m6vhm.png"
                  alt="Goal Hyke"
                  fill
                  className="object-contain cursor-pointer"
                  priority
                />
              </Link>
            </div>
            {/* Close Button */}
            <button
              onClick={() => setIsMenuOpen(false)}
              className="w-10 h-10 flex items-center justify-center bg-[#F2F4FF] rounded-full text-[#7655fb]"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Mobile Content */}
          <div className="flex flex-col items-center justify-center flex-1 gap-8 pb-20">
            {/* Links */}
            <div className="flex flex-col items-center gap-8">
              {["HOW IT WORKS", "ABOUT US", "HELP CENTRE"].map((text) => (
                <Link
                  key={text}
                  href="#"
                  className="text-[#262525] text-[16px] font-medium font-secondary tracking-wide hover:text-[#7655fb] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {text}
                </Link>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="flex flex-col items-center gap-5 mt-8 w-full px-10 max-w-[350px]">
              {user ? (
                <>
                  <Link
                    href="/set-goal"
                    className="flex items-center justify-center border border-[#7655fb] rounded-[50px] w-full h-[50px] text-[#7655fb] text-[14px] font-bold font-secondary tracking-wide hover:bg-[#F9FAFF] transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    CREATE GOAL
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center justify-center rounded-[50px] bg-[#7655fb] w-full h-[50px] text-white text-[14px] font-bold font-secondary tracking-wide shadow-lg shadow-[#7655fb]/20 hover:bg-[#6445e0] transition-colors cursor-pointer"
                  >
                    LOG OUT
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex items-center justify-center border border-[#7655fb] rounded-[50px] w-full h-[50px] text-[#7655fb] text-[14px] font-bold font-secondary tracking-wide hover:bg-[#F9FAFF] transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    LOG IN
                  </Link>
                  <Link
                    href="/signup"
                    className="flex items-center justify-center rounded-[50px] bg-[#7655fb] w-full h-[50px] text-white text-[14px] font-bold font-secondary tracking-wide shadow-lg shadow-[#7655fb]/20 hover:bg-[#6445e0] transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    SIGN UP
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
