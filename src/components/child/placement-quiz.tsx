"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PublicItem } from "@/lib/content/check";
import { checkPlacementTier, savePlacement } from "@/app/actions/journey";
import { Muchi } from "@/components/mascot";
import { Visual } from "./visual";
import { useSpeech } from "./use-speech";

type Answer = string | number | string[];

/**
 * Placement check: a few questions in tiers that get harder. No right/wrong feedback (it's not a test),
 * and it stops at the first tier that is too hard so children aren't shown lots of difficult questions.
 */
export function PlacementQuiz({ slug, tiers, lessonCount, narration, young }: { slug: string; tiers: PublicItem[][]; lessonCount: number; narration: boolean; young: boolean }) {
  const { speak, supported } = useSpeech();
  const [phase, setPhase] = useState<"intro" | "quiz" | "saving" | "done">("intro");
  const [tier, setTier] = useState(0);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [start, setStart] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const item = tiers[tier]?.[index];
  const totalQuestions = tiers.reduce((n, t) => n + t.length, 0);
  const asked = tiers.slice(0, tier).reduce((n, t) => n + t.length, 0) + index;

  useEffect(() => {
    if (phase === "quiz" && item && narration && young) speak(item.say ?? item.prompt);
  }, [phase, item, narration, young, speak]);

  async function finish(all: Record<string, Answer>) {
    setPhase("saving");
    const res = await savePlacement(slug, all);
    setStart(res.start);
    setPhase("done");
    if (narration && young) speak(`Brilliant! You will start at lesson ${res.start}.`);
  }

  async function choose(answer: Answer) {
    if (!item || busy) return;
    const next = { ...answers, [item.id]: answer };
    setAnswers(next);
    if (index + 1 < tiers[tier].length) {
      setIndex(index + 1);
      return;
    }
    // End of a tier: continue only if it was passed.
    setBusy(true);
    const { passed } = await checkPlacementTier(slug, tier, next);
    setBusy(false);
    if (passed && tier + 1 < tiers.length) {
      setTier(tier + 1);
      setIndex(0);
    } else {
      await finish(next);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <AnimatePresence mode="wait">
        <motion.section
          key={phase === "quiz" ? item?.id : phase}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="rounded-[2rem] bg-surface p-6 text-center text-ink shadow-xl sm:p-8"
        >
          {phase === "intro" && (
            <div className="flex flex-col items-center gap-5">
              <Muchi className="size-28" mood="cheer" />
              <h1 className="text-3xl font-bold">Let&apos;s find your starting place!</h1>
              <p className="max-w-md text-lg text-ink-soft">
                Muchi will ask a few questions. It&apos;s not a test — just do your best, and it&apos;s fine to not know some answers.
              </p>
              <button onClick={() => setPhase("quiz")} className="btn-pop min-h-16 rounded-full bg-leaf px-10 font-display text-2xl font-bold text-white">
                I&apos;m ready!
              </button>
            </div>
          )}

          {phase === "quiz" && item && item.type === "choice" && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between text-sm font-bold text-ink-muted">
                <span>Question {asked + 1} of up to {totalQuestions}</span>
                {supported && (
                  <button onClick={() => speak(item.say ?? item.prompt)} className="grid size-12 place-items-center rounded-full bg-sky-soft text-xl" aria-label="Read the question aloud">
                    🔊
                  </button>
                )}
              </div>
              <h2 className="text-2xl font-bold sm:text-3xl">{item.prompt}</h2>
              {item.visual && <div className="flex justify-center"><Visual visual={item.visual} /></div>}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {item.options.map((o) => (
                  <button
                    key={o.id}
                    disabled={busy}
                    onClick={() => choose(o.id)}
                    className="btn-pop flex min-h-20 items-center justify-center gap-2 rounded-2xl border-2 border-line bg-paper px-4 py-3 text-2xl font-bold hover:border-brand disabled:opacity-60"
                  >
                    {o.emoji && <span aria-hidden className="text-4xl">{o.emoji}</span>}
                    {o.label}
                  </button>
                ))}
              </div>
              <button onClick={() => choose("__skip__")} disabled={busy} className="self-center text-sm font-bold text-ink-muted underline">
                I&apos;m not sure
              </button>
            </div>
          )}

          {phase === "saving" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Muchi className="size-24" mood="think" />
              <p className="text-xl font-bold">Muchi is choosing your lesson…</p>
            </div>
          )}

          {phase === "done" && start !== null && (
            <div className="flex flex-col items-center gap-5">
              <Muchi className="size-28" mood="cheer" />
              <h2 className="text-3xl font-bold">Brilliant work!</h2>
              <p className="text-xl">
                You&apos;ll start at <strong>lesson {start}</strong> of {lessonCount}.
              </p>
              <p className="max-w-md text-ink-soft">You can always go back and play earlier lessons on your map too.</p>
              <Link href={`/play/journey/${slug}`} className="btn-pop rounded-full bg-sun px-10 py-4 font-display text-2xl font-bold text-ink">
                See my map ▶
              </Link>
            </div>
          )}
        </motion.section>
      </AnimatePresence>
    </div>
  );
}
