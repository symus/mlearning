import Link from "next/link";
import clsx from "clsx";
import { db } from "@/lib/db";
import { requireChild } from "@/lib/auth/dal";
import { WORLDS } from "@/lib/worlds";
import { getPlan, getToday, getWorldPath } from "@/lib/learning/queries";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { Pip } from "@/components/mascot";

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

      <section aria-labelledby="worlds-title">
        <h1 id="worlds-title" className="mb-4 text-3xl font-bold">Your learning universe</h1>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {WORLDS.map((w, i) => {
            const path = w.subject === "maths" ? maths : w.subject === "reading" ? reading : null;
            const mastered = path?.nodes.filter((n) => n.state === "mastered").length ?? 0;
            return (
              <li key={w.slug} className={clsx(i % 2 === 1 && "sm:translate-y-6")}>
                <Link
                  href={`/play/world/${w.slug}`}
                  className={clsx("flex aspect-square flex-col items-center justify-center gap-2 rounded-[2rem] p-4 text-center shadow-lg transition hover:-translate-y-1 hover:scale-[1.02]", w.status === "soon" && "opacity-60 grayscale-[40%]")}
                  style={{ background: `radial-gradient(circle at 30% 25%, rgb(255 255 255 / 0.35), transparent 45%), var(--color-world-${w.colour})` }}
                >
                  <span className="text-5xl sm:text-6xl" aria-hidden>{w.emoji}</span>
                  <span className="font-display text-lg font-bold leading-tight sm:text-xl">{w.name}</span>
                  {w.status === "soon" ? (
                    <span className="rounded-full bg-black/25 px-2 py-0.5 text-xs font-bold">Coming soon</span>
                  ) : (
                    <span className="rounded-full bg-black/25 px-2 py-0.5 text-xs font-bold">⭐ {mastered} / {path?.nodes.length ?? 0}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="trophy-title" className="pt-4">
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
