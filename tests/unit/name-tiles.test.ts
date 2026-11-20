import { describe, expect, it } from "vitest";
import { isNextLetter, nameLetters, nameTiles, spellsName } from "@/lib/games/name-tiles";

const seeded = (seed = 3) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

describe("write your name with letter tiles", () => {
  it("uses only the name's letters (any script), skipping spaces and dashes", () => {
    expect(nameLetters("Aya")).toEqual(["A", "y", "a"]);
    expect(nameLetters("Zoë-Mai")).toEqual(["Z", "o", "ë", "M", "a", "i"]);
    expect(nameLetters("அருண்")).toEqual(["அ", "ரு", "ண்"]); // Tamil letters stay whole
  });

  it("adds decoy letters that are not in the name, and keeps every name letter", () => {
    const tiles = nameTiles("Ravi", 3, seeded());
    expect(tiles).toHaveLength(7);
    for (const l of ["R", "a", "v", "i"]) expect(tiles).toContain(l);
    const decoys = tiles.filter((t) => !["R", "a", "v", "i"].includes(t));
    expect(decoys.every((d) => !"ravi".includes(d))).toBe(true);
  });

  it("accepts only the child's own name, in order, ignoring capitals", () => {
    expect(spellsName(["a", "Y", "A"], "Aya")).toBe(true);
    expect(spellsName(["A", "y"], "Aya")).toBe(false);
    expect(spellsName(["A", "a", "y"], "Aya")).toBe(false);
    expect(isNextLetter(["A"], "y", "Aya")).toBe(true);
    expect(isNextLetter(["A"], "a", "Aya")).toBe(false);
    expect(isNextLetter(["A", "y", "a"], "a", "Aya")).toBe(false);
  });
});
