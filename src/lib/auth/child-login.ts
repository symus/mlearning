/**
 * Simple login details printed on a child's card, next to the QR code.
 * Login ID: name + 4 digits ("aya4821"), made once. Password: friendly word + 4 digits ("tiger0482"),
 * new with every card. Both are easy for a child to type, so the server locks a card after a few
 * wrong tries. The password is only ever stored as a bcrypt hash.
 */
import { randomInt } from "node:crypto";

/** Short, friendly, easy-to-spell words (no look-alike letters, nothing unkind). */
export const PASSWORD_WORDS = [
  "apple", "bear", "bird", "boat", "cake", "cat", "cloud", "corn", "crab", "duck",
  "fish", "frog", "goat", "grape", "hands", "hat", "honey", "kite", "lamp", "leaf",
  "lemon", "lion", "mango", "moon", "mouse", "nest", "owl", "panda", "pear", "plum",
  "rain", "robot", "rocket", "seal", "ship", "snow", "star", "sun", "swan", "tiger",
  "train", "tree", "tulip", "whale", "wolf", "zebra", "drum", "bell", "comet", "daisy",
  "eagle", "fox", "hippo", "koala", "melon", "otter", "pizza", "river", "shell", "spoon",
  "tent", "toast", "turtle", "wave",
] as const;

export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

type Rand = (min: number, max: number) => number; // [min, max)
const secureRand: Rand = (min, max) => randomInt(min, max);

/** The name part of a login ID: lower-case a–z only (accents removed), at most 8 letters. */
export function loginIdBase(nickname: string): string {
  const letters = nickname
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .slice(0, 8);
  return letters || "explorer";
}

/** e.g. "Aya" → "aya4821". The caller retries if the ID is already taken. */
export function makeLoginId(nickname: string, rand: Rand = secureRand): string {
  return `${loginIdBase(nickname)}${rand(1000, 10000)}`;
}

/** e.g. "tiger0482". */
export function makeChildPassword(rand: Rand = secureRand): string {
  return `${PASSWORD_WORDS[rand(0, PASSWORD_WORDS.length)]}${String(rand(0, 10000)).padStart(4, "0")}`;
}

/** Children type carelessly: ignore case and spaces. */
export function normaliseChildCredential(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}

export function isLocked(lockedUntil: Date | null | undefined, now = new Date()): boolean {
  return !!lockedUntil && lockedUntil > now;
}
