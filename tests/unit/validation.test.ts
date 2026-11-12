import { describe, expect, it } from "vitest";
import { ageBandForAge, ageBandForBirthYear, allowedBirthYears } from "@/lib/age";
import { childSchema, signupSchema } from "@/lib/validation";
import { priceRegion } from "@/lib/pricing";

describe("age bands", () => {
  it("maps ages to the three experiences", () => {
    expect(ageBandForAge(3)).toBe("LITTLE_EXPLORERS");
    expect(ageBandForAge(5)).toBe("LITTLE_EXPLORERS");
    expect(ageBandForAge(6)).toBe("YOUNG_THINKERS");
    expect(ageBandForAge(8)).toBe("YOUNG_THINKERS");
    expect(ageBandForAge(9)).toBe("FUTURE_INNOVATORS");
    expect(ageBandForAge(12)).toBe("FUTURE_INNOVATORS");
    expect(ageBandForBirthYear(2019, new Date("2026-06-01"))).toBe("YOUNG_THINKERS");
  });
  it("offers only birth years for ages ~3–12", () => {
    const years = allowedBirthYears(new Date("2026-06-01"));
    expect(years[0]).toBe(2024);
    expect(years.at(-1)).toBe(2013);
  });
});

describe("signup validation", () => {
  const valid = { displayName: "Sam", email: "Sam@Example.com ", password: "longpassword1", pin: "1234", country: "PL", parentalConsent: "on", terms: "on" };
  it("accepts a valid form and normalises email", () => {
    const p = signupSchema.safeParse(valid);
    expect(p.success).toBe(true);
    expect(p.data?.email).toBe("sam@example.com");
  });
  it("requires parental consent, a strong password and a 4-digit PIN", () => {
    expect(signupSchema.safeParse({ ...valid, parentalConsent: undefined }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, password: "short" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, password: "onlyletterslong" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, pin: "12a4" }).success).toBe(false);
  });
});

describe("child validation", () => {
  const year = new Date().getFullYear();
  it("accepts a nickname and birth year only", () => {
    expect(childSchema.safeParse({ nickname: "Zoë", birthYear: String(year - 7), dailyGoalMinutes: "20", interests: ["space"], narration: true }).success).toBe(true);
  });
  it("rejects ages outside 3–12 and odd nicknames", () => {
    expect(childSchema.safeParse({ nickname: "Mia", birthYear: String(year - 20), dailyGoalMinutes: "20" }).success).toBe(false);
    expect(childSchema.safeParse({ nickname: "<script>", birthYear: String(year - 7), dailyGoalMinutes: "20" }).success).toBe(false);
  });
});

describe("pricing regions", () => {
  it("maps countries to price regions", () => {
    expect(priceRegion("PL")).toBe("PL");
    expect(priceRegion("DE")).toBe("EU");
    expect(priceRegion("BR")).toBe("*");
  });
});
