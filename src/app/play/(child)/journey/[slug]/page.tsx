import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { requireChild } from "@/lib/auth/dal";
import { getPlan } from "@/lib/learning/queries";
import { getJourneyView } from "@/lib/learning/journey";
import { beginJourney } from "@/app/actions/journey";
import { WorldArt } from "@/components/art/worlds";
import { Avatar } from "@/components/avatar";
import { Muchi } from "@/components/mascot";

export const metadata = { title: "Reading Journey" };

// Gentle zig-zag (px) so the path winds like a trail.
const OFFSETS = [0, 56, 84, 56, 0, -56, -84, -56];
const offset = (n: number) => OFFSETS[(n - 1) % OFFSETS.length];

export default async function JourneyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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

      <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-semibold text-white/80" aria-label="Map key">
        <li className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-sun text-xs" aria-hidden>⭐</span>Passed</li>
        <li className="flex items-center gap-2"><span className="size-6 rounded-full bg-brand ring-2 ring-sun" aria-hidden />Your next lesson</li>
        <li className="flex items-center gap-2"><span className="size-6 rounded-full bg-leaf/80" aria-hidden />You already know these (play any time)</li>
        <li className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-white/10 text-xs" aria-hidden>🔒</span>Coming up</li>
      </ul>

      {journey.stages.map((stage, si) => {
        const stageLessons = lessons.filter((l) => l.stage === si);
        return (
          <section key={stage.title} aria-labelledby={`stage-${si}`} className="relative">
            <div className="mb-4 flex items-center gap-4">
              <WorldArt slug={stage.world} className="size-20 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-sun">Part {si + 1}</p>
                <h2 id={`stage-${si}`} className="text-2xl font-bold">{stage.title}</h2>
                <p className="text-sm text-white/75">{stage.description}</p>
              </div>
            </div>
            <ol className="relative mx-auto flex max-w-md flex-col items-center gap-1 py-2">
              {stageLessons.map((l) => {
                const playable = l.state !== "locked" && !l.locked;
                const stone = (
                  <span
                    className={clsx(
                      "relative grid size-20 place-items-center rounded-full font-display text-2xl font-bold shadow-lg ring-4 transition",
                      l.state === "done" && "bg-sun text-ink ring-white/60",
                      l.state === "placed" && "bg-leaf/80 text-white ring-white/30",
                      l.state === "current" && "scale-110 bg-brand text-white ring-sun",
                      l.state === "open" && "bg-white text-ink ring-white/40",
                      l.state === "locked" && "bg-white/10 text-white/50 ring-white/10",
                      playable && "hover:scale-110",
                    )}
                  >
                    {l.state === "done" ? "⭐" : l.state === "locked" || l.locked ? "🔒" : l.n}
                    {l.state === "current" && <span aria-hidden className="absolute inset-0 animate-ping rounded-full ring-4 ring-sun/60" />}
                  </span>
                );
                const label = (
                  <span className="mt-1 block text-center">
                    <span className="block text-xs font-bold text-white/60">Lesson {l.n}{l.hasSong && " · 🎵"}</span>
                    <span className={clsx("block max-w-44 font-bold leading-tight", l.state === "locked" && "text-white/50")}>{l.title}</span>
                    {l.locked && <span className="block text-xs text-white/70">Ask a grown-up</span>}
                  </span>
                );
                return (
                  <li key={l.n} className="flex flex-col items-center" style={{ transform: `translateX(${offset(l.n)}px)` }}>
                    {/* dotted trail from the previous stone */}
                    {l.n > 1 && (
                      <span aria-hidden className="mb-1 flex flex-col items-center gap-1.5" style={{ transform: `translateX(${(offset(l.n - 1) - offset(l.n)) / 2}px)` }}>
                        {[0, 1, 2].map((d) => (
                          <span key={d} className={clsx("size-2 rounded-full", l.state === "locked" ? "bg-white/15" : "bg-sun/70")} />
                        ))}
                      </span>
                    )}
                    {l.state === "current" && <Avatar avatar={child.avatar} size="sm" className="mb-1 animate-float" />}
                    {playable ? (
                      <Link href={`/play/activity/${l.slug}?journey=${slug}`} className="flex flex-col items-center rounded-3xl p-1" aria-label={`Lesson ${l.n}: ${l.title}${l.state === "done" ? " (passed)" : l.state === "current" ? " (your next lesson)" : ""}`}>
                        {stone}
                        {label}
                      </Link>
                    ) : (
                      <div className="flex flex-col items-center p-1" aria-label={`Lesson ${l.n}: ${l.title} (locked)`}>
                        {stone}
                        {label}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
