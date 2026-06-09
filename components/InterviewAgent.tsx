"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Vapi from "@vapi-ai/web";
import TranscriptDisplay from "./TranscriptDisplay";
import type { TranscriptEntry } from "@/types";

type CallStatus = "idle" | "connecting" | "active" | "ended";

export default function InterviewAgent ({
  vapiAssistantId,
  interviewId,
}: {
  vapiAssistantId: string;
  interviewId: string;
}) {
  const router = useRouter();
  const vapiRef = useRef<Vapi | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  useEffect(() => {
    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      console.log(`[InterviewAgent] call-start — assistantId=${vapiAssistantId}`);
      setCallStatus("active");
    });
    vapi.on("call-end", () => {
      console.log(`[InterviewAgent] call-end — redirecting to /feedback/${interviewId}`);
      setCallStatus("ended");
      setTimeout(() => router.push(`/feedback/${interviewId}`), 2000);
    });
    vapi.on("speech-start", () => setIsSpeaking(true));
    vapi.on("speech-end", () => setIsSpeaking(false));

    vapi.on("message", (message: { type: string; role?: string; transcript?: string }) => {
      if (message.type === "transcript" && message.role && message.transcript) {
        setTranscript((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === message.role) {
            return [
              ...prev.slice(0, -1),
              { role: last.role, content: last.content + " " + message.transcript },
            ];
          }
          return [
            ...prev,
            {
              role: message.role as "bot" | "user",
              content: message.transcript!,
            },
          ];
        });
      }
    });

    vapi.on("error", (e: unknown) => console.error(`[InterviewAgent] vapi error:`, e));

    return () => {
      vapi.stop();
    };
  }, [interviewId, router]);

  useEffect(() => {
    if (callStatus === "active") {
      const checkSpeaking = setInterval(() => {
        setIsAssistantSpeaking(vapiRef.current?.isMuted() === false);
      }, 200);
      return () => clearInterval(checkSpeaking);
    }
  }, [callStatus]);

  const startInterview = () => {
    console.log(`[InterviewAgent] starting call — assistantId=${vapiAssistantId}`);
    setCallStatus("connecting");
    vapiRef.current?.start(vapiAssistantId);
  };

  const endInterview = () => {
    console.log(`[InterviewAgent] ending call`);
    vapiRef.current?.stop();
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 h-full">
      <div className="bg-[#0d1526] border border-[#1e2a3a] rounded-xl p-6 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div
            className={`w-24 h-24 rounded-full bg-[#1e2a3a] border-2 flex items-center justify-center text-3xl transition-all duration-300 ${isAssistantSpeaking
                ? "border-[#3b82f6] shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                : "border-[#2a3a50]"
              }`}
          >
            🤖
          </div>
          {isAssistantSpeaking && (
            <div className="absolute inset-0 rounded-full border-2 border-[#3b82f6]/50 animate-ping" />
          )}
        </div>

        <div className="flex items-end gap-1 h-8">
          {isAssistantSpeaking
            ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 bg-[#3b82f6] rounded-full animate-bounce"
                style={{
                  height: `${Math.random() * 24 + 8}px`,
                  animationDelay: `${i * 100}ms`,
                }}
              />
            ))
            : Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-1.5 h-2 bg-[#1e2a3a] rounded-full" />
            ))}
        </div>

        <p className="text-slate-400 text-sm text-center">
          {callStatus === "idle" && "Ready to start your interview"}
          {callStatus === "connecting" && "Connecting..."}
          {callStatus === "active" && (isAssistantSpeaking ? "AI is speaking..." : "Listening...")}
          {callStatus === "ended" && "Interview ended — redirecting to feedback..."}
        </p>

        <div className="relative">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all ${isSpeaking
                ? "bg-emerald-500/20 border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                : "bg-[#1e2a3a] border-2 border-[#2a3a50]"
              }`}
          >
            🎤
          </div>
          {isSpeaking && (
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/50 animate-ping" />
          )}
        </div>

        <div className="flex gap-3">
          {callStatus === "idle" && (
            <button
              onClick={startInterview}
              className="bg-[#3b82f6] hover:bg-blue-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              Start Interview
            </button>
          )}
          {callStatus === "connecting" && (
            <button disabled className="bg-[#1e2a3a] text-slate-400 font-medium px-6 py-2.5 rounded-lg cursor-not-allowed">
              Connecting...
            </button>
          )}
          {callStatus === "active" && (
            <button
              onClick={endInterview}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              End Interview
            </button>
          )}
          {callStatus === "ended" && (
            <div className="text-emerald-400 text-sm font-medium">Generating feedback...</div>
          )}
        </div>
      </div>

      <div className="bg-[#0d1526] border border-[#1e2a3a] rounded-xl p-5 flex flex-col">
        <h3 className="text-slate-400 text-xs font-mono mb-3 uppercase tracking-wider">
          Live Transcript
        </h3>
        <div className="flex-1 min-h-0">
          <TranscriptDisplay transcript={transcript} />
        </div>
      </div>
    </div>
  );
}
