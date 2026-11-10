"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Volume2, Maximize2, AlertCircle } from "lucide-react";
import { formatSecondsToTime } from "@/lib/youtube";

interface CoursePlayerProps {
  videoId: string;
  startSeconds: number;
  endSeconds?: number;
  lessonTitle: string;
  onTimeUpdate?: (seconds: number) => void;
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
  playerRef
}: CoursePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startSeconds);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Initialize YT player
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const setupPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {
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
          end: endSeconds ? Math.floor(endSeconds) : undefined,
          enablejsapi: 1,
          origin: typeof window !== "undefined" ? window.location.origin : undefined
        },
        events: {
          onReady: (event: any) => {
            setIsReady(true);
            setHasError(false);
            event.target.seekTo(startSeconds, true);
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
            }
          },
          onError: () => {
            setHasError(true);
          }
        }
      });
    };

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = setupPlayer;
    } else {
      setupPlayer();
    }

    // Time ticker
    interval = setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === "function") {
        try {
          const time = ytPlayerRef.current.getCurrentTime();
          if (time !== undefined && !isNaN(time)) {
            setCurrentTime(Math.floor(time));
            onTimeUpdate?.(Math.floor(time));
          }
        } catch (e) {
          // ignore
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [videoId]);

  // When startSeconds changes (lesson navigation)
  useEffect(() => {
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function" && isReady) {
      ytPlayerRef.current.seekTo(startSeconds, true);
      setCurrentTime(startSeconds);
    }
  }, [startSeconds, isReady]);

  // Expose seekTo method to parent via playerRef
  useEffect(() => {
    if (playerRef) {
      playerRef.current = {
        seekTo: (seconds: number) => {
          if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
            ytPlayerRef.current.seekTo(seconds, true);
            ytPlayerRef.current.playVideo();
            setCurrentTime(seconds);
          }
        }
      };
    }
  }, [playerRef, isReady]);

  const handleSeek = (seconds: number) => {
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
      ytPlayerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
    }
  };

  const handleRewind10 = () => {
    handleSeek(Math.max(startSeconds, currentTime - 10));
  };

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
              This video requires opening directly on YouTube or embeds are restricted by the creator. You can continue studying the AI notes and interactive quizzes.
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

      {/* Synchronized Player Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-900 px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={handleRewind10}
            className="flex items-center gap-1 rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>-10s</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-medium text-emerald-400">
              {formatSecondsToTime(currentTime)}
            </span>
            <span className="text-xs text-zinc-500">/</span>
            <span className="font-mono text-xs text-zinc-400">
              {endSeconds ? formatSecondsToTime(endSeconds) : "End"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="hidden sm:inline">Now Playing:</span>
          <span className="max-w-[220px] truncate font-medium text-zinc-200 sm:max-w-xs">
            {lessonTitle}
          </span>
        </div>
      </div>
    </div>
  );
}
