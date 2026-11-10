export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // standard watch url: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (watchMatch && watchMatch[1]) {
    return watchMatch[1];
  }

  // bare 11 char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
    return url.trim();
  }

  return null;
}

export function extractYouTubePlaylistId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/[?&]list=([^#\&\?]+)/);
  return match ? match[1] : null;
}

export function formatSecondsToTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function formatDurationHuman(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours} hr ${minutes} min`;
  }
  if (hours > 0) {
    return `${hours} hr`;
  }
  return `${minutes} min`;
}
