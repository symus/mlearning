/**
 * Stickers: each activity has its own fixed sticker (no randomness, nothing to buy).
 * Chosen from a themed set for the activity's subject by its path position.
 */
const SETS: Record<string, { emoji: string; name: string }[]> = {
  maths: [
    { emoji: "🪐", name: "Ringed Planet" }, { emoji: "🚀", name: "Rocket" }, { emoji: "🌟", name: "Shining Star" }, { emoji: "☄️", name: "Comet" },
    { emoji: "🛸", name: "Space Saucer" }, { emoji: "🌙", name: "Moon" }, { emoji: "👩‍🚀", name: "Astronaut" }, { emoji: "🔭", name: "Telescope" },
  ],
  reading: [
    { emoji: "📚", name: "Book Pile" }, { emoji: "🦉", name: "Wise Owl" }, { emoji: "🏰", name: "Castle" }, { emoji: "🐉", name: "Friendly Dragon" },
    { emoji: "👑", name: "Crown" }, { emoji: "🪄", name: "Magic Wand" }, { emoji: "🦄", name: "Unicorn" }, { emoji: "📜", name: "Scroll" },
    { emoji: "🧚", name: "Fairy" }, { emoji: "🗝️", name: "Golden Key" }, { emoji: "🛡️", name: "Shield" }, { emoji: "🐸", name: "Frog Prince" },
  ],
  science: [
    { emoji: "🔬", name: "Microscope" }, { emoji: "🧪", name: "Test Tube" }, { emoji: "🌱", name: "Seedling" }, { emoji: "🦋", name: "Butterfly" },
    { emoji: "🧲", name: "Magnet" }, { emoji: "🌋", name: "Volcano" },
  ],
  logic: [
    { emoji: "🧩", name: "Puzzle Piece" }, { emoji: "🏝️", name: "Island" }, { emoji: "🦜", name: "Parrot" }, { emoji: "🐚", name: "Shell" },
    { emoji: "🧭", name: "Compass" }, { emoji: "🗺️", name: "Treasure Map" },
  ],
  coding: [
    { emoji: "🤖", name: "Robot" }, { emoji: "💡", name: "Bright Idea" }, { emoji: "🏙️", name: "City Lights" }, { emoji: "⚙️", name: "Gear" },
    { emoji: "🛰️", name: "Satellite" }, { emoji: "🔋", name: "Battery" },
  ],
};

const BAND_OFFSET: Record<string, number> = { LITTLE_EXPLORERS: 0, YOUNG_THINKERS: 3, FUTURE_INNOVATORS: 6 };

export function stickerFor(a: { subjectSlug: string; pathOrder: number; ageBand: string }) {
  const set = SETS[a.subjectSlug] ?? SETS.maths;
  return set[(a.pathOrder - 1 + (BAND_OFFSET[a.ageBand] ?? 0)) % set.length];
}

/** Lessons passed at this accuracy earn their sticker. */
export const STICKER_ACCURACY = 0.6;
