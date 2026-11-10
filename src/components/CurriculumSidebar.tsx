"use client";

import { useEffect, useMemo, useState } from "react";
import { Course, Lesson } from "@/lib/types";
import { formatSecondsToTime, formatDurationHuman } from "@/lib/youtube";
import {
  CheckCircle2,
  Circle,
  FastForward,
  PlayCircle,
  Calendar,
  FolderTree,
  ChevronDown,
  ChevronUp,
  Search,
  Video,
  HelpCircle
} from "lucide-react";

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
  const [viewMode, setViewMode] = useState<"sections" | "schedule">("sections");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Flat lookup & numbering
  const { lessonMap, lessonIndexMap } = useMemo(() => {
    const map = new Map<string, Lesson>();
    const idxMap = new Map<string, number>();
    let counter = 1;
    course.modules.forEach((mod) => {
      mod.lessons.forEach((l) => {
        map.set(l.id, l);
        idxMap.set(l.id, l.lessonNumber || counter);
        counter++;
      });
    });
    return { lessonMap: map, lessonIndexMap: idxMap };
  }, [course.modules]);

  // Auto-expand the section containing the active lesson
  useEffect(() => {
    const activeMod = course.modules.find((m) =>
      m.lessons.some((l) => l.id === currentLessonId)
    );
    if (activeMod) {
      setExpandedSections((prev) => ({
        ...prev,
        [activeMod.id]: true
      }));
    } else if (course.modules[0]) {
      setExpandedSections((prev) => ({
        ...prev,
        [course.modules[0].id]: true
      }));
    }
  }, [currentLessonId, course.modules]);

  const totalLessons = lessonMap.size;
  const finishedCount = completedLessonIds.length + skippedLessonIds.length;
  const progressPercent = totalLessons > 0 ? Math.round((finishedCount / totalLessons) * 100) : 0;

  const allExpanded =
    course.modules.length > 0 && course.modules.every((m) => expandedSections[m.id]);

  const toggleAllSections = () => {
    const nextState = !allExpanded;
    const updated: Record<string, boolean> = {};
    course.modules.forEach((m) => {
      updated[m.id] = nextState;
    });
    setExpandedSections(updated);
  };

  const toggleSection = (modId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  return (
    <div className="flex max-h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Top Header: Udemy-style Course Content Summary */}
      <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Course content</h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {course.modules.length} sections • {totalLessons} lectures •{" "}
              {formatDurationHuman(course.totalDurationSeconds)}
            </p>
          </div>
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-mono text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            {progressPercent}%
          </span>
        </div>

        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-indigo-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Placement Test Prompt */}
        {course.placementTest && course.placementTest.length > 0 && (
          <button
            onClick={onOpenPlacementTest}
            className="mt-3 flex w-full items-center justify-between rounded-xl border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-left text-xs text-amber-900 transition-colors hover:bg-amber-100/60 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
          >
            <div className="flex items-center gap-2">
              <FastForward className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-semibold">Placement Test</p>
                <p className="text-[10px] text-amber-700 dark:text-amber-300">
                  Skip topics you already know
                </p>
              </div>
            </div>
            <span className="rounded bg-amber-200/60 px-1.5 py-0.5 text-[10px] font-bold dark:bg-amber-900/60">
              Start
            </span>
          </button>
        )}

        {/* View Switcher: Udemy Sections vs Daily Study Plan */}
        <div className="mt-3 flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          <button
            onClick={() => setViewMode("sections")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all ${
              viewMode === "sections"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <FolderTree className="h-3.5 w-3.5" />
            <span>Sections</span>
          </button>
          <button
            onClick={() => setViewMode("schedule")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all ${
              viewMode === "schedule"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Daily Plan ({course.schedule.length}d)</span>
          </button>
        </div>

        {/* Lecture Search & Expand/Collapse All */}
        {viewMode === "sections" && (
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50/70 px-2.5 focus-within:border-brand-500 dark:border-zinc-800 dark:bg-zinc-950">
              <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lectures..."
                className="w-full bg-transparent py-1.5 text-xs text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
              />
            </div>
            <button
              onClick={toggleAllSections}
              className="shrink-0 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              {allExpanded ? "Collapse" : "Expand"}
            </button>
          </div>
        )}
      </div>

      {/* Curriculum List (Scrollable) */}
      <div className="flex-1 divide-y divide-zinc-200/80 overflow-y-auto dark:divide-zinc-800">
        {viewMode === "sections" ? (
          course.modules.map((mod) => {
            const matchingLessons = normalizedQuery
              ? mod.lessons.filter(
                  (l) =>
                    l.title.toLowerCase().includes(normalizedQuery) ||
                    l.description.toLowerCase().includes(normalizedQuery)
                )
              : mod.lessons;

            if (normalizedQuery && matchingLessons.length === 0) return null;

            const isExpanded = normalizedQuery ? true : !!expandedSections[mod.id];
            const sectionDoneCount = mod.lessons.filter(
              (l) => completedLessonIds.includes(l.id) || skippedLessonIds.includes(l.id)
            ).length;
            const sectionDurationSec = mod.lessons.reduce((acc, l) => acc + l.durationSeconds, 0);

            return (
              <div key={mod.id} className="bg-white dark:bg-zinc-900">
                {/* Accordion Header */}
                <button
                  onClick={() => toggleSection(mod.id)}
                  className="flex w-full items-start justify-between gap-2 bg-zinc-50/80 px-4 py-3 text-left transition-colors hover:bg-zinc-100/80 dark:bg-zinc-950/40 dark:hover:bg-zinc-800/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {mod.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                      {sectionDoneCount} / {mod.lessons.length} | {formatDurationHuman(sectionDurationSec)}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                  ) : (
                    <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                  )}
                </button>

                {/* Accordion Body */}
                {isExpanded && (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {matchingLessons.map((lesson) => renderLessonItem(lesson))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="space-y-4 p-3">
            {course.schedule.map((day) => (
              <div key={day.dayNumber} className="space-y-1">
                <div className="flex items-center justify-between px-2 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  <span>{day.dateLabel || `Day ${day.dayNumber}`}</span>
                  <span className="font-mono text-[10px] text-zinc-400">
                    ~{day.estimatedMinutes}m
                  </span>
                </div>
                <div className="overflow-hidden rounded-xl border border-zinc-100 divide-y divide-zinc-100 dark:border-zinc-800 dark:divide-zinc-800">
                  {day.lessonIds.map((lid) => {
                    const lesson = lessonMap.get(lid);
                    if (!lesson) return null;
                    return renderLessonItem(lesson);
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  function renderLessonItem(lesson: Lesson) {
    const isCurrent = lesson.id === currentLessonId;
    const isCompleted = completedLessonIds.includes(lesson.id);
    const isSkipped = skippedLessonIds.includes(lesson.id);
    const num = lessonIndexMap.get(lesson.id);
    const mins = Math.max(1, Math.round(lesson.durationSeconds / 60));

    return (
      <div
        key={lesson.id}
        className={`group flex items-start gap-2.5 px-3.5 py-2.5 text-xs transition-colors ${
          isCurrent
            ? "border-l-4 border-l-brand-600 bg-brand-50/70 dark:border-l-brand-400 dark:bg-brand-950/40"
            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
        }`}
      >
        {/* Checkbox to toggle completion */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(lesson.id);
          }}
          title={isCompleted ? "Mark incomplete" : "Mark completed"}
          className="mt-0.5 shrink-0 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400"
        >
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : isSkipped ? (
            <FastForward className="h-4 w-4 text-amber-500" />
          ) : (
            <Circle className="h-4 w-4 text-zinc-300 group-hover:text-zinc-400 dark:text-zinc-600" />
          )}
        </button>

        {/* Lesson Click Area */}
        <div
          onClick={() => onSelectLesson(lesson)}
          className="min-w-0 flex-1 cursor-pointer"
        >
          <p
            className={`leading-snug ${
              isCurrent
                ? "font-semibold text-brand-900 dark:text-brand-100"
                : "font-medium text-zinc-800 dark:text-zinc-200"
            }`}
          >
            {num}. {lesson.title}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1">
              {isCurrent ? (
                <PlayCircle className="h-3 w-3 text-brand-600 dark:text-brand-400" />
              ) : (
                <Video className="h-3 w-3 text-zinc-400" />
              )}
              <span>{mins}min</span>
            </span>

            {lesson.videoId === course.originalVideoId && (
              <span className="font-mono text-[10px] text-zinc-400">
                ({formatSecondsToTime(lesson.startSeconds)}–{formatSecondsToTime(lesson.endSeconds)})
              </span>
            )}

            {lesson.quizzes && lesson.quizzes.length > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <HelpCircle className="h-2.5 w-2.5" />
                Quiz
              </span>
            )}

            {isSkipped && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                Mastered
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
}
