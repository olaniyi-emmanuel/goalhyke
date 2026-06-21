"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const NavigationRegistered = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Welcome to GoalHyke! 🚀",
      description: "Start establishing your daily habits and beat your streaks.",
      time: "Just now",
      unread: true,
    },
    {
      id: 2,
      title: "Referee Reminder",
      description: "Link a referee to your active goals to stay accountable.",
      time: "2h ago",
      unread: true,
    }
  ]);

  const hasUnread = notifications.some(n => n.unread);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  useEffect(() => {
    const supabase = createClient();
    
    const fetchUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (err) {
        console.error("Failed to load user session:", err);
      }
    };
    fetchUser();

    // Listen to Auth state changes (including USER_UPDATED when profile updates)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

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
          {[
            { text: "HOW IT WORKS", href: "/#how-it-works" },
            { text: "ABOUT US", href: "/#about-us" },
            { text: "HELP CENTER", href: "mailto:support@goalhyke.com" }
          ].map((item) => (
            <Link
              key={item.text}
              href={item.href}
              className="rounded-full px-4 py-2 text-[14px] font-bold tracking-wide text-[#4f5b7f] transition-colors hover:bg-[#f3f6ff] hover:text-[#4169e1] whitespace-nowrap"
            >
              {item.text}
            </Link>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="hidden lg:flex items-center">
          {/* Notification Bell */}
          <div 
            className="relative mr-[25px]"
            onMouseLeave={() => setNotificationOpen(false)}
          >
            <button
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="relative w-[44px] h-[44px] rounded-full border border-[#eceff7] bg-white flex items-center justify-center text-[#7d859a] hover:text-[#7655fb] hover:bg-[#f3f6ff]/40 shadow-[0_4px_12px_rgba(24,33,77,0.03)] hover:shadow-[0_4px_15px_rgba(118,85,251,0.08)] transition-all duration-300 cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {hasUnread && (
                <div className="absolute top-[10px] right-[12px] w-[8px] h-[8px] bg-[#ff4e68] rounded-full ring-2 ring-white animate-pulse"></div>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 top-full pt-3 w-80 z-50 animate-in fade-in duration-200">
                <div className="rounded-[22px] border border-[#eceff7] bg-white p-4 shadow-[0_12px_40px_rgba(24,33,77,0.12)]">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2 px-1">
                    <h4 className="text-[14px] font-bold text-[#262525]">Notifications</h4>
                    {hasUnread && (
                      <button 
                        onClick={markAllRead}
                        className="text-[11px] font-bold text-[#7655fb] hover:text-[#6445e0] border-none bg-transparent cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                    {notifications.map(item => (
                      <div 
                        key={item.id} 
                        className={`p-2.5 rounded-[14px] transition-colors ${item.unread ? 'bg-[#f8f9ff]' : 'hover:bg-gray-50'}`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <h5 className={`text-[12px] leading-tight ${item.unread ? 'font-bold text-[#262525]' : 'font-semibold text-gray-700'}`}>
                            {item.title}
                          </h5>
                          <span className="text-[10px] text-gray-400 shrink-0">{item.time}</span>
                        </div>
                        <p className="text-[11px] text-[#666f85] mt-0.5 leading-normal">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Get Token Button */}
          <Link href="/get-token" className="gh-btn-secondary mr-[30px] px-[20px] py-[10px] text-[14px]">
            <span className="text-[14px] font-bold font-secondary">GET TOKEN</span>
          </Link>

          {/* User Profile */}
          <div 
            className="relative"
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <div 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-[10px] rounded-[48px] bg-gradient-to-r from-[#4169e1] to-[#7655fb] p-[4px] pr-[16px] shadow-[0_12px_30px_rgba(118,85,251,0.22)] cursor-pointer select-none hover:shadow-[0_12px_35px_rgba(118,85,251,0.3)] hover:translate-y-[-1px] transition-all duration-300"
            >
              <div className="relative w-[38px] h-[38px] rounded-[19px] border border-white overflow-hidden shrink-0">
                <Image
                  src={user?.user_metadata?.avatar_url || "/images/nav-avatar.png"}
                  alt="User Avatar"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <span className="text-white text-[13px] font-bold tracking-wide font-secondary truncate max-w-[100px]">
                {user?.user_metadata?.full_name?.split(" ")[0] || user?.user_metadata?.name?.split(" ")[0] || "Account"}
              </span>
              <div className="shrink-0">
                <Image
                  src="/images/nav-arrow-down.svg"
                  alt="Dropdown"
                  width={10}
                  height={5}
                  className="brightness-0 invert opacity-80"
                />
              </div>
            </div>

            {dropdownOpen && (
              <div className="absolute right-0 top-full pt-3 w-56 z-50 animate-in fade-in duration-200">
                <div className="rounded-[22px] border border-[#eceff7] bg-white p-4 shadow-[0_10px_30px_rgba(24,33,77,0.1)]">
                  <div className="px-3 py-2 border-b border-gray-100 mb-2">
                    <p className="text-[14px] font-bold text-[#262525] truncate">
                      {user?.user_metadata?.full_name || user?.user_metadata?.name || "User"}
                    </p>
                    {user?.email && (
                      <p className="text-[11px] text-[#8f8e98] truncate">
                        {user.email}
                      </p>
                    )}
                  </div>
                  <Link 
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-[13px] font-bold text-[#4f5b7f] hover:bg-[#f3f6ff] hover:text-[#4169e1] rounded-full transition-colors"
                  >
                    Settings
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 text-[13px] font-bold text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer mt-1 border-none bg-transparent"
                  >
                    Log out
                  </button>
                </div>
              </div>
            )}
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
              {[
                { text: "HOW IT WORKS", href: "/#how-it-works" },
                { text: "ABOUT US", href: "/#about-us" },
                { text: "HELP CENTER", href: "mailto:support@goalhyke.com" }
              ].map((item) => (
                <Link
                  key={item.text}
                  href={item.href}
                  className="text-[#262525] text-[16px] font-medium font-secondary tracking-wide hover:text-[#7655fb] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.text}
                </Link>
              ))}
            </div>

            {/* Mobile Actions */}
            <div className="flex flex-col items-center gap-6 mt-8 w-full px-10 max-w-[350px]">
              <Link href="/get-token" onClick={() => setIsMenuOpen(false)} className="w-full">
                <button className="flex items-center justify-center border border-[#7655fb] rounded-[50px] w-full h-[50px] text-[#7655fb] text-[14px] font-bold font-secondary tracking-wide hover:bg-[#F9FAFF] transition-colors cursor-pointer">
                  GET TOKEN
                </button>
              </Link>
              
              <Link 
                href="/settings"
                onClick={() => setIsMenuOpen(false)}
                className="flex flex-col items-center gap-2 cursor-pointer mb-2"
              >
                <div className="relative w-[60px] h-[60px] rounded-full overflow-hidden border-2 border-[#7655fb]/20 shadow-sm">
                    <Image
                        src={user?.user_metadata?.avatar_url || "/images/nav-avatar.png"}
                        alt="User Avatar"
                        fill
                        className="object-cover"
                        unoptimized
                    />
                </div>
                <div className="text-center">
                  <p className="text-[#262525] text-[16px] font-bold font-secondary">
                    {user?.user_metadata?.full_name || user?.user_metadata?.name || "User"}
                  </p>
                  <p className="text-[12px] text-gray-500">
                    @{user?.user_metadata?.username || "goalhyker"}
                  </p>
                </div>
              </Link>

              <button 
                onClick={handleLogout}
                className="flex items-center justify-center border border-red-200 rounded-[50px] w-full h-[50px] text-red-500 text-[14px] font-bold font-secondary tracking-wide hover:bg-red-50 transition-colors cursor-pointer"
              >
                LOG OUT
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavigationRegistered;
