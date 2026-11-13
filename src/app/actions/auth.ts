"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashSecret, verifySecret } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { childLoginSchema, fieldErrors, loginSchema, signupSchema, type FormState } from "@/lib/validation";
import { LOCK_MINUTES, MAX_FAILED_LOGINS, isLocked } from "@/lib/auth/child-login";

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

/**
 * A child logs in with the login ID and password from their card. Like scanning the QR code, this
 * opens only that child's play area (a child-only session). Wrong passwords count against the card,
 * and too many lock it for a while, because card passwords are short.
 */
export async function childLogin(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = childLoginSchema.safeParse(Object.fromEntries(formData));
  const values = { loginId: String(formData.get("loginId") ?? "") };
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const { loginId, password } = parsed.data;

  const child = await db.childProfile.findUnique({
    where: { loginId },
    include: { loginCards: { where: { revokedAt: null, passwordHash: { not: null } }, orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const card = child?.loginCards[0];
  const lockedMessage = `Too many tries. Ask a grown-up for help, or try again in ${LOCK_MINUTES} minutes.`;
  if (card && isLocked(card.lockedUntil)) return { message: lockedMessage, values };

  const ok = await verifySecret(password, card?.passwordHash ?? (await getDummyHash()));
  if (!child || !card || !ok) {
    if (card) {
      const { failedLogins } = await db.childLoginCard.update({ where: { id: card.id }, data: { failedLogins: { increment: 1 } } });
      if (failedLogins >= MAX_FAILED_LOGINS) {
        await db.childLoginCard.update({ where: { id: card.id }, data: { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000) } });
        await db.auditLog.create({ data: { userId: child!.parentId, action: "card.locked", targetId: child!.id } });
        return { message: lockedMessage, values };
      }
    }
    return { message: "That login ID and password don't match. Check your card and try again.", values };
  }

  await db.childLoginCard.update({ where: { id: card.id }, data: { failedLogins: 0, lockedUntil: null } });
  await destroySession();
  await createSession(child.parentId, { childId: child.id, childOnly: true });
  await db.auditLog.create({ data: { userId: child.parentId, action: "card.password_login", targetId: child.id } });
  redirect(child.onboardedAt ? "/play" : "/play/onboarding");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}
