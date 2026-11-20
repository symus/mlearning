/**
 * "Write your name" for the Winners board: the child taps letter tiles to spell their OWN first name.
 * Only their real first name can be made, so nothing unsafe can appear on the class board.
 */
const segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;

/** The letters of a name as tiles (whole characters, so names in any script work); spaces, dashes etc. are skipped. */
export function nameLetters(nickname: string): string[] {
  const chars = segmenter ? Array.from(segmenter.segment(nickname.normalize("NFC")), (s) => s.segment) : Array.from(nickname.normalize("NFC"));
  return chars.filter((c) => /\p{L}/u.test(c));
}

const DECOYS = "abcdefghijklmnopqrstuvwxyz".split("");

/** The name's letters plus a few decoys (more for older children), shuffled. */
export function nameTiles(nickname: string, decoyCount: number, rand: () => number = Math.random): string[] {
  const letters = nameLetters(nickname);
  const have = new Set(letters.map((l) => l.toLowerCase()));
  const pool = DECOYS.filter((d) => !have.has(d));
  const decoys: string[] = [];
  while (decoys.length < decoyCount && pool.length) decoys.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  const tiles = [...letters, ...decoys];
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles;
}

/** Is the spelled text the child's first name? (Capitals don't matter.) */
export function spellsName(spelled: string[], nickname: string): boolean {
  const target = nameLetters(nickname);
  return spelled.length === target.length && spelled.every((c, i) => c.toLocaleLowerCase() === target[i].toLocaleLowerCase());
}

/** Is `letter` the right next letter after `spelled`? */
export function isNextLetter(spelled: string[], letter: string, nickname: string): boolean {
  const target = nameLetters(nickname)[spelled.length];
  return !!target && target.toLocaleLowerCase() === letter.toLocaleLowerCase();
}
