import "server-only";
import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { hashToken } from "./session";
import { hashSecret } from "./password";
import { makeChildPassword, makeLoginId } from "./child-login";

/** What a printed card shows. The QR secret and password exist only in this object, never in the DB. */
export interface IssuedCard {
  childId: string;
  nickname: string;
  avatar: unknown;
  url: string;
  loginId: string;
  password: string;
}

export async function cardOrigin() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Cancel every card for a child and sign out devices that used one. */
export async function revokeCards(childId: string) {
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
 * Issue a new card (QR + login ID + simple password) for a child the caller has ALREADY checked
 * they own. The old card stops working. Only hashes are stored.
 */
export async function issueCard(
  child: { id: string; nickname: string; loginId: string | null; avatar: unknown },
  actorUserId: string,
  origin: string,
): Promise<IssuedCard> {
  const loginId = await ensureLoginId(child);
  await revokeCards(child.id);
  const token = randomBytes(24).toString("base64url");
  const password = makeChildPassword();
  await db.childLoginCard.create({ data: { childId: child.id, tokenHash: hashToken(token), passwordHash: await hashSecret(password) } });
  await db.auditLog.create({ data: { userId: actorUserId, action: "card.created", targetId: child.id } });
  return { childId: child.id, nickname: child.nickname, avatar: child.avatar, url: `${origin}/q/${token}`, loginId, password };
}
