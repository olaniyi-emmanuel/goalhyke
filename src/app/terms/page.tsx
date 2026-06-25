import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <main className="min-h-screen gh-page-bg">
      <Navigation />
      <div className="gh-shell px-4 py-8 md:px-6 lg:px-10 lg:py-12">
        <div className="gh-panel px-6 py-10 md:px-10 md:py-12">
          <h1 className="font-primary text-[32px] font-bold text-[#262525] sm:text-[40px]">
            Terms of Use
          </h1>
          <p className="mt-4 max-w-[820px] font-secondary text-[16px] leading-[1.7] text-[#5a6075] sm:text-[18px]">
            These Terms of Use govern your use of GoalHyke. This page is a
            placeholder. Replace this text with your finalized legal terms.
          </p>

          <div className="mt-10 space-y-6 font-secondary text-[16px] leading-[1.75] text-[#262525] sm:text-[18px]">
            <section className="gh-panel-soft px-6 py-6">
              <h2 className="text-[18px] font-bold text-[#262525] sm:text-[20px]">
                1. Acceptance of Terms
              </h2>
              <p className="mt-2 text-[#5a6075]">
                By accessing or using GoalHyke, you agree to be bound by these
                Terms.
              </p>
            </section>

            <section className="gh-panel-soft px-6 py-6">
              <h2 className="text-[18px] font-bold text-[#262525] sm:text-[20px]">
                2. Accounts and Security
              </h2>
              <p className="mt-2 text-[#5a6075]">
                You are responsible for maintaining the confidentiality of your
                account credentials and for all activity under your account.
              </p>
            </section>

            <section className="gh-panel-soft px-6 py-6">
              <h2 className="text-[18px] font-bold text-[#262525] sm:text-[20px]">
                3. Contact
              </h2>
              <p className="mt-2 text-[#5a6075]">
                For questions about these Terms, contact{" "}
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
