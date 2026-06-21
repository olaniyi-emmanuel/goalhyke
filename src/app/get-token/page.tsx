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
}

const tokenPackages: TokenPackage[] = [
  { id: 1, name: "Starter", amount: 10, prices: { NGN: 200, USD: 1 } },
  { id: 2, name: "Consistent", amount: 25, prices: { NGN: 3250, USD: 10 }, badge: "Popular" },
  { id: 3, name: "Achiever", amount: 60, prices: { NGN: 6000, USD: 20 }, badge: "Best Value" },
  { id: 4, name: "Elite", amount: 150, prices: { NGN: 12000, USD: 40 } },
];

const TokenIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 7H5C3.89543 7 3 7.89543 3 9V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V9C21 7.89543 20.1046 7 19 7Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 13H7C8.10457 13 9 12.1046 9 11V9C9 7.89543 8.10457 7 7 7H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 13H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="17" cy="13" r="1" fill="currentColor"/>
  </svg>
);

export default function GetToken() {
  const [selectedId, setSelectedId] = useState<number>(2); // Default to "Consistent" package
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

      // 2. Perform Geolocation Lookup if no profile country is found
      if (resolvedCountry) {
        if (resolvedCountry === "Nigeria") {
          setCurrency("NGN");
          setDetectedCountry("Nigeria");
        } else {
          setCurrency("USD");
          setDetectedCountry(resolvedCountry);
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
            } else {
              setCurrency("USD");
              setDetectedCountry(data.country_name || "Global");
            }
          } else {
            // Fallback based on timezone
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (tz.includes("Lagos") || tz.includes("Africa/Lagos") || tz.includes("Africa/Abidjan")) {
              setCurrency("NGN");
              setDetectedCountry("Nigeria (Timezone resolved)");
            } else {
              setCurrency("USD");
              setDetectedCountry("Global (Timezone resolved)");
            }
          }
        } catch (e) {
          console.warn("Location detection failed, defaulting to USD.", e);
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (tz.includes("Lagos") || tz.includes("Africa/Lagos")) {
            setCurrency("NGN");
            setDetectedCountry("Nigeria (Timezone resolved)");
          } else {
            setCurrency("USD");
            setDetectedCountry("Global (Fallback)");
          }
        } finally {
          setIsDetectingLocation(false);
        }
      }
    };

    initializePage();
  }, []);

  const selectedPackage = tokenPackages.find((p) => p.id === selectedId);

  const handleRecharge = async () => {
    if (!user) {
      alert("Please log in to purchase tokens.");
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
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 pt-4">
                  {tokenPackages.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedId(pkg.id)}
                      className={`relative rounded-[24px] border p-6 text-left transition-all duration-300 flex flex-col justify-between cursor-pointer min-h-[200px] ${
                        selectedId === pkg.id
                          ? "border-[#7655fb] bg-[linear-gradient(180deg,rgba(118,85,251,0.08)_0%,rgba(65,105,225,0.04)_100%)] shadow-[0_18px_36px_rgba(118,85,251,0.14)]"
                          : "border-[#e6e9f3] bg-white hover:border-[#cfd7ff] hover:bg-[#fbfbff]"
                      }`}
                    >
                      {pkg.badge && (
                        <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-[#4169e1] to-[#7655fb] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                          {pkg.badge}
                        </span>
                      )}
                      <div>
                        <div className="mb-6 flex items-center justify-between">
                          <span className="text-[12px] font-bold uppercase tracking-wider text-[#7655fb]">
                            {pkg.name}
                          </span>
                          <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#eef2ff] text-[#7655fb]">
                            <TokenIcon />
                          </div>
                        </div>
                        <div className="text-[44px] font-extrabold text-[#262525] leading-none">
                          {pkg.amount}
                        </div>
                        <div className="mt-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-[#8b93a7]">
                          Tokens
                        </div>
                      </div>
                      <div className="mt-8 text-[18px] font-bold text-[#4f5b7f]">
                        {currency === "NGN" ? "NGN" : "$"}{" "}
                        {currency === "NGN"
                          ? pkg.prices.NGN.toLocaleString()
                          : pkg.prices.USD.toFixed(2)}
                      </div>
                    </button>
                  ))}
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
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold ${
                            tx.status === "success" 
                              ? "bg-green-50 text-green-600" 
                              : tx.status === "failed"
                              ? "bg-red-50 text-red-600"
                              : "bg-gray-50 text-gray-500"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              tx.status === "success" 
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
