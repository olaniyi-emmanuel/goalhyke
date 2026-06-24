"use client";

import React, { useEffect, useRef } from "react";

interface ReactionSelectorProps {
  onSelect: (emoji: string) => void;
  userReactions: string[]; // List of emojis user has already reacted with on this message
  onClose: () => void;
}

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🎉", "🔥"];

export default function ReactionSelector({
  onSelect,
  userReactions,
  onClose,
}: ReactionSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#262525] border border-white/10 rounded-full px-2 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex items-center gap-1.5 z-40 animate-in fade-in zoom-in-95 duration-150"
    >
      {COMMON_EMOJIS.map((emoji) => {
        const isReacted = userReactions.includes(emoji);
        return (
          <button
            key={emoji}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className={`w-[32px] h-[32px] flex items-center justify-center rounded-full text-[18px] hover:scale-125 hover:bg-white/10 transition-all cursor-pointer ${
              isReacted ? "bg-[#7655fb]/30 border border-[#7655fb]/50" : "bg-transparent border border-transparent"
            }`}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}
