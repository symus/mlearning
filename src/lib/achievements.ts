/**
 * Achievements reward effort, persistence and understanding — never speed or streak pressure.
 * Full achievement system arrives in Phase 3; these are the first ones.
 */
export const ACHIEVEMENTS = {
  FIRST_STEP: { title: "First Step", emoji: "👣", description: "Finished your first activity." },
  KEEP_GOING: { title: "Bounce Back", emoji: "🌱", description: "Got one right straight after a tricky one." },
  HINT_HERO: { title: "Hint Hero", emoji: "💡", description: "Used a hint and then solved it." },
  MASTER_1: { title: "Skill Unlocked", emoji: "⭐", description: "Mastered your first skill." },
  EXPLORER_5: { title: "Explorer", emoji: "🧭", description: "Finished 5 activities." },
} as const;
export type AchievementCode = keyof typeof ACHIEVEMENTS;
