/**
 * Seed: content (auto-published for local dev), prices, a demo family with real learning history,
 * and an admin/reviewer account. Safe to run repeatedly.
 */
import { PrismaClient, type AgeBand, type PlanCode } from "@prisma/client";
import bcrypt from "bcryptjs";
import { importContent } from "../scripts/content";
import { updateMastery, type ItemResult } from "../src/lib/learning/adaptive";
import type { ActivityBody } from "../src/lib/content/schema";

const db = new PrismaClient();

const PRICES: Array<{ plan: PlanCode; country: string; currency: string; month: number; year: number }> = [
  { plan: "PREMIUM", country: "GB", currency: "GBP", month: 799, year: 6999 },
  { plan: "FAMILY", country: "GB", currency: "GBP", month: 1199, year: 9999 },
  { plan: "PREMIUM", country: "PL", currency: "PLN", month: 3499, year: 29999 },
  { plan: "FAMILY", country: "PL", currency: "PLN", month: 4999, year: 42999 },
  { plan: "PREMIUM", country: "EU", currency: "EUR", month: 899, year: 7999 },
  { plan: "FAMILY", country: "EU", currency: "EUR", month: 1299, year: 10999 },
  { plan: "PREMIUM", country: "IN", currency: "INR", month: 39900, year: 349900 },
  { plan: "FAMILY", country: "IN", currency: "INR", month: 59900, year: 499900 },
  { plan: "PREMIUM", country: "US", currency: "USD", month: 899, year: 7999 },
  { plan: "FAMILY", country: "US", currency: "USD", month: 1299, year: 10999 },
  { plan: "PREMIUM", country: "AU", currency: "AUD", month: 1299, year: 11499 },
  { plan: "FAMILY", country: "AU", currency: "AUD", month: 1899, year: 16999 },
  { plan: "PREMIUM", country: "*", currency: "USD", month: 899, year: 7999 },
  { plan: "FAMILY", country: "*", currency: "USD", month: 1299, year: 10999 },
];

async function seedPrices() {
  for (const p of PRICES) {
    for (const [interval, amountMinor] of [["month", p.month], ["year", p.year]] as const) {
      await db.price.upsert({
        where: { plan_country_interval: { plan: p.plan, country: p.country, interval } },
        create: { plan: p.plan, country: p.country, currency: p.currency, interval, amountMinor },
        update: { currency: p.currency, amountMinor },
      });
    }
  }
}

async function upsertUser(email: string, password: string, displayName: string, role: "PARENT" | "ADMIN") {
  const passwordHash = await bcrypt.hash(password, 12);
  const parentPinHash = await bcrypt.hash("1234", 12);
  const user = await db.user.upsert({
    where: { email },
    create: { email, passwordHash, displayName, role, country: "GB", parentPinHash },
    update: { role },
  });
  await db.subscription.upsert({ where: { userId: user.id }, create: { userId: user.id, plan: "FAMILY" }, update: {} });
  if ((await db.consentRecord.count({ where: { userId: user.id } })) === 0) {
    await db.consentRecord.createMany({
      data: (["TERMS", "PRIVACY", "PARENTAL_CONSENT"] as const).map((type) => ({ userId: user.id, type, version: "2026-11" })),
    });
  }
  return user;
}

