"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface PricingPlan {
  id: number;
  name: string;
  amount?: number;
  priceNGN: string;
  priceUSD: string;
  features: string[];
  highlighted?: boolean;
  isCustom?: boolean;
  badge?: string;
}

const plans: PricingPlan[] = [
  {
    id: 1,
    name: "Starter Pack",
    amount: 100,
    priceNGN: "₦2,000",
    priceUSD: "$7.00",
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
    priceNGN: "₦5,000",
    priceUSD: "$17.00",
    highlighted: true,
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
    priceNGN: "₦10,000",
    priceUSD: "$33.00",
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

export default function PricingSection() {
  const [selectedPlan, setSelectedPlan] = useState<string>("Consistent Pack");
  const [user, setUser] = useState<any>(null);
  const [currency, setCurrency] = useState<"NGN" | "USD">("USD");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const checkUserAndLocation = async () => {
      const supabase = createClient();
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      setUser(sessionUser);

      let resolvedCountry = "";
      if (sessionUser) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("country")
            .eq("id", sessionUser.id)
            .single();
          if (profile?.country) {
            resolvedCountry = profile.country;
          }
        } catch (e) {
          console.warn("Could not load user country:", e);
        }
      }

      if (resolvedCountry) {
        if (resolvedCountry === "Nigeria") {
          setCurrency("NGN");
        } else {
          setCurrency("USD");
        }
      } else {
        try {
          const res = await fetch("https://ipapi.co/json/");
          if (res.ok) {
            const data = await res.json();
            if (data.country === "NG") {
              setCurrency("NGN");
            } else {
              setCurrency("USD");
            }
          } else {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (tz.includes("Lagos") || tz.includes("Africa/Lagos") || tz.includes("Africa/Abidjan")) {
              setCurrency("NGN");
            } else {
              setCurrency("USD");
            }
          }
        } catch (e) {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (tz.includes("Lagos") || tz.includes("Africa/Lagos")) {
            setCurrency("NGN");
          } else {
            setCurrency("USD");
          }
        }
      }
      setIsLoaded(true);
    };

    checkUserAndLocation();
  }, []);

  return (
    <section className="w-full bg-white px-4 py-[56px] sm:py-[72px]">
      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto max-w-[760px] text-center">
          <h2 className="font-primary text-[34px] font-bold text-[#262525] sm:text-[45px]">
            Our pricing plans
          </h2>
          <p className="mx-auto mt-5 max-w-[700px] font-secondary text-[18px] leading-[1.5] text-[#111111e5] sm:text-[20px]">
            Choose the perfect token package that fits your goal-tracking needs.
            Lock stakes, verify achievements, and build lasting habits!
          </p>
        </div>

        <div 
          className={`transition-all duration-[800ms] ease-in-out ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="mt-16 grid gap-8 md:grid-cols-3 max-w-[1024px] mx-auto">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.name;
              const linkHref = user
                ? `/get-token?package=${plan.id}`
                : `/signup?redirectTo=${encodeURIComponent(`/get-token?package=${plan.id}`)}`;

              return (
                <div
                  key={plan.name}
                  onClick={() => setSelectedPlan(plan.name)}
                  className={`relative flex h-full cursor-pointer flex-col rounded-[24px] border-[3px] bg-white px-6 py-10 transition-all duration-300 hover:-translate-y-1 ${
                    isSelected
                      ? "border-[#7655fb] shadow-[0_20px_48px_rgba(118,85,251,0.12)] scale-[1.01]"
                      : "border-[#11111114] hover:border-[#11111129] hover:shadow-[0_12px_32px_rgba(17,17,17,0.04)]"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-[16px] left-1/2 -translate-x-1/2 rounded-full bg-[#7655fb] px-5 py-1.5 shadow-[0_6px_20px_rgba(118,85,251,0.25)] whitespace-nowrap">
                      <span className="font-secondary text-[11px] font-bold tracking-widest text-white uppercase">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <h3 className="font-primary text-[26px] font-bold text-[#262525]">
                      {plan.name}
                    </h3>
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        isSelected
                          ? "border-[#7655fb] bg-[#7655fb]"
                          : "border-[#11111133] bg-transparent"
                      }`}
                    >
                      {isSelected && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>

                  <div className="mt-6 font-primary font-bold text-[#262525]">
                    <span className="text-[40px] leading-none sm:text-[46px]">
                      {currency === "NGN" ? plan.priceNGN : plan.priceUSD}
                    </span>
                    <span className="text-[16px] font-normal text-[#7b7474] block mt-1.5">
                      for {plan.amount} tokens
                    </span>
                  </div>

                  <Link
                    href={linkHref}
                    className={`mt-10 flex h-[54px] w-full items-center justify-center rounded-full border text-[18px] font-bold font-primary transition-all ${
                      isSelected
                        ? "border-[#7655fb] bg-[#7655fb] text-white shadow-[0_12px_30px_rgba(118,85,251,0.24)] hover:bg-[#6445e0]"
                        : "border-[#d7d7d7] bg-white text-[#262525] shadow-[0_0_4px_rgba(0,0,0,0.08)] hover:border-[#7655fb] hover:text-[#7655fb]"
                    }`}
                  >
                    {user ? "Buy Now" : "Get Started"}
                  </Link>

                  <div className="mt-10 flex-grow">
                    <p className="font-primary text-[20px] font-bold text-[#262525]">
                      Benefits
                    </p>
                    <div className="mt-5 flex flex-col gap-4">
                      {plan.features.map((feature) => (
                        <div
                          key={feature}
                          className="flex items-start gap-3 font-secondary text-[15px] leading-[1.4] text-[#262525]"
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

          <div className="mt-12 text-center">
            <p className="font-secondary text-[16px] text-[#7b7474]">
              Looking for a custom amount of tokens?{" "}
              <Link
                href={user ? "/get-token?package=custom" : `/signup?redirectTo=${encodeURIComponent("/get-token?package=custom")}`}
                className="font-bold text-[#7655fb] hover:underline"
              >
                Configure custom package
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
