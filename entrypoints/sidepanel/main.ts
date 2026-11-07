import "./panel.css";
import { REALREC_ORIGIN } from "../../lib/config";
import { signInWithGoogle, signOut } from "../../lib/auth";
import { creatorHandleText, reportButtonLabel, reportPageUrl } from "../../lib/panel-model";
import { readYoutubeLocation } from "../../lib/youtube";
import type { ExtensionCreator, ExtensionEndorsement, LookupResult, PageContext } from "../../lib/types";

const app = document.querySelector("#app");
if (!app) throw new Error("缺少側欄根節點。");
const root = app;

let rendering = false;
let again = false;

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "session" && Object.keys(changes).some((key) => key.startsWith("realrec:tab:"))) {
    void render();
  }
});
chrome.tabs.onActivated.addListener(() => {
  void render();
});

void render();

async function render(): Promise<void> {
  if (rendering) {
    again = true;
    return;
  }
  rendering = true;
  try {
    const context = await currentContext();
    root.replaceChildren();
    if (!context || context.surface === "other") {
      header(false);
      paragraph("打開 YouTube 的頻道或影片。", "who");
      return;
    }
    const lookup = await chrome.runtime.sendMessage({ type: "lookup", context });
    paint(context, isLookup(lookup) ? lookup : { loggedIn: false, configured: false });
  } finally {
    rendering = false;
    if (again) {
      again = false;
      void render();
    }
  }
}

function paint(context: PageContext, lookup: LookupResult) {
  if (!lookup.loggedIn) {
    header(false);
    paragraph("登入後查看業配", "who");
    if (!lookup.configured) {
      paragraph("還沒設定 Supabase 網址與 publishable key。", "muted");
      return;
    }
    paragraph("用與實薦相同的 Google 帳號。");
    primary("Google 登入", () => {
      void signInWithGoogle()
        .then(async () => {
          await chrome.runtime.sendMessage({ type: "session-changed" });
          await render();
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : "登入沒有完成。";
          showError(message);
        });
    });
    return;
  }

  header(true);
  if (lookup.error) {
    paragraph(lookup.error);
    return;
  }
  const creator = lookup.creator;
  if (!creator) {
    paragraph(context.handle ? creatorHandleText(context.handle) : "這位創作者", "who");
    paragraph("這位創作者還沒有進實薦。");
    reportButton(context, null);
    return;
  }
  paintCreator(context, creator);
}

function paintCreator(context: PageContext, creator: ExtensionCreator) {
  paragraph(creator.name, "who");
  paragraph(creatorHandleText(creator.handle), "muted");
  const empty = creator.endorsementCount === 0 || creator.score.value === "—";
  if (empty) {
    paragraph("尚無業配", "section");
    paragraph("這位創作者還沒有已核可的業配。");
    reportButton(context, creator.slug);
    return;
  }

  const score = document.createElement("div");
  score.className = "score-line";
  score.append(text(`可信度 ${creator.score.value}`), text(scoreDetail(creator), "muted"));
  root.append(score);
  paragraph(`標示率 ${creator.disclosureRate}`, "muted");

  const matched = creator.endorsements.filter((item) => item.matchedVideo);
  const rest = creator.endorsements.filter((item) => !item.matchedVideo);
  if (context.surface === "watch" || context.surface === "shorts") {
    paragraph(matched.length ? "這支影片" : "這支影片還沒有對上的紀錄", "section");
    for (const item of matched) endorsement(item);
  }
  if (context.surface === "channel") paragraph("已核可業配", "section");
  if ((context.surface === "watch" || context.surface === "shorts") && matched.length && rest.length) {
    paragraph("其他業配", "section");
  }
  const list = context.surface === "channel" ? creator.endorsements : rest;
  for (const item of list) endorsement(item);
  reportButton(context, creator.slug);
  paragraph("評分在實薦的產品頁。", "muted");
}

