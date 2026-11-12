import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireChild } from "@/lib/auth/dal";
import { AGE_BANDS } from "@/lib/age";
import { publicItem } from "@/lib/content/check";
import type { ActivityBody } from "@/lib/content/schema";
import { startLevel } from "@/lib/learning/adaptive";
import { getJourneyView } from "@/lib/learning/journey";
import { getPlan } from "@/lib/learning/queries";
import { worldForSubject } from "@/lib/worlds";
import { getResumeState } from "@/lib/learning/resume";
import { Player, type PlayerActivity } from "@/components/child/player";
import { Muchi } from "@/components/mascot";
import { DailyLimitScreen } from "@/components/child/celebration";
import { getToday } from "@/lib/learning/queries";
import { limitStatus } from "@/lib/learning/limits";

export default async function ActivityPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ journey?: string }> }) {
  const { slug } = await params;
  const { journey } = await searchParams;
  const journeySlug = journey && /^[a-z0-9-]+$/.test(journey) ? journey : undefined;
  const { session, child } = await requireChild();

  const activity = await db.activity.findFirst({ where: { slug, status: "PUBLISHED", locale: "en" }, include: { objective: true } });
  if (!activity) notFound();
  const body = activity.body as unknown as ActivityBody;
  const world = worldForSubject(activity.subjectSlug);

  // Journey lessons unlock in order: a locked lesson can't be opened by URL either.
  let lessonNumber: number | undefined;
  if (journeySlug) {
    const view = await getJourneyView(child.id, journeySlug, await getPlan(session.userId));
    const lesson = view?.lessons.find((l) => l.slug === slug);
    if (!view || !lesson) notFound();
    lessonNumber = lesson.n;
    if (lesson.state === "locked") {
      return (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-[2rem] bg-surface p-8 text-center text-ink shadow-xl">
          <Muchi className="size-24" mood="think" />
          <h1 className="text-2xl font-bold">Lesson {lesson.n} is still locked 🔒</h1>
          <p className="text-lg text-ink-soft">Pass lesson {view.current ?? lesson.n - 1} first, and this one will open for you!</p>
          <Link href={`/play/journey/${journeySlug}`} className="btn-pop rounded-full bg-sun px-8 py-4 font-display text-xl font-bold text-ink">Back to my map</Link>
        </div>
      );
    }
  }

  const resume = await getResumeState(child.id, activity.id);
  // Daily limit reached: no new lessons today, but an unfinished one can still be completed.
  if (!resume && limitStatus((await getToday(child.id)).minutes, child.dailyLimitMinutes) === "reached") {
    return <DailyLimitScreen nickname={child.nickname} />;
  }

  const mastery = await db.objectiveMastery.findUnique({ where: { childId_objectiveCode: { childId: child.id, objectiveCode: activity.objectiveCode } } });

  // Only public parts reach the browser: answers, explanations and misconception maps stay on the server.
  const data: PlayerActivity = {
    slug: activity.slug,
    title: activity.title,
    learn: body.learn,
    watch: body.watch,
    levels: body.levels.map((l) => ({ level: l.level, label: l.label, items: l.items.map(publicItem) })),
    worldSlug: world?.slug ?? "",
    backHref: journeySlug ? `/play/journey/${journeySlug}` : `/play/world/${world?.slug ?? ""}`,
    journeySlug,
    objective: { title: activity.objective.title, childTitle: activity.objective.childTitle },
    estimatedMinutes: activity.estimatedMinutes,
    lessonNumber,
  };

  return (
    <Player
      activity={data}
      startLevel={startLevel(mastery, body.levels.length)}
      itemsPerRound={AGE_BANDS[child.ageBand].itemsPerRound}
      young={child.ageBand === "LITTLE_EXPLORERS"}
      nickname={child.nickname}
      resume={resume}
    />
  );
}
