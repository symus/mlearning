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
    slug: "math-galaxy",
    name: "Math Galaxy",
    subject: "maths",
    emoji: "🪐",
    colour: "nebula",
    tagline: "Count, build and solve among the stars",
    description: "Planets of numbers: counting, operations, shape, measure, fractions and more.",
    status: "open",
    phase: 2,
  },
  {
    slug: "reading-kingdom",
    name: "Reading Kingdom",
    subject: "reading",
    emoji: "🌳",
    colour: "grove",
    tagline: "Sounds, words and stories in a kingdom of books",
    description: "Letter sounds, blending, tricky words, grammar and real comprehension of original stories.",
    status: "open",
    phase: 2,
  },
  {
    slug: "science-lab",
    name: "Science Lab",
    subject: "science",
    emoji: "🔬",
    colour: "lab",
    tagline: "Ask questions, test ideas",
    description: "Living things, materials, forces, space and simple experiments you can try at home.",
    status: "soon",
    phase: 6,
  },
  {
    slug: "logic-island",
    name: "Logic Island",
    subject: "logic",
    emoji: "🧩",
    colour: "peaks",
    tagline: "Climb with clever thinking",
    description: "Patterns, sequences, sorting, spatial puzzles and reasoning challenges.",
    status: "soon",
    phase: 6,
  },
  {
    slug: "coding-city",
    name: "Coding City",
    subject: "coding",
    emoji: "🤖",
    colour: "harbour",
    tagline: "Give instructions, build machines",
    description: "Sequences, loops, conditions and debugging with friendly robots.",
    status: "soon",
    phase: 6,
  },
  {
    slug: "world-explorer",
    name: "World Explorer",
    subject: "world",
    emoji: "🧭",
    colour: "atlas",
    tagline: "Explore places, people and the past",
    description: "Maps, continents, cultures and stories from history.",
    status: "soon",
    phase: 6,
  },
  {
    slug: "creative-studio",
    name: "Creative Studio",
    subject: "creative",
    emoji: "🎨",
    colour: "studio",
    tagline: "Draw, write and design",
    description: "Creative writing, drawing and design challenges that build on what you learn.",
    status: "soon",
    phase: 6,
  },
  {
    slug: "money-mission",
    name: "Money Mission",
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
