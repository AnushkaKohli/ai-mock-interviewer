"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HistoryEntry } from "@/types";

const SAMPLE_JD = `Senior Product Designer — Atlas (Series B, fintech)

About the role
We're looking for a Senior Product Designer to own end-to-end design for our money-movement experiences. You'll partner closely with PM and Engineering to ship features used by millions, and help raise the craft bar across the team.

What you'll do
• Lead design for complex, multi-step flows (payments, onboarding, KYC)
• Turn ambiguous problems into clear, shippable design solutions
• Build and maintain components in our design system
• Run usability sessions and fold research into your work
• Mentor two mid-level designers

What we're looking for
• 5+ years designing consumer or fintech products
• Strong systems thinking and interaction craft
• Comfort with data — you measure impact, not just ship
• Excellent written and verbal communication
• Bonus: prototyping in code, motion design`;

const VOICES = [
  { id: "ava", name: "Ava", tone: "Warm", desc: "Friendly, encouraging" },
  { id: "cole", name: "Cole", tone: "Neutral", desc: "Calm, even-keeled" },
  { id: "rhea", name: "Rhea", tone: "Crisp", desc: "Direct, fast-paced" },
];

const SKILL_KEYWORDS = [
  "React", "TypeScript", "Python", "Node", "SQL", "Design", "Product", "Data",
  "AWS", "API", "UX", "Research", "Leadership", "Communication", "Figma", "Swift",
  "Kotlin", "Go", "Rust", "Java", "C++", "Machine Learning", "Analytics",
];

function parseJDClient (jd: string): { role: string; skills: string[] } {
  const lines = jd.split("\n").map((l) => l.trim()).filter(Boolean);
  const role = (lines[0] ?? "Role").split("—")[0].split("-")[0].trim().slice(0, 60);
  const lower = jd.toLowerCase();
  const skills = SKILL_KEYWORDS.filter((s) => lower.includes(s.toLowerCase())).slice(0, 6);
  return { role, skills: skills.length ? skills : ["Problem solving", "Communication"] };
}

function Chip ({ children }: { children: React.ReactNode }) {
  return (
    <span className="mono" style={{
      fontSize: 11, padding: "5px 10px", borderRadius: 999,
      background: "var(--accent-soft)", color: "var(--text-muted)", border: "1px solid var(--border)"
    }}>
      {children}
    </span>
  );
}

