import { describe, expect, it } from "vitest";
import { limitStatus } from "@/lib/learning/limits";
import { stickerFor } from "@/lib/rewards";

describe("daily limit", () => {
  it("is off when the parent sets no limit", () => expect(limitStatus(500, null)).toBe("none"));
  it("warns five minutes before a 30-minute limit", () => {
    expect(limitStatus(20, 30)).toBe("ok");
    expect(limitStatus(25, 30)).toBe("lastOne");
    expect(limitStatus(30, 30)).toBe("reached");
  });
  it("warns five minutes before long limits too, not earlier", () => {
    expect(limitStatus(84, 90)).toBe("ok");
    expect(limitStatus(85, 90)).toBe("lastOne");
  });
});

describe("stickers", () => {
  it("are fixed per activity (no randomness)", () => {
    const a = { subjectSlug: "reading", pathOrder: 3, ageBand: "LITTLE_EXPLORERS" };
    expect(stickerFor(a)).toEqual(stickerFor({ ...a }));
    expect(stickerFor(a).emoji).toBeTruthy();
  });
});
