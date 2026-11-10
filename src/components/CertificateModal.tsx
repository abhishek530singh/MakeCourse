"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Award, CheckCircle, Download, X, Share2 } from "lucide-react";

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  studentName?: string;
}

export function CertificateModal({
  isOpen,
  onClose,
  courseTitle,
  studentName = "Course Graduate"
}: CertificateModalProps) {
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Certificate Card */}
        <div
          ref={certRef}
          className="relative overflow-hidden rounded-xl border-4 border-double border-amber-600/40 bg-gradient-to-b from-amber-50/40 to-white p-8 text-center shadow-inner dark:from-zinc-900 dark:to-zinc-950 dark:border-amber-500/30"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/30">
            <Award className="h-8 w-8" />
          </div>

          <h2 className="mt-4 text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
            Certificate of Completion
          </h2>

          <p className="mt-2 text-xs text-zinc-500">This certifies that</p>
          <p className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {studentName}
          </p>

          <p className="mt-2 text-xs text-zinc-500">has successfully mastered and completed</p>
          <p className="mx-auto mt-1 max-w-md text-base font-semibold text-brand-700 dark:text-brand-300">
            {courseTitle}
          </p>

          <div className="mt-6 flex items-center justify-between border-t border-zinc-200/80 pt-4 text-[11px] text-zinc-400 dark:border-zinc-800">
            <div>
              <p className="font-mono">Date: {currentDate}</p>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Verified Syllabus & Quizzes Passed</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Download className="h-4 w-4" />
            <span>Download / Print</span>
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-500"
          >
            Awesome!
          </button>
        </div>
      </div>
    </div>
  );
}
