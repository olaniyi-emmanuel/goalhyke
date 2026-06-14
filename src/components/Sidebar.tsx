"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    {
      icon: "/images/sidebar-dashboard-active.svg",
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      icon: "/images/sidebar-goals.svg",
      label: "Goals",
      href: "/goals",
    },
    {
      icon: "/images/sidebar-links.svg",
      label: "Links",
      href: "/links",
    },
    {
      icon: "/images/sidebar-stats.svg",
      label: "Stats",
      href: "/stats",
    },
    {
      icon: "/images/sidebar-settings.svg",
      label: "Settings",
      href: "/settings",
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[115px] bg-[#f4f6fb] min-h-[calc(100vh-110px)] py-10 items-center">
      {/* Menu Toggle / Top Icon */}
      <div className="mb-12 cursor-pointer">
        <Image
          src="/images/sidebar-menu.svg"
          alt="Menu"
          width={19}
          height={19}
        />
      </div>

      {/* Navigation Items */}
      <div className="flex flex-col gap-8 w-full items-center">
        {menuItems.map((item, index) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={index}
              href={item.href}
              className="flex items-center justify-center relative group"
            >
              {/* Active Indicator Background */}
              {isActive && (
                <div className="absolute inset-0 bg-[#4169e1] rounded-[40px] opacity-100 -z-10 w-[91px] h-[76px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
              )}
              
              <div className={`relative w-[24px] h-[24px] flex items-center justify-center z-10`}>
                 <Image
                  src={item.icon}
                  alt={item.label}
                  width={24}
                  height={24}
                  className={isActive ? "brightness-0 invert" : ""} // Make icon white if active
                />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-6 items-center mt-auto pb-10">
        <div className="flex flex-col gap-1 items-center cursor-pointer">
            <div className="w-[10px] h-[10px] rounded-full bg-[#D9D9D9]"></div>
            <div className="w-[21px] h-[12px] rounded-[10px] border border-[#D9D9D9]"></div>
        </div>

        <div className="cursor-pointer">
          <Image
            src="/images/sidebar-logout.svg"
            alt="Logout"
            width={25}
            height={26}
          />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
