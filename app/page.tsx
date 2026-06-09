import { supabase } from "@/lib/supabase";
import InterviewCard from "@/components/InterviewCard";
import Link from "next/link";
import type { Interview } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { data: interviews } = await supabase
    .from("interviews")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (interviews ?? []) as Interview[];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(28px,6vh,56px) 24px 80px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        gap: 20, flexWrap: "wrap", marginBottom: 32 }}>
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 style={{ fontSize: "clamp(24px,3.5vw,34px)", fontWeight: 700, letterSpacing: "-0.02em",
            margin: "10px 0 0" }}>
            Your interviews
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 15, margin: "8px 0 0" }}>
            {list.length} total
          </p>
        </div>
        <Link href="/interview/new" className="btn btn-primary" style={{ fontSize: 14 }}>
          + New interview
        </Link>
      </div>

      {list.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 24px" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--accent-soft)",
            border: "1px solid var(--border)", display: "grid", placeItems: "center",
            margin: "0 auto 20px", fontSize: 24 }}>
            🎙
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>No interviews yet</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14.5, margin: "0 0 24px" }}>
            Create your first mock interview to get started.
          </p>
          <Link href="/interview/new" className="btn btn-primary" style={{ padding: "11px 24px" }}>
            Start now →
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {list.map((interview) => (
            <InterviewCard key={interview.id} interview={interview} />
          ))}
        </div>
      )}
    </div>
  );
}
