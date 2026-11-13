import { expect, test } from "@playwright/test";
import { newFamilyWithChild } from "./helpers";

test("illustrated maps: move between maps, open lessons and check the treasure chest", async ({ page }) => {
  await newFamilyWithChild(page, { nickname: "Ravi", age: 5 });

  // Reading Journey: 4 parts = 4 maps.
  await page.goto("/play/journey/reading");
  await page.getByRole("button", { name: /Start at the beginning/ }).click();
  await expect(page.getByText("Map 1", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Lesson 1: First Sounds \(your next lesson\)/ })).toBeVisible();

  await page.getByRole("link", { name: "Next map" }).click();
  await expect(page).toHaveURL(/map=2/);
  await expect(page.getByText("Map 2", { exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: /Lesson 7: .*\((locked|Ask a grown-up)\)/ })).toBeVisible();
  await page.getByRole("link", { name: "Previous map" }).click();
  await expect(page.getByText("Map 1", { exact: true })).toBeVisible();

  // The chest stays shut until every lesson on the map is done.
  await page.getByRole("button", { name: /Treasure chest: finish every lesson/ }).click();
  await expect(page.getByText(/Finish every lesson on this map to open the treasure/)).toBeVisible();

  // Every world uses the same maps.
  await page.goto("/play/world/logic-island");
  await expect(page.getByText("Map 1", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: /Lesson 1: Same or Different\?/ }).click();
  await expect(page.getByText("Today you will learn")).toBeVisible();
  await page.getByRole("link", { name: "Back to the world map" }).click();
  await expect(page).toHaveURL(/\/play\/world\/logic-island/);
});
