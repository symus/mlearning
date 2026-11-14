import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { db } from "@/lib/db";
import { getOwnedClass, requireTeacher } from "@/lib/auth/dal";
import { AGE_BANDS } from "@/lib/age";
import { MAX_CLASS_SIZE } from "@/lib/pricing";
import { WORLDS, worldForSubject } from "@/lib/worlds";
import { bandActivityWhere, byPath } from "@/lib/learning/reachable";
import { getClassView, parsePeriod } from "@/lib/teacher/class-data";
import { RANK_KEYS, RANK_LABEL, parseRankKey, rankStudents } from "@/lib/teacher/ranking";
import { Avatar } from "@/components/avatar";
import { Badge, Card, ProgressBar } from "@/components/ui/card";
import { ClassCards } from "@/components/teacher/class-cards";
import { AddStudentsForm, AssignForm, RemoveAssignmentButton, RemoveStudentButton } from "@/components/teacher/forms";

export const metadata = { title: "Class" };

const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

export default async function ClassPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ period?: string; sort?: string; new?: string }> }) {
  const session = await requireTeacher();
  const { id } = await params;
  const sp = await searchParams;
  const owned = await getOwnedClass(session.userId, id);
  if (!owned) notFound();

  const period = parsePeriod(sp.period);
  const sort = parseRankKey(sp.sort);
  const [{ cls, students, assignments, stats }, activities] = await Promise.all([
    getClassView(owned.id, period),
    bandActivityWhere(owned.ageBand).then((where) => db.activity.findMany({ where, select: { slug: true, title: true, subjectSlug: true, ageBand: true, pathOrder: true } })),
  ]);
  const open = new Set(WORLDS.filter((w) => w.status === "open").map((w) => w.subject));
  const options = WORLDS.filter((w) => open.has(w.subject))
    .map((w) => ({ world: w.name, activities: activities.filter((a) => a.subjectSlug === w.subject).sort(byPath) }))
    .filter((g) => g.activities.length);
  const ranked = rankStudents(stats, sort);
  const now = new Date();
  const rankHref = (p: string, s: string) => `?period=${p}&sort=${s}#ranking`;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/teacher" className="text-sm font-bold text-brand">← My classes</Link>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-bold">{cls.name}</h1>
          <Badge tone="brand">{AGE_BANDS[cls.ageBand].name} · ages {AGE_BANDS[cls.ageBand].ages}</Badge>
        </div>
        <nav aria-label="Class sections" className="mt-3 flex flex-wrap gap-2 text-sm font-bold">
          <a href="#students" className="rounded-full bg-line/60 px-4 py-1.5">Students ({students.length})</a>
          <a href="#assignments" className="rounded-full bg-line/60 px-4 py-1.5">Assignments ({assignments.length})</a>
          <a href="#ranking" className="rounded-full bg-line/60 px-4 py-1.5">Ranking</a>
        </nav>
      </div>

      {/* ---------- Students ---------- */}
      <Card id="students" className="scroll-mt-4 space-y-5">
        <h2 className="text-2xl font-bold">Students</h2>
        {students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-ink-muted">
                <tr><th className="py-2 pr-3">Name</th><th className="py-2 pr-3">Login ID</th><th className="py-2 pr-3">Card</th><th className="py-2"><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-line">
                    <td className="py-2 pr-3"><span className="flex items-center gap-2 font-bold"><Avatar avatar={s.avatar} size="sm" />{s.nickname}</span></td>
                    <td className="py-2 pr-3 font-mono">{s.loginId ?? "—"}</td>
                    <td className="py-2 pr-3">{s.loginCards.length ? <span className="text-success">Active</span> : <span className="text-ink-muted">No card yet</span>}</td>
                    <td className="py-2 text-right"><RemoveStudentButton classId={cls.id} studentId={s.id} name={s.nickname} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-ink-soft">No students yet. Add their first names below.</p>
        )}
        {students.length < MAX_CLASS_SIZE && <AddStudentsForm classId={cls.id} />}
        <div className="border-t border-line pt-5">
          <h3 className="mb-1 text-lg font-bold">Login cards</h3>
          <p className="mb-3 text-sm text-ink-soft">Each card has a QR code plus a login ID and password. Students scan it or type it on the login page (“I&apos;m a child”). Cards open only the student&apos;s own play area.</p>
          <ClassCards classId={cls.id} studentCount={students.length} />
        </div>
      </Card>

      {/* ---------- Assignments ---------- */}
      <Card id="assignments" className="scroll-mt-4 space-y-5">
        <h2 className="text-2xl font-bold">Assignments</h2>
        <p className="-mt-3 text-sm text-ink-soft">Students see these first, under “From my teacher”. Done = passed (60%+) since you set it.</p>
        <AssignForm classId={cls.id} options={options.map((g) => ({ world: g.world, activities: g.activities.map((a) => ({ slug: a.slug, title: a.title })) }))} />
        {assignments.length === 0 ? (
          <p className="text-ink-soft">Nothing set yet.</p>
        ) : (
          <ul className="space-y-3">
            {assignments.map((a) => {
              const overdue = a.dueAt && a.dueAt < now;
              const todo = a.statuses.filter((s) => s.status !== "done");
              return (
                <li key={a.id} className="rounded-2xl border-2 border-line p-4" aria-label={`Assignment: ${a.activity.title}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">{worldForSubject(a.activity.subjectSlug)?.name}</span>
                    <h3 className="flex-1 text-lg font-bold">{a.activity.title}</h3>
                    {a.dueAt ? <Badge tone={overdue ? "warning" : "neutral"}>{overdue ? "Was due" : "Due"} {fmtDate(a.dueAt)}</Badge> : <Badge>No due date</Badge>}
                    <RemoveAssignmentButton classId={cls.id} assignmentId={a.id} title={a.activity.title} />
                  </div>
                  <ProgressBar className="mt-3" value={students.length ? a.done / students.length : 0} label={`${a.done} of ${students.length} done`} colour="bg-leaf" />
                  <p className="mt-1 text-sm font-semibold">{a.done} of {students.length} done</p>
                  {todo.length > 0 && students.length > 0 && (
                    <p className="mt-1 text-sm text-ink-soft">
                      Still to do: {todo.map((s, i) => <span key={s.id}>{i > 0 && ", "}{s.name}{s.status === "tried" && <span className="text-warning"> (tried)</span>}</span>)}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* ---------- Ranking (teacher only) ---------- */}
      <Card id="ranking" className="scroll-mt-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Ranking</h2>
            <p className="text-sm text-ink-soft">Only you can see this. Students never see rankings.</p>
          </div>
          <div role="group" aria-label="Period" className="flex rounded-full bg-line/60 p-1 text-sm font-bold">
            {(["week", "all"] as const).map((p) => (
              <Link key={p} href={rankHref(p, sort)} aria-current={period === p ? "true" : undefined} className={clsx("rounded-full px-4 py-1.5", period === p ? "bg-ink text-white" : "text-ink-soft")}>
                {p === "week" ? "Last 7 days" : "All time"}
              </Link>
            ))}
          </div>
        </div>
        {ranked.length === 0 ? (
          <p className="text-ink-soft">Add students to see the ranking.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" aria-label={`Class ranking by ${RANK_LABEL[sort].toLowerCase()}`}>
              <thead>
                <tr className="text-ink-muted">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Student</th>
                  {RANK_KEYS.map((k) => (
                    <th key={k} className="py-2 pr-3" aria-sort={k === sort ? "descending" : undefined}>
                      <Link href={rankHref(period, k)} className={clsx("whitespace-nowrap underline-offset-2 hover:underline", k === sort && "font-bold text-ink")}>
                        {RANK_LABEL[k]}{k === sort ? " ▼" : ""}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranked.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="py-2 pr-3 font-display text-lg font-bold">{r.rank}</td>
                    <td className="py-2 pr-3 font-bold">{r.name}</td>
                    <td className="py-2 pr-3">{r.mastered}</td>
                    <td className="py-2 pr-3">{r.assignmentsDone} / {assignments.length}</td>
                    <td className="py-2 pr-3">{r.activities}</td>
                    <td className="py-2 pr-3">{r.accuracy === null ? "—" : `${Math.round(r.accuracy * 100)}%`}</td>
                    <td className="py-2 pr-3">{r.minutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-ink-muted">Click a heading to rank by it. Equal results share a place. “Skills mastered” counts skills mastered {period === "week" ? "and practised in the last 7 days" : "in total"}.</p>
      </Card>
    </div>
  );
}
