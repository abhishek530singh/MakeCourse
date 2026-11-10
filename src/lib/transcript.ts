import { fetchTranscript, TranscriptResponse } from "youtube-transcript";
import { ExternalResource, TranscriptCue } from "./types";

export interface ChapterMark {
  title: string;
  startSeconds: number;
  endSeconds?: number;
}

export interface PlaylistVideoItem {
  videoId: string;
  title: string;
  durationSeconds: number;
  index: number;
}

export interface PlaylistMetadata {
  playlistId: string;
  title: string;
  author: string;
  videos: PlaylistVideoItem[];
}

export interface VideoMetadata {
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  description: string;
  durationSeconds: number;
  chapters: ChapterMark[];
  linkedPlaylistId: string | null;
  resources: ExternalResource[];
  transcript: Array<{ text: string; startSeconds: number; durationSeconds: number }>;
}

function parseTimeStringToSeconds(timeStr: string): number {
  const parts = timeStr.trim().split(":").map((n) => parseInt(n, 10));
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
}

function parseDescriptionChapters(description: string): ChapterMark[] {
  const chapters: ChapterMark[] = [];
  const lines = description.split(/\r?\n/);

  // Matches:
  // "0:00-0:59 - Intro" or "1:02:31 - 1:06:46: Title"
  // "00:00 Intro" or "01:23:45 - Title" or "[00:00] Title"
  const rangeRegex =
    /^\s*(?:[-•➡️🔹*]*\s*)?\[?((?:\d{1,2}:)?\d{1,2}:\d{2})\]?\s*[-–—to]+\s*\[?((?:\d{1,2}:)?\d{1,2}:\d{2})\]?\s*[-–—:|]*\s*(.+?)\s*$/;
  const singleRegex =
    /^\s*(?:[-•➡️🔹*]*\s*)?(?:\d+\.\s*)?\[?((?:\d{1,2}:)?\d{1,2}:\d{2})\]?\s*[-–—:|]*\s*(.+?)\s*$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let match = rangeRegex.exec(trimmed);
    if (match) {
      const startSeconds = parseTimeStringToSeconds(match[1]);
      const endSeconds = parseTimeStringToSeconds(match[2]);
      const title = match[3].replace(/^[-–—:\s]+/, "").trim();
      if (title.length >= 2 && !chapters.some((c) => c.startSeconds === startSeconds)) {
        chapters.push({ title, startSeconds, endSeconds: endSeconds > startSeconds ? endSeconds : undefined });
      }
      continue;
    }

    match = singleRegex.exec(trimmed);
    if (match) {
      const startSeconds = parseTimeStringToSeconds(match[1]);
      const title = match[2].replace(/^[-–—:\s]+/, "").trim();
      // Skip lines that look like a URL or pure timestamp
      if (title.length >= 2 && !title.startsWith("http") && !chapters.some((c) => c.startSeconds === startSeconds)) {
        chapters.push({ title, startSeconds });
      }
    }
  }

  chapters.sort((a, b) => a.startSeconds - b.startSeconds);
  return chapters;
}

function extractResourcesFromDescription(description: string): {
  resources: ExternalResource[];
  linkedPlaylistId: string | null;
} {
  const resources: ExternalResource[] = [];
  let linkedPlaylistId: string | null = null;

  const lines = description.split(/\r?\n/);
  for (const line of lines) {
    // Check for course source code or explicit series playlist
    const ghMatch = line.match(/https?:\/\/github\.com\/[^\s)]+/i);
    if (ghMatch && !resources.some((r) => r.url === ghMatch[0])) {
      resources.push({ label: "Source Code (GitHub)", url: ghMatch[0] });
    }

    const plMatch = line.match(/https?:\/\/(?:www\.)?youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/i);
    if (plMatch) {
      const lower = line.toLowerCase();
      if (
        !linkedPlaylistId &&
        (lower.includes("part by part") ||
          lower.includes("full playlist") ||
          lower.includes("series") ||
          lower.includes("this course"))
      ) {
        linkedPlaylistId = plMatch[1];
        resources.push({ label: "Part-by-Part YouTube Playlist", url: plMatch[0] });
      }
    }
  }

  return { resources, linkedPlaylistId };
}

