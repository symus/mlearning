"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getOwnedChild, requireParent } from "@/lib/auth/dal";
import { hashToken } from "@/lib/auth/session";
import { hashSecret } from "@/lib/auth/password";
import { makeChildPassword, makeLoginId } from "@/lib/auth/child-login";

async function origin() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Cancel every card for a child and sign out devices that used one. */
async function revokeCards(childId: string) {
  await db.childLoginCard.updateMany({ where: { childId, revokedAt: null }, data: { revokedAt: new Date() } });
  await db.session.deleteMany({ where: { activeChildId: childId, childOnly: true } });
}

/** The child's login ID, made once (name + 4 digits) and kept for good. Retries if an ID is taken. */
async function ensureLoginId(child: { id: string; nickname: string; loginId: string | null }): Promise<string> {
  if (child.loginId) return child.loginId;
  for (let i = 0; i < 20; i++) {
    const loginId = makeLoginId(child.nickname);
    const taken = await db.childProfile.findUnique({ where: { loginId }, select: { id: true } });
    if (taken) continue;
    try {
      await db.childProfile.update({ where: { id: child.id }, data: { loginId } });
      return loginId;
    } catch {
      // Someone took it at the same moment (unique constraint): try another number.
    }
  }
  throw new Error("Could not make a login ID");
}

/**
 * Make a new login card: a QR code plus a login ID and simple password. The old card (QR and
 * password) stops working. The QR secret and the password go only to the parent's screen: we keep
 * only their hashes, so they can't be shown again later.
 */
export async function createLoginCard(childId: string): Promise<{ url: string; loginId: string; password: string } | { error: string }> {
  const session = await requireParent();
  const child = await getOwnedChild(session.userId, childId);
  if (!child) return { error: "Profile not found." };
  const loginId = await ensureLoginId(child);
  await revokeCards(child.id);
  const token = randomBytes(24).toString("base64url");
  const password = makeChildPassword();
  await db.childLoginCard.create({ data: { childId: child.id, tokenHash: hashToken(token), passwordHash: await hashSecret(password) } });
  await db.auditLog.create({ data: { userId: session.userId, action: "card.created", targetId: child.id } });
  revalidatePath(`/parent/children/${child.id}`);
  return { url: `${await origin()}/q/${token}`, loginId, password };
}

export async function cancelLoginCard(childId: string): Promise<void> {
  const session = await requireParent();
  const child = await getOwnedChild(session.userId, childId);
  if (!child) return;
  await revokeCards(child.id);
  await db.auditLog.create({ data: { userId: session.userId, action: "card.cancelled", targetId: child.id } });
  revalidatePath(`/parent/children/${child.id}`);
}
