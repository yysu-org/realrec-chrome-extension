import type { YtSurface } from "./types";

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function validVideoId(value: string | null | undefined): value is string {
  return Boolean(value && VIDEO_ID.test(value));
}

export function readYoutubeLocation(href: string): {
  surface: YtSurface;
  videoId: string | null;
  handle: string | null;
} {
  const url = new URL(href);
  const handleMatch = url.pathname.match(/^\/@([^/]+)/);
  let handle: string | null = null;
  if (handleMatch) {
    try {
      handle = decodeURIComponent(handleMatch[1]);
    } catch {
      handle = handleMatch[1];
    }
  }
  if (url.pathname === "/watch") {
    const videoId = url.searchParams.get("v");
    return { surface: "watch", videoId: validVideoId(videoId) ? videoId : null, handle };
  }
  const shorts = url.pathname.match(/^\/shorts\/([^/]+)/);
  if (shorts) {
    return {
      surface: "shorts",
      videoId: validVideoId(shorts[1]) ? shorts[1] : null,
      handle,
    };
  }
  if (handle) return { surface: "channel", videoId: null, handle };
  return { surface: "other", videoId: null, handle: null };
}

export function canonicalVideoUrl(videoId: string, surface: YtSurface): string | null {
  if (!validVideoId(videoId)) return null;
  if (surface === "shorts") return `https://www.youtube.com/shorts/${videoId}`;
  if (surface === "watch") return `https://www.youtube.com/watch?v=${videoId}`;
  return null;
}

export function displayHandle(handle: string): string {
  const key = handle.trim().replace(/^@+/, "");
  return key ? `@${key}` : handle;
}
