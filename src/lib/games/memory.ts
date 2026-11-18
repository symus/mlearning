/**
 * Memory (find the pairs) for two classmates on two devices. Pure and unit-tested; the server keeps
 * the full state and sends each player only the cards that are face up (no peeking in the browser).
 *
 * Rules: take turns flipping two cards. A pair is yours (+1) and you go again. Not a pair: both
 * cards stay up for a moment so both players can see them, then turn over and the turn passes.
 */
export type AgeBand = "LITTLE_EXPLORERS" | "YOUNG_THINKERS" | "FUTURE_INNOVATORS";
export type DeckId = "animals" | "numbers" | "letters";
export type Seat = "A" | "B";

export const DECKS: { id: DeckId; name: string; emoji: string }[] = [
  { id: "animals", name: "Animal friends", emoji: "🦊" },
  { id: "numbers", name: "Number match", emoji: "🔢" },
  { id: "letters", name: "Big and small letters", emoji: "🔤" },
];

export const MISMATCH_SHOW_MS = 1500;
export const PAIRS_FOR: Record<AgeBand, number> = { LITTLE_EXPLORERS: 6, YOUNG_THINKERS: 8, FUTURE_INNOVATORS: 10 };

export interface Card {
  pair: number;
  face: string; // what the card shows when turned up
}

export interface MemoryState {
  cards: Card[];
  matched: number[]; // card indexes already won
  revealed: number[]; // face-up cards this turn (0–2)
  hideAt: number | null; // when a wrong pair turns back over (ms since epoch)
  turn: Seat;
  scores: Record<Seat, number>;
}

type Rand = () => number; // [0, 1)

function shuffle<T>(xs: T[], rand: Rand): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ANIMALS = ["🐶", "🐱", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐸", "🐵", "🐧", "🦉", "🐢", "🐙", "🦋", "🐝"];
const LETTERS = "ABDEFGHJKMNQRT".split(""); // letters whose capital and small forms look different

/** Pairs for a deck: identical pictures, or two faces that belong together (7 ↔ 3 + 4, A ↔ a). */
export function pairsFor(deck: DeckId, band: AgeBand, count: number, rand: Rand): [string, string][] {
  if (deck === "animals") return shuffle(ANIMALS, rand).slice(0, count).map((e) => [e, e]);
  if (deck === "letters") return shuffle(LETTERS, rand).slice(0, count).map((l) => [l, l.toLowerCase()]);
  if (band === "LITTLE_EXPLORERS") {
    // number ↔ that many dots (1–10)
    return shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], rand).slice(0, count).map((n) => [String(n), "●".repeat(n)]);
  }
  // a sum ↔ its answer; every answer different so each card has exactly one partner
  const max = band === "YOUNG_THINKERS" ? 20 : 50;
  const answers = shuffle(Array.from({ length: max - 4 }, (_, i) => i + 5), rand).slice(0, count);
  return answers.map((total) => {
    const a = 1 + Math.floor(rand() * (total - 1));
    return [`${a} + ${total - a}`, String(total)];
  });
}

export function newGame(deck: DeckId, band: AgeBand, rand: Rand = Math.random): MemoryState {
  const pairs = pairsFor(deck, band, PAIRS_FOR[band], rand);
  const cards = shuffle(pairs.flatMap(([x, y], pair) => [{ pair, face: x }, { pair, face: y }]), rand);
  return { cards, matched: [], revealed: [], hideAt: null, turn: "A", scores: { A: 0, B: 0 } };
}

export const isOver = (s: MemoryState) => s.matched.length === s.cards.length;

/** Turn a shown wrong pair back over once its moment has passed, and pass the turn. */
export function settle(s: MemoryState, now: number): MemoryState {
  if (s.revealed.length === 2 && s.hideAt !== null && now >= s.hideAt) {
    return { ...s, revealed: [], hideAt: null, turn: s.turn === "A" ? "B" : "A" };
  }
  return s;
}

export type FlipError = "over" | "not-your-turn" | "bad-card" | "wait";

export function flip(state: MemoryState, seat: Seat, index: number, now: number): { state: MemoryState } | { error: FlipError } {
  const s = settle(state, now);
  if (isOver(s)) return { error: "over" };
  if (s.turn !== seat) return { error: "not-your-turn" };
  if (!Number.isInteger(index) || index < 0 || index >= s.cards.length || s.matched.includes(index) || s.revealed.includes(index)) return { error: "bad-card" };
  if (s.revealed.length >= 2) return { error: "wait" };

  const revealed = [...s.revealed, index];
  if (revealed.length < 2) return { state: { ...s, revealed } };
  const [i, j] = revealed;
  if (s.cards[i].pair === s.cards[j].pair) {
    return { state: { ...s, revealed: [], hideAt: null, matched: [...s.matched, i, j], scores: { ...s.scores, [seat]: s.scores[seat] + 1 } } };
  }
  return { state: { ...s, revealed, hideAt: now + MISMATCH_SHOW_MS } };
}

export type CardView = { state: "down" } | { state: "up" | "won"; face: string };

/** What a player's browser may see: faces only of cards that are face up or already won. */
export function publicCards(s: MemoryState): CardView[] {
  return s.cards.map((c, i) =>
    s.matched.includes(i) ? { state: "won", face: c.face } : s.revealed.includes(i) ? { state: "up", face: c.face } : { state: "down" },
  );
}

export function winner(s: MemoryState): Seat | "tie" | null {
  if (!isOver(s)) return null;
  return s.scores.A === s.scores.B ? "tie" : s.scores.A > s.scores.B ? "A" : "B";
}
