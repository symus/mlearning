"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const COLOURS = ["#ffc23d", "#ff7a59", "#2fb873", "#4a9ff5", "#d6589c", "#ffffff"];

/** A short confetti burst. Decorative only; hidden from screen readers; reduced-motion users see nothing move. */
export function Confetti({ pieces = 36 }: { pieces?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-0 overflow-visible">
      {Array.from({ length: pieces }, (_, i) => {
        const x = ((i * 53) % 100) - 50; // -50..50 %
        const rot = (i * 97) % 360;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-0 block h-3 w-2 rounded-sm"
            style={{ background: COLOURS[i % COLOURS.length] }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: `${x * 6}px`, y: [0, -120 - (i % 5) * 20, 420], opacity: [1, 1, 0], rotate: rot * 3 }}
            transition={{ duration: 1.8 + (i % 4) * 0.2, ease: "easeOut", delay: (i % 6) * 0.03 }}
          />
        );
      })}
    </div>
  );
}

/** 1–3 stars. Always at least one: finishing is an achievement in itself. */
export function StarRating({ accuracy }: { accuracy: number }) {
  const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.6 ? 2 : 1;
  return (
    <div className="flex items-end gap-2" role="img" aria-label={`${stars} out of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={`text-5xl ${i === 1 ? "-translate-y-2 text-6xl" : ""} ${i < stars ? "" : "opacity-20 grayscale"}`}
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 12, delay: 0.3 + i * 0.25 }}
        >
          ⭐
        </motion.span>
      ))}
    </div>
  );
}

/** Tap-to-open sticker gift. The sticker is fixed for the activity (no chance involved). */
export function GiftBox({ sticker, onOpen }: { sticker: { emoji: string; name: string }; onOpen?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center gap-2">
      {!open ? (
        <motion.button
          onClick={() => {
            setOpen(true);
            onOpen?.();
          }}
          className="flex flex-col items-center gap-1 rounded-3xl bg-berry-soft px-6 py-4 font-bold text-berry"
          animate={{ rotate: [0, -6, 6, -4, 4, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.2 }}
          aria-label="Open your sticker gift"
        >
          <span className="text-6xl" aria-hidden>🎁</span>
          Tap to open your sticker!
        </motion.button>
      ) : (
        <motion.div
          initial={{ scale: 0, rotateY: 180 }}
          animate={{ scale: 1, rotateY: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="flex flex-col items-center gap-1 rounded-3xl bg-sun-soft px-6 py-4"
          role="status"
        >
          <span className="text-7xl drop-shadow" aria-hidden>{sticker.emoji}</span>
          <span className="font-display text-xl font-bold">{sticker.name}</span>
          <span className="text-sm text-ink-soft">Added to your Sticker Book!</span>
        </motion.div>
      )}
    </div>
  );
}

/** Friendly end-of-day screen when the parent's daily limit is reached. */
export function DailyLimitScreen({ nickname }: { nickname: string }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-[2rem] bg-surface p-8 text-center text-ink shadow-xl" role="status">
      <span className="text-6xl" aria-hidden>🌙</span>
      <h1 className="text-3xl font-bold">That&apos;s all for today, {nickname}!</h1>
      <p className="text-lg text-ink-soft">
        You&apos;ve done your learning time for today. Brains grow while you rest and play — Muchi will be here tomorrow!
      </p>
      <p className="text-sm text-ink-muted">You can still look at your map and your Sticker Book.</p>
    </div>
  );
}
