"use client";

import React, { useState, useEffect, useRef } from "react";
import NavigationRegistered from "@/components/NavigationRegistered";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ChatService,
  ChatConversation,
  ChatMessage,
  ChatMember,
  ChatAttachment,
  ChatReaction
} from "@/lib/services/chat";
import ReactionSelector from "@/components/ReactionSelector";
import StickerPicker from "@/components/StickerPicker";
import ChatSearchPanel from "@/components/ChatSearchPanel";

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

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  time: string;
  isActive: boolean;
  isCompleted: boolean;
}

export default function Links() {
  // Tabs & Navigation State
  const [activeTab, setActiveTab] = useState<"connections" | "chats" | "groups" | "meetings">("chats");
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Invite & Connections State
  const [inviteCode, setInviteCode] = useState("HYKE-LOADING");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [buddies, setBuddies] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);

  // Meetings State
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [newMeetingTitle, setNewMeetingTitle] = useState("");
  const [newMeetingDesc, setNewMeetingDesc] = useState("");
  const [newMeetingTime, setNewMeetingTime] = useState("");

  // Premium Chat State
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [chatFilter, setChatFilter] = useState<"all" | "dm" | "group">("all");

  // Group creation
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const [groupCreateError, setGroupCreateError] = useState<string | null>(null);

  // Add Member
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addMemberInput, setAddMemberInput] = useState("");
  const [addMemberSuccess, setAddMemberSuccess] = useState<string | null>(null);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);

  // Panels & Pickers
  const [chatSearchOpen, setChatSearchOpen] = useState(false);
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState("");
  const [stickerPickerOpen, setStickerPickerOpen] = useState(false);
  const [reactionMsgId, setReactionMsgId] = useState<string | null>(null);

  // Typing & Presence
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [buddyStatusMap, setBuddyStatusMap] = useState<Record<string, "online" | "offline" | "away">>({});

  // Offline queue
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Threading / replies
  const [replyParentMsg, setReplyParentMsg] = useState<ChatMessage | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const inviteLink = typeof window !== "undefined"
    ? `${window.location.origin}/links?join=${inviteCode}`
    : `https://goalhyke.com/links?join=${inviteCode}`;

  // Find active conversation
  const activeConv = conversations.find(c => c.id === activeConvId) || null;

  // On mount: load offline failed messages queue
  useEffect(() => {
    const cached = localStorage.getItem("goalhyke_failed_messages");
    if (cached) {
      setOfflineQueue(JSON.parse(cached));
    }
  }, []);

  // Listen for sidebar click to always go to Chats (DMs)
  useEffect(() => {
    const handleNavClick = () => {
      setActiveTab("chats");
    };
    window.addEventListener("nav-links-clicked", handleNavClick);
    return () => {
      window.removeEventListener("nav-links-clicked", handleNavClick);
    };
  }, []);

  const saveOfflineQueue = (queueOrFn: any[] | ((prev: any[]) => any[])) => {
    setOfflineQueue((prev) => {
      const nextQueue = typeof queueOrFn === "function" ? queueOrFn(prev) : queueOrFn;
      localStorage.setItem("goalhyke_failed_messages", JSON.stringify(nextQueue));
      return nextQueue;
    });
  };

  const fetchConnectionsAndProfile = async (userId: string) => {
    try {
      const supabase = createClient();

      const { data: profile } = await supabase
        .from("profiles")
        .select("invite_code")
        .eq("id", userId)
        .single();

      if (profile?.invite_code) {
        setInviteCode(profile.invite_code);
      }

      const { data: conns } = await supabase
        .from("accountability_connections")
        .select("*")
        .or(`user_id.eq.${userId},buddy_id.eq.${userId}`);

      if (conns && conns.length > 0) {
        const buddyIds = conns.map((c) => (c.user_id === userId ? c.buddy_id : c.user_id));

        const { data: buddyProfiles } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, online_status")
          .in("id", buddyIds);

        const profileMap = new Map(buddyProfiles?.map((p) => [p.id, p]) || []);

        // Sync buddy status map
        const statusMap: Record<string, "online" | "offline" | "away"> = {};
        buddyProfiles?.forEach(p => {
          statusMap[p.id] = (p.online_status as any) || "offline";
        });
        setBuddyStatusMap(statusMap);

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

  const fetchConversations = async () => {
    try {
      const supabase = createClient();
      const list = await ChatService.getConversations(supabase, user.id);
      setConversations(list);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  const fetchMessagesForActiveConv = async (convId: string) => {
    try {
      const supabase = createClient();
      const list = await ChatService.getMessages(supabase, convId);
      setMessages(list);

      // Automatically mark as read
      if (user) {
        await ChatService.markConversationAsRead(supabase, convId, user.id);
        // Refresh conversations list to update unread badge
        fetchConversations();
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
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
        setMeetings([
          { id: "mock-m1", title: "Sales Team Meeting", description: "The sales team discussed their progress targets", time: "12:40", isActive: true, isCompleted: false },
          { id: "mock-m2", title: "Marketing Team Meeting", description: "team discussed upcoming campaigns", time: "14:40", isActive: true, isCompleted: false },
          { id: "mock-m3", title: "Project Team Meeting", description: "Reviewed the project timeline", time: "19:40", isActive: true, isCompleted: false },
        ]);
      }
    } catch (err) {
      console.error("Failed to fetch meetings:", err);
    }
  };

  // Auth initialization
  useEffect(() => {
    const supabase = createClient();

    const initialize = async () => {
      try {
        setLoading(true);
        setInitError(null);
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        if (currentUser) {
          await fetchConnectionsAndProfile(currentUser.id);
          await fetchMeetings(currentUser.id);

          // Update presence online
          await ChatService.updatePresence(supabase, currentUser.id, "online");

          // Load chat conversations
          const list = await ChatService.getConversations(supabase, currentUser.id);
          setConversations(list);
          if (list.length > 0) {
            const firstDM = list.find((c) => c.type === "dm");
            setActiveConvId(firstDM ? firstDM.id : list[0].id);
          }

          // Pre-fill invite code from join parameters
          const params = new URLSearchParams(window.location.search);
          const joinCode = params.get("join");
          if (joinCode) {
            setInviteCodeInput(joinCode);
            window.history.replaceState(null, "", window.location.pathname);
          }
        }
      } catch (err: any) {
        console.error("Failed to initialize accountability services:", err);
        setInitError(err.message || "Failed to initialize accountability services.");
      } finally {
        setLoading(false);
      }
    };

    initialize();

    // Cleanup: Set status offline on window close
    const handleUnload = async () => {
      if (userRef.current) {
        const tempClient = createClient();
        await ChatService.updatePresence(tempClient, userRef.current.id, "offline");
      }
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  // Update presence status in DB periodically and map updates
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    // Heartbeat every 45s
    const timer = setInterval(() => {
      ChatService.updatePresence(supabase, user.id, "online");
    }, 45000);

    // Subscribe to profile presence updates
    const profilesChannel = supabase
      .channel("presence-tracker")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload) => {
          const updated = payload.new;
          setBuddyStatusMap((prev) => ({
            ...prev,
            [updated.id]: updated.online_status || "offline"
          }));
        }
      )
      .subscribe();

    return () => {
      clearInterval(timer);
      supabase.removeChannel(profilesChannel);
    };
  }, [user]);

  // Load messages on active conversation shift
  useEffect(() => {
    if (activeConvId) {
      fetchMessagesForActiveConv(activeConvId);
      setTypingUsers({});

      // Subscriptions for active conversation room
      const supabase = createClient();
      const channel = supabase
        .channel(`room-events-${activeConvId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConvId}` },
          async (payload) => {
            const newMsg = payload.new;
            if (newMsg.sender_id === user?.id) return; // skip self (handled optimistically)

            // Fetch sender profile details
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, username, full_name, avatar_url")
              .eq("id", newMsg.sender_id)
              .single();

            const formattedMsg: ChatMessage = {
              id: newMsg.id,
              conversation_id: newMsg.conversation_id,
              sender_id: newMsg.sender_id,
              content: newMsg.content,
              message_type: newMsg.message_type,
              parent_id: newMsg.parent_id,
              created_at: newMsg.created_at,
              updated_at: newMsg.updated_at,
              is_edited: newMsg.is_edited,
              is_deleted: newMsg.is_deleted,
              sender: profile ? {
                id: profile.id,
                username: profile.username,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url
              } : undefined,
              reactions: [],
              read_receipts: [],
              attachments: []
            };

            // Fetch attachments if file
            if (newMsg.message_type === "file" || newMsg.message_type === "image") {
              const { data: att } = await supabase
                .from("attachments")
                .select("*")
                .eq("message_id", newMsg.id);
              formattedMsg.attachments = att || [];
            }

            setMessages((prev) => {
              if (prev.some(m => m.id === formattedMsg.id)) return prev;
              return [...prev, formattedMsg];
            });

            // Mark message as read
            await supabase.from("read_receipts").insert({
              message_id: formattedMsg.id,
              user_id: user.id
            });
            fetchConversations();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "reactions" },
          () => {
            // Hot reload messages to refresh reaction lists
            fetchMessagesForActiveConv(activeConvId);
          }
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "read_receipts" },
          () => {
            fetchMessagesForActiveConv(activeConvId);
          }
        )
        .subscribe();

      // Listen for typing events via broadcast channel
      const typingChannel = supabase
        .channel(`chat-typing-${activeConvId}`)
        .on("broadcast", { event: "typing" }, (payload) => {
          const { userId, username, typing } = payload.payload;
          if (userId === user?.id) return;

          setTypingUsers((prev) => {
            const next = { ...prev };
            if (typing) {
              next[userId] = username;
            } else {
              delete next[userId];
            }
            return next;
          });

          // Auto timeout typing status
          setTimeout(() => {
            setTypingUsers((prev) => {
              const next = { ...prev };
              delete next[userId];
              return next;
            });
          }, 4000);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(typingChannel);
      };
    } else {
      setMessages([]);
    }
  }, [activeConvId, user]);

  // Scroll to bottom on message updates
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // Auto-select conversation of correct type when activeTab shifts between chats and groups
  useEffect(() => {
    if (activeTab === "chats") {
      const currentActive = conversations.find((c) => c.id === activeConvId);
      if (!currentActive || currentActive.type !== "dm") {
        const firstDM = conversations.find((c) => c.type === "dm");
        if (firstDM) {
          setActiveConvId(firstDM.id);
        }
      }
    } else if (activeTab === "groups") {
      const currentActive = conversations.find((c) => c.id === activeConvId);
      if (!currentActive || currentActive.type !== "group") {
        const firstGroup = conversations.find((c) => c.type === "group");
        if (firstGroup) {
          setActiveConvId(firstGroup.id);
        }
      }
    }
  }, [activeTab, conversations, activeConvId]);

  // DM trigger from connections list
  const handleStartDM = async (buddyId: string) => {
    try {
      const supabase = createClient();
      const conv = await ChatService.getOrCreateDM(supabase, user.id, buddyId);

      setConversations((prev) => {
        if (prev.some(c => c.id === conv.id)) return prev;
        return [conv, ...prev];
      });
      setActiveConvId(conv.id);
      setActiveTab("groups");
    } catch (err) {
      console.error("Failed to initialize DM:", err);
    }
  };

  // Group creations
  const handleGroupMembersToggle = (uid: string) => {
    setSelectedGroupMembers(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !user) return;

    setIsSubmittingGroup(true);
    setGroupCreateError(null);

    try {
      const supabase = createClient();
      const conv = await ChatService.createGroup(
        supabase,
        newGroupName.trim(),
        newGroupDesc.trim() || null,
        user.id,
        selectedGroupMembers
      );

      setConversations(prev => [conv, ...prev]);
      setActiveConvId(conv.id);
      setIsCreatingGroup(false);
      setNewGroupName("");
      setNewGroupDesc("");
      setSelectedGroupMembers([]);
    } catch (err: any) {
      console.error("Failed to build group:", err);
      setGroupCreateError(err.message || "Could not construct accountability group.");
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  // Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMemberInput.trim() || !activeConvId) return;

    setAddMemberError(null);
    setAddMemberSuccess(null);

    try {
      const supabase = createClient();
      const { data: buddyProfile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("username", addMemberInput.trim())
        .single();

      if (profileErr || !buddyProfile) {
        setAddMemberError("User not found.");
        return;
      }

      // Add to conversation
      const { error: insertErr } = await supabase
        .from("conversation_members")
        .insert({
          conversation_id: activeConvId,
          user_id: buddyProfile.id,
        });

      if (insertErr) throw insertErr;

      setAddMemberSuccess(`Successfully enrolled @${buddyProfile.username}!`);
      setAddMemberInput("");

      // Refresh conversations to update members list
      fetchConversations();
    } catch (err) {
      console.error("Failed to enroll member:", err);
      setAddMemberError("Failed to add member to the group.");
    }
  };

  // Broadcast Typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    if (!activeConvId || !user) return;

    if (!typingTimeoutRef.current) {
      const supabase = createClient();
      supabase.channel(`chat-typing-${activeConvId}`).send({
        type: "broadcast",
        event: "typing",
        payload: {
          userId: user.id,
          username: user.user_metadata?.full_name || user.email || "Someone",
          typing: true
        }
      });
      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null;
      }, 2000);
    }
  };

  // Sends Message with optimistic sync queue
  const handleSendMessage = async (e?: React.FormEvent, customContent?: string, customType?: string) => {
    if (e) e.preventDefault();

    const textToSend = customContent || messageInput.trim();
    if (!textToSend || !activeConvId || !user) return;

    if (!customContent) {
      setMessageInput("");
    }
    setReplyParentMsg(null);

    const tempId = `temp-${Date.now()}`;
    const parentMsgId = replyParentMsg ? replyParentMsg.id : null;

    // 1. Optimistic Message Object
    const tempMsg: ChatMessage = {
      id: tempId,
      conversation_id: activeConvId,
      sender_id: user.id,
      content: textToSend,
      message_type: (customType as any) || "text",
      parent_id: parentMsgId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_edited: false,
      is_deleted: false,
      sender: {
        id: user.id,
        username: user.user_metadata?.username || user.email || "me",
        full_name: user.user_metadata?.full_name || "Me",
        avatar_url: user.user_metadata?.avatar_url
      },
      reactions: [],
      read_receipts: [],
      attachments: []
    };

    // Optimistically push into UI list
    setMessages(prev => [...prev, tempMsg]);

    try {
      const supabase = createClient();
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvId,
          content: textToSend,
          messageType: customType || "text",
          parentId: parentMsgId
        })
      });
      const data = await res.json();
      if (data.success) {
        // Swap temp with actual message
        setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
        // Refresh room activity lists
        fetchConversations();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      // Mark as failed in UI
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, is_failed: true } as any : m));
      // Store in offline retry queue
      saveOfflineQueue([...offlineQueue, { ...tempMsg, retry_count: 0 }]);
    }
  };

  // Retries a failed message
  const handleRetryMessage = async (msg: ChatMessage) => {
    // Remove failed status from UI temporarily
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_failed: false } as any : m));

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: msg.conversation_id,
          content: msg.content,
          messageType: msg.message_type,
          parentId: msg.parent_id
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m.id === msg.id ? data.message : m));
        // Remove from offline queue
        saveOfflineQueue(offlineQueue.filter(o => o.id !== msg.id));
        fetchConversations();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      // Put back to failed state
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_failed: true } as any : m));
    }
  };

  // Reconnection hook: flushes offline queue
  const flushOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    const toRetry = [...offlineQueue];
    saveOfflineQueue([]);

    for (const msg of toRetry) {
      try {
        const res = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: msg.conversation_id,
            content: msg.content,
            messageType: msg.message_type,
            parentId: msg.parent_id
          })
        });
        const data = await res.json();
        if (data.success) {
          setMessages(prev => prev.map(m => m.id === msg.id ? data.message : m));
        } else {
          saveOfflineQueue(prev => [...prev, { ...msg, retry_count: (msg.retry_count || 0) + 1 }]);
        }
      } catch (err) {
        saveOfflineQueue(prev => [...prev, { ...msg, retry_count: (msg.retry_count || 0) + 1 }]);
      }
    }
    fetchConversations();
  };

  useEffect(() => {
    window.addEventListener("online", flushOfflineQueue);
    return () => window.removeEventListener("online", flushOfflineQueue);
  }, [offlineQueue]);

  // Handle file uploads (attachments)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !activeConvId) return;

    setUploadingAttachment(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from("chat-attachments")
        .upload(filePath, file);

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(filePath);

      await ChatService.sendMessage(
        supabase,
        activeConvId,
        user.id,
        `Shared file: ${file.name}`,
        file.type.startsWith("image/") ? "image" : "file",
        null,
        [{
          file_url: publicUrl,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size
        }]
      );

      // Reload feed
      fetchMessagesForActiveConv(activeConvId);
    } catch (err) {
      console.error("Failed to upload attachment:", err);
      alert("Attachment upload failed.");
    } finally {
      setUploadingAttachment(false);
      if (e.target) e.target.value = "";
    }
  };

  // Toggle emoji reaction
  const handleToggleReaction = async (msgId: string, emoji: string) => {
    try {
      const supabase = createClient();
      await ChatService.toggleReaction(supabase, msgId, user.id, emoji);
      // Subscription takes care of hot reloading UI
    } catch (err) {
      console.error("Reaction toggle failed:", err);
    }
  };

  // Accept/Decline/Copy helpers
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

  const handleJoinBuddy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim() || !user) return;

    setFormError(null);
    setFormSuccess(null);

    try {
      const supabase = createClient();
      const cleanCode = inviteCodeInput.trim().toUpperCase();

      const { data: buddyProfile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("invite_code", cleanCode)
        .single();

      if (profileErr || !buddyProfile) {
        setFormError("Invite code not found.");
        return;
      }

      if (buddyProfile.id === user.id) {
        setFormError("You cannot connect with your own code.");
        return;
      }

      const { data: existingConn } = await supabase
        .from("accountability_connections")
        .select("id, status")
        .or(`and(user_id.eq.${user.id},buddy_id.eq.${buddyProfile.id}),and(user_id.eq.${buddyProfile.id},buddy_id.eq.${user.id})`)
        .maybeSingle();

      if (existingConn) {
        setFormError(existingConn.status === "active" ? "Already connected." : "Request already pending.");
        return;
      }

      await supabase
        .from("accountability_connections")
        .insert({
          user_id: user.id,
          buddy_id: buddyProfile.id,
          status: "pending",
          role: "Accountability Buddy",
        });

      setFormSuccess("Request dispatched!");
      setInviteCodeInput("");
      fetchConnectionsAndProfile(user.id);
    } catch (err) {
      console.error(err);
      setFormError("Connection request failed.");
    }
  };

  const handleAcceptRequest = async (connectionId: string) => {
    try {
      const supabase = createClient();
      await supabase.from("accountability_connections").update({ status: "active" }).eq("id", connectionId);
      fetchConnectionsAndProfile(user.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectRequest = async (connectionId: string) => {
    try {
      const supabase = createClient();
      await supabase.from("accountability_connections").delete().eq("id", connectionId);
      fetchConnectionsAndProfile(user.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const supabase = createClient();
      await supabase.from("accountability_connections").delete().eq("id", connectionId);
      fetchConnectionsAndProfile(user.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleComplete = async (meetingId: string, currentCompleted: boolean) => {
    if (meetingId.startsWith("mock-")) {
      setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, isCompleted: !currentCompleted } : m));
      return;
    }
    try {
      const supabase = createClient();
      await supabase.from("meetings").update({ is_completed: !currentCompleted }).eq("id", meetingId);
      fetchMeetings(user.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (meetingId: string, currentActive: boolean) => {
    if (meetingId.startsWith("mock-")) {
      setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, isActive: !currentActive } : m));
      return;
    }
    try {
      const supabase = createClient();
      await supabase.from("meetings").update({ is_active: !currentActive }).eq("id", meetingId);
      fetchMeetings(user.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingTitle.trim() || !newMeetingTime.trim() || !user) return;
    try {
      const supabase = createClient();
      await supabase.from("meetings").insert({
        user_id: user.id,
        title: newMeetingTitle.trim(),
        description: newMeetingDesc.trim() || null,
        meeting_time: newMeetingTime.trim(),
        is_active: true,
        is_completed: false,
      });
      setNewMeetingTitle("");
      setNewMeetingDesc("");
      setNewMeetingTime("");
      fetchMeetings(user.id);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    if (activeTab === "chats") return c.type === "dm";
    if (activeTab === "groups") return c.type === "group";
    return true;
  });

  const renderConnectionsMiddle = () => {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-1.5 flex items-center justify-between shrink-0 select-none">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">My Links</span>
          <span className="text-[10px] font-bold text-[#7655fb] bg-[#7655fb]/10 px-2 py-0.5 rounded-full">
            {buddies.length}
          </span>
        </div>

        {/* Filter Input */}
        <div className="px-3 py-1.5 shrink-0">
          <input
            type="text"
            placeholder="Filter connections..."
            value={sidebarSearchQuery}
            onChange={(e) => setSidebarSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 bg-[#f4f6fb] border border-transparent rounded-[10px] text-[12px] focus:outline-none"
          />
        </div>

        {/* Connections Feed */}
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto px-3 py-2">
          {(() => {
            const searchedBuddies = buddies.filter(b =>
              b.name.toLowerCase().includes(sidebarSearchQuery.toLowerCase()) ||
              b.username.toLowerCase().includes(sidebarSearchQuery.toLowerCase())
            );

            return (
              <>
                {searchedBuddies.length > 0 ? (
                  searchedBuddies.map((buddy) => (
                    <div
                      key={buddy.id}
                      className="p-3 rounded-[20px] border border-transparent bg-white hover:bg-gray-50/55 flex flex-col gap-2 shadow-[0_4px_12px_rgba(24,33,77,0.02)] animate-in fade-in duration-200"
                    >
                      <div className="flex gap-2.5 items-center">
                        <div className="relative shrink-0">
                          <div className="w-8 h-8 rounded-full bg-[#7655fb]/10 flex items-center justify-center text-[#7655fb] text-[11px] font-black">
                            {buddy.name.charAt(0).toUpperCase()}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white rounded-full ${buddyStatusMap[buddy.buddyId] === "online" ? "bg-[#4169e1]" : "bg-gray-300"
                            }`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[#262525] text-[13px] truncate">{buddy.name}</div>
                          <div className="text-[10px] text-gray-400 truncate">@{buddy.username}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-gray-50 pt-2 mt-1">
                        <button
                          onClick={() => handleStartDM(buddy.buddyId)}
                          className="px-3 py-1 bg-[#7655fb]/10 hover:bg-[#7655fb]/20 text-[#7655fb] rounded-full text-[10px] font-bold transition-colors cursor-pointer border-none"
                        >
                          Message
                        </button>
                        <button
                          onClick={() => handleDisconnect(buddy.id)}
                          className="text-[#8f8e98] hover:text-red-500 text-[10px] font-bold transition-colors cursor-pointer border-none bg-transparent"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 border border-dashed border-gray-100 rounded-[20px] text-center text-gray-400 text-[11px]">
                    No connections.
                  </div>
                )}

                {pendingRequests.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-100">
                    <span className="text-[9px] font-bold text-[#e8a317] uppercase tracking-wider block px-1 mb-1">
                      Requests ({pendingRequests.length})
                    </span>
                    {pendingRequests.map((req) => (
                      <div key={req.id} className="p-3 bg-[#fffdf0] border border-[#f5ead3] rounded-[18px] flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#e8a317]/10 flex items-center justify-center text-[#e8a317] font-black text-[10px] shrink-0">
                            {req.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[12px] font-bold text-[#262525] truncate">{req.name}</div>
                            <div className="text-[9px] text-gray-500">@{req.username}</div>
                          </div>
                        </div>

                        {req.type === "incoming" ? (
                          <div className="flex gap-2 justify-end border-t border-[#f5ead3]/55 pt-2">
                            <button
                              onClick={() => handleAcceptRequest(req.id)}
                              className="px-3 py-1 bg-[#7655fb] hover:bg-[#6445e0] text-white rounded-full text-[10px] font-bold cursor-pointer border-none"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req.id)}
                              className="px-3 py-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-500 rounded-full text-[10px] font-bold cursor-pointer"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <div className="text-right border-t border-[#f5ead3]/55 pt-1">
                            <span className="text-[10px] text-[#e8a317] font-bold">Awaiting Approval</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    );
  };

  const renderConnectionsRight = () => {
    return (
      <div className="flex-1 bg-[#fafaff] p-8 overflow-y-auto flex flex-col items-center justify-center select-text">
        <div className="max-w-[480px] w-full flex flex-col gap-6">

          {/* Invite Partners Card */}
          <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-md shadow-slate-100/50 flex flex-col gap-6">
            <div>
              <h3 className="font-black text-slate-800 text-[18px]">
                Invite Partners
              </h3>
              <p className="text-[12px] text-slate-400 mt-1.5 leading-relaxed">
                Share your unique accountability code or link with friends to let them referee your progress or join your hyke.
              </p>
            </div>

            {/* Code Sharing */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                My Invite Code
              </span>
              <div className="flex items-center justify-between bg-slate-50 rounded-[16px] px-4 py-3 border border-slate-200/80 font-mono text-sm text-slate-800 shadow-inner">
                <span className="font-extrabold tracking-widest text-[#7655fb]">{inviteCode}</span>
                <button
                  onClick={handleCopyCode}
                  className="bg-[#7655fb]/10 hover:bg-[#7655fb]/20 text-[#7655fb] px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all cursor-pointer border-none"
                >
                  {copiedCode ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Link Sharing */}
            <div className="flex flex-col gap-2 mt-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                My Invite Link
              </span>
              <div className="flex items-center justify-between bg-slate-50 rounded-[16px] px-4 py-3 border border-slate-200/80 font-mono text-[12px] text-slate-800 shadow-inner overflow-hidden">
                <span className="truncate mr-4 text-slate-400">{inviteLink}</span>
                <button
                  onClick={handleCopyLink}
                  className="bg-[#7655fb]/10 hover:bg-[#7655fb]/20 text-[#7655fb] px-3.5 py-1.5 rounded-full text-[12px] font-bold shrink-0 transition-all cursor-pointer border-none"
                >
                  {copiedLink ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          {/* Join Buddy Card */}
          <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-md shadow-slate-100/50 flex flex-col gap-6">
            <div>
              <h3 className="font-black text-slate-800 text-[18px]">
                Join a Buddy
              </h3>
              <p className="text-[12px] text-slate-400 mt-1.5 leading-relaxed">Enter an invite code to connect with your accountability partner.</p>
            </div>

            <form onSubmit={handleJoinBuddy} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  Buddy Invite Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. HYKE-AB12CD"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                  className="w-full h-[48px] px-4 rounded-[16px] border border-slate-200 bg-[#fbfbff] text-slate-800 text-[13px] focus:outline-none focus:border-[#7655fb] focus:ring-4 focus:ring-[#7655fb]/5 transition-all"
                />
              </div>

              {formError && (
                <p className="text-[12px] text-red-500 font-semibold">{formError}</p>
              )}
              {formSuccess && (
                <p className="text-[12px] text-green-600 font-semibold">{formSuccess}</p>
              )}

              <button
                type="submit"
                className="w-full h-[48px] bg-gradient-to-tr from-[#4169e1] to-[#7655fb] hover:scale-[1.02] text-white rounded-[24px] text-[14px] font-bold shadow-lg shadow-[#7655fb]/20 transition-all cursor-pointer border-none"
              >
                Request Link
              </button>
            </form>
          </div>

        </div>
      </div>
    );
  };

  const renderMeetingsMiddle = () => {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-1.5 flex items-center justify-between shrink-0 select-none">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Schedules</span>
          <span className="text-[10px] font-bold text-[#7655fb] bg-[#7655fb]/10 px-2 py-0.5 rounded-full">
            {meetings.length}
          </span>
        </div>

        <div className="flex-1 flex flex-col gap-3 overflow-y-auto px-3 py-2">
          {meetings.length > 0 ? (
            meetings.map((meeting) => (
              <div key={meeting.id} className="p-4 bg-white border border-slate-100 hover:border-slate-200 rounded-[22px] shadow-sm flex flex-col gap-3 transition-all duration-300 hover:scale-[1.01] hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-800 text-[13px] truncate">{meeting.title}</h4>
                    {meeting.description && (
                      <p className="text-[10px] text-slate-400 mt-1 truncate leading-relaxed">{meeting.description}</p>
                    )}
                  </div>
                  <div className="text-[11px] font-extrabold text-[#7655fb] bg-[#7655fb]/10 px-2.5 py-0.5 rounded-full shrink-0 tracking-tight">{meeting.time}</div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-50 pt-2.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleComplete(meeting.id, meeting.isCompleted)}
                      className={`w-4 h-4 rounded-[6px] border transition-all flex items-center justify-center cursor-pointer ${meeting.isCompleted
                          ? "bg-[#7655fb] border-[#7655fb] text-white"
                          : "border-slate-300 hover:border-slate-400 bg-transparent"
                        }`}
                    >
                      {meeting.isCompleted && (
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {meeting.isCompleted ? "Completed" : "Active"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-slate-400 font-medium select-none">Alarm</span>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(meeting.id, meeting.isActive)}
                      className={`w-8 h-4.5 rounded-full transition-all duration-300 relative focus:outline-none cursor-pointer border-none ${meeting.isActive ? "bg-[#86efac]" : "bg-slate-200"
                        }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all duration-300 ${meeting.isActive ? "left-4" : "left-0.5"
                          }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 border border-dashed border-slate-100 rounded-[20px] text-center text-slate-400 text-[11px]">
              No meetings.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMeetingsRight = () => {
    return (
      <div className="flex-1 bg-[#fafaff] p-8 overflow-y-auto flex flex-col items-center justify-center select-text">
        <div className="max-w-[420px] w-full bg-white rounded-[32px] border border-slate-100 p-8 shadow-md shadow-slate-100/50">
          <h3 className="font-black text-slate-800 text-[18px] mb-1.5">
            Schedule a Meeting
          </h3>
          <p className="text-[12px] text-slate-400 mb-6 leading-relaxed">Set up an accountability check-in with your buddy.</p>

          <form onSubmit={handleCreateMeeting} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Meeting Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sales Team Meeting"
                value={newMeetingTitle}
                onChange={(e) => setNewMeetingTitle(e.target.value)}
                className="w-full h-[48px] px-4 rounded-[16px] border border-slate-200 bg-[#fbfbff] text-slate-800 text-[13px] focus:outline-none focus:border-[#7655fb] focus:ring-4 focus:ring-[#7655fb]/5 transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Description
              </label>
              <input
                type="text"
                placeholder="Discuss progress targets..."
                value={newMeetingDesc}
                onChange={(e) => setNewMeetingDesc(e.target.value)}
                className="w-full h-[48px] px-4 rounded-[16px] border border-slate-200 bg-[#fbfbff] text-slate-800 text-[13px] focus:outline-none focus:border-[#7655fb] focus:ring-4 focus:ring-[#7655fb]/5 transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Time (HH:MM)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 12:40"
                value={newMeetingTime}
                onChange={(e) => setNewMeetingTime(e.target.value)}
                className="w-full h-[48px] px-4 rounded-[16px] border border-slate-200 bg-[#fbfbff] text-slate-800 text-[13px] focus:outline-none focus:border-[#7655fb] focus:ring-4 focus:ring-[#7655fb]/5 transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full h-[48px] bg-gradient-to-tr from-[#4169e1] to-[#7655fb] hover:scale-[1.02] text-white rounded-[24px] text-[14px] font-bold shadow-lg shadow-[#7655fb]/20 transition-all cursor-pointer mt-2 border-none"
            >
              Create Meeting
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-white">
      <NavigationRegistered />

      <div className="flex max-w-[1280px] mx-auto min-h-[calc(100vh-110px)]">
        <Sidebar />

        <div className="flex-1 bg-[#f4f6fb] flex flex-col">
          <div className="p-0 flex flex-col h-[calc(100vh-110px)]">
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
              <h1 className="text-[32px] font-bold text-[#262525]">
                Hyke Circle
              </h1>

              {/* Segmented Tab Switcher */}
              <div className="flex bg-[#eef2ff] p-1 rounded-full w-fit shrink-0 self-start md:self-auto">
                {[
                  { id: "connections", text: "Connections" },
                  { id: "chats", text: "Chats" },
                  { id: "groups", text: "Groups" },
                  { id: "meetings", text: "Meetings" }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`rounded-full px-5 py-2 text-[13px] font-bold transition-all duration-300 cursor-pointer ${activeTab === t.id
                        ? "bg-gradient-to-r from-[#4169e1] to-[#7655fb] text-white shadow-sm"
                        : "text-[#7a7f90] hover:text-[#4f5b7f]"
                      }`}
                  >
                    {t.text}
                  </button>
                ))}
              </div>
            </div>

            {initError ? (
              <div className="rounded-[28px] border border-[#ffccd5] bg-[#fff5f6] p-12 text-center flex-1 flex flex-col items-center justify-center shadow-[0_20px_60px_rgba(24,33,77,0.08)]">
                <div className="flex flex-col items-center gap-4 max-w-[600px]">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-xl font-bold shrink-0">
                    ⚠️
                  </div>
                  <h3 className="text-[18px] font-bold text-[#262525]">
                    Failed to load accountability services
                  </h3>
                  <p className="text-[14px] text-red-600 leading-relaxed font-semibold">
                    {initError}
                  </p>
                  <div className="mt-2 p-5 bg-white rounded-2xl border border-[#ffe0e5] text-left w-full text-[13px] text-gray-600 shadow-sm">
                    <p className="font-bold text-gray-800 mb-2">Troubleshooting Steps:</p>
                    <ol className="list-decimal pl-4 space-y-1.5 text-gray-600">
                      <li>
                        Ensure the latest migrations have been applied to your Supabase project. In your project repository, run:
                        <code className="block mt-1 p-2 bg-gray-50 border border-gray-200 rounded font-mono text-[12px] text-[#7655fb]">
                          npx supabase db push
                        </code>
                      </li>
                      <li>
                        Alternatively, open the SQL Editor in your Supabase dashboard and run the SQL content of:
                        <code className="block mt-1 p-2 bg-gray-50 border border-gray-200 rounded font-mono text-[12px] text-gray-700 overflow-x-auto whitespace-pre">
                          supabase/migrations/20260624_realtime_chat.sql
                        </code>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            ) : loading ? (
              <div className="rounded-[28px] border border-white/70 bg-white p-12 shadow-[0_20px_60px_rgba(24,33,77,0.08)] flex-1 flex items-center justify-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#7655fb] border-t-transparent" />
                  <p className="text-[15px] font-medium text-[#6f6f78]">
                    Loading accountability services...
                  </p>
                </div>
              </div>
            ) : !user ? (
              <div className="rounded-[28px] border border-white/70 bg-white p-12 shadow-[0_20px_60px_rgba(24,33,77,0.08)] text-center flex-1 flex flex-col items-center justify-center">
                <p className="text-[16px] text-gray-500 font-bold">You must be logged in to view accountability resources.</p>
                <Link href="/login" className="gh-btn-primary mt-4 inline-flex px-6 py-2.5 rounded-full">
                  Login Page
                </Link>
              </div>
            ) : (
              /* Global Immersive 3-Column Layout */
              <div className="flex-1 flex overflow-hidden bg-white select-none">

                {/* COLUMN 1: LEFT NAVIGATION PANE (Dialin Sidebar style) */}
                <div className="w-[240px] border-r border-[#ececf7] bg-white flex flex-col h-full shrink-0 select-none">
                  {/* GoalHyke Chat Title / Logo */}
                  <div className="flex items-center justify-between px-5 py-4 shrink-0 select-none">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7655fb] to-[#4169e1] flex items-center justify-center text-white font-extrabold shadow-md shadow-[#7655fb]/20">
                        ✦
                      </div>
                      <span className="font-bold text-[16px] text-[#262525] tracking-tight">Dialin Hyke</span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-[16px]">
                      ◫
                    </button>
                  </div>

                  {/* Search input with slash key shortcut */}
                  <div className="px-3 mb-4 shrink-0 relative">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-400 text-[13px]">
                      🔍
                    </div>
                    <input
                      type="text"
                      placeholder="Search"
                      value={sidebarSearchQuery}
                      onChange={(e) => setSidebarSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-8 py-2 bg-[#f4f6fb] border border-transparent rounded-[12px] text-[12px] focus:outline-none focus:bg-white focus:border-[#7655fb] transition-all"
                    />
                    <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-gray-300 text-[10px] font-bold bg-white border border-gray-100 px-1.5 py-0.5 rounded my-2">
                      /
                    </div>
                  </div>

                  {/* MAIN SECTION */}
                  <div className="px-3 mb-5 shrink-0">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block px-2 mb-1.5 select-none">Main</span>
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => setActiveTab("connections")}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[12px] font-semibold transition-all text-left border-none cursor-pointer w-full ${activeTab === "connections" ? "bg-[#7655fb]/10 text-[#7655fb] font-bold" : "text-gray-600 bg-transparent hover:bg-[#f4f6fb]"
                          }`}
                      >
                        <span className="text-[14px]">📋</span> Connections
                      </button>
                      <button
                        onClick={() => setActiveTab("chats")}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[12px] font-semibold transition-all text-left border-none cursor-pointer w-full ${activeTab === "chats" ? "bg-[#7655fb]/10 text-[#7655fb] font-bold" : "text-gray-600 bg-transparent hover:bg-[#f4f6fb]"
                          }`}
                      >
                        <span className="text-[14px]">💬</span> Chats
                      </button>
                      <button
                        onClick={() => setActiveTab("groups")}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[12px] font-semibold transition-all text-left border-none cursor-pointer w-full ${activeTab === "groups" ? "bg-[#7655fb]/10 text-[#7655fb] font-bold" : "text-gray-600 bg-transparent hover:bg-[#f4f6fb]"
                          }`}
                      >
                        <span className="text-[14px]">👥</span> Groups
                      </button>
                      <button
                        onClick={() => setActiveTab("meetings")}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[12px] font-semibold transition-all text-left border-none cursor-pointer w-full ${activeTab === "meetings" ? "bg-[#7655fb]/10 text-[#7655fb] font-bold" : "text-gray-600 bg-transparent hover:bg-[#f4f6fb]"
                          }`}
                      >
                        <span className="text-[14px]">📅</span> Meetings
                      </button>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[12px] font-semibold text-gray-600 hover:bg-[#f4f6fb] transition-all text-left w-full decoration-none"
                      >
                        <span className="text-[14px]">⚙️</span> Settings
                      </Link>
                    </div>
                  </div>

                  {/* INBOXES SECTION */}
                  <div className="px-3 mb-5 shrink-0">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block px-2 mb-1.5 select-none">Inboxes</span>
                    <div className="flex flex-col gap-1">
                      {[
                        { id: "chats", label: "Personal DMs", desc: "Individual Chats", icon: "👤" },
                        { id: "groups", label: "Team Circles", desc: "Accountability Groups", icon: "👥" }
                      ].map(f => {
                        const active = activeTab === f.id;
                        return (
                          <button
                            key={f.id}
                            onClick={() => {
                              setActiveTab(f.id as any);
                            }}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[14px] transition-all text-left border-none cursor-pointer w-full ${active
                                ? "bg-gradient-to-r from-[#ece9ff]/85 to-[#f4f2ff]/85 text-[#7655fb] shadow-sm font-bold border-l-[3px] border-[#7655fb]"
                                : "bg-transparent text-gray-600 hover:bg-[#f4f6fb]"
                              }`}
                          >
                            <span className={`text-[15px] ${active ? "text-[#7655fb]" : "text-gray-400"}`}>{f.icon}</span>
                            <div className="min-w-0">
                              <div className="text-[12px] font-bold leading-tight">{f.label}</div>
                              <div className="text-[9px] text-gray-400 mt-0.5 truncate">{f.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* TEAM / BUDDIES SECTION */}
                  <div className="px-3 flex-1 overflow-y-auto min-h-[120px]">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block px-2 mb-1.5 select-none">Team</span>
                    <div className="flex flex-col gap-1">
                      {buddies.map(b => {
                        const status = buddyStatusMap[b.buddyId] || "offline";
                        return (
                          <div key={b.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-[10px] hover:bg-[#f4f6fb]/50 transition-all select-none">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="relative shrink-0">
                                <div className="w-6 h-6 rounded-full bg-[#7655fb]/10 flex items-center justify-center text-[#7655fb] text-[10px] font-black">
                                  {b.name.charAt(0).toUpperCase()}
                                </div>
                                <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 border border-white rounded-full ${status === "online" ? "bg-[#4169e1]" : "bg-gray-300"
                                  }`} />
                              </div>
                              <span className="text-[12px] font-medium text-gray-700 truncate">{b.name}</span>
                            </div>
                          </div>
                        );
                      })}
                      {buddies.length === 0 && (
                        <span className="text-[10px] text-gray-400 px-2 italic select-none">No active buddies.</span>
                      )}
                    </div>
                  </div>

                  {/* User Profile info card */}
                  <div className="p-3 border-t border-gray-100 bg-[#fbfbff] shrink-0 flex items-center justify-between select-none">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7655fb] to-[#4169e1] text-white flex items-center justify-center font-bold text-[12px] shrink-0">
                        {user?.email?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <span className="text-[11px] font-bold text-[#262525] truncate leading-tight">
                          {user?.email?.split("@")[0] || "User"}
                        </span>
                        <span className="text-[9px] text-gray-400 truncate mt-0.5">
                          {user?.email}
                        </span>
                      </div>
                    </div>
                    <Link href="/settings" className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-[12px]">
                      ⚙️
                    </Link>
                  </div>
                </div>

                {/* COLUMN 2: CONVERSATIONS LIST PANEL */}
                <div className="w-[280px] border-r border-[#ececf7] bg-[#fbfbff] flex flex-col h-full shrink-0 select-none">

                  {/* Top header row with Open dropdown and call actions */}
                  <div className="px-4 py-3 flex items-center justify-between shrink-0 select-none">
                    <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-100/50 px-2 py-1 rounded-[10px] transition-all">
                      <span className="font-bold text-[13px] text-[#262525]">
                        {activeTab === "connections" ? "Connections" : activeTab === "meetings" ? "Meetings" : activeTab === "chats" ? "Chats" : "Groups"}
                      </span>
                      <span className="text-gray-400 text-[8px]">▼</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-[13px]">📞</button>
                      <button className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-[13px]">🕒</button>
                    </div>
                  </div>

                  {activeTab === "connections" ? (
                    renderConnectionsMiddle()
                  ) : activeTab === "meetings" ? (
                    renderMeetingsMiddle()
                  ) : (
                    <>
                      {/* Title and Settings gear */}
                      <div className="px-4 py-1.5 flex items-center justify-between shrink-0 select-none">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                          {activeTab === "chats" ? "Chats" : "Groups"}
                        </span>
                        {activeTab === "groups" && (
                          <button
                            onClick={() => {
                              setIsCreatingGroup(!isCreatingGroup);
                              setGroupCreateError(null);
                            }}
                            className="text-[#7655fb] hover:text-[#6445e0] text-[11px] font-bold transition-colors cursor-pointer border-none bg-transparent"
                          >
                            {isCreatingGroup ? "Cancel" : "⚙"}
                          </button>
                        )}
                      </div>

                      {isCreatingGroup && (
                        <form onSubmit={handleCreateGroup} className="p-3 mx-3 my-2 rounded-[16px] bg-white border border-[#ececf7] flex flex-col gap-2 shrink-0 z-10 shadow-sm animate-in slide-in-from-top-1 duration-200">
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-bold text-[#8f8e98] uppercase">Group Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Health Referees"
                              value={newGroupName}
                              onChange={(e) => setNewGroupName(e.target.value)}
                              className="px-2.5 py-1.5 rounded-[8px] border border-[#e4e8f2] bg-white text-[11px] focus:outline-none focus:border-[#7655fb]"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-bold text-[#8f8e98] uppercase">Add Buddies</label>
                            <div className="max-h-[80px] overflow-y-auto flex flex-col gap-1 border border-[#e4e8f2] rounded-[8px] p-1.5 bg-white">
                              {buddies.map(b => (
                                <label key={b.buddyId} className="flex items-center gap-1.5 text-[11px] font-semibold text-[#262525] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedGroupMembers.includes(b.buddyId)}
                                    onChange={() => handleGroupMembersToggle(b.buddyId)}
                                    className="rounded text-[#7655fb] focus:ring-[#7655fb] w-3 h-3"
                                  />
                                  {b.name}
                                </label>
                              ))}
                            </div>
                          </div>
                          {groupCreateError && (
                            <p className="text-[9px] text-red-500 font-semibold">{groupCreateError}</p>
                          )}
                          <button
                            type="submit"
                            disabled={isSubmittingGroup}
                            className="bg-[#7655fb] hover:bg-[#6445e0] text-white py-1.5 rounded-[8px] text-[11px] font-bold cursor-pointer disabled:opacity-50 border-none"
                          >
                            {isSubmittingGroup ? "Creating..." : "Create Group"}
                          </button>
                        </form>
                      )}

                      {/* Chat filter/Search input */}
                      <div className="px-3 py-1.5 shrink-0">
                        <input
                          type="text"
                          placeholder="Filter conversations..."
                          value={sidebarSearchQuery}
                          onChange={(e) => setSidebarSearchQuery(e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#f4f6fb] border border-transparent rounded-[10px] text-[12px] focus:outline-none"
                        />
                      </div>

                      {/* List of active rooms */}
                      <div className="flex-1 flex flex-col gap-2 overflow-y-auto px-3 py-3">
                        {(() => {
                          const searchedConversations = filteredConversations.filter(c => {
                            let name = c.name || "Conversation";
                            if (c.type === "dm") {
                              const partner = c.members?.find(m => m.id !== user?.id);
                              name = partner?.full_name || partner?.username || "Accountability Partner";
                            }
                            return name.toLowerCase().includes(sidebarSearchQuery.toLowerCase());
                          });

                          if (searchedConversations.length > 0) {
                            return searchedConversations.map((conv) => {
                              const isActive = activeConvId === conv.id;
                              let convName = conv.name || "Conversation";
                              let convAvatar = "";
                              let partnerId = "";

                              if (conv.type === "dm") {
                                const partner = conv.members?.find(m => m.id !== user?.id);
                                convName = partner?.full_name || partner?.username || "Accountability Partner";
                                convAvatar = partner?.avatar_url || "";
                                partnerId = partner?.id || "";
                              }

                              const status = partnerId ? buddyStatusMap[partnerId] || "offline" : "offline";
                              const lastMsg = conv.last_message;
                              const hasUnread = conv.unread_count && conv.unread_count > 0;

                              const isCall = lastMsg?.content.toLowerCase().includes("call") || lastMsg?.message_type === "system" && lastMsg?.content.toLowerCase().includes("joined");
                              const isMissed = lastMsg?.content.toLowerCase().includes("missed");

                              return (
                                <button
                                  key={conv.id}
                                  onClick={() => {
                                    setActiveConvId(conv.id);
                                    setChatSearchOpen(false);
                                    setStickerPickerOpen(false);
                                  }}
                                  className={`w-full text-left p-3.5 rounded-[22px] border transition-all duration-300 cursor-pointer flex gap-3 items-center select-none hover:-translate-y-px ${isActive
                                      ? "bg-gradient-to-br from-white to-[#7655fb]/5 border-[#c0b5ff] shadow-[0_8px_25px_rgba(118,85,251,0.08)] ring-1 ring-[#7655fb]/10"
                                      : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/40 shadow-sm"
                                    }`}
                                >
                                  {conv.type === "group" ? (
                                    <div className="flex -space-x-2.5 overflow-hidden shrink-0 select-none p-0.5">
                                      {(conv.members?.slice(0, 3) || []).map((m, idx) => (
                                        <div key={m.id || idx} className="w-8.5 h-8.5 rounded-full border-2 border-white bg-gradient-to-br from-[#7655fb] to-[#4169e1] flex items-center justify-center text-white text-[9px] font-black shrink-0 relative shadow-sm">
                                          {m.avatar_url ? (
                                            <img src={m.avatar_url ?? undefined} alt="" className="w-full h-full rounded-full object-cover" />
                                          ) : (
                                            (m.full_name || m.username || "G").charAt(0).toUpperCase()
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="relative shrink-0 select-none">
                                      <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-[#7655fb] to-[#4169e1] text-white flex items-center justify-center font-bold text-[12px] shrink-0 shadow-sm">
                                        {convAvatar ? (
                                          <img src={convAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                          convName.charAt(0).toUpperCase()
                                        )}
                                      </div>
                                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${status === "online" ? "bg-[#22c55e] animate-pulse" : "bg-slate-300"
                                        }`} />
                                    </div>
                                  )}

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-bold text-slate-800 text-[13px] truncate">
                                        {convName}
                                      </span>
                                      <span className="text-[9px] text-slate-400 shrink-0">
                                        {lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ""}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5 gap-1">
                                      {isCall ? (
                                        <span className={`text-[11px] truncate flex items-center gap-1 ${isMissed ? "text-red-500 font-bold" : "text-slate-400"}`}>
                                          📞 {isMissed ? "Missed Call" : "Call ended"}
                                        </span>
                                      ) : (
                                        <p className="text-[11px] text-slate-400 truncate">
                                          {lastMsg ? lastMsg.content : "No messages yet."}
                                        </p>
                                      )}
                                      {hasUnread ? (
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#7655fb] shrink-0 block shadow-sm shadow-[#7655fb]/20" />
                                      ) : null}
                                    </div>
                                  </div>
                                </button>
                              );
                            });
                          } else {
                            return (
                              <div className="py-8 border border-dashed border-slate-100 rounded-[20px] text-center text-slate-400 text-[11px]">
                                No active chats.
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </>
                  )}
                </div>

                {/* COLUMN 3: DETAIL / CHAT FEED WINDOW */}
                <div className="flex-1 bg-white flex overflow-hidden h-full">
                  {activeTab === "connections" ? (
                    renderConnectionsRight()
                  ) : activeTab === "meetings" ? (
                    renderMeetingsRight()
                  ) : activeConv && activeConv.type === (activeTab === "chats" ? "dm" : "group") ? (
                    <div className="flex-1 flex overflow-hidden">

                      {/* Chat Messages and Input View */}
                      <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#fafaff] h-full">

                        {/* Header details */}
                        <div className="px-5 py-4 border-b border-gray-100 bg-white flex items-center justify-between shrink-0 select-none">
                          <div className="flex items-center gap-3">
                            {/* Header avatars representation */}
                            {activeConv.type === "group" ? (
                              <div className="flex -space-x-2.5 overflow-hidden shrink-0">
                                {(activeConv.members?.slice(0, 3) || []).map((m, idx) => (
                                  <div key={m.id || idx} className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-[#7655fb] to-[#4169e1] flex items-center justify-center text-white text-[9px] font-black shrink-0 relative z-10">
                                    {m.avatar_url ? (
                                      <img src={m.avatar_url ?? undefined} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                      (m.full_name || m.username || "G").charAt(0).toUpperCase()
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7655fb] to-[#4169e1] text-white flex items-center justify-center font-bold text-[12px] shrink-0">
                                {activeConv.members?.find(m => m.id !== user?.id)?.avatar_url ? (
                                  <img src={activeConv.members.find(m => m.id !== user?.id)?.avatar_url ?? undefined} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  (activeConv.name || "C").charAt(0).toUpperCase()
                                )}
                              </div>
                            )}
                            <div>
                              <h4 className="font-bold text-[#262525] text-[14px]">
                                {activeConv.type === "dm"
                                  ? activeConv.members?.find(m => m.id !== user?.id)?.full_name || "Partner Chat"
                                  : activeConv.name}
                              </h4>
                              <p className="text-[10px] text-[#8f8e98] font-medium mt-0.5">
                                {activeConv.type === "dm" ? "Direct Message Link" : `${activeConv.members?.length || 0} members, 2 online`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Inline add member for group chats */}
                            {activeConv.type === "group" && (
                              <div className="relative">
                                <button
                                  onClick={() => {
                                    setIsAddingMember(!isAddingMember);
                                    setAddMemberSuccess(null);
                                    setAddMemberError(null);
                                  }}
                                  className="text-[#7655fb] hover:text-[#6445e0] text-[11px] font-bold border border-[#7655fb]/20 bg-[#7655fb]/5 hover:bg-[#7655fb]/10 px-3 py-1 rounded-full transition-colors cursor-pointer border-none"
                                >
                                  {isAddingMember ? "Close" : "+ Add"}
                                </button>

                                {isAddingMember && (
                                  <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-[#ececf7] p-4 rounded-[20px] shadow-[0_12px_36px_rgba(24,33,77,0.12)] z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <h5 className="font-bold text-[12px] text-[#262525] mb-2">Enroll Buddy</h5>
                                    <form onSubmit={handleAddMember} className="flex flex-col gap-2">
                                      <input
                                        type="text"
                                        placeholder="Type username..."
                                        required
                                        value={addMemberInput}
                                        onChange={(e) => setAddMemberInput(e.target.value)}
                                        className="w-full px-3 py-1.5 rounded-[10px] border border-[#e4e8f2] text-[12px] focus:outline-none focus:border-[#7655fb]"
                                      />
                                      {addMemberError && (
                                        <p className="text-[10px] text-red-500 font-semibold">{addMemberError}</p>
                                      )}
                                      {addMemberSuccess && (
                                        <p className="text-[10px] text-green-600 font-semibold">{addMemberSuccess}</p>
                                      )}
                                      <button
                                        type="submit"
                                        className="w-full bg-[#7655fb] hover:bg-[#6445e0] text-white py-1.5 rounded-[10px] text-[11px] font-bold cursor-pointer border-none"
                                      >
                                        Add to Group
                                      </button>
                                    </form>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Standard Call Action Icons */}
                            <button className="p-2 rounded-full hover:bg-gray-100 transition-all text-[#7d859a] bg-transparent border-none cursor-pointer">
                              📞
                            </button>
                            <button className="p-2 rounded-full hover:bg-gray-100 transition-all text-[#7d859a] bg-transparent border-none cursor-pointer">
                              📹
                            </button>
                            <button
                              onClick={() => setChatSearchOpen(!chatSearchOpen)}
                              className={`p-2 rounded-full border transition-all cursor-pointer bg-white ${chatSearchOpen ? "border-[#7655fb] text-[#7655fb]" : "border-[#eceff7] text-[#7d859a] hover:text-[#7655fb]"
                                }`}
                              title="Search Messages"
                            >
                              🔍
                            </button>
                          </div>
                        </div>

                        {/* Messages Area Feed */}
                        <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 custom-scrollbar bg-white">
                          {messages.map((msg, index) => {
                            const isMe = msg.sender_id === user.id;
                            const hasFailed = (msg as any).is_failed;
                            const isSystem = msg.message_type === "system";

                            // Date separator logic
                            const prevMsg = index > 0 ? messages[index - 1] : null;
                            const currDate = new Date(msg.created_at).toDateString();
                            const prevDate = prevMsg ? new Date(prevMsg.created_at).toDateString() : null;
                            const showDateHeader = currDate !== prevDate;

                            let headerLabel = new Date(msg.created_at).toLocaleDateString(undefined, {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            });

                            const todayStr = new Date().toDateString();
                            const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
                            if (currDate === todayStr) {
                              headerLabel = "Today";
                            } else if (currDate === yesterdayStr) {
                              headerLabel = "Yesterday";
                            }

                            // If message is a call event (e.g. system notification or content has "call")
                            const isCallEvent = msg.content.toLowerCase().includes("call") || msg.content.toLowerCase().includes("meeting");
                            const isMissedCall = msg.content.toLowerCase().includes("missed");

                            if (isCallEvent) {
                              return (
                                <React.Fragment key={msg.id}>
                                  {showDateHeader && (
                                    <div className="flex items-center justify-center my-4 select-none relative">
                                      <div className="absolute inset-x-0 h-px bg-gray-100" />
                                      <span className="relative text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-white px-3">
                                        {headerLabel}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex self-start max-w-[280px] w-full select-none mt-2">
                                    <div className={`flex items-center gap-3 p-4 w-full border rounded-[22px] shadow-sm ${isMissedCall ? "bg-[#fff5f6] border-[#ffe0e5]" : "bg-[#f2fcf5] border-[#d3f5de]"
                                      }`}>
                                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 ${isMissedCall ? "bg-red-500 shadow-sm shadow-red-500/20" : "bg-[#22c55e] shadow-sm shadow-[#22c55e]/20"
                                        }`}>
                                        📞
                                      </div>
                                      <div className="min-w-0">
                                        <h5 className="text-[12px] font-bold text-[#262525]">
                                          {isMissedCall ? "Incoming call" : "Voice call"}
                                        </h5>
                                        <span className={`text-[10px] font-semibold mt-0.5 block ${isMissedCall ? "text-red-500" : "text-[#22c55e]"
                                          }`}>
                                          {isMissedCall ? "Not answered yet" : "Call ended"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </React.Fragment>
                              );
                            }

                            if (isSystem) {
                              return (
                                <React.Fragment key={msg.id}>
                                  {showDateHeader && (
                                    <div className="flex items-center justify-center my-4 select-none relative">
                                      <div className="absolute inset-x-0 h-px bg-gray-100" />
                                      <span className="relative text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-white px-3">
                                        {headerLabel}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-center my-2 select-none w-full">
                                    <div className="px-4 py-1.5 rounded-[12px] bg-gray-50 border border-gray-100 text-gray-400 text-[10px] font-semibold text-center max-w-[85%]">
                                      {msg.content}
                                    </div>
                                  </div>
                                </React.Fragment>
                              );
                            }

                            const myAppliedReactions = msg.reactions?.filter(r => r.user_id === user.id).map(r => r.emoji) || [];

                            return (
                              <React.Fragment key={msg.id}>
                                {showDateHeader && (
                                  <div className="flex items-center justify-center my-4 select-none relative">
                                    <div className="absolute inset-x-0 h-px bg-gray-100" />
                                    <span className="relative text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-white px-3">
                                      {headerLabel}
                                    </span>
                                  </div>
                                )}

                                <div className={`flex gap-3 group relative max-w-[80%] ${isMe ? "self-end flex-row-reverse" : "self-start"}`}>

                                  {/* User avatar on the side */}
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7655fb] to-[#4169e1] text-white flex items-center justify-center font-bold text-[11px] shrink-0 select-none">
                                    {isMe ? (
                                      user?.email?.charAt(0).toUpperCase()
                                    ) : (
                                      (msg.sender?.full_name || msg.sender?.username || "P").charAt(0).toUpperCase()
                                    )}
                                  </div>

                                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                    {/* Sender Header */}
                                    <span className="text-[10px] text-gray-400 font-bold mb-1 ml-1 select-none">
                                      {isMe ? "You" : (msg.sender?.full_name || msg.sender?.username || "Partner")}
                                    </span>

                                    {/* Message content display */}
                                    <div className="relative">
                                      {msg.message_type === "sticker" ? (
                                        <div className="w-[80px] h-[80px] select-none p-1 bg-transparent">
                                          <img src={msg.content} alt="Sticker" className="w-full h-full object-contain" />
                                        </div>
                                      ) : msg.message_type === "image" && msg.attachments?.[0] ? (
                                        <div className="rounded-[18px] overflow-hidden border border-gray-100 shadow-sm max-w-[220px] select-none">
                                          <a href={msg.attachments[0].file_url} target="_blank" rel="noreferrer">
                                            <img
                                              src={msg.attachments[0].file_url}
                                              alt="Attached Media"
                                              className="w-full h-auto object-cover max-h-[160px] hover:scale-105 transition-transform duration-200"
                                            />
                                          </a>
                                        </div>
                                      ) : msg.message_type === "file" && msg.attachments?.[0] ? (
                                        /* Dialin-inspired File Card with Gradients & Download icon */
                                        <a
                                          href={msg.attachments[0].file_url}
                                          download={msg.attachments[0].file_name}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex items-center gap-3 p-4 bg-white border border-[#ececf7] rounded-[22px] shadow-sm max-w-[280px] group transition-all duration-200 hover:-translate-y-0.5 hover:border-[#cfc7ff]"
                                        >
                                          {/* Gradient file representative block */}
                                          <div className="w-[44px] h-[58px] bg-gradient-to-br from-[#ff6b95] to-[#7655fb] rounded-[8px] shadow-sm flex items-center justify-center text-white font-extrabold text-[9px] tracking-widest relative shrink-0">
                                            FIG
                                            <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-white/20 rounded-full flex items-center justify-center text-[7px] font-black">
                                              ↓
                                            </div>
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <h5 className="text-[12px] font-bold text-[#262525] truncate group-hover:text-[#7655fb] transition-colors leading-tight">
                                              {msg.attachments[0].file_name}
                                            </h5>
                                            <span className="text-[9px] text-gray-400 mt-1 block">
                                              {Math.round(msg.attachments[0].file_size / 1024)} KB
                                            </span>
                                          </div>
                                        </a>
                                      ) : (
                                        /* Speech bubble with simple rounded style */
                                        <div
                                          className={`px-4 py-2.5 rounded-[18px] text-[13px] shadow-[0_2px_8px_rgba(24,33,77,0.01)] leading-relaxed relative ${isMe
                                              ? "bg-white border border-[#ececf7] text-[#262525]"
                                              : "bg-[#f4f6fb] text-[#262525]"
                                            } ${hasFailed ? "opacity-60" : ""}`}
                                        >
                                          {msg.content}
                                        </div>
                                      )}

                                      {/* Reaction & reply triggers on hover */}
                                      <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 select-none z-10 ${isMe ? "right-full mr-2" : "left-full ml-2"
                                        }`}>
                                        <button onClick={() => setReactionMsgId(msg.id)} className="w-6 h-6 rounded-full bg-white border border-gray-200 hover:border-gray-400 text-gray-500 shadow-sm flex items-center justify-center text-[11px] cursor-pointer">☺</button>
                                        <button onClick={() => setReplyParentMsg(msg)} className="w-6 h-6 rounded-full bg-white border border-gray-200 hover:border-gray-400 text-gray-500 shadow-sm flex items-center justify-center text-[11px] cursor-pointer">↩</button>
                                      </div>

                                      {reactionMsgId === msg.id && (
                                        <ReactionSelector
                                          onSelect={(emoji) => handleToggleReaction(msg.id, emoji)}
                                          userReactions={myAppliedReactions}
                                          onClose={() => setReactionMsgId(null)}
                                        />
                                      )}
                                    </div>

                                    {/* Reactions list */}
                                    {msg.reactions && msg.reactions.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {Object.entries(
                                          msg.reactions.reduce((acc, r) => {
                                            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                            return acc;
                                          }, {} as Record<string, number>)
                                        ).map(([emoji, count]) => {
                                          const userReacted = myAppliedReactions.includes(emoji);
                                          return (
                                            <button
                                              key={emoji}
                                              onClick={() => handleToggleReaction(msg.id, emoji)}
                                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] transition-all cursor-pointer ${userReacted
                                                  ? "bg-[#7655fb]/10 border-[#7655fb] text-[#7655fb] font-bold"
                                                  : "bg-white border-[#ececf7] text-gray-500"
                                                }`}
                                            >
                                              <span>{emoji}</span>
                                              <span>{count}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {/* Timestamp & read confirmation */}
                                    <div className="flex items-center gap-1.5 mt-1 select-none">
                                      <span className="text-[8px] text-gray-300">
                                        {new Date(msg.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      {isMe && !hasFailed && (
                                        <span className="text-[9px] text-[#7655fb]">
                                          ✓{msg.read_receipts && msg.read_receipts.length > 1 ? "✓" : ""}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          })}

                          {/* Typing Status */}
                          {Object.entries(typingUsers).map(([tId, tName]) => (
                            <div key={tId} className="flex gap-2 items-center text-gray-400 text-[10px] italic pl-2 select-none">
                              <div className="flex gap-0.5 items-center">
                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                              </div>
                              <span>{tName} is typing...</span>
                            </div>
                          ))}
                          <div ref={chatBottomRef} />
                        </div>

                        {/* Reply indicator */}
                        {replyParentMsg && (
                          <div className="px-5 py-2 bg-[#f4f6fb] border-t border-gray-100 flex items-center justify-between shrink-0 select-none">
                            <div className="border-l-3 border-[#7655fb] pl-2">
                              <span className="text-[10px] font-bold text-[#7655fb]">Replying to msg</span>
                              <p className="text-[11px] text-gray-500 truncate max-w-[400px] mt-0.5">{replyParentMsg.content}</p>
                            </div>
                            <button onClick={() => setReplyParentMsg(null)} className="text-gray-400 hover:text-gray-600 text-[10px] border-none bg-transparent cursor-pointer">✕</button>
                          </div>
                        )}

                        {/* Message Send Input form */}
                        <form onSubmit={handleSendMessage} className="px-5 py-3 border-t border-gray-100 bg-white flex items-center gap-3 shrink-0">
                          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

                          {/* Plus circular action button on left */}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAttachment}
                            className="w-[42px] h-[42px] rounded-full bg-[#7655fb]/10 text-[#7655fb] hover:bg-[#7655fb]/20 flex items-center justify-center font-bold border-none cursor-pointer shrink-0 shadow-sm transition-all"
                            title="Attach File"
                          >
                            ✦
                          </button>

                          {/* Input field wrapper */}
                          <div className="flex-1 relative flex items-center bg-[#f4f6fb] rounded-full px-4 border border-transparent focus-within:bg-white focus-within:border-[#7655fb] transition-all">
                            <input
                              type="text"
                              placeholder="Write a message..."
                              value={messageInput}
                              onChange={handleInputChange}
                              className="flex-1 h-[44px] bg-transparent border-none outline-none text-[13px] pr-28 text-gray-800 focus:ring-0"
                            />

                            {/* Action shortcuts on the right side inside input bar */}
                            <div className="absolute right-2.5 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setStickerPickerOpen(!stickerPickerOpen)}
                                className={`text-[15px] hover:text-[#7655fb] bg-transparent border-none cursor-pointer transition-colors ${stickerPickerOpen ? "text-[#7655fb]" : "text-[#7d859a]"
                                  }`}
                                title="Emojis"
                              >
                                😊
                              </button>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-[15px] text-[#7d859a] hover:text-[#7655fb] bg-transparent border-none cursor-pointer transition-colors"
                                title="Attach File"
                              >
                                📎
                              </button>
                              <button
                                type="button"
                                className="text-[15px] text-[#7d859a] hover:text-[#7655fb] bg-transparent border-none cursor-pointer transition-colors"
                                title="Call Schedule"
                              >
                                🕒
                              </button>
                              <button
                                type="submit"
                                className="w-8 h-8 rounded-full bg-[#7655fb] hover:bg-[#6445e0] text-white flex items-center justify-center shrink-0 border-none cursor-pointer shadow-md shadow-[#7655fb]/15 hover:scale-105 active:scale-95 transition-all"
                                title="Send"
                              >
                                ➤
                              </button>
                            </div>

                            {/* Sticker picker panel */}
                            {stickerPickerOpen && (
                              <StickerPicker
                                onSelect={(url) => handleSendMessage(undefined, url, "sticker")}
                                onClose={() => setStickerPickerOpen(false)}
                              />
                            )}
                          </div>
                        </form>

                      </div>

                      {/* Search Drawer Panel Overlay */}
                      {chatSearchOpen && (
                        <ChatSearchPanel
                          conversationId={activeConvId!}
                          onSelectMessage={(msgId) => {
                            const el = document.getElementById(`msg-${msgId}`);
                            el?.scrollIntoView({ behavior: "smooth", block: "center" });
                            el?.classList.add("ring-2", "ring-[#7655fb]", "ring-offset-2");
                            setTimeout(() => {
                              el?.classList.remove("ring-2", "ring-[#7655fb]", "ring-offset-2");
                            }, 3000);
                          }}
                          onClose={() => setChatSearchOpen(false)}
                        />
                      )}

                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none bg-[#fafaff]">
                      <div className="h-16 w-16 bg-[#eef2ff] rounded-full flex items-center justify-center text-[#7655fb] mb-4 shadow-sm">
                        💬
                      </div>
                      <h4 className="font-bold text-[#262525] text-[15px]">
                        Select a {activeTab === "chats" ? "direct chat" : "group chat"}
                      </h4>
                      <p className="text-[12px] text-[#6f6f78] mt-1.5 max-w-[280px]">
                        Choose a {activeTab === "chats" ? "direct partner link" : "group circle"} to start messaging and view progress details.
                      </p>
                    </div>
                  )}
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
