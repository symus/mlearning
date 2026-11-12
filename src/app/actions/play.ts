"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/dal";
import { checkAnswer, type Answer } from "@/lib/content/check";
import type { ActivityBody, Item } from "@/lib/content/schema";
import { encouragement, updateMastery, type ItemResult } from "@/lib/learning/adaptive";
import { freeLimitReached, getPlan, getToday } from "@/lib/learning/queries";
import { ACHIEVEMENTS, type AchievementCode } from "@/lib/achievements";

async function requireChildSession() {
  const session = await getSession();
  if (!session?.activeChild) throw new Error("No active child profile.");
  return { session, child: session.activeChild };
}

function findItem(body: ActivityBody, itemId: string): { item: Item; level: number } | null {
  for (const lvl of body.levels) {
    const item = lvl.items.find((i) => i.id === itemId);
    if (item) return { item, level: lvl.level };
  }
  return null;
}

export async function startAttempt(slug: string, startLevel: number): Promise<{ attemptId: string } | { error: string }> {
  const { session, child } = await requireChildSession();
  const activity = await db.activity.findFirst({ where: { slug, status: "PUBLISHED" } });
  if (!activity) return { error: "This activity isn't available." };
  const plan = await getPlan(session.userId);
  if (plan === "FREE" && !activity.isFree) return { error: "locked" };
  if (await freeLimitReached(child.id, plan)) return { error: "limit" };
  const attempt = await db.attempt.create({ data: { childId: child.id, activityId: activity.id, startLevel } });
  return { attemptId: attempt.id };
}

export interface AnswerFeedback {
  correct: boolean;
  final: boolean; // no more tries for this item
  remedy?: string; // targeted help after a first wrong try
  explanation?: string;
  correctAnswer?: string;
}

/** Check an answer on the server. A first wrong try returns targeted help; the second shows the explanation. */
export async function submitAnswer(input: { attemptId: string; itemId: string; answer: Answer; hintsUsed: number; tryNumber: number; timeMs: number }): Promise<AnswerFeedback> {
  const { child } = await requireChildSession();
  const attempt = await db.attempt.findFirst({ where: { id: input.attemptId, childId: child.id, completedAt: null }, include: { activity: true } });
  if (!attempt) throw new Error("Attempt not found.");
  const body = attempt.activity.body as unknown as ActivityBody;
  const found = findItem(body, input.itemId);
  if (!found) throw new Error("Item not found.");

  const result = checkAnswer(found.item, input.answer);
  const final = result.correct || input.tryNumber >= 2;
  await db.attemptResponse.create({
    data: {
      attemptId: attempt.id,
      itemId: input.itemId,
      level: found.level,
      answer: input.answer as never,
      isCorrect: result.correct,
      hintsUsed: Math.max(0, Math.min(3, input.hintsUsed)) + (input.tryNumber - 1),
      misconception: result.misconception,
      timeMs: Math.max(0, Math.min(600_000, input.timeMs)),
    },
  });

  const remedy = result.misconception ? body.misconceptions.find((m) => m.code === result.misconception)?.remedy : undefined;
  if (!final) return { correct: false, final: false, remedy: remedy ?? found.item.hints[0] };
  return { correct: result.correct, final: true, explanation: found.item.explanation, correctAnswer: result.correct ? undefined : describeAnswer(found.item), remedy };
}

function describeAnswer(item: Item): string {
  if (item.type === "choice") return item.options.find((o) => o.id === item.answer)?.label ?? item.answer;
  if (item.type === "number") return `${item.answer}${item.unit ? ` ${item.unit}` : ""}`;
  return item.answer.map((id) => item.tiles.find((t) => t.id === id)?.label ?? id).join(" → ");
}

export interface AttemptSummary {
  correct: number;
  total: number;
  levelReached: number;
  message: string;
  masteryStatus: string;
  masteredNow: boolean;
  newAchievements: { code: string; title: string; emoji: string; description: string }[];
  followUp: { slug: string; title: string } | null;
  todayMinutes: number;
  dailyGoalMinutes: number;
}

