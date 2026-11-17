import { describe, expect, it } from "vitest";
import { ONLINE_MS, isPaused, pauseEnd, presenceOf, tomorrowMorning } from "@/lib/learning/pause";

const now = new Date("2026-11-17T15:20:00Z");

describe("parent pause", () => {
  it("pauses for 30 minutes or an hour", () => {
    expect(pauseEnd("30m", now).toISOString()).toBe("2026-11-17T15:50:00.000Z");
    expect(pauseEnd("1h", now).toISOString()).toBe("2026-11-17T16:20:00.000Z");
  });

  it("pauses until 06:00 tomorrow in the parent's time zone", () => {
    expect(tomorrowMorning(now, 0).toISOString()).toBe("2026-11-18T06:00:00.000Z"); // London
    expect(pauseEnd("tomorrow", now, -330).toISOString()).toBe("2026-11-18T00:30:00.000Z"); // India (UTC+5:30): 06:00 IST
    // Just after midnight in India it is already the 18th there, so "tomorrow morning" is the 19th.
    expect(pauseEnd("tomorrow", new Date("2026-11-17T19:00:00Z"), -330).toISOString()).toBe("2026-11-19T00:30:00.000Z");
    expect(pauseEnd("tomorrow", now, 99999).toISOString()).toBe("2026-11-18T06:00:00.000Z"); // nonsense offset → UTC
  });

  it("is paused only until the end time", () => {
    const until = pauseEnd("30m", now);
    expect(isPaused(until, now)).toBe(true);
    expect(isPaused(until, new Date(until.getTime() + 1))).toBe(false);
    expect(isPaused(null, now)).toBe(false);
  });
});

describe("live status", () => {
  it("says what the child is doing right now", () => {
    const seen = new Date(now.getTime() - 20_000);
    const current = { activityTitle: "Rocket Bonds to 10", startedAt: new Date(now.getTime() - 4 * 60_000), answered: 2, ofItems: 6 };
    expect(presenceOf(seen, current, now)).toEqual({ state: "playing", activityTitle: "Rocket Bonds to 10", answered: 2, ofItems: 6, startedMinutesAgo: 4 });
    expect(presenceOf(seen, null, now)).toEqual({ state: "online" });
  });

  it("shows the last time seen once the child has gone, and 'never' before the first visit", () => {
    const old = new Date(now.getTime() - ONLINE_MS - 1);
    expect(presenceOf(old, { activityTitle: "x", startedAt: old, answered: 1, ofItems: 4 }, now)).toEqual({ state: "away", lastSeenAt: old });
    expect(presenceOf(null, null, now)).toEqual({ state: "never" });
  });
});
