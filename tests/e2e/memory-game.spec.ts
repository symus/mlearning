import { expect, test, type Page } from "@playwright/test";
import { newTeacher, studentLogsIn } from "./helpers";

/** Flip a face-down card on `page` and return its face once it shows. */
async function flipAt(page: Page, i: number): Promise<string> {
  await page.getByRole("button", { name: `Card ${i + 1}, face down` }).click();
  const label = await page.getByRole("button", { name: new RegExp(`^Card ${i + 1}: `) }).getAttribute("aria-label");
  return label!.replace(/^Card \d+: /, "").replace(/ \(found\)$/, "");
}

test("two classmates play Memory live on two devices; teachers can switch games off", async ({ page, browser }) => {
  test.setTimeout(180_000);
  await newTeacher(page);
  await page.getByLabel("Class name").fill("Year 3 Owls");
  await page.getByLabel("Age group").selectOption("YOUNG_THINKERS");
  await page.getByRole("button", { name: "Create class" }).click();
  await page.getByLabel("Students' first names").fill("Aya, Ravi, Zoe");
  await page.getByRole("button", { name: "Add students" }).click();
  await expect(page.getByText("Added 3 students.")).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "📇 Make login cards for the class" }).click();
  await expect(page.getByRole("img", { name: /Login QR code for/ })).toHaveCount(3);
  const ids = await page.getByTestId("card-login-id").allTextContents();
  const pws = await page.getByTestId("card-password").allTextContents();
  // The page shows each card twice (screen + print copy); cards are in name order: Aya, Ravi, Zoe.
  const aya = await studentLogsIn(browser, ids[0], pws[0]);
  const ravi = await studentLogsIn(browser, ids[1], pws[1]);

  // Aya invites Ravi (who is online); Ravi says yes; both land on the same board.
  await ravi.goto("/play/games");
  await aya.getByRole("link", { name: /Play Memory with a classmate/ }).click();
  await aya.getByRole("radio", { name: /Animal friends/ }).click();
  await aya.getByRole("button", { name: "Invite Ravi to play" }).click();
  await expect(aya.getByText("Waiting for Ravi to say yes")).toBeVisible();
  await expect(aya.getByText(/Zoe/)).toContainText("Not here right now"); // Zoe never logged in
  await expect(ravi.getByText("Aya wants to play Animal friends!")).toBeVisible();
  await ravi.getByRole("button", { name: "Let's play!" }).click();
  await expect(ravi).toHaveURL(/\/play\/games\/[^/]+$/);
  await expect(aya).toHaveURL(/\/play\/games\/[^/]+$/);
  expect(aya.url()).toBe(ravi.url());
  await expect(aya.getByRole("status").filter({ hasText: "Your turn!" })).toBeVisible();
  await expect(ravi.getByRole("status").filter({ hasText: "Aya's turn" })).toBeVisible();
  const cardCount = await aya.getByRole("button", { name: /^Card \d+/ }).count();
  expect(cardCount).toBe(16); // ages 6–8: 8 pairs

  // Ravi can't flip on Aya's turn.
  await expect(ravi.getByRole("button", { name: "Card 1, face down" })).toBeDisabled();

  // Play to the end, remembering cards like a good player would.
  const known = new Map<number, string>();
  const won = new Set<number>();
  for (let move = 0; move < 60 && won.size < cardCount; move++) {
    const ayaTurn = await aya.getByText("Your turn! Flip two cards").isVisible();
    const raviTurn = await ravi.getByText("Your turn! Flip two cards").isVisible();
    if (!ayaTurn && !raviTurn) {
      await aya.waitForTimeout(400); // a wrong pair is turning back over
      continue;
    }
    const p = ayaTurn ? aya : ravi;
    const open = [...known].filter(([i]) => !won.has(i));
    const pair = open.find(([i, f]) => open.some(([j, g]) => j !== i && g === f));
    let first: number, second: number;
    if (pair) {
      first = pair[0];
      second = open.find(([j, g]) => j !== first && g === pair[1])![0];
      await flipAt(p, first);
      await flipAt(p, second);
    } else {
      first = [...Array(cardCount).keys()].find((i) => !known.has(i) && !won.has(i))!;
      const face = await flipAt(p, first);
      known.set(first, face);
      const partner = open.find(([, f]) => f === face);
      second = partner ? partner[0] : [...Array(cardCount).keys()].find((i) => i !== first && !known.has(i) && !won.has(i))!;
      known.set(second, await flipAt(p, second));
    }
    if (known.get(first) === known.get(second)) won.add(first).add(second);
    else await expect(p.getByText("Your turn! Flip two cards")).toBeHidden({ timeout: 5000 }).catch(() => {});
  }
  for (const p of [aya, ravi]) await expect(p.getByRole("heading", { name: /wins! 🎉|You win! 🎉|It's a tie/ })).toBeVisible();
  await expect(aya.getByText(/Great game, both of you!/)).toBeVisible();

  // Only the two players can open the game.
  const zoeUrl = aya.url();
  const zoe = await studentLogsIn(browser, ids[2], pws[2]);
  await zoe.goto(zoeUrl); // the child area streams (loading screen first), so check the page, not the status code
  await expect(zoe.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
  await expect(zoe.getByRole("button", { name: /^Card \d+/ })).toHaveCount(0);

  // The teacher switches games off: students see it straight away.
  await page.getByRole("switch", { name: /Classmates can play Memory together/ }).uncheck();
  await expect(page.getByRole("switch", { name: /Classmates can play Memory together/ })).not.toBeChecked();
  await aya.goto("/play/games");
  await expect(aya.getByText("Your teacher has switched games off for now.")).toBeVisible();
  await aya.goto("/play");
  await expect(aya.getByRole("link", { name: /Play Memory with a classmate/ })).toHaveCount(0);
});
