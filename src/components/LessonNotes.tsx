"use client";

import { Check, Copy, BookOpen, Lightbulb } from "lucide-react";
import { useState } from "react";

interface LessonNotesProps {
  notes: string;
  keyTakeaways: string[];
  lessonTitle: string;
}

export function LessonNotes({ notes, keyTakeaways, lessonTitle }: LessonNotesProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${lessonTitle}\n\nKey Takeaways:\n${keyTakeaways.join("\n")}\n\n${notes}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <BookOpen className="h-4 w-4" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
            AI Study Notes & Summary
          </h3>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Notes</span>
            </>
          )}
        </button>
      </div>

      {/* Key Takeaways Card */}
      {keyTakeaways && keyTakeaways.length > 0 && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
            <Lightbulb className="h-4 w-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Core Takeaways
            </h4>
          </div>
          <ul className="mt-2.5 space-y-1.5 text-xs text-amber-950 dark:text-amber-200">
            {keyTakeaways.map((takeaway, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Formatted Notes */}
      <div className="prose prose-zinc prose-sm dark:prose-invert max-w-none space-y-4 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
        <div className="whitespace-pre-wrap font-sans">
          {notes}
        </div>
      </div>
    </div>
  );
}
