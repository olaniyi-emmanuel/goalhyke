import React from "react";
import Image from "next/image";
import CommunitiesSection from "./CommunitiesSection";

const Footer = () => {
  return (
    <>
      <CommunitiesSection />
      <footer className="w-full bg-[#0f1420] px-4 py-[52px]">
        <div className="gh-shell flex flex-col justify-between gap-12 rounded-[28px] border border-white/8 bg-[#12171d] px-6 py-10 lg:flex-row lg:gap-0 lg:px-12">
          {/* Left Section - Logo & Copyright */}
          <div className="flex flex-col gap-6">
            <div className="relative w-[120px] lg:w-[150px] h-[32px] lg:h-[40px]">
              <Image
                src="/images/mku9ytzu-u6m6vhm.png"
                alt="Goal Hyke"
                fill
                className="object-contain brightness-0 invert"
                priority
              />
            </div>

            <div className="flex flex-col gap-4 mt-2">
              <p className="text-[13px] text-white/78 font-secondary">
                © 2025 Copyright goalHyke.com - All rights reserved
              </p>

              {/* Social Icons */}
              <div className="relative w-[107px] h-[26px]">
                <Image
                  src="/images/logo-footer.svg"
                  alt="Social Icons"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          {/* Right Section - Links */}
          <div className="flex flex-col md:flex-row gap-8 lg:gap-[100px]">
            {/* General Column */}
            <div className="flex flex-col gap-4">
              <h3 className="text-white font-secondary text-[16px] font-medium">
                General
              </h3>
              <div className="flex flex-col gap-2.5">
                <a
                  href="/#about-us"
                  className="text-white/82 font-secondary text-[14px] transition-colors hover:text-white"
                >
                  About us
                </a>
                <a
                  href="mailto:support@goalhyke.com"
                  className="text-white/82 font-secondary text-[14px] transition-colors hover:text-white"
                >
                  Help Center
                </a>
                <a
                  href="mailto:support@goalhyke.com"
                  className="text-white/82 font-secondary text-[14px] transition-colors hover:text-white"
                >
                  Contact Us
                </a>
              </div>
            </div>

            {/* Legal Column */}
            <div className="flex flex-col gap-4 mt-0 md:mt-[44px]">
              <div className="flex flex-col gap-2.5">
                <a
                  href="#"
                  className="text-white/82 font-secondary text-[14px] transition-colors hover:text-white"
                >
                  Terms of Use
                </a>
                <a
                  href="#"
                  className="text-white/82 font-secondary text-[14px] transition-colors hover:text-white"
                >
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
