import "server-only";
import { db } from "@/lib/db";
import { STICKER_ACCURACY } from "@/lib/rewards";
import type { StudentStats } from "./ranking";

export type Period = "week" | "all";
export const parsePeriod = (v: string | undefined): Period => (v === "all" ? "all" : "week");

type AttemptRow = { childId: string; activityId: string; startedAt: Date; correctCount: number; totalCount: number; durationSec: number };

/** A completed attempt passes at the same accuracy that earns a sticker. */
const passed = (a: AttemptRow) => a.totalCount > 0 && a.correctCount / a.totalCount >= STICKER_ACCURACY;

export type AssignmentStatus = "done" | "tried" | "todo";

/** done = passed since it was set; tried = finished it since then but not passed yet; todo = not finished since then. */
export function assignmentStatus(attempts: AttemptRow[], childId: string, activityId: string, setAt: Date): AssignmentStatus {
  const mine = attempts.filter((a) => a.childId === childId && a.activityId === activityId && a.startedAt >= setAt);
  return mine.some(passed) ? "done" : mine.length ? "tried" : "todo";
}

/** Everything the class page shows. Call only after checking the teacher owns the class. */
export async function getClassView(classId: string, period: Period) {
  const cls = await db.classroom.findUniqueOrThrow({
    where: { id: classId },
    include: {
      students: {
        orderBy: { nickname: "asc" },
        select: { id: true, nickname: true, loginId: true, avatar: true, loginCards: { where: { revokedAt: null }, select: { createdAt: true }, take: 1 } },
      },
      assignments: { include: { activity: { select: { id: true, slug: true, title: true, subjectSlug: true } } }, orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }] },
    },
  });
  const ids = cls.students.map((s) => s.id);
  const since = period === "week" ? new Date(Date.now() - 7 * 24 * 3600 * 1000) : null;
  const [attempts, mastered] = await Promise.all([
    db.attempt.findMany({
      where: { childId: { in: ids }, completedAt: { not: null } },
      select: { childId: true, activityId: true, startedAt: true, correctCount: true, totalCount: true, durationSec: true },
    }),
    db.objectiveMastery.findMany({ where: { childId: { in: ids }, status: "MASTERED" }, select: { childId: true, lastPracticed: true } }),
  ]);

  const assignments = cls.assignments.map((a) => {
    const statuses = cls.students.map((s) => ({ id: s.id, name: s.nickname, status: assignmentStatus(attempts, s.id, a.activityId, a.createdAt) }));
    return { id: a.id, activity: a.activity, dueAt: a.dueAt, createdAt: a.createdAt, statuses, done: statuses.filter((x) => x.status === "done").length };
  });

  const inPeriod = (d: Date | null) => !since || (!!d && d >= since);
  const stats: StudentStats[] = cls.students.map((s) => {
    const mine = attempts.filter((a) => a.childId === s.id && inPeriod(a.startedAt));
    const answered = mine.reduce((n, a) => n + a.totalCount, 0);
    return {
      id: s.id,
      name: s.nickname,
      activities: mine.length,
      accuracy: answered ? mine.reduce((n, a) => n + a.correctCount, 0) / answered : null,
      minutes: Math.round(mine.reduce((n, a) => n + a.durationSec, 0) / 60),
      mastered: mastered.filter((m) => m.childId === s.id && inPeriod(m.lastPracticed)).length,
      assignmentsDone: assignments.filter((a) => a.statuses.some((x) => x.id === s.id && x.status === "done")).length,
    };
  });

  return { cls, students: cls.students, assignments, stats };
}

/** "From my teacher" for a student: their class's assignments, not-done first, soonest due first. */
export async function getStudentAssignments(childId: string, classroomId: string) {
  const [assignments, attempts] = await Promise.all([
    db.assignment.findMany({
      where: { classroomId, activity: { status: "PUBLISHED" } },
      include: { activity: { select: { slug: true, title: true, subjectSlug: true } } },
    }),
    db.attempt.findMany({ where: { childId, completedAt: { not: null } }, select: { childId: true, activityId: true, startedAt: true, correctCount: true, totalCount: true, durationSec: true } }),
  ]);
  return assignments
    .map((a) => ({ id: a.id, slug: a.activity.slug, title: a.activity.title, subject: a.activity.subjectSlug, dueAt: a.dueAt, status: assignmentStatus(attempts, childId, a.activityId, a.createdAt) }))
    .sort((a, b) => Number(a.status === "done") - Number(b.status === "done") || (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity));
}
