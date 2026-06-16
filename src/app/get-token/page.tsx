"use client";

import React, { useState } from "react";
import NavigationRegistered from "@/components/NavigationRegistered";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";

interface TokenPackage {
  id: number;
  amount: number;
  price: number;
}

const tokenPackages: TokenPackage[] = [
  { id: 1, amount: 30, price: 530 },
  { id: 2, amount: 50, price: 830 },
  { id: 3, amount: 50, price: 830 },
  { id: 4, amount: 50, price: 830 },
  { id: 5, amount: 30, price: 530 },
  { id: 6, amount: 50, price: 830 },
  { id: 7, amount: 50, price: 830 },
  { id: 8, amount: 50, price: 830 },
];

const TokenIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 7H5C3.89543 7 3 7.89543 3 9V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V9C21 7.89543 20.1046 7 19 7Z" stroke="#262525" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 13H7C8.10457 13 9 12.1046 9 11V9C9 7.89543 8.10457 7 7 7H3" stroke="#262525" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 13H21" stroke="#262525" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="17" cy="13" r="1" fill="#262525"/>
  </svg>
);

export default function GetToken() {
  const [selectedId, setSelectedId] = useState<number>(1);

  const selectedPackage = tokenPackages.find((p) => p.id === selectedId);

  return (
    <main className="min-h-screen gh-page-bg">
      <NavigationRegistered />

      <div className="gh-shell flex min-h-[calc(100vh-110px)]">
        <Sidebar />

        <div className="flex-1 p-4 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="gh-panel p-6 md:p-10">
              <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <span className="gh-badge mb-4">Wallet top-up</span>
                  <h1 className="text-[34px] font-bold leading-tight text-[#262525]">
                    Recharge your account with
                    <span className="bg-gradient-to-r from-[#4169e1] to-[#7655fb] bg-clip-text text-transparent">
                      {" "}GoalHyke tokens
                    </span>
                  </h1>
                  <p className="mt-3 max-w-[620px] text-[15px] leading-7 text-[#666f85]">
                    Choose a token pack that fits your commitment flow and keep every accountability action seamless.
                  </p>
                </div>
                <Link
                  href="#"
                  className="gh-btn-secondary w-fit px-5 py-3 text-[14px]"
                >
                  View transaction history
                </Link>
              </div>

              <div className="gh-panel-soft mb-10 flex w-full max-w-[360px] items-center gap-4 p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-white shadow-[0_8px_24px_rgba(24,33,77,0.06)]">
                  <TokenIcon />
                </div>
                <div>
                  <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#9199ad]">
                    Account holder
                  </div>
                  <div className="mt-1 text-[20px] font-semibold text-[#262525]">
                    John Doe
                  </div>
                </div>
              </div>

              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-[24px] font-bold text-[#262525]">Select a recharge pack</h2>
                <span className="text-[14px] text-[#7e8598]">
                  GoalHyke brand styling applied
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {tokenPackages.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedId(pkg.id)}
                    className={`rounded-[24px] border p-6 text-left transition-all ${
                      selectedId === pkg.id
                        ? "border-[#7655fb] bg-[linear-gradient(180deg,rgba(118,85,251,0.10)_0%,rgba(65,105,225,0.06)_100%)] shadow-[0_18px_36px_rgba(118,85,251,0.18)]"
                        : "border-[#e6e9f3] bg-white hover:border-[#cfd7ff] hover:bg-[#fbfbff]"
                    }`}
                  >
                    <div className="mb-8 flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white shadow-[0_8px_24px_rgba(24,33,77,0.06)]">
                        <TokenIcon />
                      </div>
                      <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7655fb]">
                        {selectedId === pkg.id ? "Selected" : "Available"}
                      </span>
                    </div>
                    <div className="text-[38px] font-bold text-[#262525]">
                      {pkg.amount}
                    </div>
                    <div className="mt-1 text-[13px] font-bold uppercase tracking-[0.12em] text-[#8b93a7]">
                      Tokens
                    </div>
                    <div className="mt-6 text-[20px] font-semibold text-[#4f5b7f]">
                      NGN {pkg.price}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-4 rounded-[22px] border border-[#eceff7] bg-[#fbfbff] px-5 py-4">
                <span className="text-[14px] font-semibold uppercase tracking-[0.12em] text-[#7a7f90]">
                  Payment method
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold italic text-[#1434CB]">VISA</span>
                  <div className="flex -space-x-2">
                    <div className="h-4 w-4 rounded-full bg-[#EB001B] opacity-90" />
                    <div className="h-4 w-4 rounded-full bg-[#F79E1B] opacity-90" />
                  </div>
                </div>
              </div>
            </section>

            <aside className="gh-panel flex h-fit flex-col p-6">
              <span className="gh-badge mb-4 w-fit">Summary</span>
              <h2 className="text-[24px] font-bold text-[#262525]">
                Order overview
              </h2>
              <p className="mt-2 text-[14px] leading-6 text-[#666f85]">
                Review your selected token pack before you proceed to payment.
              </p>

              <div className="mt-8 space-y-4">
                <div className="gh-panel-soft p-4">
                  <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#9199ad]">
                    Selected pack
                  </div>
                  <div className="mt-2 text-[32px] font-bold text-[#262525]">
                    {selectedPackage?.amount} tokens
                  </div>
                  <div className="mt-1 text-[15px] text-[#666f85]">
                    Recharge value for your next goal cycle
                  </div>
                </div>

                <div className="rounded-[22px] border border-[#eceff7] bg-[#fbfbff] p-4">
                  <div className="flex items-center justify-between text-[15px] text-[#666f85]">
                    <span>Total</span>
                    <span className="text-[24px] font-bold text-[#262525]">
                      NGN {selectedPackage?.price}
                    </span>
                  </div>
                </div>
              </div>

              <button className="gh-btn-primary mt-8 h-[56px] w-full text-[16px]">
                Recharge
              </button>
            </aside>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
