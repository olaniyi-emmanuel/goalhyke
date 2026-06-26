"use client";

import React, { useState, useEffect } from "react";
import NavigationRegistered from "@/components/NavigationRegistered";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface TokenPackage {
  id: number;
  name: string;
  amount: number;
  prices: {
    NGN: number;
    USD: number;
  };
  badge?: string;
  isCustom?: boolean;
  features: string[];
}

const tokenPackages: TokenPackage[] = [
  {
    id: 1,
    name: "Starter Pack",
    amount: 100,
    prices: { NGN: 2000, USD: 7 },
    features: [
      "100 GoalHyke Tokens",
      "Create up to 10 goals",
      "Fund accountability stakes",
      "Pay referee review fees",
      "Basic progress insights",
    ],
  },
  {
    id: 2,
    name: "Consistent Pack",
    amount: 500,
    prices: { NGN: 5000, USD: 17 },
    badge: "Popular",
    features: [
      "500 GoalHyke Tokens",
      "All Starter benefits included",
      "Support multiple high-stake goals",
      "Multi-referee verification support",
      "Priority AI coach analysis",
    ],
  },
  {
    id: 3,
    name: "Achiever Pack",
    amount: 1200,
    prices: { NGN: 10000, USD: 33 },
    badge: "Best Value",
    features: [
      "1200 GoalHyke Tokens",
      "All Consistent benefits included",
      "Ultimate stake flexibility",
      "Best value per token",
      "Lifetime history log & analytics",
    ],
  },
];

const TokenIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 7H5C3.89543 7 3 7.89543 3 9V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V9C21 7.89543 20.1046 7 19 7Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 13H7C8.10457 13 9 12.1046 9 11V9C9 7.89543 8.10457 7 7 7H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 13H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="17" cy="13" r="1" fill="currentColor" />
  </svg>
);