function Seg ({
  value, set, options,
}: { value: string | number; set: (v: string | number) => void; options: (string | number)[] }) {
  return (
    <div style={{
      display: "flex", gap: 4, background: "var(--surface-2)", border: "1px solid var(--border)",
      borderRadius: 10, padding: 4
    }}>
      {options.map((o) => {
        const active = value === o;
        return (
          <button key={o} onClick={() => set(o)} className="mono"
            style={{
              flex: 1, border: "none", cursor: "pointer", fontSize: 13, padding: "8px 10px", borderRadius: 7,
              background: active ? "var(--surface)" : "transparent",
              color: active ? "var(--text)" : "var(--text-faint)",
              boxShadow: active ? "var(--shadow)" : "none",
              fontWeight: active ? 600 : 400, transition: "all .15s"
            }}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

export default function SetupPage () {
  const router = useRouter();
  const [jd, setJd] = useState("");
  const [difficulty, setDifficulty] = useState<string>("Standard");
  const [count, setCount] = useState<number>(6);
  const [voice, setVoice] = useState("ava");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [animate, setAnimate] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("mi.history.v1") ?? "[]");
    } catch {
      return [];
    }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [jdFocused, setJdFocused] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const parsed = jd.trim().length > 40 ? parseJDClient(jd) : null;
  const ready = jd.trim().length > 12;
  const est = Math.max(5, Math.round(count * 2.2));
  const selectedVoice = VOICES.find((v) => v.id === voice)!;

  const handleStart = async () => {
    if (!ready || loading) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jd, difficulty, count, voice }),
    });

    if (!res.ok) {
      setError("Failed to create interview. Please try again.");
      setLoading(false);
      return;
    }

    const { interviewId } = (await res.json()) as { interviewId: string };
    router.push(`/interview/${interviewId}`);
  };

  const clearHistory = () => {
    localStorage.removeItem("mi.history.v1");
    setHistory([]);
  };

  return (
    <div {...(animate ? { "data-animate": "" } : {})}
      style={{ maxWidth: 940, margin: "0 auto", padding: "clamp(28px,6vh,64px) 24px 80px" }}>

      {/* Header */}
      <div className="fade-up" style={{
        display: "flex", alignItems: "flex-end",
        justifyContent: "space-between", gap: 24, flexWrap: "wrap"
      }}>
        <div>
          <p className="eyebrow">AI voice practice</p>
          <h1 style={{
            fontSize: "clamp(32px,5vw,46px)", lineHeight: 1.02, letterSpacing: "-0.02em",
            margin: "12px 0 0", fontWeight: 700, maxWidth: 560
          }}>
            Paste a job. Practice the interview out loud.
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 17, margin: "14px 0 0", maxWidth: 520, lineHeight: 1.5 }}>
            We read the role, generate tailored questions, and run a live voice mock.
            You get a scored summary the moment you hang up.
          </p>
        </div>
        {history.length > 0 && (
          <button className="btn btn-ghost" onClick={() => setShowHistory(true)} style={{ whiteSpace: "nowrap" }}>
            Past interviews ({history.length})
          </button>
        )}
      </div>

      {/* Main card */}
      <div className="fade-up card" style={{
        marginTop: 34, padding: 0, overflow: "hidden",
        boxShadow: "var(--shadow)", animationDelay: ".06s"
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", minHeight: 360 }}>

          {/* JD input */}
          <div style={{
            padding: 26, borderRight: `1px solid ${jdFocused ? "rgba(91,140,255,0.4)" : "var(--border)"}`,
            display: "flex", flexDirection: "column",
            transition: "background .15s, border-color .15s",
            background: jdFocused ? "rgba(91,140,255,0.03)" : "transparent"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p className="eyebrow">Job description</p>
              <button className="link" onClick={() => setJd(SAMPLE_JD)} style={{ fontSize: 13 }}>
                Paste sample
              </button>
            </div>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              onFocus={() => setJdFocused(true)}
              onBlur={() => setJdFocused(false)}
              placeholder="Paste the full job description here — title, responsibilities, requirements…"
              style={{
                flex: 1, minHeight: 200, resize: "none", padding: "14px 16px", fontSize: 14.5,
                lineHeight: 1.55, background: "transparent", border: "none", borderRadius: 0,
                outline: "none"
              }}
            />
            <div style={{ minHeight: 30, marginTop: 14 }}>
              {parsed ? (
                <div className="fade-up" style={{ display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center" }}>
                  <span style={{ fontSize: 12.5, color: "var(--text-muted)", marginRight: 2 }}>Detected</span>
                  <Chip>{parsed.role}</Chip>
                  {parsed.skills.slice(0, 3).map((s) => <Chip key={s}>{s}</Chip>)}
                  {parsed.skills.length > 3 && (
                    <span className="mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>
                      +{parsed.skills.length - 3} more
                    </span>
                  )}
                </div>
              ) : (
                <span style={{ fontSize: 12.5, color: "var(--text-faint)" }}>
                  Tip: the more detail you paste, the sharper the questions.
                </span>
              )}
            </div>
          </div>

          {/* Config panel */}
          <div style={{ padding: 26, display: "flex", flexDirection: "column", gap: 22, background: "var(--surface-2)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <p className="eyebrow">Difficulty</p>
              <Seg value={difficulty} set={(v) => setDifficulty(v as string)} options={["Warmup", "Standard", "Tough"]} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <p className="eyebrow">Questions</p>
              <Seg value={count} set={(v) => setCount(v as number)} options={[4, 6, 8]} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <p className="eyebrow">Interviewer voice</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {VOICES.map((v) => {
                  const active = voice === v.id;
                  return (
                    <button key={v.id} onClick={() => setVoice(v.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 11, textAlign: "left",
                        cursor: "pointer", padding: "10px 12px", borderRadius: 9, fontFamily: "inherit",
                        background: active ? "var(--surface)" : "transparent",
                        border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
                        transition: "all .15s"
                      }}>
                      <span style={{
                        width: 9, height: 9, borderRadius: 999, flexShrink: 0,
                        background: active ? "var(--accent)" : "var(--border)"
                      }} />
                      <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{v.name}</span>
                      <span className="mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>{v.tone}</span>
                      <span style={{ fontSize: 12.5, color: "var(--text-muted)", marginLeft: "auto" }}>{v.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          padding: "16px 26px", borderTop: "1px solid var(--border)", background: "var(--surface)"
        }}>
          <span className="mono" style={{ fontSize: 12.5, color: "var(--text-faint)" }}>
            {count} questions · ~{est} min · {selectedVoice.name}
          </span>
          <button className="btn btn-primary" disabled={!ready || loading} onClick={handleStart}>
            {loading ? "Setting up…" : (
              <>Start interview <span aria-hidden style={{ fontSize: 17, lineHeight: 1 }}>→</span></>
            )}
          </button>
        </div>
      </div>

      {error && (
        <p style={{ color: "var(--danger)", fontSize: 13.5, marginTop: 12, textAlign: "center" }}>{error}</p>
      )}

      <p style={{ textAlign: "center", marginTop: 20, fontSize: 12.5, color: "var(--text-faint)" }}>
        Your mic stays on this device. Nothing is shared — summaries are saved only to this browser.
      </p>

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
              <p style={{ color: "var(--text-faint)", fontSize: 14, marginTop: 20 }}>
                No interviews saved yet. Finish a mock to see it here.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {history.map((it, i) => (
                  <div key={i} className="card" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600 }}>{it.role}</div>
                      <div className="mono" style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 3 }}>
                        {it.date} · {it.answered}/{it.total} answered
                      </div>
                    </div>
                    <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)" }}>
                      {it.score}
                    </span>
                  </div>
                ))}
                <button onClick={clearHistory} className="link"
                  style={{ fontSize: 13, alignSelf: "flex-start", marginTop: 6 }}>
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
