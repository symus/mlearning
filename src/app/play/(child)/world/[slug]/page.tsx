import Link from "next/link";
import { notFound } from "next/navigation";
import { requireChild } from "@/lib/auth/dal";
import { getWorld } from "@/lib/worlds";
import { getPlan, getWorldPath, type PathNodeState } from "@/lib/learning/queries";
import { chunk, pickMap, starsFor } from "@/lib/learning/maps";
import { themeForSubject } from "@/components/art/map-scenes";
import { LessonMap, type MapStone, type StoneState } from "@/components/child/lesson-map";
import { Muchi } from "@/components/mascot";
import { WorldArt } from "@/components/art/worlds";

const STONE: Record<PathNodeState, StoneState> = { mastered: "done", practising: "started", learning: "started", review: "review", new: "open" };

export default async function WorldPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ map?: string }> }) {
  const { slug } = await params;
  const { map } = await searchParams;
  const world = getWorld(slug);
  if (!world) notFound();
  const { session, child } = await requireChild();

  if (world.status === "soon") {
    return (
      <div className="flex flex-col items-center gap-5 rounded-[2rem] p-8 text-center" style={{ background: `var(--color-world-${world.colour})` }}>
        <WorldArt slug={world.slug} float className="w-48 opacity-80 saturate-50" />
        <h1 className="text-4xl font-bold">{world.name}</h1>
        <p className="max-w-lg text-lg text-white/90">{world.description}</p>
        <div className="flex items-center gap-3 rounded-2xl bg-black/20 p-4 text-left">
          <Muchi className="size-16 shrink-0" mood="think" />
          <p>Muchi is still building this world with our teachers. It will open soon!</p>
        </div>
        <Link href="/play" className="btn-pop rounded-full bg-sun px-8 py-4 font-display text-xl font-bold text-ink">Back to the universe</Link>
      </div>
    );
  }

  const plan = await getPlan(session.userId);
  const { nodes, nextSlug } = await getWorldPath(child.id, child.ageBand, world.subject, plan);

  // Every activity in this world for the child's age, laid out as illustrated maps of up to 10 lessons.
  const stones = nodes.map((n, i) => ({
    n: i + 1,
    title: n.title,
    href: n.locked ? null : `/play/activity/${n.slug}`,
    state: (n.locked ? "locked" : n.slug === nextSlug ? "current" : STONE[n.state]) as StoneState,
    stars: starsFor(n.score, n.state !== "new"),
    hasSong: n.hasSong,
    note: n.locked ? "Ask a grown-up" : undefined,
    isCurrent: n.slug === nextSlug,
  }));
  const maps = chunk(stones);
  const index = pickMap(map, maps);
  const href = (i: number) => `/play/world/${world.slug}?map=${i + 1}`;

  return (
    <div className="space-y-6">
      <div className="relative flex items-center gap-4 overflow-hidden rounded-[2rem] p-4 sm:p-5" style={{ background: `linear-gradient(135deg, var(--color-world-${world.colour}), color-mix(in oklab, var(--color-world-${world.colour}) 55%, #1e1b3a))` }}>
        <WorldArt slug={world.slug} float className="size-20 shrink-0 sm:size-28" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold sm:text-3xl">{world.name}</h1>
          <p className="text-white/85">{world.tagline}</p>
        </div>
      </div>

      {world.subject === "reading" && (child.ageBand === "LITTLE_EXPLORERS" || child.ageBand === "YOUNG_THINKERS") && (
        <Link href="/play/journey/reading" className="flex items-center gap-3 rounded-3xl bg-sun p-4 font-bold text-ink shadow-lg">
          <span className="text-3xl" aria-hidden>📖</span>
          <span className="flex-1">Follow the <span className="font-display text-lg">Reading Journey</span>: numbered lessons, one step at a time.</span>
          <span aria-hidden>▶</span>
        </Link>
      )}

      {nodes.length === 0 ? (
        <p className="rounded-2xl bg-white/10 p-6 text-center text-lg">New adventures for your age are on their way!</p>
      ) : (
        <LessonMap
          title={world.name}
          subtitle={`${nodes.length} adventures`}
          theme={themeForSubject(world.subject)}
          mapIndex={index}
          mapCount={maps.length}
          stones={maps[index] as MapStone[]}
          prevHref={index > 0 ? href(index - 1) : null}
          nextHref={index < maps.length - 1 ? href(index + 1) : null}
          homeHref="/play"
          avatar={child.avatar}
        />
      )}
    </div>
  );
}
