import {
  Course,
  DailySchedule,
  Lesson,
  Module,
  PlacementQuestion,
  QuizQuestion,
  TranscriptCue
} from "./types";
import {
  ChapterMark,
  PlaylistMetadata,
  VideoMetadata,
  groupTranscriptIntoReadableCues
} from "./transcript";
import { formatSecondsToTime } from "./youtube";

interface RawLectureSegment {
  videoId: string;
  title: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
}

const STOP_WORDS = new Set([
  "the", "and", "that", "this", "with", "for", "you", "your", "are", "was", "were", "have", "has",
  "had", "not", "but", "what", "when", "where", "how", "why", "who", "which", "from", "into",
  "will", "can", "could", "would", "should", "there", "their", "they", "them", "then", "than",
  "about", "just", "like", "here", "now", "also", "some", "more", "very", "much", "only", "make",
  "made", "doing", "done", "does", "did", "going", "want", "need", "know", "think", "right",
  "okay", "yeah", "well", "guys", "brother", "see", "let", "lets", "let's", "use", "using",
  "used", "one", "two", "three", "first", "second", "next", "mean", "means", "something", "anything",
  "everything", "because", "inside", "outside", "after", "before", "step", "video", "hindi", "full",
  "tutorial", "course", "complete", "guide", "part", "series", "detail", "detailed", "explain"
]);

