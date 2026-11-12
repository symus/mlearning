import "server-only";
import { db } from "@/lib/db";
import type { ActivityBody } from "@/lib/content/schema";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { stickerFor } from "@/lib/rewards";
import { addWeeks, weekDays } from "./week";

const DAY = 86_400_000;

/** Everything in a weekly report, computed from the child's real learning records for one week. */
export async function getWeeklyReport(childId: string, weekStart: Date) {
  const weekEnd = addWeeks(weekStart, 1);
  const prevStart = addWeeks(weekStart, -1);

  const [attempts, prevAttempts, masteries, stickers, achievements] = await Promise.all([
    db.attempt.findMany({
      where: { childId, completedAt: { not: null }, startedAt: { gte: weekStart, lt: weekEnd } },
      include: { activity: { select: { slug: true, title: true, subjectSlug: true, pathOrder: true, ageBand: true, objectiveCode: true, body: true } }, responses: { select: { misconception: true, itemId: true, isCorrect: true } } },
      orderBy: { startedAt: "asc" },
    }),
    db.attempt.findMany({ where: { childId, completedAt: { not: null }, startedAt: { gte: prevStart, lt: weekStart } }, select: { durationSec: true, correctCount: true, totalCount: true } }),
    db.objectiveMastery.findMany({ where: { childId }, include: { objective: { select: { title: true, childTitle: true, subjectSlug: true } } } }),
    db.childSticker.findMany({ where: { childId, earnedAt: { gte: weekStart, lt: weekEnd } } }),
    db.childAchievement.findMany({ where: { childId, earnedAt: { gte: weekStart, lt: weekEnd } } }),
  ]);

  const minutes = (xs: { durationSec: number }[]) => Math.round(xs.reduce((s, a) => s + a.durationSec, 0) / 60);
  const acc = (xs: { correctCount: number; totalCount: number }[]) => {
    const t = xs.reduce((s, a) => s + a.totalCount, 0);
    return t ? xs.reduce((s, a) => s + a.correctCount, 0) / t : null;
  };

  const daily = weekDays(weekStart).map((date) => {
    const next = new Date(date.getTime() + DAY);
    return { date, minutes: minutes(attempts.filter((a) => a.startedAt >= date && a.startedAt < next)) };
  });

  // Per subject.
  const subjects = [...new Set(attempts.map((a) => a.activity.subjectSlug))].map((subject) => {
    const xs = attempts.filter((a) => a.activity.subjectSlug === subject);
    return { subject, minutes: minutes(xs), activities: xs.length, accuracy: acc(xs) };
  });

  // Per objective practised this week.
  const masteryByCode = new Map(masteries.map((m) => [m.objectiveCode, m]));
  const byObjective = new Map<string, typeof attempts>();
  for (const a of attempts) byObjective.set(a.activity.objectiveCode, [...(byObjective.get(a.activity.objectiveCode) ?? []), a]);
  const practised = [...byObjective.entries()].map(([code, xs]) => {
    const m = masteryByCode.get(code);
    const weekAccuracy = acc(xs) ?? 0;
    // Most frequent misconception this week, with the plain-language tip from the content.
    const counts = new Map<string, number>();
    for (const a of xs) for (const r of a.responses) if (r.misconception) counts.set(r.misconception, (counts.get(r.misconception) ?? 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    let tip: { description: string; remedy: string } | null = null;
    if (top) for (const a of xs) {
      const found = (a.activity.body as unknown as ActivityBody).misconceptions.find((mm) => mm.code === top);
      if (found) { tip = found; break; }
    }
    return {
      code,
      title: m?.objective.title ?? code,
      childTitle: m?.objective.childTitle ?? code,
      subject: xs[0].activity.subjectSlug,
      status: m?.status ?? "LEARNING",
      weekAccuracy,
      activities: xs.length,
      tip,
    };
  });

  return {
    weekStart,
    weekEnd,
    totals: {
      minutes: minutes(attempts),
      prevMinutes: minutes(prevAttempts),
      activities: attempts.length,
      prevActivities: prevAttempts.length,
      activeDays: daily.filter((d) => d.minutes > 0 || attempts.some((a) => a.startedAt.toDateString() === d.date.toDateString())).length,
      accuracy: acc(attempts),
      prevAccuracy: acc(prevAttempts),
    },
    daily,
    subjects,
    mastered: practised.filter((p) => p.status === "MASTERED"),
    goingWell: practised.filter((p) => p.status !== "MASTERED" && p.weekAccuracy >= 0.75),
    needsPractice: practised.filter((p) => p.weekAccuracy < 0.6).sort((a, b) => a.weekAccuracy - b.weekAccuracy),
    practised,
    stickers: stickers.map((s) => {
      const a = attempts.find((x) => x.activity.slug === s.activitySlug)?.activity;
      return { slug: s.activitySlug, ...(a ? stickerFor(a) : { emoji: "⭐", name: "Sticker" }) };
    }),
    achievements: achievements.map((a) => ACHIEVEMENTS[a.code as keyof typeof ACHIEVEMENTS]).filter(Boolean),
    dueForReview: masteries.filter((m) => m.nextReviewAt && m.nextReviewAt <= weekEnd && m.status !== "NOT_STARTED").length,
  };
}
