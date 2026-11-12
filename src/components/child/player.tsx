"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import type { ActivityBody, Visual as VisualSpec, Watch } from "@/lib/content/schema";
import type { PublicItem } from "@/lib/content/check";
import { nextLevel, type ItemResult } from "@/lib/learning/adaptive";
import { finishAttempt, startAttempt, submitAnswer, type AnswerFeedback, type AttemptSummary } from "@/app/actions/play";
import { Pip } from "@/components/mascot";
import { Visual } from "./visual";
import { useSpeech } from "./use-speech";
import { WatchPlayer } from "./watch-player";

export interface PlayerActivity {
  slug: string;
  title: string;
  learn: ActivityBody["learn"];
  watch?: Watch;
  /** Where "back" and "Back to the map" go (world path or lesson journey). */
  backHref: string;
  journeySlug?: string;
  levels: { level: number; label: string; items: PublicItem[] }[];
  worldSlug: string;
}

type Phase = "watch" | "learn" | "item" | "summary" | "blocked";
type Answer = string | number | string[];

export function Player({
  activity,
  startLevel,
  itemsPerRound,
  narration,
  young,
}: {
  activity: PlayerActivity;
  startLevel: number;
  itemsPerRound: number;
  narration: boolean;
  young: boolean;
}) {
  const { speak, supported } = useSpeech();
  const maxLevel = activity.levels.length;
  const totalItems = activity.levels.reduce((n, l) => n + l.items.length, 0);
  const roundSize = Math.min(itemsPerRound, totalItems);

  const [phase, setPhase] = useState<Phase>(activity.watch ? "watch" : "learn");
  const [blocked, setBlocked] = useState<string>("");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [level, setLevel] = useState(startLevel);
  const [used, setUsed] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<ItemResult[]>([]);
  const [item, setItem] = useState<(PublicItem & { level: number }) | null>(null);
  const [tryNumber, setTryNumber] = useState(1);
  const [hintsShown, setHintsShown] = useState(0);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<AttemptSummary | null>(null);
  const [showText, setShowText] = useState(false);
  const shownAt = useRef(0);
  const advancing = useRef(false);

  const passage = activity.learn.visual?.kind === "passage" ? (activity.learn.visual as VisualSpec) : null;

  const pickItem = useCallback(
    (lvl: number, usedSet: Set<string>) => {
      // Prefer the target level, then harder, then easier.
      const order = [lvl, ...Array.from({ length: maxLevel }, (_, i) => i + 1).filter((l) => l > lvl), ...Array.from({ length: lvl - 1 }, (_, i) => lvl - 1 - i)];
      for (const l of order) {
        const found = activity.levels[l - 1]?.items.find((it) => !usedSet.has(it.id));
        if (found) return { ...found, level: l };
      }
      return null;
    },
    [activity.levels, maxLevel],
  );

  const showItem = useCallback(
    (next: (PublicItem & { level: number }) | null) => {
      setItem(next);
      setTryNumber(1);
      setHintsShown(0);
      setFeedback(null);
      shownAt.current = Date.now();
      if (next && narration && young) speak(next.say ?? next.prompt);
    },
    [narration, young, speak],
  );

  useEffect(() => {
    if (phase === "learn" && narration && young) speak(activity.learn.say ?? activity.learn.text);
  }, [phase, narration, young, speak, activity.learn]);

  async function begin() {
    setBusy(true);
    const res = await startAttempt(activity.slug, startLevel);
    setBusy(false);
    if ("error" in res) {
      setBlocked(res.error === "limit" ? "limit" : res.error === "locked" ? "locked" : res.error);
      setPhase("blocked");
      return;
    }
    setAttemptId(res.attemptId);
    setPhase("item");
    showItem(pickItem(startLevel, used));
  }

  async function submit(answer: Answer) {
    if (!attemptId || !item || busy || feedback?.final) return;
    setBusy(true);
    const fb = await submitAnswer({ attemptId, itemId: item.id, answer, hintsUsed: hintsShown, tryNumber, timeMs: Date.now() - shownAt.current });
    setBusy(false);
    setFeedback(fb);
    if (fb.final) {
      setResults((r) => [...r, { correct: fb.correct, hintsUsed: hintsShown + tryNumber - 1, level: item.level }]);
      if (narration && young) speak(fb.correct ? "Well done! " + (fb.explanation ?? "") : "Let's look at it together. " + (fb.explanation ?? ""));
    } else {
      setTryNumber(2);
      if (narration && young) speak("Not quite. " + (fb.remedy ?? "Try again!"));
    }
  }

  async function next() {
    // Ignore double taps while the next card animates in.
    if (!item || !feedback?.final || advancing.current) return;
    advancing.current = true;
    setTimeout(() => (advancing.current = false), 400);
    const usedNow = new Set(used).add(item.id);
    setUsed(usedNow);
    const newLevel = nextLevel(level, results, maxLevel);
    setLevel(newLevel);
    const candidate = results.length < roundSize ? pickItem(newLevel, usedNow) : null;
    if (candidate) {
      showItem(candidate);
      return;
    }
    if (!attemptId) return;
    setBusy(true);
    const s = await finishAttempt(attemptId);
    setBusy(false);
    setSummary(s);
    setPhase("summary");
    if (narration && young) speak(s.message);
  }

  const progress = phase === "summary" ? 1 : results.length / roundSize;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link href={activity.backHref} className="grid size-12 shrink-0 place-items-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25" aria-label="Back to the world map">←</Link>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-label="Activity progress" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <motion.div className="h-full rounded-full bg-sun" animate={{ width: `${progress * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </div>
        {phase === "item" && <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold text-white">{activity.levels[(item?.level ?? level) - 1]?.label}</span>}
      </div>

      <AnimatePresence mode="wait">
        <motion.section
          key={phase === "item" ? item?.id : phase}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
          className="rounded-[2rem] bg-surface p-5 text-ink shadow-xl sm:p-8"
        >
          {phase === "watch" && activity.watch && <WatchPlayer watch={activity.watch} onDone={() => setPhase("learn")} />}

          {phase === "learn" && (
            <div className="flex flex-col items-center gap-5 text-center">
              <Pip className="size-24" mood="think" />
              <h1 className="text-3xl font-bold sm:text-4xl">{activity.title}</h1>
              {activity.learn.visual && <Visual visual={activity.learn.visual} />}
              <p className="max-w-xl text-lg leading-relaxed sm:text-xl">{activity.learn.text}</p>
              {activity.learn.example && <p className="rounded-2xl bg-sun-soft px-4 py-3 font-bold">{activity.learn.example}</p>}
              <div className="flex flex-wrap justify-center gap-3">
                {supported && <SpeakButton onClick={() => speak(activity.learn.say ?? activity.learn.text)} />}
                {activity.watch && (
                  <button type="button" onClick={() => setPhase("watch")} className="inline-flex min-h-14 items-center gap-2 rounded-full bg-berry-soft px-5 font-bold text-berry hover:bg-berry hover:text-white">
                    🎵 Sing again
                  </button>
                )}
                <button onClick={begin} disabled={busy} className="btn-pop min-h-16 rounded-full bg-leaf px-10 font-display text-2xl font-bold text-white disabled:opacity-60">
                  {busy ? "Getting ready…" : "Let's practise!"}
                </button>
              </div>
            </div>
          )}

          {phase === "item" && item && (
            <ItemView
              item={item}
              young={young}
              busy={busy}
              feedback={feedback}
              tryNumber={tryNumber}
              hintsShown={hintsShown}
              onHint={() => {
                const h = Math.min(item.hints.length, hintsShown + 1);
                setHintsShown(h);
                if (narration && young) speak(item.hints[h - 1]);
              }}
              onSpeak={supported ? () => speak(item.say ?? item.prompt) : undefined}
              onSubmit={submit}
              onNext={next}
              passage={passage}
              showText={showText}
              toggleText={() => setShowText((s) => !s)}
            />
          )}

          {phase === "summary" && summary && <Summary summary={summary} backHref={activity.backHref} journeySlug={activity.journeySlug} />}

          {phase === "blocked" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <Pip className="size-24" />
              {blocked === "limit" ? (
                <>
                  <h2 className="text-2xl font-bold">That&apos;s all the adventures for today!</h2>
                  <p className="max-w-md text-lg">You did brilliant learning. Your brain needs time to grow — come back tomorrow for more.</p>
                </>
              ) : blocked === "locked" ? (
                <>
                  <h2 className="text-2xl font-bold">This adventure is still locked</h2>
                  <p className="max-w-md text-lg">Ask a grown-up about opening more adventures. You can play the open ones any time!</p>
                </>
              ) : (
                <p className="text-lg">{blocked}</p>
              )}
              <Link href={activity.backHref} className="btn-pop rounded-full bg-brand px-8 py-4 font-display text-xl font-bold text-white">Back to the map</Link>
            </div>
          )}
        </motion.section>
      </AnimatePresence>
    </div>
  );
}

function SpeakButton({ onClick, label = "Listen" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex min-h-14 items-center gap-2 rounded-full bg-sky-soft px-5 font-bold text-sky hover:bg-sky hover:text-white" aria-label={label}>
      <span aria-hidden className="text-2xl">🔊</span> {label}
    </button>
  );
}

function ItemView({
  item, young, busy, feedback, tryNumber, hintsShown, onHint, onSpeak, onSubmit, onNext, passage, showText, toggleText,
}: {
  item: PublicItem & { level: number };
  young: boolean;
  busy: boolean;
  feedback: AnswerFeedback | null;
  tryNumber: number;
  hintsShown: number;
  onHint: () => void;
  onSpeak?: () => void;
  onSubmit: (a: Answer) => void;
  onNext: () => void;
  passage: VisualSpec | null;
  showText: boolean;
  toggleText: () => void;
}) {
  const done = !!feedback?.final;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <h2 className={clsx("flex-1 font-bold", young ? "text-3xl" : "text-2xl sm:text-3xl")}>{item.prompt}</h2>
        {onSpeak && <button onClick={onSpeak} className="grid size-14 shrink-0 place-items-center rounded-full bg-sky-soft text-2xl hover:bg-sky" aria-label="Read the question aloud">🔊</button>}
      </div>

      {passage && !item.visual && (
        <div>
          <button onClick={toggleText} className="text-sm font-bold text-brand underline">{showText ? "Hide the text" : "📖 Read the text again"}</button>
          {showText && <Visual visual={passage} className="mt-2" />}
        </div>
      )}
      {item.visual && <div className="flex justify-center"><Visual visual={item.visual} /></div>}

      {item.type === "choice" && <ChoiceInput item={item} young={young} disabled={busy || done} onSubmit={onSubmit} />}
      {item.type === "number" && <NumberInput key={`${item.id}-${tryNumber}`} unit={item.unit} disabled={busy || done} onSubmit={onSubmit} />}
      {item.type === "order" && <OrderInput key={`${item.id}-${tryNumber}`} tiles={item.tiles} disabled={busy || done} onSubmit={onSubmit} />}

      {hintsShown > 0 && !done && (
        <ul className="space-y-2" aria-live="polite">
          {item.hints.slice(0, hintsShown).map((h, i) => <li key={i} className="rounded-2xl bg-sun-soft px-4 py-3 font-semibold">💡 {h}</li>)}
        </ul>
      )}

      <div aria-live="assertive">
        {feedback && !feedback.final && (
          <div className="rounded-2xl bg-coral-soft px-5 py-4">
            <p className="font-display text-xl font-bold">Not quite — have another go!</p>
            {feedback.remedy && <p className="mt-1 text-lg">{feedback.remedy}</p>}
          </div>
        )}
        {feedback?.final && (
          <div className={clsx("flex items-start gap-4 rounded-2xl px-5 py-4", feedback.correct ? "bg-leaf-soft" : "bg-sky-soft")}>
            <Pip className="size-16 shrink-0" mood={feedback.correct ? "cheer" : "think"} />
            <div>
              <p className="font-display text-xl font-bold">{feedback.correct ? (tryNumber > 1 ? "You got it on the second try!" : "Yes! Well done!") : "Let's learn this one together"}</p>
              {!feedback.correct && feedback.correctAnswer && <p className="mt-1 text-lg">The answer is <strong>{feedback.correctAnswer}</strong>.</p>}
              {feedback.explanation && <p className="mt-1 text-lg">{feedback.explanation}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {!done ? (
          <button onClick={onHint} disabled={hintsShown >= item.hints.length} className="min-h-12 rounded-full border-2 border-sun px-5 font-bold disabled:opacity-40">
            💡 {hintsShown >= item.hints.length ? "No more hints" : "Hint"}
          </button>
        ) : <span />}
        {done && (
          <button onClick={onNext} disabled={busy} autoFocus className="btn-pop min-h-14 rounded-full bg-brand px-8 font-display text-xl font-bold text-white disabled:opacity-60">
            {busy ? "…" : "Next →"}
          </button>
        )}
      </div>
    </div>
  );
}

function ChoiceInput({ item, young, disabled, onSubmit }: { item: Extract<PublicItem, { type: "choice" }>; young: boolean; disabled: boolean; onSubmit: (a: Answer) => void }) {
  const long = item.options.some((o) => o.label.length > 18);
  return (
    <div className={clsx("grid gap-3", long ? "grid-cols-1" : item.options.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
      {item.options.map((o) => (
        <button
          key={o.id}
          onClick={() => onSubmit(o.id)}
          disabled={disabled}
          className={clsx(
            "btn-pop flex min-h-16 items-center justify-center gap-2 rounded-2xl border-2 border-line bg-paper px-4 py-3 font-bold hover:border-brand disabled:opacity-60",
            young ? "min-h-24 text-3xl" : long ? "text-left text-lg" : "text-2xl",
          )}
        >
          {o.emoji && <span aria-hidden className={young ? "text-5xl" : "text-3xl"}>{o.emoji}</span>}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function NumberInput({ unit, disabled, onSubmit }: { unit?: string; disabled: boolean; onSubmit: (a: Answer) => void }) {
  const [value, setValue] = useState("");
  const press = (k: string) => setValue((v) => (k === "⌫" ? v.slice(0, -1) : v.length >= 8 ? v : k === "." && v.includes(".") ? v : v + k));
  const keys = useMemo(() => ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"], []);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim() !== "" && value !== ".") onSubmit(value);
      }}
      className="flex flex-col items-center gap-3"
    >
      <div className="flex items-center gap-2">
        <label htmlFor="answer" className="sr-only">Your answer</label>
        <input
          id="answer"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^\d.,-]/g, "").slice(0, 8))}
          inputMode="decimal"
          autoComplete="off"
          disabled={disabled}
          className="h-16 w-44 rounded-2xl border-4 border-brand text-center font-display text-4xl font-bold"
        />
        {unit && <span className="text-2xl font-bold text-ink-muted">{unit}</span>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {keys.map((k) => (
          <button key={k} type="button" disabled={disabled} onClick={() => press(k)} className="h-14 w-16 rounded-xl bg-paper font-display text-2xl font-bold hover:bg-brand-soft disabled:opacity-50" aria-label={k === "⌫" ? "Delete" : k}>
            {k}
          </button>
        ))}
      </div>
      <button type="submit" disabled={disabled || value === ""} className="btn-pop min-h-14 rounded-full bg-leaf px-10 font-display text-xl font-bold text-white disabled:opacity-50">Check</button>
    </form>
  );
}

function OrderInput({ tiles, disabled, onSubmit }: { tiles: { id: string; label: string; emoji?: string }[]; disabled: boolean; onSubmit: (a: Answer) => void }) {
  // Stable shuffle per item so the order isn't the answer.
  const shuffled = useMemo(() => [...tiles].sort((a, b) => hash(a.id + tiles.length) - hash(b.id + tiles.length)), [tiles]);
  const [picked, setPicked] = useState<string[]>([]);
  const label = (id: string) => tiles.find((t) => t.id === id)!;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-bold text-ink-muted">Tap the pieces in order. Tap a placed piece to take it back.</p>
      <ol className="flex min-h-20 flex-wrap items-center gap-2 rounded-2xl border-4 border-dashed border-brand/40 p-3" aria-label="Your order">
        {picked.length === 0 && <li className="text-ink-muted">Your order goes here…</li>}
        {picked.map((id, i) => (
          <li key={id}>
            <button disabled={disabled} onClick={() => setPicked((p) => p.filter((x) => x !== id))} className="flex items-center gap-1 rounded-xl bg-brand px-4 py-3 text-lg font-bold text-white">
              <span className="text-sm opacity-70">{i + 1}.</span> {label(id).emoji} {label(id).label}
            </button>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        {shuffled.filter((t) => !picked.includes(t.id)).map((t) => (
          <button key={t.id} disabled={disabled} onClick={() => setPicked((p) => [...p, t.id])} className="btn-pop rounded-xl border-2 border-line bg-paper px-4 py-3 text-lg font-bold hover:border-brand">
            {t.emoji} {t.label}
          </button>
        ))}
      </div>
      <button onClick={() => onSubmit(picked)} disabled={disabled || picked.length !== tiles.length} className="btn-pop min-h-14 self-center rounded-full bg-leaf px-10 font-display text-xl font-bold text-white disabled:opacity-50">Check</button>
    </div>
  );
}

function hash(s: string) {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 1_000_003;
  return h;
}

function Summary({ summary, backHref, journeySlug }: { summary: AttemptSummary; backHref: string; journeySlug?: string }) {
  const goalMet = summary.todayMinutes >= summary.dailyGoalMinutes;
  const j = journeySlug && summary.journey?.slug === journeySlug ? summary.journey : null;
  // In a journey, "next" is the next lesson; otherwise the activity's follow-up.
  const next = j ? (j.next ? { slug: j.next.slug, title: `Lesson ${j.next.n}: ${j.next.title}` } : null) : summary.followUp;
  const nextHref = next ? `/play/activity/${next.slug}${j ? `?journey=${j.slug}` : ""}` : null;
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <motion.div initial={{ scale: 0.6, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 12 }}>
        <Pip className="size-28" mood="cheer" />
      </motion.div>
      <h2 className="text-3xl font-bold">Adventure complete!</h2>
      <p className="text-xl">{summary.message}</p>
      <p className="font-display text-5xl font-bold text-brand">{summary.correct} / {summary.total}</p>
      {summary.masteredNow && <p className="rounded-2xl bg-leaf-soft px-5 py-3 text-lg font-bold text-success">⭐ You mastered this skill!</p>}
      {summary.newAchievements.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3">
          {summary.newAchievements.map((a) => (
            <motion.div key={a.code} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-2xl bg-sun-soft px-4 py-3">
              <p className="text-3xl" aria-hidden>{a.emoji}</p>
              <p className="font-bold">{a.title}</p>
              <p className="text-sm text-ink-soft">{a.description}</p>
            </motion.div>
          ))}
        </div>
      )}
      {j && (
        <p className={clsx("rounded-2xl px-5 py-3 text-lg font-bold", j.passed ? "bg-sun-soft" : "bg-sky-soft")}>
          {j.passed
            ? j.finished
              ? `🏆 You finished the whole ${j.title}!`
              : `🗺️ Lesson ${j.lesson} passed! The next lesson is open.`
            : `🗺️ Nearly there! Play lesson ${j.lesson} again to open the next one.`}
        </p>
      )}
      {goalMet && <p className="rounded-2xl bg-sky-soft px-5 py-3 font-bold">🌙 You reached today&apos;s learning goal! This is a great time for a break.</p>}
      <div className="flex flex-wrap justify-center gap-3">
        {nextHref && next && !goalMet && (!j || j.passed) && (
          <Link href={nextHref} className="btn-pop rounded-full bg-leaf px-8 py-4 font-display text-xl font-bold text-white">Next: {next.title} →</Link>
        )}
        <Link href={backHref} className="btn-pop rounded-full bg-brand px-8 py-4 font-display text-xl font-bold text-white">{j ? "Back to my map" : "Back to the map"}</Link>
        {nextHref && next && goalMet && (!j || j.passed) && <Link href={nextHref} className="rounded-full px-6 py-4 font-bold text-ink-soft underline">One more?</Link>}
      </div>
    </div>
  );
}
