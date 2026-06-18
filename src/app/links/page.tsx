"use client";

import React, { useState, useEffect, useRef } from "react";
import NavigationRegistered from "@/components/NavigationRegistered";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Connection {
  id: string;
  buddyId: string;
  name: string;
  username: string;
  role: string;
  status: string;
  dateConnected: string;
  type: "incoming" | "outgoing";
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  creatorId: string;
  memberCount: number;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: Date;
}

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export default function Links() {
  // Tabs & Navigation State
  const [activeTab, setActiveTab] = useState<"connections" | "groups" | "meetings">("connections");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Invite & Connections State
  const [inviteCode, setInviteCode] = useState("HYKE-LOADING");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [buddies, setBuddies] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);

  // Groups & Chat State
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const [groupCreateError, setGroupCreateError] = useState<string | null>(null);
  const [addMemberInput, setAddMemberInput] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addMemberSuccess, setAddMemberSuccess] = useState<string | null>(null);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);

  // Meetings State
  interface Meeting {
    id: string;
    title: string;
    description: string | null;
    time: string;
    isActive: boolean;
    isCompleted: boolean;
  }
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [newMeetingTitle, setNewMeetingTitle] = useState("");
  const [newMeetingDesc, setNewMeetingDesc] = useState("");
  const [newMeetingTime, setNewMeetingTime] = useState("");

  // Scrolling anchor for chat
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const inviteLink = typeof window !== "undefined"
    ? `${window.location.origin}/links?join=${inviteCode}`
    : `https://goalhyke.com/links?join=${inviteCode}`;

  const fetchConnectionsAndProfile = async (userId: string) => {
    try {
      const supabase = createClient();

      // 1. Fetch current profile to get invite code
      const { data: profile } = await supabase
        .from("profiles")
        .select("invite_code")
        .eq("id", userId)
        .single();

      if (profile?.invite_code) {
        setInviteCode(profile.invite_code);
      }

      // 2. Fetch connections
      const { data: conns } = await supabase
        .from("accountability_connections")
        .select("*")
        .or(`user_id.eq.${userId},buddy_id.eq.${userId}`);

      if (conns && conns.length > 0) {
        const buddyIds = conns.map((c) => (c.user_id === userId ? c.buddy_id : c.user_id));
        
        // Fetch buddy profiles
        const { data: buddyProfiles } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", buddyIds);

        const profileMap = new Map(buddyProfiles?.map((p) => [p.id, p]) || []);

        const activeList: Connection[] = [];
        const pendingList: Connection[] = [];

        conns.forEach((c) => {
          const buddyId = c.user_id === userId ? c.buddy_id : c.user_id;
          const buddyProfile = profileMap.get(buddyId);
          
          const connectionObj: Connection = {
            id: c.id,
            buddyId: buddyId,
            name: buddyProfile?.full_name || buddyProfile?.username || "Unknown Buddy",
            username: buddyProfile?.username || "",
            role: c.role,
            status: c.status,
            dateConnected: new Date(c.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            }),
            type: c.buddy_id === userId ? "incoming" : "outgoing",
          };

          if (c.status === "active") {
            activeList.push(connectionObj);
          } else {
            pendingList.push(connectionObj);
          }
        });

        setBuddies(activeList);
        setPendingRequests(pendingList);
      } else {
        setBuddies([]);
        setPendingRequests([]);
      }
    } catch (err) {
      console.error("Failed to load connections:", err);
    }
  };

  const fetchGroups = async (userId: string) => {
    try {
      const supabase = createClient();

      // 1. Fetch group member relationships
      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", userId);

      const groupIds = memberships?.map((m) => m.group_id) || [];

      // 2. Fetch groups where user is creator or member
      let query = supabase.from("groups").select("*");
      if (groupIds.length > 0) {
        // PostgREST syntax for OR with IN check
        const formattedGroupIds = groupIds.map(id => `"${id}"`).join(",");
        query = query.or(`creator_id.eq.${userId},id.in.(${formattedGroupIds})`);
      } else {
        query = query.eq("creator_id", userId);
      }

      const { data: userGroups } = await query.order("created_at", { ascending: false });

      if (userGroups) {
        // Fetch member counts for each group
        const { data: counts } = await supabase
          .from("group_members")
          .select("group_id");

        const countMap = new Map<string, number>();
        counts?.forEach((m) => {
          countMap.set(m.group_id, (countMap.get(m.group_id) || 0) + 1);
        });

        setGroups(
          userGroups.map((g) => ({
            id: g.id,
            name: g.name,
            description: g.description,
            creatorId: g.creator_id,
            memberCount: countMap.get(g.id) || 1,
          }))
        );
      } else {
        setGroups([]);
      }
    } catch (err) {
      console.error("Failed to load groups:", err);
    }
  };

  const fetchGroupDetails = async (groupId: string) => {
    try {
      const supabase = createClient();

      // 1. Fetch group members
      const { data: members } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId);

      const memberIds = members?.map((m) => m.user_id) || [];

      if (memberIds.length === 0) return;

      // 2. Fetch profiles of members
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", memberIds);

      setGroupMembers(profiles || []);

      // 3. Fetch messages
      const { data: msgs } = await supabase
        .from("group_messages")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
      
      setMessages(
        (msgs || []).map((m) => ({
          id: m.id,
          senderId: m.sender_id,
          senderName: profileMap.get(m.sender_id)?.full_name || profileMap.get(m.sender_id)?.username || "Member",
          message: m.message,
          createdAt: new Date(m.created_at),
        }))
      );
    } catch (err) {
      console.error("Failed to load group details:", err);
    }
  };

  const fetchMeetings = async (userId: string) => {
    try {
      const supabase = createClient();
      const { data: mtgs } = await supabase
        .from("meetings")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (mtgs && mtgs.length > 0) {
        setMeetings(
          mtgs.map((m) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            time: m.meeting_time,
            isActive: m.is_active,
            isCompleted: m.is_completed,
          }))
        );
      } else {
        // Fallback mock meetings matching reference layout exactly!
        setMeetings([
          { id: "mock-m1", title: "Sales Team Meeting", description: "The sales team discussed their progress towards the monthly targets", time: "12:40", isActive: true, isCompleted: false },
          { id: "mock-m2", title: "Marketing Team Meeting", description: "team discussed their upcoming campaigns", time: "14:40", isActive: true, isCompleted: false },
          { id: "mock-m3", title: "Project Team Meeting", description: "Reviewed the project timeline", time: "19:40", isActive: true, isCompleted: false },
          { id: "mock-m4", title: "Executive Team Meeting", description: "The executive team discussed the overall performance", time: "20:11", isActive: true, isCompleted: false },
          { id: "mock-m5", title: "Board Meeting", description: "The board discussed the company long-term strategy", time: "2:40", isActive: true, isCompleted: true },
        ]);
      }
    } catch (err) {
      console.error("Failed to fetch meetings:", err);
    }
  };

  const handleToggleComplete = async (meetingId: string, currentCompleted: boolean) => {
    if (meetingId.startsWith("mock-")) {
      setMeetings((prev) =>
        prev.map((m) => (m.id === meetingId ? { ...m, isCompleted: !currentCompleted } : m))
      );
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("meetings")
        .update({ is_completed: !currentCompleted })
        .eq("id", meetingId);

      if (error) throw error;
      if (user) fetchMeetings(user.id);
    } catch (err) {
      console.error("Failed to toggle completion:", err);
    }
  };

  const handleToggleActive = async (meetingId: string, currentActive: boolean) => {
    if (meetingId.startsWith("mock-")) {
      setMeetings((prev) =>
        prev.map((m) => (m.id === meetingId ? { ...m, isActive: !currentActive } : m))
      );
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("meetings")
        .update({ is_active: !currentActive })
        .eq("id", meetingId);

      if (error) throw error;
      if (user) fetchMeetings(user.id);
    } catch (err) {
      console.error("Failed to toggle active status:", err);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingTitle.trim() || !newMeetingTime.trim() || !user) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("meetings")
        .insert({
          user_id: user.id,
          title: newMeetingTitle.trim(),
          description: newMeetingDesc.trim() || null,
          meeting_time: newMeetingTime.trim(),
          is_active: true,
          is_completed: false,
        });

      if (error) throw error;

      setNewMeetingTitle("");
      setNewMeetingDesc("");
      setNewMeetingTime("");
      
      await fetchMeetings(user.id);
    } catch (err) {
      console.error("Failed to create meeting:", err);
    }
  };

  // Auth state listener & startup
  useEffect(() => {
    const supabase = createClient();
    
    const initialize = async () => {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      if (currentUser) {
        await fetchConnectionsAndProfile(currentUser.id);
        await fetchGroups(currentUser.id);
        await fetchMeetings(currentUser.id);

        // Pre-fill invite code from join parameters
        const params = new URLSearchParams(window.location.search);
        const joinCode = params.get("join");
        if (joinCode) {
          setInviteCodeInput(joinCode);
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
      setLoading(false);
    };

    initialize();
  }, []);

  // Fetch chat room details whenever selected group shifts
  useEffect(() => {
    if (activeGroupId) {
      fetchGroupDetails(activeGroupId);

      // Realtime subscription setup
      const supabase = createClient();
      const channel = supabase
        .channel(`room-${activeGroupId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "group_messages",
            filter: `group_id=eq.${activeGroupId}`,
          },
          async (payload) => {
            const newMessage = payload.new;
            
            // Check if profile exists in current membership state
            const existingSender = groupMembers.find(m => m.id === newMessage.sender_id);
            let senderName = "Member";
            
            if (existingSender) {
              senderName = existingSender.full_name || existingSender.username || "Member";
            } else {
              // Fetch sender details directly
              const { data: profile } = await supabase
                .from("profiles")
                .select("full_name, username")
                .eq("id", newMessage.sender_id)
                .single();
              if (profile) {
                senderName = profile.full_name || profile.username || "Member";
              }
            }

            setMessages((prev) => {
              // Prevent duplicate insertions
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [
                ...prev,
                {
                  id: newMessage.id,
                  senderId: newMessage.sender_id,
                  senderName,
                  message: newMessage.message,
                  createdAt: new Date(newMessage.created_at),
                }
              ];
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setMessages([]);
      setGroupMembers([]);
    }
  }, [activeGroupId]);

  // Keep chat scrolled down
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Copy helpers
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

  // Join a Buddy connection action
  const handleJoinBuddy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim() || !user) return;

    setFormError(null);
    setFormSuccess(null);

    try {
      const supabase = createClient();
      const cleanCode = inviteCodeInput.trim().toUpperCase();

      // 1. Fetch profile with matching code
      const { data: buddyProfile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("invite_code", cleanCode)
        .single();

      if (profileErr || !buddyProfile) {
        setFormError("Invite code not found. Please verify the code.");
        return;
      }

      if (buddyProfile.id === user.id) {
        setFormError("You cannot connect with your own invite code.");
        return;
      }

      // 2. Check if a connection already exists
      const { data: existingConn } = await supabase
        .from("accountability_connections")
        .select("id, status")
        .or(`and(user_id.eq.${user.id},buddy_id.eq.${buddyProfile.id}),and(user_id.eq.${buddyProfile.id},buddy_id.eq.${user.id})`)
        .maybeSingle();

      if (existingConn) {
        if (existingConn.status === "active") {
          setFormError("You are already connected with this user.");
        } else {
          setFormError("A pending connection request already exists.");
        }
        return;
      }

      // 3. Create connection request record
      const { error: insertErr } = await supabase
        .from("accountability_connections")
        .insert({
          user_id: user.id,
          buddy_id: buddyProfile.id,
          status: "pending",
          role: "Accountability Buddy",
        });

      if (insertErr) throw insertErr;

      setFormSuccess("Connection request sent successfully!");
      setInviteCodeInput("");
      
      // Refresh list
      await fetchConnectionsAndProfile(user.id);
    } catch (err) {
      console.error("Failed to link buddy:", err);
      setFormError("Failed to send connection request.");
    }
  };

  // Connection modifications
  const handleAcceptRequest = async (connectionId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("accountability_connections")
        .update({ status: "active" })
        .eq("id", connectionId);

      if (error) throw error;

      if (user) {
        await fetchConnectionsAndProfile(user.id);
      }
    } catch (err) {
      console.error("Failed to accept connection:", err);
    }
  };

  const handleRejectRequest = async (connectionId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("accountability_connections")
        .delete()
        .eq("id", connectionId);

      if (error) throw error;

      if (user) {
        await fetchConnectionsAndProfile(user.id);
      }
    } catch (err) {
      console.error("Failed to reject connection:", err);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm("Are you sure you want to disconnect this connection?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("accountability_connections")
        .delete()
        .eq("id", connectionId);

      if (error) throw error;

      if (user) {
        await fetchConnectionsAndProfile(user.id);
      }
    } catch (err) {
      console.error("Failed to disconnect connection:", err);
    }
  };

  // Group creation action
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !user) return;

    setIsSubmittingGroup(true);
    setGroupCreateError(null);

    try {
      const supabase = createClient();

      // 1. Create group
      const { data: newGroup, error: groupErr } = await supabase
        .from("groups")
        .insert({
          name: newGroupName.trim(),
          description: newGroupDesc.trim() || null,
          creator_id: user.id,
        })
        .select()
        .single();

      if (groupErr) throw groupErr;

      // 2. Add creator to group membership list
      const { error: memberErr } = await supabase
        .from("group_members")
        .insert({
          group_id: newGroup.id,
          user_id: user.id,
        });

      if (memberErr) throw memberErr;

      setNewGroupName("");
      setNewGroupDesc("");
      setIsCreatingGroup(false);

      // Refresh groups list and select new group
      await fetchGroups(user.id);
      setActiveGroupId(newGroup.id);
    } catch (err: any) {
      console.error("Failed to create group:", err);
      setGroupCreateError(err?.message || "An unexpected error occurred while creating the group.");
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  // Add a member by username
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMemberInput.trim() || !activeGroupId) return;

    setAddMemberError(null);
    setAddMemberSuccess(null);

    try {
      const supabase = createClient();

      // 1. Find profile by username
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("username", addMemberInput.trim())
        .single();

      if (profileErr || !profile) {
        setAddMemberError("Username not found. Please verify the exact username.");
        return;
      }

      // 2. Check if already a member
      const { data: existing } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", activeGroupId)
        .eq("user_id", profile.id)
        .maybeSingle();

      if (existing) {
        setAddMemberError("This user is already a member of the group.");
        return;
      }

      // 3. Add to members list
      const { error: addErr } = await supabase
        .from("group_members")
        .insert({
          group_id: activeGroupId,
          user_id: profile.id,
        });

      if (addErr) throw addErr;

      setAddMemberSuccess(`Successfully added @${profile.username}!`);
      setAddMemberInput("");
      
      // Refresh group details
      await fetchGroupDetails(activeGroupId);
    } catch (err) {
      console.error("Failed to add member:", err);
      setAddMemberError("Failed to add user to the group.");
    }
  };

  // Chat message submit
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeGroupId || !user) return;

    try {
      const supabase = createClient();
      const msgText = messageInput.trim();
      setMessageInput("");

      const { data, error } = await supabase
        .from("group_messages")
        .insert({
          group_id: activeGroupId,
          sender_id: user.id,
          message: msgText,
        })
        .select()
        .single();

      if (error) throw error;

      // Append locally right away
      setMessages((prev) => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [
          ...prev,
          {
            id: data.id,
            senderId: data.sender_id,
            senderName: user.user_metadata?.full_name || user.email || "Me",
            message: data.message,
            createdAt: new Date(data.created_at),
          }
        ];
      });
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <NavigationRegistered />

      <div className="flex max-w-[1280px] mx-auto min-h-[calc(100vh-110px)]">
        <Sidebar />

        <div className="flex-1 bg-[#f4f6fb] flex flex-col">
          <div className="p-8 pb-12">
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-6">
              <div>
                <h1 className="text-[32px] font-bold text-[#262525]">
                  Accountability Links
                </h1>
                <p className="text-[14px] text-[#6f6f78] mt-1">
                  Connect with partners and referees to ensure you achieve your goals
                </p>
              </div>

              {/* Segmented Tab Switcher */}
              <div className="flex bg-[#eef2ff] p-1 rounded-full w-fit shrink-0 self-start md:self-auto">
                <button
                  onClick={() => setActiveTab("connections")}
                  className={`rounded-full px-5 py-2 text-[13px] font-bold transition-all duration-300 cursor-pointer ${
                    activeTab === "connections"
                      ? "bg-gradient-to-r from-[#4169e1] to-[#7655fb] text-white shadow-sm"
                      : "text-[#7a7f90] hover:text-[#4f5b7f]"
                  }`}
                >
                  Connections
                </button>
                <button
                  onClick={() => setActiveTab("groups")}
                  className={`rounded-full px-5 py-2 text-[13px] font-bold transition-all duration-300 cursor-pointer ${
                    activeTab === "groups"
                      ? "bg-gradient-to-r from-[#4169e1] to-[#7655fb] text-white shadow-sm"
                      : "text-[#7a7f90] hover:text-[#4f5b7f]"
                  }`}
                >
                  Groups & Chats
                </button>
                <button
                  onClick={() => setActiveTab("meetings")}
                  className={`rounded-full px-5 py-2 text-[13px] font-bold transition-all duration-300 cursor-pointer ${
                    activeTab === "meetings"
                      ? "bg-gradient-to-r from-[#4169e1] to-[#7655fb] text-white shadow-sm"
                      : "text-[#7a7f90] hover:text-[#4f5b7f]"
                  }`}
                >
                  Meetings
                </button>
              </div>
            </div>

            {loading ? (
              <div className="rounded-[28px] border border-white/70 bg-white p-12 shadow-[0_20px_60px_rgba(24,33,77,0.08)]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#7655fb] border-t-transparent" />
                  <p className="text-[15px] font-medium text-[#6f6f78]">
                    Loading accountability services...
                  </p>
                </div>
              </div>
            ) : !user ? (
              <div className="rounded-[28px] border border-white/70 bg-white p-12 shadow-[0_20px_60px_rgba(24,33,77,0.08)] text-center">
                <p className="text-[16px] text-gray-500 font-bold">You must be logged in to view accountability resources.</p>
                <Link href="/login" className="gh-btn-primary mt-4 inline-flex px-6 py-2.5 rounded-full">
                  Login Page
                </Link>
              </div>
            ) : activeTab === "connections" ? (
              /* Tab 1: Connections and Requests (Existing Layout, Database Bound) */
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left Column - Active Links */}
                <div className="flex-1 bg-white rounded-[30px] border border-white/60 p-6 md:p-8 shadow-[0_24px_70px_rgba(24,33,77,0.08)] flex flex-col gap-6">
                  {/* Connected Buddies Section */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-[20px] font-bold text-[#262525]">
                      My Connections
                    </h3>

                    {buddies.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        {buddies.map((buddy) => (
                          <div
                            key={buddy.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[#fcfcff] border border-[#ececf7] rounded-[22px] gap-4 shadow-[0_8px_24px_rgba(24,33,77,0.02)]"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#7655fb]/10 flex items-center justify-center text-[#7655fb] font-black shrink-0">
                                {buddy.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[15px] font-bold text-[#262525] truncate">
                                  {buddy.name}
                                </span>
                                <span className="text-[12px] text-gray-400 truncate">
                                  @{buddy.username}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                              <span className="text-[11px] font-black text-[#7655fb] bg-[#7655fb]/10 px-3 py-1 rounded-full uppercase tracking-wide">
                                {buddy.role}
                              </span>
                              <span className="text-[11px] text-gray-400">
                                Linked {buddy.dateConnected}
                              </span>
                              <button
                                onClick={() => handleDisconnect(buddy.id)}
                                className="text-[#8f8e98] hover:text-red-500 text-[13px] font-bold transition-colors cursor-pointer"
                              >
                                Disconnect
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 border border-dashed border-[#d9def4] bg-[#fbfbff] rounded-[22px] text-center text-gray-400 text-[14px]">
                        You don&apos;t have any active accountability buddies or referees linked.
                      </div>
                    )}
                  </div>

                  {/* Pending Requests Section */}
                  {pendingRequests.length > 0 && (
                    <div className="flex flex-col gap-4 mt-4 border-t border-gray-100 pt-6">
                      <h3 className="text-[20px] font-bold text-[#262525]">
                        Pending Requests
                      </h3>

                      <div className="flex flex-col gap-3">
                        {pendingRequests.map((req) => (
                          <div
                            key={req.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#fffdf0] border border-[#f5ead3] rounded-[18px] gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#e8a317]/10 flex items-center justify-center text-[#e8a317] font-black shrink-0">
                                {req.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[14px] font-bold text-[#262525] truncate">
                                  {req.name} {req.type === "outgoing" && "(Awaiting Approval)"}
                                </span>
                                <span className="text-[11px] text-gray-500">
                                  @{req.username} • {req.role}
                                </span>
                              </div>
                            </div>

                            {req.type === "incoming" ? (
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => handleAcceptRequest(req.id)}
                                  className="px-4 py-1.5 bg-[#7655fb] hover:bg-[#6445e0] text-white rounded-[16px] text-[12px] font-bold transition-colors cursor-pointer shadow-md shadow-[#7655fb]/10"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(req.id)}
                                  className="px-4 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-500 rounded-[16px] text-[12px] font-bold transition-colors cursor-pointer"
                                >
                                  Decline
                                </button>
                              </div>
                            ) : (
                              <span className="text-[12px] text-[#e8a317] font-bold shrink-0">
                                Outgoing Request
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
                  {/* Share Invite Details Card */}
                  <div className="bg-white rounded-[30px] border border-white/60 p-6 shadow-[0_24px_70px_rgba(24,33,77,0.08)] flex flex-col gap-5">
                    <h3 className="font-bold text-[#262525] text-[18px]">
                      Invite Partners
                    </h3>
                    <p className="text-[13px] text-[#6f6f78] leading-relaxed">
                      Share your unique accountability code or link with friends to let them referee your progress or join your hyke.
                    </p>

                    {/* Code Sharing */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-bold text-[#8f8e98] uppercase tracking-wider">
                        My Invite Code
                      </span>
                      <div className="flex items-center justify-between bg-[#f4f6fb] rounded-[14px] px-4 py-3 border border-gray-100 font-mono text-sm text-[#262525]">
                        <span className="font-bold tracking-wider">{inviteCode}</span>
                        <button 
                          onClick={handleCopyCode}
                          className="text-[#7655fb] hover:text-[#6445e0] text-[12px] font-bold transition-colors cursor-pointer"
                        >
                          {copiedCode ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>

                    {/* Link Sharing */}
                    <div className="flex flex-col gap-2 mt-1">
                      <span className="text-[11px] font-bold text-[#8f8e98] uppercase tracking-wider">
                        My Invite Link
                      </span>
                      <div className="flex items-center justify-between bg-[#f4f6fb] rounded-[14px] px-4 py-3 border border-gray-100 font-mono text-[12px] text-[#262525] overflow-hidden">
                        <span className="truncate mr-2 text-gray-500">{inviteLink}</span>
                        <button 
                          onClick={handleCopyLink}
                          className="text-[#7655fb] hover:text-[#6445e0] text-[12px] font-bold shrink-0 transition-colors cursor-pointer"
                        >
                          {copiedLink ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Connect Buddy Form Card */}
                  <div className="bg-white rounded-[30px] border border-white/60 p-6 shadow-[0_24px_70px_rgba(24,33,77,0.08)] flex flex-col gap-4">
                    <h3 className="font-bold text-[#262525] text-[18px]">
                      Join a Buddy
                    </h3>
                    
                    <form onSubmit={handleJoinBuddy} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-[#8f8e98] uppercase tracking-wider">
                          Buddy Invite Code
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. HYKE-AB12CD"
                          value={inviteCodeInput}
                          onChange={(e) => setInviteCodeInput(e.target.value)}
                          className="w-full h-[48px] px-4 rounded-[14px] border border-[#e4e8f2] bg-[#fbfbff] text-[#262525] text-[14px] focus:outline-none focus:border-[#7655fb] transition-colors"
                        />
                      </div>

                      {formError && (
                        <p className="text-[12px] text-red-500 font-medium">{formError}</p>
                      )}
                      {formSuccess && (
                        <p className="text-[12px] text-green-600 font-medium">{formSuccess}</p>
                      )}

                      <button
                        type="submit"
                        className="w-full h-[48px] bg-[#7655fb] hover:bg-[#6445e0] text-white rounded-[24px] text-[14px] font-bold shadow-lg shadow-[#7655fb]/20 transition-all cursor-pointer"
                      >
                        Request Link
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ) : activeTab === "groups" ? (
              /* Tab 2: Groups & Chat Messaging */
              <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
                {/* Groups Panel */}
                <div className="bg-white rounded-[30px] border border-white/60 p-5 shadow-[0_24px_70px_rgba(24,33,77,0.08)] flex flex-col gap-5 h-fit max-h-[calc(100vh-220px)] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#262525] text-[18px]">Accountability Groups</h3>
                    <button
                      onClick={() => {
                        setIsCreatingGroup(!isCreatingGroup);
                        setGroupCreateError(null);
                      }}
                      className="text-[#7655fb] hover:text-[#6445e0] text-[13px] font-bold transition-colors cursor-pointer"
                    >
                      {isCreatingGroup ? "Cancel" : "New Group"}
                    </button>
                  </div>

                  {isCreatingGroup && (
                    <form onSubmit={handleCreateGroup} className="p-4 rounded-[20px] bg-[#fcfcff] border border-[#ececf7] flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-[#8f8e98] uppercase">Group Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Daily Check-in Buddies"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          className="px-3 py-2 rounded-[10px] border border-[#e4e8f2] bg-white text-[13px] focus:outline-none focus:border-[#7655fb]"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-[#8f8e98] uppercase">Description</label>
                        <input
                          type="text"
                          placeholder="Brief goals focus..."
                          value={newGroupDesc}
                          onChange={(e) => setNewGroupDesc(e.target.value)}
                          className="px-3 py-2 rounded-[10px] border border-[#e4e8f2] bg-white text-[13px] focus:outline-none focus:border-[#7655fb]"
                        />
                      </div>
                      {groupCreateError && (
                        <p className="text-[11px] text-red-500 font-semibold">{groupCreateError}</p>
                      )}
                      <button
                        type="submit"
                        disabled={isSubmittingGroup}
                        className="bg-[#7655fb] hover:bg-[#6445e0] text-white py-2 rounded-[12px] text-[13px] font-bold cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingGroup ? "Creating..." : "Create Group"}
                      </button>
                    </form>
                  )}

                  <div className="flex flex-col gap-2.5">
                    {groups.length > 0 ? (
                      groups.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => {
                            setActiveGroupId(group.id);
                            setIsAddingMember(false);
                            setAddMemberSuccess(null);
                            setAddMemberError(null);
                          }}
                          className={`w-full text-left p-4 rounded-[20px] border transition-all duration-300 cursor-pointer ${
                            activeGroupId === group.id
                              ? "border-[#7655fb] bg-[#7655fb]/5 shadow-sm"
                              : "border-[#e6e9f3] bg-white hover:border-[#cfd7ff]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#262525] text-[15px] truncate mr-2">
                              {group.name}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5 shrink-0">
                              {group.memberCount} members
                            </span>
                          </div>
                          {group.description && (
                            <p className="text-[12px] text-gray-400 mt-1 truncate">
                              {group.description}
                            </p>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="py-8 border border-dashed border-gray-100 rounded-[20px] text-center text-gray-400 text-[13px]">
                        No groups created yet. Click &quot;New Group&quot; to begin.
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat Panel */}
                <div className="bg-white rounded-[30px] border border-white/60 shadow-[0_24px_70px_rgba(24,33,77,0.08)] flex flex-col justify-between min-h-[calc(100vh-220px)] max-h-[calc(100vh-220px)] overflow-hidden">
                  {activeGroupId ? (
                    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                      {/* Left: Chat Feed & Controls */}
                      <div className="flex-1 flex flex-col justify-between overflow-hidden border-r border-gray-100 bg-[#fafaff]">
                        {/* Chat Room Header */}
                        <div className="px-6 py-4 border-b border-gray-100 bg-[#fbfbff] flex items-center justify-between shrink-0">
                          <div>
                            <h4 className="font-bold text-[#262525] text-[16px]">
                              {groups.find(g => g.id === activeGroupId)?.name}
                            </h4>
                            <p className="text-[11px] text-[#8f8e98] font-medium mt-0.5">
                              Active accountability channel
                            </p>
                          </div>

                          <div className="relative">
                            <button
                              onClick={() => {
                                setIsAddingMember(!isAddingMember);
                                setAddMemberSuccess(null);
                                setAddMemberError(null);
                              }}
                              className="text-[#7655fb] hover:text-[#6445e0] text-[12px] font-bold border border-[#7655fb]/20 bg-[#7655fb]/5 hover:bg-[#7655fb]/10 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
                            >
                              {isAddingMember ? "Close" : "Add Member"}
                            </button>

                            {isAddingMember && (
                              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-[#eef2ff] p-4 rounded-[20px] shadow-[0_12px_36px_rgba(24,33,77,0.12)] z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                                <h5 className="font-bold text-[13px] text-[#262525] mb-2 font-secondary">Enroll New Member</h5>
                                <form onSubmit={handleAddMember} className="flex flex-col gap-2.5">
                                  <input
                                    type="text"
                                    placeholder="Type username..."
                                    required
                                    value={addMemberInput}
                                    onChange={(e) => setAddMemberInput(e.target.value)}
                                    className="w-full px-3 py-2 rounded-[10px] border border-[#e4e8f2] text-[13px] focus:outline-none focus:border-[#7655fb]"
                                  />
                                  {addMemberError && (
                                    <p className="text-[11px] text-red-500 font-semibold">{addMemberError}</p>
                                  )}
                                  {addMemberSuccess && (
                                    <p className="text-[11px] text-green-600 font-semibold">{addMemberSuccess}</p>
                                  )}
                                  <button
                                    type="submit"
                                    className="w-full bg-[#7655fb] hover:bg-[#6445e0] text-white py-2 rounded-[10px] text-[12px] font-bold cursor-pointer"
                                  >
                                    Add to Group
                                  </button>
                                </form>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Chat Messages Log */}
                        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
                          {messages.length > 0 ? (
                            messages.map((msg) => {
                              const isMe = msg.senderId === user.id;
                              return (
                                <div
                                  key={msg.id}
                                  className={`flex flex-col max-w-[70%] ${
                                    isMe ? "self-end items-end" : "self-start items-start"
                                  }`}
                                >
                                  {!isMe && (
                                    <span className="text-[11px] text-[#8f8e98] font-bold mb-1 ml-1">
                                      {msg.senderName}
                                    </span>
                                  )}
                                  <div
                                    className={`px-4 py-2.5 rounded-[20px] text-[14px] shadow-sm leading-relaxed ${
                                      isMe
                                        ? "bg-gradient-to-r from-[#4169e1] to-[#7655fb] text-white rounded-tr-none"
                                        : "bg-white border border-[#ececf7] text-[#262525] rounded-tl-none"
                                    }`}
                                  >
                                    {msg.message}
                                  </div>
                                  <span className="text-[9px] text-gray-300 mt-1 font-medium">
                                    {msg.createdAt.toLocaleTimeString(undefined, {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="flex-1 flex items-center justify-center text-center p-8">
                              <p className="text-gray-400 text-[13px] font-medium leading-relaxed max-w-[280px]">
                                Welcome to your accountability channel! Send a message below to coordinate check-ins with your group.
                              </p>
                            </div>
                          )}
                          <div ref={chatBottomRef} />
                        </div>

                        {/* Message Input Controls */}
                        <form
                          onSubmit={handleSendMessage}
                          className="px-6 py-4 border-t border-gray-100 bg-white flex items-center gap-3 shrink-0"
                        >
                          <input
                            type="text"
                            placeholder="Type an update or request reviews..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            className="flex-1 h-[48px] px-4 bg-[#f4f6fb] border border-transparent rounded-full text-[14px] focus:outline-none focus:bg-white focus:border-[#7655fb] transition-all"
                          />
                          <button
                            type="submit"
                            className="w-[48px] h-[48px] bg-[#7655fb] hover:bg-[#6445e0] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#7655fb]/20 transition-all cursor-pointer shrink-0"
                            title="Send Message"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </form>
                      </div>

                      {/* Right: Premium Group Members Sidebar (Screenshot style) */}
                      <div className="hidden lg:flex w-[260px] bg-[#262525] p-6 flex-col gap-6 overflow-y-auto shrink-0 select-none">
                        <h4 className="text-white text-[20px] font-bold tracking-tight">
                          Group
                        </h4>
                        
                        <div className="flex flex-col gap-5 mt-2">
                          {groupMembers.map((member, idx) => {
                            const isCreator = member.id === groups.find(g => g.id === activeGroupId)?.creatorId;
                            const memberRole = isCreator ? "Group Creator" : buddies.find((b) => b.buddyId === member.id)?.role || "Member";
                            
                            return (
                              <div key={member.id} className="flex items-center gap-3">
                                <div className="relative shrink-0">
                                  {member.avatar_url ? (
                                    <img
                                      src={member.avatar_url}
                                      alt={member.full_name || "Avatar"}
                                      className="w-10 h-10 rounded-full object-cover border-2 border-white/10"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7655fb] to-[#4169e1] text-white flex items-center justify-center font-bold border-2 border-white/10 text-[14px]">
                                      {(member.full_name || member.username || "M").charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  {/* Small blue/indigo online/check badge matching the image */}
                                  {idx === 0 && (
                                    <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#4169e1] border-2 border-[#262525] rounded-full flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="min-w-0">
                                  <div className="text-white text-[14px] font-bold truncate leading-tight">
                                    {member.full_name || member.username}
                                  </div>
                                  <div className="text-gray-400 text-[11px] truncate mt-1">
                                    {memberRole}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                      <div className="h-16 w-16 bg-[#eef2ff] rounded-full flex items-center justify-center text-[#7655fb] mb-4">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17 8C19.2091 8 21 9.79086 21 12C21 14.2091 19.2091 16 17 16M17 8C14.7909 8 13 9.79086 13 12C13 14.2091 14.7909 16 17 16M17 8C17 5.79086 15.2091 4 13 4C10.7909 4 9 5.79086 9 8M17 16C17 18.2091 15.2091 20 13 20C10.7909 20 9 18.2091 9 16M13 12C13 14.2091 11.2091 16 9 16C6.79086 16 5 14.2091 5 12C5 9.79086 6.79086 8 9 8C11.2091 8 13 9.79086 13 12ZM9 8C9 5.79086 7.20914 4 5 4C2.79086 4 1 5.79086 1 8C1 10.2091 2.79086 12 5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <h4 className="font-bold text-[#262525] text-[18px]">Select a group</h4>
                      <p className="text-[13px] text-[#6f6f78] mt-1.5 max-w-[280px]">
                        Choose an accountability group from the left panel to read status checks and message members, or spawn a new group.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Tab 3: Meetings (Screenshot Replica) */
              <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
                {/* Left Panel: screenshot replica */}
                <div className="bg-[#262525] rounded-[30px] p-6 md:p-8 shadow-[0_24px_70px_rgba(24,33,77,0.12)] flex flex-col gap-6 text-white min-h-[480px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-3">
                      <h3 className="text-[32px] font-medium tracking-tight">Meetings</h3>
                      <span className="text-[24px] text-white/30 font-light select-none">{meetings.length}</span>
                    </div>
                    {/* Close button X */}
                    <button
                      onClick={() => setActiveTab("connections")}
                      className="text-white/40 hover:text-white transition-all cursor-pointer"
                      title="Close"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>

                  <div className="flex flex-col gap-6 mt-2">
                    {meetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="flex items-center justify-between gap-4 py-2 border-b border-white/5 last:border-0 pb-4 last:pb-0"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Checkbox */}
                          <div className="shrink-0">
                            <button
                              onClick={() => handleToggleComplete(meeting.id, meeting.isCompleted)}
                              className={`w-[18px] h-[18px] rounded-[5px] border-2 transition-all flex items-center justify-center cursor-pointer ${
                                meeting.isCompleted
                                  ? "bg-white border-white text-[#262525]"
                                  : "border-white/40 hover:border-white/80"
                              }`}
                            >
                              {meeting.isCompleted && (
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </button>
                          </div>

                          {/* Time */}
                          <div className="text-[24px] font-medium shrink-0 tracking-tight select-none min-w-[70px]">
                            {meeting.time}
                          </div>

                          {/* Details */}
                          <div className="min-w-0">
                            <h4 className="font-semibold text-[16px] truncate leading-snug">
                              {meeting.title}
                            </h4>
                            {meeting.description && (
                              <p className="text-[11px] text-white/40 mt-1 truncate max-w-[280px] md:max-w-[360px] leading-relaxed font-light">
                                {meeting.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Toggle Switch */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-white/30 font-medium select-none">
                            {meeting.isActive ? "On" : "Off"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(meeting.id, meeting.isActive)}
                            className={`w-11 h-6 rounded-full transition-all duration-300 relative focus:outline-none cursor-pointer ${
                              meeting.isActive ? "bg-[#86efac]" : "bg-white/10"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-300 ${
                                meeting.isActive ? "left-6" : "left-1"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Panel: Creation Form */}
                <div className="bg-white rounded-[30px] border border-white/60 p-6 shadow-[0_24px_70px_rgba(24,33,77,0.08)] flex flex-col gap-4 h-fit">
                  <h3 className="font-bold text-[#262525] text-[18px]">
                    Schedule a Meeting
                  </h3>
                  
                  <form onSubmit={handleCreateMeeting} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-[#8f8e98] uppercase tracking-wider">
                        Meeting Title
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sales Team Meeting"
                        value={newMeetingTitle}
                        onChange={(e) => setNewMeetingTitle(e.target.value)}
                        className="w-full h-[48px] px-4 rounded-[14px] border border-[#e4e8f2] bg-[#fbfbff] text-[#262525] text-[14px] focus:outline-none focus:border-[#7655fb] transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-[#8f8e98] uppercase tracking-wider">
                        Description
                      </label>
                      <input
                        type="text"
                        placeholder="Discuss progress towards monthly targets..."
                        value={newMeetingDesc}
                        onChange={(e) => setNewMeetingDesc(e.target.value)}
                        className="w-full h-[48px] px-4 rounded-[14px] border border-[#e4e8f2] bg-[#fbfbff] text-[#262525] text-[14px] focus:outline-none focus:border-[#7655fb] transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-[#8f8e98] uppercase tracking-wider">
                        Time (HH:MM)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 12:40"
                        value={newMeetingTime}
                        onChange={(e) => setNewMeetingTime(e.target.value)}
                        className="w-full h-[48px] px-4 rounded-[14px] border border-[#e4e8f2] bg-[#fbfbff] text-[#262525] text-[14px] focus:outline-none focus:border-[#7655fb] transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full h-[48px] bg-[#7655fb] hover:bg-[#6445e0] text-white rounded-[24px] text-[14px] font-bold shadow-lg shadow-[#7655fb]/20 transition-all cursor-pointer mt-2"
                    >
                      Create Meeting
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
