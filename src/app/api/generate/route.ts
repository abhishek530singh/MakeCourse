import { NextRequest, NextResponse } from "next/server";
import { extractYouTubePlaylistId, extractYouTubeVideoId } from "@/lib/youtube";
import { generateCourseWithAI } from "@/lib/gemini";
import { DEMO_COURSES } from "@/lib/demoCourses";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, dailyCommitmentMinutes = 45, level = "Beginner", apiKey } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid YouTube video or playlist URL is required." },
        { status: 400 }
      );
    }

    const videoId = extractYouTubeVideoId(url);
    const playlistId = extractYouTubePlaylistId(url);

    if (!videoId && !playlistId) {
      return NextResponse.json(
        { error: "Could not extract a valid YouTube video or playlist ID from the provided link." },
        { status: 400 }
      );
    }

    // Check if it matches any demo course directly
    if (videoId) {
      const matchedDemo = DEMO_COURSES.find(
        (c) => c.originalVideoId === videoId || c.sourceUrl.includes(videoId)
      );
      if (matchedDemo) {
        return NextResponse.json({ course: matchedDemo });
      }
    }

    // Generate complete course breakdown from real metadata + transcript + chapters/playlist
    const course = await generateCourseWithAI({
      videoId,
      playlistId,
      url,
      dailyCommitmentMinutes: Number(dailyCommitmentMinutes) || 45,
      level: level || "Beginner",
      apiKey
    });

    return NextResponse.json({ course });
  } catch (error: any) {
    console.error("Course generation failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate course from YouTube video." },
      { status: 500 }
    );
  }
}
