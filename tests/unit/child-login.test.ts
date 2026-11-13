import { describe, expect, it } from "vitest";
import {
  LOCK_MINUTES, MAX_FAILED_LOGINS, PASSWORD_WORDS, isLocked, loginIdBase,
  makeChildPassword, makeLoginId, normaliseChildCredential,
} from "@/lib/auth/child-login";

describe("child login details", () => {
  it("builds login IDs from the name: a–z only, max 8 letters, plus 4 digits", () => {
    expect(loginIdBase("Aya")).toBe("aya");
    expect(loginIdBase("Zoë-Marie 2")).toBe("zoemarie");
    expect(loginIdBase("Alexandria")).toBe("alexandr");
    expect(loginIdBase("அருண்")).toBe("explorer"); // non-Latin names still get a typeable ID
    expect(makeLoginId("Aya", () => 4821)).toBe("aya4821");
    for (let i = 0; i < 50; i++) expect(makeLoginId("Mia")).toMatch(/^mia[1-9]\d{3}$/);
  });

  it("makes simple word + 4 digit passwords", () => {
    expect(makeChildPassword((min, max) => (max === 10000 ? 666 : PASSWORD_WORDS.indexOf("hands")))).toBe("hands0666");
    for (let i = 0; i < 50; i++) expect(makeChildPassword()).toMatch(/^[a-z]{3,6}\d{4}$/);
    expect(new Set(PASSWORD_WORDS).size).toBe(PASSWORD_WORDS.length);
  });

  it("ignores case and spaces in what a child types", () => {
    expect(normaliseChildCredential(" Tiger 0482 ")).toBe("tiger0482");
  });

  it("treats a card as locked only until the lock time", () => {
    const now = new Date("2026-11-13T10:00:00Z");
    const until = new Date(now.getTime() + LOCK_MINUTES * 60_000);
    expect(MAX_FAILED_LOGINS).toBeGreaterThanOrEqual(3);
    expect(isLocked(null, now)).toBe(false);
    expect(isLocked(until, now)).toBe(true);
    expect(isLocked(until, new Date(until.getTime() + 1))).toBe(false);
  });
});
