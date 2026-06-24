"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChatSticker } from "@/lib/services/chat";

interface StickerPickerProps {
  onSelect: (stickerUrl: string) => void;
  onClose: () => void;
}

export default function StickerPicker({ onSelect, onClose }: StickerPickerProps) {
  const [stickers, setStickers] = useState<ChatSticker[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    async function fetchStickers() {
      try {
        const res = await fetch("/api/chat/stickers");
        const data = await res.json();
        if (data.success) {
          setStickers(data.stickers);
        }
      } catch (err) {
        console.error("Failed to load stickers:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStickers();
  }, []);

  // Group stickers by pack name
  const groupedStickers = stickers.reduce((acc, sticker) => {
    if (!acc[sticker.pack_name]) {
      acc[sticker.pack_name] = [];
    }
    acc[sticker.pack_name].push(sticker);
    return acc;
  }, {} as Record<string, ChatSticker[]>);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full right-16 mb-2 bg-[#262525] border border-white/10 rounded-[24px] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.4)] w-[280px] h-[320px] z-40 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
        <span className="text-[13px] font-bold text-white tracking-wide">Choose Sticker</span>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white transition-colors text-[12px] border-none bg-transparent cursor-pointer"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mt-2 pr-1 custom-scrollbar">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#7655fb] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stickers.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-4">
            <span className="text-[11px] text-gray-400">No stickers found in the collection.</span>
          </div>
        ) : (
          Object.entries(groupedStickers).map(([packName, packList]) => (
            <div key={packName} className="mb-4">
              <span className="text-[10px] font-extrabold text-[#7655fb] uppercase tracking-widest block mb-2 px-1">
                {packName}
              </span>
              <div className="grid grid-cols-4 gap-2">
                {packList.map((sticker) => (
                  <button
                    key={sticker.id}
                    onClick={() => {
                      onSelect(sticker.sticker_url);
                      onClose();
                    }}
                    className="aspect-square bg-white/5 border border-white/5 rounded-[12px] hover:bg-white/10 hover:border-white/10 p-1.5 transition-all cursor-pointer flex items-center justify-center group overflow-hidden"
                  >
                    <img
                      src={sticker.sticker_url}
                      alt="Sticker"
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-200"
                    />
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
