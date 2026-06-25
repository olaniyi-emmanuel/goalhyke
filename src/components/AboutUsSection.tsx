"use client";

export default function AboutUsSection() {
  return (
    <section id="about-us" className="w-full bg-white px-4 py-[56px] sm:py-[72px]">
      <div className="gh-shell">
        <div className="mx-auto max-w-[860px] text-center">
          <h2 className="font-primary text-[34px] font-bold text-[#262525] sm:text-[45px]">
            About GoalHyke
          </h2>
          <p className="mx-auto mt-5 max-w-[760px] font-secondary text-[18px] leading-[1.5] text-[#111111e5] sm:text-[20px]">
            GoalHyke is an AI-powered accountability platform built to help you set
            meaningful goals, stay consistent, and achieve real results through
            structure, support, and motivation.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="gh-panel-soft px-6 py-8 text-left">
            <p className="font-secondary text-[18px] font-bold text-[#262525]">
              Structure
            </p>
            <p className="mt-3 font-secondary text-[15px] leading-7 text-[#5a6075]">
              Guided workflows that turn vague ambition into clear weekly action.
            </p>
          </div>
          <div className="gh-panel-soft px-6 py-8 text-left">
            <p className="font-secondary text-[18px] font-bold text-[#262525]">
              Accountability
            </p>
            <p className="mt-3 font-secondary text-[15px] leading-7 text-[#5a6075]">
              Supporters, referees, and commitment mechanics that keep you honest.
            </p>
          </div>
          <div className="gh-panel-soft px-6 py-8 text-left">
            <p className="font-secondary text-[18px] font-bold text-[#262525]">
              Motivation
            </p>
            <p className="mt-3 font-secondary text-[15px] leading-7 text-[#5a6075]">
              Smart prompts, reminders, and progress insights to stay on track.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

