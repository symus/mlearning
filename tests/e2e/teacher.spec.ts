import { expect, test, type Browser, type Page } from "@playwright/test";
import { passActivity } from "./helpers";

async function newTeacher(page: Page, name = "Ms Patel") {
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

/** A student types their card details and finishes the first-time welcome. */
async function studentLogsIn(browser: Browser, loginId: string, password: string) {
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

test("teacher: class, students, login cards, assignment, teacher-only ranking", async ({ page, browser }) => {
  await newTeacher(page);
  // Teachers have their own area, never the family one.
  await page.goto("/parent");
  await expect(page).toHaveURL(/\/teacher$/);

  // Create a class and add students by first name (commas or new lines).
  await page.getByLabel("Class name").fill("Year 2 Robins");
  await page.getByLabel("Age group").selectOption("YOUNG_THINKERS");
  await page.getByRole("button", { name: "Create class" }).click();
  await expect(page.getByRole("heading", { name: "Year 2 Robins" })).toBeVisible();
  const classUrl = page.url().split("?")[0];
  await page.getByLabel("Students' first names").fill("Aya, Ravi\nZoe");
  await page.getByRole("button", { name: "Add students" }).click();
  await expect(page.getByText("Added 3 students.")).toBeVisible();
  const roster = page.locator("#students");
  for (const n of ["Aya", "Ravi", "Zoe"]) await expect(roster.getByRole("cell", { name: n, exact: true })).toBeVisible();

  // Set an activity for the class with a due date.
  await page.getByLabel("Activity").selectOption("number-bonds-to-10");
  await page.getByLabel("Due date (optional)").fill("2030-06-30");
  await page.getByRole("button", { name: "Set for class" }).click();
  const assignment = page.getByRole("listitem", { name: "Assignment: Rocket Bonds to 10" });
  await expect(assignment).toContainText("0 of 3 done");
  await expect(assignment).toContainText("Still to do: Aya, Ravi, Zoe");

  // Login cards for the whole class: QR + login ID + password each.
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "📇 Make login cards for the class" }).click();
  await expect(page.getByRole("img", { name: /Login QR code for/ })).toHaveCount(3);
  const ayaId = (await page.getByTestId("card-login-id").first().textContent())!;
  const ayaPassword = (await page.getByTestId("card-password").first().textContent())!;
  expect(ayaId).toMatch(/^aya\d{4}$/);

  // Aya logs in with her card, sees "From my teacher" and passes the activity.
  const kid = await studentLogsIn(browser, ayaId, ayaPassword);
  await expect(kid.getByRole("heading", { name: /From my teacher/ })).toBeVisible();
  const fromTeacher = kid.getByRole("region", { name: /From my teacher/ });
  await expect(fromTeacher.getByRole("link", { name: /Rocket Bonds to 10/ })).toContainText("Try it by");
  await fromTeacher.getByRole("link", { name: /Rocket Bonds to 10/ }).click();
  await kid.getByRole("button", { name: /Let's go!/ }).click();
  await kid.getByRole("button", { name: "Skip" }).click(); // this activity opens with a song
  await kid.getByRole("button", { name: "Let's practise!" }).click();
  await passActivity(kid, "number-bonds-to-10");
  await kid.goto("/play");
  await expect(kid.getByRole("region", { name: /From my teacher/ })).toContainText("Done. Well done!");
  // Students never reach the teacher area, and never see a ranking.
  await kid.goto("/teacher");
  await expect(kid).toHaveURL(/\/play\/exit/);
  await kid.goto(classUrl);
  await expect(kid).toHaveURL(/\/play\/exit/);

  // The teacher sees progress and the ranking.
  await page.goto(classUrl);
  await expect(assignment).toContainText("1 of 3 done");
  await expect(assignment).toContainText("Still to do: Ravi, Zoe");
  await page.getByRole("link", { name: "Activities" }).click();
  const table = page.getByRole("table", { name: "Class ranking by activities" });
  await expect(table.getByRole("row").nth(1)).toContainText("1Aya");
  await expect(table.getByRole("row").nth(2)).toContainText("2Ravi"); // Ravi and Zoe share 2nd place
  await expect(table.getByRole("row").nth(3)).toContainText("2Zoe");

  // Removing a student deletes their profile.
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Remove Zoe" }).click();
  await expect(roster.getByRole("cell", { name: "Zoe", exact: true })).toHaveCount(0);

  // Another teacher can't open this class.
  const other = await (await browser.newContext()).newPage();
  await newTeacher(other, "Mr Jones");
  const res = await other.goto(classUrl);
  expect(res?.status()).toBe(404);
});
