import { expect, test } from "@playwright/test";
import { newFamilyWithChild } from "./helpers";

test("All activities page: filter by world and status, search, and open an activity", async ({ page }) => {
  await newFamilyWithChild(page, { nickname: "Lina", age: 10 });
  await page.getByRole("link", { name: "📚 All activities" }).click();
  await expect(page.getByRole("heading", { name: "All activities" })).toBeVisible();

  // Filter to Coding City: only coding activities.
  await page.getByRole("button", { name: "Coding City" }).click();
  await expect(page.getByRole("link", { name: /If This, Then That, Coding City/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Equivalent|Same Amount/ })).toHaveCount(0);

  // Search across all worlds.
  await page.getByRole("button", { name: "🌌 All worlds" }).click();
  await page.getByLabel("Search activities").fill("fraction");
  await expect(page.getByRole("link", { name: /Same Amount, Different Names/ })).toBeVisible();

  // Nothing matches -> friendly empty state with reset.
  await page.getByLabel("Search activities").fill("zzzz");
  await expect(page.getByText(/No activities match/)).toBeVisible();
  await page.getByRole("button", { name: "Show everything" }).click();

  // "Done" filter is empty for a brand-new child.
  await page.getByRole("button", { name: "⭐ Done" }).click();
  await expect(page.getByText(/No activities match/)).toBeVisible();
  await page.getByRole("button", { name: "All", exact: true }).click();

  // Open an activity from the library.
  await page.getByRole("link", { name: /Forces in Action/ }).click();
  await expect(page.getByText("Today you will learn")).toBeVisible();
});
