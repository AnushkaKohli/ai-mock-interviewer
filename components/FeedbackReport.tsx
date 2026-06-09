"use client";

import { useState } from "react";
import type { FeedbackReport, TranscriptEntry } from "@/types";

function ScoreCard ({ label, score }: { label: string; score: number }) {
  const color =
    score >= 8 ? "bg-emerald-500" : score >= 6 ? "bg-[#3b82f6]" : "bg-amber-500";

  return (
    <div className="bg-[#0d1526] border border-[#1e2a3a] rounded-xl p-4">
      <p className="text-slate-400 text-xs mb-2">{label}</p>
      <p className="text-white font-mono text-2xl font-bold mb-2">
        {score}
        <span className="text-slate-500 text-base font-normal">/10</span>
      </p>
      <div className="h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
    </div>
  );
}

export default function FeedbackReportComponent ({
  feedback,
  transcript,
}: {
  feedback: FeedbackReport;
  transcript: TranscriptEntry[] | null;
}) {
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScoreCard label="Overall" score={feedback.overallScore} />
        <ScoreCard label="Communication" score={feedback.communicationScore} />
        <ScoreCard label="Technical" score={feedback.technicalScore} />
        <ScoreCard label="Problem Solving" score={feedback.problemSolvingScore} />
      </div>

      <div className="bg-[#0d1526] border border-[#1e2a3a] rounded-xl p-5">
        <p className="text-slate-300 text-sm leading-relaxed">{feedback.summary}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[#0d1526] border border-[#1e2a3a] rounded-xl p-5">
          <h3 className="text-emerald-400 font-semibold text-sm mb-3 flex items-center gap-2">
            <span>✓</span> Strengths
          </h3>
          <ul className="space-y-2">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="text-slate-300 text-sm flex gap-2">
                <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#0d1526] border border-[#1e2a3a] rounded-xl p-5">
          <h3 className="text-amber-400 font-semibold text-sm mb-3 flex items-center gap-2">
            <span>⚠</span> Areas to Improve
          </h3>
          <ul className="space-y-2">
            {feedback.improvements.map((s, i) => (
              <li key={i} className="text-slate-300 text-sm flex gap-2">
                <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-[#0d1526] border border-[#1e2a3a] rounded-xl overflow-hidden">
        <h3 className="text-white font-semibold text-sm px-5 py-4 border-b border-[#1e2a3a]">
          Per-Question Breakdown
        </h3>
        <div className="divide-y divide-[#1e2a3a]">
          {feedback.questionFeedback.map((qf, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenQuestion(openQuestion === i ? null : i)}
                className="w-full text-left px-5 py-3 flex items-center justify-between gap-3 hover:bg-[#1e2a3a]/50 transition-colors"
              >
                <span className="text-slate-300 text-sm">{qf.question}</span>
                <span className="text-slate-500 text-xs shrink-0">
                  {openQuestion === i ? "▲" : "▼"}
                </span>
              </button>
              {openQuestion === i && (
                <div className="px-5 pb-4 text-slate-400 text-sm leading-relaxed bg-[#1e2a3a]/20">
                  {qf.assessment}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {transcript && transcript.length > 0 && (
        <div className="bg-[#0d1526] border border-[#1e2a3a] rounded-xl overflow-hidden">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-[#1e2a3a]/50 transition-colors"
          >
            <span className="text-white font-semibold text-sm">Full Transcript</span>
            <span className="text-slate-500 text-xs">{showTranscript ? "▲ Hide" : "▼ Show"}</span>
          </button>
          {showTranscript && (
            <div className="px-5 pb-5 space-y-3 border-t border-[#1e2a3a]">
              {transcript.map((entry, i) => (
                <div key={i} className="flex gap-3">
                  <span
                    className={`text-xs font-mono w-16 shrink-0 pt-1 ${entry.role === "bot" ? "text-[#3b82f6]" : "text-emerald-400"
                      }`}
                  >
                    {entry.role === "bot" ? "AI" : "You"}
                  </span>
                  <span className="text-slate-300 text-sm">{entry.content}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
