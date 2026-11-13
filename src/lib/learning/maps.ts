/** Turning learning paths into illustrated maps (pure, unit-tested). */
export const MAP_SIZE = 10;

/** 1–3 stars from a 0–1 mastery score; 0 when not started. */
export function starsFor(score: number, started: boolean): number {
  if (!started) return 0;
  if (score >= 0.9) return 3;
  if (score >= 0.7) return 2;
  return 1;
}

export function chunk<T>(items: T[], size = MAP_SIZE): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out.length ? out : [[]];
}

/** Which map to show: the requested one (1-based ?map=), else the map with the current lesson, else the first. */
export function pickMap(mapParam: string | undefined, maps: { isCurrent: boolean }[][]): number {
  const n = Number(mapParam);
  if (Number.isInteger(n) && n >= 1 && n <= maps.length) return n - 1;
  const withCurrent = maps.findIndex((m) => m.some((s) => s.isCurrent));
  return withCurrent >= 0 ? withCurrent : 0;
}
