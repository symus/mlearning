"use server";

import type { ChildProfile, MemoryGame, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/dal";
import { isPaused, ONLINE_MS } from "@/lib/learning/pause";
import { touchSeen } from "@/lib/learning/presence";
import { getToday } from "@/lib/learning/queries";
import { limitStatus } from "@/lib/learning/limits";
import { nameLetters, spellsName } from "@/lib/games/name-tiles";
import { winnersBoard, type WinnerEntry } from "@/lib/games/winners";
import { DECKS, flip, isOver, newGame, publicCards, settle, winner, type CardView, type DeckId, type MemoryState, type Seat } from "@/lib/games/memory";

/*
 * Live Memory for classmates on two devices. Safety rules:
 *  - only students of the same class, and only if their teacher has games switched on;
 *  - no chat or free text: the only inputs are invite / accept / decline / flip / leave;
 *  - parent pause and the daily limit apply; "pure fun": nothing goes to progress or reports,
 *    and games are deleted after a day.
 */

const INVITE_TTL_MS = 60_000;
const IDLE_TTL_MS = 3 * 60_000;
const KEEP_MS = 24 * 3600_000;
/** Extra letters mixed into the name tiles: none for the youngest (they just find their letters). */
const DECOYS: Record<string, number> = { LITTLE_EXPLORERS: 0, YOUNG_THINKERS: 3, FUTURE_INNOVATORS: 5 };

type Blocked = "no-class" | "games-off" | "paused" | "daily-limit";

async function player(): Promise<{ child: ChildProfile; classroomId: string } | { blocked: Blocked }> {
  const session = await getSession();
  const child = session?.activeChild;
  if (!child) throw new Error("No active child profile.");
  if (!child.classroomId) return { blocked: "no-class" };
  const cls = await db.classroom.findUnique({ where: { id: child.classroomId }, select: { gamesEnabled: true, archivedAt: true } });
  if (!cls || cls.archivedAt || !cls.gamesEnabled) return { blocked: "games-off" };
  if (isPaused(child.pausedUntil)) return { blocked: "paused" };
  return { child, classroomId: child.classroomId };
}

async function dailyLimitReached(child: Pick<ChildProfile, "id" | "dailyLimitMinutes">) {
  return limitStatus((await getToday(child.id)).minutes, child.dailyLimitMinutes) === "reached";
}

/** End invites nobody answered and games nobody is playing; forget old games entirely. */
async function tidy(childId: string) {
  const now = Date.now();
  await db.memoryGame.deleteMany({ where: { updatedAt: { lt: new Date(now - KEEP_MS) } } });
  const mine = { OR: [{ playerAId: childId }, { playerBId: childId }] };
  await db.memoryGame.updateMany({ where: { ...mine, status: "INVITED", createdAt: { lt: new Date(now - INVITE_TTL_MS) } }, data: { status: "ENDED", endedReason: "timeout" } });
  await db.memoryGame.updateMany({ where: { ...mine, status: "PLAYING", updatedAt: { lt: new Date(now - IDLE_TTL_MS) } }, data: { status: "ENDED", endedReason: "timeout" } });
}

const nameOf = (c: Pick<ChildProfile, "nickname">) => c.nickname;

export interface LobbyView {
  blocked: Blocked | null;
  decks: typeof DECKS;
  classmates: { id: string; name: string; avatar: unknown; online: boolean; busy: boolean }[];
  incoming: { gameId: string; from: string; deck: string }[];
  outgoing: { gameId: string; to: string; status: "waiting" | "declined" | "timeout" } | null;
  activeGameId: string | null;
  winners: WinnerEntry[];
}


export async function lobby(): Promise<LobbyView> {
  const p = await player();
  const empty = { decks: DECKS, classmates: [], incoming: [], outgoing: null, activeGameId: null, winners: [] };
  if ("blocked" in p) return { blocked: p.blocked, ...empty };
  const { child, classroomId } = p;
  await Promise.all([touchSeen(child), tidy(child.id)]);

  const [classmates, open, lastOut, winners] = await Promise.all([
    db.childProfile.findMany({ where: { classroomId, id: { not: child.id } }, orderBy: { nickname: "asc" }, select: { id: true, nickname: true, avatar: true, lastSeenAt: true } }),
    db.memoryGame.findMany({ where: { classroomId, status: { in: ["INVITED", "PLAYING"] } }, select: { id: true, playerAId: true, playerBId: true, status: true, deck: true } }),
    db.memoryGame.findFirst({ where: { playerAId: child.id, createdAt: { gte: new Date(Date.now() - 2 * INVITE_TTL_MS) } }, orderBy: { createdAt: "desc" }, include: { playerB: { select: { nickname: true } } } }),
    winnersBoard(classroomId),
  ]);
  const busy = new Set(open.flatMap((g) => [g.playerAId, g.playerBId]));
  const active = open.find((g) => g.status === "PLAYING" && (g.playerAId === child.id || g.playerBId === child.id));
  const names = new Map(classmates.map((c) => [c.id, c.nickname]));
  const now = Date.now();

  return {
    blocked: null,
    decks: DECKS,
    classmates: classmates.map((c) => ({ id: c.id, name: c.nickname, avatar: c.avatar, online: !!c.lastSeenAt && now - c.lastSeenAt.getTime() < ONLINE_MS, busy: busy.has(c.id) })),
    incoming: open.filter((g) => g.status === "INVITED" && g.playerBId === child.id).map((g) => ({ gameId: g.id, from: names.get(g.playerAId) ?? "A classmate", deck: g.deck })),
    outgoing:
      lastOut && (lastOut.status === "INVITED" || lastOut.endedReason === "declined" || lastOut.endedReason === "timeout")
        ? { gameId: lastOut.id, to: nameOf(lastOut.playerB), status: lastOut.status === "INVITED" ? "waiting" : (lastOut.endedReason as "declined" | "timeout") }
        : null,
    activeGameId: active?.id ?? null,
    winners,
  };
}

export async function invite(opponentId: string, deck: string): Promise<{ gameId: string } | { error: string }> {
  const p = await player();
  if ("blocked" in p) return { error: p.blocked };
  const { child, classroomId } = p;
  if (!DECKS.some((d) => d.id === deck)) return { error: "bad-deck" };
  if (await dailyLimitReached(child)) return { error: "daily-limit" };
  const [opponent, cls] = await Promise.all([
    db.childProfile.findFirst({ where: { id: opponentId, classroomId, NOT: { id: child.id } }, select: { id: true, lastSeenAt: true } }),
    db.classroom.findUniqueOrThrow({ where: { id: classroomId }, select: { ageBand: true } }),
  ]);
  if (!opponent) return { error: "not-a-classmate" };
  if (!opponent.lastSeenAt || Date.now() - opponent.lastSeenAt.getTime() > ONLINE_MS) return { error: "offline" }; // no invites piling up for absent classmates
  await tidy(child.id);
  const busy = await db.memoryGame.count({
    where: { status: "PLAYING", OR: [{ playerAId: { in: [child.id, opponent.id] } }, { playerBId: { in: [child.id, opponent.id] } }] },
  });
  if (busy) return { error: "busy" };
  // One invite at a time: a new one replaces the old.
  await db.memoryGame.updateMany({ where: { playerAId: child.id, status: "INVITED" }, data: { status: "ENDED", endedReason: "cancelled" } });
  const game = await db.memoryGame.create({
    data: { classroomId, playerAId: child.id, playerBId: opponent.id, deck, state: newGame(deck as DeckId, cls.ageBand) as unknown as Prisma.InputJsonValue },
  });
  return { gameId: game.id };
}

export async function respond(gameId: string, accept: boolean): Promise<{ ok: boolean; error?: string }> {
  const p = await player();
  if ("blocked" in p) return { ok: false, error: p.blocked };
  const { child } = p;
  await tidy(child.id);
  if (accept && (await dailyLimitReached(child))) return { ok: false, error: "daily-limit" };
  const { count } = await db.memoryGame.updateMany({
    where: { id: gameId, playerBId: child.id, status: "INVITED" },
    data: accept ? { status: "PLAYING" } : { status: "ENDED", endedReason: "declined", endedById: child.id },
  });
  return count ? { ok: true } : { ok: false, error: "gone" };
}

export async function cancelInvite(gameId: string): Promise<void> {
  const session = await getSession();
  const child = session?.activeChild;
  if (!child) return;
  await db.memoryGame.updateMany({ where: { id: gameId, playerAId: child.id, status: "INVITED" }, data: { status: "ENDED", endedReason: "cancelled", endedById: child.id } });
}

export interface GameView {
  status: "INVITED" | "PLAYING" | "FINISHED" | "ENDED";
  me: Seat;
  names: Record<Seat, string>;
  avatars: Record<Seat, unknown>;
  cards: CardView[];
  turn: Seat;
  scores: Record<Seat, number>;
  winner: Seat | "tie" | null;
  endedReason: string | null;
  endedByMe: boolean;
  deck: string;
  /** The finished game was won (or tied) by me: I may write my name for the Winners board. */
  sign: { signed: boolean; decoys: number } | null;
}

async function loadMine(gameId: string, childId: string) {
  return db.memoryGame.findFirst({
    where: { id: gameId, OR: [{ playerAId: childId }, { playerBId: childId }] },
    include: { playerA: { select: { nickname: true, avatar: true, pausedUntil: true } }, playerB: { select: { nickname: true, avatar: true, pausedUntil: true } } },
  });
}

function view(g: NonNullable<Awaited<ReturnType<typeof loadMine>>>, childId: string, s: MemoryState, sign: GameView["sign"] = null): GameView {
  return {
    status: g.status,
    me: g.playerAId === childId ? "A" : "B",
    names: { A: g.playerA.nickname, B: g.playerB.nickname },
    avatars: { A: g.playerA.avatar, B: g.playerB.avatar },
    cards: publicCards(s),
    turn: s.turn,
    scores: s.scores,
    winner: winner(s),
    endedReason: g.endedReason,
    endedByMe: g.endedById === childId,
    deck: g.deck,
    sign,
  };
}

/** Did I win (or tie) this finished game? */
const iWon = (g: MemoryGame, childId: string, s: MemoryState) => {
  const w = winner(s);
  return g.status === "FINISHED" && (w === "tie" || w === (g.playerAId === childId ? "A" : "B"));
};

/** Save a new state only if nobody changed the game meanwhile. */
async function save(g: MemoryGame, s: MemoryState, extra: Prisma.MemoryGameUpdateManyMutationInput = {}) {
  const { count } = await db.memoryGame.updateMany({
    where: { id: g.id, version: g.version },
    data: { state: s as unknown as Prisma.InputJsonValue, version: { increment: 1 }, ...(isOver(s) ? { status: "FINISHED" } : {}), ...extra },
  });
  return count > 0;
}

export async function gameState(gameId: string): Promise<GameView | null> {
  const session = await getSession();
  const child = session?.activeChild;
  if (!child) return null;
  await Promise.all([touchSeen(child), tidy(child.id)]);
  const g = await loadMine(gameId, child.id);
  if (!g) return null;
  let s = g.state as unknown as MemoryState;
  if (g.status === "PLAYING") {
    // A grown-up called a break for either player: the game ends kindly.
    if (isPaused(g.playerA.pausedUntil) || isPaused(g.playerB.pausedUntil)) {
      await db.memoryGame.updateMany({ where: { id: g.id, status: "PLAYING" }, data: { status: "ENDED", endedReason: "break" } });
      return view({ ...g, status: "ENDED", endedReason: "break" }, child.id, s);
    }
    const settled = settle(s, Date.now());
    if (settled !== s && (await save(g, settled))) s = settled;
  }
  if (iWon(g, child.id, s)) {
    const signed = !!(await db.gameWin.findUnique({ where: { gameId_childId: { gameId: g.id, childId: child.id } }, select: { id: true } }));
    return view(g, child.id, s, { signed, decoys: DECOYS[child.ageBand] ?? 3 });
  }
  return view(g, child.id, s);
}

/**
 * The winner writes their name (by tapping letter tiles) to go on the class Winners board.
 * Only the child's own first name is accepted, so nothing else can ever appear on the board.
 */
export async function signWin(gameId: string, letters: string[]): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  const child = session?.activeChild;
  if (!child?.classroomId) return { ok: false, error: "no-class" };
  if (!Array.isArray(letters) || letters.length > 40 || !letters.every((l) => typeof l === "string" && l.length <= 8)) return { ok: false, error: "bad-name" };
  if (!spellsName(letters, child.nickname) || nameLetters(child.nickname).length === 0) return { ok: false, error: "bad-name" };
  const g = await db.memoryGame.findFirst({ where: { id: gameId, classroomId: child.classroomId, OR: [{ playerAId: child.id }, { playerBId: child.id }] } });
  if (!g) return { ok: false, error: "gone" };
  const s = g.state as unknown as MemoryState;
  if (!iWon(g, child.id, s)) return { ok: false, error: "not-winner" };
  await db.gameWin.upsert({
    where: { gameId_childId: { gameId: g.id, childId: child.id } },
    create: { gameId: g.id, childId: child.id, classroomId: g.classroomId, deck: g.deck, tie: winner(s) === "tie" },
    update: {},
  });
  return { ok: true };
}

export async function flipCard(gameId: string, index: number): Promise<{ ok: boolean; error?: string }> {
  const p = await player();
  if ("blocked" in p) return { ok: false, error: p.blocked };
  const { child } = p;
  for (let tries = 0; tries < 2; tries++) {
    const g = await loadMine(gameId, child.id);
    if (!g || g.status !== "PLAYING") return { ok: false, error: "not-playing" };
    const res = flip(g.state as unknown as MemoryState, g.playerAId === child.id ? "A" : "B", index, Date.now());
    if ("error" in res) return { ok: false, error: res.error };
    if (await save(g, res.state)) return { ok: true };
  }
  return { ok: false, error: "busy" };
}

export async function leaveGame(gameId: string): Promise<void> {
  const session = await getSession();
  const child = session?.activeChild;
  if (!child) return;
  await db.memoryGame.updateMany({
    where: { id: gameId, status: { in: ["INVITED", "PLAYING"] }, OR: [{ playerAId: child.id }, { playerBId: child.id }] },
    data: { status: "ENDED", endedReason: "left", endedById: child.id },
  });
}
