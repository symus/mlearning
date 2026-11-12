import "server-only";
import type { AgeBand, MasteryStatus, PlanCode } from "@prisma/client";
import { db } from "@/lib/db";
import { FREE_DAILY_ACTIVITY_LIMIT } from "@/lib/pricing";

const DAY = 86_400_000;

export function startOfToday(now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getPlan(userId: string): Promise<PlanCode> {
  const sub = await db.subscription.findUnique({ where: { userId }, select: { plan: true, status: true } });
  return sub && (sub.status === "ACTIVE" || sub.status === "TRIALING") ? sub.plan : "FREE";
}

/** Today's learning minutes and activity count for the goal ring and natural stopping points. */
export async function getToday(childId: string) {
  const attempts = await db.attempt.findMany({
    where: { childId, startedAt: { gte: startOfToday() }, completedAt: { not: null } },
    select: { durationSec: true },
  });
  return { minutes: Math.round(attempts.reduce((s, a) => s + a.durationSec, 0) / 60), activities: attempts.length };
}

export async function freeLimitReached(childId: string, plan: PlanCode) {
  if (plan !== "FREE") return false;
  const started = await db.attempt.count({ where: { childId, startedAt: { gte: startOfToday() }, completedAt: { not: null } } });
  return started >= FREE_DAILY_ACTIVITY_LIMIT;
}

export type PathNodeState = "mastered" | "practising" | "learning" | "new" | "review";

/** A world's learning path for one child, with per-activity state and the recommended next step. */
export async function getWorldPath(childId: string, ageBand: AgeBand, subject: string, plan: PlanCode) {
  const [activities, masteries] = await Promise.all([
    db.activity.findMany({
      where: { ageBand, subjectSlug: subject, status: "PUBLISHED", locale: "en" },
      orderBy: { pathOrder: "asc" },
      select: { id: true, slug: true, title: true, topic: true, subtopic: true, objectiveCode: true, estimatedMinutes: true, isFree: true, pathOrder: true, objective: { select: { childTitle: true, prerequisites: true } } },
    }),
    db.objectiveMastery.findMany({ where: { childId } }),
  ]);
  const byCode = new Map(masteries.map((m) => [m.objectiveCode, m]));
  const now = new Date();
  const nodes = activities.map((a) => {
    const m = byCode.get(a.objectiveCode);
    const due = m?.nextReviewAt && m.nextReviewAt <= now && m.status !== "NOT_STARTED";
    const state: PathNodeState = !m || m.status === "NOT_STARTED" ? "new" : due ? "review" : (m.status.toLowerCase() as PathNodeState);
    return { ...a, state, score: m?.score ?? 0, locked: plan === "FREE" && !a.isFree };
  });
  // Recommendation: a due review first, then the first unlocked activity that isn't mastered.
  const next =
    nodes.find((n) => n.state === "review" && !n.locked) ??
    nodes.find((n) => (n.state === "learning" || n.state === "practising") && !n.locked) ??
    nodes.find((n) => n.state === "new" && !n.locked);
  return { nodes, nextSlug: next?.slug ?? null };
}

/** Everything the parent dashboard needs for one child, computed from real learning records. */
export async function getChildReport(childId: string) {
  const weekAgo = new Date(Date.now() - 7 * DAY);
  const [attempts, masteries, totalCompleted] = await Promise.all([
    db.attempt.findMany({
      where: { childId, startedAt: { gte: weekAgo }, completedAt: { not: null } },
      include: { activity: { select: { title: true, subjectSlug: true, slug: true } } },
      orderBy: { startedAt: "desc" },
    }),
    db.objectiveMastery.findMany({
      where: { childId },
      include: { objective: { select: { title: true, childTitle: true, subjectSlug: true, topic: true } } },
      orderBy: { score: "desc" },
    }),
    db.attempt.count({ where: { childId, completedAt: { not: null } } }),
  ]);

  // Minutes per day for the last 7 days (oldest first), for the weekly chart.
  const daily = Array.from({ length: 7 }, (_, i) => {
    const day = startOfToday(new Date(Date.now() - (6 - i) * DAY));
    const next = new Date(day.getTime() + DAY);
    const secs = attempts.filter((a) => a.startedAt >= day && a.startedAt < next).reduce((s, a) => s + a.durationSec, 0);
    return { date: day, minutes: Math.round(secs / 60) };
  });

  const minutesThisWeek = Math.round(attempts.reduce((s, a) => s + a.durationSec, 0) / 60);
  const activeDays = new Set(attempts.map((a) => a.startedAt.toDateString())).size;
  const answered = attempts.reduce((s, a) => s + a.totalCount, 0);
  const correct = attempts.reduce((s, a) => s + a.correctCount, 0);

  const counts = (status: MasteryStatus) => masteries.filter((m) => m.status === status).length;
  const bySubject = ["maths", "reading"].map((subject) => {
    const ms = masteries.filter((m) => m.objective.subjectSlug === subject);
    return {
      subject,
      started: ms.length,
      mastered: ms.filter((m) => m.status === "MASTERED").length,
      avgScore: ms.length ? ms.reduce((s, m) => s + m.score, 0) / ms.length : 0,
      minutes: Math.round(attempts.filter((a) => a.activity.subjectSlug === subject).reduce((s, a) => s + a.durationSec, 0) / 60),
    };
  });

  const strengths = masteries.filter((m) => m.score >= 0.75).slice(0, 3);
  const needsAttention = masteries
    .filter((m) => m.itemsSeen > 0 && m.score < 0.6)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((m) => {
      const mis = Object.entries((m.misconceptions ?? {}) as Record<string, number>).sort((a, b) => b[1] - a[1])[0];
      return { ...m, topMisconception: mis?.[0] ?? null };
    });
  const dueForReview = masteries.filter((m) => m.nextReviewAt && m.nextReviewAt <= new Date() && m.status !== "NOT_STARTED");

  return {
    minutesThisWeek,
    daily,
    activeDays,
    activitiesThisWeek: attempts.length,
    totalCompleted,
    accuracy: answered ? correct / answered : null,
    mastered: counts("MASTERED"),
    practising: counts("PRACTISING") + counts("LEARNING"),
    bySubject,
    strengths,
    needsAttention,
    dueForReview,
    masteries,
    recent: attempts.slice(0, 8),
  };
}
