import Link from "next/link";
import { db } from "@/lib/db";
import { requireTeacher } from "@/lib/auth/dal";
import { AGE_BANDS } from "@/lib/age";
import { MAX_CLASSES } from "@/lib/pricing";
import { Badge, Card } from "@/components/ui/card";
import { Muchi } from "@/components/mascot";
import { CreateClassForm } from "@/components/teacher/forms";

export const metadata = { title: "My classes" };

export default async function TeacherHome({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const session = await requireTeacher();
  const sp = await searchParams;
  const [user, classes] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: session.userId }, select: { schoolName: true } }),
    db.classroom.findMany({
      where: { teacherId: session.userId, archivedAt: null },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { students: true, assignments: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-ink-muted">{user.schoolName}</p>
          <h1 className="text-3xl font-bold">My classes</h1>
        </div>
        <Badge tone="brand">School pilot · free</Badge>
      </div>

      {sp.welcome && (
        <Card className="flex flex-col items-center gap-3 bg-brand-soft/50 text-center sm:flex-row sm:text-left">
          <Muchi className="size-20 shrink-0" />
          <div>
            <h2 className="text-xl font-bold">Welcome, {session.user.displayName}!</h2>
            <p className="text-ink-soft">Three steps: create a class, add your students&apos; first names, then print their login cards. You can set activities and follow progress from the class page.</p>
          </div>
        </Card>
      )}

      {classes.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <li key={c.id}>
              <Link href={`/teacher/classes/${c.id}`} className="block h-full rounded-3xl border-2 border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-brand">
                <h2 className="text-xl font-bold">{c.name}</h2>
                <p className="text-sm text-ink-muted">{AGE_BANDS[c.ageBand].name} · ages {AGE_BANDS[c.ageBand].ages}</p>
                <p className="mt-3 text-sm font-semibold">{c._count.students} students · {c._count.assignments} assignments</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {classes.length < MAX_CLASSES && (
        <Card className="max-w-lg">
          <h2 className="mb-4 text-xl font-bold">{classes.length ? "Create another class" : "Create your first class"}</h2>
          <CreateClassForm />
        </Card>
      )}
    </div>
  );
}
