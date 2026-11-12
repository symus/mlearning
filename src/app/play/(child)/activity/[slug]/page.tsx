import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireChild } from "@/lib/auth/dal";
import { AGE_BANDS } from "@/lib/age";
import { publicItem } from "@/lib/content/check";
import type { ActivityBody } from "@/lib/content/schema";
import { startLevel } from "@/lib/learning/adaptive";
import { worldForSubject } from "@/lib/worlds";
import { Player, type PlayerActivity } from "@/components/child/player";

export default async function ActivityPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ journey?: string }> }) {
  const { slug } = await params;
  const { journey } = await searchParams;
  const journeySlug = journey && /^[a-z0-9-]+$/.test(journey) ? journey : undefined;
  const { child } = await requireChild();
  const activity = await db.activity.findFirst({ where: { slug, status: "PUBLISHED", locale: "en" } });
  if (!activity) notFound();
  const body = activity.body as unknown as ActivityBody;
  const mastery = await db.objectiveMastery.findUnique({ where: { childId_objectiveCode: { childId: child.id, objectiveCode: activity.objectiveCode } } });

  // Only public parts reach the browser: answers, explanations and misconception maps stay on the server.
  const data: PlayerActivity = {
    slug: activity.slug,
    title: activity.title,
    learn: body.learn,
    watch: body.watch,
    levels: body.levels.map((l) => ({ level: l.level, label: l.label, items: l.items.map(publicItem) })),
    worldSlug: worldForSubject(activity.subjectSlug)?.slug ?? "",
    backHref: journeySlug ? `/play/journey/${journeySlug}` : `/play/world/${worldForSubject(activity.subjectSlug)?.slug ?? ""}`,
    journeySlug,
  };
  const band = AGE_BANDS[child.ageBand];

  return (
    <Player
      activity={data}
      startLevel={startLevel(mastery, body.levels.length)}
      itemsPerRound={band.itemsPerRound}
      narration={child.narration}
      young={child.ageBand === "LITTLE_EXPLORERS"}
    />
  );
}
