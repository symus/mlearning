"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getOwnedChild, requireParent } from "@/lib/auth/dal";
import { hashToken } from "@/lib/auth/session";

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

/**
 * Make a new login card. The old card stops working. The secret goes only to the parent's
 * screen to draw the QR code: it is never stored (only its hash) and never put in a URL we log.
 */
export async function createLoginCard(childId: string): Promise<{ url: string } | { error: string }> {
  const session = await requireParent();
  const child = await getOwnedChild(session.userId, childId);
  if (!child) return { error: "Profile not found." };
  await revokeCards(child.id);
  const token = randomBytes(24).toString("base64url");
  await db.childLoginCard.create({ data: { childId: child.id, tokenHash: hashToken(token) } });
  await db.auditLog.create({ data: { userId: session.userId, action: "card.created", targetId: child.id } });
  revalidatePath(`/parent/children/${child.id}`);
  return { url: `${await origin()}/q/${token}` };
}

export async function cancelLoginCard(childId: string): Promise<void> {
  const session = await requireParent();
  const child = await getOwnedChild(session.userId, childId);
  if (!child) return;
  await revokeCards(child.id);
  await db.auditLog.create({ data: { userId: session.userId, action: "card.cancelled", targetId: child.id } });
  revalidatePath(`/parent/children/${child.id}`);
}
