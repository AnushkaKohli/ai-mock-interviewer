"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Vapi from "@vapi-ai/web";
import type { TranscriptEntry } from "@/types";

type CallStatus = "idle" | "connecting" | "active" | "ended";

function Avatar ({ speaking }: { speaking: boolean }) {
  return (
    <div style={{ position: "relative", width: 240, height: 240, display: "grid", placeItems: "center" }}>
      {/* Expanding rings when speaking */}
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          position: "absolute", width: 150, height: 150, borderRadius: "50%",
          border: "1.5px solid var(--accent)", opacity: 0,
          animation: speaking ? `mi-ring 2.4s ${i * 0.8}s ease-out infinite` : "none",
        }} />
      ))}
      {/* Soft halo */}
      <span style={{
        position: "absolute", width: 200, height: 200, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(91,140,255,0.22), transparent 68%)",
        animation: "mi-breathe 4s ease-in-out infinite",
        filter: "blur(2px)",
      }} />
      {/* Core disc */}
      <div style={{
        position: "relative", width: 150, height: 150, borderRadius: "50%",
        background: "var(--surface)", border: "1px solid var(--border)",
        boxShadow: "var(--shadow)", display: "grid", placeItems: "center",
        animation: speaking ? "mi-breathe 2.2s ease-in-out infinite" : "mi-breathe 5s ease-in-out infinite",
      }}>
        <div style={{
          width: 96, height: 96, borderRadius: "50%",
          background: "linear-gradient(150deg, var(--accent), rgba(91,140,255,0.45))",
          display: "grid", placeItems: "center",
        }}>
          <span className="mono" style={{ fontSize: 34, fontWeight: 600, color: "var(--accent-text)" }}>AI</span>
        </div>
      </div>
    </div>
  );
}

function Waveform ({ active }: { active: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, height: 40 }}>
      {Array.from({ length: 28 }).map((_, i) => (
        <span key={i} style={{
          width: 3, borderRadius: 3, flexShrink: 0,
          background: active ? "var(--accent)" : "var(--border)",
          height: active ? undefined : "6px",
          animation: active ? `mi-bar 1s ${(i % 7) * 0.12}s ease-in-out infinite` : "none",
        }} />
      ))}
    </div>
  );
}

