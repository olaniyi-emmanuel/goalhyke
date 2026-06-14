"use client";

import React, { useState } from "react";
import NavigationRegistered from "@/components/NavigationRegistered";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import Footer from "@/components/Footer";

export default function Links() {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const inviteCode = "HYKE-982-BUDDY";
  const inviteLink = "https://goalhyke.com/join?code=HYKE-982-BUDDY";

  const [buddies, setBuddies] = useState([
    {
      id: "buddy-1",
      name: "Adesorotosin",
      email: "referee@goalhyke.com",
      role: "Referee",
      status: "Active",
      dateConnected: "Nov 02, 2024",
    },
    {
      id: "buddy-2",
      name: "Sarah Jenkins",
      email: "sarah.j@gmail.com",
      role: "Accountability Buddy",
      status: "Active",
      dateConnected: "Oct 28, 2024",
    }
  ]);

  const [pendingRequests, setPendingRequests] = useState([
    {
      id: "pending-1",
      name: "David Kojo",
      email: "david.kojo@yahoo.com",
      role: "Accountability Buddy",
      type: "incoming",
    }
  ]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleJoinBuddy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;

    setFormSuccess(null);
    setFormError(null);

    // Mock validation
    if (inviteCodeInput.toUpperCase().startsWith("HYKE-")) {
      setFormSuccess(`Successfully requested connection with buddy for code: ${inviteCodeInput.toUpperCase()}`);
      setInviteCodeInput("");
      
      // Add to pending
      setPendingRequests((prev) => [
        ...prev,
        {
          id: `pending-${Date.now()}`,
          name: "Pending Buddy",
          email: "buddy.email@goalhyke.com",
          role: "Accountability Buddy",
          type: "outgoing",
        }
      ]);
    } else {
      setFormError("Invalid invite code format. Code should start with 'HYKE-'");
    }
  };

  const handleAcceptRequest = (id: string) => {
    const request = pendingRequests.find((r) => r.id === id);
    if (!request) return;

    setBuddies((prev) => [
      ...prev,
      {
        id: request.id,
        name: request.name,
        email: request.email,
        role: request.role,
        status: "Active",
        dateConnected: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      }
    ]);

    setPendingRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRejectRequest = (id: string) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDisconnect = (id: string) => {
    if (confirm("Are you sure you want to disconnect this connection?")) {
      setBuddies((prev) => prev.filter((b) => b.id !== id));
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <NavigationRegistered />

      <div className="flex max-w-[1280px] mx-auto min-h-[calc(100vh-110px)]">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 bg-[#f4f6fb] flex flex-col">
          {/* Header */}
          <DashboardHeader />

          {/* Content */}
          <div className="flex-1 p-8 pt-0 flex flex-col md:flex-row gap-8">
            {/* Left Column - Active Links */}
            <div className="flex-1 bg-white rounded-[20px] p-6 md:p-8 h-full flex flex-col gap-6">
              <div>
                <h1 className="text-[28px] font-bold text-[#262525] font-secondary">
                  Accountability Links
                </h1>
                <p className="text-gray-500 text-sm font-secondary mt-1">
                  Connect with partners and referees to ensure you achieve your goals
                </p>
              </div>

              {/* Connected Buddies Section */}
              <div className="flex flex-col gap-4 mt-4">
                <h3 className="text-[18px] font-bold text-[#262525] font-secondary">
                  My Connections
                </h3>

                {buddies.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {buddies.map((buddy) => (
                      <div
                        key={buddy.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[#fafafa] border border-[#e8e8e8] rounded-[16px] gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#7655fb]/10 flex items-center justify-center text-[#7655fb] font-bold shrink-0">
                            {buddy.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[15px] font-bold text-[#262525] font-secondary">
                              {buddy.name}
                            </span>
                            <span className="text-[12px] text-gray-500 font-secondary">
                              {buddy.email}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <span className="text-[12px] font-bold font-secondary text-[#7655fb] bg-[#7655fb]/10 px-3 py-1 rounded-[50px]">
                            {buddy.role}
                          </span>
                          <span className="text-[11px] text-gray-400 font-secondary">
                            Connected {buddy.dateConnected}
                          </span>
                          <button
                            onClick={() => handleDisconnect(buddy.id)}
                            className="text-gray-400 hover:text-red-500 text-[13px] font-bold font-secondary transition-colors"
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 border border-dashed border-gray-100 rounded-[16px] text-center text-gray-500 font-secondary">
                    You don't have any active accountability buddies or referees linked.
                  </div>
                )}
              </div>

              {/* Pending Requests Section */}
              {pendingRequests.length > 0 && (
                <div className="flex flex-col gap-4 mt-4">
                  <h3 className="text-[18px] font-bold text-[#262525] font-secondary">
                    Pending Invites
                  </h3>

                  <div className="flex flex-col gap-3">
                    {pendingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#fffdec] border border-[#f5ebc4] rounded-[12px] gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#e8a317]/10 flex items-center justify-center text-[#e8a317] font-bold shrink-0">
                            {req.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[14px] font-bold text-[#262525] font-secondary">
                              {req.name} {req.type === "outgoing" && "(Outgoing)"}
                            </span>
                            <span className="text-[11px] text-gray-500 font-secondary">
                              {req.email} • {req.role}
                            </span>
                          </div>
                        </div>

                        {req.type === "incoming" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptRequest(req.id)}
                              className="px-4 py-1.5 bg-[#7655fb] hover:bg-[#6445e0] text-white rounded-[16px] text-[12px] font-bold font-secondary transition-colors shadow-sm"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req.id)}
                              className="px-4 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-500 rounded-[16px] text-[12px] font-bold font-secondary transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <span className="text-[12px] text-[#e8a317] font-bold font-secondary">
                            Awaiting response
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Invitations Setup */}
            <div className="w-full md:w-[350px] shrink-0 flex flex-col gap-6">
              
              {/* Card 1: Share Invite Details */}
              <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
                <h3 className="font-bold text-[#262525] text-[17px] font-secondary">
                  Invite Buddies & Referees
                </h3>
                <p className="text-[13px] text-gray-500 font-secondary leading-relaxed">
                  Share your unique Accountability code or link with friends to let them referee your progress or join your hyke.
                </p>

                {/* Code Sharing */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-gray-400 font-secondary uppercase tracking-wider">
                    My Invite Code
                  </span>
                  <div className="flex items-center justify-between bg-[#f4f6fb] rounded-[8px] px-3.5 py-2.5 border border-gray-100 font-mono text-sm text-[#262525]">
                    <span>{inviteCode}</span>
                    <button 
                      onClick={handleCopyCode}
                      className="text-[#7655fb] hover:text-[#6445e0] text-[12px] font-bold font-secondary transition-colors"
                    >
                      {copiedCode ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* Link Sharing */}
                <div className="flex flex-col gap-2 mt-1">
                  <span className="text-[11px] font-bold text-gray-400 font-secondary uppercase tracking-wider">
                    My Invite Link
                  </span>
                  <div className="flex items-center justify-between bg-[#f4f6fb] rounded-[8px] px-3.5 py-2.5 border border-gray-100 font-mono text-[12px] text-[#262525] overflow-hidden">
                    <span className="truncate mr-2">{inviteLink}</span>
                    <button 
                      onClick={handleCopyLink}
                      className="text-[#7655fb] hover:text-[#6445e0] text-[12px] font-bold font-secondary shrink-0 transition-colors"
                    >
                      {copiedLink ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 2: Connect Buddy Code Form */}
              <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
                <h3 className="font-bold text-[#262525] text-[17px] font-secondary">
                  Join a Buddy
                </h3>
                
                <form onSubmit={handleJoinBuddy} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-400 font-secondary uppercase tracking-wider">
                      Buddy Invite Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. HYKE-771-BUDDY"
                      value={inviteCodeInput}
                      onChange={(e) => setInviteCodeInput(e.target.value)}
                      className="w-full h-[44px] px-3.5 rounded-[8px] border border-[#E0E0E0] bg-[#FAFAFA] text-[#262525] text-[14px] font-secondary focus:outline-none focus:border-[#7655fb] transition-colors"
                    />
                  </div>

                  {formError && (
                    <p className="text-[12px] text-red-500 font-secondary">{formError}</p>
                  )}
                  {formSuccess && (
                    <p className="text-[12px] text-green-600 font-secondary">{formSuccess}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full h-[44px] bg-[#7655fb] hover:bg-[#6445e0] text-white rounded-[24px] text-[14px] font-bold font-secondary shadow-md hover:shadow-lg transition-all"
                  >
                    Request Link
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
