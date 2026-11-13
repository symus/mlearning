import { db } from "@/lib/db";
import { requireChild } from "@/lib/auth/dal";
import { getPlan } from "@/lib/learning/queries";
import { starsFor } from "@/lib/learning/maps";
import { byPath, reachableActivityWhere } from "@/lib/learning/reachable";
import { WORLDS } from "@/lib/worlds";
import { ActivityLibrary, type LibraryItem } from "@/components/child/activity-library";

export const metadata = { title: "All activities" };

export default async function ActivitiesPage() {
  const { session, child } = await requireChild();
  const plan = await getPlan(session.userId);
  const [activities, masteries, stickers] = await Promise.all([
    reachableActivityWhere(child)
      .then((where) =>
        db.activity.findMany({
          where,
          select: { slug: true, title: true, topic: true, subtopic: true, subjectSlug: true, ageBand: true, pathOrder: true, estimatedMinutes: true, isFree: true, objectiveCode: true, body: true, objective: { select: { childTitle: true } } },
        }),
      )
      .then((xs) => xs.sort(byPath)),
    db.objectiveMastery.findMany({ where: { childId: child.id } }),
    db.childSticker.findMany({ where: { childId: child.id }, select: { activitySlug: true } }),
  ]);
  const mastery = new Map(masteries.map((m) => [m.objectiveCode, m]));
  const got = new Set(stickers.map((s) => s.activitySlug));
  const openWorlds = WORLDS.filter((w) => w.status === "open");

  const items: LibraryItem[] = activities
    .filter((a) => openWorlds.some((w) => w.subject === a.subjectSlug))
    .map((a) => {
      const m = mastery.get(a.objectiveCode);
      const started = !!m && m.status !== "NOT_STARTED";
      const world = openWorlds.find((w) => w.subject === a.subjectSlug)!;
      return {
        slug: a.slug,
        title: a.title,
        goal: a.objective.childTitle,
        keywords: `${a.topic} ${a.subtopic} ${world.name}`.toLowerCase(),
        world: { slug: world.slug, name: world.name, colour: world.colour },
        minutes: a.estimatedMinutes,
        hasSong: !!(a.body as { watch?: unknown }).watch,
        status: !started ? "new" : m!.status === "MASTERED" ? "done" : "started",
        stars: starsFor(m?.score ?? 0, started),
        sticker: got.has(a.slug),
        locked: plan === "FREE" && !a.isFree,
      };
    });

  return <ActivityLibrary items={items} worlds={openWorlds.map((w) => ({ slug: w.slug, name: w.name, colour: w.colour }))} />;
}
