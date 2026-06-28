"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Session {
  id: string;
  title: string;
  is_pinned: boolean;
  is_bookmarked: boolean;
  created_at: string;
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  content: string;
  message_type: "text" | "voice" | "file" | "image" | "sticker";
  attachment_url?: string;
  attachment_name?: string;
  reactions: Record<string, string[]>;
  is_bookmarked: boolean;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  priority: "low" | "medium" | "high";
}

interface Goal {
  id: string;
  title: string;
  category: string;
  progress: number;
  streak: number;
}

const parseInlineMarkdown = (text: string) => {
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const splitParts = text.split(regex);

  return splitParts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-bold text-[#262525]">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index} className="bg-gray-100/85 px-1 py-0.5 rounded text-[11px] font-mono text-pink-600">{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

const renderMarkdown = (text: string) => {
  const lines = text.split("\n");
  return lines.map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={index} className="h-2" />;

    // Headers
    if (line.startsWith("#### ")) {
      return <h6 key={index} className="text-[12px] font-bold text-[#262525] mt-2 mb-1 font-secondary">{parseInlineMarkdown(line.substring(5))}</h6>;
    }
    if (line.startsWith("### ")) {
      return <h5 key={index} className="text-[13px] font-bold text-[#262525] mt-3 mb-1 font-secondary">{parseInlineMarkdown(line.substring(4))}</h5>;
    }
    if (line.startsWith("## ")) {
      return <h4 key={index} className="text-[14px] font-bold text-[#262525] mt-4 mb-1.5 font-secondary">{parseInlineMarkdown(line.substring(3))}</h4>;
    }
    if (line.startsWith("# ")) {
      return <h3 key={index} className="text-[15px] font-bold text-[#262525] mt-5 mb-2 font-secondary">{parseInlineMarkdown(line.substring(2))}</h3>;
    }

    // Checklists
    if (line.startsWith("- [ ] ") || line.startsWith("- [x] ")) {
      const checked = line.startsWith("- [x] ");
      return (
        <div key={index} className="flex items-start gap-2 my-1 text-[13px] text-gray-700 font-secondary">
          <input type="checkbox" checked={checked} readOnly className="mt-1 h-3.5 w-3.5 rounded border-gray-300 text-[#7655fb]" />
          <span>{parseInlineMarkdown(line.substring(6))}</span>
        </div>
      );
    }

    // Bullet lists
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return (
        <li key={index} className="ml-4 list-disc text-[13px] text-gray-700 my-0.5 font-secondary">
          {parseInlineMarkdown(line.substring(2))}
        </li>
      );
    }

    // Numbered lists
    const numMatch = line.match(/^(\d+)\.\s(.*)/);
    if (numMatch) {
      return (
        <div key={index} className="ml-4 text-[13px] text-gray-700 my-0.5 font-secondary">
          <span className="font-bold mr-1">{numMatch[1]}.</span>
          {parseInlineMarkdown(numMatch[2])}
        </div>
      );
    }

    return (
      <p key={index} className="text-[13px] text-gray-700 leading-relaxed my-1 font-secondary">
        {parseInlineMarkdown(line)}
      </p>
    );
  });
};

