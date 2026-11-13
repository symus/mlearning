"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { WorldArt } from "@/components/art/worlds";

export interface LibraryItem {
  slug: string;
  title: string;
  goal: string;
  /** Topic, subtopic and world name, so searching "fractions" or "phonics" works. */
  keywords: string;
  world: { slug: string; name: string; colour: string };
  minutes: number;
  hasSong: boolean;
  status: "new" | "started" | "done";
  stars: number;
  sticker: boolean;
  locked: boolean;
}

const STATUS = [
  { id: "all", label: "All" },
  { id: "new", label: "✨ Not started" },
  { id: "started", label: "🌱 Started" },
  { id: "done", label: "⭐ Done" },
] as const;

/** Every activity for the child's age on one page, with world, status and text filters. */
export function ActivityLibrary({ items, worlds }: { items: LibraryItem[]; worlds: { slug: string; name: string; colour: string }[] }) {
  const [world, setWorld] = useState<string>("all");
  const [status, setStatus] = useState<(typeof STATUS)[number]["id"]>("all");
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter(
      (i) =>
        (world === "all" || i.world.slug === world) &&
        (status === "all" || i.status === status) &&
        (!term || `${i.title} ${i.goal} ${i.keywords}`.toLowerCase().includes(term)),
    );
  }, [items, world, status, q]);

  const chip = (active: boolean) =>
    clsx("min-h-11 whitespace-nowrap rounded-full px-4 font-bold transition", active ? "bg-sun text-ink" : "bg-white/10 text-white hover:bg-white/20");

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">All activities</h1>
          <p className="text-white/75">{items.length} adventures for you · {items.filter((i) => i.status === "done").length} done</p>
        </div>
        <Link href="/play" className="rounded-full bg-white/10 px-4 py-2 font-bold hover:bg-white/20">🏠 Universe</Link>
      </header>

      <div className="space-y-3 rounded-[2rem] bg-white/10 p-4 ring-1 ring-white/15">
        <label className="block">
          <span className="sr-only">Search activities</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="🔍 Search, e.g. robot, fractions, rhyme…"
            className="h-12 w-full rounded-2xl bg-white px-4 text-lg text-ink placeholder:text-ink-muted"
          />
        </label>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Choose a world">
          <button className={chip(world === "all")} aria-pressed={world === "all"} onClick={() => setWorld("all")}>🌌 All worlds</button>
          {worlds.map((w) => (
            <button key={w.slug} className={chip(world === w.slug)} aria-pressed={world === w.slug} onClick={() => setWorld(w.slug)}>
              {w.name}
            </button>
          ))}
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1" role="group" aria-label="Choose progress">
          {STATUS.map((s) => (
            <button key={s.id} className={chip(status === s.id)} aria-pressed={status === s.id} onClick={() => setStatus(s.id)}>{s.label}</button>
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{shown.length} activities shown</p>

      {shown.length === 0 ? (
        <div className="rounded-[2rem] bg-white/10 p-8 text-center">
          <p className="text-4xl" aria-hidden>🔭</p>
          <p className="mt-2 text-lg font-bold">No activities match. Try another world or search word!</p>
          <button className="mt-3 rounded-full bg-sun px-5 py-2 font-bold text-ink" onClick={() => { setWorld("all"); setStatus("all"); setQ(""); }}>Show everything</button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((i) => {
            const card = (
              <>
                <div className="flex items-center gap-3 rounded-t-3xl p-3" style={{ background: `var(--color-world-${i.world.colour})` }}>
                  <WorldArt slug={i.world.slug} className="size-12 shrink-0" />
                  <span className="text-sm font-bold text-white">{i.world.name}</span>
                  <span className="ml-auto flex gap-1 text-lg" aria-hidden>
                    {i.hasSong && "🎵"}
                    {i.sticker && "📒"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <span className="font-display text-xl font-bold leading-tight">{i.title}</span>
                  <span className="text-sm text-ink-soft">🎯 {i.goal}</span>
                  <span className="mt-auto flex items-center justify-between pt-2 text-sm">
                    <span aria-hidden>{[0, 1, 2].map((k) => <span key={k} className={k < i.stars ? "" : "opacity-25 grayscale"}>⭐</span>)}</span>
                    <span className="font-bold text-ink-muted">{i.locked ? "🔒 Ask a grown-up" : `⏱️ ${i.minutes} min`}</span>
                  </span>
                </div>
              </>
            );
            const label = `${i.title}, ${i.world.name}. ${i.status === "done" ? "Done" : i.status === "started" ? "Started" : "Not started"}, ${i.stars} stars.${i.locked ? " Ask a grown-up." : ""}`;
            return (
              <li key={i.slug}>
                {i.locked ? (
                  <div aria-label={label} role="img" className="flex h-full flex-col overflow-hidden rounded-3xl bg-surface/70 text-ink opacity-75">{card}</div>
                ) : (
                  <Link href={`/play/activity/${i.slug}`} aria-label={label} className="flex h-full flex-col overflow-hidden rounded-3xl bg-surface text-ink shadow-lg transition hover:-translate-y-1">
                    {card}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
