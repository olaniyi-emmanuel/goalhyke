"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const NavigationRegistered = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="flex items-center bg-white py-[27px] w-full h-[110px] border-b border-gray-100 relative z-50">
      <div className="relative flex items-center justify-between w-full max-w-[1280px] mx-auto px-[20px] lg:px-[100px]">
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
        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center justify-center gap-[27px] rounded-[56px] bg-[#4169e1] w-[472px] h-[48px] px-4 shrink-0">
          {["HOW IT WORKS", "ABOUT US", "HELP CENTER"].map((text) => (
            <Link
              key={text}
              href="#"
              className="text-white text-[14px] xl:text-[15px] font-normal tracking-wide font-secondary hover:opacity-90 transition-opacity whitespace-nowrap"
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
          <div className="flex items-center justify-center border border-[#7655fb] rounded-[56px] px-[20px] py-[9px] mr-[39px] cursor-pointer hover:bg-[#7655fb] hover:text-white transition-all group">
            <span className="text-[#7655fb] text-[15px] font-medium font-secondary group-hover:text-white">GET TOKEN</span>
          </div>

          {/* User Profile */}
          <div className="flex items-center justify-between bg-[#7655fb] rounded-[48px] px-[6px] py-[4px] min-w-[83px] cursor-pointer">
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
