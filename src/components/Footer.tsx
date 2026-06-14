import React from 'react';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="w-full bg-[#12171d] py-[40px] px-4">
      <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row justify-between px-6 lg:px-12 gap-12 lg:gap-0">
        
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
            <p className="text-white font-secondary text-[13px]">
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
            <h3 className="text-white font-secondary text-[16px] font-medium">General</h3>
            <div className="flex flex-col gap-2.5">
              <a href="#" className="text-white font-secondary text-[14px] hover:text-gray-300">About us</a>
              <a href="#" className="text-white font-secondary text-[14px] hover:text-gray-300">Help Center</a>
              <a href="#" className="text-white font-secondary text-[14px] hover:text-gray-300">Contact Us</a>
            </div>
          </div>

          {/* Legal Column */}
          <div className="flex flex-col gap-4 mt-0 md:mt-[44px]">
            <div className="flex flex-col gap-2.5">
              <a href="#" className="text-white font-secondary text-[14px] hover:text-gray-300">Terms of Use</a>
              <a href="#" className="text-white font-secondary text-[14px] hover:text-gray-300">Privacy Policy</a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