export async function finishAttempt(attemptId: string): Promise<AttemptSummary> {
  const { child } = await requireChildSession();
  const attempt = await db.attempt.findFirst({
    where: { id: attemptId, childId: child.id },
    include: { activity: { include: { objective: true } }, responses: { orderBy: { createdAt: "asc" } } },
  });
  if (!attempt) throw new Error("Attempt not found.");
  const body = attempt.activity.body as unknown as ActivityBody;

  // The last response per item is its final result.
  const finalByItem = new Map<string, (typeof attempt.responses)[number]>();
  for (const r of attempt.responses) finalByItem.set(r.itemId, r);
  const results: ItemResult[] = [...finalByItem.values()].map((r) => ({ correct: r.isCorrect, hintsUsed: r.hintsUsed, level: r.level }));
  const correct = results.filter((r) => r.correct).length;
  const levelReached = results.reduce((m, r) => Math.max(m, r.level), attempt.startLevel);

  const prev = await db.objectiveMastery.findUnique({ where: { childId_objectiveCode: { childId: child.id, objectiveCode: attempt.activity.objectiveCode } } });
  const wasMastered = prev?.status === "MASTERED";
  const next = updateMastery(prev, results, body.mastery, attempt.activity.objective.masteryThreshold);
  const misconceptions = { ...((prev?.misconceptions ?? {}) as Record<string, number>) };
  for (const r of attempt.responses) if (r.misconception) misconceptions[r.misconception] = (misconceptions[r.misconception] ?? 0) + 1;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { sessionAccuracy, ...state } = next;

  const now = new Date();
  const alreadyDone = !!attempt.completedAt; // finishing twice must not double-count mastery
  const durationSec = Math.min(1800, Math.round((now.getTime() - attempt.startedAt.getTime()) / 1000));
  if (!alreadyDone) await db.$transaction([
    db.attempt.update({
      where: { id: attempt.id },
      data: { completedAt: attempt.completedAt ?? now, endLevel: levelReached, correctCount: correct, totalCount: results.length, hintsUsed: results.reduce((s, r) => s + r.hintsUsed, 0), durationSec },
    }),
    db.objectiveMastery.upsert({
      where: { childId_objectiveCode: { childId: child.id, objectiveCode: attempt.activity.objectiveCode } },
      create: { childId: child.id, objectiveCode: attempt.activity.objectiveCode, ...state, lastPracticed: now, misconceptions },
      update: { ...state, lastPracticed: now, misconceptions },
    }),
  ]);

  // Effort-based achievements.
  const earned: AchievementCode[] = [];
  const completedCount = await db.attempt.count({ where: { childId: child.id, completedAt: { not: null } } });
  if (completedCount >= 1) earned.push("FIRST_STEP");
  if (completedCount >= 5) earned.push("EXPLORER_5");
  if (results.some((r, i) => i > 0 && r.correct && !results[i - 1].correct)) earned.push("KEEP_GOING");
  if (results.some((r) => r.correct && r.hintsUsed > 0)) earned.push("HINT_HERO");
  if (state.status === "MASTERED") earned.push("MASTER_1");
  const existing = new Set((await db.childAchievement.findMany({ where: { childId: child.id }, select: { code: true } })).map((a) => a.code));
  const fresh = alreadyDone ? [] : earned.filter((c) => !existing.has(c));
  if (fresh.length) await db.childAchievement.createMany({ data: fresh.map((code) => ({ childId: child.id, code })), skipDuplicates: true });

  const followUp = body.followUp ? await db.activity.findFirst({ where: { slug: body.followUp, status: "PUBLISHED" }, select: { slug: true, title: true } }) : null;
  const today = await getToday(child.id);

  return {
    correct,
    total: results.length,
    levelReached,
    message: encouragement(results),
    masteryStatus: state.status,
    masteredNow: state.status === "MASTERED" && !wasMastered,
    newAchievements: fresh.map((code) => ({ code, ...ACHIEVEMENTS[code] })),
    followUp,
    todayMinutes: today.minutes,
    dailyGoalMinutes: child.dailyGoalMinutes,
  };
}
