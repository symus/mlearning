import { expect, type Page } from "@playwright/test";

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
