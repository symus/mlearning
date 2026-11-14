import "server-only";
import type { AgeBand, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { flattenLessons } from "./journey-rules";
import { journeysForBand } from "./journey";

const BAND_RANK: Record<AgeBand, number> = { LITTLE_EXPLORERS: 0, YOUNG_THINKERS: 1, FUTURE_INNOVATORS: 2 };

/**
 * Every activity a child can reach: their age group's activities, the lessons of their journeys
 * (the Reading Journey for ages 3–8 includes lessons from the younger group), and anything they
 * already earned a sticker for (e.g. before a birthday moved them up an age group).
 * Used by the sticker book and the All activities page so their counts always agree.
 */
export async function reachableActivityWhere(child: { id: string; ageBand: AgeBand }): Promise<Prisma.ActivityWhereInput> {
  const [journeys, stickers] = await Promise.all([
    journeysForBand(child.ageBand),
    db.childSticker.findMany({ where: { childId: child.id }, select: { activitySlug: true } }),
  ]);
  const extra = [...new Set([...journeys.flatMap((j) => flattenLessons(j).map((l) => l.slug)), ...stickers.map((s) => s.activitySlug)])];
  return { status: "PUBLISHED", locale: "en", OR: [{ ageBand: child.ageBand }, { slug: { in: extra } }] };
}

/** Activities a teacher can set for a class of this age group: the age group's activities and its journeys' lessons. */
export async function bandActivityWhere(ageBand: AgeBand): Promise<Prisma.ActivityWhereInput> {
  const journeys = await journeysForBand(ageBand);
  const lessons = [...new Set(journeys.flatMap((j) => flattenLessons(j).map((l) => l.slug)))];
  return { status: "PUBLISHED", locale: "en", OR: [{ ageBand }, { slug: { in: lessons } }] };
}

/** Stable order: by world, then younger lessons first, then path position. */
export function byPath<T extends { subjectSlug: string; ageBand: AgeBand; pathOrder: number }>(a: T, b: T): number {
  return a.subjectSlug.localeCompare(b.subjectSlug) || BAND_RANK[a.ageBand] - BAND_RANK[b.ageBand] || a.pathOrder - b.pathOrder;
}