export default function CrushITAI() {
  const [user, setUser] = useState<any>(null);
  
  // Panel States
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "tasks" | "history" | "settings">("chat");

  // Chat Data States
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  
  // Preferences
  const [motivationStyle, setMotivationStyle] = useState<string>("supportive");
  const [preferredHours, setPreferredHours] = useState<string>("");
  
  // UI states
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [hasUnread, setHasUnread] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);
  const [showTooltip, setShowTooltip] = useState(true);
  const [customTaskTitle, setCustomTaskTitle] = useState("");
  const [dbError, setDbError] = useState<string | null>(null);
  
  // Resize Position States
  const [panelSize, setPanelSize] = useState({ width: 380, height: 550 });
  const [isResizing, setIsResizing] = useState(false);
  
  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Refs
  const resizeStartRef = useRef({ startWidth: 380, startHeight: 550, startClientX: 0, startClientY: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Auth
  useEffect(() => {
    const supabase = createClient();
    
    const fetchUser = async () => {
      try {
        const { data: { user: u } } = await supabase.auth.getUser();
        setUser(u);
      } catch (err) {
        console.error("Failed to load session:", err);
      }
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    // Load persisted sizes
    const savedSize = localStorage.getItem("crushit_panel_size");
    if (savedSize) {
      try { setPanelSize(JSON.parse(savedSize)); } catch {}
    }
    const savedOpenState = localStorage.getItem("crushit_open_state");
    if (savedOpenState === "true") {
      setIsOpen(true);
    }
    const savedMinState = localStorage.getItem("crushit_min_state");
    if (savedMinState === "true") {
      setIsMinimized(true);
    }

    // Hide tooltip after 8 seconds
    const timer = setTimeout(() => setShowTooltip(false), 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // Fetch Base Data on Login
  useEffect(() => {
    if (!user) return;
    
    const loadBaseData = async () => {
      try {
        const res = await fetch("/api/ai-chat");
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions || []);
          setTasks(data.tasks || []);
          setGoals(data.goals || []);
          setDbError(null);
          
          if (data.sessions && data.sessions.length > 0) {
            const lastSessionId = localStorage.getItem("crushit_active_session");
            const exists = data.sessions.some((s: Session) => s.id === lastSessionId);
            const initialId = exists ? (lastSessionId as string) : data.sessions[0].id;
            setActiveSessionId(initialId);
          } else {
            // Auto-create a session if none exists
            handleCreateSession("General Coaching");
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          setDbError(errData.error || "Database tables missing. Please run the SQL migration in your Supabase SQL Editor.");
        }

        // Load preferences
        const prefRes = await fetch("/api/ai-chat?action=preferences");
        if (prefRes.ok) {
          const prefData = await prefRes.json();
          setMotivationStyle(prefData.motivation_style || "supportive");
          setPreferredHours(prefData.preferred_hours || "");
        }
      } catch (err) {
        console.error("Failed to load initial CrushIT context:", err);
        setDbError("Database tables missing. Please run the SQL migration in your Supabase SQL Editor.");
      }
    };
    loadBaseData();
  }, [user]);

  // Load Messages for Active Session
  useEffect(() => {
    if (!activeSessionId) return;
    localStorage.setItem("crushit_active_session", activeSessionId);

    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/ai-chat?action=messages&sessionId=${activeSessionId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data || []);
        }
      } catch (err) {
        console.error("Failed to load session messages:", err);
      }
    };
    loadMessages();
  }, [activeSessionId]);

  // Auto Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamText, isStreaming, isOpen, activeTab]);

  // Create Chat Session
  const handleCreateSession = async (title: string) => {
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_session", sessionTitle: title })
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(prev => [data.session, ...prev]);
        setActiveSessionId(data.session.id);
        setDbError(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        setDbError(errData.error || "Database tables missing. Please run the SQL migration in your Supabase SQL Editor.");
      }
    } catch (err) {
      console.error("Failed to create session:", err);
      setDbError("Database tables missing. Please run the SQL migration in your Supabase SQL Editor.");
    }
  };

  // Toggle Pin Session
  const handleTogglePin = async (id: string) => {
    try {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, is_pinned: !s.is_pinned } : s));
      await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pin_session", sessionId: id })
      });
    } catch (err) {
      console.error("Failed to pin session:", err);
    }
  };

  // Delete Session
  const handleDeleteSession = async (id: string) => {
    if (!confirm("Are you sure you want to delete this chat room?")) return;
    try {
      setSessions(prev => prev.filter(s => s.id !== id));
      if (activeSessionId === id) {
        setActiveSessionId("");
      }
      await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_session", sessionId: id })
      });
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  // Tasks Operations
  const handleToggleTask = async (id: string) => {
    try {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: !t.is_completed } : t));
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_task", taskId: id })
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== id));
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_task", taskId: id })
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const handleAddCustomTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTaskTitle.trim()) return;

    const title = customTaskTitle;
    setCustomTaskTitle("");

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_task", taskTitle: title, priority: "medium" })
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to add task:", err);
    }
  };

  // Clear completed tasks
  const handleClearCompletedTasks = async () => {
    try {
      setTasks(prev => prev.filter(t => !t.is_completed));
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_completed_tasks" })
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to clear completed tasks:", err);
    }
  };

  // Update Preferences
  const handleUpdatePreferences = async (style: string, hours: string) => {
    setMotivationStyle(style);
    setPreferredHours(hours);
    try {
      await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_preferences",
          motivationStyle: style,
          preferredHours: hours
        })
      });
    } catch (err) {
      console.error("Failed to update preferences:", err);
    }
  };

  // Message Reactions
  const handleAddReaction = async (msgId: string, emoji: string) => {
    try {
      setMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          const reac = { ...m.reactions };
          const uids = reac[emoji] || [];
          const nextUids = uids.includes(user.id) 
            ? uids.filter(id => id !== user.id) 
            : [...uids, user.id];
          
          if (nextUids.length === 0) {
            delete reac[emoji];
          } else {
            reac[emoji] = nextUids;
          }
          return { ...m, reactions: reac };
        }
        return m;
      }));

      await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_reaction", messageId: msgId, reactionEmoji: emoji })
      });
    } catch (err) {
      console.error("Failed to react to message:", err);
    }
  };

  // Toggle Message Bookmark
  const handleToggleMessageBookmark = async (msgId: string) => {
    try {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_bookmarked: !m.is_bookmarked } : m));
      await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_message_bookmark", messageId: msgId })
      });
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
    }
  };

  // Send Streaming message to Gemini
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isStreaming || !activeSessionId) return;

    if (!textToSend) setInputValue("");
    setIsStreaming(true);
    setStreamText("");
    setIsPulsing(false);

    // Optimistically add user text
    const tempUserMsg: Message = {
      id: `temp-usr-${Date.now()}`,
      sender: "user",
      content: text,
      message_type: "text",
      reactions: {},
      is_bookmarked: false,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const response = await fetch("/api/ai-chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: activeSessionId })
      });

      if (!response.ok) throw new Error("Connection failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let completedText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") {
                // Done streaming
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  completedText += parsed.text;
                  setStreamText(completedText);
                }
              } catch {}
            }
          }
        }
      }

      // Reload messages & tasks to ensure absolute sync with backend commands
      const syncMsgRes = await fetch(`/api/ai-chat?action=messages&sessionId=${activeSessionId}`);
      if (syncMsgRes.ok) {
        const syncData = await syncMsgRes.json();
        setMessages(syncData || []);
      }

      const syncTasksRes = await fetch("/api/ai-chat");
      if (syncTasksRes.ok) {
        const syncData = await syncTasksRes.json();
        setTasks(syncData.tasks || []);
        setGoals(syncData.goals || []);
      }

    } catch (err) {
      console.error("CrushIT AI Stream Error:", err);
      // Fallback
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        sender: "assistant",
        content: "Sorry, I ran into an error connecting to the brain. Please try again.",
        message_type: "text",
        reactions: {},
        is_bookmarked: false,
        created_at: new Date().toISOString()
      }]);
    } finally {
      setIsStreaming(false);
      setStreamText("");
    }
  };

  // Resize Handlers for Chat Panel
  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = {
      startWidth: panelSize.width,
      startHeight: panelSize.height,
      startClientX: e.clientX,
      startClientY: e.clientY
    };
    document.body.style.cursor = "nwse-resize";
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isResizing) return;
      const dx = resizeStartRef.current.startClientX - e.clientX;
      const dy = resizeStartRef.current.startClientY - e.clientY;

      const newWidth = Math.max(280, Math.min(600, resizeStartRef.current.startWidth + dx));
      const newHeight = Math.max(350, Math.min(800, resizeStartRef.current.startHeight + dy));

      setPanelSize({ width: newWidth, height: newHeight });
    };

    const handlePointerUp = () => {
      if (isResizing) {
        setIsResizing(false);
        document.body.style.cursor = "";
        localStorage.setItem("crushit_panel_size", JSON.stringify(panelSize));
      }
    };

    if (isResizing) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    }
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isResizing, panelSize]);

  // Voice recording & transcription
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Mocking translation to prompt
        handleSendMessage("I just completed a 30 minute cardio workout session. Keep me motivated!");
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Audio recording permission failed:", err);
      alert("Microphone access is required for voice coaching!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // Mock File Drag and Drop attachment saving
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && activeSessionId) {
      handleSaveAttachment(file.name);
    }
  };

  const handleSaveAttachment = async (name: string) => {
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_attachment",
          sessionId: activeSessionId,
          fileUrl: "/mock-storage/attachment.png",
          fileName: name,
          messageType: "file"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
      }
    } catch (err) {
      console.error("Failed to upload file:", err);
    }
  };

  // Text playback
  const handleVoicePlayback = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Render user auth prompt block if logged out
  if (!user) {
    return (
      <>
        {/* Floating Button for Logged Out User */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setShowTooltip(false);
          }}
          className="fixed z-[9999] flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gradient-to-br from-[#7655fb] to-[#603fe6] text-white shadow-[0_12px_28px_rgba(118,85,251,0.35)] transition-all duration-300 hover:scale-110 cursor-pointer border border-white/10 hover:shadow-[0_16px_36px_rgba(118,85,251,0.5)] right-[20px] sm:right-[30px] bottom-[20px] sm:bottom-[30px]"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="9" y="4" width="6" height="10" rx="3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 10c0 3.866 3.134 7 7 7s7-3.134 7-7M12 17v4M8 21h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 2l.5 1.5L21 4l-1.5.5L19 6l-.5-1.5L17 4l1.5-.5L19 2z" fill="currentColor"/>
          </svg>
        </button>

        {isOpen && (
          <div 
            className="fixed right-[20px] bottom-[90px] w-[320px] bg-white/80 backdrop-blur-xl rounded-[24px] shadow-[0_20px_50px_rgba(118,85,251,0.15)] border border-[#7655fb]/15 p-6 flex flex-col items-center text-center gap-4 z-[10000] animate-in fade-in slide-in-from-bottom-5 duration-300"
          >
            <div className="w-12 h-12 rounded-full bg-[#7655fb]/10 flex items-center justify-center text-[#7655fb] border border-[#7655fb]/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v4" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-[16px] text-[#262525] font-secondary">Meet CrushIT AI</h4>
              <p className="text-[12px] text-gray-500 mt-1.5 leading-relaxed font-secondary">
                Ready to crush your goals? Sign in to unlock your personal accountability coach and track daily subtasks.
              </p>
            </div>
            <a href="/login" className="w-full">
              <button className="w-full h-[42px] bg-gradient-to-r from-[#7655fb] to-[#603fe6] hover:scale-[1.02] text-white rounded-full text-[13px] font-bold transition-all cursor-pointer font-secondary shadow-md hover:shadow-lg">
                Log In
              </button>
            </a>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Tooltip on Hover */}
      {showTooltip && !isOpen && (
        <div 
          className="fixed z-[9998] bg-gradient-to-r from-[#7655fb] to-[#603fe6] text-white text-[12px] font-bold font-secondary py-2.5 px-4.5 rounded-[16px] shadow-[0_10px_25px_rgba(118,85,251,0.25)] animate-bounce pointer-events-none border border-white/10 right-[90px] sm:right-[100px] bottom-[30px]"
        >
          💬 Need help planning goals? Ask CrushIT AI!
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          localStorage.setItem("crushit_open_state", String(!isOpen));
        }}
        className={`fixed z-[9999] flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gradient-to-br from-[#7655fb] to-[#603fe6] text-white shadow-[0_12px_28px_rgba(118,85,251,0.35)] transition-all duration-300 hover:scale-110 hover:shadow-[0_16px_36px_rgba(118,85,251,0.5)] border border-white/10 right-[20px] sm:right-[30px] bottom-[20px] sm:bottom-[30px] cursor-pointer focus:outline-none ${
          isPulsing && !isOpen ? "animate-pulse" : ""
        }`}
        title="CrushIT AI Coach"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <div className="relative">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="9" y="4" width="6" height="10" rx="3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 10c0 3.866 3.134 7 7 7s7-3.134 7-7M12 17v4M8 21h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 2l.5 1.5L21 4l-1.5.5L19 6l-.5-1.5L17 4l1.5-.5L19 2z" fill="currentColor"/>
              <path d="M22 6l.25.75L23 7l-.75.25L22 8l-.25-.75L21 7l.75-.25L22 6z" fill="currentColor"/>
            </svg>
            {hasUnread && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white border-2 border-[#7655fb]">
                !
              </span>
            )}
          </div>
        )}
      </button>

      {/* Main Chat Panel */}
      {isOpen && !isMinimized && (
        <div 
          className="fixed bg-white/85 backdrop-blur-2xl rounded-[24px] shadow-[0_24px_60px_rgba(118,85,251,0.18)] border border-[#7655fb]/15 flex flex-col z-[10000] overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 right-[20px] sm:right-[30px]"
          style={{
            bottom: "90px",
            width: `calc(min(${panelSize.width}px, 100vw - 40px))`,
            height: `calc(min(${panelSize.height}px, 100vh - 120px))`
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
        >
          {/* Top Resize Handle Border Indicator */}
          <div 
            onPointerDown={handleResizePointerDown}
            className="absolute left-0 top-0 w-6 h-6 cursor-nwse-resize z-50 flex items-center justify-center text-gray-300 hover:text-[#7655fb] transition-colors"
            title="Drag to resize panel"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <path d="M1 9L9 1M1 5L5 1M1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Header Panel with Premium Gradient */}
          <div className="p-4 bg-gradient-to-r from-[#7655fb] via-[#6543ea] to-[#4169e1] text-white flex flex-col gap-3 shrink-0 shadow-md">
            <div className="flex items-center justify-between pl-4">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/10 shrink-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <circle cx="12" cy="5" r="2" />
                    <path d="M12 7v4M8 15h.01M16 15h.01" />
                  </svg>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-[#7655fb] animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-[14px] leading-tight font-secondary">CrushIT AI</h4>
                  <p className="text-[11px] text-white/75 font-secondary">Accountability Partner</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors cursor-pointer"
                  title="Minimize Coach"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors cursor-pointer"
                  title="Close Assistant"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Menu Tab Selector Navigation */}
            <div className="flex bg-black/15 p-1 rounded-lg text-[12px] font-bold font-secondary">
              {[
                { tab: "chat", name: "Coaching" },
                { tab: "tasks", name: "Checklists" },
                { tab: "history", name: "History" },
                { tab: "settings", name: "Setup" }
              ].map((item) => (
                <button
                  key={item.tab}
                  onClick={() => setActiveTab(item.tab as any)}
                  className={`flex-1 py-1.5 rounded-md text-center transition-colors cursor-pointer ${
                    activeTab === item.tab ? "bg-white text-[#7655fb] shadow-sm" : "text-white/80 hover:text-white"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-hidden flex flex-col bg-[#fcfcfd]">
            {activeTab === "chat" && (
              <>
                {/* Active Goals micro widgets bar */}
                {goals.length > 0 && (
                  <div className="bg-white border-b border-[#edf1f7] px-4 py-2 shrink-0 flex items-center gap-2 overflow-x-auto">
                    <span className="text-[10px] font-bold text-gray-400 font-secondary shrink-0">STREAKS:</span>
                    {goals.map(g => (
                      <div key={g.id} className="flex items-center gap-1.5 bg-[#f5f3ff] border border-[#dcd6ff] rounded-full px-2.5 py-0.8 shrink-0 text-[10px] font-bold text-[#7655fb] font-secondary">
                        <span>{g.title}</span>
                        <span className="bg-[#7655fb] text-white px-1.5 py-0.2 rounded-full text-[8px]">{g.streak}d 🔥</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Messages Streams */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">
                  {dbError ? (
                    <div className="my-auto text-center px-6 flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20 shadow-sm animate-pulse">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      </div>
                      <div>
                        <h5 className="font-bold text-[#262525] text-[15px] font-secondary">Database Tables Missing</h5>
                        <p className="text-[12px] text-gray-500 mt-1.5 leading-relaxed font-secondary">
                          The remote database is missing the CrushIT AI schema tables. Please execute the SQL migration in your <strong>Supabase Dashboard SQL Editor</strong>.
                        </p>
                        <div className="mt-3 p-3 bg-gray-50 border border-gray-100 rounded-[12px] text-left text-[11px] font-mono text-gray-600 break-all select-all cursor-pointer hover:bg-gray-100/70" title="Click to copy command">
                          npx supabase db push
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 font-secondary">
                          Or copy the SQL code from <code className="bg-gray-100 px-1 py-0.5 rounded text-[9.5px]">supabase/migrations/20260627_create_ai_chat.sql</code>.
                        </p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="my-auto text-center px-6 flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-[#7655fb]/10 flex items-center justify-center text-[#7655fb]">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M12 2a10 10 0 0 1 10 10v7a3 3 0 0 1-3 3h-7A10 10 0 0 1 2 12a10 10 0 0 1 10-10z" />
                        </svg>
                      </div>
                      <div>
                        <h5 className="font-bold text-[#262525] text-[15px] font-secondary">Welcome to CrushIT AI!</h5>
                        <p className="text-[12px] text-gray-500 mt-1.5 leading-relaxed font-secondary">
                          I am your productivity coach. Drop in a file, ask me to plan a roadmap, schedule Pomodoro blocks, or motivate your habits.
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isUser = msg.sender === "user";
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-[85%] ${isUser ? "self-end items-end" : "self-start items-start"}`}
                        >
                          {/* Message bubble */}
                          <div
                            className={`px-4 py-2.5 text-[13px] leading-relaxed shadow-sm group relative rounded-[20px] font-secondary ${
                              isUser
                                ? "bg-gradient-to-br from-[#7655fb] to-[#603fe6] text-white shadow-md rounded-tr-[4px]"
                                : "bg-white/95 border border-[#7655fb]/8 text-[#262525] shadow-sm rounded-tl-[4px]"
                            }`}
                          >
                            {/* Markdown text representation */}
                            <div className="flex flex-col gap-0.5">{renderMarkdown(msg.content)}</div>

                            {/* Voice playback action */}
                            {!isUser && (
                              <button
                                onClick={() => handleVoicePlayback(msg.content)}
                                className="absolute -right-7 top-1 text-gray-400 hover:text-[#7655fb] p-1 rounded transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
                                title="Listen voice reading"
                              >
                                🔊
                              </button>
                            )}

                            {/* Bookmark / Reactions Panel */}
                            <div className="flex gap-1.5 mt-2 flex-wrap items-center">
                              <button
                                onClick={() => handleToggleMessageBookmark(msg.id)}
                                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                                  msg.is_bookmarked
                                    ? "bg-yellow-50 border-yellow-200 text-yellow-600 font-bold"
                                    : "bg-gray-50 border-gray-100 text-gray-400 hover:text-gray-600"
                                }`}
                              >
                                {msg.is_bookmarked ? "★ Pinned" : "★ Pin"}
                              </button>

                              {/* Reactions display list */}
                              {Object.entries(msg.reactions || {}).map(([emoji, uids]) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleAddReaction(msg.id, emoji)}
                                  className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all cursor-pointer ${
                                    uids.includes(user.id)
                                      ? "bg-purple-50 border-purple-200 text-[#7655fb] font-bold"
                                      : "bg-gray-50 border-gray-100 text-gray-500"
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  <span>{uids.length}</span>
                                </button>
                              ))}

                              {/* Add reaction toggle */}
                              <button
                                onClick={() => handleAddReaction(msg.id, "👍")}
                                className="text-[10px] px-1.5 py-0.5 rounded-full border bg-gray-50 border-gray-100 text-gray-400 hover:text-gray-600 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                              >
                                + 👍
                              </button>
                            </div>
                          </div>
                          <span className="text-[9px] text-gray-400 mt-1 px-1 font-secondary">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}

                  {/* Streaming SSE indicator */}
                  {isStreaming && (
                    <div className="self-start flex flex-col max-w-[85%] items-start">
                      <div className="px-4 py-2.5 text-[13px] leading-relaxed shadow-sm bg-white/95 border border-[#7655fb]/8 text-[#262525] rounded-[20px] rounded-tl-[4px] font-secondary">
                        <div className="flex flex-col gap-0.5">{renderMarkdown(streamText)}</div>
                        <div className="flex gap-1.5 mt-2 items-center">
                          <div className="h-1.5 w-1.5 bg-[#7655fb] rounded-full animate-bounce" />
                          <div className="h-1.5 w-1.5 bg-[#7655fb] rounded-full animate-bounce [animation-delay:0.2s]" />
                          <div className="h-1.5 w-1.5 bg-[#7655fb] rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggestion Shortcuts Container */}
                <div className="px-4 py-2 shrink-0 border-t border-[#edf1f7] bg-white">
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    <button
                      onClick={() => handleSendMessage("➕ Create Goal: Become a cloud engineer in 30 days")}
                      className="shrink-0 text-[11px] font-bold bg-[#f3f0ff] hover:bg-[#e7e1ff] text-[#7655fb] border border-[#dcd3ff] px-3 py-1.5 rounded-full transition-colors cursor-pointer font-secondary"
                    >
                      ➕ Create Goal
                    </button>
                    <button
                      onClick={() => handleSendMessage("🎯 Break Down Goal: Help me plan AWS certification roadmap")}
                      className="shrink-0 text-[11px] font-bold bg-[#f3f0ff] hover:bg-[#e7e1ff] text-[#7655fb] border border-[#dcd3ff] px-3 py-1.5 rounded-full transition-colors cursor-pointer font-secondary"
                    >
                      🎯 Break Down
                    </button>
                    <button
                      onClick={() => handleSendMessage("📅 Plan My Week: Suggest daily study habits")}
                      className="shrink-0 text-[11px] font-bold bg-[#f3f0ff] hover:bg-[#e7e1ff] text-[#7655fb] border border-[#dcd3ff] px-3 py-1.5 rounded-full transition-colors cursor-pointer font-secondary"
                    >
                      📅 Plan Week
                    </button>
                    <button
                      onClick={() => handleSendMessage("🔥 Motivate Me! Celebrate my streak goals")}
                      className="shrink-0 text-[11px] font-bold bg-[#f3f0ff] hover:bg-[#e7e1ff] text-[#7655fb] border border-[#dcd3ff] px-3 py-1.5 rounded-full transition-colors cursor-pointer font-secondary"
                    >
                      🔥 Motivate Me
                    </button>
                  </div>
                </div>

                {/* Main typing input panel */}
                <div className="p-3 border-t border-[#edf1f7] bg-white flex flex-col gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    {/* Voice Input Button */}
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={!!dbError}
                      className={`h-[44px] w-[44px] rounded-[12px] flex items-center justify-center transition-all cursor-pointer shrink-0 disabled:opacity-40 ${
                        isRecording 
                          ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
                          : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                      }`}
                      title={isRecording ? "Stop Recording" : "Record voice message"}
                    >
                      🎙️
                    </button>

                    {/* File Attachment Upload Button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!!dbError}
                      className="h-[44px] w-[44px] rounded-[12px] bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-all cursor-pointer shrink-0 disabled:opacity-40"
                      title="Attach file"
                    >
                      📎
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSaveAttachment(file.name);
                      }} 
                    />

                    {/* Chat Text Input field */}
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendMessage();
                      }}
                      disabled={isStreaming || !!dbError}
                      placeholder={dbError ? "Database configuration error..." : isRecording ? "Listening to recording..." : "Ask CrushIT Coach..."}
                      className="flex-1 h-[44px] px-4 rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] focus:outline-none focus:border-[#7655fb] text-[13px] text-[#262525] disabled:opacity-50 font-secondary"
                    />

                    {/* Send Message Button */}
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={isStreaming || !!dbError || (!inputValue.trim() && !isRecording)}
                      className="h-[44px] w-[44px] rounded-[12px] bg-[#7655fb] hover:bg-[#6543ea] text-white flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === "tasks" && (
              <>
                {/* AI Tasks Checklists panel */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-[14px] text-[#262525] font-secondary">Action Checklist</h5>
                      <p className="text-[11px] text-gray-500 font-secondary">Complete AI recommended actions</p>
                    </div>
                    {tasks.some(t => t.is_completed) && (
                      <button
                        onClick={handleClearCompletedTasks}
                        className="text-[11px] font-bold text-[#7655fb] hover:underline cursor-pointer"
                      >
                        Clear Completed
                      </button>
                    )}
                  </div>

                  {tasks.length === 0 ? (
                    <div className="my-auto text-center py-10 px-6 border border-dashed border-gray-200 rounded-[18px]">
                      <p className="text-[13px] text-gray-400 font-medium font-secondary">No current subtasks</p>
                      <p className="text-[11px] text-gray-400 mt-1 font-secondary">Ask CrushIT AI to "break down my goal" to suggested subtasks.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between p-3.5 rounded-[16px] border transition-all ${
                            task.is_completed
                              ? "bg-green-50/30 border-green-100 text-gray-400 line-through"
                              : "bg-white border-[#edf1f7] text-[#262525] shadow-sm hover:border-[#dbeafe]"
                          }`}
                        >
                          <div className="flex items-center gap-3 pr-2 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={task.is_completed}
                              onChange={() => handleToggleTask(task.id)}
                              className="h-4.5 w-4.5 rounded border-gray-300 text-[#7655fb] focus:ring-[#7655fb] cursor-pointer shrink-0"
                            />
                            <span className="text-[13px] font-medium leading-normal select-none break-words truncate flex-1 font-secondary">
                              {task.title}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-50 transition-all cursor-pointer shrink-0"
                            title="Delete Task"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Task quick creator panel */}
                <form
                  onSubmit={handleAddCustomTask}
                  className="p-3 border-t border-[#edf1f7] bg-white flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={customTaskTitle}
                    onChange={(e) => setCustomTaskTitle(e.target.value)}
                    placeholder="Add a new custom task..."
                    className="flex-1 h-[44px] px-4 rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] focus:outline-none focus:border-[#7655fb] text-[13px] text-[#262525] font-secondary"
                  />
                  <button
                    type="submit"
                    disabled={!customTaskTitle.trim()}
                    className="h-[44px] px-4 rounded-[12px] bg-[#7655fb] hover:bg-[#6543ea] text-white text-[13px] font-bold transition-colors disabled:opacity-50 cursor-pointer shrink-0 font-secondary"
                  >
                    Add
                  </button>
                </form>
              </>
            )}

            {activeTab === "history" && (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-[14px] text-[#262525] font-secondary">History Log</h5>
                    <p className="text-[11px] text-gray-500 font-secondary">Load past accountability rooms</p>
                  </div>
                  <button
                    onClick={() => handleCreateSession(`Chat Room #${sessions.length + 1}`)}
                    className="text-[11px] font-bold text-[#7655fb] hover:underline"
                  >
                    + New Room
                  </button>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      onClick={() => setActiveSessionId(sess.id)}
                      className={`p-3.5 rounded-[16px] border flex items-center justify-between transition-all cursor-pointer ${
                        activeSessionId === sess.id
                          ? "bg-[#7655fb]/5 border-[#7655fb]/20 text-[#7655fb]"
                          : "bg-white border-[#edf1f7] text-[#262525] shadow-sm hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="text-[15px] shrink-0">{sess.is_pinned ? "📌" : "💬"}</span>
                        <span className="text-[13px] font-bold truncate font-secondary">{sess.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePin(sess.id);
                          }}
                          className="text-gray-400 hover:text-[#7655fb] p-1 rounded-md transition-colors"
                          title="Pin conversation"
                        >
                          {sess.is_pinned ? "⭐" : "☆"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(sess.id);
                          }}
                          className="text-gray-400 hover:text-red-500 p-1 rounded-md transition-colors"
                          title="Delete room"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                <div>
                  <h5 className="font-bold text-[14px] text-[#262525] font-secondary">Coach Preferences</h5>
                  <p className="text-[11px] text-gray-500 font-secondary">Customize CrushIT AI's behavior styling</p>
                </div>

                <div className="flex flex-col gap-4 bg-white border border-[#edf1f7] p-4 rounded-[18px] shadow-sm">
                  {/* Motivation style */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-gray-600 font-secondary">Motivation Style</label>
                    <select
                      value={motivationStyle}
                      onChange={(e) => handleUpdatePreferences(e.target.value, preferredHours)}
                      className="w-full h-[40px] px-3 rounded-[10px] border border-gray-200 bg-gray-50 text-[13px] text-[#262525] font-secondary focus:outline-none focus:border-[#7655fb]"
                    >
                      <option value="supportive">Supportive & Caring (Recommended)</option>
                      <option value="assertive">Assertive & Firm (High accountability)</option>
                      <option value="analytical">Analytical & Metric focused</option>
                      <option value="friendly">Friendly & Casual</option>
                    </select>
                  </div>

                  {/* Preferred hours */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-gray-600 font-secondary">Preferred Working Hours</label>
                    <select
                      value={preferredHours}
                      onChange={(e) => handleUpdatePreferences(motivationStyle, e.target.value)}
                      className="w-full h-[40px] px-3 rounded-[10px] border border-gray-200 bg-gray-50 text-[13px] text-[#262525] font-secondary focus:outline-none focus:border-[#7655fb]"
                    >
                      <option value="">Anytime</option>
                      <option value="morning">Morning (6 AM - 12 PM)</option>
                      <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                      <option value="evening">Evening (5 PM - 10 PM)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-[#f0edff] border border-[#d6ceff] p-4 rounded-[18px]">
                  <h6 className="text-[12px] font-bold text-[#7655fb] font-secondary">💡 AI Coaching Tips</h6>
                  <p className="text-[11px] text-[#5540b8] mt-1.5 leading-relaxed font-secondary">
                    You can type natural commands like <strong>"Plan a workout goal"</strong> or <strong>"Suggest habits for a DevOps roadmap"</strong> and CrushIT AI will create checklists for you dynamically!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Persistent Minimized indicator block */}
      {isOpen && isMinimized && (
        <div 
          onClick={() => {
            setIsMinimized(false);
            localStorage.setItem("crushit_min_state", "false");
          }}
          className="fixed bg-[#7655fb] text-white py-2.5 px-4.5 rounded-full shadow-[0_8px_20px_rgba(118,85,251,0.3)] z-[10000] flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform font-bold font-secondary text-[12px] right-[90px] sm:right-[100px] bottom-[30px] border border-white/10"
        >
          <span>💬 CrushIT AI minimized</span>
          <span className="bg-white text-[#7655fb] rounded-full p-0.5 text-[8px]">▲</span>
        </div>
      )}
    </>
  );
}