function endorsement(item: ExtensionEndorsement) {
  const block = document.createElement("div");
  block.className = "item";
  const name = document.createElement("button");
  name.type = "button";
  name.className = "text-btn item-name";
  name.textContent = item.productName;
  name.addEventListener("click", () => {
    void chrome.tabs.create({ url: `${REALREC_ORIGIN}${item.productHtmlPath}` });
  });
  block.append(name, text(`實用度 ${item.usefulness}`), metaLine(item), text(item.occurredOn, "muted"));
  if (item.otherCreators.length) {
    const more = document.createElement("div");
    more.className = "others";
    more.hidden = true;
    for (const creator of item.otherCreators) {
      more.append(text(creator.name, "item-name"), text(creatorHandleText(creator.handle), "muted"), text(`可信度 ${creator.trust}`));
    }
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "text-btn";
    toggle.textContent = "查看推薦者";
    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", () => {
      more.hidden = !more.hidden;
      const open = !more.hidden;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "收合推薦者" : "查看推薦者";
    });
    block.append(toggle, more);
  }
  root.append(block);
}

function metaLine(item: ExtensionEndorsement): HTMLElement {
  const line = document.createElement("p");
  const parts = [item.relationship, item.disclosure === "有標示合作" ? "有標示合作" : null].filter(
    (part): part is string => Boolean(part),
  );
  if (item.disclosure === "未標示合作") {
    if (parts.length) line.append(`${parts.join("，")}，`);
    const mark = document.createElement("span");
    mark.className = "undisclosed";
    mark.textContent = "未標示合作";
    line.append(mark);
    return line;
  }
  line.textContent = parts.join("，");
  return line;
}

function reportButton(context: PageContext, slug: string | null) {
  const href = reportPageUrl(REALREC_ORIGIN, context, slug);
  if (!href) return;
  primary(reportButtonLabel(context.surface), () => {
    void chrome.tabs.create({ url: href });
  });
}

function header(loggedIn: boolean) {
  const bar = document.createElement("div");
  bar.className = "bar";
  bar.append(text("實薦", "mark"));
  const actions = document.createElement("div");
  if (loggedIn) {
    const logout = document.createElement("button");
    logout.type = "button";
    logout.className = "text-btn";
    logout.textContent = "登出";
    logout.addEventListener("click", () => {
      void signOut()
        .then(async () => {
          await chrome.runtime.sendMessage({ type: "session-changed" });
          await render();
        })
        .catch(() => showError("登出沒有完成。"));
    });
    actions.append(logout);
  }
  const close = document.createElement("button");
  close.type = "button";
  close.className = "text-btn";
  close.textContent = "關閉";
  close.addEventListener("click", () => window.close());
  actions.append(close);
  bar.append(actions);
  root.append(bar);
}

function primary(label: string, onClick: () => void) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "primary";
  button.textContent = label;
  button.addEventListener("click", onClick);
  root.append(button);
}

function paragraph(value: string, className?: string) {
  root.append(text(value, className));
}

function text(value: string, className?: string): HTMLParagraphElement {
  const node = document.createElement("p");
  if (className) node.className = className;
  node.textContent = value;
  return node;
}

function scoreDetail(creator: ExtensionCreator): string {
  return [creator.score.origin, creator.score.votes].filter(Boolean).join("，");
}

function showError(message: string) {
  const existing = root.querySelector(".error");
  existing?.remove();
  root.append(text(message, "error"));
}

function isLookup(value: unknown): value is LookupResult {
  return Boolean(value && typeof value === "object" && "loggedIn" in value);
}

async function currentContext(): Promise<PageContext | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return null;
  const key = `realrec:tab:${tab.id}`;
  const stored = await chrome.storage.session.get(key);
  const saved = stored[key] as PageContext | undefined;
  if (saved?.url) return saved;
  if (!tab.url?.startsWith("https://www.youtube.com/")) return null;
  const loc = readYoutubeLocation(tab.url);
  return { ...loc, title: tab.title ?? null, url: tab.url };
}
