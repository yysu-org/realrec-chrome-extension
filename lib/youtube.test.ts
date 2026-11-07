import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canonicalVideoUrl, displayHandle, readYoutubeLocation } from "./youtube.ts";

describe("readYoutubeLocation", () => {
  it("讀出影片、Shorts 與頻道", () => {
    assert.deepEqual(readYoutubeLocation("https://www.youtube.com/watch?v=abcdefghijk"), {
      surface: "watch",
      videoId: "abcdefghijk",
      handle: null,
    });
    assert.deepEqual(readYoutubeLocation("https://www.youtube.com/shorts/abcdefghijk"), {
      surface: "shorts",
      videoId: "abcdefghijk",
      handle: null,
    });
    assert.deepEqual(readYoutubeLocation("https://www.youtube.com/@Linco/videos"), {
      surface: "channel",
      videoId: null,
      handle: "Linco",
    });
    assert.equal(readYoutubeLocation("https://www.youtube.com/feed/subscriptions").surface, "other");
  });

  it("組出回報用的影片網址", () => {
    assert.equal(canonicalVideoUrl("abcdefghijk", "watch"), "https://www.youtube.com/watch?v=abcdefghijk");
    assert.equal(canonicalVideoUrl("abcdefghijk", "shorts"), "https://www.youtube.com/shorts/abcdefghijk");
    assert.equal(canonicalVideoUrl("abcdefghijk", "channel"), null);
    assert.equal(displayHandle("Linco"), "@Linco");
  });
});
