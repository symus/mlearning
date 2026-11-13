"use client";

import { createContext, useContext, useOptimistic, useTransition } from "react";
import { updateMyPrefs } from "@/app/actions/children";
import { playSfx } from "./sfx";

export interface ChildPrefs {
  soundEffects: boolean;
  narration: boolean;
  textSize: "normal" | "large" | "xlarge";
}

const Ctx = createContext<{ prefs: ChildPrefs; setPrefs: (p: Partial<ChildPrefs>) => void } | null>(null);

export const TEXT_ZOOM: Record<ChildPrefs["textSize"], number> = { normal: 1, large: 1.15, xlarge: 1.3 };

/** Shares the child's accessibility settings with every child screen and saves changes to the database. */
export function ChildPrefsProvider({ initial, children }: { initial: ChildPrefs; children: React.ReactNode }) {
  const [prefs, setOptimistic] = useOptimistic(initial, (cur: ChildPrefs, patch: Partial<ChildPrefs>) => ({ ...cur, ...patch }));
  const [, startTransition] = useTransition();
  const setPrefs = (patch: Partial<ChildPrefs>) =>
    startTransition(async () => {
      setOptimistic(patch);
      await updateMyPrefs({ ...prefs, ...patch });
    });
  return (
    <Ctx value={{ prefs, setPrefs }}>
      {/* zoom scales text and touch targets together; supported by all modern browsers */}
      <div style={{ zoom: TEXT_ZOOM[prefs.textSize] }}>{children}</div>
    </Ctx>
  );
}

export function useChildPrefs() {
  const v = useContext(Ctx);
  // Outside the provider (e.g. previews) fall back to safe defaults.
  return v ?? { prefs: { soundEffects: true, narration: true, textSize: "normal" as const }, setPrefs: () => {} };
}

/** Sound effects that respect the child's setting. */
export function useSfx() {
  const { prefs } = useChildPrefs();
  return (cue: Parameters<typeof playSfx>[0]) => playSfx(cue, prefs.soundEffects);
}

/** Header controls: sound effects, read-aloud and text size. Big, labelled toggles. */
export function PrefsControls() {
  const { prefs, setPrefs } = useChildPrefs();
  const sizes: ChildPrefs["textSize"][] = ["normal", "large", "xlarge"];
  const nextSize = sizes[(sizes.indexOf(prefs.textSize) + 1) % sizes.length];
  const btn = "grid size-10 place-items-center rounded-full bg-white/10 text-lg hover:bg-white/20 aria-pressed:bg-white/25";
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Settings">
      <button
        className={btn}
        aria-pressed={prefs.soundEffects}
        aria-label={prefs.soundEffects ? "Sound effects on. Tap to turn off." : "Sound effects off. Tap to turn on."}
        title="Sound effects"
        onClick={() => {
          setPrefs({ soundEffects: !prefs.soundEffects });
          if (!prefs.soundEffects) playSfx("tap");
        }}
      >
        {prefs.soundEffects ? "🔔" : "🔕"}
      </button>
      <button
        className={btn}
        aria-pressed={prefs.narration}
        aria-label={prefs.narration ? "Read aloud on. Tap to turn off." : "Read aloud off. Tap to turn on."}
        title="Read aloud"
        onClick={() => setPrefs({ narration: !prefs.narration })}
      >
        {prefs.narration ? "🗣️" : "🤫"}
      </button>
      <button
        className={`${btn} font-display font-bold`}
        aria-label={`Text size: ${prefs.textSize}. Tap for ${nextSize}.`}
        title="Text size"
        onClick={() => setPrefs({ textSize: nextSize })}
      >
        <span className={prefs.textSize === "normal" ? "text-sm" : prefs.textSize === "large" ? "text-base" : "text-lg"}>Aa</span>
      </button>
    </div>
  );
}
