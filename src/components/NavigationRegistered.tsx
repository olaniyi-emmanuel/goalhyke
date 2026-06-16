"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const NavigationRegistered = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/60 bg-white/82 backdrop-blur-xl">
      <div className="gh-shell relative flex h-[110px] items-center justify-between px-[20px] lg:px-[100px]">
        {/* Logo */}
        <div className="relative w-[150px] lg:w-[198px] h-[42px] lg:h-[56px] shrink-0">
          <Link href="/">
            <Image
              src="/images/nav-logo.png"
              alt="Goal Hyke"
              fill
              className="object-contain cursor-pointer"
              priority
            />
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center justify-center gap-2 rounded-full border border-[#d9e1ff] bg-white/90 p-1 shadow-[0_10px_30px_rgba(24,33,77,0.06)] shrink-0">
          {["HOW IT WORKS", "ABOUT US", "HELP CENTER"].map((text) => (
            <Link
              key={text}
              href="#"
              className="rounded-full px-4 py-2 text-[14px] font-bold tracking-wide text-[#4f5b7f] transition-colors hover:bg-[#f3f6ff] hover:text-[#4169e1] whitespace-nowrap"
            >
              {text}
            </Link>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="hidden lg:flex items-center">
          {/* Notification Bell */}
          <div className="relative w-[34px] h-[34px] flex items-center justify-center cursor-pointer mr-[25px]">
             <div className="absolute inset-0 bg-[url('/images/nav-bell-bg.svg')] bg-center bg-no-repeat bg-cover"></div>
             <div className="w-[8px] h-[8px] bg-[#ff4e68] rounded-full absolute top-[2px] right-[2px]"></div>
          </div>

          {/* Get Token Button */}
          <Link href="/get-token" className="gh-btn-secondary mr-[30px] px-[20px] py-[10px] text-[14px]">
            <span className="text-[14px] font-bold font-secondary">GET TOKEN</span>
          </Link>

          {/* User Profile */}
          <div className="flex items-center justify-between rounded-[48px] bg-gradient-to-r from-[#4169e1] to-[#7655fb] px-[6px] py-[4px] min-w-[83px] shadow-[0_12px_30px_rgba(118,85,251,0.22)] cursor-pointer">
            <div className="relative w-[41px] h-[41px] rounded-[21px] border border-white overflow-hidden">
              <Image
                src="/images/nav-avatar.png"
                alt="User Avatar"
                fill
                className="object-cover"
              />
            </div>
            <div className="mr-[13px]">
              <Image
                src="/images/nav-arrow-down.svg"
                alt="Dropdown"
                width={12}
                height={6}
              />
            </div>
          </div>
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
          <div className="flex items-center justify-between px-[20px] py-[27px] h-[110px] border-b border-gray-100">
            {/* Logo */}
            <div className="relative w-[150px] h-[42px]">
              <Link href="/" onClick={() => setIsMenuOpen(false)}>
                <Image
                  src="/images/nav-logo.png"
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
              {["HOW IT WORKS", "ABOUT US", "HELP CENTER"].map((text) => (
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

            {/* Mobile Actions */}
            <div className="flex flex-col items-center gap-6 mt-8 w-full px-10 max-w-[350px]">
              <button className="flex items-center justify-center border border-[#7655fb] rounded-[50px] w-full h-[50px] text-[#7655fb] text-[14px] font-bold font-secondary tracking-wide hover:bg-[#F9FAFF] transition-colors">
                GET TOKEN
              </button>
              
              <div className="flex items-center gap-4 cursor-pointer">
                <div className="relative w-[40px] h-[40px] rounded-full overflow-hidden border border-gray-200">
                    <Image
                        src="/images/nav-avatar.png"
                        alt="User Avatar"
                        fill
                        className="object-cover"
                    />
                </div>
                <span className="text-[#262525] text-[16px] font-medium font-secondary">My Profile</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavigationRegistered;
