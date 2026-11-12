import { z } from "zod";

/**
 * The content contract. Every activity file in /content/activities must pass this schema
 * before it can be imported. It enforces the 13 required parts of a learning activity:
 *  1 ageBand  2 subject  3 topic/subtopic  4 objective  5 prerequisites (on the objective)
 *  6 explanation  7 interactive items  8 levels  9 hints  10 answer + explanation
 *  11 misconceptions  12 mastery criteria  13 follow-up
 */

export const ageBandEnum = z.enum(["LITTLE_EXPLORERS", "YOUNG_THINKERS", "FUTURE_INNOVATORS"]);

/** Visual models shown with an explanation or an item. Rendered by <Visual/>. */
export const visualSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("objects"), emoji: z.string(), count: z.number().int().min(0).max(30) }),
  z.object({
    kind: z.literal("groups"),
    groups: z.array(z.object({ emoji: z.string(), count: z.number().int().min(0).max(20) })).min(1).max(4),
    operator: z.enum(["+", "-", "and"]).optional(),
  }),
  z.object({ kind: z.literal("tenFrame"), filled: z.number().int().min(0).max(20) }),
  z.object({
    kind: z.literal("numberLine"),
    from: z.number(),
    to: z.number(),
    mark: z.number().optional(),
    jumps: z.array(z.number()).optional(),
  }),
  z.object({ kind: z.literal("array"), rows: z.number().int().min(1).max(10), cols: z.number().int().min(1).max(12), emoji: z.string().optional() }),
  z.object({ kind: z.literal("fractionBar"), parts: z.number().int().min(1).max(12), shaded: z.number().int().min(0).max(12) }),
  z.object({ kind: z.literal("shape"), shape: z.enum(["circle", "square", "triangle", "rectangle", "pentagon", "hexagon", "star", "oval"]) }),
  z.object({ kind: z.literal("placeValue"), hundreds: z.number().int().min(0).max(9).optional(), tens: z.number().int().min(0).max(9), ones: z.number().int().min(0).max(9) }),
  z.object({ kind: z.literal("passage"), title: z.string().optional(), text: z.string().min(10) }),
  z.object({ kind: z.literal("bigText"), text: z.string().min(1).max(40) }),
  z.object({ kind: z.literal("pattern"), items: z.array(z.string()).min(2).max(12) }),
  z.object({ kind: z.literal("grid"), rows: z.number().int().min(1).max(12), cols: z.number().int().min(1).max(12), unit: z.string().optional() }),
]);
export type Visual = z.infer<typeof visualSchema>;

/**
 * Optional "Watch & Sing" step shown before the explanation.
 * - song: original lyrics read aloud line by line with karaoke highlighting and a picture per line.
 * - video: a recorded video file (self-hosted or CDN) with a required captions file for accessibility.
 */
export const watchSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("song"),
    title: z.string().min(3),
    lines: z.array(z.object({ text: z.string().min(2).max(90), visual: visualSchema.optional() })).min(2).max(12),
    /** Original tune generated in the browser: speed and instrument. */
    tune: z
      .object({ bpm: z.number().int().min(60).max(150), instrument: z.enum(["xylophone", "piano", "marimba"]) })
      .default({ bpm: 100, instrument: "xylophone" }),
    credit: z.string().default("Original lyrics and tune"),
  }),
  z.object({
    kind: z.literal("video"),
    title: z.string().min(3),
    src: z.string().regex(/^(\/|https:\/\/)/, "Use a site path (/media/...) or an https URL"),
    captions: z.string().regex(/^(\/|https:\/\/).+\.vtt$/, "Captions (.vtt) are required for accessibility"),
    poster: z.string().optional(),
    credit: z.string(),
  }),
]);
export type Watch = z.infer<typeof watchSchema>;

const option = z.object({ id: z.string(), label: z.string(), emoji: z.string().optional() });

const itemBase = {
  id: z.string().regex(/^[a-z0-9-]+$/),
  prompt: z.string().min(3),
  /** Text read aloud; defaults to prompt. Essential for pre-readers. */
  say: z.string().optional(),
  visual: visualSchema.optional(),
  hints: z.array(z.string().min(3)).min(1).max(3),
  explanation: z.string().min(10),
  /** Wrong answer -> misconception code, so we learn *why* a child is wrong. */
  misconceptions: z.record(z.string(), z.string()).optional(),
};

