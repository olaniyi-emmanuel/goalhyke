"use client";

import { useState } from "react";
import Link from "next/link";

interface PricingPlan {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}

const plans: PricingPlan[] = [
  {
    name: "Free plan",
    price: "#800",
    features: [
      "Goal & habits tracking",
      "Basic reminders (push/email)",
      "1 Accountability Partner",
      "Public community challenges",
      "Basic progress charts",
    ],
  },
  {
    name: "Pro plan",
    price: "#1500",
    highlighted: true,
    features: [
      "Everything in Free",
      "Unlimited goals, WhatsApp reminders",
      "AI Goal Coach",
      "Basic progress analytics",
      "2 Accountability circles",
    ],
  },
  {
    name: "Premium plan",
    price: "#3000",
    features: [
      "Everything in Pro plan",
      "Unlimited AI coach interactions",
      "Unlimited CrushIT AI verification",
      "Unlimited Accountability circles",
      "Smart analytics & Goal prediction engine",
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
  const [selectedPlan, setSelectedPlan] = useState<string>("Pro plan");

  return (
    <section className="w-full bg-white px-4 py-[56px] sm:py-[72px]">
      <div className="mx-auto max-w-[1160px]">
        <div className="mx-auto max-w-[760px] text-center">
          <h2 className="font-primary text-[34px] font-bold text-[#262525] sm:text-[45px]">
            Our pricing plans
          </h2>
          <p className="mx-auto mt-5 max-w-[700px] font-secondary text-[18px] leading-[1.5] text-[#111111e5] sm:text-[20px]">
            Choose the perfect plan that fits your task needs. From basic task to
            custom tasks, we&apos;ve got you covered!
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.name;
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
                {plan.highlighted && (
                  <div className="absolute -top-[16px] left-1/2 -translate-x-1/2 rounded-full bg-[#7655fb] px-5 py-1.5 shadow-[0_6px_20px_rgba(118,85,251,0.25)]">
                    <span className="font-secondary text-[11px] font-bold tracking-widest text-white uppercase">
                      POPULAR PLAN
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <h3 className="font-secondary text-[30px] font-semibold text-[#262525]">
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

                <div className="mt-6 font-secondary font-bold text-[#262525]">
                  <span className="text-[46px] leading-none sm:text-[58px]">
                    {plan.price}
                  </span>
                  <span className="text-[24px] font-normal text-[#7b7474] sm:text-[30px]">
                    /month
                  </span>
                </div>

                <Link
                  href="/signup"
                  className={`mt-10 flex h-[54px] w-full items-center justify-center rounded-full border text-[18px] font-bold font-secondary transition-all ${
                    isSelected
                      ? "border-[#7655fb] bg-[#7655fb] text-white shadow-[0_12px_30px_rgba(118,85,251,0.24)] hover:bg-[#6445e0]"
                      : "border-[#d7d7d7] bg-white text-[#262525] shadow-[0_0_4px_rgba(0,0,0,0.08)] hover:border-[#7655fb] hover:text-[#7655fb]"
                  }`}
                >
                  Get Started
                </Link>

                <div className="mt-10 flex-grow">
                  <p className="font-secondary text-[22px] font-bold text-[#262525]">
                    Benefits
                  </p>
                  <div className="mt-5 flex flex-col gap-4">
                    {plan.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-3 font-secondary text-[16px] leading-[1.4] text-[#262525]"
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
    </section>
  );
}
