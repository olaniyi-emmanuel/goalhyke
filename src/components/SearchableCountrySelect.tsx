"use client";

import React, { useState, useEffect, useRef } from "react";
import { countries, Country } from "@/lib/countries";

interface SearchableCountrySelectProps {
  value: string;
  onChange: (countryName: string) => void;
  disabled?: boolean;
}

export default function SearchableCountrySelect({
  value,
  onChange,
  disabled = false,
}: SearchableCountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find currently selected country
  const selectedCountry = countries.find(
    (c) => c.name.toLowerCase() === value?.toLowerCase()
  ) || countries.find((c) => c.name === "Nigeria") || countries[0];

  // Filter countries based on query
  const filteredCountries = countries.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.dial_code.toLowerCase().includes(q)
    );
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (country: Country) => {
    onChange(country.name);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="gh-input flex items-center justify-between w-full text-left bg-white border border-[#e2e8f0] px-4 py-3 rounded-[16px] cursor-pointer hover:border-[#7655fb]/50 focus:border-[#7655fb] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[14px] text-[#262525]"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[18px]">{selectedCountry.flag}</span>
          <span className="font-semibold">{selectedCountry.name}</span>
        </div>
        <svg
          className={`w-4 height-4 text-[#7a7f90] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Container */}
      {isOpen && (
        <div className="absolute z-[100] mt-2 w-full bg-white border border-[#e6e9f3] rounded-[22px] shadow-[0_12px_32px_rgba(24,33,77,0.12)] overflow-hidden transition-all animate-fadeIn">
          {/* Search Box */}
          <div className="p-3 border-b border-[#f3f5fa] bg-[#fbfbff]/60">
            <div className="relative flex items-center">
              <svg
                className="absolute left-3 w-4 height-4 text-[#9aa1b4]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country name, code, or phone prefix..."
                className="w-full pl-9 pr-4 py-2 text-[13px] bg-white border border-[#e4e8f2] rounded-[12px] focus:outline-none focus:border-[#7655fb] focus:ring-1 focus:ring-[#7655fb] transition-all"
              />
            </div>
          </div>

          {/* Countries List */}
          <div className="max-h-[220px] overflow-y-auto py-1">
            {filteredCountries.length === 0 ? (
              <div className="px-4 py-3 text-[13px] text-gray-400 text-center font-medium">
                No countries found
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c.name.toLowerCase() === value?.toLowerCase();
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`flex items-center justify-between w-full px-4 py-2.5 text-left text-[13px] transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#7655fb]/5 text-[#7655fb] font-bold"
                        : "text-[#4f5b7f] hover:bg-[#f5f7ff] hover:text-[#262525]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[16px]">{c.flag}</span>
                      <span>{c.name}</span>
                    </div>
                    <span className="text-[#8b93a7] font-mono text-[11px] font-semibold bg-[#f1f3f8] px-2 py-0.5 rounded-[6px]">
                      {c.dial_code}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