export async function fetchYouTubeMetadataAndTranscript(videoId: string): Promise<VideoMetadata> {
  let title = `YouTube Course (${videoId})`;
  let author = "YouTube Instructor";
  let thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  let description = "";
  let durationSeconds = 0;
  let chapters: ChapterMark[] = [];
  let linkedPlaylistId: string | null = null;
  let resources: ExternalResource[] = [];

  // 1. Fetch oEmbed metadata (fast, official)
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const resp = await fetch(oembedUrl, { cache: "no-store" });
    if (resp.ok) {
      const data = await resp.json();
      if (data.title) title = data.title;
      if (data.author_name) author = data.author_name;
      if (data.thumbnail_url) thumbnail = data.thumbnail_url;
    }
  } catch (err) {
    console.warn("oEmbed fetch failed:", err);
  }

  // 2. Fetch watch page to extract exact durationSeconds, description chapters, & native markers
  try {
    const watchResp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      },
      cache: "no-store"
    });
    if (watchResp.ok) {
      const html = await watchResp.text();

      const lengthMatch = html.match(/"lengthSeconds":"(\d+)"/);
      if (lengthMatch && lengthMatch[1]) {
        durationSeconds = parseInt(lengthMatch[1], 10);
      }

      // Extract shortDescription cleanly via JSON.parse
      const descMatch = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
      if (descMatch && descMatch[1]) {
        try {
          description = JSON.parse(`"${descMatch[1]}"`);
        } catch {
          description = descMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
        }
      }

      // Try native YouTube chapterRenderer / macroMarkersListItemRenderer
      const nativeChapters: ChapterMark[] = [];
      const chRegex = /"chapterRenderer":\{"title":\{"simpleText":"([^"]+)"\},"timeRangeStartMillis":(\d+)/g;
      let chMatch;
      while ((chMatch = chRegex.exec(html)) !== null) {
        const startSeconds = Math.floor(parseInt(chMatch[2], 10) / 1000);
        if (!nativeChapters.some((c) => c.startSeconds === startSeconds)) {
          nativeChapters.push({ title: chMatch[1], startSeconds });
        }
      }

      const macroRegex =
        /"macroMarkersListItemRenderer":\{"title":\{"simpleText":"([^"]+)"\},"timeDescription":\{"simpleText":"([^"]+)"\}/g;
      while ((chMatch = macroRegex.exec(html)) !== null) {
        const startSeconds = parseTimeStringToSeconds(chMatch[2]);
        if (!nativeChapters.some((c) => c.startSeconds === startSeconds)) {
          nativeChapters.push({ title: chMatch[1], startSeconds });
        }
      }

      const descChapters = description ? parseDescriptionChapters(description) : [];
      chapters = nativeChapters.length >= descChapters.length ? nativeChapters : descChapters;

      if (description) {
        const extracted = extractResourcesFromDescription(description);
        resources = extracted.resources;
        linkedPlaylistId = extracted.linkedPlaylistId;
      }
    }
  } catch (err) {
    console.warn("Watch page metadata scrape failed:", err);
  }

  // 3. Fetch complete Transcript
  let normalizedTranscript: Array<{ text: string; startSeconds: number; durationSeconds: number }> = [];
  try {
    const raw: TranscriptResponse[] = await fetchTranscript(videoId);
    if (raw && raw.length > 0) {
      const maxOffset = raw[raw.length - 1].offset;
      // Detect ms vs seconds accurately against video durationSeconds
      const isMs =
        (durationSeconds > 0 && maxOffset > durationSeconds * 2) ||
        (durationSeconds === 0 && maxOffset > 20000);

      normalizedTranscript = raw.map((item) => ({
        text: item.text.replace(/\s+/g, " ").trim(),
        startSeconds: isMs ? Math.floor(item.offset / 1000) : Math.floor(item.offset),
        durationSeconds: isMs
          ? Math.max(1, Math.floor(item.duration / 1000))
          : Math.max(1, Math.floor(item.duration))
      }));

      if (durationSeconds === 0 && normalizedTranscript.length > 0) {
        const last = normalizedTranscript[normalizedTranscript.length - 1];
        durationSeconds = last.startSeconds + last.durationSeconds;
      }
    }
  } catch (err) {
    console.warn("Transcript fetch failed (captions might be disabled):", err);
  }

  if (durationSeconds === 0) {
    durationSeconds = 3600;
  }

  return {
    videoId,
    title: title.replace(/\s*-\s*YouTube\s*$/, "").trim(),
    author,
    thumbnail,
    description,
    durationSeconds,
    chapters,
    linkedPlaylistId,
    resources,
    transcript: normalizedTranscript
  };
}

