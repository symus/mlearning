import { expect, test } from "@playwright/test";
import { newFamilyWithChild, passActivity } from "./helpers";

test("Science Lab, Logic Island and Coding City have real, playable lessons", async ({ page }) => {
  await newFamilyWithChild(page, { nickname: "Noor", age: 7 });

  for (const [world, activity, title] of [
    ["science-lab", "how-plants-grow", "How Plants Grow"],
    ["logic-island", "odd-one-out", "Odd One Out"],
    ["coding-city", "program-the-robot", "Program the Robot"],
  ] as const) {
    await page.goto(`/play/world/${world}`);
    await page.getByRole("link", { name: new RegExp(title) }).click();
    await page.getByRole("button", { name: /Let's go!/ }).click();
    await page.getByRole("button", { name: "Let's practise!" }).click();
    await passActivity(page, activity);
    await expect(page.getByRole("img", { name: "3 out of 3 stars" })).toBeVisible();
  }

  // The child's progress shows up in the parent area for the new subjects.
  await page.goto("/play/exit");
  await page.getByLabel("Parent PIN").fill("2468");
  await page.getByRole("button", { name: "Open parent area" }).click();
  await page.getByRole("link", { name: "Progress" }).click();
  for (const subject of ["Science", "Logic", "Coding"]) await expect(page.getByRole("heading", { name: new RegExp(subject) }).first()).toBeVisible();
});