/** Simulate a child's realistic history: mostly right, some struggle, using the real mastery engine. */
async function simulateHistory(childId: string, ageBand: AgeBand, profile: { skill: number; days: number }) {
  if ((await db.attempt.count({ where: { childId } })) > 0) return;
  const activities = await db.activity.findMany({ where: { ageBand, status: "PUBLISHED" }, include: { objective: true }, orderBy: [{ subjectSlug: "asc" }, { pathOrder: "asc" }] });
  let rng = 42;
  const rand = () => ((rng = (rng * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  const now = Date.now();
  const toPlay = activities.filter((a) => a.pathOrder <= 4);
  for (let i = 0; i < toPlay.length; i++) {
    const a = toPlay[i];
    const body = a.body as unknown as ActivityBody;
    const daysAgo = Math.max(0, profile.days - Math.floor((i / toPlay.length) * profile.days));
    const startedAt = new Date(now - daysAgo * 86_400_000 - 3_600_000 * (17 - (i % 3)));
    const results: (ItemResult & { itemId: string; misconception?: string })[] = [];
    for (const level of body.levels) {
      for (const item of level.items) {
        const correct = rand() < profile.skill - (level.level - 1) * 0.05 - (a.subjectSlug === "maths" && a.pathOrder === 3 ? 0.35 : 0);
        const wrongKey = Object.keys(item.misconceptions ?? {})[0];
        results.push({ itemId: item.id, correct, hintsUsed: correct ? (rand() < 0.2 ? 1 : 0) : 1, level: level.level, misconception: correct ? undefined : item.misconceptions?.[wrongKey ?? ""] });
      }
    }
    const correctCount = results.filter((r) => r.correct).length;
    await db.attempt.create({
      data: {
        childId, activityId: a.id, startedAt, completedAt: new Date(startedAt.getTime() + a.estimatedMinutes * 60_000),
        startLevel: 1, endLevel: body.levels.length, correctCount, totalCount: results.length, hintsUsed: results.reduce((n, r) => n + r.hintsUsed, 0),
        durationSec: a.estimatedMinutes * 60,
        responses: { create: results.map((r) => ({ itemId: r.itemId, level: r.level, answer: "seed", isCorrect: r.correct, hintsUsed: r.hintsUsed, misconception: r.misconception, timeMs: 9000, createdAt: startedAt })) },
      },
    });
    const prev = await db.objectiveMastery.findUnique({ where: { childId_objectiveCode: { childId, objectiveCode: a.objectiveCode } } });
    const next = updateMastery(prev, results, body.mastery, a.objective.masteryThreshold, startedAt);
    const misconceptions = results.reduce<Record<string, number>>((m, r) => (r.misconception ? { ...m, [r.misconception]: (m[r.misconception] ?? 0) + 1 } : m), {});
    const { sessionAccuracy: _s, ...state } = next;
    void _s;
    await db.objectiveMastery.upsert({
      where: { childId_objectiveCode: { childId, objectiveCode: a.objectiveCode } },
      create: { childId, objectiveCode: a.objectiveCode, ...state, lastPracticed: startedAt, misconceptions },
      update: { ...state, lastPracticed: startedAt, misconceptions },
    });
  }
}

async function main() {
  console.log("Importing content…");
  const r = await importContent(db, { publish: true });
  console.log(`  ${r.objectives} objectives, ${r.activities} activities`);
  await seedPrices();

  const parent = await upsertUser(process.env.SEED_DEMO_EMAIL ?? "parent@example.com", process.env.SEED_DEMO_PASSWORD ?? "Wonder-demo-2026", "Sam Taylor", "PARENT");
  await upsertUser(process.env.SEED_ADMIN_EMAIL ?? "admin@example.com", process.env.SEED_ADMIN_PASSWORD ?? "Wonder-admin-2026", "Content Admin", "ADMIN");

  const year = new Date().getFullYear();
  const kids = [
    { nickname: "Mia", birthYear: year - 7, ageBand: "YOUNG_THINKERS" as const, avatar: { character: "fox", colour: "coral" }, interests: ["animals", "space"], skill: 0.85, days: 6 },
    { nickname: "Leo", birthYear: year - 4, ageBand: "LITTLE_EXPLORERS" as const, avatar: { character: "dragon", colour: "leaf" }, interests: ["dinosaurs"], skill: 0.75, days: 4 },
  ];
  for (const k of kids) {
    let child = await db.childProfile.findFirst({ where: { parentId: parent.id, nickname: k.nickname } });
    if (!child) {
      child = await db.childProfile.create({
        data: { parentId: parent.id, nickname: k.nickname, birthYear: k.birthYear, ageBand: k.ageBand, avatar: k.avatar, interests: k.interests, onboardedAt: new Date() },
      });
    }
    await simulateHistory(child.id, k.ageBand, k);
    await db.childAchievement.createMany({ data: ["FIRST_STEP", "EXPLORER_5", "HINT_HERO"].map((code) => ({ childId: child.id, code })), skipDuplicates: true });
  }
  console.log("✓ Seed complete. Demo parent: parent@example.com / Wonder-demo-2026 (PIN 1234)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
