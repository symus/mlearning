import { expect, test } from "@playwright/test";
import { answerCorrectly, newFamilyWithChild } from "./helpers";

test("parent sees what the child is doing right now, pauses Arivupulla mid-lesson, then unlocks it", async ({ page, browser }) => {
  await newFamilyWithChild(page, { nickname: "Nia", age: 7, pin: "9753" });
  await page.goto("/play/exit");
  await page.getByLabel("Parent PIN").fill("9753");
  await page.getByRole("button", { name: "Open parent area" }).click();
  await page.getByRole("link", { name: "Progress" }).click();
  await page.waitForURL(/\/parent\/children\/[^/]+$/);
  const childPage = page.url();

  // Nia's own tablet: she logs in with her card details and starts a lesson.
  await page.getByRole("button", { name: "Make a login card" }).click();
  const loginId = (await page.getByTestId("card-login-id").first().textContent())!;
  const password = (await page.getByTestId("card-password").first().textContent())!;
  const tablet = await (await browser.newContext()).newPage();
  await tablet.goto("/login/kids");
  await tablet.getByLabel("Login ID").fill(loginId);
  await tablet.getByLabel("Password").fill(password);
  await tablet.getByRole("button", { name: /Let's go/ }).click();
  await expect(tablet.getByRole("heading", { name: "Your learning universe" })).toBeVisible();
  await tablet.goto("/play/activity/number-bonds-to-10");
  await tablet.getByRole("button", { name: /Let's go!/ }).click();
  await tablet.getByRole("button", { name: "Skip" }).click();
  await tablet.getByRole("button", { name: "Let's practise!" }).click();
  await answerCorrectly(tablet, "number-bonds-to-10");
  await tablet.getByRole("button", { name: /^Next →$/ }).click();

  // The parent sees it live.
  await page.goto(childPage);
  await expect(page.getByTestId("live-status")).toContainText("Playing now: Rocket Bonds to 10 · 1 of 6 questions answered");
  await page.goto("/parent");
  await expect(page.getByTestId("live-status")).toContainText("Playing now: Rocket Bonds to 10");

  // Pause for 30 minutes: the next answer isn't accepted and Nia gets a friendly break screen.
  await page.goto(childPage);
  await page.getByRole("button", { name: "🔒 30 minutes" }).click();
  await expect(page.getByText(/Paused until/)).toBeVisible();
  await answerCorrectly(tablet, "number-bonds-to-10");
  await expect(tablet.getByRole("heading", { name: /Time for a break!/ })).toBeVisible();
  await tablet.goto("/play");
  await expect(tablet.getByRole("heading", { name: /Arivupulla is resting/ })).toBeVisible();
  await tablet.goto("/play/activities");
  await expect(tablet.getByRole("heading", { name: /Arivupulla is resting/ })).toBeVisible();
  await page.goto("/parent");
  await expect(page.getByText("🔒 Paused")).toBeVisible();
  await expect(page.getByTestId("live-status")).toContainText("seeing the “resting” screen");

  // Unlock: Nia can carry on (her lesson was saved).
  await page.goto(childPage);
  await page.getByRole("button", { name: "🔓 Unlock now" }).click();
  await expect(page.getByRole("button", { name: "🔒 1 hour" })).toBeVisible();
  await tablet.goto("/play/activity/number-bonds-to-10");
  await expect(tablet.getByRole("button", { name: /Continue/ })).toBeVisible();
});
