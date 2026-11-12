import type { PlanCode } from "@prisma/client";
import { brand } from "@/config/brand";

/** Country -> pricing region. Prices themselves live in the Price table (editable without deploy). */
const EUR = ["IE", "DE", "FR", "NL", "ES", "IT", "AT", "BE", "PT", "FI"];
export function priceRegion(country: string): string {
  if (["GB", "PL", "IN", "US", "AU"].includes(country)) return country;
  if (EUR.includes(country)) return "EU";
  return "*";
}

export function formatMoney(amountMinor: number, currency: string, locale = "en-GB"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amountMinor / 100);
}

export const PLAN_FEATURES: Record<PlanCode, { name: string; summary: string; features: string[] }> = {
  FREE: {
    name: "Free",
    summary: `Try ${brand.name} with selected activities.`,
    features: ["Selected starter activities in every open world", "1 child profile", "Basic progress view", "Up to 3 activities a day"],
  },
  PREMIUM: {
    name: "Premium",
    summary: "The full library for one child.",
    features: ["Every activity in every world", "Adaptive difficulty and revision", "Full progress by learning objective", "Personalised recommendations", "Selected activities offline"],
  },
  FAMILY: {
    name: "Family",
    summary: "Everything in Premium for up to 4 children.",
    features: ["Up to 4 child profiles", "Individual learning paths", "Weekly family reports", "Family challenges", "Everything in Premium"],
  },
};

/** Free-plan daily limit; enforced in the activity player. */
export const FREE_DAILY_ACTIVITY_LIMIT = 3;
export const PLAN_CHILD_LIMIT: Record<PlanCode, number> = { FREE: 1, PREMIUM: 1, FAMILY: 4 };
