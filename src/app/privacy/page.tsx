import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen gh-page-bg">
      <Navigation />
      <div className="gh-shell px-4 py-8 md:px-6 lg:px-10 lg:py-12">
        <div className="gh-panel px-6 py-10 md:px-10 md:py-12">
          <h1 className="font-primary text-[32px] font-bold text-[#262525] sm:text-[40px]">
            Privacy Policy
          </h1>
          <p className="mt-4 max-w-[820px] font-secondary text-[16px] leading-[1.7] text-[#5a6075] sm:text-[18px]">
            This Privacy Policy explains how GoalHyke collects, uses, and protects
            your information. This page is a placeholder. Replace this text with
            your finalized policy.
          </p>

          <div className="mt-10 space-y-6 font-secondary text-[16px] leading-[1.75] text-[#262525] sm:text-[18px]">
            <section className="gh-panel-soft px-6 py-6">
              <h2 className="text-[18px] font-bold text-[#262525] sm:text-[20px]">
                1. Information We Collect
              </h2>
              <p className="mt-2 text-[#5a6075]">
                We collect information you provide when creating an account and
                using goal workflows, as well as usage data required to operate the
                platform.
              </p>
            </section>

            <section className="gh-panel-soft px-6 py-6">
              <h2 className="text-[18px] font-bold text-[#262525] sm:text-[20px]">
                2. How We Use Information
              </h2>
              <p className="mt-2 text-[#5a6075]">
                We use information to provide, maintain, and improve GoalHyke,
                including accountability features, reminders, and security.
              </p>
            </section>

            <section className="gh-panel-soft px-6 py-6">
              <h2 className="text-[18px] font-bold text-[#262525] sm:text-[20px]">
                3. Contact
              </h2>
              <p className="mt-2 text-[#5a6075]">
                For questions about this Policy, contact{" "}
                <a
                  href="mailto:support@goalhyke.com"
                  className="font-semibold text-[#7655fb] underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current"
                >
                  support@goalhyke.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

