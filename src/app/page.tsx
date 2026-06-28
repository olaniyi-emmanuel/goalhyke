import Navigation from "@/components/Navigation";
import HeroHeadline from "@/components/HeroHeadline";
import GoalSelector from "@/components/GoalSelector";
import HowItWorksLabel from "@/components/HowItWorksLabel";
import OurHabitSolutions from "@/components/OurHabitSolutions";
import BehaviouralSolution from "@/components/BehaviouralSolution";
import Milestones from "@/components/Milestones";
import ProgressConsistency from "@/components/ProgressConsistency";
import WhatsGoalHyke from "@/components/WhatsGoalHyke";
import AboutUsSection from "@/components/AboutUsSection";
import WhosItFor from "@/components/WhosItFor";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedParams = searchParams instanceof Promise ? await searchParams : searchParams;
  const error = resolvedParams?.error;
  const errorCode = resolvedParams?.error_code;
  const errorDescription = resolvedParams?.error_description;
  const code = resolvedParams?.code;

  if (error || errorCode || errorDescription) {
    const errorMsg = errorDescription || error || `Authentication failed: ${errorCode || "unknown error"}`;
    const errorString = Array.isArray(errorMsg) ? errorMsg[0] : errorMsg;
    redirect(`/login?error=${encodeURIComponent(errorString)}`);
  }

  if (code) {
    const codeString = Array.isArray(code) ? code[0] : code;
    const next = resolvedParams?.next;
    const nextString = Array.isArray(next) ? next[0] : next;
    redirect(`/auth/callback?code=${encodeURIComponent(codeString)}${nextString ? `&next=${encodeURIComponent(nextString)}` : ""}`);
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "GoalHyker";

  return (
    <main className="min-h-screen bg-white">
      <Navigation />

      {/* Hero & Features Section */}
      <div className="max-w-[1024px] mx-auto pb-12">
        {session ? (
          <div className="gh-shell px-4 pt-12 flex flex-col items-center gap-4 text-center mt-6">
            <h2 className="text-[26px] sm:text-[34px] md:text-[38px] lg:text-[44px] leading-[1.2] font-medium font-primary text-[#262525]">
              Welcome back, <span className="text-[#7655fb] font-semibold">{userName}</span> 👋
            </h2>
            <p className="text-[14px] sm:text-[16px] text-gray-500 max-w-[600px] leading-relaxed font-secondary">
              Continue your journey. Establish your daily habits, lock token stakes, and conquer your milestones with accountability.
            </p>
            <div className="flex gap-4 mt-4 flex-wrap justify-center">
              <Link
                href="/dashboard"
                className="gh-btn-primary px-8 py-3 text-[14px] font-bold"
              >
                CONTINUE TO DASHBOARD
              </Link>
              <Link
                href="/set-goal"
                className="gh-btn-secondary px-8 py-3 text-[14px] font-bold"
              >
                SET NEW GOAL
              </Link>
            </div>
          </div>
        ) : (
          <>
            <HeroHeadline />
            <GoalSelector />
          </>
        )}

        {/* Dashboard Preview */}
        <div className="relative w-full max-w-[960px] mx-auto mt-[20px] lg:mt-[24px] px-4">
          {/* Desktop Image */}
          <div className="hidden md:block relative aspect-[1240/768] w-full rounded-[20px] overflow-hidden shadow-2xl border border-gray-100">
            <Image
              src="/images/screenshot_573_2886.png"
              alt="Goal Hyke Dashboard Preview"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Floating Action Button (Desktop) */}
          <div className="hidden md:block absolute top-[25%] -right-[16px] z-20 drop-shadow-xl hover:scale-105 transition-transform cursor-pointer">
            <Image
              src="/images/dashboard-icon.svg"
              width={48}
              height={48}
              alt="Dashboard Action"
            />
          </div>

          {/* Mobile Image */}
          <div className="block md:hidden relative w-full aspect-[347/390] rounded-[20px] overflow-hidden shadow-2xl border border-gray-100">
            <Image
              src="/images/screenshot_576_5866.png"
              alt="Goal Hyke Dashboard Preview"
              fill
              className="object-contain bg-[#F9FAFF]"
              priority
            />
          </div>

          {/* Decorative Elements around preview */}
          <div className="absolute -top-[10%] -left-[5%] w-[30%] h-[30%] bg-[#7655fb]/5 rounded-full blur-3xl -z-10" />
          <div className="absolute -bottom-[10%] -right-[5%] w-[30%] h-[30%] bg-[#4169e1]/5 rounded-full blur-3xl -z-10" />
        </div>

        {/* How It Works Section */}
        <div
          id="how-it-works"
          className="mt-16 mb-8 flex flex-col items-center gap-4 scroll-mt-20"
        >
          <HowItWorksLabel />
        </div>

        {/* Feature Cards */}
        <div className="px-4 flex flex-col gap-6 overflow-hidden">
          <Milestones />
          <ProgressConsistency />
        </div>
      </div>

      {/* Full Width Section */}
      <WhatsGoalHyke />

      <AboutUsSection />

      {/* Who's It For Section */}
      <div className="max-w-[1280px] mx-auto">
        <WhosItFor />
      </div>

      <PricingSection />

      {/* Habit Solutions Section */}
      <div className="max-w-[1024px] mx-auto py-12 flex flex-col items-center gap-8">
        <OurHabitSolutions />
        <BehaviouralSolution />
      </div>

      <FAQSection />

      {/* Footer */}
      <Footer />
    </main>
  );
}
