import "./style.css";
import { readYoutubeLocation } from "../../lib/youtube";
import type { PageContext, YtSurface } from "../../lib/types";

const HOST_ID = "realrec-chip";

export default defineContentScript({
  matches: ["https://www.youtube.com/*"],
  runAt: "document_idle",
  main(ctx) {
    let lastPosted = "";
    let lastLabel = "";
    let timer = 0;
    let publishing = false;
    let force = false;
    const observer = new MutationObserver(() => schedule());

    ctx.onInvalidated(() => {
      window.clearTimeout(timer);
      observer.disconnect();
      document.getElementById(HOST_ID)?.remove();
    });

    chrome.runtime.onMessage.addListener((message) => {
      if (message?.type === "refresh-chip") {
        force = true;
        lastLabel = "";
        schedule();
      }
    });
    document.addEventListener("yt-navigate-finish", () => schedule());
    observer.observe(document.documentElement, { childList: true, subtree: true });
    schedule();

    function schedule() {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void publish();
      }, 200);
    }

    async function publish() {
      if (publishing) return;
      publishing = true;
      const refresh = force;
      force = false;
      try {
        const context = scrape();
        const posted = JSON.stringify(context);
        const changed = posted !== lastPosted;
        if (changed) {
          lastPosted = posted;
          void chrome.runtime.sendMessage({ type: "page", context }).catch(() => {});
        }
        const host = document.getElementById(HOST_ID);
        const current = host?.querySelector(".realrec-label")?.textContent ?? "";
        if (!refresh && !changed && host && current === lastLabel) return;
        if (!context.handle || context.surface === "other") {
          host?.remove();
          lastLabel = "";
          return;
        }
        const chip = await chrome.runtime.sendMessage({ type: "chip", context }).catch(() => null);
        const label = chip && typeof chip.label === "string" ? chip.label : null;
        if (!label) {
          document.getElementById(HOST_ID)?.remove();
          lastLabel = "";
          return;
        }
        lastLabel = label;
        placeChip(label, context.surface);
      } finally {
        publishing = false;
      }
    }
  },
});

function scrape(): PageContext {
  const loc = readYoutubeLocation(location.href);
  return {
    surface: loc.surface,
    videoId: loc.videoId,
    handle: loc.handle ?? findHandle(),
    title: findTitle(),
    url: location.href,
  };
}

function findHandle(): string | null {
  const selectors = [
    "ytd-watch-metadata ytd-video-owner-renderer a[href^='/@']",
    "ytd-reel-player-overlay-renderer a[href^='/@']",
    "#channel-header a[href^='/@']",
  ];
  for (const selector of selectors) {
    const href = document.querySelector(selector)?.getAttribute("href");
    if (!href) continue;
    const match = href.match(/^\/@([^/?#]+)/);
    if (!match) continue;
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return null;
}

function findTitle(): string | null {
  const text =
    document.querySelector("ytd-watch-metadata h1")?.textContent ||
    document.querySelector("ytd-reel-player-overlay-renderer h2")?.textContent;
  const trimmed = text?.trim();
  return trimmed ? trimmed : null;
}

function placeChip(label: string, surface: YtSurface) {
  const anchor = findAnchor(surface);
  if (!anchor?.parentElement) return;
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement("div");
    host.id = HOST_ID;
    const button = document.createElement("button");
    button.type = "button";
    button.addEventListener("click", () => {
      void chrome.runtime.sendMessage({ type: "open-panel" }).catch(() => {});
    });
    const mark = document.createElement("span");
    mark.className = "realrec-mark";
    mark.textContent = "實薦";
    const text = document.createElement("span");
    text.className = "realrec-label";
    button.append(mark, text);
    host.append(button);
  }
  const text = host.querySelector(".realrec-label");
  if (text && text.textContent !== label) text.textContent = label;
  if (surface === "shorts" && anchor.id === "metapanel") {
    if (host.parentElement !== anchor) anchor.prepend(host);
    return;
  }
  if (host.previousElementSibling !== anchor) anchor.insertAdjacentElement("afterend", host);
}

function findAnchor(surface: YtSurface): Element | null {
  if (surface === "watch") {
    return document.querySelector("ytd-watch-metadata #title") || document.querySelector("ytd-watch-metadata h1");
  }
  if (surface === "shorts") {
    return (
      document.querySelector("ytd-reel-player-overlay-renderer #metapanel") ||
      document.querySelector("ytd-reel-player-overlay-renderer #channel-name")
    );
  }
  if (surface === "channel") {
    return (
      document.querySelector("#channel-header-container #buttons") ||
      document.querySelector("ytd-c4-tabbed-header-renderer #channel-header")
    );
  }
  return null;
}
