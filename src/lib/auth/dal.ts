import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashToken, readSessionToken } from "./session";

/**
 * Data Access Layer: the only place that turns a cookie into a user.
 * Every protected page/action calls one of the require* helpers.
 */
export const getSession = cache(async () => {
  const token = await readSessionToken();
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: { select: { id: true, email: true, displayName: true, role: true, country: true, locale: true } },
      activeChild: true,
    },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session;
});

export type AppSession = NonNullable<Awaited<ReturnType<typeof getSession>>>;

/** Adult area. A device in child mode must enter the parent PIN first. */
export async function requireParent() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.childMode) redirect("/play/exit");
  return session;
}

/** Child area. Requires a selected child profile. */
export async function requireChild() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.activeChild) redirect("/play/who");
  return { session, child: session.activeChild };
}

export async function requireRole(roles: Array<"ADMIN" | "REVIEWER">) {
  const session = await requireParent();
  if (!roles.includes(session.user.role as "ADMIN" | "REVIEWER")) redirect("/parent");
  return session;
}

/** Load a child only if it belongs to the signed-in parent (prevents IDOR). */
export async function getOwnedChild(parentId: string, childId: string) {
  return db.childProfile.findFirst({ where: { id: childId, parentId } });
}
