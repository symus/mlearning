"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import type { Watch } from "@/lib/content/schema";
import { Visual } from "./visual";
import { Muchi } from "@/components/mascot";
import { composeLine, MusicEngine, splitWords } from "./music";

const noopSubscribe = () => () => {};

/**
 * "Watch & Sing": an animated sing-along (original lyrics, read aloud, karaoke highlighting)
 * or a captioned video. Starts only when the child presses play — never autoplays sound.
 */
export function WatchPlayer({
  watch,
  onDone,
  doneLabel = "Let's learn!",
}: {
  watch: Watch;
  onDone: () => void;
  doneLabel?: string;
}) {
  if (watch.kind === "video") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-bold">🎬 {watch.title}</h1>
        <video
          controls
          playsInline
          preload="metadata"
          poster={watch.poster}
          className="aspect-video w-full rounded-2xl bg-ink"
        >
          <source src={watch.src} />
          <track
            kind="captions"
            src={watch.captions}
            srcLang="en"
            label="English"
            default
          />
        </video>
        <p className="text-xs text-ink-muted">{watch.credit}</p>
        <DoneButton onClick={onDone} label={doneLabel} />
      </div>
    );
  }
  return <SongPlayer watch={watch} onDone={onDone} doneLabel={doneLabel} />;
}

function DoneButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="btn-pop min-h-16 rounded-full bg-leaf px-10 font-display text-2xl font-bold text-white"
    >
      {label}
    </button>
  );
}

