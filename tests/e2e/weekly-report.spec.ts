import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
test.afterAll(() => db.$disconnect());

test("weekly report shows real learning, navigates weeks and is private to the family", async ({ page }) => {
  // Demo parent: Mia has a week of seeded learning history.
  await page.goto("/login");
  await page.getByLabel("Email").fill("parent@example.com");
  await page.getByLabel("Password").fill("Wonder-demo-2026");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.getByRole("link", { name: "Weekly report" }).first().click();
  await expect(page.getByText("Weekly learning report")).toBeVisible();

  // Look back two weeks: one of the last two weeks has the seeded history.
  const hasData = async () => (await page.getByText("No learning recorded this week").count()) === 0;
  let found = await hasData();
  if (!found) {
    await page.getByRole("link", { name: "← Previous week" }).click();
    await expect(page).toHaveURL(/week=\d{4}-\d{2}-\d{2}/);
    found = await hasData();
  }
  expect(found).toBe(true);
  await expect(page.getByRole("heading", { name: /What Mia learned/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "By subject" })).toBeVisible();
  await expect(page.getByText(/not a test score and does not measure intelligence/)).toBeVisible();

  // Another family cannot open Mia's report.
  const mia = await db.childProfile.findFirstOrThrow({ where: { nickname: "Mia", parent: { email: "parent@example.com" } } });
  await page.getByRole("button", { name: "Log out" }).click();
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("Wonder-admin-2026");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/parent/);
  await page.goto(`/parent/children/${mia.id}/report`);
  await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
});