export default function CallScreen ({
  vapiAssistantId,
  interviewId,
  role,
  questionCount,
}: {
  vapiAssistantId: string;
  interviewId: string;
  role: string;
  questionCount: number;
}) {
  const router = useRouter();
  const vapiRef = useRef<Vapi | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const assistantTurns = transcript.filter((t) => t.role === "bot").length;
  const questionIdx = Math.min(assistantTurns, questionCount);
  const lastAssistantMsg = [...transcript].reverse().find((t) => t.role === "bot")?.content ?? "";

  useEffect(() => {
    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      setCallStatus("active");
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    });

    vapi.on("call-end", () => {
      setCallStatus("ended");
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeout(() => router.push(`/feedback/${interviewId}`), 2000);
    });

    vapi.on("speech-start", () => setIsAssistantSpeaking(true));
    vapi.on("speech-end", () => setIsAssistantSpeaking(false));

    vapi.on("message", (message: {
      type: string;
      role?: string;
      transcript?: string;
      transcriptType?: string;
    }) => {
      if (message.type === "transcript" && message.role && message.transcript) {
        setTranscript((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === message.role && message.transcriptType !== "final") {
            return [...prev.slice(0, -1), { role: last.role, content: message.transcript! }];
          }
          if (last && last.role === message.role && message.transcriptType === "final") {
            return [...prev.slice(0, -1), { role: last.role, content: last.content + " " + message.transcript! }];
          }
          return [...prev, { role: message.role as "bot" | "user", content: message.transcript! }];
        });
      }
    });

    vapi.on("error", (e: unknown) => console.error("[CallScreen] vapi error:", e));

    return () => {
      vapi.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [interviewId, router]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const startCall = () => {
    setCallStatus("connecting");
    vapiRef.current?.start(vapiAssistantId);
  };

  const endCall = () => {
    vapiRef.current?.stop();
  };

  const toggleMute = () => {
    if (!vapiRef.current) return;
    const next = !isMicMuted;
    setIsMicMuted(next);
    vapiRef.current.setMuted(next);
  };

  const isActive = callStatus === "active" || callStatus === "ended";
  const phase = !isActive ? callStatus
    : isAssistantSpeaking ? "speaking"
      : "listening";

  const statusText =
    phase === "speaking" ? "AI is asking…" :
      phase === "listening" ? (isMicMuted ? "Mic muted — unmute to answer" : "Listening to your answer…") :
        callStatus === "connecting" ? "Connecting…" :
          callStatus === "ended" ? "Interview ended — generating feedback…" :
            "Ready to start";

  return (
    <div style={{ minHeight: "calc(100vh - 56px)", display: "flex", flexDirection: "column" }}>
      {isActive ? (
        <>
          {/* Top bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "18px 28px", borderBottom: "1px solid var(--border)", flexShrink: 0
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{
                width: 9, height: 9, borderRadius: 999, background: "var(--danger)", flexShrink: 0,
                animation: "mi-blink 1.6s ease-in-out infinite"
              }} />
              <span className="mono" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                LIVE · {fmt(elapsed)}
              </span>
            </div>
            <span className="mono" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{role}</span>
            <span className="mono" style={{ fontSize: 12.5, color: "var(--text-faint)" }}>
              {String(questionIdx).padStart(2, "0")} / {String(questionCount).padStart(2, "0")}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, background: "var(--surface-2)", flexShrink: 0 }}>
            <div style={{
              height: "100%", background: "var(--accent)", transition: "width .5s cubic-bezier(.2,.7,.2,1)",
              width: `${(questionIdx / questionCount) * 100}%`
            }} />
          </div>

          {/* Stage */}
          <div style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 8, padding: "32px 24px", textAlign: "center"
          }}>
            <Avatar speaking={isAssistantSpeaking} />

            <div className="mono" style={{
              fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase",
              color: "var(--text-faint)", marginTop: 4
            }}>
              Question {Math.max(1, questionIdx)}
            </div>

            <p style={{
              fontSize: "clamp(20px,2.6vw,27px)", lineHeight: 1.4, maxWidth: 680, fontWeight: 500,
              margin: "6px 0 0", minHeight: 76, letterSpacing: "-0.01em", color: "var(--text)"
            }}>
              {lastAssistantMsg || statusText}
              {isAssistantSpeaking && <span style={{ opacity: 0.5 }}>▍</span>}
            </p>

            <div style={{ height: 56, display: "grid", placeItems: "center", marginTop: 6 }}>
              {phase === "listening"
                ? <Waveform active={!isMicMuted} />
                : <span style={{ fontSize: 14.5, color: "var(--text-muted)" }}>{statusText}</span>}
            </div>
            {phase === "listening" && (
              <span className="animate-fadeIn" style={{ fontSize: 14.5, color: "var(--text-muted)" }}>
                {statusText}
              </span>
            )}
          </div>

          {/* Controls */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            padding: "20px 24px 30px", flexWrap: "wrap", flexShrink: 0
          }}>
            <button className="btn btn-quiet" onClick={toggleMute} disabled={callStatus === "ended"}>
              {isMicMuted ? "🔇 Unmute" : "🎙 Mute"}
            </button>
            <button className="btn btn-danger" onClick={endCall} disabled={callStatus === "ended"}>
              End interview
            </button>
          </div>
        </>
      ) : (
        /* Pre-call state */
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 24, padding: "32px 24px", textAlign: "center"
        }}>
          <Avatar speaking={false} />

          <div style={{ marginTop: 8 }}>
            <p className="eyebrow" style={{ marginBottom: 12 }}>Ready when you are</p>
            <h2 style={{ fontSize: "clamp(20px,2.6vw,27px)", fontWeight: 500, color: "var(--text)", margin: 0 }}>
              {role} Interview
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: 14.5, marginTop: 8 }}>
              {questionCount} questions · Your mic will activate once connected
            </p>
          </div>

          <button className="btn btn-primary" onClick={startCall}
            disabled={callStatus === "connecting"}
            style={{ fontSize: 15, padding: "12px 28px" }}>
            {callStatus === "connecting" ? "Connecting…" : "Start interview →"}
          </button>
        </div>
      )}
    </div>
  );
}
