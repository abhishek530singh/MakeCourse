"use client";

import { useState } from "react";
import { PlacementQuestion } from "@/lib/types";
import { CheckCircle2, Sparkles, X, FastForward, Award } from "lucide-react";

interface PlacementTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: PlacementQuestion[];
  onApplyResults: (skippableLessonIds: string[], scorePercentage: number) => void;
}

export function PlacementTestModal({
  isOpen,
  onClose,
  questions,
  onApplyResults
}: PlacementTestModalProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSelect = (questionId: string, index: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: index
    }));
  };

  const getResults = () => {
    const skippableIds: string[] = [];
    let correctCount = 0;

    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount++;
        skippableIds.push(...q.associatedLessonIds);
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    return { skippableIds: Array.from(new Set(skippableIds)), score, correctCount };
  };

  const { skippableIds, score, correctCount } = getResults();
  const allAnswered = questions.every((q) => selectedAnswers[q.id] !== undefined);

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleApply = () => {
    onApplyResults(skippableIds, score);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <FastForward className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              Placement & Diagnostic Test
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Skip what you already know and trim unnecessary hours from your schedule.
            </p>
          </div>
        </div>

        {!submitted ? (
          <div className="mt-6 space-y-6">
            <div className="rounded-xl bg-brand-50/60 p-3.5 text-xs text-brand-800 dark:bg-brand-950/40 dark:text-brand-300">
              Answer these diagnostic questions. Correct answers prove prior proficiency and will automatically trim those lessons from your study plan!
            </div>

            <div className="space-y-5">
              {questions.map((q, idx) => (
                <div key={q.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    Topic Question {idx + 1}
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {q.question}
                  </p>

                  <div className="mt-3 space-y-1.5">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[q.id] === optIdx;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelect(q.id, optIdx)}
                          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                            isSelected
                              ? "border-brand-500 bg-brand-50/70 font-medium text-brand-900 dark:bg-brand-950/50 dark:text-brand-100"
                              : "border-zinc-200 bg-zinc-50/50 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-300"
                          }`}
                        >
                          <span>{opt}</span>
                          <span className="font-mono text-[10px] text-zinc-400">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Skip Test
              </button>
              <button
                disabled={!allAnswered}
                onClick={handleSubmit}
                className={`flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-sm ${
                  allAnswered
                    ? "bg-brand-600 hover:bg-brand-500 cursor-pointer"
                    : "bg-zinc-300 opacity-60 cursor-not-allowed dark:bg-zinc-700"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Evaluate My Placement</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 text-center dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-lg font-bold text-zinc-900 dark:text-white">
                Diagnostic Score: {score}% ({correctCount}/{questions.length} Correct)
              </h3>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {skippableIds.length > 0 ? (
                  <>
                    Great job! You qualify to skip{" "}
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      {skippableIds.length} lessons
                    </span>{" "}
                    that you already understand.
                  </>
                ) : (
                  "You will benefit most from following the complete, full curriculum from Day 1."
                )}
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSubmitted(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Review Answers
              </button>
              <button
                onClick={handleApply}
                className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-500"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Apply & Customize Schedule</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
