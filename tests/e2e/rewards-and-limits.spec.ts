import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { newFamilyWithChild, passActivity } from "./helpers";

const db = new PrismaClient();
test.afterAll(() => db.$disconnect());

test("passing a lesson earns a sticker, and the parent's daily limit pauses new lessons", async ({ page }) => {
  const { email } = await newFamilyWithChild(page, { nickname: "Zara", age: 7, pin: "4321" });

  // Pass a lesson: 3 stars, gift box, sticker in the Sticker Book.
  await page.goto("/play/activity/number-bonds-to-10");
  await page.getByRole("button", { name: /Let's go!/ }).click();
  await page.getByRole("button", { name: "Skip" }).click();
  await page.getByRole("button", { name: "Let's practise!" }).click();
  await passActivity(page, "number-bonds-to-10");
  await expect(page.getByRole("img", { name: "3 out of 3 stars" })).toBeVisible();
  await page.getByRole("button", { name: "Open your sticker gift" }).click();
  await expect(page.getByText("Added to your Sticker Book!")).toBeVisible();
  await page.goto("/play/stickers");
  await expect(page.getByText(/1 of \d+ stickers collected/)).toBeVisible();

  // Parent sets a 20-minute daily limit.
  await page.goto("/play/exit");
  await page.getByLabel("Parent PIN").fill("4321");
  await page.getByRole("button", { name: "Open parent area" }).click();
  await page.getByRole("link", { name: "Progress" }).click();
  await page.getByLabel("Daily time limit").selectOption("20");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  // Simulate 20 minutes of learning today (test fixture), then hand back to the child.
  const parent = await db.user.findUniqueOrThrow({ where: { email }, include: { children: true } });
  const child = parent.children[0];
  const activity = await db.activity.findFirstOrThrow({ where: { slug: "rhyme-time" } });
  await db.attempt.create({ data: { childId: child.id, activityId: activity.id, startLevel: 1, completedAt: new Date(), durationSec: 20 * 60, totalCount: 4, correctCount: 4 } });

  await page.getByRole("link", { name: /Let a child play/ }).click();
  await page.getByRole("button", { name: /Zara/ }).click();
  await expect(page.getByText(/That's your learning time for today/)).toBeVisible();
  await page.goto("/play/activity/tens-and-ones");
  await expect(page.getByRole("heading", { name: /That's all for today, Zara/ })).toBeVisible();
  // The Sticker Book is still available after the limit.
  await page.goto("/play/stickers");
  await expect(page.getByRole("heading", { name: "My Sticker Book" })).toBeVisible();
});

test("stickers from Reading Journey lessons of a younger age group show in the Sticker Book and All activities", async ({ page }) => {
  await newFamilyWithChild(page, { nickname: "Omar", age: 7 });

  // "First Sounds" is Reading Journey lesson 1, written for ages 3–5; Omar (7) plays it from his journey.
  await page.goto("/play/activity/first-sounds");
  await page.getByRole("button", { name: /Let's go!/ }).click();
  const skip = page.getByRole("button", { name: "Skip" });
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await page.getByRole("button", { name: "Let's practise!" }).click();
  await passActivity(page, "first-sounds");
  await page.getByRole("button", { name: "Open your sticker gift" }).click();
  await expect(page.getByText("Added to your Sticker Book!")).toBeVisible();

  await page.goto("/play/stickers");
  const summary = await page.getByText(/\d+ of \d+ stickers collected/).textContent();
  const [, got, total] = summary!.match(/(\d+) of (\d+)/)!.map(Number);
  expect(got).toBe(1);
  await expect(page.getByRole("link", { name: /sticker, from First Sounds/ })).toBeVisible();
  // Every sticker in the book is a real, listed sticker: one tile per activity.
  await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(total);

  // The All activities page lists the same lesson.
  await page.goto("/play/activities");
  await page.getByRole("searchbox").fill("First Sounds");
  await expect(page.getByRole("link", { name: /First Sounds/ }).first()).toBeVisible();
});
