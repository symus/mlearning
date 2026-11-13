import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createSession, hashToken } from "@/lib/auth/session";

/** Scanning a login card opens this URL: sign in to that child's play area only. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const card = /^[A-Za-z0-9_-]{20,64}$/.test(token)
    ? await db.childLoginCard.findUnique({ where: { tokenHash: hashToken(token) }, include: { child: true } })
    : null;
  if (!card || card.revokedAt) return NextResponse.redirect(new URL("/login?card=invalid", request.url));

  await createSession(card.child.parentId, { childId: card.childId, childOnly: true });
  await db.auditLog.create({ data: { userId: card.child.parentId, action: "card.login", targetId: card.childId } });
  return NextResponse.redirect(new URL(card.child.onboardedAt ? "/play" : "/play/onboarding", request.url));
}
