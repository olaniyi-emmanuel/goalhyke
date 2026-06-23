"use client";

import { useMemo, useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  label: string;
  items: FAQItem[];
}

const categories: FAQCategory[] = [
  {
    label: "General",
    items: [
      {
        question: "What is GoalHyke?",
        answer:
          "GoalHyke is an AI-powered accountability platform that helps you set meaningful goals, stay consistent, and achieve lasting results through structured guidance, habit tracking, and personalized motivation.",
      },
      {
        question: "How does GoalHyke work?",
        answer:
          "GoalHyke guides you through a 5-step system: Set your target, Set Your Why, Identify Challenges, Choose Accountability Tool, and Visualize Success. It then helps you stay consistent using AI reminders, tracking, and insights.",
      },
      {
        question: "What types of goals can I create?",
        answer:
          "You can create goals such as Health & Fitness, Career Growth, Academic Excellence, Habit building, Spiritual Growth, Skill Development, Wealth Building, and more.",
      },
      {
        question: "What makes GoalHyke different from other apps?",
        answer:
          "GoalHyke combines AI coaching, emotional motivation, accountability systems, habit tracking, and flexible goal types. Unlike typical apps, it focuses on behavior change, not just task tracking.",
      },
    ],
  },
  {
    label: "Account & Access",
    items: [
      {
        question: "How do I create an account?",
        answer:
          "You can create an account using your email address from the sign-up page. After verification, you can immediately start setting goals and tracking progress.",
      },
      {
        question: "Can I access GoalHyke on multiple devices?",
        answer:
          "Yes. Your account syncs across supported devices, so you can sign in and continue your progress anywhere.",
      },
      {
        question: "What should I do if I forget my password?",
        answer:
          "Use the password reset flow from the login screen. A reset email will be sent to the address linked to your account.",
      },
    ],
  },
  {
    label: "Goals & Progress",
    items: [
      {
        question: "Can I edit a goal after creating it?",
        answer:
          "Yes. You can update goal details, change supporting information, and review progress from your goal dashboard as your needs evolve.",
      },
      {
        question: "How is progress measured?",
        answer:
          "Progress is measured based on the target and accountability structure you set, including milestones, consistency, reports, and activity updates.",
      },
      {
        question: "Can I work on multiple goals at the same time?",
        answer:
          "Yes. GoalHyke supports multiple active goals, so you can manage habits, personal growth, and long-term commitments together.",
      },
    ],
  },
  {
    label: "AI Assistant (CrushIT)",
    items: [
      {
        question: "What does CrushIT help with?",
        answer:
          "CrushIT helps you stay on track with guidance, motivation, reminders, and smarter accountability prompts tailored to your goal workflow.",
      },
      {
        question: "Is the AI coach available on every plan?",
        answer:
          "AI support availability depends on your subscription tier. Higher plans include broader and more frequent AI interactions.",
      },
      {
        question: "Can the AI personalize suggestions for my goal?",
        answer:
          "Yes. CrushIT uses your goal type, commitments, and progress activity to provide more relevant suggestions and nudges.",
      },
    ],
  },
  {
    label: "Accountability & Support",
    items: [
      {
        question: "Can I invite friends or a referee to my goal?",
        answer:
          "Yes. Many workflows let you add supporters and invite a referee, or choose an On your Honor path when that fits your commitment style.",
      },
      {
        question: "What is an accountability circle?",
        answer:
          "An accountability circle is a support structure around your goal that helps you stay visible, consistent, and answerable for progress.",
      },
      {
        question: "Do supporters need a GoalHyke account?",
        answer:
          "Supporters may be invited through contact details depending on the flow. In-app experiences are richer when they also have GoalHyke access.",
      },
    ],
  },
  {
    label: "Privacy & Security",
    items: [
      {
        question: "Who can see my goals?",
        answer:
          "Your visibility depends on your privacy settings and the accountability options you choose. You remain in control of what is public or shared.",
      },
      {
        question: "Is my personal data secure?",
        answer:
          "GoalHyke applies standard security practices to protect account information and user data throughout the platform.",
      },
      {
        question: "Can I change privacy settings later?",
        answer:
          "Yes. You can adjust privacy preferences after creating goals if you want to limit or expand visibility.",
      },
    ],
  },
  {
    label: "Technical Support",
    items: [
      {
        question: "What should I do if something is not working?",
        answer:
          "If you run into a technical issue, refresh the page first, then contact support with details about the problem and the page you were using.",
      },
      {
        question: "How do I report a bug?",
        answer:
          "You can report bugs through the support channels listed in the site footer so the team can investigate and respond quickly.",
      },
      {
        question: "Does GoalHyke work on mobile?",
        answer:
          "Yes. GoalHyke is designed to work across desktop and mobile layouts, with responsive flows for key parts of the product.",
      },
    ],
  },
];

function MinusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 9H14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M9 4V14M4 9H14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function FAQSection() {
  const [activeCategory, setActiveCategory] = useState(categories[0].label);
  const activeItems = useMemo(
    () => categories.find((category) => category.label === activeCategory)?.items ?? [],
    [activeCategory],
  );
  const [openQuestions, setOpenQuestions] = useState<string[]>(
    categories[0].items.map((item) => item.question),
  );

  const handleCategorySelect = (label: string) => {
    setActiveCategory(label);
    const items =
      categories.find((category) => category.label === label)?.items ?? [];
    setOpenQuestions(items.map((item) => item.question));
  };

  const handleToggle = (question: string) => {
    setOpenQuestions((current) =>
      current.includes(question)
        ? current.filter((item) => item !== question)
        : [...current, question],
    );
  };

  return (
    <section className="w-full bg-white px-4 py-[56px] sm:py-[72px]">
      <div className="mx-auto max-w-[1180px]">
        <div className="mx-auto max-w-[760px] text-center">
          <h2 className="font-primary text-[34px] font-bold text-[#262525] sm:text-[45px]">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-5 max-w-[720px] font-secondary text-[18px] leading-[1.5] text-[#111111e5] sm:text-[20px]">
            We have answered some of the most re-occurring questions we get from
            users.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-[56px]">
          <div className="lg:w-[230px] lg:shrink-0">
            <div className="flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:gap-4 lg:overflow-visible">
              {categories.map((category) => {
                const active = category.label === activeCategory;
                return (
                  <button
                    key={category.label}
                    type="button"
                    onClick={() => handleCategorySelect(category.label)}
                    className={`whitespace-nowrap rounded-[6px] px-4 py-3 text-left font-secondary text-[16px] transition-colors lg:w-full lg:text-[18px] ${
                      active
                        ? "bg-[#7655fb] text-white"
                        : "text-[#111111e5] hover:bg-[#f6f3ff]"
                    }`}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex flex-col gap-5">
              {activeItems.map((item) => {
                const isOpen = openQuestions.includes(item.question);
                return (
                  <div key={item.question} className="rounded-[4px]">
                    <button
                      type="button"
                      onClick={() => handleToggle(item.question)}
                      className="flex w-full items-center justify-between gap-4 rounded-[4px] border border-[#7655fb] bg-white px-[14px] py-[10px] text-left"
                    >
                      <span className="font-secondary text-[18px] font-medium leading-[1.35] text-[#111111e5] sm:text-[20px]">
                        {item.question}
                      </span>
                      <span className="shrink-0 text-[#111111e5]">
                        {isOpen ? <MinusIcon /> : <PlusIcon />}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="bg-[#f0f0f0] px-[18px] pb-[24px] pt-[18px]">
                        <p className="max-w-[658px] font-secondary text-[16px] leading-[1.45] text-[#111111e5] sm:text-[18px]">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
