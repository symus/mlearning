import { expect, test, type Page } from "@playwright/test";

/** Answer items until the activity summary appears (answers are unknown to the browser by design). */
async function playThrough(page: Page) {
  for (let step = 0; step < 40; step++) {
    if (await page.getByRole("heading", { name: "Adventure complete!" }).isVisible()) return;
    const next = page.getByRole("button", { name: /^Next →$/ });
    const quick = { timeout: 2000 };
    try {
      if (await next.isVisible()) {
        await next.click(quick);
      } else if (await page.getByLabel("Your answer").isVisible()) {
        await page.getByLabel("Your answer").fill("5", quick);
        await page.getByRole("button", { name: "Check" }).click(quick);
      } else if (await page.getByText("Tap the pieces in order").isVisible()) {
        const tiles = page.locator("section .flex-wrap.gap-2 > button");
        while ((await tiles.count()) > 0) await tiles.first().click(quick);
        await page.getByRole("button", { name: "Check" }).click(quick);
      } else {
        await page.locator("section .grid > button").first().click(quick);
      }
    } catch {
      // The card was mid-animation; look again.
    }
    await page.waitForTimeout(500);
  }
  throw new Error("Activity did not finish");
}

test("a parent signs up, adds a child, the child learns, and progress appears", async ({ page }) => {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;

  // Landing → signup (with validation)
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Learning that feels like/ })).toBeVisible();
  await page.getByRole("link", { name: "Start free" }).first().click();
  await page.getByRole("button", { name: "Create free account" }).click();
  await expect(page.getByText("Please enter your name.")).toBeVisible();

  await page.getByLabel("Your name").fill("Test Parent");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Sunny-garden-42");
  await page.getByLabel("Parent PIN").fill("2468");
  await page.getByLabel("Country").selectOption("PL");
  await page.getByText(/I am 18 or over/).click();
  await page.getByText(/I accept the/).click();
  await page.getByRole("button", { name: "Create free account" }).click();

  // Add a child (7 years old -> Young Thinkers)
  await expect(page.getByRole("heading", { name: "Add a child" })).toBeVisible();
  await page.getByLabel("Nickname").fill("Ola");
  await page.getByLabel("Birth year").selectOption(String(new Date().getFullYear() - 7));
  await expect(page.getByText(/Young Thinkers \(6–8\)/)).toBeVisible();
  await page.getByText("Space").click();
  await page.getByRole("button", { name: "Create profile" }).click();
  await expect(page.getByRole("heading", { name: "Ola" })).toBeVisible();

  // Hand over to the child
  await page.getByRole("link", { name: /Let a child play/ }).click();
  await page.getByRole("button", { name: /Ola/ }).click();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Next →" }).click();
  await page.getByRole("button", { name: "Start exploring!" }).click();
  await expect(page.getByRole("heading", { name: "Your learning universe" })).toBeVisible();

  // Child mode blocks the parent area
  await page.goto("/parent");
  await expect(page.getByRole("heading", { name: "Grown-ups only" })).toBeVisible();
  await page.getByRole("link", { name: "← Back to playing" }).click();

  // Play a free maths activity
  await page.getByRole("link", { name: /Number Nebula/ }).click();
  await page.getByRole("link", { name: /Rocket Bonds to 10/ }).click();
  await page.getByRole("button", { name: "Let's practise!" }).click();
  await playThrough(page);
  await expect(page.getByText(/\d+ \/ \d+/)).toBeVisible();

  // Locked content shows no price to children
  await page.getByRole("link", { name: "Back to the map" }).click();
  await expect(page.getByText("Ask a grown-up").first()).toBeVisible();

  // Exit with PIN (wrong first)
  await page.getByRole("link", { name: "Grown-ups" }).click();
  await page.getByLabel("Parent PIN").fill("1111");
  await page.getByRole("button", { name: "Open parent area" }).click();
  await expect(page.getByText("That PIN isn't right")).toBeVisible();
  await page.getByLabel("Parent PIN").fill("2468");
  await page.getByRole("button", { name: "Open parent area" }).click();

  // Parent sees real progress
  await expect(page.getByRole("heading", { name: "Your family's learning" })).toBeVisible();
  await expect(page.getByText("Ola")).toBeVisible();
  await page.getByRole("link", { name: "Progress" }).click();
  await expect(page.getByText("Rocket Bonds to 10")).toBeVisible();
  // The child guessed "5" everywhere, so the skill is correctly flagged as needing attention.
  await expect(page.locator("#attention").getByText("Know pairs of numbers that make 10")).toBeVisible();
});

test("the demo parent sees seeded progress and admin pages are protected", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("parent@example.com");
  await page.getByLabel("Password").fill("wrong-password1");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("don't match")).toBeVisible();
  await page.getByLabel("Password").fill("Wonder-demo-2026");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Mia" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Leo" })).toBeVisible();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/parent$/);
});
