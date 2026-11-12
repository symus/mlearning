import { describe, expect, it } from "vitest";
import { encouragement, nextLevel, startLevel, updateMastery, REVIEW_INTERVALS_DAYS, type ItemResult } from "@/lib/learning/adaptive";

const r = (correct: boolean, level = 1, hintsUsed = 0): ItemResult => ({ correct, level, hintsUsed });
const criteria = { minAccuracy: 0.8, minItems: 5, atLevel: 2 };

describe("nextLevel", () => {
  it("steps up after two clean correct answers", () => expect(nextLevel(1, [r(true), r(true)], 3)).toBe(2));
  it("does not step up if a hint was used", () => expect(nextLevel(1, [r(true), r(true, 1, 1)], 3)).toBe(1));
  it("steps down after two misses", () => expect(nextLevel(2, [r(false, 2), r(false, 2)], 3)).toBe(1));
  it("stays within bounds", () => {
    expect(nextLevel(3, [r(true, 3), r(true, 3)], 3)).toBe(3);
    expect(nextLevel(1, [r(false), r(false)], 3)).toBe(1);
  });
  it("waits for two answers at the current level", () => expect(nextLevel(2, [r(true, 1), r(true, 2)], 3)).toBe(2));
});

describe("startLevel", () => {
  it("starts beginners at level 1", () => expect(startLevel(null, 3)).toBe(1));
  it("skips what a strong learner already knows", () => expect(startLevel({ score: 0.9, bestLevel: 3 }, 3)).toBe(3));
  it("starts a struggling learner gently", () => expect(startLevel({ score: 0.3, bestLevel: 2 }, 3)).toBe(1));
});

describe("updateMastery", () => {
  const now = new Date("2026-11-12T10:00:00Z");

  it("marks mastery only when all criteria are met", () => {
    const strong = updateMastery(null, [r(true), r(true), r(true, 2), r(true, 2), r(true, 2), r(true, 3)], criteria, 0.8, now);
    expect(strong.status).toBe("MASTERED");
    const short = updateMastery(null, [r(true), r(true, 2)], criteria, 0.8, now);
    expect(short.status).not.toBe("MASTERED");
    const lowLevel = updateMastery(null, [r(true), r(true), r(true), r(true), r(true)], criteria, 0.8, now);
    expect(lowLevel.status).not.toBe("MASTERED");
  });

  it("identifies a learner who is struggling", () => {
    const s = updateMastery(null, [r(false), r(false), r(true, 1, 2), r(false)], criteria, 0.8, now);
    expect(s.status).toBe("LEARNING");
    expect(s.nextReviewAt.getTime() - now.getTime()).toBe(86_400_000);
  });

  it("spaces reviews further apart after each success", () => {
    const first = updateMastery(null, Array(6).fill(r(true, 2)), criteria, 0.8, now);
    expect(first.reviewStep).toBe(1);
    expect(first.nextReviewAt.getTime() - now.getTime()).toBe(REVIEW_INTERVALS_DAYS[1] * 86_400_000);
    const second = updateMastery(first, Array(6).fill(r(true, 2)), criteria, 0.8, now);
    expect(second.reviewStep).toBe(2);
  });

  it("gives partial credit for hint-assisted answers", () => {
    const noHints = updateMastery(null, [r(true), r(true)], criteria, 0.8, now);
    const hints = updateMastery(null, [r(true, 1, 2), r(true, 1, 2)], criteria, 0.8, now);
    expect(hints.score).toBeLessThan(noHints.score);
  });
});

describe("encouragement", () => {
  it("praises persistence after a recovery", () => expect(encouragement([r(false), r(true)])).toMatch(/kept going/));
});
