"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { cancelInvite, invite, lobby, respond, type LobbyView } from "@/app/actions/games";
import { Avatar } from "@/components/avatar";
import { Muchi } from "@/components/mascot";
import { useSfx } from "@/components/child/prefs";

const POLL_MS = 2500;

const BLOCKED: Record<string, string> = {
  "no-class": "Playing with classmates is for school classes.",
  "games-off": "Your teacher has switched games off for now.",
  paused: "A grown-up has paused Arivupulla for a while.",
  "daily-limit": "That's your learning time for today. Play again tomorrow!",
  offline: "That classmate isn't here right now.",
  busy: "One of you is already in a game.",
  gone: "That invitation has finished.",
};

/** Pick a game, see which classmates are here, invite one or answer an invitation. No chat, no typing. */
export function GamesLobby({ initialDeck }: { initialDeck?: string }) {
  const router = useRouter();
  const sfx = useSfx();
  const [data, setData] = useState<LobbyView | null>(null);
  const [deck, setDeck] = useState(initialDeck ?? "animals");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  const refresh = useCallback(async () => {
    try {
      const v = await lobby();
      setData(v);
      if (v.activeGameId) router.push(`/play/games/${v.activeGameId}`);
    } catch {
      /* offline: try again next time */
    }
  }, [router]);

  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const id = setInterval(() => document.visibilityState === "visible" && refresh(), POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [refresh]);

  if (!data) return <p className="text-center text-lg font-bold">Looking for your classmates…</p>;
  if (data.blocked) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-[2rem] bg-surface p-8 text-center text-ink">
        <Muchi className="size-20" mood="think" />
        <p className="text-lg font-bold">{BLOCKED[data.blocked]}</p>
      </div>
    );
  }

  const act = (fn: () => Promise<unknown>) =>
    start(async () => {
      setNote("");
      await fn();
      await refresh();
    });
  const here = data.classmates.filter((c) => c.online);
  const away = data.classmates.filter((c) => !c.online);
  const deckName = (id: string) => data.decks.find((d) => d.id === id)?.name ?? "Memory";

  return (
    <div className="space-y-8">
      {data.incoming.map((inv) => (
        <section key={inv.gameId} role="alert" className="flex flex-col items-center gap-3 rounded-[2rem] bg-sun p-5 text-center text-ink sm:flex-row sm:text-left">
          <span className="text-5xl" aria-hidden>🎮</span>
          <p className="flex-1 font-display text-xl font-bold">{inv.from} wants to play {deckName(inv.deck)}!</p>
          <div className="flex gap-2">
            <button
              disabled={pending}
              onClick={() =>
                act(async () => {
                  const r = await respond(inv.gameId, true);
                  if (!r.ok) setNote(BLOCKED[r.error ?? "gone"] ?? "");
                  else sfx("levelUp");
                })
              }
              className="btn-pop rounded-full bg-brand px-6 py-3 font-bold text-white"
            >
              Let&apos;s play!
            </button>
            <button disabled={pending} onClick={() => act(() => respond(inv.gameId, false))} className="rounded-full bg-white/70 px-5 py-3 font-bold">
              Not now
            </button>
          </div>
        </section>
      ))}

      {data.outgoing && (
        <section role="status" className="flex flex-wrap items-center justify-center gap-3 rounded-[2rem] bg-white/15 p-4 text-center font-bold">
          {data.outgoing.status === "waiting" ? (
            <>
              <span className="animate-pulse">⏳ Waiting for {data.outgoing.to} to say yes…</span>
              <button disabled={pending} onClick={() => act(() => cancelInvite(data.outgoing!.gameId))} className="rounded-full bg-white/15 px-4 py-2 text-sm hover:bg-white/25">
                Cancel
              </button>
            </>
          ) : data.outgoing.status === "declined" ? (
            <span>{data.outgoing.to} can&apos;t play right now. Try someone else!</span>
          ) : (
            <span>{data.outgoing.to} didn&apos;t answer. Try again later!</span>
          )}
        </section>
      )}
      {note && <p role="status" className="text-center font-bold">{note}</p>}

      <section aria-labelledby="pick-game" className="space-y-3">
        <h2 id="pick-game" className="text-2xl font-bold">1. Pick a game</h2>
        <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Memory game">
          {data.decks.map((d) => (
            <button
              key={d.id}
              role="radio"
              aria-checked={deck === d.id}
              onClick={() => setDeck(d.id)}
              className={clsx("flex items-center gap-3 rounded-3xl p-4 text-left ring-2 transition", deck === d.id ? "bg-white text-ink ring-sun" : "bg-white/10 ring-white/15 hover:bg-white/15")}
            >
              <span className="text-4xl" aria-hidden>{d.emoji}</span>
              <span className="font-display text-lg font-bold">{d.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="who" className="space-y-3">
        <h2 id="who" className="text-2xl font-bold">2. Who&apos;s here?</h2>
        {here.length === 0 && <p className="rounded-2xl bg-white/10 p-4 text-white/80">Nobody else from your class is here right now. When a classmate opens Arivupulla, they&apos;ll pop up here!</p>}
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {here.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-3xl bg-white/15 p-3">
              <Avatar avatar={c.avatar} size="md" />
              <span className="flex-1">
                <span className="block font-display text-lg font-bold">{c.name}</span>
                <span className="text-sm text-white/75">{c.busy ? "Playing a game" : "🟢 Here now"}</span>
              </span>
              <button
                disabled={pending || c.busy || data.outgoing?.status === "waiting"}
                aria-label={`Invite ${c.name} to play`}
                onClick={() =>
                  act(async () => {
                    const r = await invite(c.id, deck);
                    if ("error" in r) setNote(BLOCKED[r.error] ?? "");
                  })
                }
                className="btn-pop rounded-full bg-sun px-4 py-2 font-bold text-ink disabled:opacity-50"
              >
                Invite
              </button>
            </li>
          ))}
        </ul>
        {away.length > 0 && <p className="text-sm text-white/60">Not here right now: {away.map((c) => c.name).join(", ")}</p>}
      </section>
    </div>
  );
}
