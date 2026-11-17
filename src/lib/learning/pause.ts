/**
 * Parent controls: "lock for a while" and the live "right now" status. Pure, unit-tested.
 */
export const PAUSE_OPTIONS = ["30m", "1h", "tomorrow"] as const;
export type PauseOption = (typeof PAUSE_OPTIONS)[number];

export const PAUSE_LABEL: Record<PauseOption, string> = { "30m": "30 minutes", "1h": "1 hour", tomorrow: "Until tomorrow morning" };

/** The child's screen checks in this often; a child seen within ONLINE_MS is "on Arivupulla now". */
export const HEARTBEAT_MS = 45_000;
export const ONLINE_MS = 2 * 60_000;
const MAX_PAUSE_MS = 36 * 3600_000;

/** Tomorrow 06:00 in the given time zone offset (minutes, as Date#getTimezoneOffset returns). */
export function tomorrowMorning(now: Date, tzOffsetMinutes: number): Date {
  const local = new Date(now.getTime() - tzOffsetMinutes * 60_000); // wall-clock time as UTC fields
  const target = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + 1, 6, 0, 0);
  return new Date(target + tzOffsetMinutes * 60_000);
}

/** When a pause ends. The parent's browser sends its time zone so "tomorrow morning" means their morning. */
export function pauseEnd(option: PauseOption, now: Date, tzOffsetMinutes = 0): Date {
  if (option === "30m") return new Date(now.getTime() + 30 * 60_000);
  if (option === "1h") return new Date(now.getTime() + 60 * 60_000);
  const offset = Number.isFinite(tzOffsetMinutes) && Math.abs(tzOffsetMinutes) <= 14 * 60 ? tzOffsetMinutes : 0;
  const end = tomorrowMorning(now, offset);
  return end.getTime() - now.getTime() > MAX_PAUSE_MS ? new Date(now.getTime() + MAX_PAUSE_MS) : end;
}

export function isPaused(pausedUntil: Date | null | undefined, now = new Date()): boolean {
  return !!pausedUntil && pausedUntil > now;
}

export type Presence =
  | { state: "playing"; activityTitle: string; answered: number; ofItems: number; startedMinutesAgo: number }
  | { state: "online" }
  | { state: "away"; lastSeenAt: Date }
  | { state: "never" };

/** What the parent sees: playing an activity now, on the app now, last seen, or never played. */
export function presenceOf(
  lastSeenAt: Date | null,
  current: { activityTitle: string; startedAt: Date; answered: number; ofItems: number } | null,
  now = new Date(),
): Presence {
  if (!lastSeenAt) return { state: "never" };
  if (now.getTime() - lastSeenAt.getTime() > ONLINE_MS) return { state: "away", lastSeenAt };
  if (current) {
    return {
      state: "playing",
      activityTitle: current.activityTitle,
      answered: Math.min(current.answered, current.ofItems),
      ofItems: current.ofItems,
      startedMinutesAgo: Math.max(0, Math.round((now.getTime() - current.startedAt.getTime()) / 60_000)),
    };
  }
  return { state: "online" };
}
