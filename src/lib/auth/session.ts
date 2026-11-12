import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "wg_session";

const ttlDays = () => Number(process.env.SESSION_TTL_DAYS ?? 30);

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Create a DB-backed session and set an httpOnly cookie. The raw token is never stored. */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ttlDays() * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function readSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function destroySession(): Promise<void> {
  const token = await readSessionToken();
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  (await cookies()).delete(SESSION_COOKIE);
}
