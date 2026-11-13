/**
 * Healthy daily limits (pure, unit-tested).
 * "lastOne" starts 5 minutes before the limit (about one activity) so children get a gentle warning.
 */
export type LimitStatus = "none" | "ok" | "lastOne" | "reached";

export function limitStatus(minutesToday: number, limit: number | null | undefined): LimitStatus {
  if (!limit) return "none";
  if (minutesToday >= limit) return "reached";
  if (minutesToday >= limit - 5) return "lastOne";
  return "ok";
}
