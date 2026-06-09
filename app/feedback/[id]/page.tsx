"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import ScoreRing from "@/components/ScoreRing";
import Link from "next/link";
import type { HistoryEntry, Interview } from "@/types";

function Eyebrow ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p className="eyebrow" style={style}>{children}</p>;
}

function Section ({ children, delay = 0, style, className }: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div className={`fade-up${className ? ` ${className}` : ""}`} style={{ animationDelay: `${delay}s`, ...style }}>
      {children}
    </div>
  );
}

export default function FeedbackPage () {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);
  const [openQ, setOpenQ] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("mi.history.v1") ?? "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const rafId = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const poll = async () => {
      const { data } = await supabaseBrowser
        .from("interviews")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setInterview(data as Interview);
        const iv = data as Interview;
        if (iv.status === "completed" || iv.feedback != null) {
          clearInterval(interval);
          setLoading(false);

          // Save to local history
          const entry = {
            role: iv.role,
            score: Math.round((iv.feedback?.overallScore ?? 0) * 10),
            answered: iv.transcript?.filter((t) => t.role === "user").length ?? 0,
            total: iv.questions.length,
            date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
              ", " + new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
          };
          const prev = (() => { try { return JSON.parse(localStorage.getItem("mi.history.v1") ?? "[]"); } catch { return []; } })();
          const next = [entry, ...prev].slice(0, 20);
          try { localStorage.setItem("mi.history.v1", JSON.stringify(next)); } catch { }
          setHistory(next);
        }
      }
    };

    poll();
    interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading || !interview) {
    return (
      <div style={{
        minHeight: "calc(100vh - 56px)", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          border: "3px solid var(--border)", borderTopColor: "var(--accent)",
          animation: "spin 1s linear infinite"
        }} />
        <p style={{ color: "var(--text-muted)", fontSize: 15 }}>Generating your feedback…</p>
        <p style={{ color: "var(--text-faint)", fontSize: 13 }}>This may take a moment.</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (!interview.feedback) {
    return (
      <div style={{
        minHeight: "calc(100vh - 56px)", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 12
      }}>
        <p style={{ color: "var(--text-muted)", fontSize: 15 }}>No feedback available yet.</p>
        <Link href="/" className="link" style={{ fontSize: 14 }}>Back to dashboard</Link>
      </div>
    );
  }

  const fb = interview.feedback;
  // Scale 1–10 score to 0–100
  const score = Math.round(fb.overallScore * 10);
  const verdictText = score >= 80 ? "Strong candidate" : score >= 65 ? "Solid candidate" : "Keep practicing";
  const verdictColor = score >= 80 ? "var(--good)" : score >= 65 ? "var(--accent)" : "var(--danger)";

  const nextSteps = fb.nextSteps ?? fb.improvements.slice(0, 3).map((s) => `Work on: ${s}`);
  const savedAt = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    ", " + new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  const fmt = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;
  const durationSecs = interview.duration_seconds ?? 0;
  const answeredCount = interview.transcript?.filter((t) => t.role === "user").length ?? 0;

  return (
    <div {...(animate ? { "data-animate": "" } : {})}
      style={{ maxWidth: 940, margin: "0 auto", padding: "clamp(24px,5vh,52px) 24px 90px" }}>

      {/* Saved banner */}
      <Section style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 16, marginBottom: 26, flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 20, height: 20, borderRadius: 999, background: "var(--good)",
            color: "#fff", display: "grid", placeItems: "center", fontSize: 12, flexShrink: 0
          }}>✓</span>
          <span style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Summary saved to your history · {savedAt}
          </span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => setShowHistory(true)}>View history</button>
          <Link href="/interview/new" className="btn btn-primary">New interview</Link>
        </div>
      </Section>

      {/* Headline + score */}
      <Section delay={0.04} className="card" style={{
        padding: "30px 32px", boxShadow: "var(--shadow)",
        display: "grid", gridTemplateColumns: "1fr auto", gap: 30, alignItems: "center"
      }}>
        <div>
          <Eyebrow>Interview summary</Eyebrow>
          <h1 style={{
            fontSize: "clamp(26px,3.4vw,36px)", letterSpacing: "-0.02em",
            margin: "12px 0 0", fontWeight: 700
          }}>
            {verdictText}
          </h1>
          <p style={{
            color: "var(--text-muted)", fontSize: 16.5, lineHeight: 1.55,
            margin: "12px 0 0", maxWidth: 520
          }}>
            {fb.summary}
          </p>
          <div style={{ display: "flex", gap: 22, marginTop: 20, flexWrap: "wrap" }}>
            {([
              ["Role", interview.role],
              ["Answered", `${answeredCount} of ${interview.questions.length}`],
              ...(durationSecs > 0 ? [["Duration", fmt(durationSecs)] as [string, string]] : []),
            ] as [string, string][]).map(([k, v]) => (
              <div key={k}>
                <p className="eyebrow">{k}</p>
                <div className="mono" style={{ fontSize: 15, marginTop: 4, color: "var(--text)" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", placeItems: "center" }}>
          <ScoreRing value={score} size={150} label="out of 100" />
          <span className="mono" style={{ marginTop: 12, fontSize: 12, color: verdictColor, fontWeight: 600 }}>
            {verdictText}
          </span>
        </div>
      </Section>

      {/* Strengths / Weaknesses */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 18 }}>
        <Section delay={0.1} className="card" style={{ padding: "24px 26px" }}>
          <Eyebrow style={{ color: "var(--good)" }}>What worked</Eyebrow>
          <ul style={{
            margin: "16px 0 0", padding: 0, listStyle: "none",
            display: "flex", flexDirection: "column", gap: 13
          }}>
            {fb.strengths.map((s, i) => (
              <li key={i} style={{ display: "flex", gap: 11, fontSize: 15, lineHeight: 1.45, color: "var(--text)" }}>
                <span style={{ color: "var(--good)", flexShrink: 0 }}>+</span>{s}
              </li>
            ))}
          </ul>
        </Section>
        <Section delay={0.14} className="card" style={{ padding: "24px 26px" }}>
          <Eyebrow style={{ color: "var(--danger)" }}>Where to sharpen</Eyebrow>
          <ul style={{
            margin: "16px 0 0", padding: 0, listStyle: "none",
            display: "flex", flexDirection: "column", gap: 13
          }}>
            {fb.improvements.map((s, i) => (
              <li key={i} style={{ display: "flex", gap: 11, fontSize: 15, lineHeight: 1.45, color: "var(--text)" }}>
                <span style={{ color: "var(--danger)", flexShrink: 0 }}>△</span>{s}
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* Question by question */}
      <Section delay={0.18} style={{ marginTop: 30 }}>
        <Eyebrow>Question by question</Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
          {fb.questionFeedback.map((qq, i) => {
            const open = openQ === i;
            const qScore = qq.score != null ? Math.round(qq.score * 10) : null;
            const scoreColor = qScore == null ? "var(--text-faint)"
              : qScore >= 80 ? "var(--good)"
                : qScore >= 70 ? "var(--accent)"
                  : "var(--danger)";
            return (
              <div key={i} className="card" style={{ overflow: "hidden", transition: "all .2s" }}>
                <button onClick={() => setOpenQ(open ? -1 : i)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 14,
                    padding: "16px 20px", background: "transparent", border: "none",
                    cursor: "pointer", textAlign: "left", fontFamily: "inherit"
                  }}>
                  <span className="mono" style={{ fontSize: 12, color: "var(--text-faint)", width: 22, flexShrink: 0 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: "var(--text)" }}>{qq.question}</span>
                  {qScore != null && (
                    <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: scoreColor, flexShrink: 0 }}>
                      {qScore}
                    </span>
                  )}
                  <span style={{
                    color: "var(--text-faint)", flexShrink: 0,
                    transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", fontSize: 16
                  }}>⌄</span>
                </button>
                {open && (
                  <div className="animate-fadeIn"
                    style={{ padding: "4px 20px 20px 56px", display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <Eyebrow>Feedback</Eyebrow>
                      <p style={{ margin: "7px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "var(--text)" }}>
                        {qq.assessment}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Practice next */}
      <Section delay={0.22} className="card"
        style={{ marginTop: 18, padding: "26px 28px", background: "var(--accent-soft)", borderColor: "transparent" }}>
        <Eyebrow>Practice next</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginTop: 16 }}>
          {nextSteps.map((s, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <span className="mono" style={{ fontSize: 22, fontWeight: 600, color: "var(--accent)" }}>{i + 1}</span>
              <span style={{ fontSize: 14.5, lineHeight: 1.45, color: "var(--text)" }}>{s}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 30 }}>
        <Link href="/interview/new" className="btn btn-primary" style={{ padding: "14px 28px", fontSize: 15 }}>
          Run another interview
        </Link>
      </div>

      {/* History drawer */}
      {showHistory && (
        <div onClick={() => setShowHistory(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 50, background: "rgba(12,17,25,0.75)",
            backdropFilter: "blur(6px)", display: "flex", justifyContent: "flex-end"
          }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(440px,100%)", height: "100%", background: "var(--surface)",
              borderLeft: "1px solid var(--border)", padding: 26, overflowY: "auto"
            }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <p className="eyebrow">Past interviews</p>
              <button onClick={() => setShowHistory(false)} className="btn btn-quiet"
                style={{ padding: "7px 12px", fontSize: 13 }}>Close</button>
            </div>
            {history.length === 0 ? (
              <p style={{ color: "var(--text-faint)", fontSize: 14, marginTop: 20 }}>No interviews saved yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {history.map((it, i) => (
                  <div key={i} className="card" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                    <ScoreRing value={it.score} size={54} stroke={5} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600 }}>{it.role}</div>
                      <div className="mono" style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 3 }}>
                        {it.date} · {it.answered}/{it.total} answered
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => { localStorage.removeItem("mi.history.v1"); setHistory([]); }}
                  className="link" style={{ fontSize: 13, alignSelf: "flex-start", marginTop: 6 }}>
                  Clear history
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
