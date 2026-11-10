"use client";

import Link from "next/link";
import { GraduationCap, Sparkles, BookOpen, Layers } from "lucide-react";

export function Navbar() {
  return (
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

        <nav className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <Sparkles className="h-4 w-4 text-brand-500" />
            <span>Generate Course</span>
          </Link>
          <Link
            href="/course/full-stack-web-dev"
            className="hidden items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 sm:flex"
          >
            <BookOpen className="h-4 w-4 text-emerald-500" />
            <span>Demo Course</span>
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Layers className="h-4 w-4" />
            <span>Ready to Deploy</span>
          </a>
        </nav>
      </div>
    </header>
  );
}

