"use client";

import { useMemo, useState, useTransition } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { signWin } from "@/app/actions/games";
import { isNextLetter, nameLetters, nameTiles, spellsName } from "@/lib/games/name-tiles";
import { useSfx } from "@/components/child/prefs";

/**
 * The winner spells their own first name with letter tiles to go on the class Winners board.
 * The youngest get no extra letters and see their name faintly as a guide.
 */
export function NameSigner({ gameId, nickname, decoys, onSigned }: { gameId: string; nickname: string; decoys: number; onSigned: () => void }) {
  const sfx = useSfx();
  const target = useMemo(() => nameLetters(nickname), [nickname]);
  const [tiles] = useState(() => nameTiles(nickname, decoys));
  const [used, setUsed] = useState<number[]>([]); // tile indexes tapped, in order
  const [wrong, setWrong] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const spelled = used.map((i) => tiles[i]);
  const guide = decoys === 0;
  const nextTile = tiles.findIndex((t, i) => !used.includes(i) && isNextLetter(spelled, t, nickname));

  const tap = (i: number) => {
    if (pending || used.includes(i)) return;
    if (!isNextLetter(spelled, tiles[i], nickname)) {
      setWrong(i);
      sfx("tryAgain");
      setTimeout(() => setWrong(null), 500);
      return;
    }
    sfx("tap");
    setHint(false);
    const next = [...used, i];
    setUsed(next);
    const letters = next.map((k) => tiles[k]);
    if (spellsName(letters, nickname)) {
      start(async () => {
        const r = await signWin(gameId, letters);
        if (r.ok) {
          sfx("reward");
          onSigned();
        } else setError("Hmm, that didn't work. Try again!");
      });
    }
  };

  return (
    <div className="w-full space-y-3 rounded-2xl bg-sun-soft p-4" aria-labelledby="sign-title">
      <p id="sign-title" className="font-display text-lg font-bold">🏆 Write your name for the Winners board!</p>
      <p className="text-sm text-ink-soft">Tap the letters of your name in order.</p>
      <div className="flex justify-center gap-1.5" aria-label={`Your name so far: ${spelled.join("")}`} data-testid="name-slots">
        {target.map((l, k) => (
          <span key={k} className={clsx("grid h-12 min-w-10 place-items-center rounded-xl border-b-4 px-1 font-display text-2xl font-bold", spelled[k] ? "border-brand bg-white text-ink" : "border-ink/30 bg-white/60 text-ink/25")}>
            {spelled[k] ?? (guide ? l : "")}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Letter tiles">
        {tiles.map((t, i) => (
          <motion.button
            key={i}
            type="button"
            onClick={() => tap(i)}
            disabled={used.includes(i) || pending}
            aria-label={`Letter ${t}`}
            animate={wrong === i ? { x: [0, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.35 }}
            className={clsx(
              "grid size-12 place-items-center rounded-xl font-display text-2xl font-bold shadow-[0_3px_0_rgb(0_0_0/0.2)]",
              used.includes(i) ? "bg-line text-ink/30" : "bg-white text-ink hover:-translate-y-0.5",
              hint && i === nextTile && "ring-4 ring-brand",
            )}
          >
            {t}
          </motion.button>
        ))}
      </div>
      <div className="flex justify-center gap-2">
        <button type="button" onClick={() => setHint(true)} disabled={pending} className="rounded-full bg-white/70 px-4 py-1.5 text-sm font-bold">💡 Help</button>
        <button type="button" onClick={() => setUsed((u) => u.slice(0, -1))} disabled={!used.length || pending} aria-label="Remove last letter" className="rounded-full bg-white/70 px-4 py-1.5 text-sm font-bold disabled:opacity-40">⌫</button>
      </div>
      {wrong !== null && <p role="status" className="text-center text-sm font-bold">Not that one. Try another letter!</p>}
      {error && <p role="alert" className="text-center text-sm font-bold text-danger">{error}</p>}
    </div>
  );
}
