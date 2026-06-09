import { supabase } from "@/lib/supabase";
import { generateFeedback } from "@/lib/groq";
import type { InterviewLevel, TranscriptEntry } from "@/types";

export async function POST(request: Request) {
  console.log(`[api/feedback] POST received`);

  const { interviewId, transcript, role, level, questions } = (await request.json()) as {
    interviewId: string;
    transcript: TranscriptEntry[];
    role: string;
    level: InterviewLevel;
    questions: string[];
  };
  console.log(`[api/feedback] interviewId=${interviewId} transcriptEntries=${transcript.length}`);

  let feedback;
  try {
    feedback = await generateFeedback({ role, level, questions, transcript });
    console.log(`[api/feedback] feedback generated — overallScore=${feedback.overallScore}`);
  } catch (err) {
    console.error(`[api/feedback] generateFeedback threw:`, err);
    return Response.json({ error: "Failed to generate feedback" }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("interviews")
    .update({
      feedback,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", interviewId);

  if (updateError) {
    console.error(`[api/feedback] supabase update failed:`, updateError);
    return Response.json({ error: "Failed to save feedback" }, { status: 500 });
  }

  console.log(`[api/feedback] interview ${interviewId} marked completed`);
  return Response.json({ feedback });
}
