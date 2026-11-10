"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, RotateCw, AlertCircle, PlayCircle, ArrowRight } from "lucide-react";
import { formatSecondsToTime } from "@/lib/youtube";

interface CoursePlayerProps {
  videoId: string;
  startSeconds: number;
  endSeconds?: number;
  lessonTitle: string;
  onTimeUpdate?: (seconds: number) => void;
  onNextLecture?: () => void;
  hasNextLecture?: boolean;
  playerRef?: React.MutableRefObject<{ seekTo: (seconds: number) => void } | null>;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function CoursePlayer({
  videoId,
  startSeconds,
  endSeconds,
  lessonTitle,
  onTimeUpdate,
  onNextLecture,
  hasNextLecture,
  playerRef
}: CoursePlayerProps) {
  const ytPlayerRef = useRef<any>(null);
  const [currentTime, setCurrentTime] = useState(startSeconds);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const lastVideoIdRef = useRef<string>(videoId);

  // Initialize YT player whenever videoId changes
  useEffect(() => {
    let interval: NodeJS.Timeout;
    setIsReady(false);
    lastVideoIdRef.current = videoId;

    const setupPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // ignore
        }
      }

      ytPlayerRef.current = new window.YT.Player("youtube-player-iframe", {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          start: Math.floor(startSeconds),
          enablejsapi: 1,
          origin: typeof window !== "undefined" ? window.location.origin : undefined
        },
        events: {
          onReady: (event: any) => {
            setIsReady(true);
            setHasError(false);
            event.target.seekTo(startSeconds, true);
          },
          onError: () => {
            setHasError(true);
          }
        }
      });
    };

    if (!window.YT || !window.YT.Player) {
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = setupPlayer;
    } else {
      setupPlayer();
    }

    interval = setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === "function") {
        try {
          const time = ytPlayerRef.current.getCurrentTime();
          if (time !== undefined && !isNaN(time)) {
            const floored = Math.floor(time);
            setCurrentTime(floored);
            onTimeUpdate?.(floored);
          }
        } catch {
          // ignore
        }
      }
    }, 800);

    return () => {
      clearInterval(interval);
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // ignore
        }
      }
    };
  }, [videoId]);

  // Seek when switching lectures within the same compilation video
  useEffect(() => {
    if (
      lastVideoIdRef.current === videoId &&
      ytPlayerRef.current &&
      typeof ytPlayerRef.current.seekTo === "function" &&
      isReady
    ) {
      ytPlayerRef.current.seekTo(startSeconds, true);
      ytPlayerRef.current.playVideo?.();
      setCurrentTime(startSeconds);
    }
  }, [startSeconds, lessonTitle, isReady, videoId]);

  // Expose seekTo method via playerRef
  useEffect(() => {
    if (playerRef) {
      playerRef.current = {
        seekTo: (seconds: number) => {
          if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
            ytPlayerRef.current.seekTo(seconds, true);
            ytPlayerRef.current.playVideo?.();
            setCurrentTime(seconds);
          }
        }
      };
    }
  }, [playerRef, isReady]);

  const handleSeek = (seconds: number) => {
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
      ytPlayerRef.current.seekTo(seconds, true);
      ytPlayerRef.current.playVideo?.();
      setCurrentTime(seconds);
    }
  };

  const segmentDuration = Math.max(1, (endSeconds ?? startSeconds + 60) - startSeconds);
  const lectureElapsed = Math.max(0, Math.min(segmentDuration, currentTime - startSeconds));
  const lectureProgress = Math.min(100, Math.round((lectureElapsed / segmentDuration) * 100));
  const reachedLectureEnd = Boolean(endSeconds && currentTime >= endSeconds - 2 && hasNextLecture);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-black shadow-lg dark:border-zinc-800">
      {/* Aspect Ratio Video Container */}
      <div className="relative aspect-video w-full bg-zinc-950">
        <div id="youtube-player-iframe" className="h-full w-full" />

        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 p-6 text-center text-white">
            <AlertCircle className="mb-2 h-10 w-10 text-amber-500" />
            <h4 className="text-base font-semibold">Video Playback Notice</h4>
            <p className="mt-1 max-w-md text-xs text-zinc-400">
              This video requires opening directly on YouTube or embeds are restricted by the creator. You can continue studying the AI notes, transcript, and quizzes below.
            </p>
            <a
              href={`https://www.youtube.com/watch?v=${videoId}&t=${startSeconds}s`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
            >
              Open on YouTube at {formatSecondsToTime(startSeconds)}
            </a>
          </div>
        )}
      </div>

      {/* Lecture Window Progress Indicator */}
      <div className="h-1 w-full bg-zinc-800">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-300"
          style={{ width: `${lectureProgress}%` }}
        />
      </div>

      {/* Synchronized Player Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSeek(Math.max(startSeconds, currentTime - 10))}
            className="flex items-center gap-1 rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>-10s</span>
          </button>

          <button
            onClick={() => handleSeek(currentTime + 10)}
            className="flex items-center gap-1 rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
            title="Forward 10 seconds"
          >
            <span>+10s</span>
            <RotateCw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => handleSeek(startSeconds)}
            className="hidden items-center gap-1 rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white sm:flex"
            title="Jump to start of current lecture"
          >
            <PlayCircle className="h-3.5 w-3.5 text-brand-400" />
            <span>Lecture Start</span>
          </button>

          <div className="ml-1 flex items-center gap-1.5 font-mono text-xs">
            <span className="font-semibold text-emerald-400">
              {formatSecondsToTime(currentTime)}
            </span>
            <span className="text-zinc-500">/</span>
            <span className="text-zinc-400">
              {endSeconds ? formatSecondsToTime(endSeconds) : "End"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {reachedLectureEnd && onNextLecture ? (
            <button
              onClick={onNextLecture}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              <span>Next Lecture</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span className="max-w-[240px] truncate text-xs font-medium text-zinc-300 sm:max-w-sm">
              {lessonTitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
