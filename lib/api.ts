import { REALREC_ORIGIN } from "./config";
import type { ExtensionYoutubeResponse, PageContext } from "./types";
import { getAccessToken } from "./auth";

const CACHE_MS = 5 * 60 * 1000;

type CacheEntry = {
  at: number;
  token: string;
  body: ExtensionYoutubeResponse;
};

const cache = new Map<string, CacheEntry>();

export function clearLookupCache(): void {
  cache.clear();
}

export async function lookupPage(context: Pick<PageContext, "handle" | "videoId">): Promise<
  | { loggedIn: false; configured: boolean }
  | { loggedIn: true; creator: ExtensionYoutubeResponse["creator"]; error?: string }
> {
  const auth = await getAccessToken();
  if (!auth.token) return { loggedIn: false, configured: auth.configured };
  if (!context.handle && !context.videoId) {
    return { loggedIn: true, creator: null };
  }

  const key = `${context.handle ?? ""}|${context.videoId ?? ""}`;
  const hit = cache.get(key);
  if (hit && hit.token === auth.token && Date.now() - hit.at < CACHE_MS) {
    return { loggedIn: true, creator: hit.body.creator };
  }

  const url = new URL("/api/extension/youtube", REALREC_ORIGIN);
  if (context.handle) url.searchParams.set("handle", context.handle);
  if (context.videoId) url.searchParams.set("video", context.videoId);

  let response = await fetch(url, {
    headers: { Authorization: `Bearer ${auth.token}` },
    cache: "no-store",
  });
  if (response.status === 401) {
    const retried = await getAccessToken();
    if (!retried.token) return { loggedIn: false, configured: true };
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${retried.token}` },
      cache: "no-store",
    });
    if (response.status === 401) return { loggedIn: false, configured: true };
  }
  if (response.status === 429) {
    return { loggedIn: true, creator: null, error: "讀取太頻繁，請稍後再試。" };
  }
  if (!response.ok) {
    return { loggedIn: true, creator: null, error: "業配暫時讀不到。" };
  }
  let body: ExtensionYoutubeResponse;
  try {
    body = (await response.json()) as ExtensionYoutubeResponse;
  } catch {
    return { loggedIn: true, creator: null, error: "業配暫時讀不到。" };
  }
  cache.set(key, { at: Date.now(), token: auth.token, body });
  return { loggedIn: true, creator: body.creator ?? null };
}
