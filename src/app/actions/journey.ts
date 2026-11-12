"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getOwnedChild, getSession, requireParent } from "@/lib/auth/dal";
import { checkAnswer, type Answer } from "@/lib/content/check";
import { getJourney } from "@/lib/learning/journey";
import { placementStart } from "@/lib/learning/journey-rules";

async function activeChild() {
  const session = await getSession();
  if (!session?.activeChild) redirect("/play/who");
  return session.activeChild;
}

/** "Start at the beginning": lesson 1, no placement. */
export async function beginJourney(slug: string): Promise<void> {
  const child = await activeChild();
  if (!(await getJourney(slug))) redirect("/play");
  await db.journeyProgress.upsert({
    where: { childId_journeySlug: { childId: child.id, journeySlug: slug } },
    create: { childId: child.id, journeySlug: slug, startLesson: 1 },
    update: {},
  });
  redirect(`/play/journey/${slug}`);
}

/** Check one placement tier (lets the quiz stop early, so children aren't shown questions far above their level). */
export async function checkPlacementTier(slug: string, tier: number, answers: Record<string, Answer>): Promise<{ passed: boolean }> {
  await activeChild();
  const journey = await getJourney(slug);
  const t = journey?.placement.tiers[tier];
  if (!t) return { passed: false };
  return { passed: t.items.every((i) => answers[i.id] !== undefined && checkAnswer(i, answers[i.id]).correct) };
}

/** Score all placement answers on the server and save the starting lesson. */
export async function savePlacement(slug: string, answers: Record<string, Answer>): Promise<{ start: number }> {
  const child = await activeChild();
  const journey = await getJourney(slug);
  if (!journey) return { start: 1 };
  const correct: Record<string, boolean> = {};
  for (const tier of journey.placement.tiers)
    for (const item of tier.items) correct[item.id] = answers[item.id] !== undefined && checkAnswer(item, answers[item.id]).correct;
  const { start } = placementStart(journey.placement, correct);
  await db.journeyProgress.upsert({
    where: { childId_journeySlug: { childId: child.id, journeySlug: slug } },
    create: { childId: child.id, journeySlug: slug, startLesson: start, placedAt: new Date() },
    update: { startLesson: start, placedAt: new Date(), completed: [] },
  });
  return { start };
}

/** Parent: reset a child's journey so they can choose a start again. */
export async function resetJourney(childId: string, slug: string): Promise<void> {
  const session = await requireParent();
  const child = await getOwnedChild(session.userId, childId);
  if (!child) redirect("/parent");
  await db.journeyProgress.deleteMany({ where: { childId: child.id, journeySlug: slug } });
  await db.auditLog.create({ data: { userId: session.userId, action: "journey.reset", targetId: child.id } });
  revalidatePath(`/parent/children/${child.id}`);
}
