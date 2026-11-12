import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/dal";

/** GDPR data portability: the parent downloads all data held about the family. */
export async function GET() {
  const session = await getSession();
  if (!session || session.childMode) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.userId },
    select: {
      email: true, displayName: true, country: true, locale: true, createdAt: true,
      consents: { select: { type: true, version: true, grantedAt: true } },
      subscription: { select: { plan: true, status: true } },
      children: {
        select: {
          nickname: true, birthYear: true, ageBand: true, interests: true, dailyGoalMinutes: true, avatar: true, createdAt: true,
          masteries: { select: { objectiveCode: true, status: true, score: true, itemsSeen: true, lastPracticed: true } },
          achievements: { select: { code: true, earnedAt: true } },
          attempts: { select: { startedAt: true, completedAt: true, correctCount: true, totalCount: true, activity: { select: { slug: true } }, responses: { select: { itemId: true, answer: true, isCorrect: true, hintsUsed: true, createdAt: true } } } },
        },
      },
    },
  });
  await db.auditLog.create({ data: { userId: session.userId, action: "account.export" } });
  return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), ...user }, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="wondergrove-data-${new Date().toISOString().slice(0, 10)}.json"` },
  });
}
