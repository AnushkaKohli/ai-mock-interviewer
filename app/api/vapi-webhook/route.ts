import { supabase } from "@/lib/supabase";
import { generateFeedback } from "@/lib/groq";
import type { TranscriptEntry } from "@/types";

async function processFeedback(
  interviewId: string,
  transcript: TranscriptEntry[],
  durationSeconds: number | null,
) {
  console.log("ENTERED PROCESS FEEDBACK");
  console.log("TRANSCRIPT: ", transcript);
  console.log("interviewId: ", interviewId);

  await supabase
    .from("interviews")
    .update({
      transcript,
      duration_seconds: Math.floor(Number(durationSeconds)),
    })
    .eq("id", interviewId);
  const { data: interview, error: fetchError } = await supabase
    .from("interviews")
    .select("role, level, questions")
    .eq("id", interviewId)
    .single();

  if (fetchError || !interview) {
    console.error(
      `[api/vapi-webhook] failed to fetch interview for feedback:`,
      fetchError,
    );
    return;
  }

  console.log(
    `[api/vapi-webhook] generating feedback for interviewId=${interviewId}`,
  );
  try {
    const feedback = await generateFeedback({
      role: interview.role,
      level: interview.level,
      questions: interview.questions,
      transcript,
    });
    console.log(
      `[api/vapi-webhook] feedback generated — overallScore=${feedback.overallScore}`,
    );

    const { error: fbError } = await supabase
      .from("interviews")
      .update({
        feedback,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", interviewId);

    if (fbError)
      console.error(
        `[api/vapi-webhook] supabase feedback update failed:`,
        fbError,
      );
    else
      console.log(
        `[api/vapi-webhook] interview ${interviewId} marked completed`,
      );
  } catch (err) {
    console.error(`[api/vapi-webhook] generateFeedback threw:`, err);
  }
}

export async function POST(request: Request) {
  // const body = sampleResponseBody;
  const body = await request.json();
  const { message } = body;
  const { type, call, artifact, durationSeconds, assistant } = message ?? {};
  console.log(
    `[api/vapi-webhook] received event type=${type} callId=${call?.id}`,
  );

  switch (type) {
    case "status-update":
      // console.log("STATUS UPADTE BODY: ", JSON.stringify(body, null, 2));

      console.log(`[api/vapi-webhook] call ${call?.id}: ${call?.status}`);

      if (call?.status === "in-progress") {
        const interviewId = call?.metadata?.interviewId;
        if (!interviewId) {
          console.warn(
            `[api/vapi-webhook] status-update in-progress missing interviewId in metadata`,
          );
        } else {
          console.log(
            `[api/vapi-webhook] call in-progress — interviewId=${interviewId} callId=${call.id}`,
          );
          const { error } = await supabase
            .from("interviews")
            .update({ status: "active", vapi_call_id: call.id })
            .eq("id", interviewId);
          if (error)
            console.error(
              `[api/vapi-webhook] status-update supabase update failed:`,
              error,
            );
        }
      }
      break;

    case "transcript":
      // console.log("TRANSCRIPT BODY: ", JSON.stringify(body, null, 2));

      console.log(`[api/vapi-webhook] ${message.role}: ${message.transcript}`);
      break;

    case "end-of-call-report": {
      // console.log("BODY: ", JSON.stringify(body, null, 2));
      // console.log("END OF CALL REPORT BODY: ", JSON.stringify(body, null, 2));

      const interviewId = assistant?.metadata?.interviewId;
      if (!interviewId) {
        console.warn(
          `[api/vapi-webhook] end-of-call-report missing interviewId`,
        );
      }
      console.log(
        `[api/vapi-webhook] end-of-call-report — interviewId=${interviewId} duration=${durationSeconds}s`,
      );

      let transcript: TranscriptEntry[] = [];
      if (artifact?.messages?.length) {
        transcript = artifact.messages
          .filter(
            (m: { role: string }) => m.role === "bot" || m.role === "user",
          )
          .map((m: { role: string; content?: string; message?: string }) => ({
            role: m.role as "bot" | "user",
            content: m.content ?? m.message ?? "",
          }));
        console.log(
          `[api/vapi-webhook] parsed ${transcript.length} transcript entries from artifact.messages`,
        );
      } else if (artifact?.transcript) {
        transcript = (artifact.transcript as string)
          .split("\n")
          .map((line: string) => {
            const isAssistant = line.startsWith("AI:");
            return {
              role: isAssistant ? ("bot" as const) : ("user" as const),
              content: line.replace(/^(AI Interviewer:|Candidate:)\s*/, ""),
            };
          });
        console.log(
          `[api/vapi-webhook] parsed ${transcript.length} transcript entries from raw transcript string`,
        );
      } else {
        console.warn(`[api/vapi-webhook] no transcript data found in payload`);
      }

      // Respond to Vapi immediately, then process feedback in the background
      // so we don't hit Vapi's webhook response timeout
      void processFeedback(interviewId, transcript, durationSeconds ?? null);
      break;
    }

    case "hang":
      console.warn(`[api/vapi-webhook] hang event — callId=${call?.id}`);
      break;

    default:
      console.log(`[api/vapi-webhook] unhandled event type=${type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
