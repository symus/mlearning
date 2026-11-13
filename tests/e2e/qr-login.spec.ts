import { expect, test } from "@playwright/test";
import { newFamilyWithChild } from "./helpers";

test("QR login card: child-only access, parent login still required, new card cancels the old one", async ({ page, browser }) => {
  const { email } = await newFamilyWithChild(page, { nickname: "Aya", age: 6, pin: "1357" });

  // Parent makes a card from Aya's progress page.
  await page.goto("/play/exit");
  await page.getByLabel("Parent PIN").fill("1357");
  await page.getByRole("button", { name: "Open parent area" }).click();
  await page.getByRole("link", { name: "Progress" }).click();
  await page.getByRole("button", { name: "Make a login card" }).click();
  const qr = page.getByRole("img", { name: "Login QR code for Aya" });
  await expect(qr).toBeVisible();
  const cardUrl = new URL((await qr.getAttribute("data-login-url"))!).pathname;
  expect(cardUrl).toMatch(/^\/q\/[A-Za-z0-9_-]{20,}$/);

  // A different device (the child's tablet) scans the card.
  const tablet = await browser.newContext();
  const kid = await tablet.newPage();
  await kid.goto(cardUrl);
  await expect(kid.getByRole("heading", { name: "Your learning universe" })).toBeVisible();
  await expect(kid.getByRole("link", { name: /Home: the learning universe/ })).toContainText("Aya");

  // The card never reaches the parent area, not even with the PIN.
  await kid.goto("/parent");
  await expect(kid.getByText(/signed in with Aya's login card/)).toBeVisible();
  await expect(kid.getByLabel("Parent PIN")).toHaveCount(0);
  await kid.goto("/parent/export");
  await expect(kid.getByText(/Not authorised/)).toBeVisible();
  await kid.goto("/play/who");
  await expect(kid).toHaveURL(/\/play$/);

  // A grown-up on the tablet logs in properly with email and password.
  await kid.goto("/play/exit");
  await kid.getByRole("link", { name: "Log in as a grown-up" }).click();
  await kid.getByLabel("Email").fill(email);
  await kid.getByLabel("Password").fill("Learning-path-88");
  await kid.getByRole("button", { name: "Log in" }).click();
  await expect(kid.getByRole("heading", { name: "Your family's learning" })).toBeVisible();

  // Making a new card cancels the old one: the old QR stops working.
  await page.reload();
  await page.getByRole("button", { name: "Make a new card (cancels the old one)" }).click();
  await expect(page.getByRole("img", { name: "Login QR code for Aya" })).toBeVisible();
  const other = await (await browser.newContext()).newPage();
  await other.goto(cardUrl);
  await expect(other.getByText("That login card no longer works")).toBeVisible();

  // "Scan my card" with a photo (the phone fallback when the live camera is blocked on http).
  await other.getByRole("link", { name: "📷 Scan my card" }).click();
  await expect(other.getByRole("heading", { name: "Scan your login card" })).toBeVisible();
  const photo = await page.getByRole("img", { name: "Login QR code for Aya" }).screenshot();
  await other.getByTestId("qr-photo").setInputFiles({ name: "card.png", mimeType: "image/png", buffer: photo });
  await expect(other.getByRole("heading", { name: "Your learning universe" })).toBeVisible();
  await tablet.close();
});
