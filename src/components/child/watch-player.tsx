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
import { Pip } from "@/components/mascot";

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

function SongPlayer({
  watch,
  onDone,
  doneLabel,
}: {
  watch: Extract<Watch, { kind: "song" }>;
  onDone: () => void;
  doneLabel: string;
}) {
  const speechOk = useSyncExternalStore(
    noopSubscribe,
    () => "speechSynthesis" in window,
    () => false,
  );
  const [line, setLine] = useState(-1); // -1 = not started
  const [word, setWord] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const run = useRef(0); // bumps on stop/restart so stale callbacks are ignored

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const stop = useCallback(() => {
    run.current++;
    clearTimers();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setPlaying(false);
  }, []);

  useEffect(() => stop, [stop]);

  // Plain function (not a hook): it calls itself for the next line and only runs from button clicks.
  function playLine(i: number, token: number) {
    if (token !== run.current) return;
    if (i >= watch.lines.length) {
      setPlaying(false);
      setFinished(true);
      setWord(-1);
      return;
    }
    setLine(i);
    setWord(0);
    const text = watch.lines[i].text;
    const words = text.split(/\s+/);
    // Word starts, so speech "boundary" events can be mapped to a word index.
    const starts: number[] = [];
    let pos = 0;
    for (const w of words) {
      const at = text.indexOf(w, pos);
      starts.push(at);
      pos = at + w.length;
    }
    const next = () =>
      timers.current.push(setTimeout(() => playLine(i + 1, token), 500));

    // Timed highlighting works everywhere; speech boundary events refine it where supported.
    const msPerWord = 430;
    words.forEach((_, w) =>
      timers.current.push(
        setTimeout(() => token === run.current && setWord(w), w * msPerWord),
      ),
    );

    if (speechOk) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-GB";
      u.rate = 0.85;
      u.pitch = 1.15;
      u.onboundary = (e) => {
        if (token !== run.current || e.name !== "word") return;
        clearTimers();
        let idx = 0;
        while (idx + 1 < starts.length && starts[idx + 1] <= e.charIndex) idx++;
        setWord(idx);
      };
      u.onend = () => token === run.current && next();
      window.speechSynthesis.speak(u);
    } else {
      timers.current.push(
        setTimeout(
          () => playLine(i + 1, token),
          words.length * msPerWord + 200,
        ),
      );
    }
  }

  const play = () => {
    stop();
    const token = run.current;
    setFinished(false);
    setPlaying(true);
    playLine(line >= 0 && !finished ? line : 0, token);
  };

  const current = watch.lines[Math.max(0, line)];

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <p className="rounded-full bg-berry-soft px-4 py-1 text-sm font-bold text-berry">
        🎵 Watch &amp; Sing
      </p>
      <h1 className="text-3xl font-bold sm:text-4xl">{watch.title}</h1>

      <div className="relative flex min-h-56 w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-sky-soft to-paper p-6">
        <AnimatePresence mode="wait">
          {line < 0 ? (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Pip className="size-32" mood="cheer" />
            </motion.div>
          ) : (
            <motion.div
              key={line}
              initial={{ scale: 0.7, opacity: 0, rotate: -4 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 14 }}
            >
              {current.visual ? (
                <Visual visual={current.visual} />
              ) : (
                <Pip className="size-32" mood="cheer" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lyrics with karaoke highlighting */}
      <ol
        className="w-full max-w-xl space-y-2 text-left"
        aria-label="Song words"
      >
        {watch.lines.map((l, i) => (
          <li
            key={i}
            aria-current={i === line ? "true" : undefined}
            className={clsx(
              "rounded-2xl px-4 py-2 text-lg transition sm:text-xl",
              i === line
                ? "bg-sun-soft font-bold"
                : i < line
                  ? "text-ink-muted"
                  : "text-ink-soft",
            )}
          >
            {i === line
              ? l.text.split(/\s+/).map((w, j) => (
                  <span
                    key={j}
                    className={clsx(
                      "rounded px-0.5 transition-colors",
                      j === word && playing && "bg-sun text-ink",
                    )}
                  >
                    {w}{" "}
                  </span>
                ))
              : l.text}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {playing ? (
          <button
            onClick={stop}
            className="min-h-14 rounded-full bg-sky-soft px-6 font-bold text-sky"
          >
            ⏸ Pause
          </button>
        ) : (
          <button
            onClick={play}
            className="btn-pop min-h-14 rounded-full bg-berry px-8 font-display text-xl font-bold text-white"
          >
            {finished
              ? "🔁 Sing again"
              : line >= 0
                ? "▶ Keep singing"
                : "▶ Play the song"}
          </button>
        )}
        {(finished || line >= 0) && (
          <DoneButton
            onClick={() => {
              stop();
              onDone();
            }}
            label={doneLabel}
          />
        )}
        {line < 0 && (
          <button
            onClick={() => {
              stop();
              onDone();
            }}
            className="min-h-14 rounded-full px-5 font-bold text-ink-soft underline"
          >
            Skip
          </button>
        )}
      </div>
      {!speechOk && (
        <p className="text-sm text-ink-muted">
          This device can&apos;t read aloud, so ask a grown-up to sing the words
          with you!
        </p>
      )}
      <p className="text-xs text-ink-muted">{watch.credit}</p>
    </div>
  );
}
