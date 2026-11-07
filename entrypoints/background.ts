import { chipLabel } from "../lib/panel-model";
import { clearLookupCache, lookupPage } from "../lib/api";
import type { PageContext } from "../lib/types";

function isContext(value: unknown): value is PageContext {
  if (!value || typeof value !== "object") return false;
  const context = value as PageContext;
  return (
    (context.surface === "watch" ||
      context.surface === "shorts" ||
      context.surface === "channel" ||
      context.surface === "other") &&
    typeof context.url === "string"
  );
}

export default defineBackground(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "page" && sender.tab?.id && isContext(message.context)) {
      void chrome.storage.session.set({ [`realrec:tab:${sender.tab.id}`]: message.context });
      return;
    }
    if (message?.type === "open-panel" && sender.tab?.id) {
      void chrome.sidePanel.open({ tabId: sender.tab.id }).catch(() => {});
      return;
    }
    if (message?.type === "chip" && isContext(message.context)) {
      void chipFor(message.context).then(sendResponse);
      return true;
    }
    if (message?.type === "lookup" && isContext(message.context)) {
      void lookupPage(message.context).then(sendResponse);
      return true;
    }
    if (message?.type === "session-changed") {
      clearLookupCache();
      void chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        if (tab?.id) void chrome.tabs.sendMessage(tab.id, { type: "refresh-chip" }).catch(() => {});
      });
      return;
    }
    return;
  });
});

async function chipFor(context: PageContext): Promise<{ label: string | null }> {
  const result = await lookupPage(context);
  if (!result.loggedIn) {
    return { label: chipLabel({ loggedIn: false, context, creator: null }) };
  }
  if (result.error) return { label: null };
  return { label: chipLabel({ loggedIn: true, context, creator: result.creator }) };
}
