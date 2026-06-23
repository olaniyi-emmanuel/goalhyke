"use client";

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

        <div className="relative mt-16 rounded-[24px] border border-[#11111133] bg-white px-5 pb-5 pt-8 shadow-[0_12px_32px_rgba(17,17,17,0.04)] sm:px-8 sm:pb-8 lg:px-0 lg:pb-0 lg:pt-0">
          <div className="absolute left-1/2 top-0 hidden -translate-x-1/2 -translate-y-1/2 rounded-t-[6px] rounded-b-[2px] bg-[#7655fb] px-6 py-2 lg:block">
            <span className="font-secondary text-[18px] font-semibold text-white">
              POPULAR PLAN
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 lg:gap-0">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex h-full flex-col rounded-[20px] px-4 py-8 sm:px-8 lg:min-h-[618px] lg:rounded-none lg:px-6 lg:py-[58px] xl:px-10 ${
                  plan.highlighted
                    ? "border-[3px] border-[#7655fb] bg-white shadow-[0_18px_40px_rgba(118,85,251,0.08)] lg:-my-[1px] lg:rounded-[16px]"
                    : ""
                }`}
              >
                {plan.highlighted && (
                  <div className="mb-5 flex justify-center lg:hidden">
                    <span className="rounded-[8px] bg-[#7655fb] px-4 py-2 font-secondary text-[14px] font-semibold tracking-[0.02em] text-white">
                      POPULAR PLAN
                    </span>
                  </div>
                )}

                <h3 className="text-center font-secondary text-[34px] font-semibold text-[#262525] sm:text-[30px]">
                  {plan.name}
                </h3>

                <div className="mt-4 text-center font-secondary font-bold text-[#262525]">
                  <span className="text-[46px] leading-none sm:text-[58px]">
                    {plan.price}
                  </span>
                  <span className="text-[30px] text-[#7b7474] sm:text-[44px]">
                    /month
                  </span>
                </div>

                <Link
                  href="/signup"
                  className={`mt-10 flex h-[54px] w-full items-center justify-center rounded-full border text-[18px] font-bold font-secondary transition-all ${
                    plan.highlighted
                      ? "border-[#7655fb] bg-[#7655fb] text-white shadow-[0_12px_30px_rgba(118,85,251,0.24)] hover:bg-[#6445e0]"
                      : "border-[#d7d7d7] bg-white text-[#262525] shadow-[0_0_4px_rgba(0,0,0,0.08)] hover:border-[#7655fb] hover:text-[#7655fb]"
                  }`}
                >
                  Get Started
                </Link>

                <div className="mt-10">
                  <p className="font-secondary text-[25px] font-bold text-[#262525]">
                    Benefits
                  </p>
                  <div className="mt-5 flex flex-col gap-4">
                    {plan.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-3 font-secondary text-[18px] leading-[1.4] text-[#262525]"
                      >
                        <CheckIcon />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
