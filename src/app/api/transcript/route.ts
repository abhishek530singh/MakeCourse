import { NextRequest, NextResponse } from "next/server";
import { fetchYouTubeMetadataAndTranscript, groupTranscriptIntoReadableCues } from "@/lib/transcript";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");
    const start = Number(searchParams.get("start") || 0);
    const end = Number(searchParams.get("end") || 0);

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json({ error: "Valid videoId is required" }, { status: 400 });
    }

    const meta = await fetchYouTubeMetadataAndTranscript(videoId);
    const effectiveEnd = end > start ? end : meta.durationSeconds;
    const cues = groupTranscriptIntoReadableCues(meta.transcript, start, effectiveEnd, 22);

    return NextResponse.json({ cues, durationSeconds: meta.durationSeconds });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch transcript" }, { status: 500 });
  }
}

