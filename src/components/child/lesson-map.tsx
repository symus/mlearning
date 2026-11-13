"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { CHEST, MapScene, STOPS, trailPath, type MapTheme } from "@/components/art/map-scenes";
import { Avatar } from "@/components/avatar";
import { Muchi } from "@/components/mascot";
import { useSfx } from "./prefs";

export type StoneState = "done" | "current" | "started" | "review" | "open" | "placed" | "locked";

export interface MapStone {
  n: number;
  title: string;
  href: string | null; // null = can't be opened yet
  state: StoneState;
  stars: number; // 0–3
  hasSong: boolean;
  note?: string; // e.g. "Ask a grown-up"
}

// Portrait layout for phones: same trail idea, stretched vertically.
const STOPS_PORTRAIT: [number, number][] = [
  [22, 12], [62, 15], [80, 25], [48, 32], [18, 41], [38, 51], [74, 58], [66, 70], [32, 77], [18, 90],
];
const CHEST_PORTRAIT: [number, number] = [78, 90];

const STATE_LABEL: Record<StoneState, string> = {
  done: "passed",
  current: "your next lesson",
  started: "started",
  review: "time to review",
  open: "ready to play",
  placed: "you already know this",
  locked: "locked",
};

export function LessonMap({
  title,
  subtitle,
  theme,
  mapIndex,
  mapCount,
  stones,
  prevHref,
  nextHref,
  homeHref,
  avatar,
}: {
  title: string;
  subtitle: string;
  theme: MapTheme;
  mapIndex: number;
  mapCount: number;
  stones: MapStone[];
  prevHref: string | null;
  nextHref: string | null;
  homeHref: string;
  avatar: unknown;
}) {
  const allDone = stones.length > 0 && stones.every((s) => s.state === "done" || s.state === "placed");

  return (
    <section aria-label={`${title}, map ${mapIndex + 1} of ${mapCount}`} className="space-y-3">
      <div className="flex items-center gap-2">
        <Link href={homeHref} className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl hover:bg-white/25" aria-label="Home: the learning universe">🏠</Link>
        <div className="min-w-0 flex-1 text-center">
          <p className="inline-block rounded-2xl bg-sun px-4 py-1 font-display text-xl font-bold text-ink shadow-[var(--shadow-pop)] sm:text-2xl">Map {mapIndex + 1}</p>
          <p className="mt-1 truncate text-sm font-bold text-white/80">{title} · {subtitle}</p>
        </div>
        <Link href="/play/activities" className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl hover:bg-white/25" aria-label="All activities">📚</Link>
      </div>

      <div className="relative">
        {/* Landscape map (tablet / desktop) */}
        <MapCanvas className="hidden aspect-[1000/620] sm:block" stops={STOPS} chest={CHEST} viewBox={[1000, 620]} {...{ theme, mapIndex, stones, avatar, allDone }} />
        {/* Portrait map (phones) */}
        <MapCanvas className="aspect-[620/1000] sm:hidden" stops={STOPS_PORTRAIT} chest={CHEST_PORTRAIT} viewBox={[620, 1000]} {...{ theme, mapIndex, stones, avatar, allDone }} />

        {/* Map arrows */}
        {prevHref && (
          <Link href={prevHref} aria-label="Previous map" className="btn-pop absolute left-2 top-1/2 grid size-14 -translate-y-1/2 place-items-center rounded-full bg-sun text-2xl font-bold text-ink">◀</Link>
        )}
        {nextHref && (
          <Link href={nextHref} aria-label="Next map" className="btn-pop absolute right-2 top-1/2 grid size-14 -translate-y-1/2 place-items-center rounded-full bg-sun text-2xl font-bold text-ink">▶</Link>
        )}
      </div>

      {/* Map dots */}
      {mapCount > 1 && (
        <p className="flex justify-center gap-2" aria-hidden>
          {Array.from({ length: mapCount }, (_, i) => <span key={i} className={clsx("size-2.5 rounded-full", i === mapIndex ? "bg-sun" : "bg-white/30")} />)}
        </p>
      )}

      {/* Text list of the same lessons: screen readers, keyboard users and quick scanning */}
      <details className="rounded-2xl bg-white/10 p-3">
        <summary className="cursor-pointer font-bold">Lesson list for this map</summary>
        <ol className="mt-2 space-y-1">
          {stones.map((s) => (
            <li key={s.n}>
              {s.href ? <Link href={s.href} className="underline">Lesson {s.n}: {s.title}</Link> : <span className="text-white/60">Lesson {s.n}: {s.title}</span>}{" "}
              <span className="text-sm text-white/70">({s.note ?? STATE_LABEL[s.state]})</span>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

function MapCanvas({
  className, stops, chest, viewBox, theme, mapIndex, stones, avatar, allDone,
}: {
  className: string;
  stops: [number, number][];
  chest: [number, number];
  viewBox: [number, number];
  theme: MapTheme;
  mapIndex: number;
  stones: MapStone[];
  avatar: unknown;
  allDone: boolean;
}) {
  const used = stops.slice(0, stones.length);
  // The chest waits right after the last lesson (or at its usual spot on a full map).
  const chestAt: [number, number] = stones.length < stops.length ? stops[stones.length] : chest;
  const [w, h] = viewBox;
  // trailPath works in percent of a 1000×620 space; the group rescales it to this canvas.
  return (
    <div className={clsx("relative w-full overflow-hidden rounded-[2rem] shadow-2xl ring-4 ring-white/20", className)}>
      <MapScene theme={theme} variant={mapIndex} />
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
        <g transform={`scale(${w / 1000} ${h / 620})`}>
          <path d={trailPath([...used, chestAt])} fill="none" stroke="rgb(0 0 0 / 0.14)" strokeWidth="26" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <path d={trailPath([...used, chestAt])} fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" strokeDasharray="1 24" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>

      {stones.map((s, i) => (
        <Stone key={s.n} stone={s} at={used[i]} avatar={avatar} />
      ))}
      <Chest at={chestAt} open={allDone} />
    </div>
  );
}

function Stone({ stone, at, avatar }: { stone: MapStone; at: [number, number]; avatar: unknown }) {
  const [x, y] = at;
  const face = (
    <span
      className={clsx(
        "relative grid size-14 place-items-center rounded-full border-4 font-display text-2xl font-bold shadow-[0_5px_0_rgb(0_0_0/0.25)] transition sm:size-16 md:size-[4.5rem]",
        stone.state === "done" && "border-white bg-sun text-ink",
        stone.state === "placed" && "border-white/80 bg-leaf text-white",
        stone.state === "current" && "scale-110 border-sun bg-brand text-white",
        (stone.state === "started" || stone.state === "review" || stone.state === "open") && "border-white bg-[#f3d9a4] text-ink",
        stone.state === "locked" && "border-white/60 bg-[#d9d4ea] text-ink/50",
      )}
    >
      {stone.state === "locked" ? "🔒" : stone.n}
      {stone.state === "current" && <span aria-hidden className="absolute inset-0 animate-ping rounded-full ring-4 ring-sun/70" />}
      {stone.state === "review" && <span aria-hidden className="absolute -right-1 -top-1 text-lg">🔁</span>}
      {stone.hasSong && stone.state !== "locked" && <span aria-hidden className="absolute -left-1 -top-1 text-base">🎵</span>}
    </span>
  );
  const stars = stone.state !== "locked" && (
    <span className="mt-0.5 flex gap-0.5 rounded-full bg-black/25 px-1.5 text-xs leading-5" aria-hidden>
      {[0, 1, 2].map((k) => <span key={k} className={k < stone.stars ? "" : "opacity-30 grayscale"}>⭐</span>)}
    </span>
  );
  const label = `Lesson ${stone.n}: ${stone.title} (${stone.note ?? STATE_LABEL[stone.state]})`;
  return (
    <div className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${x}%`, top: `${y}%` }}>
      {stone.state === "current" && (
        <div className="pointer-events-none absolute -top-14 flex items-end sm:-top-16" aria-hidden>
          <Muchi className="animate-float size-10 sm:size-12" mood="cheer" />
          <Avatar avatar={avatar} size="sm" className="-ml-2" />
        </div>
      )}
      {stone.href ? (
        <Link href={stone.href} aria-label={label} title={stone.title} className="flex flex-col items-center rounded-full hover:scale-105 focus-visible:scale-105">
          {face}
          {stars}
        </Link>
      ) : (
        <div role="img" aria-label={label} title={stone.note ?? stone.title} className="flex flex-col items-center">
          {face}
        </div>
      )}
      {stone.state === "current" && (
        <span className="mt-1 max-w-36 rounded-xl bg-white/95 px-2 py-0.5 text-center text-xs font-bold leading-tight text-ink shadow sm:text-sm">{stone.title}</span>
      )}
    </div>
  );
}

function Chest({ at, open }: { at: [number, number]; open: boolean }) {
  const [shown, setShown] = useState(false);
  const sfx = useSfx();
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${at[0]}%`, top: `${at[1]}%` }}>
      <button
        onClick={() => {
          if (open) sfx("reward");
          setShown((v) => !v);
        }}
        className={clsx("grid size-16 place-items-center rounded-2xl text-5xl drop-shadow-lg transition hover:scale-110 sm:size-20 sm:text-6xl", !open && "grayscale-[60%]")}
        aria-label={open ? "Treasure chest: map complete! Tap to open." : "Treasure chest: finish every lesson on this map to open it."}
      >
        <motion.span animate={open ? { rotate: [0, -8, 8, 0] } : {}} transition={{ repeat: Infinity, duration: 1.6, repeatDelay: 1 }}>
          {open ? "🎁" : "🧰"}
        </motion.span>
      </button>
      <AnimatePresence>
        {shown && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            role="status"
            className="absolute bottom-full right-0 mb-2 w-52 rounded-2xl bg-white p-3 text-center text-sm font-bold text-ink shadow-xl"
          >
            {open ? "🎉 Map complete! You're a superstar explorer!" : "🔒 Finish every lesson on this map to open the treasure!"}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
