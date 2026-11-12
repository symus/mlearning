import { describe, expect, it } from "vitest";
import { addWeeks, changeLabel, isoDate, parseWeek, startOfWeek } from "@/lib/learning/week";

describe("weeks", () => {
  it("start on Monday", () => {
    expect(isoDate(startOfWeek(new Date(2026, 10, 12)))).toBe("2026-11-09"); // Thu 12 Nov -> Mon 9 Nov
    expect(isoDate(startOfWeek(new Date(2026, 10, 15)))).toBe("2026-11-09"); // Sunday
    expect(isoDate(startOfWeek(new Date(2026, 10, 9)))).toBe("2026-11-09");
  });
  it("parse a week param and never go into the future", () => {
    const now = new Date(2026, 10, 12);
    expect(isoDate(parseWeek("2026-11-04", now))).toBe("2026-11-02");
    expect(isoDate(parseWeek("2027-01-01", now))).toBe("2026-11-09");
    expect(isoDate(parseWeek("nonsense", now))).toBe("2026-11-09");
    expect(isoDate(addWeeks(new Date(2026, 10, 9), -1))).toBe("2026-11-02");
  });
  it("describes change plainly", () => {
    expect(changeLabel(40, 25, "min")).toBe("+15 min vs the week before");
    expect(changeLabel(10, 10, "min")).toBe("same as the week before");
  });
});