export const itemSchema = z.discriminatedUnion("type", [
  z.object({
    ...itemBase,
    type: z.literal("choice"),
    options: z.array(option).min(2).max(6),
    answer: z.string(),
  }),
  z.object({
    ...itemBase,
    type: z.literal("number"),
    answer: z.number(),
    unit: z.string().optional(),
  }),
  z.object({
    ...itemBase,
    type: z.literal("order"),
    /** Tiles shown shuffled; the child taps them into order. */
    tiles: z.array(option).min(2).max(7),
    answer: z.array(z.string()).min(2),
  }),
]);
export type Item = z.infer<typeof itemSchema>;

export const levelSchema = z.object({
  level: z.number().int().min(1).max(4),
  label: z.string(),
  items: z.array(itemSchema).min(2),
});

export const activitySchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    locale: z.string().default("en"),
    status: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED"]).default("IN_REVIEW"),
    ageBand: ageBandEnum,
    subject: z.enum(["maths", "reading"]),
    topic: z.string().min(2),
    subtopic: z.string().min(2),
    objective: z.string().regex(/^[A-Z]{2}\.[A-Z0-9.]+$/),
    title: z.string().min(3).max(60),
    pathOrder: z.number().int().min(1),
    estimatedMinutes: z.number().int().min(1).max(20),
    isFree: z.boolean().default(false),
    learn: z.object({
      /** Short, child-friendly explanation shown before practice. */
      text: z.string().min(20).max(400),
      say: z.string().optional(),
      visual: visualSchema.optional(),
      example: z.string().optional(),
    }),
    watch: watchSchema.optional(),
    misconceptions: z
      .array(z.object({ code: z.string().regex(/^[A-Z_]+$/), description: z.string(), remedy: z.string() }))
      .min(1),
    mastery: z.object({
      minAccuracy: z.number().min(0.5).max(1),
      minItems: z.number().int().min(3),
      atLevel: z.number().int().min(1).max(4),
    }),
    followUp: z.string().regex(/^[a-z0-9-]+$/).nullable(),
    levels: z.array(levelSchema).min(2).max(4),
    reviewNotes: z.string().optional(),
  })
  .superRefine((a, ctx) => {
    const ids = new Set<string>();
    const codes = new Set(a.misconceptions.map((m) => m.code));
    a.levels.forEach((lvl, li) => {
      if (lvl.level !== li + 1) ctx.addIssue({ code: "custom", message: `levels must be numbered 1..n in order`, path: ["levels", li] });
      lvl.items.forEach((item) => {
        if (ids.has(item.id)) ctx.addIssue({ code: "custom", message: `duplicate item id ${item.id}`, path: ["levels", li] });
        ids.add(item.id);
        if (item.type === "choice" && !item.options.some((o) => o.id === item.answer))
          ctx.addIssue({ code: "custom", message: `${item.id}: answer is not one of the options` });
        if (item.type === "order") {
          const tileIds = item.tiles.map((t) => t.id).sort().join();
          if ([...item.answer].sort().join() !== tileIds)
            ctx.addIssue({ code: "custom", message: `${item.id}: order answer must use every tile exactly once` });
        }
        for (const code of Object.values(item.misconceptions ?? {}))
          if (!codes.has(code)) ctx.addIssue({ code: "custom", message: `${item.id}: unknown misconception ${code}` });
      });
    });
    if (a.mastery.atLevel > a.levels.length)
      ctx.addIssue({ code: "custom", message: "mastery.atLevel is higher than the number of levels" });
  });

export type ActivityFile = z.infer<typeof activitySchema>;
/** What is stored in Activity.body (the parts not kept in their own columns). */
export type ActivityBody = Pick<ActivityFile, "learn" | "watch" | "misconceptions" | "mastery" | "followUp" | "levels">;

export const objectiveSchema = z.object({
  code: z.string().regex(/^[A-Z]{2}\.[A-Z0-9.]+$/),
  subject: z.enum(["maths", "reading"]),
  ageBand: ageBandEnum,
  topic: z.string(),
  subtopic: z.string(),
  title: z.string(),
  childTitle: z.string(),
  prerequisites: z.array(z.string()).default([]),
  masteryThreshold: z.number().min(0.5).max(1).default(0.8),
  curriculum: z.record(z.string(), z.string()).default({}),
});
export const objectivesFileSchema = z.object({ objectives: z.array(objectiveSchema).min(1) });
export type ObjectiveFile = z.infer<typeof objectiveSchema>;