export async function fetchPlaylistMetadata(playlistId: string): Promise<PlaylistMetadata | null> {
  try {
    const resp = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      },
      cache: "no-store"
    });
    if (!resp.ok) return null;

    const html = await resp.text();
    const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/);
    if (!match) return null;

    const data = JSON.parse(match[1]);
    const title =
      data?.metadata?.playlistMetadataRenderer?.title ||
      html.match(/<title>(.*?)<\/title>/)?.[1]?.replace(/\s*-\s*YouTube\s*$/, "") ||
      `YouTube Playlist (${playlistId})`;
    const author =
      data?.header?.playlistHeaderRenderer?.ownerText?.runs?.[0]?.text ||
      data?.sidebar?.playlistSidebarRenderer?.items?.[1]?.playlistSidebarSecondaryInfoRenderer?.videoOwner
        ?.videoOwnerRenderer?.title?.runs?.[0]?.text ||
      "YouTube Instructor";

    const videos: PlaylistVideoItem[] = [];

    function walk(node: any) {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }

      // Modern YouTube 2025/2026 playlist schema: lockupViewModel
      if (node.lockupViewModel && node.lockupViewModel.contentId) {
        const lv = node.lockupViewModel;
        const videoId = String(lv.contentId);
        const vidTitle = lv.metadata?.lockupMetadataViewModel?.title?.content || `Lecture ${videos.length + 1}`;
        const durText =
          lv.contentImage?.thumbnailViewModel?.overlays?.[0]?.thumbnailBottomOverlayViewModel?.badges?.[0]
            ?.thumbnailBadgeViewModel?.text || "10:00";
        const durationSeconds = parseTimeStringToSeconds(durText) || 600;
        if (!videos.some((v) => v.videoId === videoId)) {
          videos.push({
            videoId,
            title: vidTitle,
            durationSeconds,
            index: videos.length + 1
          });
        }
        return;
      }

      // Legacy YouTube playlistVideoRenderer
      if (node.playlistVideoRenderer && node.playlistVideoRenderer.videoId) {
        const r = node.playlistVideoRenderer;
        const videoId = String(r.videoId);
        const vidTitle = r.title?.runs?.[0]?.text || r.title?.simpleText || `Lecture ${videos.length + 1}`;
        const durationSeconds = Number(r.lengthSeconds) || parseTimeStringToSeconds(r.lengthText?.simpleText || "10:00");
        if (!videos.some((v) => v.videoId === videoId)) {
          videos.push({
            videoId,
            title: vidTitle,
            durationSeconds,
            index: videos.length + 1
          });
        }
        return;
      }

      for (const key of Object.keys(node)) {
        walk(node[key]);
      }
    }

    walk(data);

    if (videos.length === 0) return null;

    return {
      playlistId,
      title,
      author,
      videos
    };
  } catch (err) {
    console.warn("Playlist metadata fetch failed:", err);
    return null;
  }
}

export function groupTranscriptIntoReadableCues(
  transcript: Array<{ text: string; startSeconds: number; durationSeconds: number }>,
  startSeconds: number,
  endSeconds: number,
  targetChunkSeconds = 20
): TranscriptCue[] {
  const slice = transcript.filter((t) => t.startSeconds >= startSeconds && t.startSeconds < endSeconds);
  if (slice.length === 0) return [];

  const cues: TranscriptCue[] = [];
  let bucketStart = slice[0].startSeconds;
  let bucketEnd = slice[0].startSeconds + slice[0].durationSeconds;
  let texts: string[] = [];

  for (const item of slice) {
    if (texts.length > 0 && item.startSeconds - bucketStart >= targetChunkSeconds) {
      cues.push({
        startSeconds: bucketStart,
        endSeconds: Math.min(endSeconds, bucketEnd),
        text: texts.join(" ").replace(/\s+/g, " ").trim()
      });
      bucketStart = item.startSeconds;
      texts = [];
    }
    texts.push(item.text);
    bucketEnd = item.startSeconds + item.durationSeconds;
  }

  if (texts.length > 0) {
    cues.push({
      startSeconds: bucketStart,
      endSeconds: Math.min(endSeconds, bucketEnd),
      text: texts.join(" ").replace(/\s+/g, " ").trim()
    });
  }

  return cues;
}
