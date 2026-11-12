import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { requireChild } from "@/lib/auth/dal";
import { getWorld } from "@/lib/worlds";
import { getPlan, getWorldPath, type PathNodeState } from "@/lib/learning/queries";
import { Pip } from "@/components/mascot";

const STATE_UI: Record<PathNodeState, { icon: string; label: string; ring: string }> = {
  mastered: { icon: "⭐", label: "Mastered", ring: "ring-sun" },
  practising: { icon: "🌱", label: "Practising", ring: "ring-leaf" },
  learning: { icon: "🌱", label: "Learning", ring: "ring-leaf" },
  review: { icon: "🔁", label: "Time to review", ring: "ring-sky" },
  new: { icon: "✨", label: "New", ring: "ring-white/40" },
};

export default async function WorldPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const world = getWorld(slug);
  if (!world) notFound();
  const { session, child } = await requireChild();

  if (world.status === "soon") {
    return (
      <div className="flex flex-col items-center gap-5 rounded-[2rem] p-8 text-center" style={{ background: `var(--color-world-${world.colour})` }}>
        <span className="text-7xl" aria-hidden>{world.emoji}</span>
        <h1 className="text-4xl font-bold">{world.name}</h1>
        <p className="max-w-lg text-lg text-white/90">{world.description}</p>
        <div className="flex items-center gap-3 rounded-2xl bg-black/20 p-4 text-left">
          <Pip className="size-16 shrink-0" mood="think" />
          <p>Pip is still building this world with our teachers. It will open soon!</p>
        </div>
        <Link href="/play" className="btn-pop rounded-full bg-sun px-8 py-4 font-display text-xl font-bold text-ink">Back to the universe</Link>
      </div>
    );
  }

  const plan = await getPlan(session.userId);
  const { nodes, nextSlug } = await getWorldPath(child.id, child.ageBand, world.subject, plan);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-[2rem] p-5" style={{ background: `var(--color-world-${world.colour})` }}>
        <span className="grid size-16 place-items-center rounded-2xl bg-white/20 text-4xl" aria-hidden>{world.emoji}</span>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{world.name}</h1>
          <p className="text-white/85">{world.tagline}</p>
        </div>
        <Link href="/play" className="rounded-full bg-black/20 px-4 py-2 font-bold hover:bg-black/30">← Universe</Link>
      </div>

      {nodes.length === 0 ? (
        <p className="rounded-2xl bg-white/10 p-6 text-center text-lg">New adventures for your age are on their way!</p>
      ) : (
        <ol className="relative mx-auto flex max-w-md flex-col gap-6 py-4" aria-label="Learning path">
          <span aria-hidden className="absolute left-1/2 top-0 h-full w-2 -translate-x-1/2 rounded-full bg-white/15" />
          {nodes.map((n, i) => {
            const ui = STATE_UI[n.state];
            const isNext = n.slug === nextSlug;
            return (
              <li key={n.slug} className={clsx("relative flex", i % 2 ? "justify-end" : "justify-start")}>
                <Link
                  href={`/play/activity/${n.slug}`}
                  className={clsx("relative flex w-[85%] items-center gap-3 rounded-3xl bg-surface p-4 text-ink shadow-lg ring-4 transition hover:-translate-y-0.5", ui.ring, isNext && "outline outline-4 outline-offset-4 outline-sun")}
                >
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-paper text-3xl" aria-hidden>{n.locked ? "🔒" : ui.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-bold leading-tight">{n.title}</span>
                    <span className="block text-sm text-ink-muted">{n.locked ? "Ask a grown-up" : `${ui.label} · ${n.estimatedMinutes} min`}</span>
                  </span>
                  {isNext && <span className="absolute -top-3 right-4 rounded-full bg-sun px-2 py-0.5 text-xs font-bold text-ink">Next!</span>}
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
