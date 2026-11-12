import Link from "next/link";
import clsx from "clsx";
import { db } from "@/lib/db";
import { requireChild } from "@/lib/auth/dal";
import { WORLDS } from "@/lib/worlds";
import { getPlan, getToday, getWorldPath } from "@/lib/learning/queries";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { Pip } from "@/components/mascot";
import { WorldArt } from "@/components/art/worlds";
import { Starfield } from "@/components/child/starfield";
import { journeysForBand, getJourneyView } from "@/lib/learning/journey";

export const metadata = { title: "Learning universe" };

export default async function UniversePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { session, child } = await requireChild();
  const sp = await searchParams;
  const plan = await getPlan(session.userId);
  const [maths, reading, today, achievements] = await Promise.all([
    getWorldPath(child.id, child.ageBand, "maths", plan),
    getWorldPath(child.id, child.ageBand, "reading", plan),
    getToday(child.id),
    db.childAchievement.findMany({ where: { childId: child.id }, orderBy: { earnedAt: "desc" } }),
  ]);
  const goalMet = today.minutes >= child.dailyGoalMinutes;
  const journeyViews = await Promise.all((await journeysForBand(child.ageBand)).map((j) => getJourneyView(child.id, j.slug, plan)));
  // Sing-along shelf: activities in this age group that open with a song or video.
  const songs = (
    await db.activity.findMany({ where: { ageBand: child.ageBand, status: "PUBLISHED" }, select: { slug: true, title: true, body: true, subjectSlug: true }, orderBy: { pathOrder: "asc" } })
  )
    .map((a) => ({ slug: a.slug, subject: a.subjectSlug, watch: (a.body as { watch?: { title: string; kind: string } }).watch }))
    .filter((a) => a.watch);
  // Alternate subjects day by day so both get attention.
  const preferReading = new Date().getDate() % 2 === 0;
  const picks = (preferReading ? [reading, maths] : [maths, reading]).map((p) => p.nodes.find((n) => n.slug === p.nextSlug)).filter(Boolean);
  const next = picks[0];
  const review = [maths, reading].flatMap((p) => p.nodes).find((n) => n.state === "review" && !n.locked);
  const featured = review ?? next;

  return (
    <div className="space-y-10">
      <section className="flex flex-col items-center gap-4 rounded-[2rem] bg-white/10 p-6 text-center ring-1 ring-white/15 sm:flex-row sm:text-left">
        <Pip className="size-24 shrink-0" mood={goalMet ? "cheer" : "happy"} />
        <div className="flex-1">
          <p className="font-display text-2xl font-bold sm:text-3xl">
            {sp.welcome ? `Welcome to the universe, ${child.nickname}!` : goalMet ? `Amazing work today, ${child.nickname}!` : `Hi ${child.nickname}! Ready to explore?`}
          </p>
          <p className="mt-1 text-white/80">
            {goalMet
              ? "You reached today's goal. You can stop here and come back tomorrow — or explore a little more."
              : featured
                ? review
                  ? "Pip thinks it's time to visit an old friend. A quick review helps your brain remember!"
                  : "Here's a great next adventure for you."
                : "Pick a world to explore!"}
          </p>
        </div>
        {featured && (
          <Link href={`/play/activity/${featured.slug}`} className="btn-pop shrink-0 rounded-3xl bg-sun px-6 py-4 text-ink">
            <span className="block text-xs font-bold uppercase tracking-wide">{review ? "Quick review" : "Next adventure"}</span>
            <span className="block font-display text-xl font-bold">{featured.title}</span>
          </Link>
        )}
      </section>

      {journeyViews.map((v) =>
        v ? (
          <Link
            key={v.journey.slug}
            href={`/play/journey/${v.journey.slug}`}
            className="group relative flex items-center gap-5 overflow-hidden rounded-[2rem] bg-gradient-to-r from-[var(--color-world-grove)] to-[#0f6b4a] p-5 shadow-xl ring-1 ring-white/15 transition hover:-translate-y-0.5"
          >
            <WorldArt slug="story-grove" float className="size-24 shrink-0 sm:size-28" />
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-sun">📖 {v.journey.title}</p>
              <p className="font-display text-2xl font-bold leading-tight sm:text-3xl">
                {!v.progress ? "Start your reading adventure!" : v.current ? `Lesson ${v.current}: ${v.lessons[v.current - 1]?.title ?? ""}` : "Journey complete! 🏆"}
              </p>
              <div className="mt-2 h-2.5 max-w-sm overflow-hidden rounded-full bg-black/25" aria-hidden>
                <div className="h-full rounded-full bg-sun" style={{ width: `${v.progress ? ((v.current ? v.current - 1 : v.total) / v.total) * 100 : 0}%` }} />
              </div>
              <p className="mt-1 text-sm text-white/80">{v.progress ? `${v.current ? v.current - 1 : v.total} of ${v.total} lessons` : `${v.total} lessons · from first sounds to stories`}</p>
            </div>
            <span className="hidden rounded-full bg-sun px-5 py-3 font-display text-lg font-bold text-ink sm:block">{v.progress ? "Continue ▶" : "Start ▶"}</span>
          </Link>
        ) : null,
      )}

      {songs.length > 0 && (
        <section aria-labelledby="sing-title">
          <h2 id="sing-title" className="mb-3 text-2xl font-bold">🎵 Sing along</h2>
          <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {songs.map((s) => (
              <li key={s.slug} className="shrink-0">
                <Link href={`/play/activity/${s.slug}`} className="flex w-44 flex-col gap-2 rounded-3xl bg-white/10 p-4 ring-1 ring-white/15 transition hover:-translate-y-0.5 hover:bg-white/15">
                  <span className="grid size-12 place-items-center rounded-2xl bg-berry text-2xl" aria-hidden>{s.watch!.kind === "video" ? "🎬" : "🎵"}</span>
                  <span className="font-display text-lg font-bold leading-tight">{s.watch!.title}</span>
                  <span className="text-xs font-bold text-white/70">{s.subject === "maths" ? "Maths song" : "Reading song"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="worlds-title" className="relative">
        <Starfield />
        <h1 id="worlds-title" className="relative mb-2 text-3xl font-bold">Your learning universe</h1>
        <p className="relative mb-6 text-white/75">Tap a world to explore. Stars show the skills you have mastered.</p>
        <ul className="relative grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
          {WORLDS.map((w, i) => {
            const path = w.subject === "maths" ? maths : w.subject === "reading" ? reading : null;
            const total = path?.nodes.length ?? 0;
            const mastered = path?.nodes.filter((n) => n.state === "mastered").length ?? 0;
            const open = w.status === "open";
            return (
              <li key={w.slug} className={clsx(i % 2 === 1 && "sm:translate-y-8")}>
                <Link
                  href={`/play/world/${w.slug}`}
                  className="group flex flex-col items-center rounded-[2rem] p-2 text-center transition hover:bg-white/5 focus-visible:bg-white/10"
                >
                  <WorldArt slug={w.slug} float={open} className={clsx("w-full max-w-44 transition group-hover:scale-105", !open && "opacity-50 saturate-50")} />
                  <span className="mt-1 font-display text-lg font-bold leading-tight sm:text-xl">{w.name}</span>
                  {open ? (
                    <span className="mt-1 flex items-center gap-2 text-sm font-bold">
                      <span className="h-2 w-16 overflow-hidden rounded-full bg-white/20" aria-hidden>
                        <span className="block h-full rounded-full bg-sun" style={{ width: `${total ? (mastered / total) * 100 : 0}%` }} />
                      </span>
                      ⭐ {mastered}/{total}
                    </span>
                  ) : (
                    <span className="mt-1 rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-white/70">Coming soon</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="trophy-title" className="pt-10">
        <h2 id="trophy-title" className="mb-3 text-2xl font-bold">My trophy shelf</h2>
        <ul className="flex flex-wrap gap-3">
          {Object.entries(ACHIEVEMENTS).map(([code, a]) => {
            const earned = achievements.some((x) => x.code === code);
            return (
              <li key={code} className={clsx("flex w-36 flex-col items-center rounded-2xl p-3 text-center", earned ? "bg-white/15" : "bg-white/5 opacity-50")}>
                <span className={clsx("text-4xl", !earned && "grayscale")} aria-hidden>{earned ? a.emoji : "❔"}</span>
                <span className="mt-1 font-bold">{a.title}</span>
                <span className="text-xs text-white/70">{earned ? a.description : "Keep exploring!"}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
