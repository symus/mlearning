import { describe, expect, it } from "vitest";
import { MISMATCH_SHOW_MS, PAIRS_FOR, flip, isOver, newGame, pairsFor, publicCards, settle, winner, type MemoryState } from "@/lib/games/memory";

const seeded = (seed = 7) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const ok = (r: ReturnType<typeof flip>) => {
  if ("error" in r) throw new Error(r.error);
  return r.state;
};
/** Indexes of two cards that match, and two that don't. */
const pairOf = (s: MemoryState, pair: number) => s.cards.flatMap((c, i) => (c.pair === pair ? [i] : []));

describe("memory decks", () => {
  it("deals 2 cards per pair, the right number of pairs per age group", () => {
    for (const band of ["LITTLE_EXPLORERS", "YOUNG_THINKERS", "FUTURE_INNOVATORS"] as const) {
      for (const deck of ["animals", "numbers", "letters"] as const) {
        const g = newGame(deck, band, seeded());
        expect(g.cards).toHaveLength(PAIRS_FOR[band] * 2);
        for (let p = 0; p < PAIRS_FOR[band]; p++) expect(pairOf(g, p)).toHaveLength(2);
      }
    }
  });

  it("makes pairs that really belong together, each with one partner", () => {
    for (const [sum, total] of pairsFor("numbers", "YOUNG_THINKERS", 8, seeded(3))) {
      const [a, b] = sum.split(" + ").map(Number);
      expect(a + b).toBe(Number(total));
      expect(a).toBeGreaterThan(0);
      expect(b).toBeGreaterThan(0);
    }
    const totals = pairsFor("numbers", "FUTURE_INNOVATORS", 10, seeded(5)).map(([, t]) => t);
    expect(new Set(totals).size).toBe(10);
    for (const [n, dots] of pairsFor("numbers", "LITTLE_EXPLORERS", 6, seeded())) expect(dots.length).toBe(Number(n));
    for (const [big, small] of pairsFor("letters", "YOUNG_THINKERS", 8, seeded())) expect(small).toBe(big.toLowerCase());
  });
});

describe("memory turns", () => {
  const g = newGame("animals", "LITTLE_EXPLORERS", seeded());
  const [a1, a2] = pairOf(g, 0);
  const [b1] = pairOf(g, 1);

  it("a pair scores and the same player goes again", () => {
    let s = ok(flip(g, "A", a1, 0));
    expect(publicCards(s)[a1]).toEqual({ state: "up", face: g.cards[a1].face });
    s = ok(flip(s, "A", a2, 10));
    expect(s.scores).toEqual({ A: 1, B: 0 });
    expect(s.turn).toBe("A");
    expect(publicCards(s)[a2].state).toBe("won");
  });

  it("a wrong pair stays up for a moment, then turns over and the turn passes", () => {
    let s = ok(flip(g, "A", a1, 0));
    s = ok(flip(s, "A", b1, 10));
    expect(s.revealed).toEqual([a1, b1]);
    expect(flip(s, "A", a2, 20)).toEqual({ error: "wait" });
    expect(flip(s, "B", a2, 20)).toEqual({ error: "not-your-turn" });
    s = settle(s, 10 + MISMATCH_SHOW_MS);
    expect(s.revealed).toEqual([]);
    expect(s.turn).toBe("B");
    expect(ok(flip(s, "B", a1, 10 + MISMATCH_SHOW_MS)).revealed).toEqual([a1]); // B can now play
  });

  it("rejects cards that can't be flipped, and keeps hidden faces out of the public view", () => {
    expect(flip(g, "A", 999, 0)).toEqual({ error: "bad-card" });
    expect(flip(g, "A", 1.5, 0)).toEqual({ error: "bad-card" });
    const s = ok(flip(g, "A", a1, 0));
    expect(flip(s, "A", a1, 1)).toEqual({ error: "bad-card" });
    const view = publicCards(s);
    expect(view.filter((c) => c.state === "down").every((c) => !("face" in c))).toBe(true);
  });

  it("ends when every pair is found, with a winner or a tie", () => {
    let s = g;
    for (let p = 0; p < PAIRS_FOR.LITTLE_EXPLORERS; p++) {
      const [x, y] = pairOf(s, p);
      s = ok(flip(s, "A", x, p * 10));
      s = ok(flip(s, "A", y, p * 10 + 1));
    }
    expect(isOver(s)).toBe(true);
    expect(winner(s)).toBe("A");
    expect(flip(s, "A", 0, 999)).toEqual({ error: "over" });
    expect(winner({ ...s, scores: { A: 3, B: 3 } })).toBe("tie");
  });
});
