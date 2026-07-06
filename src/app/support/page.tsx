import React from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import TicketForm from "@/components/TicketForm";

export const metadata = {
  title: "Help Center - Support Tickets | GoalHyke",
  description: "Create a support ticket to get help with billing, technical bugs, or general inquiries.",
};

export default function SupportPage() {
  return (
    <main className="min-h-screen gh-page-bg">
      <Navigation />
      
      <div className="gh-shell px-4 py-12 md:py-16">
        <div className="text-center mb-10">
          <span className="inline-flex items-center rounded-full bg-[#7655fb]/10 px-3 py-1 text-xs font-bold tracking-wider text-[#7655fb] uppercase mb-3">
            Help Center
          </span>
          <h1 className="font-primary text-[32px] sm:text-[40px] font-extrabold text-[#262525] tracking-tight">
            How can we help you?
          </h1>
          <p className="mt-3 max-w-lg mx-auto font-secondary text-[15px] sm:text-[16px] text-[#5a6075] leading-relaxed">
            Fill out the form below and our team will classify and route your support request to resolve it as quickly as possible.
          </p>
        </div>

        <TicketForm />
      </div>

      <Footer />
    </main>
  );
}
