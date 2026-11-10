"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Youtube,
  Clock,
  GraduationCap,
  ArrowRight,
  RotateCcw,
  FastForward,
  BookOpen,
  Award,
  Play,
  Key,
  Flame,
  History,
  Trash2,
  ChevronDown
} from "lucide-react";
import { DEMO_COURSES } from "@/lib/demoCourses";
import { Course } from "@/lib/types";
import { formatDurationHuman } from "@/lib/youtube";

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState(45);
  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCourses, setSavedCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const loaded: Course[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("course_")) {
        try {
          const parsed = JSON.parse(localStorage.getItem(k) || "");
          if (parsed && parsed.id && parsed.modules) {
            loaded.push(parsed);
          }
        } catch {
          // ignore malformed entries
        }
      }
    }
    loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setSavedCourses(loaded);
  }, []);

  const saveCourseSafely = (course: Course) => {
    if (typeof window === "undefined") return;
    const key = `course_${course.id}`;
    try {
      localStorage.setItem(key, JSON.stringify(course));
    } catch {
      // Fallback: strip bulky transcript cues if localStorage quota is tight
      const compactCourse: Course = {
        ...course,
        modules: course.modules.map((m) => ({
          ...m,
          lessons: m.lessons.map((l) => ({
            ...l,
            transcriptCues: l.transcriptCues?.slice(0, 8)
          }))
        }))
      };
      try {
        localStorage.setItem(key, JSON.stringify(compactCourse));
      } catch (err) {
        console.warn("Could not persist course to localStorage:", err);
      }
    }
  };

  const handleDeleteSaved = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (typeof window !== "undefined") {
      localStorage.removeItem(`course_${id}`);
      localStorage.removeItem(`progress_${id}`);
    }
    setSavedCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("Please paste a valid YouTube video or playlist link.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          dailyCommitmentMinutes: dailyMinutes,
          level,
          apiKey: apiKey.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate course.");
      }

      saveCourseSafely(data.course);
      router.push(`/course/${data.course.id}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while generating the course.");
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (demoId: string) => {
    router.push(`/course/${demoId}`);
  };

  return (
    <div className="relative isolate overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-brand-600 to-indigo-400 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/70 px-4 py-1.5 text-xs font-semibold text-brand-700 shadow-sm dark:border-brand-900/50 dark:bg-brand-950/40 dark:text-brand-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Powered YouTube Course Synthesizer</span>
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-zinc-950 sm:text-6xl dark:text-white">
            Turn Any YouTube Video into an{" "}
            <span className="bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent">
              Interactive Course
            </span>
          </h1>

          <p className="mt-5 text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg">
            Say goodbye to tutorial fatigue and recommendation rabbit holes. MakeCourse breaks down even 15-hour marathon videos and playlists into Udemy-style sections, interactive transcripts, placement tests, and quizzes with <span className="font-semibold text-brand-600 dark:text-brand-400">"Replay the Moment"</span> video jumps.
          </p>
        </div>

        {/* Generator Form Card */}
        <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-zinc-200/90 bg-white/95 p-6 shadow-xl shadow-zinc-200/50 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-none sm:p-8">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                YouTube Video or Playlist URL
              </label>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 transition-all focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-950/60 dark:focus-within:border-brand-400 dark:focus-within:bg-zinc-950">
                <Youtube className="h-5 w-5 shrink-0 text-red-500" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="e.g. https://www.youtube.com/watch?v=KN58GwRRu28 or playlist URL"
                  className="w-full bg-transparent py-3.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white"
                />
              </div>
            </div>

            {/* Daily Commitment & Level Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Daily Study Time
                </label>
                <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 transition-all focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-950/60 dark:focus-within:border-brand-400 dark:focus-within:bg-zinc-950">
                  <Clock className="h-4 w-4 shrink-0 text-zinc-400" />
                  <select
                    value={dailyMinutes}
                    onChange={(e) => setDailyMinutes(Number(e.target.value))}
                    className="w-full cursor-pointer appearance-none bg-transparent py-2.5 text-xs font-medium text-zinc-900 outline-none dark:text-white"
                  >
                    <option value={15}>15 Minutes / Day (Micro-learning)</option>
                    <option value={30}>30 Minutes / Day (Casual Pace)</option>
                    <option value={45}>45 Minutes / Day (Recommended)</option>
                    <option value={60}>60 Minutes / Day (Intensive)</option>
                    <option value={90}>90 Minutes / Day (Sprint Bootcamp)</option>
                  </select>
                  <ChevronDown className="pointer-events-none h-4 w-4 shrink-0 text-zinc-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Target Proficiency
                </label>
                <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 transition-all focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-950/60 dark:focus-within:border-brand-400 dark:focus-within:bg-zinc-950">
                  <GraduationCap className="h-4 w-4 shrink-0 text-zinc-400" />
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as any)}
                    className="w-full cursor-pointer appearance-none bg-transparent py-2.5 text-xs font-medium text-zinc-900 outline-none dark:text-white"
                  >
                    <option value="Beginner">Beginner (Foundations first)</option>
                    <option value="Intermediate">Intermediate (Core mechanics)</option>
                    <option value="Advanced">Advanced (Deep dive & architecture)</option>
                  </select>
                  <ChevronDown className="pointer-events-none h-4 w-4 shrink-0 text-zinc-400" />
                </div>
              </div>
            </div>

            {/* Optional API Key Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                <Key className="h-3.5 w-3.5" />
                <span>{showApiKey ? "Hide Custom Gemini Key" : "Add Custom Gemini API Key (Optional)"}</span>
              </button>

              {showApiKey && (
                <div className="mt-2.5">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy... (leave blank to use built-in transcript & chapter engine)"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-brand-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-white"
                  />
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Optional: Provide your own Google Gemini API key to enrich every section with custom AI notes and quizzes.
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white shadow-lg transition-all ${
                isLoading
                  ? "bg-brand-500/80 cursor-wait"
                  : "bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-brand-500/25 hover:shadow-brand-500/40"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Fetching Full Transcript & Building Udemy Breakdown...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate My Course</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* User's Saved / Generated Courses */}
        {savedCourses.length > 0 && (
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <History className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Your Library</span>
                </div>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  Recently Generated Courses
                </h2>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {savedCourses.map((course) => {
                const totalLectures = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
                return (
                  <div
                    key={course.id}
                    onClick={() => router.push(`/course/${course.id}`)}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-brand-700"
                  >
                    <button
                      onClick={(e) => handleDeleteSaved(e, course.id)}
                      title="Remove from library"
                      className="absolute right-3 top-3 z-10 rounded-lg bg-black/60 p-1.5 text-white opacity-0 transition-opacity hover:bg-rose-600 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <div className="aspect-[16/9] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    <div className="p-5">
                      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="font-semibold text-brand-600 dark:text-brand-400">
                          {course.author}
                        </span>
                        <span>{formatDurationHuman(course.totalDurationSeconds)}</span>
                      </div>
                      <h3 className="mt-1.5 line-clamp-2 text-sm font-bold text-zinc-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                        {course.title}
                      </h3>
                      <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs dark:border-zinc-800">
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {course.modules.length} Sections • {totalLectures} Lectures
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400">
                          Resume <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Demo Courses Section */}
        <div className="mx-auto mt-20 max-w-5xl">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                <Flame className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Instant Access</span>
              </div>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Featured Ready-to-Study Courses
              </h2>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              No YouTube link needed • Try right now
            </span>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {DEMO_COURSES.map((course) => (
              <div
                key={course.id}
                onClick={() => handleQuickDemo(course.id)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-brand-700"
              >
                <div className="aspect-[16/9] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold text-brand-600 dark:text-brand-400">
                      {course.author}
                    </span>
                    <span>{formatDurationHuman(course.totalDurationSeconds)}</span>
                  </div>

                  <h3 className="mt-2 text-base font-bold text-zinc-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                    {course.title}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
                    {course.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs dark:border-zinc-800">
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {course.modules.length} Sections • {course.schedule.length} Days
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400">
                      Start Course <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mx-auto mt-28 max-w-5xl">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
              Why MakeCourse
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Everything You Need to Finish What You Start
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <FastForward className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-white">
                Diagnostic Placement Test
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                Take a 2-minute placement quiz before you start. Questions you get right automatically trim redundant lessons out of your daily schedule.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                <RotateCcw className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-white">
                "Replay the Moment" Quizzes
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                Missed a quiz question? One click on "Replay the Moment" instantly jumps the video player right to the exact second where the instructor explained that concept.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-white">
                Synchronized Transcript & Notes
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                Follow along with live-synced clickable transcripts, AI-extracted study notes, and personal timestamped notes.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-white">
                Full Udemy-Style Curriculum
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                Handles 15-hour+ mega-tutorials and playlists seamlessly, breaking 100% of the runtime into structured sections and bite-sized lectures.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                <Play className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-white">
                Zero Distraction Player
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                Pure focused learning. Strips away the YouTube algorithm's recommended videos, clickbait thumbnails, and comment drama.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-white">
                Verified Certificate
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                Finish every lesson and pass the quizzes to unlock a personalized certificate of completion complete with confetti celebration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
