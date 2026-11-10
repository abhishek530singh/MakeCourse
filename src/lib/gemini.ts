import { Course, Module } from "./types";
import {
  fetchPlaylistMetadata,
  fetchYouTubeMetadataAndTranscript
} from "./transcript";
import {
  assembleCompleteCourse,
  buildRawSegmentsForVideo,
  buildRawSegmentsFromPlaylist
} from "./curriculumBuilder";
import { extractYouTubePlaylistId, extractYouTubeVideoId, formatSecondsToTime } from "./youtube";

interface GenerateCourseParams {
  videoId?: string | null;
  playlistId?: string | null;
  url: string;
  dailyCommitmentMinutes: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  apiKey?: string;
}

export async function generateCourseWithAI(params: GenerateCourseParams): Promise<Course> {
  const { url, dailyCommitmentMinutes, level, apiKey } = params;
  const key = apiKey || process.env.GEMINI_API_KEY;

  const videoId = params.videoId || extractYouTubeVideoId(url);
  const playlistId = params.playlistId || extractYouTubePlaylistId(url);

  let baseCourse: Course;

  // Case 1: Pure playlist URL (no specific videoId, or explicit playlist link without v=)
  if (!videoId && playlistId) {
    const playlist = await fetchPlaylistMetadata(playlistId);
    if (!playlist || playlist.videos.length === 0) {
      throw new Error("Could not extract videos from this YouTube playlist. Ensure the playlist is public.");
    }

    const firstVid = playlist.videos[0].videoId;
    const firstMeta = await fetchYouTubeMetadataAndTranscript(firstVid);
    const { segments, breakdownSource } = buildRawSegmentsFromPlaylist(playlist);

    baseCourse = assembleCompleteCourse({
      meta: {
        ...firstMeta,
        title: playlist.title || firstMeta.title,
        author: playlist.author || firstMeta.author,
        durationSeconds: playlist.videos.reduce((a, b) => a + b.durationSeconds, 0)
      },
      segments,
      breakdownSource,
      dailyCommitmentMinutes,
      level,
      sourceUrl: url
    });
  } else if (videoId) {
    // Case 2: Single Video (including 10-20+ hour mega courses like KN58GwRRu28!)
    const meta = await fetchYouTubeMetadataAndTranscript(videoId);
    const linkedPlaylist = meta.linkedPlaylistId
      ? await fetchPlaylistMetadata(meta.linkedPlaylistId)
      : null;

    const { segments, breakdownSource } = buildRawSegmentsForVideo(
      meta,
      linkedPlaylist,
      dailyCommitmentMinutes
    );

    baseCourse = assembleCompleteCourse({
      meta,
      segments,
      breakdownSource,
      dailyCommitmentMinutes,
      level,
      sourceUrl: url
    });
  } else {
    throw new Error("Invalid YouTube video or playlist URL.");
  }

  // Optional Gemini AI Enrichment: refine modules/notes/quizzes in bounded batches so 15h+ courses never truncate!
  if (key) {
    try {
      return await enrichCourseWithGemini(baseCourse, key);
    } catch (err) {
      console.warn("Gemini enrichment failed, using transcript-grounded course:", err);
    }
  }

  return baseCourse;
}

async function enrichCourseWithGemini(course: Course, apiKey: string): Promise<Course> {
  // Enrich each module (section) in parallel so we never exceed Gemini's output token limit on 16-hour courses
  const enrichedModules: Module[] = await Promise.all(
    course.modules.map(async (mod) => {
      try {
        const lessonSummaries = mod.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          startSeconds: l.startSeconds,
          endSeconds: l.endSeconds,
          transcriptExcerpt: (l.transcriptCues || [])
            .slice(0, 6)
            .map((c) => `[${formatSecondsToTime(c.startSeconds)}] ${c.text}`)
            .join(" ")
            .slice(0, 700)
        }));

        const prompt = `
You are an expert technical instructor designing a Udemy-style curriculum section.
Course Title: ${course.title}
Level: ${course.level}
Current Section: ${mod.title}

Lectures in this section:
${JSON.stringify(lessonSummaries, null, 2)}

For this section, return ONLY raw JSON matching this schema:
{
  "sectionTitle": "Section X: Concise Udemy-style Section Title",
  "lessons": [
    {
      "id": "exact lesson id from input",
      "title": "Clean, professional Udemy lecture title",
      "description": "1-2 sentence overview",
      "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3"],
      "notes": "Markdown study notes with headings and code/conceptual examples",
      "quizzes": [
        {
          "question": "Specific technical comprehension question based on the lecture",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctIndex": 0,
          "explanation": "Clear explanation referencing the concept",
          "replayTimestamp": number (must be between lesson's startSeconds and endSeconds)
        }
      ]
    }
  ]
}
`;

        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.3
              }
            })
          }
        );

        if (!resp.ok) return mod;
        const data = await resp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return mod;

        const parsed = JSON.parse(text);
        const enrichedLessons = mod.lessons.map((orig) => {
          const match = parsed.lessons?.find((x: any) => x.id === orig.id);
          if (!match) return orig;
          return {
            ...orig,
            title: match.title || orig.title,
            description: match.description || orig.description,
            keyTakeaways: Array.isArray(match.keyTakeaways) && match.keyTakeaways.length > 0
              ? match.keyTakeaways
              : orig.keyTakeaways,
            notes: match.notes || orig.notes,
            quizzes:
              Array.isArray(match.quizzes) && match.quizzes.length > 0
                ? match.quizzes.map((q: any, qIdx: number) => ({
                    id: `${orig.id}-q-${qIdx + 1}`,
                    question: q.question,
                    options: q.options,
                    correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
                    explanation: q.explanation || "",
                    replayTimestamp:
                      typeof q.replayTimestamp === "number" &&
                      q.replayTimestamp >= orig.startSeconds &&
                      q.replayTimestamp <= orig.endSeconds
                        ? Math.floor(q.replayTimestamp)
                        : Math.floor(orig.startSeconds + orig.durationSeconds * 0.4)
                  }))
                : orig.quizzes
          };
        });

        return {
          ...mod,
          title: parsed.sectionTitle || mod.title,
          lessons: enrichedLessons
        };
      } catch {
        return mod;
      }
    })
  );

  return {
    ...course,
    modules: enrichedModules
  };
}
