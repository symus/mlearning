/**
 * Destinations in the learning universe. Each world maps to one subject.
 * `status: "open"` worlds have published content; "soon" worlds show a preview page.
 */
export type WorldStatus = "open" | "soon";

export interface World {
  slug: string;
  name: string;
  subject: string;
  emoji: string;
  /** CSS colour token name defined in globals.css (e.g. --color-world-nebula). */
  colour: string;
  tagline: string;
  description: string;
  status: WorldStatus;
  phase: number; // roadmap phase in which the world opens
}

export const WORLDS: World[] = [
  {
    slug: "number-nebula",
    name: "Number Nebula",
    subject: "maths",
    emoji: "🪐",
    colour: "nebula",
    tagline: "Count, build and solve among the stars",
    description: "From counting stars to fractions of planets: number sense, operations, shape and measure.",
    status: "open",
    phase: 2,
  },
  {
    slug: "story-grove",
    name: "Story Grove",
    subject: "reading",
    emoji: "🌳",
    colour: "grove",
    tagline: "Sounds, words and stories that grow",
    description: "Letter sounds, blending, vocabulary, grammar and real comprehension of original stories.",
    status: "open",
    phase: 2,
  },
  {
    slug: "discovery-lab",
    name: "Discovery Lab",
    subject: "science",
    emoji: "🔬",
    colour: "lab",
    tagline: "Ask questions, test ideas",
    description: "Living things, materials, forces and simple experiments you can try at home.",
    status: "soon",
    phase: 6,
  },
  {
    slug: "puzzle-peaks",
    name: "Puzzle Peaks",
    subject: "logic",
    emoji: "🧩",
    colour: "peaks",
    tagline: "Climb with clever thinking",
    description: "Patterns, sequences, spatial puzzles and reasoning challenges.",
    status: "soon",
    phase: 6,
  },
  {
    slug: "code-harbour",
    name: "Code Harbour",
    subject: "coding",
    emoji: "🤖",
    colour: "harbour",
    tagline: "Give instructions, build machines",
    description: "Sequencing, loops, conditions and debugging through friendly robots.",
    status: "soon",
    phase: 6,
  },
  {
    slug: "atlas-trails",
    name: "Atlas Trails",
    subject: "world",
    emoji: "🧭",
    colour: "atlas",
    tagline: "Explore places, people and the past",
    description: "Maps, continents, cultures and stories from history.",
    status: "soon",
    phase: 6,
  },
  {
    slug: "make-studio",
    name: "Make Studio",
    subject: "creative",
    emoji: "🎨",
    colour: "studio",
    tagline: "Draw, write and design",
    description: "Creative writing, drawing and design challenges that build on what you learn.",
    status: "soon",
    phase: 6,
  },
  {
    slug: "coin-cove",
    name: "Coin Cove",
    subject: "money",
    emoji: "🪙",
    colour: "cove",
    tagline: "Save, spend and plan wisely",
    description: "Coins, budgets, saving goals and smart choices with money.",
    status: "soon",
    phase: 6,
  },
];

export function getWorld(slug: string): World | undefined {
  return WORLDS.find((w) => w.slug === slug);
}

export function worldForSubject(subject: string): World | undefined {
  return WORLDS.find((w) => w.subject === subject);
}
