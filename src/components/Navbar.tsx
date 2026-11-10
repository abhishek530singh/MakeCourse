"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Settings,
  Sun,
  Moon,
  X,
  Key,
  Check,
  Terminal
} from "lucide-react";

export function Navbar() {
  const [isDark, setIsDark] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [savedKey, setSavedKey] = useState("");
  const [keySavedFlash, setKeySavedFlash] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedTheme = localStorage.getItem("makecourse_theme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const useDark = storedTheme ? storedTheme === "dark" : prefersDark;
    setIsDark(useDark);
    document.documentElement.classList.toggle("dark", useDark);

    const existingKey = localStorage.getItem("makecourse_gemini_key") || "";
    setSavedKey(existingKey);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    if (typeof window !== "undefined") {
      localStorage.setItem("makecourse_theme", next ? "dark" : "light");
    }
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      if (savedKey.trim()) {
        localStorage.setItem("makecourse_gemini_key", savedKey.trim());
      } else {
        localStorage.removeItem("makecourse_gemini_key");
      }
      window.dispatchEvent(new Event("makecourse_key_updated"));
    }
    setKeySavedFlash(true);
    setTimeout(() => setKeySavedFlash(false), 1800);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-md shadow-brand-500/20">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                MakeCourse
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Turn YouTube into Courses
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <Sparkles className="h-4 w-4 text-brand-500" />
              <span className="hidden sm:inline">Generate Course</span>
            </Link>
            <Link
              href="/course/full-stack-web-dev"
              className="hidden items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:flex"
            >
              <BookOpen className="h-4 w-4 text-emerald-500" />
              <span>Demo Course</span>
            </Link>

            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings & Deploy</span>
            </button>
          </nav>
        </div>
      </header>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Workspace Settings & Deployment
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Configure optional Gemini AI enrichment and deploy MakeCourse to production.
            </p>

            {/* Saved Gemini API Key */}
            <form onSubmit={handleSaveKey} className="mt-5 space-y-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                <Key className="h-3.5 w-3.5 text-brand-500" />
                <span>Default Gemini API Key (Browser-Only)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={savedKey}
                  onChange={(e) => setSavedKey(e.target.value)}
                  placeholder="AIzaSy... (optional)"
                  className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none focus:border-brand-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-500"
                >
                  {keySavedFlash ? <Check className="h-3.5 w-3.5" /> : null}
                  <span>{keySavedFlash ? "Saved" : "Save"}</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Stored only in your browser localStorage. Leave blank to use the built-in transcript & chapter engine.
              </p>
            </form>

            {/* Production Deployment Commands */}
            <div className="mt-5 space-y-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                <Terminal className="h-3.5 w-3.5 text-emerald-500" />
                <span>Deploy to Vercel</span>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-3 font-mono text-[11px] text-zinc-200">
{`npx vercel --prod
# Optional env var in Vercel Dashboard:
# GEMINI_API_KEY=your_api_key`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
