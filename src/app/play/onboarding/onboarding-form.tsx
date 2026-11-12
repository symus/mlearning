"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { saveOnboarding } from "@/app/actions/children";
import { AVATAR_CHARACTERS, AVATAR_COLOURS } from "@/lib/validation";
import { Avatar, CHARACTER_EMOJI, COLOUR_CLASS } from "@/components/avatar";
import { Pip } from "@/components/mascot";
import { useSpeech } from "@/components/child/use-speech";

export function OnboardingForm({ nickname, narration }: { nickname: string; narration: boolean }) {
  const [step, setStep] = useState(0);
  const [character, setCharacter] = useState<string>("fox");
  const [colour, setColour] = useState<string>("sun");
  const { speak, supported } = useSpeech();
  const lines = [
    `Hello ${nickname}! I'm Pip. I'll be your guide in the learning universe.`,
    "Choose your explorer! Who do you want to be?",
    "Pick a colour for your explorer.",
    "You're ready! Let's go and explore.",
  ];
  const say = (i: number) => narration && supported && speak(lines[i]);

  return (
    <form action={saveOnboarding} className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
      <input type="hidden" name="character" value={character} />
      <input type="hidden" name="colour" value={colour} />
      <motion.div key={step} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        {step === 0 || step === 3 ? <Pip className="size-36" mood="cheer" /> : <Avatar avatar={{ character, colour }} size="xl" />}
      </motion.div>
      <p className="font-display text-3xl font-bold leading-snug">{lines[step]}</p>
      {supported && <button type="button" onClick={() => speak(lines[step])} className="rounded-full bg-white/15 px-5 py-2 font-bold">🔊 Listen</button>}

      {step === 1 && (
        <div className="grid grid-cols-3 gap-3">
          {AVATAR_CHARACTERS.map((c) => (
            <button key={c} type="button" onClick={() => setCharacter(c)} aria-pressed={character === c} aria-label={c} className={clsx("grid size-24 place-items-center rounded-3xl bg-white/10 text-5xl ring-4", character === c ? "ring-sun" : "ring-transparent")}>
              {CHARACTER_EMOJI[c]}
            </button>
          ))}
        </div>
      )}
      {step === 2 && (
        <div className="flex flex-wrap justify-center gap-3">
          {AVATAR_COLOURS.map((c) => (
            <button key={c} type="button" onClick={() => setColour(c)} aria-pressed={colour === c} aria-label={c} className={clsx("size-16 rounded-full ring-4", COLOUR_CLASS[c], colour === c ? "ring-white" : "ring-transparent")} />
          ))}
        </div>
      )}

      {step < 3 ? (
        <button type="button" onClick={() => { setStep(step + 1); say(step + 1); }} className="btn-pop min-h-16 rounded-full bg-sun px-10 font-display text-2xl font-bold text-ink">Next →</button>
      ) : (
        <button type="submit" className="btn-pop min-h-16 rounded-full bg-leaf px-10 font-display text-2xl font-bold text-white">Start exploring!</button>
      )}
    </form>
  );
}
