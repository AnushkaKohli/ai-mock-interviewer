import { supabase } from "@/lib/supabase";
import CallScreen from "@/components/CallScreen";
import { notFound } from "next/navigation";
import type { Interview } from "@/types";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data } = await supabase
    .from("interviews")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const interview = data as Interview;

  if (!interview.vapi_assistant_id) {
    return (
      <div style={{ minHeight: "calc(100vh - 56px)", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%",
          border: "3px solid var(--border)", borderTopColor: "var(--accent)",
          animation: "spin 1s linear infinite" }} />
        <p style={{ color: "var(--text-muted)", fontSize: 15 }}>Setting up your interview…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <CallScreen
      vapiAssistantId={interview.vapi_assistant_id}
      interviewId={interview.id}
      role={interview.role}
      questionCount={interview.questions.length}
    />
  );
}
