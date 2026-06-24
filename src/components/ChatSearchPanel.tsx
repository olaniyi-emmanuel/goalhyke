"use client";

import React, { useState, useEffect } from "react";
import { ChatMessage, ChatAttachment } from "@/lib/services/chat";

interface ChatSearchPanelProps {
  conversationId: string;
  onSelectMessage: (messageId: string) => void;
  onClose: () => void;
}

export default function ChatSearchPanel({
  conversationId,
  onSelectMessage,
  onClose,
}: ChatSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"messages" | "attachments">("messages");

  // Debounced search effect
  useEffect(() => {
    if (!query.trim()) {
      setMessages([]);
      setAttachments([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/chat/search?query=${encodeURIComponent(query)}&conversationId=${conversationId}`
        );
        const data = await res.json();
        if (data.success) {
          setMessages(data.results.messages);
          setAttachments(data.results.attachments);
        }
      } catch (err) {
        console.error("Search query failed:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, conversationId]);

  return (
    <div className="w-[300px] bg-[#262525] border-l border-white/10 flex flex-col h-full shrink-0 select-none animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
        <span className="text-white text-[15px] font-bold tracking-wide">Search In Chat</span>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white transition-colors cursor-pointer text-[12px] border-none bg-transparent"
        >
          ✕
        </button>
      </div>

      {/* Input */}
      <div className="p-4 shrink-0">
        <div className="relative">
          <input
            type="text"
            placeholder="Search text, files, images..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-[40px] pl-9 pr-4 rounded-[12px] border border-white/10 bg-white/5 text-white text-[13px] focus:outline-none focus:border-[#7655fb] transition-colors"
          />
          <svg
            className="absolute left-3 top-3 w-4 h-4 text-white/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        {/* Sub-tab Switcher */}
        {query.trim() && (
          <div className="flex bg-white/5 p-1 rounded-full mt-4 border border-white/5">
            <button
              onClick={() => setActiveSubTab("messages")}
              className={`flex-1 text-[11px] font-extrabold py-1.5 rounded-full transition-all cursor-pointer ${
                activeSubTab === "messages"
                  ? "bg-gradient-to-r from-[#4169e1] to-[#7655fb] text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              Messages ({messages.length})
            </button>
            <button
              onClick={() => setActiveSubTab("attachments")}
              className={`flex-1 text-[11px] font-extrabold py-1.5 rounded-full transition-all cursor-pointer ${
                activeSubTab === "attachments"
                  ? "bg-gradient-to-r from-[#4169e1] to-[#7655fb] text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              Files ({attachments.length})
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#7655fb] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !query.trim() ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <svg
              className="w-10 h-10 text-white/20 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-[12px] text-white/30">Type to search for text or files inside this conversation history.</span>
          </div>
        ) : activeSubTab === "messages" ? (
          messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <span className="text-[12px] text-white/30">No matching messages found.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {messages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => onSelectMessage(msg.id)}
                  className="w-full text-left p-3 rounded-[16px] bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-white group-hover:text-[#4169e1] transition-colors truncate max-w-[120px]">
                      {msg.sender?.full_name || msg.sender?.username || "Member"}
                    </span>
                    <span className="text-[10px] text-white/30 shrink-0">
                      {new Date(msg.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-[12px] text-white/60 mt-1.5 line-clamp-2 leading-relaxed">
                    {msg.content}
                  </p>
                </button>
              ))}
            </div>
          )
        ) : attachments.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <span className="text-[12px] text-white/30">No matching file attachments.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {attachments.map((file) => (
              <a
                key={file.id}
                href={file.file_url}
                download={file.file_name}
                target="_blank"
                rel="noreferrer"
                className="w-full text-left p-3 rounded-[16px] bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all cursor-pointer flex gap-3 items-center group"
              >
                <div className="w-10 h-10 bg-[#7655fb]/20 rounded-[12px] flex items-center justify-center text-[#7655fb] shrink-0 font-bold text-[10px]">
                  {file.mime_type.includes("image") ? "IMG" : "DOC"}
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="text-[12px] font-bold text-white truncate leading-tight group-hover:text-[#7655fb] transition-colors">
                    {file.file_name}
                  </h5>
                  <span className="text-[10px] text-white/30 mt-1 block">
                    {Math.round(file.file_size / 1024)} KB •{" "}
                    {new Date(file.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
