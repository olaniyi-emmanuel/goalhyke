"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const renderIcon = (label: string) => {
  switch (label) {
    case "Dashboard":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case "Goals":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "Links":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
    case "Stats":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case "Settings":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    default:
      return null;
  }
};

const Sidebar = () => {
  const pathname = usePathname();

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/login";
    }
  };

  const menuItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Goals",
      href: "/goals",
    },
    {
      label: "Links",
      href: "/links",
    },
    {
      label: "Stats",
      href: "/stats",
    },
    {
      label: "Settings",
      href: "/settings",
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[115px] bg-[#f4f6fb] min-h-[calc(100vh-110px)] py-10 items-center border-r border-[#eceff7]">
      {/* Menu Toggle / Top Icon */}
      <div className="mb-12 cursor-pointer text-[#7d859a] hover:text-[#4169e1] transition-colors p-2 rounded-xl hover:bg-[#eceff7]/50">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </div>

      {/* Navigation Items */}
      <div className="flex flex-col gap-6 w-full items-center">
        {menuItems.map((item, index) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center justify-center w-[54px] h-[54px] rounded-[18px] transition-all duration-300 relative group ${
                isActive 
                  ? "bg-gradient-to-br from-[#4169e1] to-[#7655fb] text-white shadow-[0_10px_25px_rgba(118,85,251,0.25)]" 
                  : "text-[#7d859a] hover:text-[#4169e1] hover:bg-[#eceff7]/50"
              }`}
              title={item.label}
            >
              {renderIcon(item.label)}
            </Link>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-6 items-center mt-auto">
        <button 
          onClick={handleLogout} 
          className="cursor-pointer border-none bg-transparent outline-none flex items-center justify-center w-[54px] h-[54px] rounded-[18px] text-[#7d859a] hover:text-red-500 hover:bg-red-50 transition-all duration-200"
          title="Log out"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