function CheckIcon() {
  return (
    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7655fb] text-white">
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 6.2L4.9 8.1L9 3.75"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function GetToken() {
  const [selectedId, setSelectedId] = useState<number>(2); // Default to "Consistent" package
  const [customCashAmount, setCustomCashAmount] = useState<number>(3000); // Default custom price amount
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currency, setCurrency] = useState<"NGN" | "USD">("USD");
  const [detectedCountry, setDetectedCountry] = useState<string>("Global");
  const [isDetectingLocation, setIsDetectingLocation] = useState(true);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isTxLoading, setIsTxLoading] = useState(true);
  const [txErrorOccurred, setTxErrorOccurred] = useState(false);

  const fetchTransactions = async (userId: string) => {
    try {
      setIsTxLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }
      setTransactions(data || []);
      setTxErrorOccurred(false);
    } catch (e) {
      console.warn("Failed to fetch transactions:", e);
      setTxErrorOccurred(true);
    } finally {
      setIsTxLoading(false);
    }
  };

  useEffect(() => {
    const supabase = createClient();

    const initializePage = async () => {
      let resolvedCountry = "";

      // 1. Fetch user session and token balance & country preference
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        if (currentUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("tokens, country")
            .eq("id", currentUser.id)
            .single();
          setTokenBalance(profile?.tokens ?? 0);
          if (profile?.country) {
            resolvedCountry = profile.country;
          }
          fetchTransactions(currentUser.id);
        } else {
          setIsTxLoading(false);
        }
      } catch (e) {
        console.error("Error loading user profile:", e);
        setIsTxLoading(false);
      }

      // 1.5 Check for pre-selected package parameter in URL
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const pkgParam = params.get("package") || params.get("packageId");
        if (pkgParam) {
          if (pkgParam.toLowerCase() === "custom") {
            setSelectedId(4);
          } else {
            const pkgId = parseInt(pkgParam, 10);
            if ([1, 2, 3, 4].includes(pkgId)) {
              setSelectedId(pkgId);
            }
          }
        }
      }

      // 2. Perform Geolocation Lookup if no profile country is found
      if (resolvedCountry) {
        if (resolvedCountry === "Nigeria") {
          setCurrency("NGN");
          setDetectedCountry("Nigeria");
          setCustomCashAmount(3000);
        } else {
          setCurrency("USD");
          setDetectedCountry(resolvedCountry);
          setCustomCashAmount(10);
        }
        setIsDetectingLocation(false);
      } else {
        try {
          const res = await fetch("https://ipapi.co/json/");
          if (res.ok) {
            const data = await res.json();
            if (data.country === "NG") {
              setCurrency("NGN");
              setDetectedCountry("Nigeria");
              setCustomCashAmount(3000);
            } else {
              setCurrency("USD");
              setDetectedCountry(data.country_name || "Global");
              setCustomCashAmount(10);
            }
          } else {
            // Fallback based on timezone
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (tz.includes("Lagos") || tz.includes("Africa/Lagos") || tz.includes("Africa/Abidjan")) {
              setCurrency("NGN");
              setDetectedCountry("Nigeria (Timezone resolved)");
              setCustomCashAmount(3000);
            } else {
              setCurrency("USD");
              setDetectedCountry("Global (Timezone resolved)");
              setCustomCashAmount(10);
            }
          }
        } catch (e) {
          console.warn("Location detection failed, defaulting to USD.", e);
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (tz.includes("Lagos") || tz.includes("Africa/Lagos")) {
            setCurrency("NGN");
            setDetectedCountry("Nigeria (Timezone resolved)");
            setCustomCashAmount(3000);
          } else {
            setCurrency("USD");
            setDetectedCountry("Global (Fallback)");
            setCustomCashAmount(10);
          }
        } finally {
          setIsDetectingLocation(false);
        }
      }
    };

    initializePage();
  }, []);

  const getCustomPackageDetails = () => {
    const isNgn = currency === "NGN";
    const amount = customCashAmount;
    let tokens = 0;
    let rateText = "";
    let tierName = "";

    if (isNgn) {
      if (amount < 2000) {
        tokens = 0;
        rateText = "₦20 / token (Minimum ₦2,000)";
        tierName = "None";
      } else if (amount < 5000) {
        tokens = Math.floor(amount / 20);
        rateText = "₦20 / token (Starter Pack rate)";
        tierName = "Starter Pack";
      } else if (amount < 10000) {
        tokens = Math.floor(amount / 10);
        rateText = "₦10 / token (Consistent Pack rate — 50% savings!)";
        tierName = "Consistent Pack";
      } else {
        tokens = Math.floor(amount * 0.12);
        rateText = "₦8.33 / token (Achiever Pack rate — Maximum savings!)";
        tierName = "Achiever Pack";
      }
    } else {
      if (amount < 7) {
        tokens = 0;
        rateText = "$0.07 / token (Minimum $7.00)";
        tierName = "None";
      } else if (amount < 17) {
        tokens = Math.floor(amount / 0.07);
        rateText = "$0.07 / token (Starter Pack rate)";
        tierName = "Starter Pack";
      } else if (amount < 33) {
        tokens = Math.floor(amount / 0.034);
        rateText = "$0.034 / token (Consistent Pack rate — 50% savings!)";
        tierName = "Consistent Pack";
      } else {
        tokens = Math.floor(amount / 0.0275);
        rateText = "$0.0275 / token (Achiever Pack rate — Maximum savings!)";
        tierName = "Achiever Pack";
      }
    }

    return { tokens, rateText, tierName };
  };

  const { tokens: customTokens, rateText: customRateText } = getCustomPackageDetails();

  const selectedPackage = selectedId === 4
    ? {
      id: 4,
      name: "Custom Pack",
      amount: customTokens,
      prices: {
        NGN: currency === "NGN" ? customCashAmount : Math.round(customCashAmount * 300),
        USD: currency === "USD" ? customCashAmount : Number((customCashAmount / 300).toFixed(2)),
      }
    }
    : tokenPackages.find((p) => p.id === selectedId);

  const handleRecharge = async () => {
    if (!user) {
      alert("Please log in to purchase tokens.");
      return;
    }

    const minAmount = currency === "NGN" ? 2000 : 7;
    if (selectedId === 4 && (!customCashAmount || customCashAmount < minAmount)) {
      alert(`Please enter a custom price amount of at least ${currency === "NGN" ? "₦2,000" : "$7.00"}.`);
      return;
    }

    setIsLoading(true);
    try {
      const targetPrice = currency === "NGN" ? selectedPackage?.prices.NGN : selectedPackage?.prices.USD;
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageId: selectedId,
          packageName: selectedPackage?.name,
          amount: selectedPackage?.amount,
          price: targetPrice,
          currency,
          email: user.email,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize checkout.");
      }

      if (data.url) {
        if (data.mode === "mock") {
          alert(`Testing Mode: Active API keys are not detected in your config. Redirecting you to mock checkout completion.`);
        }
        window.location.href = data.url;
      } else {
        throw new Error("No redirect URL returned from checkout API.");
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to proceed to checkout.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen gh-page-bg">
      <NavigationRegistered />

      <div className="gh-shell flex min-h-[calc(100vh-110px)]">
        <Sidebar />

        <div className="flex-1 p-4 md:p-8 flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
            <section className="gh-panel p-6 md:p-8 flex flex-col gap-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <span className="gh-badge mb-4">Token Store</span>
                </div>
                <div className="flex flex-col gap-2 items-end shrink-0">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById("transaction-history");
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="gh-btn-secondary shrink-0 px-5 py-3 text-[13px] text-center w-full md:w-auto cursor-pointer"
                  >
                    Transaction History
                  </button>
                  <div className="text-[11px] text-[#8b93a7] font-semibold flex items-center gap-1.5">
                    Region: <span className="text-[#7655fb] font-bold flex items-center gap-1">
                      {isDetectingLocation ? (
                        "Detecting..."
                      ) : (
                        <>
                          <span>{detectedCountry.toLowerCase().includes("nigeria") ? "🇳🇬" : "🌐"}</span>
                          <span>{detectedCountry}</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>



              {/* Grid Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <h2 className="text-[22px] font-bold text-[#262525]">Select a package</h2>
              </div>

              {/* Package cards */}
              <div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3 pt-4">
                  {tokenPackages.map((pkg) => {
                    const isSelected = selectedId === pkg.id;
                    const displayPrice = currency === "NGN" ? `₦${pkg.prices.NGN.toLocaleString()}` : `$${pkg.prices.USD.toFixed(2)}`;
                    const displayAmount = pkg.amount;

                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedId(pkg.id)}
                        className={`relative flex h-full cursor-pointer flex-col rounded-[24px] border-[3px] bg-white px-5 py-8 transition-all duration-300 hover:-translate-y-1 ${isSelected
                            ? "border-[#7655fb] bg-[linear-gradient(180deg,rgba(118,85,251,0.04)_0%,rgba(65,105,225,0.02)_100%)] shadow-[0_20px_48px_rgba(118,85,251,0.12)] scale-[1.01]"
                            : "border-[#11111114] hover:border-[#11111129] hover:shadow-[0_12px_32px_rgba(17,17,17,0.04)]"
                          }`}
                      >
                        {pkg.badge && (
                          <div className="absolute -top-[16px] left-1/2 -translate-x-1/2 rounded-full bg-[#7655fb] px-4 py-1.5 shadow-[0_6px_20px_rgba(118,85,251,0.25)] whitespace-nowrap">
                            <span className="font-secondary text-[10px] font-bold tracking-widest text-white uppercase">
                              {pkg.badge}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <h3 className="font-secondary text-[20px] font-semibold text-[#262525]">
                            {pkg.name}
                          </h3>
                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${isSelected
                                ? "border-[#7655fb] bg-[#7655fb]"
                                : "border-[#11111133] bg-transparent"
                              }`}
                          >
                            {isSelected && (
                              <div className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </div>
                        </div>

                        <div className="mt-5 font-secondary font-bold text-[#262525]">
                          <span className="text-[32px] leading-none sm:text-[36px]">
                            {displayPrice}
                          </span>
                          <span className="text-[14px] font-normal text-[#7b7474] block mt-1.5">
                            for {displayAmount} tokens
                          </span>
                        </div>

                        <div className="mt-6 flex-grow">
                          <p className="font-secondary text-[15px] font-bold text-[#262525]">
                            Benefits
                          </p>
                          <div className="mt-3 flex flex-col gap-3">
                            {pkg.features.map((feature) => (
                              <div
                                key={feature}
                                className="flex items-start gap-2.5 font-secondary text-[13px] leading-[1.4] text-[#262525]"
                              >
                                <CheckIcon />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Package Input Section */}
              <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-4">
                <div
                  onClick={() => setSelectedId(4)}
                  className={`p-5 rounded-[22px] border-[3px] transition-all cursor-pointer ${selectedId === 4
                      ? "border-[#7655fb] bg-[linear-gradient(180deg,rgba(118,85,251,0.02)_0%,rgba(65,105,225,0.01)_100%)] shadow-[0_12px_28px_rgba(118,85,251,0.05)]"
                      : "border-[#11111114] bg-white hover:border-[#11111129]"
                    }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-secondary text-[18px] font-bold text-[#262525]">Or Buy a Custom Amount</h3>
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${selectedId === 4
                              ? "border-[#7655fb] bg-[#7655fb]"
                              : "border-[#11111133] bg-transparent"
                            }`}
                        >
                          {selectedId === 4 && (
                            <div className="h-2 w-2 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                      <p className="text-[13px] text-[#666f85] mt-1">Configure your purchase by custom price amount.</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="relative flex items-center w-full md:w-[220px]" onClick={(e) => e.stopPropagation()}>
                        <span className="absolute left-4 font-bold text-[14px] text-[#8b93a7]">
                          {currency === "NGN" ? "₦" : "$"}
                        </span>
                        <input
                          id="custom-amount"
                          type="number"
                          min={currency === "NGN" ? 2000 : 7}
                          value={customCashAmount || ""}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setSelectedId(4);
                            setCustomCashAmount(val);
                          }}
                          className="w-full h-[48px] pl-9 pr-4 rounded-[12px] border border-[#e6e9f3] bg-white focus:outline-none focus:border-[#7655fb] font-secondary font-bold text-[15px] text-[#262525]"
                          placeholder="Price Amount"
                        />
                      </div>
                    </div>
                  </div>

                  {selectedId === 4 && (
                    <div className="mt-5 pt-4 border-t border-dashed border-[#7655fb]/20 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
                      <p className="font-secondary text-[15px] font-bold text-[#262525]">
                        Benefits
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        <div className="flex items-start gap-2.5 font-secondary text-[13px] leading-[1.4] text-[#262525]">
                          <CheckIcon />
                          <span>
                            <strong className="text-[#7655fb] font-extrabold">{customTokens.toLocaleString()}</strong> GoalHyke Tokens
                          </span>
                        </div>
                        <div className="flex items-start gap-2.5 font-secondary text-[13px] leading-[1.4] text-[#262525]">
                          <CheckIcon />
                          <span>All Consistent benefits included</span>
                        </div>
                        <div className="flex items-start gap-2.5 font-secondary text-[13px] leading-[1.4] text-[#262525]">
                          <CheckIcon />
                          <span>Ultimate stake flexibility</span>
                        </div>
                        <div className="flex items-start gap-2.5 font-secondary text-[13px] leading-[1.4] text-[#262525]">
                          <CheckIcon />
                          <span>Best value per token</span>
                        </div>
                        <div className="flex items-start gap-2.5 font-secondary text-[13px] leading-[1.4] text-[#262525]">
                          <CheckIcon />
                          <span>Lifetime history log & analytics</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-[22px] border border-[#eceff7] bg-[#fbfbff] px-6 py-4">
                <span className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#7a7f90]">
                  Preferred Payment Method
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[14px] font-bold text-[#262525] font-secondary">
                    Paystack Secure Checkout
                  </span>
                  <div className="flex items-center gap-1.5 bg-white border border-[#e2e8f0] px-2.5 py-1 rounded-[8px] shadow-sm">
                    <span className="font-black italic text-[11px] text-[#1434CB]">{currency}</span>
                    <div className="flex -space-x-1.5">
                      <div className="h-3 w-3 rounded-full bg-[#EB001B] opacity-90" />
                      <div className="h-3 w-3 rounded-full bg-[#F79E1B] opacity-90" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <aside className="gh-panel flex h-fit flex-col p-6 gap-6">
              <div>
                <span className="gh-badge mb-4">Summary</span>
                <h2 className="text-[22px] font-bold text-[#262525]">Order Overview</h2>
                <p className="mt-1 text-[14px] leading-6 text-[#666f85]">
                  Confirm your package details prior to loading the checkout frame.
                </p>
              </div>

              {/* Current Token Balance */}
              <div className="gh-panel-soft px-4 py-3.5 flex items-center justify-between text-[13px] text-gray-500">
                <span className="font-medium">Current Balance</span>
                <span className="font-bold text-[#7655fb]">{tokenBalance} tokens</span>
              </div>

              <div className="flex flex-col gap-4">
                <div className="gh-panel-soft p-4">
                  <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#9199ad]">
                    Selected package
                  </div>
                  <div className="mt-2 text-[32px] font-bold text-[#262525] leading-none">
                    {selectedPackage?.amount} tokens
                  </div>
                  <div className="mt-2 text-[14px] text-[#666f85] leading-relaxed">
                    Used to lock stakes and reward referee reviews.
                  </div>
                </div>

                <div className="rounded-[22px] border border-[#eceff7] bg-[#fbfbff] p-4">
                  <div className="flex items-center justify-between text-[15px] text-[#666f85]">
                    <span className="font-bold">Total price</span>
                    <span className="text-[22px] font-bold text-[#262525]">
                      {currency === "NGN" ? "NGN" : "$"}{" "}
                      {currency === "NGN"
                        ? selectedPackage?.prices.NGN.toLocaleString()
                        : selectedPackage?.prices.USD.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleRecharge}
                disabled={isLoading}
                className="gh-btn-primary h-[56px] w-full text-[16px] cursor-pointer disabled:opacity-50"
              >
                {isLoading ? "Redirecting..." : "Proceed to Checkout"}
              </button>
            </aside>
          </div>

          {/* Transaction History Section */}
          <section id="transaction-history" className="gh-panel p-6 md:p-8 flex flex-col gap-6 mt-6">
            <div>
              <span className="gh-badge mb-4">Billing</span>
              <h2 className="text-[22px] font-bold text-[#262525]">Transaction History</h2>
            </div>

            {isTxLoading ? (
              <div className="flex justify-center items-center py-8 text-[#7655fb]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7655fb]"></div>
                <span className="ml-3 text-[14px] font-medium">Loading history...</span>
              </div>
            ) : txErrorOccurred ? (
              <div className="gh-panel-soft p-5 border border-yellow-100 rounded-[22px] bg-yellow-50/20 text-[#666f85]">
                <p className="text-[14px] leading-relaxed">
                  <span className="font-bold text-yellow-600 block mb-1">Migration Required</span>
                  To view transaction history and save transactions to the database, please make sure the SQL database schema migration has been applied.
                  You can copy and run the statements in the migration file:
                </p>
                <code className="block mt-3 p-3 bg-gray-50 border border-gray-100 rounded-[12px] text-[12px] font-mono select-all text-gray-700 break-all">
                  supabase/migrations/20260617_create_transactions.sql
                </code>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-[#eceff7] rounded-[24px]">
                <p className="text-[14px] text-gray-400 font-medium">No transactions found</p>
                <p className="text-[12px] text-gray-400 mt-1">Once you complete a purchase, your history will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-[#eceff7] text-[12px] font-bold uppercase tracking-[0.1em] text-[#9199ad]">
                      <th className="pb-3 pl-4">Reference</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Tokens</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3 pr-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-[#fbfbff] last:border-0 hover:bg-[#fbfbff]/50 transition-colors text-[14px] text-[#4f5b7f]">
                        <td className="py-4 pl-4 font-mono text-[12px] text-[#7655fb] select-all">
                          {tx.reference}
                        </td>
                        <td className="py-4">
                          {new Date(tx.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-4 font-bold text-[#262525]">
                          +{tx.amount_tokens} Tokens
                        </td>
                        <td className="py-4 font-medium text-[#262525]">
                          {tx.currency === "NGN" ? "₦" : "$"}{Number(tx.price_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 pr-4 text-right">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold ${tx.status === "success"
                              ? "bg-green-50 text-green-600"
                              : tx.status === "failed"
                                ? "bg-red-50 text-red-600"
                                : "bg-gray-50 text-gray-500"
                            }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${tx.status === "success"
                                ? "bg-green-500"
                                : tx.status === "failed"
                                  ? "bg-red-500"
                                  : "bg-gray-400"
                              }`} />
                            {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
