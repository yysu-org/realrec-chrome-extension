import type { ExtensionCreator, PageContext, YtSurface } from "./types";
import { canonicalVideoUrl, displayHandle } from "./youtube.ts";

export function chipLabel(input: {
  loggedIn: boolean;
  context: Pick<PageContext, "surface" | "handle" | "videoId">;
  creator: Pick<ExtensionCreator, "endorsementCount" | "score" | "endorsements"> | null;
}): string | null {
  const { context, creator } = input;
  if (context.surface === "other" || !context.handle) return null;
  if (!input.loggedIn) return "登入後查看";
  if (!creator) return null;
  const matched = creator.endorsements.filter((item) => item.matchedVideo).length;
  if ((context.surface === "watch" || context.surface === "shorts") && context.videoId && matched > 0) {
    return `這支影片有 ${matched} 則已核可業配`;
  }
  if (creator.endorsementCount === 0 || creator.score.value === "—") return "尚無已核可業配";
  if (context.surface === "channel") {
    return `可信度 ${creator.score.value}，${creator.endorsementCount} 則業配`;
  }
  return `這位創作者有 ${creator.endorsementCount} 則業配`;
}

export function reportButtonLabel(surface: YtSurface): string {
  return surface === "watch" || surface === "shorts" ? "回報這支影片" : "回報這位創作者";
}

export function reportPageUrl(origin: string, context: PageContext, slug: string | null): string | null {
  if (context.surface === "other") return null;
  const url = new URL("/report", origin);
  if (slug) {
    url.searchParams.set("creator", slug);
    url.searchParams.set("from", `/creators/${encodeURIComponent(slug)}`);
  }
  const evidence = context.videoId ? canonicalVideoUrl(context.videoId, context.surface) : null;
  if (evidence) url.searchParams.set("evidence", evidence);
  if (!slug && !evidence) return null;
  return url.href;
}

export function creatorHandleText(handle: string): string {
  return displayHandle(handle);
}
