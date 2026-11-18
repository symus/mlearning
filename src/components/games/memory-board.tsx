"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { motion } from "framer-motion";
import { flipCard, gameState, invite, leaveGame, type GameView } from "@/app/actions/games";
import { Avatar } from "@/components/avatar";
import { Muchi } from "@/components/mascot";
import { useSfx } from "@/components/child/prefs";
import type { Seat } from "@/lib/games/memory";

const POLL_MS = 900;
const ENDED: Record<string, (other: string) => string> = {
  left: (o) => `${o} left the game.`,
  break: () => "A grown-up called a break. See you next time!",
  timeout: () => "This game fell asleep 😴",
  declined: (o) => `${o} couldn't play this time.`,
  cancelled: () => "This game was cancelled.",
};

export function MemoryBoard({ gameId, opponentId }: { gameId: string; opponentId: string }) {
  const router = useRouter();
  const sfx = useSfx();
  const [g, setG] = useState<GameView | null>(null);
  const [gone, setGone] = useState(false);
  const [pending, start] = useTransition();
  const lastScore = useRef(-1);

  const refresh = useCallback(async () => {
    try {
      const v = await gameState(gameId);
      if (!v) return setGone(true);
      setG(v);
    } catch {
      /* offline: try again next time */
    }
  }, [gameId]);

  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const id = setInterval(() => document.visibilityState === "visible" && refresh(), POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [refresh]);

  // A chime when I find a pair.
  useEffect(() => {
    if (!g) return;
    const mine = g.scores[g.me];
    if (lastScore.current >= 0 && mine > lastScore.current) sfx("correct");
    lastScore.current = mine;
  }, [g, sfx]);

  if (gone) return <p className="text-center text-lg font-bold">This game isn&apos;t here any more. <Link href="/play/games" className="underline">Back to games</Link></p>;
  if (!g) return <p className="text-center text-lg font-bold">Getting the cards ready…</p>;

  const other: Seat = g.me === "A" ? "B" : "A";
  const myTurn = g.status === "PLAYING" && g.turn === g.me;
  const waitingForFlipBack = g.cards.filter((c) => c.state === "up").length >= 2;
  const cols = g.cards.length <= 12 ? "grid-cols-4" : g.cards.length <= 16 ? "grid-cols-4" : "grid-cols-5";

  const tap = (i: number) =>
    start(async () => {
      sfx("tap");
      await flipCard(gameId, i);
      await refresh();
    });

  const playerChip = (seat: Seat) => (
    <div className={clsx("flex items-center gap-2 rounded-3xl px-3 py-2 ring-2 transition", g.status === "PLAYING" && g.turn === seat ? "bg-sun text-ink ring-sun" : "bg-white/10 ring-transparent")}>
      <Avatar avatar={g.avatars[seat]} size="sm" />
      <span className="font-display text-lg font-bold">{seat === g.me ? "You" : g.names[seat]}</span>
      <span className="ml-1 rounded-full bg-black/15 px-2 font-bold" aria-label={`${seat === g.me ? "Your" : `${g.names[seat]}'s`} pairs: ${g.scores[seat]}`}>⭐ {g.scores[seat]}</span>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {playerChip(g.me)}
        <p role="status" aria-live="polite" className="font-display text-xl font-bold">
          {g.status === "PLAYING" ? (myTurn ? (waitingForFlipBack ? "Not a pair… look carefully!" : "Your turn! Flip two cards") : `${g.names[other]}'s turn`) : g.status === "INVITED" ? `Waiting for ${g.names[other]}…` : ""}
        </p>
        {playerChip(other)}
      </div>

      <div className={clsx("mx-auto grid max-w-2xl gap-2 sm:gap-3", cols)}>
        {g.cards.map((c, i) => (
          <button
            key={i}
            disabled={!myTurn || c.state !== "down" || waitingForFlipBack || pending}
            onClick={() => tap(i)}
            aria-label={c.state === "down" ? `Card ${i + 1}, face down` : `Card ${i + 1}: ${c.face}${c.state === "won" ? " (found)" : ""}`}
            className={clsx(
              "grid aspect-square place-items-center rounded-2xl text-center font-display font-bold shadow-[0_4px_0_rgb(0_0_0/0.25)] transition",
              c.state === "down" && "bg-brand text-3xl text-white/70 enabled:hover:-translate-y-0.5",
              c.state === "up" && "bg-white text-ink",
              c.state === "won" && "bg-leaf-soft text-ink",
            )}
          >
            {/* A quick "turn over" each time the card changes side (keyed by state). */}
            <motion.span key={c.state} initial={{ rotateY: 90, opacity: 0.4 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.22 }} className="block">
              {c.state === "down" ? (
                <span aria-hidden>✦</span>
              ) : (
                <span className={clsx(c.face.length <= 2 ? "text-4xl sm:text-5xl" : c.face.length <= 5 ? "text-2xl sm:text-3xl" : "break-all px-1 text-base leading-tight sm:text-xl", c.state === "won" && "opacity-70")}>{c.face}</span>
              )}
            </motion.span>
          </button>
        ))}
      </div>

      {(g.status === "FINISHED" || g.status === "ENDED") && (
        <div role="status" className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-[2rem] bg-surface p-6 text-center text-ink shadow-xl">
          <Muchi className="size-20" mood={g.status === "FINISHED" ? "cheer" : "think"} />
          {g.status === "FINISHED" ? (
            <>
              <h2 className="text-2xl font-bold">
                {g.winner === "tie" ? "It's a tie! What a team! 🤝" : g.winner === g.me ? "You win! 🎉" : `${g.names[other]} wins! 🎉`}
              </h2>
              <p className="text-ink-soft">You found {g.scores[g.me]} pairs and {g.names[other]} found {g.scores[other]}. Great game, both of you!</p>
            </>
          ) : (
            <h2 className="text-2xl font-bold">{g.endedByMe && g.endedReason === "left" ? "You left the game." : (ENDED[g.endedReason ?? ""] ?? (() => "Game over"))(g.names[other])}</h2>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            {g.status === "FINISHED" && (
              <button
                onClick={() => start(async () => {
                  await invite(opponentId, g.deck);
                  router.push("/play/games");
                })}
                className="btn-pop rounded-full bg-brand px-6 py-3 font-bold text-white"
              >
                Play again
              </button>
            )}
            <Link href="/play/games" className="rounded-full bg-line px-6 py-3 font-bold">Back to games</Link>
          </div>
        </div>
      )}

      {g.status === "PLAYING" && (
        <p className="text-center">
          <button
            onClick={() => window.confirm("Leave this game?") && start(async () => {
              await leaveGame(gameId);
              await refresh();
            })}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20"
          >
            Leave game
          </button>
        </p>
      )}
    </div>
  );
}
