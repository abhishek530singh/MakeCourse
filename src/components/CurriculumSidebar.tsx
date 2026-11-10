"use client";

import { useState } from "react";
import { Course, Lesson } from "@/lib/types";
import { formatSecondsToTime, formatDurationHuman } from "@/lib/youtube";
import { CheckCircle2, Circle, FastForward, PlayCircle, Calendar, FolderTree } from "lucide-react";

interface CurriculumSidebarProps {
  course: Course;
  currentLessonId: string;
  completedLessonIds: string[];
  skippedLessonIds: string[];
  onSelectLesson: (lesson: Lesson) => void;
  onToggleComplete: (lessonId: string) => void;
  onOpenPlacementTest: () => void;
}

export function CurriculumSidebar({
  course,
  currentLessonId,
  completedLessonIds,
  skippedLessonIds,
  onSelectLesson,
  onToggleComplete,
  onOpenPlacementTest
}: CurriculumSidebarProps) {
  const [viewMode, setViewMode] = useState<"schedule" | "modules">("schedule");

  // Flat lookup of all lessons
  const lessonMap = new Map<string, Lesson>();
  course.modules.forEach((mod) => {
    mod.lessons.forEach((l) => lessonMap.set(l.id, l));
  });

  const totalLessons = lessonMap.size;
  const finishedCount = completedLessonIds.length + skippedLessonIds.length;
  const progressPercent = totalLessons > 0 ? Math.round((finishedCount / totalLessons) * 100) : 0;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Top Header: Progress & Placement test CTA */}
      <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-zinc-700 dark:text-zinc-300">Course Progress</span>
          <span className="font-mono text-brand-600 dark:text-brand-400">{progressPercent}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-indigo-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-zinc-400">
          <span>{finishedCount} of {totalLessons} done</span>
          <span>{formatDurationHuman(course.totalDurationSeconds)}</span>
        </div>

        {/* Placement Test Prompt */}
        {course.placementTest && course.placementTest.length > 0 && (
          <button
            onClick={onOpenPlacementTest}
            className="mt-3.5 flex w-full items-center justify-between rounded-xl border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-left text-xs text-amber-900 transition-colors hover:bg-amber-100/60 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
          >
            <div className="flex items-center gap-2">
              <FastForward className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-semibold">Diagnostic Placement</p>
                <p className="text-[10px] text-amber-700 dark:text-amber-300">Test prior knowledge to skip lessons</p>
              </div>
            </div>
            <span className="rounded bg-amber-200/60 px-1.5 py-0.5 text-[10px] font-bold dark:bg-amber-900/60">
              Start
            </span>
          </button>
        )}

        {/* View Toggle */}
        <div className="mt-4 flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          <button
            onClick={() => setViewMode("schedule")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1 text-xs font-medium transition-all ${
              viewMode === "schedule"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Daily Plan</span>
          </button>
          <button
            onClick={() => setViewMode("modules")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1 text-xs font-medium transition-all ${
              viewMode === "modules"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <FolderTree className="h-3.5 w-3.5" />
            <span>Modules</span>
          </button>
        </div>
      </div>

      {/* Curriculum List (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {viewMode === "schedule" ? (
          // Schedule view: Day 1, Day 2, etc.
          course.schedule.map((day) => (
            <div key={day.dayNumber} className="space-y-1.5">
              <div className="flex items-center justify-between px-2 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                <span>{day.dateLabel || `Day ${day.dayNumber}`}</span>
                <span className="font-mono text-[10px] text-zinc-400">~{day.estimatedMinutes}m</span>
              </div>

              <div className="space-y-1">
                {day.lessonIds.map((lid) => {
                  const lesson = lessonMap.get(lid);
                  if (!lesson) return null;
                  return renderLessonItem(lesson);
                })}
              </div>
            </div>
          ))
        ) : (
          // Modules view
          course.modules.map((mod) => (
            <div key={mod.id} className="space-y-1.5">
              <div className="px-2 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                {mod.title}
              </div>
              <div className="space-y-1">
                {mod.lessons.map((lesson) => renderLessonItem(lesson))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  function renderLessonItem(lesson: Lesson) {
    const isCurrent = lesson.id === currentLessonId;
    const isCompleted = completedLessonIds.includes(lesson.id);
    const isSkipped = skippedLessonIds.includes(lesson.id);

    return (
      <div
        key={lesson.id}
        className={`group flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-all ${
          isCurrent
            ? "bg-brand-50/80 font-medium text-brand-900 ring-1 ring-brand-500/30 dark:bg-brand-950/50 dark:text-brand-100"
            : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
        }`}
      >
        <div
          onClick={() => onSelectLesson(lesson)}
          className="flex flex-1 cursor-pointer items-center gap-2 overflow-hidden"
        >
          {isCurrent ? (
            <PlayCircle className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400 animate-pulse" />
          ) : isCompleted ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          ) : isSkipped ? (
            <FastForward className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          ) : (
            <Circle className="h-4 w-4 shrink-0 text-zinc-300 dark:text-zinc-600" />
          )}

          <div className="flex flex-col truncate">
            <span className="truncate">{lesson.title}</span>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-400">
              <span>{formatSecondsToTime(lesson.durationSeconds)}</span>
              {isSkipped && (
                <span className="rounded bg-amber-100 px-1 text-[9px] text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  Skipped (Mastered)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Checkbox to mark complete manually */}
        <button
          onClick={() => onToggleComplete(lesson.id)}
          title={isCompleted ? "Mark incomplete" : "Mark completed"}
          className="ml-2 shrink-0 p-1 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400"
        >
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <Circle className="h-4 w-4 opacity-40 hover:opacity-100" />
          )}
        </button>
      </div>
    );
  }
}
