import { describe, expect, it } from "vitest";
import { loadContent } from "@/lib/content/load";
import { activitySchema } from "@/lib/content/schema";

const lib = loadContent();

describe("content library", () => {
  it("has no validation or integrity errors", () => {
    expect(lib.errors).toEqual([]);
  });

  it("covers every age group in maths and reading", () => {
    for (const band of ["LITTLE_EXPLORERS", "YOUNG_THINKERS", "FUTURE_INNOVATORS"])
      for (const subject of ["maths", "reading"])
        expect(lib.activities.filter((a) => a.ageBand === band && a.subject === subject).length).toBeGreaterThanOrEqual(5);
  });

  it("every activity has all required learning parts", () => {
    for (const a of lib.activities) {
      expect(a.learn.text.length, a.slug).toBeGreaterThan(20);
      expect(a.misconceptions.length, a.slug).toBeGreaterThan(0);
      expect(a.levels.length, a.slug).toBeGreaterThanOrEqual(2);
      for (const l of a.levels) for (const item of l.items) {
        expect(item.hints.length, item.id).toBeGreaterThan(0);
        expect(item.explanation.length, item.id).toBeGreaterThan(9);
      }
    }
  });

  it("path order is unique within each world path", () => {
    const keys = lib.activities.map((a) => `${a.ageBand}:${a.subject}:${a.pathOrder}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("free plan has at least one activity per age group and subject", () => {
    for (const band of ["LITTLE_EXPLORERS", "YOUNG_THINKERS", "FUTURE_INNOVATORS"])
      for (const subject of ["maths", "reading"])
        expect(lib.activities.some((a) => a.ageBand === band && a.subject === subject && a.isFree)).toBe(true);
  });

  it("rejects an activity whose answer is not an option", () => {
    const bad = structuredClone(lib.activities[0]) as Record<string, unknown> & { levels: { items: { type: string; answer: unknown }[] }[] };
    const item = bad.levels[0].items[0];
    if (item.type === "choice") item.answer = "not-an-option";
    expect(activitySchema.safeParse(bad).success).toBe(false);
  });
});

describe("Watch & Sing", () => {
  it("has songs for young learners", () => {
    expect(lib.activities.filter((a) => a.watch?.kind === "song").length).toBeGreaterThanOrEqual(6);
  });

  it("requires captions for every video", async () => {
    const { watchSchema } = await import("@/lib/content/schema");
    expect(watchSchema.safeParse({ kind: "video", title: "Phonics s", src: "/media/s.mp4", credit: "Studio" }).success).toBe(false);
    expect(watchSchema.safeParse({ kind: "video", title: "Phonics s", src: "/media/s.mp4", captions: "/media/s.vtt", credit: "Studio" }).success).toBe(true);
  });
});
