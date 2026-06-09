import { supabase } from "@/lib/supabase";
import { parseJD, generateQuestions } from "@/lib/groq";
import { createVapiAssistant } from "@/lib/vapi";
import type { InterviewLevel, InterviewType } from "@/types";

const DIFFICULTY_LEVEL: Record<string, InterviewLevel> = {
  Warmup: "Junior",
  Standard: "Mid",
  Tough: "Senior",
};

export async function POST(request: Request) {
  console.log(`[api/interviews] POST received`);

  const body = (await request.json()) as {
    // New JD-based format
    jd?: string;
    difficulty?: string;
    count?: number;
    voice?: string;
    // Legacy format
    role?: string;
    level?: InterviewLevel;
    type?: InterviewType;
  };

  let role: string;
  let level: InterviewLevel;
  let type: InterviewType;
  let count: number;
  let jd: string | undefined;

  if (body.jd) {
    jd = body.jd;
    count = body.count ?? 6;
    const difficulty = body.difficulty ?? "Standard";
    level = DIFFICULTY_LEVEL[difficulty] ?? "Mid";
    type = "mixed";

    const parsed = await parseJD(jd);
    role = parsed.role;
    console.log(`[api/interviews] JD payload — role=${role} level=${level} count=${count}`);
  } else if (body.role && body.level && body.type) {
    role = body.role;
    level = body.level;
    type = body.type;
    count = 5;
    console.log(`[api/interviews] legacy payload — role=${role} level=${level} type=${type}`);
  } else {
    return Response.json({ error: "Provide either 'jd' or 'role + level + type'" }, { status: 400 });
  }

  let questions: string[];
  try {
    questions = await generateQuestions(role, level, type, count, jd);
    console.log(`[api/interviews] generated ${questions.length} questions`);
  } catch (err) {
    console.error(`[api/interviews] generateQuestions threw:`, err);
    return Response.json({ error: "Failed to generate questions" }, { status: 500 });
  }

  const { data: interview, error: insertError } = await supabase
    .from("interviews")
    .insert({ role, level, type, questions, status: "pending" })
    .select("id")
    .single();

  if (insertError || !interview) {
    console.error(`[api/interviews] supabase insert failed:`, insertError);
    return Response.json({ error: "Failed to create interview" }, { status: 500 });
  }
  console.log(`[api/interviews] interview row created — id=${interview.id}`);

  let vapiAssistantId: string;
  try {
    vapiAssistantId = await createVapiAssistant({
      role,
      level,
      type,
      questions,
      interviewId: interview.id,
    });
    console.log(`[api/interviews] vapi assistant created — id=${vapiAssistantId}`);
  } catch (err) {
    console.error(`[api/interviews] createVapiAssistant threw:`, err);
    return Response.json({ error: "Failed to create Vapi assistant" }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("interviews")
    .update({ vapi_assistant_id: vapiAssistantId })
    .eq("id", interview.id);

  if (updateError) {
    console.error(`[api/interviews] supabase update vapi_assistant_id failed:`, updateError);
  }

  console.log(`[api/interviews] done — interviewId=${interview.id}`);
  return Response.json({ interviewId: interview.id, vapiAssistantId });
}
