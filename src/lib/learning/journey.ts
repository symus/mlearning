import "server-only";
import type { AgeBand, PlanCode } from "@prisma/client";
import { db } from "@/lib/db";
import type { Journey } from "@/lib/content/schema";
import { currentLesson, flattenLessons, lessonStates, type LessonState } from "./journey-rules";

export async function getJourney(slug: string): Promise<Journey | null> {
  const j = await db.journey.findUnique({ where: { slug } });
  return j ? (j.body as unknown as Journey) : null;
}

/** Journeys offered to a child's age group (e.g. the Reading Journey for ages 3–8). */
export async function journeysForBand(ageBand: AgeBand) {
  const all = await db.journey.findMany();
  return all.map((j) => j.body as unknown as Journey).filter((j) => j.ageBands.includes(ageBand));
}

export interface JourneyLessonView {
  n: number;
  slug: string;
  stage: number;
  title: string;
  minutes: number;
  hasSong: boolean;
  state: LessonState;
  locked: boolean; // plan lock (free plan) — separate from journey order
}

export async function getJourneyView(childId: string, slug: string, plan: PlanCode) {
  const journey = await getJourney(slug);
  if (!journey) return null;
  const lessons = flattenLessons(journey);
  const [progress, activities] = await Promise.all([
    db.journeyProgress.findUnique({ where: { childId_journeySlug: { childId, journeySlug: slug } } }),
    db.activity.findMany({ where: { slug: { in: lessons.map((l) => l.slug) }, status: "PUBLISHED", locale: "en" }, select: { slug: true, title: true, estimatedMinutes: true, isFree: true, body: true } }),
  ]);
  const bySlug = new Map(activities.map((a) => [a.slug, a]));
  const states = lessonStates(lessons.length, progress?.startLesson ?? 1, progress?.completed ?? []);
  const view: JourneyLessonView[] = lessons
    .filter((l) => bySlug.has(l.slug))
    .map((l) => {
      const a = bySlug.get(l.slug)!;
      return {
        ...l,
        title: a.title,
        minutes: a.estimatedMinutes,
        hasSong: !!(a.body as { watch?: unknown }).watch,
        state: states[l.n - 1],
        locked: plan === "FREE" && !a.isFree,
      };
    });
  const current = progress ? currentLesson(progress.startLesson, progress.completed, lessons.length) : null;
  return { journey, lessons: view, progress, current, total: lessons.length };
}

/** Called when an activity finishes: passing a journey lesson unlocks the next one. */
export async function recordJourneyResult(childId: string, activitySlug: string, accuracy: number) {
  const progresses = await db.journeyProgress.findMany({ where: { childId }, include: { journey: true } });
  for (const p of progresses) {
    const journey = p.journey.body as unknown as Journey;
    const lessons = flattenLessons(journey);
    const lesson = lessons.find((l) => l.slug === activitySlug);
    if (!lesson) continue;
    const passed = accuracy >= journey.passAccuracy;
    const completed = passed && !p.completed.includes(lesson.n) ? [...p.completed, lesson.n].sort((a, b) => a - b) : p.completed;
    if (completed !== p.completed) await db.journeyProgress.update({ where: { id: p.id }, data: { completed } });
    const nextN = currentLesson(p.startLesson, completed, lessons.length);
    const next = nextN ? lessons[nextN - 1] : null;
    const nextActivity = next ? await db.activity.findFirst({ where: { slug: next.slug, status: "PUBLISHED" }, select: { slug: true, title: true } }) : null;
    return {
      slug: journey.slug,
      title: journey.title,
      lesson: lesson.n,
      passed,
      next: nextActivity && next ? { n: next.n, slug: nextActivity.slug, title: nextActivity.title } : null,
      finished: nextN === null,
    };
  }
  return null;
}
