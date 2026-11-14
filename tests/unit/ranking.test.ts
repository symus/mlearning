import { describe, expect, it } from "vitest";
import { parseRankKey, rankStudents, type StudentStats } from "@/lib/teacher/ranking";

const s = (name: string, o: Partial<StudentStats> = {}): StudentStats => ({ id: name, name, activities: 0, accuracy: null, minutes: 0, mastered: 0, assignmentsDone: 0, ...o });

describe("teacher class ranking", () => {
  it("ranks by the chosen measure, highest first", () => {
    const r = rankStudents([s("Ali", { mastered: 2 }), s("Bea", { mastered: 5 }), s("Cy", { mastered: 3 })], "mastered");
    expect(r.map((x) => [x.name, x.rank])).toEqual([["Bea", 1], ["Cy", 2], ["Ali", 3]]);
  });

  it("gives equal results the same place (1, 2, 2, 4) and orders them by other measures, then name", () => {
    const r = rankStudents(
      [s("Dan", { activities: 4, accuracy: 0.5 }), s("Eve", { activities: 4, accuracy: 0.9 }), s("Fay", { activities: 9 }), s("Gus", { activities: 1 })],
      "activities",
    );
    expect(r.map((x) => [x.name, x.rank])).toEqual([["Fay", 1], ["Eve", 2], ["Dan", 2], ["Gus", 4]]);
    expect(rankStudents([s("Zed"), s("Amy")], "minutes").map((x) => [x.name, x.rank])).toEqual([["Amy", 1], ["Zed", 1]]);
  });

  it("puts students who haven't answered anything last when ranking by accuracy", () => {
    const r = rankStudents([s("New"), s("Low", { accuracy: 0.1 }), s("Top", { accuracy: 1 })], "accuracy");
    expect(r.map((x) => x.name)).toEqual(["Top", "Low", "New"]);
  });

  it("falls back to skills mastered for an unknown sort", () => {
    expect(parseRankKey("minutes")).toBe("minutes");
    expect(parseRankKey("../evil")).toBe("mastered");
    expect(parseRankKey(undefined)).toBe("mastered");
  });
});
