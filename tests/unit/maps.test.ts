import { describe, expect, it } from "vitest";
import { chunk, pickMap, starsFor } from "@/lib/learning/maps";
import { STOPS, trailPath } from "@/components/art/map-scenes";

describe("lesson maps", () => {
  it("split lessons into maps of up to 10", () => {
    const lessons = Array.from({ length: 23 }, (_, i) => i + 1);
    const maps = chunk(lessons);
    expect(maps.map((m) => m.length)).toEqual([10, 10, 3]);
    expect(chunk([])).toEqual([[]]);
  });

  it("opens the map with the current lesson unless a map is requested", () => {
    const maps = [[{ isCurrent: false }], [{ isCurrent: true }], [{ isCurrent: false }]];
    expect(pickMap(undefined, maps)).toBe(1);
    expect(pickMap("3", maps)).toBe(2);
    expect(pickMap("99", maps)).toBe(1); // out of range falls back
    expect(pickMap(undefined, [[{ isCurrent: false }]])).toBe(0);
  });

  it("gives 0 stars before starting and 1–3 after", () => {
    expect(starsFor(0, false)).toBe(0);
    expect(starsFor(0.2, true)).toBe(1);
    expect(starsFor(0.75, true)).toBe(2);
    expect(starsFor(0.95, true)).toBe(3);
  });

  it("has room for 10 stones that stay inside the map and draws a trail", () => {
    expect(STOPS).toHaveLength(10);
    for (const [x, y] of STOPS) {
      expect(x).toBeGreaterThan(5);
      expect(x).toBeLessThan(95);
      expect(y).toBeGreaterThan(20); // room for Muchi above the current stone
      expect(y).toBeLessThan(92);
    }
    expect(trailPath(STOPS.slice(0, 3))).toMatch(/^M[\d.]+,[\d.]+ C/);
  });
});
