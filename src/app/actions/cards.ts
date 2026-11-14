"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getOwnedChild, requireAdult } from "@/lib/auth/dal";
import { cardOrigin, issueCard, revokeCards } from "@/lib/auth/cards";

/**
 * Make a new login card: a QR code plus a login ID and simple password. The old card (QR and
 * password) stops working. The QR secret and the password go only to the adult's screen: we keep
 * only their hashes, so they can't be shown again later. Works for a parent's child or a teacher's student.
 */
export async function createLoginCard(childId: string): Promise<{ url: string; loginId: string; password: string } | { error: string }> {
  const session = await requireAdult();
  const child = await getOwnedChild(session.userId, childId);
  if (!child) return { error: "Profile not found." };
  const card = await issueCard(child, session.userId, await cardOrigin());
  revalidatePath(`/parent/children/${child.id}`);
  return { url: card.url, loginId: card.loginId, password: card.password };
}

export async function cancelLoginCard(childId: string): Promise<void> {
  const session = await requireAdult();
  const child = await getOwnedChild(session.userId, childId);
  if (!child) return;
  await revokeCards(child.id);
  await db.auditLog.create({ data: { userId: session.userId, action: "card.cancelled", targetId: child.id } });
  revalidatePath(`/parent/children/${child.id}`);
}