function extractTopicKeywords(text: string, maxKeywords = 5): string[] {
  const counts = new Map<string, number>();
  const words = text
    .replace(/[^\w\s+#.-]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w.toLowerCase()));

  for (const word of words) {
    const clean = word.replace(/^[-.]+|[-.]+$/g, "");
    if (clean.length < 3 || /^\d+$/.test(clean)) continue;
    const key = clean.toLowerCase();
    const boost = /[A-Z]/.test(clean) || clean.includes("_") ? 2 : 1;
    counts.set(clean, (counts.get(clean) || 0) + boost);
    if (key !== clean && counts.has(key)) {
      counts.set(clean, (counts.get(clean) || 0) + (counts.get(key) || 0));
      counts.delete(key);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

function cleanVideoTitle(rawTitle: string): string {
  return rawTitle
    .replace(/[🔥🚀✅📊➡️🔹✨💡⚡]/g, " ")
    .replace(/^\s*\d+\s*[\.\):-]?\s*(?=[A-Za-z])/, "")
    .replace(/\|\s*(?:Hindi|English|Full Series|Full Guide|Full Course|Spring AI Tutorials?(?:\s+in\s+Hindi)?|Spring AI Course|Spring AI Tutorial(?:\s*\[Hindi\])?)\s*$/gi, "")
    .replace(/\[(?:Hindi|English|Full Guide)\]/gi, "")
    .replace(/\(\s*Hindi\s*\)/gi, "")
    .replace(/\bin\s+Hindi\s*$/i, "")
    .replace(/\s*\|\s*/g, " — ")
    .replace(/\s+/g, " ")
    .replace(/\s*—\s*$/, "")
    .trim();
}

function snapToTranscriptBoundary(
  transcript: Array<{ text: string; startSeconds: number; durationSeconds: number }>,
  targetSecond: number,
  windowSeconds: number,
  keywords: string[] = []
): number {
  if (transcript.length === 0) return targetSecond;
  const minS = Math.max(0, targetSecond - windowSeconds);
  const maxS = targetSecond + windowSeconds;
  const candidates = transcript.filter((t) => t.startSeconds >= minS && t.startSeconds <= maxS);
  if (candidates.length === 0) return targetSecond;

  const lowerKeywords = keywords.map((k) => k.toLowerCase()).filter((k) => k.length >= 3);
  let bestScore = -1;
  let bestSecond = targetSecond;

  for (let i = 0; i < candidates.length; i++) {
    const curr = candidates[i];
    const prev = i > 0 ? candidates[i - 1] : null;
    let score = 0;

    if (prev && curr.startSeconds - (prev.startSeconds + prev.durationSeconds) >= 2) {
      score += 3;
    }

    const lowerText = curr.text.toLowerCase();
    if (
      lowerText.includes("now let") ||
      lowerText.includes("let's start") ||
      lowerText.includes("next") ||
      lowerText.includes("welcome") ||
      lowerText.includes("in this video") ||
      lowerText.includes("so guys")
    ) {
      score += 4;
    }

    for (const kw of lowerKeywords) {
      if (lowerText.includes(kw)) {
        score += 5;
      }
    }

    const distPenalty = Math.abs(curr.startSeconds - targetSecond) / Math.max(1, windowSeconds);
    const total = score - distPenalty;
    if (total > bestScore) {
      bestScore = total;
      bestSecond = curr.startSeconds;
    }
  }

  return bestSecond;
}

export function buildRawSegmentsForVideo(
  meta: VideoMetadata,
  linkedPlaylist: PlaylistMetadata | null,
  dailyCommitmentMinutes: number
): { segments: RawLectureSegment[]; breakdownSource: Course["breakdownSource"] } {
  const totalSec = Math.max(60, meta.durationSeconds);

  // Strategy 1: Compilation video with a matching Part-by-Part playlist
  if (linkedPlaylist && linkedPlaylist.videos.length >= 4) {
    const playlistVideos = linkedPlaylist.videos;
    let cum = 0;
    const matchedParts: typeof playlistVideos = [];
    for (const pv of playlistVideos) {
      if (cum >= totalSec * 0.96 && matchedParts.length >= 3) break;
      matchedParts.push(pv);
      cum += pv.durationSeconds;
      if (cum >= totalSec * 1.08) break;
    }

    if (matchedParts.length >= 4 && cum >= totalSec * 0.65) {
      const scale = totalSec / cum;
      const segments: RawLectureSegment[] = [];
      let cursor = 0;

      for (let i = 0; i < matchedParts.length; i++) {
        const part = matchedParts[i];
        const cleanTitle = cleanVideoTitle(part.title);
        const scaledDuration = Math.round(part.durationSeconds * scale);
        const rawEnd = i === matchedParts.length - 1 ? totalSec : Math.min(totalSec, cursor + scaledDuration);

        let snappedEnd = rawEnd;
        if (i < matchedParts.length - 1 && meta.transcript.length > 0) {
          const nextKeywords = extractTopicKeywords(cleanVideoTitle(matchedParts[i + 1].title), 4);
          const candidate = snapToTranscriptBoundary(meta.transcript, rawEnd, 180, nextKeywords);
          if (candidate > cursor + 120 && candidate < totalSec - 60) {
            snappedEnd = candidate;
          }
        }

        const partDuration = snappedEnd - cursor;

        // Split marathon parts (> 45 mins) into Udemy-sized ~20-25 min lectures
        if (partDuration > 2700) {
          const subCount = Math.ceil(partDuration / 1500);
          let subCursor = cursor;
          for (let s = 0; s < subCount; s++) {
            const subTargetEnd =
              s === subCount - 1 ? snappedEnd : Math.round(cursor + ((s + 1) * partDuration) / subCount);
            const subEnd =
              s === subCount - 1
                ? snappedEnd
                : snapToTranscriptBoundary(meta.transcript, subTargetEnd, 120, []);
            const finalSubEnd = Math.max(subCursor + 180, Math.min(snappedEnd, subEnd));
            segments.push({
              videoId: meta.videoId,
              title: `${cleanTitle} (Part ${s + 1}/${subCount})`,
              startSeconds: subCursor,
              endSeconds: finalSubEnd,
              durationSeconds: finalSubEnd - subCursor
            });
            subCursor = finalSubEnd;
          }
        } else {
          segments.push({
            videoId: meta.videoId,
            title: cleanTitle,
            startSeconds: cursor,
            endSeconds: snappedEnd,
            durationSeconds: partDuration
          });
        }

        cursor = snappedEnd;
      }

      return { segments, breakdownSource: "playlist+transcript" };
    }
  }

  // Strategy 2: Native/description chapters + transcript segmentation for uncovered regions
  const segments: RawLectureSegment[] = [];
  const chapters: ChapterMark[] = [...meta.chapters];

  if (chapters.length >= 2) {
    const validChapters = chapters.filter((c) => c.startSeconds < totalSec - 15);
    for (let i = 0; i < validChapters.length; i++) {
      const ch = validChapters[i];
      const nextStart = i < validChapters.length - 1 ? validChapters[i + 1].startSeconds : ch.endSeconds || totalSec;
      const endSec = Math.min(totalSec, ch.endSeconds && ch.endSeconds > ch.startSeconds ? ch.endSeconds : nextStart);
      if (endSec - ch.startSeconds >= 20) {
        segments.push({
          videoId: meta.videoId,
          title: cleanVideoTitle(ch.title),
          startSeconds: ch.startSeconds,
          endSeconds: endSec,
          durationSeconds: endSec - ch.startSeconds
        });
      }
    }
  }

  const coveredUpTo = segments.length > 0 ? segments[segments.length - 1].endSeconds : 0;

  if (totalSec - coveredUpTo > 180) {
    const remaining = totalSec - coveredUpTo;
    const idealLectureSec =
      totalSec > 25000
        ? 1200
        : totalSec > 7200
        ? 900
        : Math.max(300, Math.min(900, Math.round((dailyCommitmentMinutes * 60) / 2)));

    const chunkCount = Math.max(1, Math.round(remaining / idealLectureSec));
    let cursor = coveredUpTo;

    for (let i = 0; i < chunkCount; i++) {
      const targetEnd = i === chunkCount - 1 ? totalSec : Math.round(coveredUpTo + ((i + 1) * remaining) / chunkCount);
      const snappedEnd =
        i === chunkCount - 1
          ? totalSec
          : snapToTranscriptBoundary(meta.transcript, targetEnd, Math.min(180, Math.floor(idealLectureSec / 4)), []);
      const endSec = Math.max(cursor + 120, Math.min(totalSec, snappedEnd));

      const sliceText = meta.transcript
        .filter((t) => t.startSeconds >= cursor && t.startSeconds < endSec)
        .map((t) => t.text)
        .join(" ");

      const kws = extractTopicKeywords(sliceText, 3);
      const topicLabel = kws.length > 0 ? kws.join(" & ") : `Core Implementation Part ${segments.length + 1}`;

      segments.push({
        videoId: meta.videoId,
        title: `Deep Dive: ${topicLabel}`,
        startSeconds: cursor,
        endSeconds: endSec,
        durationSeconds: endSec - cursor
      });

      cursor = endSec;
    }
  }

  return {
    segments,
    breakdownSource: meta.chapters.length > 0 ? "chapters+transcript" : "transcript-ai"
  };
}

export function buildRawSegmentsFromPlaylist(playlist: PlaylistMetadata): {
  segments: RawLectureSegment[];
  breakdownSource: Course["breakdownSource"];
} {
  const segments: RawLectureSegment[] = playlist.videos.map((v) => ({
    videoId: v.videoId,
    title: cleanVideoTitle(v.title),
    startSeconds: 0,
    endSeconds: v.durationSeconds,
    durationSeconds: v.durationSeconds
  }));
  return { segments, breakdownSource: "playlist+transcript" };
}

function classifyLectureBucket(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("helpdesk") || t.includes("capstone") || t.includes("frontend") || t.includes("travel agent")) {
    return "capstone";
  }
  if (t.includes("questionansweradvisor") || t.includes("rag") || t.includes("vector") || t.includes("embedding") || t.includes("etl") || t.includes("pdf")) {
    return "rag";
  }
  if (t.includes("tool calling") || t.includes("ai agent") || t.includes("mcp") || t.includes("model context protocol")) {
    return "agents";
  }
  if (t.includes("memory") || t.includes("session") || t.includes("jdbc") || t.includes("llms to remember") || t.includes("making llm learn")) {
    return "memory";
  }
  if (t.includes("prompt") || t.includes("template") || t.includes("advisor") || t.includes("streaming") || t.includes("multiple models")) {
    return "prompting";
  }
  if (t.includes("what is") || t.includes("setup") || t.includes("first") || t.includes("ollama") || t.includes("chatclient") || t.includes("intro")) {
    return "foundations";
  }
  return "general";
}

function formatBucketTitle(bucket: string, lectures: Lesson[], sectionIndex: number, usedLabels: Set<string>): string {
  const labelMap: Record<string, string> = {
    foundations: "Foundations, Setup & Core APIs",
    prompting: "Prompt Engineering, Advisors & Streaming",
    memory: "Chat Memory, Sessions & Persistence",
    rag: "RAG, Vector Databases & ETL Pipelines",
    agents: "Tool Calling & AI Agents",
    capstone: "Full-Stack Capstone Project"
  };

  let base = labelMap[bucket];
  if (!base) {
    const kws = extractTopicKeywords(lectures.map((l) => l.title).join(" "), 3);
    base = kws.length >= 2 ? `${kws.slice(0, 2).join(" & ")}` : "Core Concepts & Implementation";
  }

  // Deduplicate if two consecutive large sections fall in the same bucket (e.g. RAG Part 1 vs RAG Part 2)
  let finalLabel = base;
  if (usedLabels.has(base)) {
    const suffixKws = extractTopicKeywords(lectures.map((l) => l.title).join(" "), 2);
    finalLabel =
      bucket === "capstone" && lectures.some((l) => l.title.toLowerCase().includes("frontend"))
        ? "Full-Stack Capstone: React Frontend"
        : bucket === "capstone"
        ? "Full-Stack Capstone: Backend API"
        : suffixKws.length > 0
        ? `${base} (${suffixKws.join(" & ")})`
        : `${base} (Continued)`;

    if (usedLabels.has(finalLabel)) {
      finalLabel = `${base} — Part ${Array.from(usedLabels).filter((u) => u.startsWith(base)).length + 1}`;
    }
  }

  usedLabels.add(finalLabel);
  return `Section ${sectionIndex + 1}: ${finalLabel}`;
}

function groupLessonsIntoUdemySections(lessons: Lesson[]): Module[] {
  if (lessons.length <= 4) {
    return [
      {
        id: "mod-1",
        title: "Section 1: Complete Course Curriculum",
        description: `${lessons.length} lectures`,
        lessons
      }
    ];
  }

  const groups: Array<{ bucket: string; lessons: Lesson[] }> = [];
  let currentGroup: { bucket: string; lessons: Lesson[] } = {
    bucket: classifyLectureBucket(lessons[0].title),
    lessons: [lessons[0]]
  };

  for (let i = 1; i < lessons.length; i++) {
    const l = lessons[i];
    const bucket = classifyLectureBucket(l.title);
    const shouldSplitForTopic =
      bucket !== "general" &&
      bucket !== currentGroup.bucket &&
      currentGroup.lessons.length >= 2;
    const shouldSplitForSize = currentGroup.lessons.length >= 8;

    if (shouldSplitForTopic || shouldSplitForSize) {
      groups.push(currentGroup);
      currentGroup = { bucket, lessons: [l] };
    } else {
      if (currentGroup.bucket === "general" && bucket !== "general") {
        currentGroup.bucket = bucket;
      }
      currentGroup.lessons.push(l);
    }
  }
  groups.push(currentGroup);

  // Merge tiny trailing 1-lesson group into previous group if appropriate
  if (groups.length > 1 && groups[groups.length - 1].lessons.length === 1) {
    const last = groups.pop()!;
    groups[groups.length - 1].lessons.push(...last.lessons);
  }

  const usedLabels = new Set<string>();
  return groups.map((g, idx) => {
    // Majority vote on non-general bucket in this group
    const counts = new Map<string, number>();
    for (const l of g.lessons) {
      const b = classifyLectureBucket(l.title);
      if (b !== "general") counts.set(b, (counts.get(b) || 0) + 1);
    }
    const dominantBucket =
      Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || g.bucket;
    const title = formatBucketTitle(dominantBucket, g.lessons, idx, usedLabels);
    const totalSec = g.lessons.reduce((acc, l) => acc + l.durationSeconds, 0);
    return {
      id: `mod-${idx + 1}`,
      title,
      description: `${g.lessons.length} lectures • ${Math.round(totalSec / 60)} min`,
      lessons: g.lessons
    };
  });
}

function buildQuizForSegment(
  seg: RawLectureSegment,
  cues: TranscriptCue[],
  lessonIndex: number
): QuizQuestion[] {
  const fullText = cues.map((c) => c.text).join(" ");
  const kws = extractTopicKeywords(seg.title + " " + fullText, 5);
  const primaryTopic = kws[0] || "the core concept";
  const secondaryTopic = kws[1] || "implementation workflow";

  const midCue = cues.length > 0 ? cues[Math.floor(cues.length * 0.45)] : null;
  const lateCue = cues.length > 2 ? cues[Math.floor(cues.length * 0.78)] : midCue;

  const replay1 = midCue ? midCue.startSeconds : Math.floor(seg.startSeconds + seg.durationSeconds * 0.35);
  const replay2 = lateCue ? lateCue.startSeconds : Math.floor(seg.startSeconds + seg.durationSeconds * 0.7);

  const excerptSnippet = midCue
    ? `"${midCue.text.slice(0, 120).trim()}${midCue.text.length > 120 ? "..." : ""}"`
    : `Covered in ${seg.title}`;

  const quizzes: QuizQuestion[] = [
    {
      id: `q-${lessonIndex + 1}-1`,
      question: `In "${seg.title}", what is the central focus regarding ${primaryTopic}?`,
      options: [
        `Configuring and applying ${primaryTopic} cleanly with ${secondaryTopic} in the application flow`,
        `Completely bypassing ${primaryTopic} and hardcoding static outputs`,
        `Replacing the backend architecture with an unvalidated manual script`,
        `Disabling all error handling and logging during initialization`
      ],
      correctIndex: 0,
      explanation: `At ${formatSecondsToTime(replay1)}, the instructor walks through how ${primaryTopic} integrates with ${secondaryTopic}: ${excerptSnippet}`,
      replayTimestamp: replay1
    }
  ];

  if (seg.durationSeconds >= 300) {
    quizzes.push({
      id: `q-${lessonIndex + 1}-2`,
      question: `Which practical takeaway best summarizes the second half of "${seg.title}"?`,
      options: [
        `Structuring modular components and testing the ${primaryTopic} pipeline step by step`,
        `Skipping configuration files and relying solely on browser localStorage`,
        `Avoiding type safety and dependency injection`,
        `Running blocking synchronous loops inside the main request thread`
      ],
      correctIndex: 0,
      explanation: `Review the demonstration around ${formatSecondsToTime(replay2)} to see how ${primaryTopic} is tested and structured.`,
      replayTimestamp: replay2
    });
  }

  return quizzes;
}

export function assembleCompleteCourse(params: {
  meta: VideoMetadata;
  segments: RawLectureSegment[];
  breakdownSource: Course["breakdownSource"];
  dailyCommitmentMinutes: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  sourceUrl: string;
}): Course {
  const { meta, segments, breakdownSource, dailyCommitmentMinutes, level, sourceUrl } = params;

  const lessons: Lesson[] = segments.map((seg, idx) => {
    const cues =
      seg.videoId === meta.videoId
        ? groupTranscriptIntoReadableCues(meta.transcript, seg.startSeconds, seg.endSeconds, 22)
        : [];

    const cueText = cues.map((c) => c.text).join(" ");
    const keywords = extractTopicKeywords(`${seg.title} ${cueText}`, 5);
    const keyTakeaways = [
      `Covers ${seg.title} (${formatSecondsToTime(seg.startSeconds)} → ${formatSecondsToTime(seg.endSeconds)}).`,
      keywords.length > 0
        ? `Key concepts discussed: ${keywords.join(", ")}.`
        : `Step-by-step walkthrough with practical implementation guidance.`,
      cues.length > 0
        ? `Transcript excerpt: "${cues[0].text.slice(0, 140)}${cues[0].text.length > 140 ? "..." : ""}"`
        : `Watch the full ${Math.max(1, Math.round(seg.durationSeconds / 60))}-minute lecture segment.`
    ];

    const summaryParagraphs =
      cues.length > 0
        ? cues
            .filter((_, cIdx) => cIdx === 0 || cIdx === Math.floor(cues.length / 2) || cIdx === cues.length - 1)
            .map((c) => `- **[${formatSecondsToTime(c.startSeconds)}]** ${c.text}`)
            .join("\n")
        : `- Full lecture breakdown from **${formatSecondsToTime(seg.startSeconds)}** to **${formatSecondsToTime(seg.endSeconds)}**.`;

    const notes = `### ${seg.title}

**Time Window:** \`${formatSecondsToTime(seg.startSeconds)} – ${formatSecondsToTime(seg.endSeconds)}\` (${Math.max(1, Math.round(seg.durationSeconds / 60))} min)

#### Core Topics
${keywords.length > 0 ? keywords.map((k) => `- **${k}**`).join("\n") : "- Practical concept walkthrough"}

#### Timestamped Transcript Highlights
${summaryParagraphs}`;

    return {
      id: `lesson-${idx + 1}`,
      lessonNumber: idx + 1,
      title: seg.title,
      description: `Lecture ${idx + 1}: ${seg.title} (${formatSecondsToTime(seg.startSeconds)} – ${formatSecondsToTime(seg.endSeconds)})`,
      durationSeconds: seg.durationSeconds,
      startSeconds: seg.startSeconds,
      endSeconds: seg.endSeconds,
      videoId: seg.videoId,
      keyTakeaways,
      notes,
      transcriptCues: cues,
      quizzes: buildQuizForSegment(seg, cues, idx)
    };
  });

  const modules = groupLessonsIntoUdemySections(lessons);

  const dailySeconds = Math.max(15, dailyCommitmentMinutes) * 60;
  const schedule: DailySchedule[] = [];
  let currentDay = 1;
  let dayLessonIds: string[] = [];
  let daySeconds = 0;

  for (const lesson of lessons) {
    if (dayLessonIds.length > 0 && daySeconds + lesson.durationSeconds > dailySeconds * 1.25) {
      schedule.push({
        dayNumber: currentDay,
        dateLabel: `Day ${currentDay}`,
        estimatedMinutes: Math.max(1, Math.round(daySeconds / 60)),
        lessonIds: dayLessonIds
      });
      currentDay++;
      dayLessonIds = [lesson.id];
      daySeconds = lesson.durationSeconds;
    } else {
      dayLessonIds.push(lesson.id);
      daySeconds += lesson.durationSeconds;
    }
  }
  if (dayLessonIds.length > 0) {
    schedule.push({
      dayNumber: currentDay,
      dateLabel: `Day ${currentDay}`,
      estimatedMinutes: Math.max(1, Math.round(daySeconds / 60)),
      lessonIds: dayLessonIds
    });
  }

  const placementTest: PlacementQuestion[] = modules.slice(0, 6).map((mod, mIdx) => {
    const kws = extractTopicKeywords(mod.lessons.map((l) => l.title).join(" "), 3);
    const topic = kws.join(", ") || mod.title;
    return {
      id: `pt-${mIdx + 1}`,
      question: `How confident are you with ${mod.title.replace(/^Section \d+:\s*/, "")} (${topic})?`,
      options: [
        `I have built production features using ${kws[0] || "these concepts"} and understand the core patterns`,
        `I know the basics conceptually, but want to see the code implementation`,
        `I am completely new to ${kws[0] || "this section"}`,
        `Keep these lectures in my schedule`
      ],
      correctIndex: 0,
      explanation: `Mastering ${topic} allows skipping the introductory lessons in ${mod.title}.`,
      associatedLessonIds: mod.lessons.slice(0, Math.min(2, mod.lessons.length)).map((l) => l.id)
    };
  });

  const totalDurationSeconds = lessons.reduce((acc, l) => acc + l.durationSeconds, 0);

  return {
    id: `course-${meta.videoId}-${Date.now()}`,
    title: meta.title,
    description:
      meta.description.split("\n").slice(0, 4).join(" ").slice(0, 320) ||
      `Complete ${lessons.length}-lecture structured course created from ${meta.author}'s video.`,
    thumbnail: meta.thumbnail,
    author: meta.author,
    sourceUrl,
    originalVideoId: meta.videoId,
    totalDurationSeconds,
    dailyCommitmentMinutes,
    level,
    breakdownSource,
    resources: meta.resources,
    modules,
    schedule,
    placementTest,
    createdAt: new Date().toISOString()
  };
}
