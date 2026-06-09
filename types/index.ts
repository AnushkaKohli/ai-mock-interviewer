export type InterviewLevel = "Junior" | "Mid" | "Senior";
export type InterviewType = "technical" | "behavioural" | "mixed";
export type InterviewStatus = "pending" | "active" | "completed";
export type InterviewDifficulty = "Warmup" | "Standard" | "Tough";
export type InterviewVoice = "ava" | "cole" | "rhea";

export interface TranscriptEntry {
  role: "bot" | "user";
  content: string;
  timestamp?: string;
}

export interface FeedbackReport {
  overallScore: number;
  communicationScore: number;
  technicalScore: number;
  problemSolvingScore: number;
  strengths: string[];
  improvements: string[];
  summary: string;
  nextSteps?: string[];
  questionFeedback: {
    question: string;
    assessment: string;
    score?: number;
  }[];
}

export interface Interview {
  id: string;
  vapi_assistant_id: string | null;
  vapi_call_id: string | null;
  role: string;
  level: InterviewLevel;
  type: InterviewType;
  questions: string[];
  status: InterviewStatus;
  transcript: TranscriptEntry[] | null;
  feedback: FeedbackReport | null;
  duration_seconds: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface HistoryEntry {
  role: string;
  score: number;
  answered: number;
  total: number;
  date: string;
}
