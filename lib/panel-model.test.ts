import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chipLabel, reportButtonLabel, reportPageUrl } from "./panel-model.ts";
import type { ExtensionCreator, PageContext } from "./types.ts";

const creator = {
  endorsementCount: 2,
  score: { label: "可信度", value: "64", origin: "社群", votes: "12 票" },
  endorsements: [{ matchedVideo: true }, { matchedVideo: false }],
} as Pick<ExtensionCreator, "endorsementCount" | "score" | "endorsements">;

function context(extra: Partial<PageContext>): PageContext {
  return {
    surface: "watch",
    handle: "linco",
    videoId: "abcdefghijk",
    title: null,
    url: "https://www.youtube.com/watch?v=abcdefghijk",
    ...extra,
  };
}

describe("側欄文案", () => {
  it("未登入不露筆數，目錄沒有的人也不插那一行", () => {
    assert.equal(chipLabel({ loggedIn: false, context: context({}), creator: null }), "登入後查看");
    assert.equal(chipLabel({ loggedIn: true, context: context({}), creator: null }), null);
    assert.equal(chipLabel({ loggedIn: false, context: context({ handle: null }), creator: null }), null);
  });

  it("對上的影片、沒對上的影片、頻道與尚無業配各寫一行", () => {
    assert.equal(chipLabel({ loggedIn: true, context: context({}), creator }), "這支影片有 1 則已核可業配");
    assert.equal(
      chipLabel({
        loggedIn: true,
        context: context({ videoId: "zzzzzzzzzzz" }),
        creator: { ...creator, endorsements: [{ matchedVideo: false }, { matchedVideo: false }] },
      }),
      "這位創作者有 2 則業配",
    );
    assert.equal(
      chipLabel({ loggedIn: true, context: context({ surface: "channel", videoId: null }), creator }),
      "可信度 64，2 則業配",
    );
    assert.equal(
      chipLabel({
        loggedIn: true,
        context: context({ surface: "channel", videoId: null }),
        creator: { ...creator, endorsementCount: 0, score: { ...creator.score, value: "—" } },
      }),
      "尚無已核可業配",
    );
  });

  it("回報頁帶創作者與影片網址", () => {
    assert.equal(reportButtonLabel("watch"), "回報這支影片");
    assert.equal(reportButtonLabel("channel"), "回報這位創作者");
    const href = reportPageUrl("https://realrec.app", context({}), "linco");
    assert.equal(
      href,
      "https://realrec.app/report?creator=linco&from=%2Fcreators%2Flinco&evidence=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Dabcdefghijk",
    );
    assert.equal(
      reportPageUrl("https://realrec.app", context({ surface: "channel", videoId: null, url: "https://www.youtube.com/@linco" }), "linco"),
      "https://realrec.app/report?creator=linco&from=%2Fcreators%2Flinco",
    );
  });
});
