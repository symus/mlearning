import "server-only";
import type { AgeBand } from "@prisma/client";
import { db } from "@/lib/db";
import { AGE_BANDS } from "@/lib/age";
import { presenceOf, type Presence } from "./pause";

const TOUCH_EVERY_MS = 20_000; // fewer DB writes: only update "last seen" if it is older than this

/** Record that the child's screen is open (throttled). */
export async function touchSeen(child: { id: string; lastSeenAt: Date | null }) {
  const now = new Date();
  if (child.lastSeenAt && now.getTime() - child.lastSeenAt.getTime() < TOUCH_EVERY_MS) return;
  await db.childProfile.update({ where: { id: child.id }, data: { lastSeenAt: now } });
}

/** The parent's "right now" view for one child. */
export async function getPresence(child: { id: string; ageBand: AgeBand; lastSeenAt: Date | null }): Promise<Presence> {
  const current = await db.attempt.findFirst({
    where: { childId: child.id, completedAt: null, startedAt: { gte: new Date(Date.now() - 2 * 3600_000) } },
    orderBy: { startedAt: "desc" },
    select: { startedAt: true, activity: { select: { title: true } }, responses: { select: { itemId: true } } },
  });
  return presenceOf(
    child.lastSeenAt,
    current && {
      activityTitle: current.activity.title,
      startedAt: current.startedAt,
      answered: new Set(current.responses.map((r) => r.itemId)).size,
      ofItems: AGE_BANDS[child.ageBand].itemsPerRound,
    },
  );
}
