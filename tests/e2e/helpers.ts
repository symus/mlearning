import { expect, type Browser, type Page } from "@playwright/test";

/** Sign up a new parent, add one child of the given age, hand over to the child and finish onboarding. */
export async function newFamilyWithChild(page: Page, opts: { nickname: string; age: number; pin?: string }) {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Test Parent");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Learning-path-88");
  await page.getByLabel("Parent PIN").fill(opts.pin ?? "2468");
  await page.getByText(/I am 18 or over/).click();
  await page.getByText(/I accept the/).click();
  await page.getByRole("button", { name: "Create free account" }).click();
  await page.getByLabel("Nickname").fill(opts.nickname);
  await page.getByLabel("Birth year").selectOption(String(new Date().getFullYear() - opts.age));
  await page.getByRole("button", { name: "Create profile" }).click();
  await expect(page.getByRole("heading", { name: opts.nickname })).toBeVisible();
  await page.getByRole("link", { name: /Let a child play/ }).click();
  await page.getByRole("button", { name: new RegExp(opts.nickname) }).click();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Next →" }).click();
  // The page changes instantly after this click; wait for the universe rather than the click itself.
  await Promise.all([page.waitForURL(/\/play\?welcome=1/), page.getByRole("button", { name: "Start exploring!" }).click({ timeout: 5000 }).catch(() => {})]);
  await expect(page.getByRole("heading", { name: "Your learning universe" })).toBeVisible();
  return { email };
}

/** Answer whatever item is showing (answers are hidden from the browser, so this just picks something). */
export async function answerAny(page: Page) {
  const quick = { timeout: 2000 };
  if (await page.getByLabel("Your answer").isVisible()) {
    await page.getByLabel("Your answer").fill("5", quick);
    await page.getByRole("button", { name: "Check" }).click(quick);
  } else if (await page.getByText("Tap the pieces in order").isVisible()) {
    const tiles = page.locator("section .flex-wrap.gap-2 > button");
    while ((await tiles.count()) > 0) await tiles.first().click(quick);
    await page.getByRole("button", { name: "Check" }).click(quick);
  } else {
    await page.locator("section .grid > button").first().click(quick);
  }
}

/** Finish the current item: answer up to twice until "Next →" appears. */
export async function finishItem(page: Page) {
  for (let i = 0; i < 3; i++) {
    if (await page.getByRole("button", { name: /^Next →$/ }).isVisible()) return;
    await answerAny(page).catch(() => {});
    await page.waitForTimeout(500);
  }
}

import { loadContent } from "../../src/lib/content/load";
import type { Item } from "../../src/lib/content/schema";

const library = loadContent();

/** Find the item on screen by its prompt and answer it correctly (test-only: uses the content files). */
export async function answerCorrectly(page: Page, activitySlug: string) {
  const activity = library.activities.find((a) => a.slug === activitySlug);
  if (!activity) throw new Error(`No activity ${activitySlug}`);
  const prompt = (await page.locator("section h2").first().innerText()).trim();
  const item = activity.levels.flatMap((l) => l.items).find((i: Item) => i.prompt.trim() === prompt);
  if (!item) throw new Error(`No item with prompt "${prompt}"`);
  if (item.type === "choice") {
    const label = item.options.find((o) => o.id === item.answer)!.label;
    await page.locator("section .grid > button").filter({ hasText: label }).first().click();
  } else if (item.type === "number") {
    await page.getByLabel("Your answer").fill(String(item.answer));
    await page.getByRole("button", { name: "Check" }).click();
  } else {
    for (const id of item.answer) {
      const label = item.tiles.find((t) => t.id === id)!.label;
      await page.locator("section .flex-wrap.gap-2 > button").filter({ hasText: label }).first().click();
    }
    await page.getByRole("button", { name: "Check" }).click();
  }
}

/** Play a whole activity correctly from the practise screen to the summary. */
export async function passActivity(page: Page, activitySlug: string) {
  for (let step = 0; step < 12; step++) {
    if (await page.getByRole("heading", { name: "Adventure complete!" }).isVisible()) return;
    const next = page.getByRole("button", { name: /^Next →$/ });
    if (await next.isVisible()) {
      await next.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(450);
      continue;
    }
    await answerCorrectly(page, activitySlug);
    await expect(next).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Adventure complete!" })).toBeVisible();
}

/** A student types their card details on a new device and finishes the first-time welcome. */
export async function studentLogsIn(browser: Browser, loginId: string, password: string) {
  const kid = await (await browser.newContext()).newPage();
  await kid.goto("/login/kids");
  await kid.getByLabel("Login ID").fill(loginId);
  await kid.getByLabel("Password").fill(password);
  await kid.getByRole("button", { name: /Let's go/ }).click();
  for (let i = 0; i < 3; i++) await kid.getByRole("button", { name: "Next →" }).click();
  await Promise.all([kid.waitForURL(/\/play\?welcome=1/), kid.getByRole("button", { name: "Start exploring!" }).click({ timeout: 5000 }).catch(() => {})]);
  await expect(kid.getByRole("heading", { name: "Your learning universe" })).toBeVisible();
  return kid;
}

/** Sign up a new teacher (lands on "My classes"). */
export async function newTeacher(page: Page, name = "Ms Patel") {
  await page.goto("/signup/teacher");
  await page.getByLabel("Your name").fill(name);
  await page.getByLabel("School name").fill("Hillside Primary");
  await page.getByLabel("Email").fill(`teacher-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`);
  await page.getByLabel("Password").fill("Teaching-path-88");
  await page.getByText(/My school allows me/).click();
  await page.getByText(/I accept the/).click();
  await page.getByRole("button", { name: "Create teacher account" }).click();
  await expect(page.getByRole("heading", { name: "My classes" })).toBeVisible();
}
