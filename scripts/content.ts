/**
 * Content CLI
 *   npm run content:validate            -> check every file against the content contract
 *   npm run content:import              -> import into the DB (new/changed items land IN_REVIEW)
 *   npm run content:import -- --publish -> DEV ONLY: auto-publish everything (used by seed)
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import { loadContent } from "../src/lib/content/load";
import { WORLDS } from "../src/lib/worlds";

const CURRICULA = [
  { code: "uk-nc", name: "England National Curriculum & EYFS", country: "GB" },
  { code: "intl", name: "International (general expectations)", country: "*" },
];

export async function importContent(db: PrismaClient, opts: { publish: boolean }) {
  const lib = loadContent();
  if (lib.errors.length) throw new Error("Content is invalid:\n- " + lib.errors.join("\n- "));

  for (const c of CURRICULA) await db.curriculum.upsert({ where: { code: c.code }, create: c, update: c });

  for (const w of WORLDS) {
    if (!["maths", "reading"].includes(w.subject)) continue;
    const name = w.subject === "maths" ? "Mathematics" : "Reading & Phonics";
    await db.subject.upsert({ where: { slug: w.subject }, create: { slug: w.subject, name, world: w.slug }, update: { name, world: w.slug } });
  }

  for (const o of lib.objectives) {
    const data = {
      subjectSlug: o.subject, ageBand: o.ageBand, topic: o.topic, subtopic: o.subtopic, title: o.title,
      childTitle: o.childTitle, prerequisites: o.prerequisites, masteryThreshold: o.masteryThreshold,
    };
    await db.objective.upsert({ where: { code: o.code }, create: { code: o.code, ...data }, update: data });
    for (const [curriculumCode, reference] of Object.entries(o.curriculum)) {
      await db.curriculumMapping.upsert({
        where: { curriculumCode_objectiveCode: { curriculumCode, objectiveCode: o.code } },
        create: { curriculumCode, objectiveCode: o.code, reference },
        update: { reference },
      });
    }
  }

  let created = 0, changed = 0, unchanged = 0;
  for (const a of lib.activities) {
    const body = { learn: a.learn, watch: a.watch, misconceptions: a.misconceptions, mastery: a.mastery, followUp: a.followUp, levels: a.levels } as unknown as Prisma.InputJsonValue;
    const fields = {
      ageBand: a.ageBand, subjectSlug: a.subject, objectiveCode: a.objective, topic: a.topic, subtopic: a.subtopic,
      title: a.title, pathOrder: a.pathOrder, estimatedMinutes: a.estimatedMinutes, isFree: a.isFree, body, contentHash: a.hash,
    };
    const existing = await db.activity.findUnique({ where: { slug_locale: { slug: a.slug, locale: a.locale } } });
    const status = opts.publish ? "PUBLISHED" : a.status === "DRAFT" ? "DRAFT" : "IN_REVIEW";
    if (!existing) {
      await db.activity.create({ data: { slug: a.slug, locale: a.locale, status, ...fields } });
      created++;
    } else if (existing.contentHash !== a.hash) {
      // Any edit re-enters review; published learners keep the old version until approved in Phase 4 versioning.
      await db.activity.update({ where: { id: existing.id }, data: { ...fields, status, version: existing.version + 1, reviewedAt: null, reviewedById: null } });
      changed++;
    } else unchanged++;
  }
  for (const j of lib.journeys) {
    const { hash, ...body } = j;
    const data = { title: j.title, body: body as unknown as Prisma.InputJsonValue, contentHash: hash };
    await db.journey.upsert({ where: { slug: j.slug }, create: { slug: j.slug, ...data }, update: data });
  }

  return { journeys: lib.journeys.length, objectives: lib.objectives.length, activities: lib.activities.length, created, changed, unchanged };
}

async function main() {
  const cmd = process.argv[2];
  if (cmd === "validate") {
    const lib = loadContent();
    const items = lib.activities.reduce((n, a) => n + a.levels.reduce((m, l) => m + l.items.length, 0), 0);
    if (lib.errors.length) {
      console.error(`✗ ${lib.errors.length} problem(s):\n- ` + lib.errors.join("\n- "));
      process.exit(1);
    }
    console.log(`✓ ${lib.objectives.length} objectives, ${lib.activities.length} activities, ${items} items, ${lib.journeys.length} journey(s) are valid.`);
    return;
  }
  if (cmd === "import") {
    const db = new PrismaClient();
    try {
      const r = await importContent(db, { publish: process.argv.includes("--publish") });
      console.log(`✓ Imported: ${r.created} new, ${r.changed} changed (${process.argv.includes("--publish") ? "auto-published" : "back to review"}), ${r.unchanged} unchanged.`);
    } finally {
      await db.$disconnect();
    }
    return;
  }
  console.log("Usage: tsx scripts/content.ts <validate|import> [--publish]");
}

if (process.argv[1]?.endsWith("content.ts")) main().catch((e) => { console.error(e); process.exit(1); });
