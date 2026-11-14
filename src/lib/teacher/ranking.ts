/**
 * Class ranking for TEACHERS ONLY (children never see it). Pure functions, unit-tested.
 * The teacher picks what to rank by; ties share a place (1, 2, 2, 4) so equal work is treated equally.
 */
export interface StudentStats {
  id: string;
  name: string;
  activities: number; // completed activities in the period
  accuracy: number | null; // correct / answered in the period; null = nothing answered yet
  minutes: number; // learning time in the period
  mastered: number; // skills mastered (in the period, or in total)
  assignmentsDone: number; // assignments passed
}

export const RANK_KEYS = ["mastered", "assignments", "activities", "accuracy", "minutes"] as const;
export type RankKey = (typeof RANK_KEYS)[number];

export const RANK_LABEL: Record<RankKey, string> = {
  mastered: "Skills mastered",
  assignments: "Assignments done",
  activities: "Activities",
  accuracy: "Accuracy",
  minutes: "Minutes",
};

export function parseRankKey(v: string | undefined): RankKey {
  return (RANK_KEYS as readonly string[]).includes(v ?? "") ? (v as RankKey) : "mastered";
}

const value = (s: StudentStats, key: RankKey): number =>
  key === "accuracy" ? (s.accuracy ?? -1) : key === "assignments" ? s.assignmentsDone : s[key];

export interface RankedStudent extends StudentStats {
  rank: number;
}

/** Highest first by `key`; other measures break ties in the order, then name. Places are shared on equal `key`. */
export function rankStudents(rows: StudentStats[], key: RankKey): RankedStudent[] {
  const order = [key, ...RANK_KEYS.filter((k) => k !== key)];
  const sorted = [...rows].sort((a, b) => {
    for (const k of order) {
      const d = value(b, k) - value(a, k);
      if (d !== 0) return d;
    }
    return a.name.localeCompare(b.name);
  });
  let rank = 0;
  return sorted.map((s, i) => {
    if (i === 0 || value(s, key) !== value(sorted[i - 1], key)) rank = i + 1;
    return { ...s, rank };
  });
}
