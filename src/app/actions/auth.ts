"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashSecret, verifySecret } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { fieldErrors, loginSchema, signupSchema, type FormState } from "@/lib/validation";

const CONSENT_VERSION = "2026-11";

// Compare against a real hash when the email is unknown, so response time doesn't reveal which emails exist.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashSecret("not-a-real-password"));

function safeNext(next: FormDataEntryValue | null): string | null {
  const v = typeof next === "string" ? next : "";
  // Only allow internal paths (prevents open redirects).
  return v.startsWith("/") && !v.startsWith("//") ? v : null;
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData);
  const parsed = signupSchema.safeParse(raw);
  const values = { displayName: String(raw.displayName ?? ""), email: String(raw.email ?? ""), country: String(raw.country ?? "GB") };
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const { email, password, pin, displayName, country } = parsed.data;
  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return { errors: { email: ["An account with this email already exists. Try logging in."] }, values };

  const [passwordHash, parentPinHash] = await Promise.all([hashSecret(password), hashSecret(pin)]);
  const user = await db.user.create({
    data: {
      email,
      displayName,
      country,
      passwordHash,
      parentPinHash,
      subscription: { create: { plan: "FREE" } },
      consents: {
        create: (["TERMS", "PRIVACY", "PARENTAL_CONSENT"] as const).map((type) => ({ type, version: CONSENT_VERSION })),
      },
      auditLogs: { create: { action: "account.created" } },
    },
  });
  await createSession(user.id);
  redirect("/parent/children/new?welcome=1");
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  const values = { email: String(formData.get("email") ?? "") };
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // Same message for unknown email and wrong password (no account enumeration).
  const ok = await verifySecret(parsed.data.password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !ok) return { message: "That email and password don't match. Please try again.", values };

  await destroySession(); // replace any child-card session on this device
  await createSession(user.id);
  redirect(safeNext(formData.get("next")) ?? "/parent");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}
