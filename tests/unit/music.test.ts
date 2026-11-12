import { describe, expect, it } from "vitest";
import { composeLine, splitWords } from "@/components/child/music";

const PENTATONIC_HZ = [60, 62, 64, 67, 69, 72, 74, 76].map((m) => 440 * Math.pow(2, (m - 69) / 12));

describe("song tune generator", () => {
  const text = "One little star says hello in the night,";
  const line = composeLine(text, 0, 120);

  it("plays one note per word, on the beat", () => {
    expect(line.notes).toHaveLength(splitWords(text).length);
    line.notes.forEach((n, i) => expect(n.at).toBeCloseTo(i * 0.5));
  });

  it("only uses notes from the pentatonic scale", () => {
    for (const n of line.notes) expect(PENTATONIC_HZ.some((f) => Math.abs(f - n.freq) < 0.01)).toBe(true);
  });

  it("holds the last word and ends lines on home notes (question / answer)", () => {
    expect(line.notes.at(-1)!.beats).toBe(2);
    expect(line.notes.at(-1)!.freq).toBeCloseTo(PENTATONIC_HZ[2]); // E: "question"
    expect(composeLine("Two little stars", 1, 120).notes.at(-1)!.freq).toBeCloseTo(PENTATONIC_HZ[0]); // C: "answer"
    expect(line.seconds).toBeCloseTo((splitWords(text).length + 2) * 0.5);
  });
});
