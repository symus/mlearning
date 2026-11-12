import { describe, expect, it } from "vitest";
import { loadContent } from "@/lib/content/load";
import { currentLesson, flattenLessons, lessonStates, placementStart, unlockedUpTo } from "@/lib/learning/journey-rules";

const reading = loadContent().journeys.find((j) => j.slug === "reading")!;

describe("Reading Journey content", () => {
  it("exists with 22 numbered lessons in 4 stages", () => {
    expect(reading).toBeDefined();
    expect(reading.stages).toHaveLength(4);
    const lessons = flattenLessons(reading);
    expect(lessons).toHaveLength(22);
    expect(lessons[0]).toEqual({ n: 1, slug: "first-sounds", stage: 0 });
  });
});

describe("placement", () => {
  const all = (ids: string[], value: boolean) => Object.fromEntries(ids.map((id) => [id, value]));
  const tierIds = reading.placement.tiers.map((t) => t.items.map((i) => i.id));

  it("starts at lesson 1 when the first tier is missed", () => {
    expect(placementStart(reading.placement, {}).start).toBe(1);
  });
  it("needs every item in a tier right to pass it (no lucky guesses)", () => {
    const half = { [tierIds[0][0]]: true, [tierIds[0][1]]: false };
    expect(placementStart(reading.placement, half).start).toBe(1);
  });
  it("starts at the first failed tier's lesson", () => {
    const correct = { ...all(tierIds[0], true), ...all(tierIds[1], true) };
    expect(placementStart(reading.placement, correct)).toEqual({ start: 7, tiersPassed: 2 });
  });
  it("uses allPassStart when everything is right", () => {
    expect(placementStart(reading.placement, all(tierIds.flat(), true)).start).toBe(reading.placement.allPassStart);
  });
});

describe("lesson unlocking", () => {
  it("opens one lesson at a time from the start lesson", () => {
    expect(unlockedUpTo(1, [], 22)).toBe(1);
    expect(unlockedUpTo(1, [1, 2], 22)).toBe(3);
    expect(currentLesson(1, [1, 2], 22)).toBe(3);
  });
  it("lets placed children skip ahead but replay earlier lessons", () => {
    const states = lessonStates(10, 4, []);
    expect(states.slice(0, 5)).toEqual(["placed", "placed", "placed", "current", "locked"]);
  });
  it("marks passed lessons and finishes the journey", () => {
    expect(lessonStates(3, 1, [1])).toEqual(["done", "current", "locked"]);
    expect(currentLesson(1, [1, 2, 3], 3)).toBeNull();
  });
});
