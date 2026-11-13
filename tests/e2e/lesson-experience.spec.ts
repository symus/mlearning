import { expect, test } from "@playwright/test";
import { finishItem, newFamilyWithChild } from "./helpers";

test("lesson intro, locked lessons, resume and celebration", async ({ page }) => {
  await newFamilyWithChild(page, { nickname: "Kai", age: 7 });

  // A journey lesson that isn't unlocked yet can't be opened by URL.
  await page.goto("/play/journey/reading");
  await page.getByRole("button", { name: /Start at the beginning/ }).click();
  await page.goto("/play/activity/vowel-teams?journey=reading");
  await expect(page.getByRole("heading", { name: /still locked/ })).toBeVisible();

  // Muchi introduces the lesson and its learning objective.
  await page.goto("/play/activity/number-bonds-to-10");
  await expect(page.getByText("Hi Kai! I'm Muchi.")).toBeVisible();
  await expect(page.getByText("Today you will learn")).toBeVisible();
  await expect(page.getByText("Bonds to 10").first()).toBeVisible();
  await page.getByRole("button", { name: /Let's go!/ }).click();
  await page.getByRole("button", { name: "Skip" }).click();
  await page.getByRole("button", { name: "Let's practise!" }).click();

  // Answer two items, then leave mid-lesson.
  for (let i = 0; i < 2; i++) {
    await finishItem(page);
    await page.getByRole("button", { name: /^Next →$/ }).click();
    await page.waitForTimeout(400);
  }
  await page.goto("/play");

  // Coming back offers to continue where we stopped.
  await page.goto("/play/activity/number-bonds-to-10");
  await expect(page.getByText(/Welcome back, Kai/)).toBeVisible();
  await page.getByRole("button", { name: /Continue \(2 done\)/ }).click();
  for (let i = 0; i < 8; i++) {
    if (await page.getByRole("heading", { name: "Adventure complete!" }).isVisible()) break;
    await finishItem(page);
    await page.getByRole("button", { name: /^Next →$/ }).click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(500);
  }

  // Celebration: stars and score of a full round (6 items for ages 6-8, including the 2 from before).
  await expect(page.getByRole("heading", { name: "Adventure complete!" })).toBeVisible();
  await expect(page.getByRole("img", { name: /out of 3 stars/ })).toBeVisible();
  await expect(page.getByText(/of 6 correct/)).toBeVisible();
});
