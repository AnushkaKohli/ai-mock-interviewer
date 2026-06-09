import type { InterviewLevel, InterviewType } from "@/types";

interface CreateVapiAssistantParams {
  role: string;
  level: InterviewLevel;
  type: InterviewType;
  questions: string[];
  interviewId: string;
}

export async function createVapiAssistant(params: CreateVapiAssistantParams) {
  const { role, level, type, questions, interviewId } = params;
  console.log(`[vapi] createVapiAssistant — role=${role} level=${level} type=${type} interviewId=${interviewId}`);

  const response = await fetch("https://api.vapi.ai/assistant", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `${level} ${role} Interviewer`,
      firstMessage:
        "Hello! I'll be your interviewer today. Let's get started — can you briefly introduce yourself?",
      firstMessageMode: "assistant-speaks-first",

      model: {
        provider: "groq",
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a professional interviewer conducting a ${level} ${role} ${type} interview.

Your interview structure:
1. Greet the candidate warmly and ask them to introduce themselves.
2. Ask these questions ONE AT A TIME, in order:
   ${questions.map((q, i) => `${i + 1}. ${q}`).join("\n   ")}
3. After each answer, give a brief natural reaction ("Got it", "Interesting", "That's helpful") and optionally ask one short follow-up if the answer was vague.
4. After all questions, thank the candidate warmly and close the interview.

Rules:
- NEVER ask more than one question at a time.
- Do not give scores or feedback during the interview.
- Be professional but warm and conversational.
- If the candidate goes off-topic, gently redirect them back.
- Keep responses concise — this is voice, not text.`,
          },
        ],
      },

      voice: {
        provider: "11labs",
        voiceId: "21m00Tcm4TlvDq8ikWAM",
      },

      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en-US",
      },

      backchannelingEnabled: true,
      backgroundDenoisingEnabled: true,
      maxDurationSeconds: 1800,

      serverUrl: `${process.env.BASE_URL}/api/vapi-webhook`,

      metadata: {
        interviewId,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[vapi] createVapiAssistant failed — status=${response.status} body=${error}`);
    throw new Error(`Failed to create Vapi assistant: ${error}`);
  }

  const data = await response.json();
  console.log(`[vapi] createVapiAssistant succeeded — assistantId=${data.id}`);
  return data.id as string;
}
