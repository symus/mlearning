/**
 * Adaptive learning rules (pure functions, shared by server and client, unit-tested).
 * Phase 2 version: rule-based difficulty steps + mastery score + spaced review.
 * Phase 5 will replace the scoring with a per-objective knowledge model.
 */
import type { MasteryStatus } from "@prisma/client";

export interface ItemResult {
  correct: boolean;
  hintsUsed: number;
  level: number;
}

/** Step difficulty: two clean correct answers in a row -> up; two misses in a row -> down. */
export function nextLevel(current: number, results: ItemResult[], maxLevel: number): number {
  const lastTwo = results.slice(-2);
  if (lastTwo.length < 2 || lastTwo.some((r) => r.level !== current)) return current;
  if (lastTwo.every((r) => r.correct && r.hintsUsed === 0)) return Math.min(maxLevel, current + 1);
  if (lastTwo.every((r) => !r.correct)) return Math.max(1, current - 1);
  return current;
}

/** Where a child starts: don't make them repeat what they already know. */
export function startLevel(mastery: { score: number; bestLevel: number } | null, maxLevel: number): number {
  if (!mastery || mastery.bestLevel === 0) return 1;
  if (mastery.score >= 0.8) return Math.min(maxLevel, Math.max(2, mastery.bestLevel));
  if (mastery.score >= 0.5) return Math.min(maxLevel, Math.max(1, mastery.bestLevel - 1) || 1);
  return 1;
}

/** Credit for one answer. Hints reduce credit but still count as learning. */
export function itemCredit(r: ItemResult): number {
  if (!r.correct) return 0;
  return r.hintsUsed === 0 ? 1 : r.hintsUsed === 1 ? 0.7 : 0.5;
}

/** Days until next review after each successful session (spaced repetition). */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30, 60];

export interface MasteryState {
  score: number;
  itemsSeen: number;
  itemsCorrect: number;
  bestLevel: number;
  reviewStep: number;
  status: MasteryStatus;
}

export interface MasteryCriteria {
  minAccuracy: number;
  minItems: number;
  atLevel: number;
}

export function updateMastery(
  prev: MasteryState | null,
  results: ItemResult[],
  criteria: MasteryCriteria,
  threshold: number,
  now = new Date(),
): MasteryState & { nextReviewAt: Date; sessionAccuracy: number } {
  const state: MasteryState = prev ?? { score: 0, itemsSeen: 0, itemsCorrect: 0, bestLevel: 0, reviewStep: 0, status: "NOT_STARTED" };
  let { score, itemsSeen } = state;
  for (const r of results) {
    // Moving average that settles as evidence grows; recent answers matter most.
    const alpha = Math.max(0.15, 1 / (itemsSeen + 1));
    score = score + alpha * (itemCredit(r) - score);
    itemsSeen++;
  }
  const correctNow = results.filter((r) => r.correct).length;
  const sessionAccuracy = results.length ? correctNow / results.length : 0;
  const levelReached = results.filter((r) => r.correct).reduce((m, r) => Math.max(m, r.level), 0);
  const bestLevel = Math.max(state.bestLevel, levelReached);

  const metCriteria =
    results.length >= criteria.minItems &&
    sessionAccuracy >= criteria.minAccuracy &&
    bestLevel >= criteria.atLevel &&
    score >= threshold;

  let status: MasteryStatus;
  if (itemsSeen === 0) status = "NOT_STARTED";
  else if (metCriteria || (state.status === "MASTERED" && score >= threshold - 0.1)) status = "MASTERED";
  else if (score >= 0.5) status = "PRACTISING";
  else status = "LEARNING";

  const good = sessionAccuracy >= criteria.minAccuracy;
  const reviewStep = good ? Math.min(state.reviewStep + 1, REVIEW_INTERVALS_DAYS.length - 1) : 0;
  const days = good ? REVIEW_INTERVALS_DAYS[reviewStep] : 1;
  const nextReviewAt = new Date(now.getTime() + days * 86_400_000);

  return {
    score: Math.round(score * 1000) / 1000,
    itemsSeen,
    itemsCorrect: state.itemsCorrect + correctNow,
    bestLevel,
    reviewStep,
    status,
    nextReviewAt,
    sessionAccuracy,
  };
}

/** Effort-focused feedback: praise persistence and strategy, not "being clever". */
export function encouragement(results: ItemResult[]): string {
  const correct = results.filter((r) => r.correct).length;
  const usedHints = results.some((r) => r.hintsUsed > 0);
  const recovered = results.some((r, i) => i > 0 && r.correct && !results[i - 1].correct);
  if (recovered) return "You kept going after a tricky one. That is how brains grow!";
  if (usedHints && correct > 0) return "Great use of hints. Asking for help is a smart move.";
  if (correct === results.length) return "Every answer correct. You are ready for a bigger challenge!";
  return "Good practice! Each try teaches your brain something new.";
}
