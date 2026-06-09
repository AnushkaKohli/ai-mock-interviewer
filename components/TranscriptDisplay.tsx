"use client";

import { useEffect, useRef } from "react";
import type { TranscriptEntry } from "@/types";

export default function TranscriptDisplay ({ transcript }: { transcript: TranscriptEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  if (transcript.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm font-mono">
        Transcript will appear here...
      </div>
    );
  }

  return (
    <div className="space-y-3 overflow-y-auto h-full pr-1">
      {transcript.map((entry, i) => (
        <div
          key={i}
          className={`flex gap-2 animate-fadeIn ${entry.role === "user" ? "flex-row-reverse" : ""}`}
        >
          <div
            className={`text-xs font-mono px-1 pt-1 shrink-0 ${entry.role === "bot" ? "text-[#3b82f6]" : "text-emerald-400"
              }`}
          >
            {entry.role === "bot" ? "AI" : "You"}
          </div>
          <div
            className={`text-sm rounded-lg px-3 py-2 max-w-[85%] ${entry.role === "bot"
                ? "bg-[#1e2a3a] text-slate-200"
                : "bg-emerald-500/10 text-emerald-100 border border-emerald-500/20"
              }`}
          >
            {entry.content}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
