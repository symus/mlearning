import "server-only";
import { db } from "@/lib/db";

const WINS_KEEP_MS = 7 * 24 * 3600_000; // the Winners board shows the last 7 days

export interface WinnerEntry {
  id: string;
  name: string;
  avatar: unknown;
  deck: string;
  tie: boolean;
  wonAt: string; // ISO
}

/** A class's Winners board (last 7 days, newest first). Call only after checking the viewer belongs to the class. */
export async function winnersBoard(classroomId: string): Promise<WinnerEntry[]> {
  await db.gameWin.deleteMany({ where: { classroomId, wonAt: { lt: new Date(Date.now() - WINS_KEEP_MS) } } });
  const wins = await db.gameWin.findMany({
    where: { classroomId },
    orderBy: { wonAt: "desc" },
    take: 12,
    include: { child: { select: { nickname: true, avatar: true } } },
  });
  return wins.map((w) => ({ id: w.id, name: w.child.nickname, avatar: w.child.avatar, deck: w.deck, tie: w.tie, wonAt: w.wonAt.toISOString() }));
}
