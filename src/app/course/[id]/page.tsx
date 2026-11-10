"use client";

import { use, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  HelpCircle,
  Video,
  Award,
  CheckCircle2,
  FastForward,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { Course, Lesson } from "@/lib/types";
import { DEMO_COURSES } from "@/lib/demoCourses";
import { CoursePlayer } from "@/components/CoursePlayer";
import { LessonNotes } from "@/components/LessonNotes";
import { QuizCard } from "@/components/QuizCard";
import { CurriculumSidebar } from "@/components/CurriculumSidebar";
import { PlacementTestModal } from "@/components/PlacementTestModal";
import { CertificateModal } from "@/components/CertificateModal";

export default function CourseStudyRoomPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<"video" | "notes" | "quiz">("video");
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [skippedLessonIds, setSkippedLessonIds] = useState<string[]>([]);
  const [isPlacementOpen, setIsPlacementOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  // Player ref to control seeking
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

    if (foundCourse) {
      setCourse(foundCourse);
      const firstLesson = foundCourse.modules[0]?.lessons[0];
      if (firstLesson) {
        setCurrentLesson(firstLesson);
      }

      // Load progress
      if (typeof window !== "undefined") {
        const savedProgress = localStorage.getItem(`progress_${courseId}`);
        if (savedProgress) {
          try {
            const parsed = JSON.parse(savedProgress);
            setCompletedLessonIds(parsed.completedLessonIds || []);
            setSkippedLessonIds(parsed.skippedLessonIds || []);
          } catch (e) {
            // ignore
          }
        }
      }
    }
  }, [courseId]);

  // Persist progress to localStorage
  const saveProgress = (completed: string[], skipped: string[]) => {
    setCompletedLessonIds(completed);
    setSkippedLessonIds(skipped);
    if (typeof window !== "undefined" && course) {
      localStorage.setItem(
        `progress_${course.id}`,
        JSON.stringify({
          completedLessonIds: completed,
          skippedLessonIds: skipped
        })
      );
    }
  };

  const handleToggleComplete = (lessonId: string) => {
    let next: string[];
    if (completedLessonIds.includes(lessonId)) {
      next = completedLessonIds.filter((id) => id !== lessonId);
    } else {
      next = [...completedLessonIds, lessonId];
    }
    saveProgress(next, skippedLessonIds);

    // Check 100% completion
    if (course) {
      const totalCount = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
      if (next.length + skippedLessonIds.length >= totalCount) {
        setIsCertificateOpen(true);
      }
    }
  };

  const handleApplyPlacementResults = (skippableIds: string[], score: number) => {
    const merged = Array.from(new Set([...skippedLessonIds, ...skippableIds]));
    saveProgress(completedLessonIds, merged);
  };

  // Replay the Moment handler: jumps video player directly to timestamp!
  const handleReplayMoment = (timestampSeconds: number) => {
    setActiveTab("video");
    if (playerRef.current) {
      playerRef.current.seekTo(timestampSeconds);
    }
    // Scroll player smoothly into view on mobile
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  // Next / Previous navigation
  const allLessons: Lesson[] = course ? course.modules.flatMap((m) => m.lessons) : [];
  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson?.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  if (!course) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        <h2 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">Loading Course...</h2>
        <p className="mt-1 text-xs text-zinc-500">Retrieving syllabus, timestamps & quizzes.</p>
        <Link
          href="/"
          className="mt-6 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Back to Generator
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Header & Breadcrumbs */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-2xl">
              {course.title}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Instructor: <span className="font-medium text-zinc-700 dark:text-zinc-300">{course.author}</span> • {course.level} Level
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {course.placementTest && course.placementTest.length > 0 && (
            <button
              onClick={() => setIsPlacementOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-sm transition-colors hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950 dark:text-amber-300"
            >
              <FastForward className="h-3.5 w-3.5" />
              <span>Placement Test</span>
            </button>
          )}

          <button
            onClick={() => setIsCertificateOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <Award className="h-3.5 w-3.5 text-amber-500" />
            <span>Certificate</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left / Center Area: Player & Content Tabs (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          {currentLesson && (
            <>
              {/* YouTube Video Player */}
              <CoursePlayer
                videoId={currentLesson.videoId || course.originalVideoId}
                startSeconds={currentLesson.startSeconds}
                endSeconds={currentLesson.endSeconds}
                lessonTitle={currentLesson.title}
                playerRef={playerRef}
              />

              {/* Lesson Controls & Completion bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                    {currentLesson.title}
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {currentLesson.description}
                  </p>
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
                        ? "Completed!"
                        : "Mark as Complete"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Content Tabs Switcher */}
              <div className="flex border-b border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => setActiveTab("video")}
                  className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition-all ${
                    activeTab === "video"
                      ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  <Video className="h-4 w-4" />
                  <span>Interactive Study</span>
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition-all ${
                    activeTab === "notes"
                      ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>AI Study Notes</span>
                </button>
                <button
                  onClick={() => setActiveTab("quiz")}
                  className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition-all ${
                    activeTab === "quiz"
                      ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Lesson Quiz ({currentLesson.quizzes?.length || 0})</span>
                </button>
              </div>

              {/* Active Tab Panel */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                {activeTab === "video" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                        Quick Concept Synopsis
                      </h3>
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        {currentLesson.description}
                      </p>
                    </div>

                    {currentLesson.keyTakeaways && (
                      <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/40">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Highlights for this lesson
                        </h4>
                        <ul className="mt-2 space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                          {currentLesson.keyTakeaways.map((point, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Inline Quiz Prompt */}
                    {currentLesson.quizzes && currentLesson.quizzes.length > 0 && (
                      <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-900/40 dark:bg-brand-950/20">
                        <div>
                          <p className="text-xs font-semibold text-brand-900 dark:text-brand-200">
                            Ready for the checkpoint quiz?
                          </p>
                          <p className="text-[11px] text-brand-700 dark:text-brand-400">
                            Verify what you just watched with {currentLesson.quizzes.length} timestamped questions.
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveTab("quiz")}
                          className="rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-500"
                        >
                          Start Quiz
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "notes" && (
                  <LessonNotes
                    notes={currentLesson.notes}
                    keyTakeaways={currentLesson.keyTakeaways}
                    lessonTitle={currentLesson.title}
                  />
                )}

                {activeTab === "quiz" && (
                  currentLesson.quizzes && currentLesson.quizzes.length > 0 ? (
                    <QuizCard
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
                  )
                )}
              </div>

              {/* Prev / Next Lesson Navigation Footer */}
              <div className="flex items-center justify-between pt-2">
                {prevLesson ? (
                  <button
                    onClick={() => setCurrentLesson(prevLesson)}
                    className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous: {prevLesson.title}</span>
                  </button>
                ) : <div />}

                {nextLesson && (
                  <button
                    onClick={() => setCurrentLesson(nextLesson)}
                    className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-500"
                  >
                    <span>Next: {nextLesson.title}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Sidebar: Curriculum & Day-by-Day schedule (4 cols) */}
        <div className="h-fit lg:col-span-4 lg:sticky lg:top-20">
          <CurriculumSidebar
            course={course}
            currentLessonId={currentLesson?.id || ""}
            completedLessonIds={completedLessonIds}
            skippedLessonIds={skippedLessonIds}
            onSelectLesson={(lesson) => setCurrentLesson(lesson)}
            onToggleComplete={handleToggleComplete}
            onOpenPlacementTest={() => setIsPlacementOpen(true)}
          />
        </div>
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
