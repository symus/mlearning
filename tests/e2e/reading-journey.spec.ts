import { expect, test } from "@playwright/test";

test("a child takes the placement check, sees the lesson map and passing a lesson unlocks the next", async ({ page }) => {
  // New family on the Free plan with a 5-year-old.
  const email = `journey-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Journey Parent");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Reading-path-77");
  await page.getByLabel("Parent PIN").fill("1357");
  await page.getByText(/I am 18 or over/).click();
  await page.getByText(/I accept the/).click();
  await page.getByRole("button", { name: "Create free account" }).click();
  await page.getByLabel("Nickname").fill("Asha");
  await page.getByLabel("Birth year").selectOption(String(new Date().getFullYear() - 5));
  await page.getByRole("button", { name: "Create profile" }).click();
  await page.getByRole("link", { name: /Let a child play/ }).click();
  await page.getByRole("button", { name: /Asha/ }).click();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Next →" }).click();
  await page.getByRole("button", { name: "Start exploring!" }).click();

  // Journey card on the universe -> choose "Find my level".
  await page.getByRole("link", { name: /Reading Journey/ }).click();
  await page.getByRole("link", { name: /Find my level/ }).click();
  await page.getByRole("button", { name: "I'm ready!" }).click();
  // Tier 1 correct (sun -> s, pig -> p), tier 2 wrong -> start at lesson 3.
  await page.getByRole("button", { name: "s", exact: true }).click();
  await page.getByRole("button", { name: "p", exact: true }).click();
  await page.getByRole("button", { name: /pan/ }).click();
  await page.getByRole("button", { name: /mop/ }).click();
  await expect(page.getByText("lesson 3")).toBeVisible();
  await page.getByRole("link", { name: /See my map/ }).click();

  // Map: lesson 3 is current, lessons 1-2 replayable, lesson 4 locked.
  await expect(page.getByRole("heading", { name: "Reading Journey" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Lesson 3: Sound Seeds: s a t p \(your next lesson\)/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Lesson 1:/ })).toBeVisible();
  await expect(page.getByLabel(/Lesson 4: .* \(locked\)/)).toBeVisible();

  // Play lesson 3 (free) and answer correctly using the known answers.
  await page.getByRole("link", { name: /Play now/ }).click();
  await page.getByRole("button", { name: "Skip" }).click(); // skip the song
  await page.getByRole("button", { name: "Let's practise!" }).click();
  const answers: Record<string, string> = {
    "Snake starts with sss": "s", "apple start with": "a", "tiger start with": "t", "pig start with": "p",
  };
  for (let step = 0; step < 12; step++) {
    if (await page.getByRole("heading", { name: "Adventure complete!" }).isVisible()) break;
    const next = page.getByRole("button", { name: /^Next →$/ });
    if (await next.isVisible()) { await next.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(400); continue; }
    const prompt = (await page.locator("section h2").first().innerText().catch(() => "")) ?? "";
    const key = Object.keys(answers).find((k) => prompt.includes(k));
    if (key) await page.getByRole("button", { name: answers[key], exact: true }).click({ timeout: 2000 }).catch(() => {});
    else if (prompt.includes("starts with s")) await page.getByRole("button", { name: /sun/ }).click({ timeout: 2000 }).catch(() => {});
    else if (prompt.includes("starts with t")) await page.getByRole("button", { name: /tent/ }).click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(500);
  }
  await expect(page.getByText(/Lesson 3 passed/)).toBeVisible();
  await page.getByRole("link", { name: "Back to my map" }).click();
  await expect(page.getByRole("link", { name: /Lesson 4: .*\(your next lesson\)/ })).toBeVisible();
});