function SongPlayer({ watch, onDone, doneLabel }: { watch: Extract<Watch, { kind: "song" }>; onDone: () => void; doneLabel: string }) {
  const speechOk = useSyncExternalStore(noopSubscribe, () => "speechSynthesis" in window, () => false);
  const audioOk = useSyncExternalStore(noopSubscribe, () => "AudioContext" in window || "webkitAudioContext" in window, () => false);
  const { bpm, instrument } = watch.tune;

  const [line, setLine] = useState(-1); // -1 = not started
  const [word, setWord] = useState(-1);
  const [stage, setStage] = useState<"listen" | "sing" | null>(null);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [echo, setEcho] = useState(true); // Muchi says each line first, then the child sings it
  const engine = useRef<MusicEngine | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const run = useRef(0); // bumps on stop/restart so stale callbacks are ignored

  const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

  const stop = useCallback(() => {
    run.current++;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    engine.current?.stopAll();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setPlaying(false);
    setStage(null);
  }, []);

  useEffect(
    () => () => {
      stop();
      engine.current?.close();
    },
    [stop],
  );

  // Plain functions (not hooks): they call each other line by line and only run from button clicks.
  function playLine(i: number, token: number) {
    if (token !== run.current) return;
    if (i >= watch.lines.length) {
      if (engine.current) engine.current.fanfare(engine.current.now + 0.05, instrument);
      setPlaying(false);
      setFinished(true);
      setStage(null);
      setWord(-1);
      return;
    }
    setLine(i);
    setWord(-1);
    const text = watch.lines[i].text;
    if (echo && speechOk) {
      setStage("listen");
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-GB";
      u.rate = 0.9;
      u.pitch = 1.2;
      let done = false;
      const next = () => {
        if (done || token !== run.current) return;
        done = true;
        later(250, () => singLine(i, token));
      };
      u.onend = next;
      // Some browsers never fire onend; don't get stuck.
      later(splitWords(text).length * 520 + 2500, next);
      window.speechSynthesis.speak(u);
    } else {
      singLine(i, token);
    }
  }

  function singLine(i: number, token: number) {
    if (token !== run.current) return;
    setStage("sing");
    const composed = composeLine(watch.lines[i].text, i, bpm);
    const e = engine.current;
    const lead = 0.15;
    if (e) e.playLine(composed, e.now + lead, bpm, instrument, i);
    for (const n of composed.notes) later((lead + n.at) * 1000, () => token === run.current && setWord(n.word));
    later((lead + composed.seconds) * 1000, () => playLine(i + 1, token));
  }

  async function play() {
    stop();
    const token = run.current;
    if (audioOk && !engine.current) engine.current = new MusicEngine();
    await engine.current?.resume();
    setFinished(false);
    setPlaying(true);
    playLine(line >= 0 && !finished ? line : 0, token);
  }

  const current = watch.lines[Math.max(0, line)];

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <p className="rounded-full bg-berry-soft px-4 py-1 text-sm font-bold text-berry">🎵 Watch &amp; Sing</p>
      <h1 className="text-3xl font-bold sm:text-4xl">{watch.title}</h1>

      <div className="relative flex min-h-56 w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-sky-soft to-paper p-6">
        {stage && (
          <p className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-sm font-bold shadow-sm" aria-live="polite">
            {stage === "listen" ? "👂 Listen to Muchi…" : "🎤 Your turn — sing!"}
          </p>
        )}
        {stage === "sing" && (
          <span aria-hidden className="pointer-events-none absolute right-4 top-3 flex gap-1 text-2xl text-berry">
            <motion.span key={`a${word}`} initial={{ y: 10, opacity: 0 }} animate={{ y: -8, opacity: [0, 1, 0] }} transition={{ duration: 0.9 }}>♪</motion.span>
            <motion.span key={`b${word}`} initial={{ y: 10, opacity: 0 }} animate={{ y: -14, opacity: [0, 1, 0] }} transition={{ duration: 1.1, delay: 0.15 }}>♫</motion.span>
          </span>
        )}
        <AnimatePresence mode="wait">
          {line < 0 ? (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Muchi className="size-32" mood="cheer" />
            </motion.div>
          ) : (
            <motion.div
              key={line}
              initial={{ scale: 0.7, opacity: 0, rotate: -4 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 14 }}
            >
              {/* bounce on every beat */}
              <motion.div key={word} animate={stage === "sing" ? { scale: [1, 1.07, 1] } : {}} transition={{ duration: 0.3 }}>
                {current.visual ? <Visual visual={current.visual} /> : <Muchi className="size-32" mood="cheer" />}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lyrics with karaoke highlighting on the beat */}
      <ol className="w-full max-w-xl space-y-2 text-left" aria-label="Song words">
        {watch.lines.map((l, i) => (
          <li
            key={i}
            aria-current={i === line ? "true" : undefined}
            className={clsx("rounded-2xl px-4 py-2 text-lg transition sm:text-xl", i === line ? "bg-sun-soft font-bold" : i < line ? "text-ink-muted" : "text-ink-soft")}
          >
            {i === line
              ? splitWords(l.text).map((w, j) => (
                  <span key={j}>
                    <span className={clsx("rounded px-0.5 transition-colors", stage === "sing" && j === word && "bg-sun text-ink", stage === "sing" && j < word && "text-berry")}>{w}</span>{" "}
                  </span>
                ))
              : l.text}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {playing ? (
          <button onClick={stop} className="min-h-14 rounded-full bg-sky-soft px-6 font-bold text-sky">⏸ Pause</button>
        ) : (
          <button onClick={play} className="btn-pop min-h-14 rounded-full bg-berry px-8 font-display text-xl font-bold text-white">
            {finished ? "🔁 Sing again" : line >= 0 ? "▶ Keep singing" : "▶ Play the song"}
          </button>
        )}
        {(finished || line >= 0) && <DoneButton onClick={() => { stop(); onDone(); }} label={doneLabel} />}
        {line < 0 && (
          <button onClick={() => { stop(); onDone(); }} className="min-h-14 rounded-full px-5 font-bold text-ink-soft underline">
            Skip
          </button>
        )}
      </div>

      {speechOk && (
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink-soft">
          <input type="checkbox" checked={echo} onChange={(e) => setEcho(e.target.checked)} disabled={playing} className="size-5 accent-berry" />
          Muchi says each line first, then you sing it
        </label>
      )}
      {!audioOk && <p className="text-sm text-ink-muted">This device can&apos;t play music, so ask a grown-up to sing the words with you!</p>}
      <p className="text-xs text-ink-muted">{watch.credit}</p>
    </div>
  );
}
