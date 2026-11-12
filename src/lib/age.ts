import type { AgeBand } from "@prisma/client";

export const MIN_AGE = 3;
export const MAX_AGE = 12;

export interface AgeBandInfo {
  band: AgeBand;
  name: string;
  ages: string;
  minAge: number;
  maxAge: number;
  /** Recommended session length in minutes (natural stopping point). */
  sessionMinutes: number;
  /** Items per activity round. Younger children get shorter rounds. */
  itemsPerRound: number;
  description: string;
}

export const AGE_BANDS: Record<AgeBand, AgeBandInfo> = {
  LITTLE_EXPLORERS: {
    band: "LITTLE_EXPLORERS",
    name: "Little Explorers",
    ages: "3–5",
    minAge: 3,
    maxAge: 5,
    sessionMinutes: 10,
    itemsPerRound: 4,
    description: "Voice-led play with big buttons: counting, letter sounds, shapes and patterns.",
  },
  YOUNG_THINKERS: {
    band: "YOUNG_THINKERS",
    name: "Young Thinkers",
    ages: "6–8",
    minAge: 6,
    maxAge: 8,
    sessionMinutes: 20,
    itemsPerRound: 6,
    description: "Number facts, phonics to fluent reading, puzzles and first steps in coding.",
  },
  FUTURE_INNOVATORS: {
    band: "FUTURE_INNOVATORS",
    name: "Future Innovators",
    ages: "9–12",
    minAge: 9,
    maxAge: 12,
    sessionMinutes: 30,
    itemsPerRound: 8,
    description: "Fractions to percentages, critical reading, science reasoning and real projects.",
  },
};

export function ageFromBirthYear(birthYear: number, now = new Date()): number {
  // We only store birth year (data minimisation), so age is approximate (±1).
  return now.getFullYear() - birthYear;
}

export function ageBandForAge(age: number): AgeBand {
  if (age <= 5) return "LITTLE_EXPLORERS";
  if (age <= 8) return "YOUNG_THINKERS";
  return "FUTURE_INNOVATORS";
}

export function ageBandForBirthYear(birthYear: number, now = new Date()): AgeBand {
  return ageBandForAge(ageFromBirthYear(birthYear, now));
}

/** Birth years a parent may choose (ages 3–12 this year, with a year of slack each side). */
export function allowedBirthYears(now = new Date()): number[] {
  const y = now.getFullYear();
  const years: number[] = [];
  for (let year = y - MIN_AGE + 1; year >= y - MAX_AGE - 1; year--) years.push(year);
  return years;
}
