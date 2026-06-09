import Groq from "groq-sdk";
import type {
  FeedbackReport,
  InterviewLevel,
  InterviewType,
  TranscriptEntry,
} from "@/types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function parseJD(
  jd: string,
): Promise<{ role: string; skills: string[] }> {
  console.log(`[groq] parseJD — length=${jd.length}`);
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Extract the job title/role and up to 6 key skills from this job description. Return ONLY valid JSON, no markdown:
{"role": "...", "skills": ["...", "..."]}

Job description:
${jd.slice(0, 2000)}`,
        },
      ],
      temperature: 0.1,
    });
    const raw =
      completion.choices[0].message.content ?? '{"role":"Unknown","skills":[]}';
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const result = JSON.parse(cleaned) as { role: string; skills: string[] };
    console.log(
      `[groq] parseJD — role=${result.role} skills=${result.skills.length}`,
    );
    return result;
  } catch (err) {
    console.error(`[groq] parseJD failed, falling back:`, err);
    const firstLine =
      jd
        .split("\n")
        .map((l) => l.trim())
        .find(Boolean) ?? "Interview";
    const role = firstLine.split("—")[0].split("-")[0].trim().slice(0, 80);
    return { role, skills: [] };
  }
}

export async function generateQuestions(
  role: string,
  level: InterviewLevel,
  type: InterviewType,
  count = 5,
  jd?: string,
): Promise<string[]> {
  console.log(
    `[groq] generateQuestions — role=${role} level=${level} type=${type} count=${count}`,
  );
  const context = jd
    ? `\n\nJob description context:\n${jd.slice(0, 1500)}`
    : "";
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Generate exactly ${count} interview questions for a ${level} ${role} position. Interview type: ${type}.${context}

Return ONLY a JSON array of ${count} strings — no markdown, no explanation, no extra text.
Example format: ["Question 1?", "Question 2?"]`,
        },
      ],
      temperature: 0.7,
    });

    const raw = completion.choices[0].message.content ?? "[]";
    console.log(`[groq] generateQuestions raw response:`, raw);
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const questions = JSON.parse(cleaned) as string[];
    console.log(
      `[groq] generateQuestions parsed ${questions.length} questions`,
    );
    return questions;
  } catch (err) {
    console.error(`[groq] generateQuestions failed:`, err);
    throw err;
  }
}

export async function generateFeedback(params: {
  role: string;
  level: InterviewLevel;
  questions: string[];
  transcript: TranscriptEntry[];
}): Promise<FeedbackReport> {
  const { role, level, questions, transcript } = params;
  console.log(
    `[groq] generateFeedback — role=${role} level=${level} transcriptEntries=${transcript.length}`,
  );

  const transcriptText = transcript
    .map(
      (t) => `${t.role === "bot" ? "Interviewer" : "Candidate"}: ${t.content}`,
    )
    .join("\n");

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "user",
          content: `You are an expert interviewer. Analyze this interview transcript for a ${level} ${role} position.

Questions asked:
${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Transcript:
${transcriptText}

Return ONLY valid JSON (no markdown, no backticks, no explanation) with this exact structure:
{
  "overallScore": <1-10>,
  "communicationScore": <1-10>,
  "technicalScore": <1-10>,
  "problemSolvingScore": <1-10>,
  "strengths": ["...", "...", "..."],
  "improvements": ["...", "...", "..."],
  "summary": "2-3 sentences summarising the candidate's overall performance.",
  "nextSteps": ["Actionable tip 1", "Actionable tip 2", "Actionable tip 3"],
  "questionFeedback": [
    { "question": "...", "assessment": "...", "score": <1-10> }
  ]
}`,
        },
      ],
      temperature: 0.3,
    });

    const raw = completion.choices[0].message.content ?? "{}";
    console.log(`[groq] generateFeedback raw response:`, raw);
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const feedback = JSON.parse(cleaned) as FeedbackReport;
    console.log(
      `[groq] generateFeedback parsed — overallScore=${feedback.overallScore}`,
    );
    return feedback;
  } catch (err) {
    console.error(`[groq] generateFeedback failed:`, err);
    throw err;
  }
}
