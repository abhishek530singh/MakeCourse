"use client";

import { useState } from "react";
import { QuizQuestion } from "@/lib/types";
import { CheckCircle2, XCircle, RotateCcw, Sparkles, HelpCircle } from "lucide-react";
import { formatSecondsToTime } from "@/lib/youtube";

interface QuizCardProps {
  questions: QuizQuestion[];
  onReplayMoment: (timestampSeconds: number) => void;
  onQuizCompleted?: (scorePercentage: number) => void;
}

export function QuizCard({ questions, onReplayMoment, onQuizCompleted }: QuizCardProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (questionId: string, optionIndex: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });
    return Math.round((correctCount / questions.length) * 100);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const score = calculateScore();
    onQuizCompleted?.(score);
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
  };

  const allAnswered = questions.every((q) => selectedAnswers[q.id] !== undefined);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
            <HelpCircle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
              Lesson Comprehension Check
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {questions.length} questions • Test your understanding & review timestamped moments
            </p>
          </div>
        </div>

        {submitted && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              Score: {calculateScore()}%
            </span>
            <button
              onClick={handleReset}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {questions.map((q, idx) => {
          const userSelected = selectedAnswers[q.id];
          const isCorrect = userSelected === q.correctIndex;
          const showResult = submitted;

          return (
            <div
              key={q.id}
              className={`rounded-xl border p-5 transition-all ${
                showResult
                  ? isCorrect
                    ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                    : "border-rose-200 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  <span className="mr-2 font-mono text-xs font-bold text-zinc-400">
                    Q{idx + 1}.
                  </span>
                  {q.question}
                </h4>

                {showResult && (
                  <div className="shrink-0">
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" /> Correct
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                        <XCircle className="h-4 w-4" /> Missed
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="mt-3.5 space-y-2">
                {q.options.map((option, optIdx) => {
                  const isThisSelected = userSelected === optIdx;
                  const isThisCorrectAnswer = q.correctIndex === optIdx;

                  let optionStyle = "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300";

                  if (isThisSelected && !showResult) {
                    optionStyle = "border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 text-brand-900 dark:text-brand-100 font-medium ring-1 ring-brand-500";
                  }

                  if (showResult) {
                    if (isThisCorrectAnswer) {
                      optionStyle = "border-emerald-500 bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100 font-semibold ring-1 ring-emerald-500";
                    } else if (isThisSelected && !isThisCorrectAnswer) {
                      optionStyle = "border-rose-400 bg-rose-100/70 dark:bg-rose-900/40 text-rose-900 dark:text-rose-100";
                    } else {
                      optionStyle = "opacity-60 border-zinc-200 dark:border-zinc-800 text-zinc-500";
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={submitted}
                      onClick={() => handleSelect(q.id, optIdx)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-xs transition-all ${optionStyle}`}
                    >
                      <span>{option}</span>
                      <span className="font-mono text-[10px] uppercase text-zinc-400">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Feedback and Replay the Moment Button */}
              {showResult && (
                <div className="mt-4 border-t border-zinc-200/80 pt-3 dark:border-zinc-800">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">Explanation: </span>
                    {q.explanation}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => onReplayMoment(q.replayTimestamp)}
                      className="group flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-sm transition-all hover:bg-brand-100 hover:shadow dark:border-brand-800 dark:bg-brand-950 dark:text-brand-300 dark:hover:bg-brand-900"
                    >
                      <RotateCcw className="h-3.5 w-3.5 transition-transform group-hover:-rotate-45" />
                      <span>Replay the Moment</span>
                      <span className="rounded bg-brand-200/70 px-1.5 py-0.5 font-mono text-[10px] dark:bg-brand-800">
                        @{formatSecondsToTime(q.replayTimestamp)}
                      </span>
                    </button>

                    <span className="text-[11px] text-zinc-400">
                      Jumps video player directly to this concept
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all ${
              allAnswered
                ? "bg-brand-600 hover:bg-brand-500 hover:shadow-brand-500/25 cursor-pointer"
                : "bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed opacity-60"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Check My Answers</span>
          </button>
        </div>
      )}
    </div>
  );
}

