import React from "react";
import Link from "next/link";

const CommunitiesSection = () => {
  const categories = [
    ["Grow wealth", "Exercise regularly", "Master tech skill", "Loss weight"],
    ["Strengthen your spirit", "Level up your career", "Excel academically"],
    ["Read more", "Stay healthy"],
  ];

  return (
    <section className="w-full bg-[#4169e1] py-16 px-4">
      <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row items-start justify-between gap-12 lg:gap-20">
        {/* Left: Communities Icon */}
        <div className="flex flex-col items-start lg:items-center gap-4 lg:min-w-[150px]">
          <div className="w-[80px] h-[80px] bg-white/20 rounded-full flex items-center justify-center border border-white/30 backdrop-blur-sm shadow-lg">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 21V19C22.9993 18.1137 22.7044 17.2522 22.1614 16.5523C21.6184 15.8524 20.8581 15.3516 20 15.13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-white font-bold font-secondary text-[18px]">Communities</span>
        </div>

        {/* Right: Category Links */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {categories.map((group, i) => (
            <div key={i} className="flex flex-col gap-4">
              {group.map((category) => (
                <Link
                  key={category}
                  href="/links"
                  className="text-white/90 font-secondary text-[15px] hover:text-white hover:translate-x-1 transition-all inline-block"
                >
                  {category}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommunitiesSection;
