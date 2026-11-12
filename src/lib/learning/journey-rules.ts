/**
 * Lesson-journey rules (pure, unit-tested).
 * A journey is a numbered sequence of lessons. Children unlock the next lesson by passing the
 * current one; earlier lessons can always be replayed. A placement check sets the start lesson.
 */
import type { Journey } from "@/lib/content/schema";

export interface JourneyLesson {
  n: number; // 1-based lesson number
  slug: string; // activity slug
  stage: number; // index into journey.stages
}

export function flattenLessons(journey: Pick<Journey, "stages">): JourneyLesson[] {
  let n = 0;
  return journey.stages.flatMap((s, stage) => s.lessons.map((slug) => ({ n: ++n, slug, stage })));
}

/** First failed tier decides the start lesson; a tier passes only if every item in it is correct. */
export function placementStart(placement: Journey["placement"], correct: Record<string, boolean>): { start: number; tiersPassed: number } {
  for (let t = 0; t < placement.tiers.length; t++) {
    const tier = placement.tiers[t];
    if (!tier.items.every((i) => correct[i.id] === true)) return { start: tier.startIfFailed, tiersPassed: t };
  }
  return { start: placement.allPassStart, tiersPassed: placement.tiers.length };
}

export type LessonState = "done" | "placed" | "current" | "open" | "locked";

/** Highest lesson the child may open. */
export function unlockedUpTo(startLesson: number, completed: number[], total: number): number {
  const best = completed.filter((n) => n >= startLesson).reduce((m, n) => Math.max(m, n), startLesson - 1);
  return Math.min(total, Math.max(startLesson, best + 1));
}

export function currentLesson(startLesson: number, completed: number[], total: number): number | null {
  const up = unlockedUpTo(startLesson, completed, total);
  for (let n = startLesson; n <= up; n++) if (!completed.includes(n)) return n;
  return null; // journey finished
}

export function lessonStates(total: number, startLesson: number, completed: number[]): LessonState[] {
  const up = unlockedUpTo(startLesson, completed, total);
  const current = currentLesson(startLesson, completed, total);
  return Array.from({ length: total }, (_, i) => {
    const n = i + 1;
    if (completed.includes(n)) return "done";
    if (n === current) return "current";
    if (n < startLesson) return "placed";
    if (n <= up) return "open";
    return "locked";
  });
}
