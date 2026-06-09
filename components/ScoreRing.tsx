"use client";

import { useState, useEffect } from "react";

interface ScoreRingProps {
  value: number; // 0–100
  size?: number;
  stroke?: number;
  label?: string;
  sub?: string;
}

export default function ScoreRing({ value, size = 132, stroke = 9, label, sub }: ScoreRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  // Initialize to final value so a frozen/offscreen render still shows the real score
  const [shown, setShown] = useState(value);

  useEffect(() => {
    let raf: number;
    let start: number | undefined;
    const dur = 900;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const off = c - (shown / 100) * c;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--accent)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center" }}>
        <span className="mono" style={{ fontSize: size * 0.3, fontWeight: 600, color: "var(--text)", lineHeight: 1 }}>
          {shown}
        </span>
        {label && (
          <span className="mono" style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase",
            color: "var(--text-faint)", marginTop: 6 }}>
            {label}
          </span>
        )}
        {sub && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</span>}
      </div>
    </div>
  );
}
