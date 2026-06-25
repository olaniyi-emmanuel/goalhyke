"use client";

import React, { useState, useEffect, useRef } from "react";
import NavigationRegistered from "@/components/NavigationRegistered";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  ChatService,
  ChatConversation,
  ChatMessage,
} from "@/lib/services/chat";
import ReactionSelector from "@/components/ReactionSelector";
import StickerPicker from "@/components/StickerPicker";
import ChatSearchPanel from "@/components/ChatSearchPanel";
import InitialsAvatar from "@/components/InitialsAvatar";

type TabId = "connections" | "chats" | "groups" | "meetings";
type UIMessage = ChatMessage & { is_failed?: boolean };
type OfflineMessage = UIMessage & { retry_count?: number };

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
  const [activeTab, setActiveTab] = useState<TabId>("chats");
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [mobilePane, setMobilePane] = useState<"list" | "chat">("list");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");

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
  const [offlineQueue, setOfflineQueue] = useState<OfflineMessage[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Threading / replies
  const [replyParentMsg, setReplyParentMsg] = useState<ChatMessage | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const inviteLink = `${typeof window !== "undefined" ? window.location.origin : ""}/links?join=${inviteCode}`;

  // Find active conversation
  const activeConv = conversations.find(c => c.id === activeConvId) || null;

  useEffect(() => {
    if (!activeConvId) {
      setMobilePane("list");
    }
  }, [activeConvId]);

  // On mount: load offline failed messages queue
  useEffect(() => {
    const cached = localStorage.getItem("goalhyke_failed_messages");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setOfflineQueue(parsed as OfflineMessage[]);
        }
      } catch {
        localStorage.removeItem("goalhyke_failed_messages");
      }
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

  const saveOfflineQueue = (
    queueOrFn: OfflineMessage[] | ((prev: OfflineMessage[]) => OfflineMessage[]),
  ) => {
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
          const raw = p.online_status;
          statusMap[p.id] = raw === "online" || raw === "away" || raw === "offline" ? raw : "offline";
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
      } catch (err: unknown) {
        console.error("Failed to initialize accountability services:", err);
        setInitError(err instanceof Error ? err.message : "Failed to initialize accountability services.");
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
    } catch (err: unknown) {
      console.error("Failed to build group:", err);
      setGroupCreateError(err instanceof Error ? err.message : "Could not construct accountability group.");
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
    const allowedTypes: ChatMessage["message_type"][] = [
      "text",
      "image",
      "audio",
      "video",
      "file",
      "gif",
      "sticker",
      "emoji",
      "system",
    ];
    const messageType: ChatMessage["message_type"] = allowedTypes.includes(
      (customType ?? "text") as ChatMessage["message_type"]
    )
      ? ((customType ?? "text") as ChatMessage["message_type"])
      : "text";

    // 1. Optimistic Message Object
    const tempMsg: UIMessage = {
      id: tempId,
      conversation_id: activeConvId,
      sender_id: user.id,
      content: textToSend,
      message_type: messageType,
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
        setMessages((prev) => prev.map((m) => (m.id === tempId ? (data.message as UIMessage) : m)));
        // Refresh room activity lists
        fetchConversations();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      // Mark as failed in UI
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, is_failed: true } : m)));
      // Store in offline retry queue
      saveOfflineQueue([...offlineQueue, { ...tempMsg, retry_count: 0 } as OfflineMessage]);
    }
  };

  // Retries a failed message
  const handleRetryMessage = async (msg: OfflineMessage) => {
    // Remove failed status from UI temporarily
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_failed: false } : m)));

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
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? (data.message as UIMessage) : m)));
        // Remove from offline queue
        saveOfflineQueue(offlineQueue.filter(o => o.id !== msg.id));
        fetchConversations();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      // Put back to failed state
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_failed: true } : m)));
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
        <div className="px-4 py-2 flex items-center justify-between shrink-0 select-none">
          <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.14em]">My Links</span>
          <span className="text-[10px] font-bold text-white bg-gradient-to-r from-[#7655fb] to-[#4169e1] px-2.5 py-0.5 rounded-full shadow-[0_2px_8px_rgba(118,85,251,0.2)]">
            {buddies.length}
          </span>
        </div>

        {/* Filter Input */}
        <div className="px-4 py-2 shrink-0">
          <input
            type="text"
            placeholder="Filter connections..."
            value={sidebarSearchQuery}
            onChange={(e) => setSidebarSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-[#f4f6fb] border border-transparent rounded-2xl text-[14px] focus:outline-none focus:bg-white focus:border-[#7655fb]/30 focus:shadow-[0_0_0_3px_rgba(118,85,251,0.06)] transition-all placeholder:text-[#b0b5c3]"
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
                      className="p-3.5 rounded-2xl border border-[rgba(118,85,251,0.04)] bg-white hover:bg-[#fafaff] flex flex-col gap-2.5 hover:shadow-[0_4px_16px_rgba(118,85,251,0.06)] hover:border-[rgba(118,85,251,0.1)] transition-all duration-300 animate-fadeIn"
                    >
                      <div className="flex gap-2.5 items-center">
                        <div className="relative shrink-0">
                          <InitialsAvatar name={buddy.name} seed={buddy.buddyId} size={36} className="ring-2 ring-white shadow-sm" />
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white rounded-full ${buddyStatusMap[buddy.buddyId] === "online" ? "bg-[#10b981] animate-glow-green" : "bg-[#cbd5e1]"
                            }`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[#1a1a2e] text-[14px] truncate">{buddy.name}</div>
                          <div className="text-[12px] text-[#94a3b8] truncate">@{buddy.username}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-gray-50 pt-2 mt-1">
                        <button
                          onClick={() => handleStartDM(buddy.buddyId)}
                          className="h-11 px-4 bg-[#7655fb]/10 hover:bg-[#7655fb]/20 text-[#7655fb] rounded-full text-[12px] font-bold transition-colors cursor-pointer border-none"
                        >
                          Message
                        </button>
                        <button
                          onClick={() => handleDisconnect(buddy.id)}
                          className="h-11 px-3 text-[#8f8e98] hover:text-red-500 text-[12px] font-bold transition-colors cursor-pointer border-none bg-transparent"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                    <div className="py-14 border border-dashed border-[rgba(118,85,251,0.08)] rounded-2xl text-center flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#f0eeff] flex items-center justify-center animate-float">
                        <svg className="w-6 h-6 text-[#7655fb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <span className="text-[#94a3b8] text-[14px] font-medium">No connections yet</span>
                    </div>
                )}

                {pendingRequests.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-100">
                    <span className="text-[11px] font-bold text-[#e8a317] uppercase tracking-[0.14em] block px-1 mb-2">
                      Requests ({pendingRequests.length})
                    </span>
                    {pendingRequests.map((req) => (
                      <div key={req.id} className="p-3 bg-[#fffdf0] border border-[#f5ead3] rounded-[18px] flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <InitialsAvatar name={req.name} seed={req.buddyId} size={32} className="shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[14px] font-bold text-[#262525] truncate">{req.name}</div>
                            <div className="text-[12px] text-gray-500">@{req.username}</div>
                          </div>
                        </div>

                        {req.type === "incoming" ? (
                          <div className="flex gap-2 justify-end border-t border-[#f5ead3]/55 pt-2">
                            <button
                              onClick={() => handleAcceptRequest(req.id)}
                              className="h-11 px-4 bg-[#7655fb] hover:bg-[#6445e0] text-white rounded-full text-[12px] font-bold cursor-pointer border-none"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req.id)}
                              className="h-11 px-4 bg-white hover:bg-gray-50 border border-gray-200 text-gray-500 rounded-full text-[12px] font-bold cursor-pointer"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <div className="text-right border-t border-[#f5ead3]/55 pt-1">
                            <span className="text-[12px] text-[#e8a317] font-bold">Awaiting Approval</span>
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
      <div className="flex-1 bg-gradient-to-br from-[#fafaff] to-white p-8 overflow-y-auto flex flex-col items-center justify-center select-text">
        <div className="max-w-[480px] w-full flex flex-col gap-6">

          {/* Invite Partners Card */}
          <div className="bg-white rounded-3xl border border-[rgba(118,85,251,0.06)] p-8 shadow-[0_8px_32px_rgba(118,85,251,0.06)] flex flex-col gap-6 hover:shadow-[0_12px_40px_rgba(118,85,251,0.1)] transition-all duration-300">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7655fb] to-[#4169e1] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(118,85,251,0.3)]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h3 className="font-extrabold text-[#1a1a2e] text-[18px] tracking-tight">
                  Invite Partners
                </h3>
              </div>
              <p className="text-[12px] text-[#94a3b8] leading-relaxed">
                Share your unique accountability code or link with friends to join your hyke.
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
          <div className="bg-white rounded-3xl border border-[rgba(118,85,251,0.06)] p-8 shadow-[0_8px_32px_rgba(118,85,251,0.06)] flex flex-col gap-6 hover:shadow-[0_12px_40px_rgba(118,85,251,0.1)] transition-all duration-300">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(16,185,129,0.3)]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="font-extrabold text-[#1a1a2e] text-[18px] tracking-tight">
                  Join a Buddy
                </h3>
              </div>
              <p className="text-[12px] text-[#94a3b8] leading-relaxed">Enter an invite code to connect with your accountability partner.</p>
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
        <div className="px-4 py-2 flex items-center justify-between shrink-0 select-none">
          <span className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest">Schedules</span>
          <span className="text-[10px] font-bold text-white bg-gradient-to-r from-[#7655fb] to-[#4169e1] px-2.5 py-0.5 rounded-full shadow-[0_2px_8px_rgba(118,85,251,0.2)]">
            {meetings.length}
          </span>
        </div>

        <div className="flex-1 flex flex-col gap-3 overflow-y-auto px-3 py-2">
          {meetings.length > 0 ? (
            meetings.map((meeting) => (
              <div key={meeting.id} className="p-4 bg-white border border-[rgba(118,85,251,0.04)] hover:border-[rgba(118,85,251,0.1)] rounded-2xl flex flex-col gap-3 transition-all duration-300 hover:shadow-[0_4px_16px_rgba(118,85,251,0.06)] animate-fadeIn">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-[#1a1a2e] text-[13px] truncate">{meeting.title}</h4>
                    {meeting.description && (
                      <p className="text-[10px] text-[#94a3b8] mt-1 truncate leading-relaxed">{meeting.description}</p>
                    )}
                  </div>
                  <div className="text-[11px] font-extrabold text-white bg-gradient-to-r from-[#7655fb] to-[#4169e1] px-3 py-1 rounded-lg shrink-0 tracking-tight shadow-[0_2px_8px_rgba(118,85,251,0.2)]">{meeting.time}</div>
                </div>
                <div className="flex items-center justify-between border-t border-[rgba(118,85,251,0.04)] pt-2.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleComplete(meeting.id, meeting.isCompleted)}
                      className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center cursor-pointer ${meeting.isCompleted
                          ? "bg-gradient-to-r from-[#7655fb] to-[#4169e1] border-[#7655fb] text-white shadow-[0_2px_8px_rgba(118,85,251,0.3)]"
                          : "border-[#cbd5e1] hover:border-[#7655fb] bg-transparent"
                        }`}
                    >
                      {meeting.isCompleted && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <span className={`text-[10px] font-semibold ${meeting.isCompleted ? "text-[#10b981]" : "text-[#94a3b8]"}`}>
                      {meeting.isCompleted ? "Completed" : "Active"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-[#94a3b8] font-medium select-none">Alarm</span>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(meeting.id, meeting.isActive)}
                      className={`w-9 h-5 rounded-full transition-all duration-300 relative focus:outline-none cursor-pointer border-none ${meeting.isActive ? "bg-gradient-to-r from-[#10b981] to-[#059669] shadow-[0_2px_8px_rgba(16,185,129,0.3)]" : "bg-[#e2e8f0]"
                        }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-300 shadow-sm ${meeting.isActive ? "left-4.5" : "left-0.5"
                          }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 border border-dashed border-[rgba(118,85,251,0.08)] rounded-2xl text-center flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#f0eeff] flex items-center justify-center animate-float">
                <svg className="w-5 h-5 text-[#7655fb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-[#94a3b8] text-[11px] font-medium">No meetings scheduled</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMeetingsRight = () => {
    return (
      <div className="flex-1 bg-gradient-to-br from-[#fafaff] to-white p-8 overflow-y-auto flex flex-col items-center justify-center select-text">
        <div className="max-w-[420px] w-full bg-white rounded-3xl border border-[rgba(118,85,251,0.06)] p-8 shadow-[0_8px_32px_rgba(118,85,251,0.06)] hover:shadow-[0_12px_40px_rgba(118,85,251,0.1)] transition-all duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7655fb] to-[#4169e1] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(118,85,251,0.3)]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-extrabold text-[#1a1a2e] text-[18px] tracking-tight">
              Schedule a Meeting
            </h3>
          </div>
          <p className="text-[12px] text-[#94a3b8] mb-6 leading-relaxed">Set up an accountability check-in with your buddy.</p>

          <form onSubmit={handleCreateMeeting} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-widest">
                Meeting Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sales Team Meeting"
                value={newMeetingTitle}
                onChange={(e) => setNewMeetingTitle(e.target.value)}
                className="w-full h-[48px] px-4 rounded-2xl border border-[rgba(118,85,251,0.1)] bg-[#fbfbff] text-[#1a1a2e] text-[13px] focus:outline-none focus:border-[#7655fb]/30 focus:shadow-[0_0_0_3px_rgba(118,85,251,0.06)] transition-all placeholder:text-[#b0b5c3]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-widest">
                Description
              </label>
              <input
                type="text"
                placeholder="Discuss progress targets..."
                value={newMeetingDesc}
                onChange={(e) => setNewMeetingDesc(e.target.value)}
                className="w-full h-[48px] px-4 rounded-2xl border border-[rgba(118,85,251,0.1)] bg-[#fbfbff] text-[#1a1a2e] text-[13px] focus:outline-none focus:border-[#7655fb]/30 focus:shadow-[0_0_0_3px_rgba(118,85,251,0.06)] transition-all placeholder:text-[#b0b5c3]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-widest">
                Time (HH:MM)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 12:40"
                value={newMeetingTime}
                onChange={(e) => setNewMeetingTime(e.target.value)}
                className="w-full h-[48px] px-4 rounded-2xl border border-[rgba(118,85,251,0.1)] bg-[#fbfbff] text-[#1a1a2e] text-[13px] focus:outline-none focus:border-[#7655fb]/30 focus:shadow-[0_0_0_3px_rgba(118,85,251,0.06)] transition-all placeholder:text-[#b0b5c3]"
              />
            </div>

            <button
              type="submit"
              className="w-full h-[48px] bg-gradient-to-r from-[#4169e1] to-[#7655fb] hover:shadow-[0_8px_24px_rgba(118,85,251,0.3)] hover:scale-[1.02] text-white rounded-2xl text-[14px] font-bold shadow-[0_4px_16px_rgba(118,85,251,0.2)] transition-all cursor-pointer mt-2 border-none"
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

      <div className="gh-page-end-gap flex max-w-[1280px] mx-auto min-h-[calc(100vh-110px)]">
        <Sidebar />

        <div className="flex-1 bg-[#f4f6fb] flex flex-col">
          <div className="p-0 flex flex-col h-[calc(100vh-110px)]">
            <div className="px-6 py-4 border-b border-[rgba(118,85,251,0.06)] glass-strong flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0 relative z-10">
              <div className="flex items-center gap-4 relative z-10">
                {/* Ambient glowing fields for premium visual depth */}
                <div className="absolute -top-14 -left-14 w-44 h-44 pointer-events-none overflow-hidden rounded-full mix-blend-plus-lighter opacity-60">
                  <div className="hyke-glow-aurora" />
                  <div className="hyke-glow-aurora-2" style={{ animationDelay: '-3s' }} />
                </div>

                {/* Modern interactive custom SVG logo mark */}
                <div className="relative w-12 h-12 shrink-0 group cursor-pointer flex items-center justify-center z-10">
                  {/* Glowing shadow effect */}
                  <div className="absolute inset-1.5 rounded-2xl bg-gradient-to-br from-[#7655fb] via-[#5a6bfb] to-[#4169e1] opacity-75 blur-md group-hover:opacity-100 group-hover:blur-lg transition-all duration-500" />
                  
                  {/* Glassmorphic border container */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 to-[#7655fb]/10 border border-white/40 group-hover:border-[#7655fb]/40 backdrop-blur-md shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.4),0_8px_20px_rgba(118,85,251,0.15)] flex items-center justify-center overflow-hidden transition-colors duration-500">
                    <div className="absolute inset-0 shimmer-bg opacity-25" />
                    
                    <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="peakGrad1" x1="12" y1="36" x2="24" y2="16" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#4169e1" stopOpacity="0.85" />
                          <stop offset="100%" stopColor="#7655fb" stopOpacity="0.95" />
                        </linearGradient>
                        <linearGradient id="peakGrad2" x1="24" y1="36" x2="36" y2="20" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#7655fb" stopOpacity="0.55" />
                          <stop offset="100%" stopColor="#4169e1" stopOpacity="0.8" />
                        </linearGradient>
                        <linearGradient id="lineGrad" x1="8" y1="36" x2="38" y2="12" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                          <stop offset="50%" stopColor="#7655fb" />
                          <stop offset="100%" stopColor="#4169e1" />
                        </linearGradient>
                      </defs>
                      
                      {/* Nested orbital dashed rings */}
                      <circle cx="24" cy="24" r="22" stroke="url(#lineGrad)" strokeWidth="1" strokeDasharray="3 5" className="hyke-animate-rotate-dashed opacity-40" />
                      <circle cx="24" cy="24" r="18" stroke="url(#lineGrad)" strokeWidth="0.75" strokeDasharray="6 3" className="hyke-animate-rotate-dashed-counter opacity-25" />
                      
                      {/* Core Ascending Peaks (GoalHyke visual mark) */}
                      <path d="M12 33L22 15L32 33H12Z" fill="url(#peakGrad1)" className="hyke-peak hyke-peak-main" />
                      <path d="M22 33L29 21L36 33H22Z" fill="url(#peakGrad2)" className="hyke-peak" />
                      
                      {/* Drawing path ascending streak */}
                      <path d="M9 31 L21 17 L33 25 L37 19" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="hyke-draw-path drop-shadow-[0_0_5px_rgba(118,85,251,0.65)]" />
                    </svg>
                  </div>
                  
                  {/* Outer pulse indicator */}
                  <div className="absolute -inset-1 rounded-2xl border border-[#7655fb]/30 animate-pulseRing pointer-events-none" />
                  
                  {/* Rotating orbital glow beacon */}
                  <div className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-[#7655fb] to-[#4169e1] shadow-[0_0_8px_rgba(118,85,251,0.85)] pointer-events-none" style={{ top: '-4px', left: '20px', transformOrigin: '4px 28px', animation: 'orbitDotHeader 3.2s linear infinite' }} />
                </div>

                <div className="flex flex-col gap-0.5 z-10">
                  <div className="flex items-center gap-2">
                    <h1 className="text-[28px] font-black tracking-tight hyke-gradient-text hover:scale-[1.01] transition-transform duration-300 select-none">Hyke Circle</h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-[#7655fb]/15 to-[#4169e1]/15 text-[#7655fb] border border-[#7655fb]/20 backdrop-blur-md shadow-[0_2px_8px_rgba(118,85,251,0.1)] pro-badge-shimmer">Pro</span>
                  </div>
                  {/* Animated gradient underline with glow */}
                  <div className="h-[3px] w-24 rounded-full bg-gradient-to-r from-[#4169e1] via-[#7655fb] to-[#4169e1] shadow-[0_0_10px_rgba(118,85,251,0.35)]" style={{ backgroundSize: '200% 200%', animation: 'gradientShift 3.5s ease infinite' }} />
                </div>
              </div>

              {/* Premium Segmented Tab Switcher */}
              <div className="flex bg-[#f0eeff]/60 backdrop-blur-sm p-1 rounded-2xl w-fit shrink-0 self-start md:self-auto border border-[rgba(118,85,251,0.06)] shadow-[0_2px_12px_rgba(118,85,251,0.06)]">
                {([
                  { id: "connections", text: "Connections", icon: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>) },
                  { id: "chats", text: "Chats", icon: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>) },
                  { id: "groups", text: "Groups", icon: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>) },
                  { id: "meetings", text: "Meetings", icon: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>) }
                ] as const satisfies ReadonlyArray<{ id: TabId; text: string; icon: React.ReactNode }>).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-bold transition-all duration-300 cursor-pointer border-none ${activeTab === t.id
                        ? "bg-gradient-to-r from-[#4169e1] to-[#7655fb] text-white shadow-[0_4px_16px_rgba(118,85,251,0.3)] scale-[1.02] animate-tabSlide"
                        : "text-[#7a7f90] hover:text-[#5a5f72] hover:bg-white/60"
                      }`}
                  >
                    {t.icon}
                    <span>{t.text}</span>
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
                {mobileNavOpen ? (
                  <div className="fixed inset-0 z-[120] lg:hidden">
                    <button
                      type="button"
                      onClick={() => setMobileNavOpen(false)}
                      className="absolute inset-0 bg-[#0f1420]/40"
                      aria-label="Close menu"
                    />
                    <div className="absolute left-0 top-0 h-full w-[86vw] max-w-[360px] overflow-y-auto bg-white shadow-[0_24px_70px_rgba(24,33,77,0.18)]">
                      <div className="flex items-center justify-between border-b border-[#eceff7] px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-secondary text-[18px] font-extrabold text-[#262525]">
                            Hyke Circle
                          </span>
                          <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#7a7f90]">
                            Accountability Hub
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMobileNavOpen(false)}
                          className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#f4f6fb] text-[#7655fb]"
                          aria-label="Close menu"
                        >
                          <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M18 6L6 18M6 6L18 18"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>

                      <div className="px-5 py-4">
                        <label className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#7a7f90]">
                          Search
                        </label>
                        <input
                          type="text"
                          placeholder="Search"
                          value={sidebarSearchQuery}
                          onChange={(e) => setSidebarSearchQuery(e.target.value)}
                          className="gh-input mt-3 h-[52px] rounded-[18px] bg-[#fbfbff]"
                        />
                      </div>

                      <div className="px-3 pb-6">
                        <div className="px-2 pb-3 pt-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[#7a7f90]">
                          Main
                        </div>
                        <div className="flex flex-col gap-2">
                          {([
                            { id: "connections", label: "Connections" },
                            { id: "chats", label: "Chats" },
                            { id: "groups", label: "Groups" },
                            { id: "meetings", label: "Meetings" },
                          ] as const satisfies ReadonlyArray<{ id: TabId; label: string }>).map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setActiveTab(item.id);
                                setMobileNavOpen(false);
                                setMobilePane("list");
                              }}
                              className={`flex h-12 items-center justify-between rounded-[18px] px-4 font-secondary text-[15px] font-bold transition-colors ${
                                activeTab === item.id
                                  ? "bg-[#f1edff] text-[#7655fb]"
                                  : "text-[#262525] hover:bg-[#f7f8ff]"
                              }`}
                            >
                              <span>{item.label}</span>
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M9 18L15 12L9 6"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          ))}
                          <Link
                            href="/settings"
                            onClick={() => setMobileNavOpen(false)}
                            className="flex h-12 items-center justify-between rounded-[18px] px-4 font-secondary text-[15px] font-bold text-[#262525] hover:bg-[#f7f8ff] transition-colors"
                          >
                            <span>Settings</span>
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M9 18L15 12L9 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* COLUMN 1: LEFT NAVIGATION PANE */}
                <div className="hidden w-[264px] border-r border-[rgba(118,85,251,0.06)] bg-gradient-to-b from-white to-[#fafaff] lg:flex flex-col h-full shrink-0 select-none xl:w-[288px]">
                  {/* Branded Header */}
                  <div className="flex items-center justify-between px-6 py-5 shrink-0 select-none">
                    <div className="flex items-center gap-2.5 group/brand select-none cursor-pointer">
                      <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
                        {/* Compact glowing shadow effect */}
                        <div className="absolute inset-1 rounded-xl bg-gradient-to-br from-[#7655fb] via-[#5a6bfb] to-[#4169e1] opacity-70 blur-sm group-hover/brand:opacity-90 group-hover/brand:blur-md transition-all duration-300" />
                        
                        {/* Compact Glassmorphic border container */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 to-[#7655fb]/5 border border-white/40 group-hover/brand:border-[#7655fb]/30 backdrop-blur-md shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4),0_4px_12px_rgba(118,85,251,0.12)] flex items-center justify-center overflow-hidden transition-all duration-300">
                          <div className="absolute inset-0 shimmer-bg opacity-20" />
                          
                          <svg className="w-7 h-7" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              <linearGradient id="sidePeakGrad1" x1="10" y1="30" x2="20" y2="13" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#4169e1" stopOpacity="0.85" />
                                <stop offset="100%" stopColor="#7655fb" stopOpacity="0.95" />
                              </linearGradient>
                              <linearGradient id="sidePeakGrad2" x1="20" y1="30" x2="30" y2="17" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#7655fb" stopOpacity="0.55" />
                                <stop offset="100%" stopColor="#4169e1" stopOpacity="0.8" />
                              </linearGradient>
                              <linearGradient id="sideLineGrad" x1="6" y1="30" x2="32" y2="10" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                                <stop offset="50%" stopColor="#7655fb" />
                                <stop offset="100%" stopColor="#4169e1" />
                              </linearGradient>
                            </defs>
                            
                            {/* Nested orbital dashed rings */}
                            <circle cx="20" cy="20" r="18" stroke="url(#sideLineGrad)" strokeWidth="0.8" strokeDasharray="3 4" className="hyke-animate-rotate-dashed-sidebar opacity-35" />
                            <circle cx="20" cy="20" r="15" stroke="url(#sideLineGrad)" strokeWidth="0.6" strokeDasharray="5 2.5" className="hyke-animate-rotate-dashed-sidebar-counter opacity-20" />
                            
                            {/* Core Ascending Peaks */}
                            <path d="M10 28L18 13L26 28H10Z" fill="url(#sidePeakGrad1)" className="hyke-peak hyke-peak-main" />
                            <path d="M18 28L24 18L30 28H18Z" fill="url(#sidePeakGrad2)" className="hyke-peak" />
                            
                            {/* Drawing path ascending streak */}
                            <path d="M8 26 L17 15 L27 21 L31 16" stroke="url(#sideLineGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hyke-draw-path drop-shadow-[0_0_3px_rgba(118,85,251,0.6)]" />
                          </svg>
                        </div>
                        
                        {/* Compact Orbit ring (visible on hover) */}
                        <div className="absolute -inset-0.5 rounded-xl border border-[#7655fb]/0 group-hover/brand:border-[#7655fb]/20 group-hover/brand:scale-105 transition-all duration-500 pointer-events-none" />
                        
                        {/* Micro orbit dot (fully visible and orbiting on hover) */}
                        <div className="absolute w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#7655fb] to-[#4169e1] opacity-0 group-hover/brand:opacity-100 transition-opacity duration-300 shadow-[0_0_6px_rgba(118,85,251,0.75)] pointer-events-none" style={{ top: '-2px', left: '15px', transformOrigin: '3px 20px', animation: 'orbitDotSidebar 3s linear infinite' }} />
                      </div>
                      <div className="flex flex-col gap-0">
                        <span className="font-extrabold text-[16px] tracking-tight hyke-gradient-text transition-transform duration-300 group-hover/brand:scale-[1.02]">Hyke Circle</span>
                        <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest leading-none mt-1">Accountability Hub</span>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-transparent text-[#94a3b8]">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </div>
                  </div>

                  {/* Search input */}
                  <div className="px-4 mb-5 shrink-0 relative group">
                    <div className="absolute inset-y-0 left-7 flex items-center pointer-events-none text-[#94a3b8] group-focus-within:text-[#7655fb] transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search"
                      value={sidebarSearchQuery}
                      onChange={(e) => setSidebarSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-[#f4f6fb] border border-transparent rounded-2xl text-[14px] focus:outline-none focus:bg-white focus:border-[#7655fb]/30 focus:shadow-[0_0_0_3px_rgba(118,85,251,0.06)] transition-all placeholder:text-[#b0b5c3]"
                    />
                    <div className="absolute inset-y-0 right-7 flex items-center pointer-events-none">
                      <kbd className="text-[10px] font-bold text-[#b0b5c3] bg-white border border-[#e4e8f2] px-1.5 py-0.5 rounded-md shadow-sm">/</kbd>
                    </div>
                  </div>

                  {/* MAIN SECTION */}
                  <div className="px-3 mb-5 shrink-0">
                    <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.14em] block px-2 mb-3 select-none">Main</span>
                    <div className="flex flex-col gap-0.5">
                      {([
                        { id: "connections", label: "Connections", icon: (<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>) },
                        { id: "chats", label: "Chats", icon: (<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>) },
                        { id: "groups", label: "Groups", icon: (<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>) },
                        { id: "meetings", label: "Meetings", icon: (<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>) },
                      ] as const satisfies ReadonlyArray<{ id: TabId; label: string; icon: React.ReactNode }>).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-semibold transition-all duration-200 text-left border-none cursor-pointer w-full relative overflow-hidden ${activeTab === item.id
                            ? "bg-gradient-to-r from-[#7655fb]/10 to-[#4169e1]/5 text-[#7655fb] font-bold shadow-sm"
                            : "text-[#64748b] bg-transparent hover:bg-[#f4f6fb] hover:text-[#475569]"
                          }`}
                        >
                          {activeTab === item.id && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-[#7655fb] to-[#4169e1] rounded-r-full animate-slideIn" />
                          )}
                          <span className={activeTab === item.id ? "text-[#7655fb]" : "text-[#94a3b8]"}>{item.icon}</span>
                          {item.label}
                        </button>
                      ))}
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-semibold text-[#64748b] hover:bg-[#f4f6fb] hover:text-[#475569] transition-all text-left w-full no-underline"
                      >
                        <span className="text-[#94a3b8]">
                          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </span>
                        Settings
                      </Link>
                    </div>
                  </div>

                  {/* INBOXES SECTION */}
                  <div className="px-3 mb-5 shrink-0">
                    <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.14em] block px-2 mb-3 select-none">Inboxes</span>
                    <div className="flex flex-col gap-1">
                      {([
                        { id: "chats", label: "Personal DMs", desc: "Direct Messages", icon: (<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>) },
                        { id: "groups", label: "Team Circles", desc: "Accountability Groups", icon: (<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>) }
                      ] as const satisfies ReadonlyArray<{ id: Extract<TabId, "chats" | "groups">; label: string; desc: string; icon: React.ReactNode }>).map((f) => {
                        const active = activeTab === f.id;
                        return (
                          <button
                            key={f.id}
                            onClick={() => {
                              setActiveTab(f.id);
                            }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 text-left border-none cursor-pointer w-full ${active
                                ? "bg-gradient-to-r from-[#7655fb]/8 to-[#4169e1]/4 text-[#7655fb] shadow-sm border-l-[3px] border-[#7655fb] font-bold"
                                : "bg-transparent text-[#64748b] hover:bg-[#f4f6fb]"
                              }`}
                          >
                            <span className={`${active ? "text-[#7655fb]" : "text-[#94a3b8]"} transition-colors`}>{f.icon}</span>
                            <div className="min-w-0">
                              <div className="text-[14px] font-bold leading-tight">{f.label}</div>
                              <div className="text-[11px] text-[#94a3b8] mt-0.5 truncate">{f.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* TEAM / BUDDIES SECTION */}
                  <div className="px-3 flex-1 overflow-y-auto min-h-[120px]">
                    <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.14em] block px-2 mb-3 select-none">Team</span>
                    <div className="flex flex-col gap-1">
                      {buddies.map(b => {
                        const status = buddyStatusMap[b.buddyId] || "offline";
                        return (
                          <div key={b.id} className="flex items-center justify-between px-3.5 py-3 rounded-2xl hover:bg-[#f4f6fb]/70 transition-all select-none group/buddy cursor-default">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative shrink-0">
                                <InitialsAvatar name={b.name} seed={b.buddyId} size={32} className="ring-2 ring-white" />
                                <div className="absolute -bottom-0.5 -right-0.5 relative">
                                  <div className={`w-2.5 h-2.5 border-[1.5px] border-white rounded-full absolute -bottom-0.5 -right-0.5 ${status === "online" ? "bg-[#10b981] animate-glow-green" : "bg-[#cbd5e1]"
                                    }`} />
                                </div>
                              </div>
                              <span className="text-[14px] font-medium text-[#475569] truncate group-hover/buddy:text-[#1a1a2e] transition-colors">{b.name}</span>
                            </div>
                          </div>
                        );
                      })}
                      {buddies.length === 0 && (
                        <span className="text-[12px] text-[#94a3b8] px-2 italic select-none">No active buddies.</span>
                      )}
                    </div>
                  </div>

                  {/* User Profile Card */}
                  <div className="p-4 border-t border-[rgba(118,85,251,0.06)] glass-strong shrink-0 flex items-center justify-between select-none">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative">
                        <InitialsAvatar
                          src={(user?.user_metadata as { avatar_url?: string } | null)?.avatar_url}
                          name={(user?.user_metadata as { full_name?: string; name?: string } | null)?.full_name || (user?.user_metadata as { full_name?: string; name?: string } | null)?.name || user?.email || "User"}
                          seed={user?.id}
                          size={40}
                          className="shrink-0 shadow-[0_2px_8px_rgba(118,85,251,0.25)] ring-2 ring-white"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10b981] border-2 border-white rounded-full animate-glow-green" />
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <span className="text-[13px] font-bold text-[#1a1a2e] truncate leading-tight">
                          {user?.email?.split("@")[0] || "User"}
                        </span>
                        <span className="text-[11px] text-[#94a3b8] truncate mt-0.5">
                          {user?.email}
                        </span>
                      </div>
                    </div>
                    <Link href="/settings" className="h-11 w-11 rounded-[16px] hover:bg-[#f0eeff] flex items-center justify-center transition-all text-[#94a3b8] hover:text-[#7655fb] no-underline">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </Link>
                  </div>
                </div>

                {/* COLUMN 2: CONVERSATIONS LIST PANEL */}
                <div
                  className={`w-full border-r border-[rgba(118,85,251,0.06)] bg-gradient-to-b from-[#fbfbff] to-white flex flex-col h-full shrink-0 select-none lg:w-[320px] xl:w-[360px] ${
                    mobilePane === "chat" ? "hidden lg:flex" : "flex"
                  }`}
                >

                  {/* Top header row */}
                  <div className="px-5 py-4 flex items-center justify-between shrink-0 select-none">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMobileNavOpen(true)}
                        className="lg:hidden flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#f4f6fb] text-[#7655fb]"
                        aria-label="Open menu"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 6h16M4 12h16M4 18h16"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>

                      <div className="flex items-center gap-1.5 cursor-pointer hover:bg-[#f0eeff]/50 px-2 py-2 rounded-xl transition-all">
                        <span className="font-extrabold text-[18px] text-[#1a1a2e]">
                        {activeTab === "connections" ? "Connections" : activeTab === "meetings" ? "Meetings" : activeTab === "chats" ? "Chats" : "Groups"}
                        </span>
                        <svg className="w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button disabled className="h-11 w-11 rounded-[16px] flex items-center justify-center transition-all bg-transparent border-none cursor-not-allowed text-[#94a3b8] opacity-50">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </button>
                      <button disabled className="h-11 w-11 rounded-[16px] flex items-center justify-center transition-all bg-transparent border-none cursor-not-allowed text-[#94a3b8] opacity-50">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
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
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.14em]">
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
                            <label className="text-[10px] font-bold text-[#8f8e98] uppercase">Group Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Health Referees"
                              value={newGroupName}
                              onChange={(e) => setNewGroupName(e.target.value)}
                              className="px-3 py-2 rounded-[10px] border border-[#e4e8f2] bg-white text-[13px] focus:outline-none focus:border-[#7655fb]"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-[#8f8e98] uppercase">Add Buddies</label>
                            <div className="max-h-[120px] overflow-y-auto flex flex-col gap-1 border border-[#e4e8f2] rounded-[10px] p-2 bg-white">
                              {buddies.map(b => (
                                <label key={b.buddyId} className="flex items-center gap-2 text-[13px] font-semibold text-[#262525] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedGroupMembers.includes(b.buddyId)}
                                    onChange={() => handleGroupMembersToggle(b.buddyId)}
                                    className="rounded text-[#7655fb] focus:ring-[#7655fb] w-4 h-4"
                                  />
                                  {b.name}
                                </label>
                              ))}
                            </div>
                          </div>
                          {groupCreateError && (
                            <p className="text-[11px] text-red-500 font-semibold">{groupCreateError}</p>
                          )}
                          <button
                            type="submit"
                            disabled={isSubmittingGroup}
                            className="bg-[#7655fb] hover:bg-[#6445e0] text-white py-2 rounded-[10px] text-[13px] font-bold cursor-pointer disabled:opacity-50 border-none"
                          >
                            {isSubmittingGroup ? "Creating..." : "Create Group"}
                          </button>
                        </form>
                      )}

                      {/* Chat filter/Search input */}
                      <div className="px-4 py-2 shrink-0">
                        <input
                          type="text"
                          placeholder="Filter conversations..."
                          value={sidebarSearchQuery}
                          onChange={(e) => setSidebarSearchQuery(e.target.value)}
                          className="w-full px-4 py-3 bg-[#f4f6fb] border border-transparent rounded-2xl text-[14px] focus:outline-none"
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
                                    setMobilePane("chat");
                                    setChatSearchOpen(false);
                                    setStickerPickerOpen(false);
                                  }}
                                  className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer flex gap-3 items-center select-none hover:-translate-y-px animate-fadeIn ${isActive
                                      ? "bg-gradient-to-br from-white to-[#7655fb]/5 border-[#c0b5ff]/60 shadow-[0_8px_25px_rgba(118,85,251,0.08)] ring-1 ring-[#7655fb]/10 gradient-border"
                                      : "border-[rgba(118,85,251,0.04)] bg-white hover:border-[rgba(118,85,251,0.1)] hover:bg-[#fafaff] hover:shadow-[0_4px_16px_rgba(118,85,251,0.05)]"
                                    }`}
                                >
                                  {conv.type === "group" ? (
                                    <div className="flex -space-x-2.5 overflow-hidden shrink-0 select-none p-0.5">
                                      {(conv.members?.slice(0, 3) || []).map((m, idx) => (
                                        <InitialsAvatar
                                          key={m.id || idx}
                                          src={m.avatar_url}
                                          name={m.full_name || m.username || "Group"}
                                          seed={m.id}
                                          size={36}
                                          className="border-2 border-white shadow-[0_2px_8px_rgba(118,85,251,0.2)]"
                                        />
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="relative shrink-0 select-none">
                                      <InitialsAvatar
                                        src={convAvatar}
                                        name={convName}
                                        seed={partnerId || conv.id}
                                        size={40}
                                        className="shadow-[0_2px_8px_rgba(118,85,251,0.2)] ring-2 ring-white"
                                      />
                                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${status === "online" ? "bg-[#10b981] animate-glow-green" : "bg-[#cbd5e1]"
                                        }`} />
                                    </div>
                                  )}

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-bold text-[#1a1a2e] text-[14px] truncate">
                                        {convName}
                                      </span>
                                      <span className="text-[9px] text-[#94a3b8] shrink-0 font-medium bg-[#f4f6fb] px-1.5 py-0.5 rounded-md">
                                        {lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ""}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1 gap-1">
                                      {isCall ? (
                                        <span className={`text-[12px] truncate flex items-center gap-1 ${isMissed ? "text-red-500 font-bold" : "text-[#94a3b8]"}`}>
                                          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                          {isMissed ? "Missed Call" : "Call ended"}
                                        </span>
                                      ) : (
                                        <p className="text-[12px] text-[#94a3b8] truncate">
                                          {lastMsg ? lastMsg.content : "No messages yet."}
                                        </p>
                                      )}
                                      {hasUnread ? (
                                        <span className="min-w-[18px] h-[18px] rounded-full bg-gradient-to-r from-[#7655fb] to-[#4169e1] shrink-0 flex items-center justify-center text-white text-[8px] font-bold shadow-[0_2px_8px_rgba(118,85,251,0.3)]">
                                          {conv.unread_count}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                </button>
                              );
                            });
                          } else {
                            return (
                              <div className="py-14 border border-dashed border-[rgba(118,85,251,0.08)] rounded-2xl text-center flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#f0eeff] flex items-center justify-center animate-float">
                                  <svg className="w-6 h-6 text-[#7655fb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                </div>
                                <span className="text-[#94a3b8] text-[14px] font-medium">No active chats</span>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </>
                  )}
                </div>

                {/* COLUMN 3: DETAIL / CHAT FEED WINDOW */}
                <div
                  className={`flex-1 bg-white overflow-hidden h-full ${
                    mobilePane === "chat" ? "flex" : "hidden lg:flex"
                  }`}
                >
                  {activeTab === "connections" ? (
                    renderConnectionsRight()
                  ) : activeTab === "meetings" ? (
                    renderMeetingsRight()
                  ) : activeConv && activeConv.type === (activeTab === "chats" ? "dm" : "group") ? (
                    <div className="flex-1 flex overflow-hidden">

                      {/* Chat Messages and Input View */}
                      <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#fafaff] h-full">

                        {/* Header details */}
                        <div className="px-5 py-4 border-b border-[rgba(118,85,251,0.06)] glass-strong flex items-center justify-between shrink-0 select-none">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 lg:hidden">
                              <button
                                type="button"
                                onClick={() => setMobileNavOpen(true)}
                                className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#f4f6fb] text-[#7655fb]"
                                aria-label="Open menu"
                              >
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M4 6h16M4 12h16M4 18h16"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => setMobilePane("list")}
                                className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#f4f6fb] text-[#262525]"
                                aria-label="Back to list"
                              >
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M15 18L9 12L15 6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            </div>
                            {activeConv.type === "group" ? (
                              <div className="flex -space-x-2.5 overflow-hidden shrink-0">
                                {(activeConv.members?.slice(0, 3) || []).map((m, idx) => (
                                  <InitialsAvatar
                                    key={m.id || idx}
                                    src={m.avatar_url}
                                    name={m.full_name || m.username || "Group"}
                                    seed={m.id}
                                    size={36}
                                    className="border-2 border-white shadow-[0_2px_8px_rgba(118,85,251,0.2)]"
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="relative">
                                <InitialsAvatar
                                  src={activeConv.members?.find(m => m.id !== user?.id)?.avatar_url}
                                  name={activeConv.members?.find(m => m.id !== user?.id)?.full_name || activeConv.members?.find(m => m.id !== user?.id)?.username || activeConv.name || "Chat"}
                                  seed={activeConv.members?.find(m => m.id !== user?.id)?.id || activeConv.id}
                                  size={40}
                                  className="shadow-[0_2px_8px_rgba(118,85,251,0.2)] ring-2 ring-white"
                                />
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10b981] border-2 border-white rounded-full animate-glow-green" />
                              </div>
                            )}
                            <div>
                              <h4 className="font-extrabold text-[#1a1a2e] text-[16px] tracking-tight">
                                {activeConv.type === "dm"
                                  ? activeConv.members?.find(m => m.id !== user?.id)?.full_name || "Partner Chat"
                                  : activeConv.name}
                              </h4>
                              <p className="text-[12px] text-[#94a3b8] font-medium mt-0.5 flex items-center gap-1">
                                {activeConv.type === "dm" ? (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] inline-block" />
                                    Direct Message
                                  </>
                                ) : `${activeConv.members?.length || 0} members`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Inline add member for group chats */}
                            {activeConv.type === "group" && (
                              <div className="relative">
                                <button
                                  onClick={() => {
                                    setIsAddingMember(!isAddingMember);
                                    setAddMemberSuccess(null);
                                    setAddMemberError(null);
                                  }}
                                  className="text-[#7655fb] hover:text-[#6445e0] text-[11px] font-bold bg-[#7655fb]/5 hover:bg-[#7655fb]/10 px-3 py-1.5 rounded-xl transition-all cursor-pointer border border-[#7655fb]/10"
                                >
                                  {isAddingMember ? "Close" : "+ Add"}
                                </button>

                                {isAddingMember && (
                                  <div className="absolute right-0 top-full mt-2 w-72 glass-strong p-4 rounded-2xl shadow-[0_12px_36px_rgba(24,33,77,0.12)] z-30 animate-slideUp">
                                    <h5 className="font-bold text-[12px] text-[#1a1a2e] mb-2">Enroll Buddy</h5>
                                    <form onSubmit={handleAddMember} className="flex flex-col gap-2">
                                      <input
                                        type="text"
                                        placeholder="Type username..."
                                        required
                                        value={addMemberInput}
                                        onChange={(e) => setAddMemberInput(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-[rgba(118,85,251,0.1)] text-[12px] focus:outline-none focus:border-[#7655fb]/30 focus:shadow-[0_0_0_3px_rgba(118,85,251,0.06)] transition-all bg-white"
                                      />
                                      {addMemberError && (
                                        <p className="text-[10px] text-red-500 font-semibold">{addMemberError}</p>
                                      )}
                                      {addMemberSuccess && (
                                        <p className="text-[10px] text-[#10b981] font-semibold">{addMemberSuccess}</p>
                                      )}
                                      <button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-[#4169e1] to-[#7655fb] hover:shadow-[0_4px_16px_rgba(118,85,251,0.3)] text-white py-2 rounded-xl text-[11px] font-bold cursor-pointer border-none transition-all"
                                      >
                                        Add to Group
                                      </button>
                                    </form>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Action Icons */}
                            <button className="w-9 h-9 rounded-xl hover:bg-[#f0eeff] flex items-center justify-center transition-all text-[#94a3b8] hover:text-[#7655fb] bg-transparent border-none cursor-pointer">
                              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            </button>
                            <button className="w-9 h-9 rounded-xl hover:bg-[#f0eeff] flex items-center justify-center transition-all text-[#94a3b8] hover:text-[#7655fb] bg-transparent border-none cursor-pointer">
                              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setChatSearchOpen(!chatSearchOpen)}
                              className={`w-9 h-9 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${chatSearchOpen ? "border-[#7655fb]/30 text-[#7655fb] bg-[#f0eeff]" : "border-transparent text-[#94a3b8] hover:text-[#7655fb] hover:bg-[#f0eeff] bg-transparent"
                                }`}
                              title="Search Messages"
                            >
                              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Messages Area Feed */}
                        <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 bg-white noise-bg">
                          {messages.map((msg, index) => {
                            const isMe = msg.sender_id === user.id;
                            const hasFailed = msg.is_failed;
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
                                    <div className="px-4 py-1.5 rounded-xl bg-[#f8f7ff] border border-[rgba(118,85,251,0.06)] text-[#94a3b8] text-[10px] font-semibold text-center max-w-[85%]">
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
                                    <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgba(118,85,251,0.08)] to-transparent" />
                                    <span className="relative text-[9px] font-bold uppercase tracking-wider text-[#94a3b8] bg-white px-3 py-0.5 rounded-full border border-[rgba(118,85,251,0.06)]">
                                      {headerLabel}
                                    </span>
                                  </div>
                                )}

                                <div className={`flex gap-3 group relative max-w-[75%] animate-slideUp ${isMe ? "self-end flex-row-reverse" : "self-start"}`}>

                                  {/* User avatar */}
                                  <InitialsAvatar
                                    src={
                                      isMe
                                        ? ((user?.user_metadata as { avatar_url?: string } | null)?.avatar_url ?? null)
                                        : (msg.sender?.avatar_url ?? null)
                                    }
                                    name={
                                      isMe
                                        ? ((user?.user_metadata as { full_name?: string; name?: string } | null)?.full_name ||
                                          (user?.user_metadata as { full_name?: string; name?: string } | null)?.name ||
                                          user?.email ||
                                          "You")
                                        : (msg.sender?.full_name || msg.sender?.username || "Partner")
                                    }
                                    seed={isMe ? user?.id : msg.sender_id}
                                    size={32}
                                    className="shrink-0 select-none shadow-[0_2px_8px_rgba(118,85,251,0.15)] ring-2 ring-white"
                                  />

                                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                    {/* Sender Header */}
                                    <span className="text-[10px] text-[#94a3b8] font-semibold mb-1 ml-1 select-none">
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
                                        /* Speech bubble */
                                        <div
                                          className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed relative transition-all duration-200 ${isMe
                                              ? "bg-gradient-to-br from-[#7655fb] to-[#4169e1] text-white shadow-[0_4px_16px_rgba(118,85,251,0.2)]"
                                              : "bg-[#f4f6fb] text-[#1a1a2e] border border-[rgba(118,85,251,0.04)]"
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
                            <div key={tId} className="flex gap-2.5 items-center text-[#94a3b8] text-[10px] pl-2 select-none animate-fadeIn">
                              <div className="flex gap-1 items-center">
                                <span className="typing-dot" />
                                <span className="typing-dot" />
                                <span className="typing-dot" />
                              </div>
                              <span className="font-medium">{tName} is typing...</span>
                            </div>
                          ))}
                          <div ref={chatBottomRef} />
                        </div>

                        {/* Reply indicator */}
                        {replyParentMsg && (
                          <div className="px-5 py-2 bg-[#f8f7ff] border-t border-[rgba(118,85,251,0.06)] flex items-center justify-between shrink-0 select-none">
                            <div className="border-l-3 border-[#7655fb] pl-2">
                              <span className="text-[10px] font-bold text-[#7655fb]">Replying to msg</span>
                              <p className="text-[11px] text-gray-500 truncate max-w-[400px] mt-0.5">{replyParentMsg.content}</p>
                            </div>
                            <button onClick={() => setReplyParentMsg(null)} className="text-gray-400 hover:text-gray-600 text-[10px] border-none bg-transparent cursor-pointer">✕</button>
                          </div>
                        )}

                        {/* Message Send Input form */}
                        <form onSubmit={handleSendMessage} className="px-5 py-3 border-t border-[rgba(118,85,251,0.06)] glass-strong flex items-center gap-3 shrink-0">
                          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

                          {/* Attach button */}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAttachment}
                            className="w-[42px] h-[42px] rounded-xl bg-gradient-to-br from-[#7655fb]/10 to-[#4169e1]/5 text-[#7655fb] hover:from-[#7655fb]/20 hover:to-[#4169e1]/10 flex items-center justify-center border-none cursor-pointer shrink-0 shadow-sm transition-all hover:scale-105 active:scale-95"
                            title="Attach File"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          </button>

                          {/* Input field wrapper */}
                          <div className="flex-1 relative flex items-center bg-[#f4f6fb] rounded-2xl px-4 border border-transparent focus-within:bg-white focus-within:border-[#7655fb]/20 focus-within:shadow-[0_0_0_3px_rgba(118,85,251,0.06)] transition-all">
                            <input
                              type="text"
                              placeholder="Write a message..."
                              value={messageInput}
                              onChange={handleInputChange}
                              className="flex-1 h-[44px] bg-transparent border-none outline-none text-[13px] pr-28 text-[#1a1a2e] focus:ring-0 placeholder:text-[#b0b5c3]"
                            />

                            {/* Action shortcuts */}
                            <div className="absolute right-2.5 flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setStickerPickerOpen(!stickerPickerOpen)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none cursor-pointer transition-all hover:bg-[#f0eeff] ${stickerPickerOpen ? "text-[#7655fb]" : "text-[#94a3b8] hover:text-[#7655fb]"
                                  }`}
                                title="Emojis"
                              >
                                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94a3b8] hover:text-[#7655fb] hover:bg-[#f0eeff] bg-transparent border-none cursor-pointer transition-all"
                                title="Attach File"
                              >
                                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94a3b8] hover:text-[#7655fb] hover:bg-[#f0eeff] bg-transparent border-none cursor-pointer transition-all"
                                title="Schedule"
                              >
                                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              <button
                                type="submit"
                                className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#4169e1] to-[#7655fb] text-white flex items-center justify-center shrink-0 border-none cursor-pointer shadow-[0_4px_16px_rgba(118,85,251,0.3)] hover:shadow-[0_6px_20px_rgba(118,85,251,0.4)] hover:scale-105 active:scale-95 transition-all"
                                title="Send"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
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
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none bg-gradient-to-br from-[#fafaff] to-white">
                      <div className="h-16 w-16 bg-gradient-to-br from-[#f0eeff] to-[#e8e0ff] rounded-2xl flex items-center justify-center text-[#7655fb] mb-5 shadow-[0_8px_24px_rgba(118,85,251,0.1)] animate-float">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h4 className="font-extrabold text-[#1a1a2e] text-[16px] tracking-tight">
                        Select a {activeTab === "chats" ? "direct chat" : "group chat"}
                      </h4>
                      <p className="text-[12px] text-[#94a3b8] mt-2 max-w-[280px] leading-relaxed">
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

      <Footer showCommunities={false} />
    </main>
  );
}
