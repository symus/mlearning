/** Week helpers (pure, unit-tested). Weeks start on Monday, in the server's local time. */
const DAY = 86_400_000;

export function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - dow);
  return x;
}

export function addWeeks(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n * 7);
  return x;
}

export function weekDays(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(start);
    x.setDate(x.getDate() + i);
    return x;
  });
}

/** Parse ?week=YYYY-MM-DD (any day in the week); falls back to the current week; never in the future. */
export function parseWeek(param: string | undefined, now = new Date()): Date {
  const current = startOfWeek(now);
  if (!param || !/^\d{4}-\d{2}-\d{2}$/.test(param)) return current;
  const [y, m, d] = param.split("-").map(Number);
  const parsed = startOfWeek(new Date(y, m - 1, d));
  if (Number.isNaN(parsed.getTime()) || parsed > current) return current;
  return parsed;
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function changeLabel(now: number, before: number, unit: string): string {
  const diff = now - before;
  if (diff === 0) return `same as the week before`;
  return `${diff > 0 ? "+" : "−"}${Math.abs(diff)} ${unit} vs the week before`;
}

export const WEEK_MS = 7 * DAY;
