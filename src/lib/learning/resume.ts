import "server-only";
import { db } from "@/lib/db";

const RESUME_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * The latest unfinished attempt (last 24 h) for this child and activity, with its finished answers in order.
 * An item counts as finished when answered correctly or on its second try.
 */
export async function getResumeState(childId: string, activityId: string) {
  const open = await db.attempt.findFirst({
    where: { childId, activityId, completedAt: null, startedAt: { gte: new Date(Date.now() - RESUME_WINDOW_MS) } },
    orderBy: { startedAt: "desc" },
    include: { responses: { orderBy: { createdAt: "asc" } } },
  });
  if (!open?.responses.length) return undefined;
  const byItem = new Map<string, typeof open.responses>();
  for (const r of open.responses) byItem.set(r.itemId, [...(byItem.get(r.itemId) ?? []), r]);
  const finished = [...byItem.entries()]
    .filter(([, rs]) => rs.some((r) => r.isCorrect) || rs.length >= 2)
    .map(([itemId, rs]) => ({ itemId, last: rs[rs.length - 1] }))
    .sort((a, b) => a.last.createdAt.getTime() - b.last.createdAt.getTime());
  if (!finished.length) return undefined;
  return {
    attemptId: open.id,
    results: finished.map(({ itemId, last }) => ({ itemId, correct: last.isCorrect, hintsUsed: last.hintsUsed, level: last.level })),
  };
}
