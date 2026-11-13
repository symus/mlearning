import Link from "next/link";
import { notFound } from "next/navigation";
import { requireChild } from "@/lib/auth/dal";
import { getPlan } from "@/lib/learning/queries";
import { getJourneyView } from "@/lib/learning/journey";
import { beginJourney } from "@/app/actions/journey";
import { WorldArt } from "@/components/art/worlds";
import { Muchi } from "@/components/mascot";
import { LessonMap, type MapStone } from "@/components/child/lesson-map";
import { pickMap, starsFor } from "@/lib/learning/maps";

export const metadata = { title: "Reading Journey" };

export default async function JourneyPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ map?: string }> }) {
  const { slug } = await params;
  const { map } = await searchParams;
  const { session, child } = await requireChild();
  const view = await getJourneyView(child.id, slug, await getPlan(session.userId));
  if (!view || !view.journey.ageBands.includes(child.ageBand)) notFound();
  const { journey, lessons, progress, current, total } = view;

  // First visit: choose how to start.
  if (!progress) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-[2rem] bg-white/10 p-8 text-center ring-1 ring-white/15">
        <WorldArt slug="reading-kingdom" float className="w-40" />
        <h1 className="text-4xl font-bold">{journey.title}</h1>
        <p className="max-w-md text-lg text-white/80">
          {total} lessons from your very first sounds to reading real stories. Where would you like to start, {child.nickname}?
        </p>
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <Link href={`/play/journey/${slug}/placement`} className="btn-pop flex flex-col items-center gap-2 rounded-3xl bg-sun p-6 text-ink">
            <span className="text-4xl" aria-hidden>🧭</span>
            <span className="font-display text-xl font-bold">Find my level</span>
            <span className="text-sm">A few quick questions, then Muchi picks your starting lesson.</span>
          </Link>
          <form action={beginJourney.bind(null, slug)} className="contents">
            <button className="btn-pop flex flex-col items-center gap-2 rounded-3xl bg-leaf p-6 text-white">
              <span className="text-4xl" aria-hidden>🌱</span>
              <span className="font-display text-xl font-bold">Start at the beginning</span>
              <span className="text-sm text-white/85">Lesson 1: hearing first sounds. Great for new readers.</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  const done = progress.completed.length;
  // One map per journey part. Stones keep their journey-wide lesson numbers.
  const byStage = journey.stages.map((_, si) =>
    lessons
      .filter((l) => l.stage === si)
      .map((l): MapStone & { isCurrent: boolean } => {
        const playable = l.state !== "locked" && !l.locked;
        return {
          n: l.n,
          title: l.title,
          href: playable ? `/play/activity/${l.slug}?journey=${slug}` : null,
          state: l.locked ? "locked" : l.state,
          stars: l.state === "done" ? Math.max(1, starsFor(l.score, true)) : 0,
          hasSong: l.hasSong,
          note: l.locked ? "Ask a grown-up" : undefined,
          isCurrent: l.state === "current",
        };
      }),
  );
  const mapIndex = pickMap(map, byStage);
  const stones = byStage[mapIndex];
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center gap-4 rounded-[2rem] bg-white/10 p-5 ring-1 ring-white/15">
        <Muchi className="size-16" mood={current ? "happy" : "cheer"} />
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{journey.title}</h1>
          <p className="text-white/80">
            {current ? `You're on lesson ${current} of ${total}.` : `You finished all ${total} lessons. Amazing reading!`} {done > 0 && `${done} lesson${done > 1 ? "s" : ""} passed.`}
          </p>
          <div className="mt-2 h-3 max-w-md overflow-hidden rounded-full bg-white/15" role="progressbar" aria-label="Journey progress" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total}>
            <div className="h-full rounded-full bg-sun" style={{ width: `${((current ? current - 1 : total) / total) * 100}%` }} />
          </div>
        </div>
        {current && (
          <Link href={`/play/activity/${lessons[current - 1].slug}?journey=${slug}`} className="btn-pop rounded-3xl bg-sun px-6 py-4 text-ink">
            <span className="block text-xs font-bold uppercase tracking-wide">Lesson {current}</span>
            <span className="block font-display text-xl font-bold">Play now ▶</span>
          </Link>
        )}
      </header>

      <LessonMap
        title={journey.title}
        subtitle={`Part ${mapIndex + 1}: ${journey.stages[mapIndex].title}`}
        theme="reading"
        mapIndex={mapIndex}
        mapCount={journey.stages.length}
        stones={stones}
        prevHref={mapIndex > 0 ? `/play/journey/${slug}?map=${mapIndex}` : null}
        nextHref={mapIndex < journey.stages.length - 1 ? `/play/journey/${slug}?map=${mapIndex + 2}` : null}
        homeHref="/play"
        avatar={child.avatar}
      />
    </div>
  );
}
