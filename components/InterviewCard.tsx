"use client";

import Link from "next/link";
import type { Interview } from "@/types";

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  pending: { background: "rgba(94,168,255,0.08)", color: "var(--text-muted)", border: "1px solid var(--border)" },
  active: { background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid rgba(91,140,255,0.25)" },
  completed: { background: "rgba(95,194,139,0.1)", color: "var(--good)", border: "1px solid rgba(95,194,139,0.25)" },
};

const TYPE_STYLE: Record<string, React.CSSProperties> = {
  technical: { background: "var(--accent-soft)", color: "var(--accent)" },
  behavioural: { background: "rgba(240,113,111,0.1)", color: "var(--danger)" },
  mixed: { background: "rgba(95,194,139,0.1)", color: "var(--good)" },
};

export default function InterviewCard({ interview }: { interview: Interview }) {
  const date = new Date(interview.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  const hasFeedback = interview.status === "completed" || interview.feedback != null;

  const href = hasFeedback
    ? `/feedback/${interview.id}`
    : `/interview/${interview.id}`;

  const ctaLabel = hasFeedback ? "View feedback"
    : interview.status === "active" ? "Resume"
    : "Start";

  const score = interview.feedback
    ? Math.round(interview.feedback.overallScore * 10)
    : null;

  const scoreColor = score == null ? "var(--text-faint)"
    : score >= 80 ? "var(--good)"
    : score >= 65 ? "var(--accent)"
    : "var(--danger)";

  return (
    <Link href={href} className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14,
      transition: "border-color .15s", cursor: "pointer", textDecoration: "none", color: "inherit" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontWeight: 600, fontSize: 15, margin: 0, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {interview.role}
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "4px 0 0" }}>{interview.level}</p>
        </div>
        <span className="mono" style={{ fontSize: 11, padding: "4px 9px", borderRadius: 999, flexShrink: 0,
          ...STATUS_STYLE[interview.status] }}>
          {interview.status}
        </span>
      </div>

      {/* Tags */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="mono" style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6,
          ...TYPE_STYLE[interview.type] }}>
          {interview.type}
        </span>
        {score != null && (
          <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: scoreColor }}>
            {score}
            <span style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 400 }}>/100</span>
          </span>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingTop: 12, marginTop: "auto", borderTop: "1px solid var(--border)" }}>
        <span className="mono" style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{date}</span>
        <span className="link" style={{ fontSize: 13.5, fontWeight: 500 }}>{ctaLabel} →</span>
      </div>
    </Link>
  );
}
