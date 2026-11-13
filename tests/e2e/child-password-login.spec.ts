import { expect, test, type Browser, type Page } from "@playwright/test";
import { newFamilyWithChild } from "./helpers";

async function cardDetails(page: Page) {
  await expect(page.getByRole("img", { name: /Login QR code for/ })).toBeVisible();
  return { loginId: (await page.getByTestId("card-login-id").first().textContent())!, password: (await page.getByTestId("card-password").first().textContent())! };
}

async function childLogsIn(browser: Browser, loginId: string, password: string) {
  const kid = await (await browser.newContext()).newPage();
  await kid.goto("/login");
  await kid.getByRole("link", { name: "🔑 Type my login ID" }).click();
  await kid.getByLabel("Login ID").fill(loginId);
  await kid.getByLabel("Password").fill(password);
  await kid.getByRole("button", { name: /Let's go/ }).click();
  return kid;
}

test("Login ID + password on the card: child-only access, new card changes the password, wrong tries lock it", async ({ page, browser }) => {
  await newFamilyWithChild(page, { nickname: "Ravi", age: 7, pin: "2468" });
  await page.goto("/play/exit");
  await page.getByLabel("Parent PIN").fill("2468");
  await page.getByRole("button", { name: "Open parent area" }).click();
  await page.getByRole("link", { name: "Progress" }).click();
  await page.getByRole("button", { name: "Make a login card" }).click();
  const first = await cardDetails(page);
  expect(first.loginId).toMatch(/^ravi[1-9]\d{3}$/);
  expect(first.password).toMatch(/^[a-z]{3,6}\d{4}$/);

  // The child types it (capitals and spaces are fine) and lands in their own play area only.
  const kid = await childLogsIn(browser, ` ${first.loginId.toUpperCase()} `, first.password.toUpperCase());
  await expect(kid.getByRole("heading", { name: "Your learning universe" })).toBeVisible();
  await expect(kid.getByRole("link", { name: /Home: the learning universe/ })).toContainText("Ravi");
  await kid.goto("/parent");
  await expect(kid.getByText(/signed in with Ravi's login card/)).toBeVisible();

  // A new card keeps the login ID, changes the password, and the old password stops working.
  await page.reload();
  await expect(page.getByText(`Login ID: ${first.loginId}`)).toBeVisible();
  await page.getByRole("button", { name: "Make a new card (cancels the old one)" }).click();
  const second = await cardDetails(page);
  expect(second.loginId).toBe(first.loginId);
  expect(second.password).not.toBe(first.password);
  const old = await childLogsIn(browser, first.loginId, first.password);
  await expect(old.getByText("That login ID and password don't match")).toBeVisible();

  // Five wrong passwords in a row lock the card for a while, even for the right password.
  const tryPassword = async (password: string, message: RegExp) => {
    await old.getByLabel("Password").fill(password);
    await old.getByRole("button", { name: /Let's go/ }).click();
    await expect(old.getByRole("button", { name: /Let's go/ })).toBeEnabled(); // this try has finished
    await expect(old.getByText(message)).toBeVisible();
  };
  for (let i = 2; i <= 4; i++) await tryPassword(`wrong${i}`, /don't match/); // the old password above was try 1
  await tryPassword("wrong5", /Too many tries/);
  await tryPassword(second.password, /Too many tries/);
});
