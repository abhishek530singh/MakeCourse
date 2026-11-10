"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  HelpCircle,
  Award,
  CheckCircle2,
  FastForward,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ListVideo,
  FileText,
  Info,
  Clock,
  ExternalLink,
  Search,
  Plus,
  Trash2,
  PanelRightClose,
  PanelRightOpen,
  Circle,
  PlayCircle,
  Video
} from "lucide-react";
import { Course, Lesson, PersonalNote } from "@/lib/types";
import { DEMO_COURSES } from "@/lib/demoCourses";
import { formatDurationHuman, formatSecondsToTime } from "@/lib/youtube";
import { CoursePlayer } from "@/components/CoursePlayer";
import { LessonNotes } from "@/components/LessonNotes";
import { QuizCard } from "@/components/QuizCard";
import { CurriculumSidebar } from "@/components/CurriculumSidebar";
import { PlacementTestModal } from "@/components/PlacementTestModal";
import { CertificateModal } from "@/components/CertificateModal";

type StudyTab = "curriculum" | "overview" | "transcript" | "notes" | "quiz";

export default function CourseStudyRoomPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;

  const [course, setCourse] = useState<Course | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<StudyTab>("curriculum");
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [skippedLessonIds, setSkippedLessonIds] = useState<string[]>([]);
  const [personalNotes, setPersonalNotes] = useState<PersonalNote[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [transcriptQuery, setTranscriptQuery] = useState("");
  const [curriculumSearch, setCurriculumSearch] = useState("");
  const [expandedOverviewSections, setExpandedOverviewSections] = useState<Record<string, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPlacementOpen, setIsPlacementOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  const playerRef = useRef<{ seekTo: (seconds: number) => void } | null>(null);

  // Load course and progress
  useEffect(() => {
    let foundCourse: Course | undefined = DEMO_COURSES.find((c) => c.id === courseId);

    if (!foundCourse && typeof window !== "undefined") {
      const saved = localStorage.getItem(`course_${courseId}`);
      if (saved) {
        try {
          foundCourse = JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved course:", e);
        }
      }
    }

    if (!foundCourse) {
      setNotFound(true);
      return;
    }

    setCourse(foundCourse);

    // Load saved progress
    let savedCurrentId: string | undefined;
    if (typeof window !== "undefined") {
      const savedProgress = localStorage.getItem(`progress_${courseId}`);
      if (savedProgress) {
        try {
          const parsed = JSON.parse(savedProgress);
          setCompletedLessonIds(parsed.completedLessonIds || []);
          setSkippedLessonIds(parsed.skippedLessonIds || []);
          setPersonalNotes(parsed.personalNotes || []);
          savedCurrentId = parsed.currentLessonId;
        } catch {
          // ignore
        }
      }
    }

    const allLessons = foundCourse.modules.flatMap((m) => m.lessons);
    const initialLesson =
      (savedCurrentId && allLessons.find((l) => l.id === savedCurrentId)) ||
      allLessons[0];
    if (initialLesson) {
      setCurrentLesson(initialLesson);
      setCurrentVideoTime(initialLesson.startSeconds);
    }

    // Expand first 2 sections in the main Udemy Course Content tab by default
    const initialExpanded: Record<string, boolean> = {};
    foundCourse.modules.slice(0, 2).forEach((m) => {
      initialExpanded[m.id] = true;
    });
    setExpandedOverviewSections(initialExpanded);
  }, [courseId]);

  const persistProgress = (
    completed: string[],
    skipped: string[],
    notes: PersonalNote[],
    activeLessonId?: string
  ) => {
    setCompletedLessonIds(completed);
    setSkippedLessonIds(skipped);
    setPersonalNotes(notes);
    if (typeof window !== "undefined" && course) {
      try {
        localStorage.setItem(
          `progress_${course.id}`,
          JSON.stringify({
            completedLessonIds: completed,
            skippedLessonIds: skipped,
            personalNotes: notes,
            currentLessonId: activeLessonId || currentLesson?.id
          })
        );
      } catch {
        // ignore storage limits
      }
    }
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setCurrentVideoTime(lesson.startSeconds);
    persistProgress(completedLessonIds, skippedLessonIds, personalNotes, lesson.id);
    if (course) {
      const mod = course.modules.find((m) => m.lessons.some((l) => l.id === lesson.id));
      if (mod) {
        setExpandedOverviewSections((prev) => ({ ...prev, [mod.id]: true }));
      }
    }
  };

  const handleToggleComplete = (lessonId: string) => {
    const next = completedLessonIds.includes(lessonId)
      ? completedLessonIds.filter((id) => id !== lessonId)
      : [...completedLessonIds, lessonId];
    persistProgress(next, skippedLessonIds, personalNotes);

    if (course) {
      const totalCount = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
      if (next.length + skippedLessonIds.length >= totalCount) {
        setIsCertificateOpen(true);
      }
    }
  };

  const handleApplyPlacementResults = (skippableIds: string[]) => {
    const merged = Array.from(new Set([...skippedLessonIds, ...skippableIds]));
    persistProgress(completedLessonIds, merged, personalNotes);
  };

  const handleReplayMoment = (timestampSeconds: number) => {
    playerRef.current?.seekTo(timestampSeconds);
    window.scrollTo({ top: 70, behavior: "smooth" });
  };

  const handleAddPersonalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteDraft.trim() || !currentLesson) return;
    const newNote: PersonalNote = {
      id: `note-${Date.now()}`,
      lessonId: currentLesson.id,
      timestampSeconds: currentVideoTime,
      content: noteDraft.trim(),
      createdAt: new Date().toISOString()
    };
    const nextNotes = [newNote, ...personalNotes];
    persistProgress(completedLessonIds, skippedLessonIds, nextNotes);
    setNoteDraft("");
  };

  const handleDeletePersonalNote = (noteId: string) => {
    const nextNotes = personalNotes.filter((n) => n.id !== noteId);
    persistProgress(completedLessonIds, skippedLessonIds, nextNotes);
  };

  const allLessons = useMemo(
    () => (course ? course.modules.flatMap((m) => m.lessons) : []),
    [course]
  );
  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson?.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1]
      : null;

  if (notFound) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Course Not Found</h2>
        <p className="mt-2 max-w-md text-xs text-zinc-500">
          This generated course is not in your browser storage. Paste the YouTube link again on the home page to rebuild it.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-500"
        >
          Back to Course Generator
        </Link>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        <h2 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">
          Loading Udemy-Style Workspace...
        </h2>
        <p className="mt-1 text-xs text-zinc-500">Preparing sections, transcript cues & quizzes.</p>
      </div>
    );
  }

  const totalLessonsCount = allLessons.length;
  const completedCount = completedLessonIds.length + skippedLessonIds.length;
  const currentLessonNotes = personalNotes.filter((n) => n.lessonId === currentLesson.id);
  const currentCues = currentLesson.transcriptCues || [];
  const filteredCues = transcriptQuery.trim()
    ? currentCues.filter((c) =>
        c.text.toLowerCase().includes(transcriptQuery.trim().toLowerCase())
      )
    : currentCues;

  let globalLectureCounter = 0;

  return (
    <div className="mx-auto max-w-[1640px] px-4 py-5 sm:px-6 lg:px-8">
      {/* Top Studio Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
            title="Back to Generator"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold tracking-tight text-zinc-950 dark:text-white sm:text-lg">
              {course.title}
            </h1>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {course.author} • {course.modules.length} Sections • {totalLessonsCount} Lectures •{" "}
              {formatDurationHuman(course.totalDurationSeconds)} •{" "}
              <span className="font-semibold text-brand-600 dark:text-brand-400">
                {completedCount}/{totalLessonsCount} completed
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {course.placementTest && course.placementTest.length > 0 && (
            <button
              onClick={() => setIsPlacementOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950 dark:text-amber-300"
            >
              <FastForward className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Placement Test</span>
            </button>
          )}

          <button
            onClick={() => setIsCertificateOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
          >
            <Award className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden sm:inline">Certificate</span>
          </button>

          <button
            onClick={() => setIsSidebarOpen((s) => !s)}
            className="hidden items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 lg:flex"
            title={isSidebarOpen ? "Expand Video (Theater Mode)" : "Show Course Content Sidebar"}
          >
            {isSidebarOpen ? (
              <>
                <PanelRightClose className="h-3.5 w-3.5" />
                <span>Theater</span>
              </>
            ) : (
              <>
                <PanelRightOpen className="h-3.5 w-3.5" />
                <span>Course Content</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Video & Udemy Video Tabs Area */}
        <div className={`space-y-5 ${isSidebarOpen ? "lg:col-span-8" : "lg:col-span-12"}`}>
          {/* Video Player */}
          <CoursePlayer
            videoId={currentLesson.videoId || course.originalVideoId}
            startSeconds={currentLesson.startSeconds}
            endSeconds={currentLesson.endSeconds}
            lessonTitle={currentLesson.title}
            onTimeUpdate={(sec) => setCurrentVideoTime(sec)}
            onNextLecture={nextLesson ? () => handleSelectLesson(nextLesson) : undefined}
            hasNextLecture={Boolean(nextLesson)}
            playerRef={playerRef}
          />

          {/* Active Lecture Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                <span>
                  Lecture {currentLesson.lessonNumber || currentIndex + 1} of {totalLessonsCount}
                </span>
                <span>•</span>
                <span className="font-mono">
                  {formatSecondsToTime(currentLesson.startSeconds)} –{" "}
                  {formatSecondsToTime(currentLesson.endSeconds)}
                </span>
              </div>
              <h2 className="mt-0.5 text-base font-bold text-zinc-900 dark:text-white">
                {currentLesson.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleComplete(currentLesson.id)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all ${
                  completedLessonIds.includes(currentLesson.id)
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {completedLessonIds.includes(currentLesson.id)
                    ? "Completed"
                    : "Mark Complete"}
                </span>
              </button>
            </div>
          </div>

          {/* Udemy-Style Video Tabs Bar */}
          <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab("curriculum")}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition-all ${
                activeTab === "curriculum"
                  ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <ListVideo className="h-4 w-4" />
              <span>Course content ({totalLessonsCount})</span>
            </button>

            <button
              onClick={() => setActiveTab("overview")}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition-all ${
                activeTab === "overview"
                  ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <Info className="h-4 w-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("transcript")}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition-all ${
                activeTab === "transcript"
                  ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Transcript ({currentCues.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("notes")}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition-all ${
                activeTab === "notes"
                  ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Notes</span>
            </button>

            <button
              onClick={() => setActiveTab("quiz")}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition-all ${
                activeTab === "quiz"
                  ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              <span>Quiz ({currentLesson.quizzes?.length || 0})</span>
            </button>
          </div>

          {/* Active Tab Content Panel */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            {/* TAB 1: Udemy Course Content Full Accordion Breakdown */}
            {activeTab === "curriculum" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                      Complete Course Curriculum
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {course.modules.length} sections • {totalLessonsCount} lectures •{" "}
                      {formatDurationHuman(course.totalDurationSeconds)} total length
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
                      <input
                        type="text"
                        value={curriculumSearch}
                        onChange={(e) => setCurriculumSearch(e.target.value)}
                        placeholder="Filter curriculum..."
                        className="rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-8 pr-3 text-xs text-zinc-900 outline-none focus:border-brand-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const allOpen = course.modules.every(
                          (m) => expandedOverviewSections[m.id]
                        );
                        const next: Record<string, boolean> = {};
                        course.modules.forEach((m) => {
                          next[m.id] = !allOpen;
                        });
                        setExpandedOverviewSections(next);
                      }}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-brand-400 dark:hover:bg-zinc-800"
                    >
                      {course.modules.every((m) => expandedOverviewSections[m.id])
                        ? "Collapse all sections"
                        : "Expand all sections"}
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-zinc-200 divide-y divide-zinc-200 dark:border-zinc-800 dark:divide-zinc-800">
                  {course.modules.map((mod) => {
                    const query = curriculumSearch.trim().toLowerCase();
                    const filteredLessons = query
                      ? mod.lessons.filter((l) => l.title.toLowerCase().includes(query))
                      : mod.lessons;

                    const sectionStartNum = globalLectureCounter;
                    globalLectureCounter += mod.lessons.length;

                    if (query && filteredLessons.length === 0) return null;

                    const isExpanded = query ? true : !!expandedOverviewSections[mod.id];
                    const modDuration = mod.lessons.reduce(
                      (acc, l) => acc + l.durationSeconds,
                      0
                    );
                    const modDone = mod.lessons.filter(
                      (l) =>
                        completedLessonIds.includes(l.id) || skippedLessonIds.includes(l.id)
                    ).length;

                    return (
                      <div key={mod.id}>
                        <button
                          onClick={() =>
                            setExpandedOverviewSections((prev) => ({
                              ...prev,
                              [mod.id]: !prev[mod.id]
                            }))
                          }
                          className="flex w-full items-center justify-between bg-zinc-50 px-5 py-3.5 text-left transition-colors hover:bg-zinc-100 dark:bg-zinc-950/60 dark:hover:bg-zinc-800/60"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-zinc-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-zinc-500" />
                            )}
                            <span className="text-sm font-bold text-zinc-900 dark:text-white">
                              {mod.title}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {modDone}/{mod.lessons.length} lectures •{" "}
                            {formatDurationHuman(modDuration)}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800/60 dark:bg-zinc-900">
                            {filteredLessons.map((lesson) => {
                              const idxInMod = mod.lessons.findIndex((x) => x.id === lesson.id);
                              const lectureNum = lesson.lessonNumber || sectionStartNum + idxInMod + 1;
                              const isCurrent = lesson.id === currentLesson.id;
                              const isDone = completedLessonIds.includes(lesson.id);

                              return (
                                <div
                                  key={lesson.id}
                                  onClick={() => handleSelectLesson(lesson)}
                                  className={`flex cursor-pointer items-center justify-between gap-4 px-5 py-3 text-xs transition-colors ${
                                    isCurrent
                                      ? "bg-brand-50/70 dark:bg-brand-950/40"
                                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                                  }`}
                                >
                                  <div className="flex min-w-0 items-center gap-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleComplete(lesson.id);
                                      }}
                                      className="shrink-0 text-zinc-400 hover:text-emerald-600"
                                    >
                                      {isDone ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                      ) : (
                                        <Circle className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
                                      )}
                                    </button>

                                    {isCurrent ? (
                                      <PlayCircle className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                                    ) : (
                                      <Video className="h-4 w-4 shrink-0 text-zinc-400" />
                                    )}

                                    <span
                                      className={`truncate ${
                                        isCurrent
                                          ? "font-semibold text-brand-900 dark:text-brand-100"
                                          : "font-medium text-zinc-800 dark:text-zinc-200"
                                      }`}
                                    >
                                      {lectureNum}. {lesson.title}
                                    </span>
                                  </div>

                                  <div className="flex shrink-0 items-center gap-3 text-zinc-500 dark:text-zinc-400">
                                    {lesson.videoId === course.originalVideoId && (
                                      <span className="hidden font-mono text-[11px] sm:inline">
                                        {formatSecondsToTime(lesson.startSeconds)} –{" "}
                                        {formatSecondsToTime(lesson.endSeconds)}
                                      </span>
                                    )}
                                    <span className="font-mono text-xs font-medium">
                                      {Math.max(1, Math.round(lesson.durationSeconds / 60))}m
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: Overview */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    About this course
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {course.description}
                  </p>
                </div>

                {/* Udemy-style Stats Grid */}
                <div className="grid grid-cols-2 gap-4 border-y border-zinc-200 py-5 dark:border-zinc-800 sm:grid-cols-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Video Content
                    </p>
                    <p className="mt-1 text-base font-bold text-zinc-900 dark:text-white">
                      {formatDurationHuman(course.totalDurationSeconds)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Curriculum
                    </p>
                    <p className="mt-1 text-base font-bold text-zinc-900 dark:text-white">
                      {course.modules.length} Sections • {totalLessonsCount} Lectures
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Study Pace
                    </p>
                    <p className="mt-1 text-base font-bold text-zinc-900 dark:text-white">
                      {course.dailyCommitmentMinutes}m / day ({course.schedule.length} days)
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Skill Level
                    </p>
                    <p className="mt-1 text-base font-bold text-zinc-900 dark:text-white">
                      {course.level}
                    </p>
                  </div>
                </div>

                {/* Extracted External Resources */}
                {course.resources && course.resources.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      Course Resources & Code Repositories
                    </h4>
                    <div className="mt-3 flex flex-wrap gap-2.5">
                      {course.resources.map((res, idx) => (
                        <a
                          key={idx}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-brand-500" />
                          <span>{res.label}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-4 text-xs dark:bg-zinc-950">
                  <div>
                    <span className="text-zinc-500">Original YouTube Source: </span>
                    <a
                      href={course.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
                    >
                      {course.sourceUrl}
                    </a>
                  </div>
                  {course.breakdownSource && (
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {course.breakdownSource}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Interactive Live-Synced Transcript */}
            {activeTab === "transcript" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-800">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                      Interactive Lecture Transcript
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Click any timestamp to jump the video player directly to that moment.
                    </p>
                  </div>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
                    <input
                      type="text"
                      value={transcriptQuery}
                      onChange={(e) => setTranscriptQuery(e.target.value)}
                      placeholder="Search transcript..."
                      className="rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-8 pr-3 text-xs text-zinc-900 outline-none focus:border-brand-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                    />
                  </div>
                </div>

                {filteredCues.length > 0 ? (
                  <div className="max-h-[460px] space-y-1.5 overflow-y-auto pr-1">
                    {filteredCues.map((cue, idx) => {
                      const isActiveCue =
                        currentVideoTime >= cue.startSeconds &&
                        currentVideoTime <= cue.endSeconds + 1;

                      return (
                        <div
                          key={idx}
                          onClick={() => handleReplayMoment(cue.startSeconds)}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 text-xs transition-colors ${
                            isActiveCue
                              ? "bg-brand-50/90 text-brand-950 ring-1 ring-brand-500/30 dark:bg-brand-950/60 dark:text-brand-100"
                              : "hover:bg-zinc-50 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                          }`}
                        >
                          <span className="shrink-0 rounded bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-brand-600 dark:bg-zinc-800 dark:text-brand-400">
                            {formatSecondsToTime(cue.startSeconds)}
                          </span>
                          <p className="leading-relaxed">{cue.text}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-8 text-center text-xs text-zinc-500">
                    {currentCues.length === 0
                      ? "Transcript captions were not available for this lecture segment."
                      : "No transcript lines matched your search."}
                  </p>
                )}
              </div>
            )}

            {/* TAB 4: AI Study Notes + Personal Timestamped Notes */}
            {activeTab === "notes" && (
              <div className="space-y-8">
                {/* Personal Timestamped Notes Creator */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      Create Timestamped Note
                    </h4>
                    <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      <Clock className="h-3 w-3" />
                      {formatSecondsToTime(currentVideoTime)}
                    </span>
                  </div>

                  <form onSubmit={handleAddPersonalNote} className="mt-2.5 flex gap-2">
                    <input
                      type="text"
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder={`Write a note at ${formatSecondsToTime(currentVideoTime)}...`}
                      className="flex-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs text-zinc-900 outline-none focus:border-brand-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="flex items-center gap-1 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Save</span>
                    </button>
                  </form>

                  {currentLessonNotes.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {currentLessonNotes.map((note) => (
                        <div
                          key={note.id}
                          className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900"
                        >
                          <div className="flex items-start gap-2.5">
                            <button
                              onClick={() => handleReplayMoment(note.timestampSeconds)}
                              className="shrink-0 rounded bg-brand-50 px-2 py-0.5 font-mono text-[11px] font-bold text-brand-700 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-300"
                            >
                              {formatSecondsToTime(note.timestampSeconds)}
                            </button>
                            <p className="text-zinc-800 dark:text-zinc-200">{note.content}</p>
                          </div>
                          <button
                            onClick={() => handleDeletePersonalNote(note.id)}
                            className="text-zinc-400 hover:text-rose-500"
                            title="Delete note"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Study Notes & Key Takeaways */}
                <LessonNotes
                  notes={currentLesson.notes}
                  keyTakeaways={currentLesson.keyTakeaways}
                  lessonTitle={currentLesson.title}
                />
              </div>
            )}

            {/* TAB 5: Quiz with Replay the Moment */}
            {activeTab === "quiz" &&
              (currentLesson.quizzes && currentLesson.quizzes.length > 0 ? (
                <QuizCard
                  key={currentLesson.id}
                  questions={currentLesson.quizzes}
                  onReplayMoment={handleReplayMoment}
                  onQuizCompleted={(score) => {
                    if (score >= 70 && !completedLessonIds.includes(currentLesson.id)) {
                      handleToggleComplete(currentLesson.id);
                    }
                  }}
                />
              ) : (
                <p className="py-8 text-center text-xs text-zinc-500">
                  No quiz questions for this lesson.
                </p>
              ))}
          </div>

          {/* Prev / Next Lecture Navigation Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {prevLesson ? (
              <button
                onClick={() => handleSelectLesson(prevLesson)}
                className="flex max-w-xs items-center gap-1.5 truncate rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">Previous: {prevLesson.title}</span>
              </button>
            ) : (
              <div />
            )}

            {nextLesson && (
              <button
                onClick={() => handleSelectLesson(nextLesson)}
                className="flex max-w-xs items-center gap-1.5 truncate rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-500"
              >
                <span className="truncate">Next: {nextLesson.title}</span>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* Right Sidebar: Sticky Udemy Course Content Panel */}
        {isSidebarOpen && (
          <div className="h-fit lg:col-span-4 lg:sticky lg:top-20">
            <CurriculumSidebar
              course={course}
              currentLessonId={currentLesson.id}
              completedLessonIds={completedLessonIds}
              skippedLessonIds={skippedLessonIds}
              onSelectLesson={handleSelectLesson}
              onToggleComplete={handleToggleComplete}
              onOpenPlacementTest={() => setIsPlacementOpen(true)}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <PlacementTestModal
        isOpen={isPlacementOpen}
        onClose={() => setIsPlacementOpen(false)}
        questions={course.placementTest || []}
        onApplyResults={handleApplyPlacementResults}
      />

      <CertificateModal
        isOpen={isCertificateOpen}
        onClose={() => setIsCertificateOpen(false)}
        courseTitle={course.title}
      />
    </div>
  );
}
