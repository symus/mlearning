import Link from "next/link";
import clsx from "clsx";
import { db } from "@/lib/db";
import { requireChild } from "@/lib/auth/dal";
import { stickerFor } from "@/lib/rewards";
import { byPath, reachableActivityWhere } from "@/lib/learning/reachable";
import { WORLDS, worldForSubject } from "@/lib/worlds";
import { Muchi } from "@/components/mascot";

export const metadata = { title: "My Sticker Book" };

export default async function StickersPage() {
  const { child } = await requireChild();
  const [activities, owned] = await Promise.all([
    reachableActivityWhere(child).then((where) => db.activity.findMany({ where, select: { slug: true, title: true, subjectSlug: true, pathOrder: true, ageBand: true } })).then((xs) => xs.sort(byPath)),
    db.childSticker.findMany({ where: { childId: child.id } }),
  ]);
  const shown = new Set(activities.map((a) => a.slug));
  const have = new Set(owned.map((s) => s.activitySlug).filter((slug) => shown.has(slug))); // e.g. an archived activity's sticker
  const subjects = WORLDS.map((w) => w.subject).filter((s) => activities.some((a) => a.subjectSlug === s));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center gap-4 rounded-[2rem] bg-white/10 p-5 ring-1 ring-white/15">
        <Muchi className="animate-float size-16" mood="cheer" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold">My Sticker Book</h1>
          <p className="text-white/80">
            {have.size} of {activities.length} stickers collected. Pass an activity to earn its sticker!
          </p>
        </div>
        <Link href="/play" className="rounded-full bg-white/10 px-4 py-2 font-bold hover:bg-white/20">← Universe</Link>
      </header>

      {activities.length === 0 && <p className="rounded-2xl bg-white/10 p-6 text-center">Stickers appear here as new adventures open.</p>}

      {subjects.map((subject) => {
        const world = worldForSubject(subject);
        const list = activities.filter((a) => a.subjectSlug === subject);
        return (
          <section key={subject} aria-labelledby={`st-${subject}`}>
            <h2 id={`st-${subject}`} className="mb-3 text-2xl font-bold">{world?.name ?? subject}</h2>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {list.map((a) => {
                const st = stickerFor(a);
                const got = have.has(a.slug);
                return (
                  <li key={a.slug}>
                    <Link
                      href={`/play/activity/${a.slug}`}
                      className={clsx("flex aspect-square flex-col items-center justify-center gap-1 rounded-3xl p-2 text-center transition hover:-translate-y-0.5", got ? "bg-sun-soft text-ink shadow-lg" : "border-2 border-dashed border-white/25 bg-white/5")}
                      aria-label={got ? `${st.name} sticker, from ${a.title}` : `Locked sticker. Pass ${a.title} to earn it.`}
                    >
                      <span className={clsx("text-5xl", !got && "opacity-30 grayscale")} aria-hidden>{got ? st.emoji : "❔"}</span>
                      <span className={clsx("line-clamp-2 text-xs font-bold leading-tight", !got && "text-white/70")}>{got ? st.name : a.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
