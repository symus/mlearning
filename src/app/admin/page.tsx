import Link from "next/link";
import type { ContentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { AGE_BANDS } from "@/lib/age";
import { Badge, Card } from "@/components/ui/card";

export const metadata = { title: "Content review" };

const TONE: Record<ContentStatus, "success" | "warning" | "neutral" | "danger"> = { PUBLISHED: "success", IN_REVIEW: "warning", DRAFT: "neutral", ARCHIVED: "danger" };
const STATUSES: ContentStatus[] = ["IN_REVIEW", "PUBLISHED", "DRAFT", "ARCHIVED"];

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status);
  const [activities, counts] = await Promise.all([
    db.activity.findMany({ where: status ? { status } : {}, orderBy: [{ ageBand: "asc" }, { subjectSlug: "asc" }, { pathOrder: "asc" }], include: { reviewedBy: { select: { displayName: true } } } }),
    db.activity.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s: ContentStatus) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content library</h1>
        <p className="mt-1 text-ink-soft">Content is authored as files in <code className="rounded bg-line/60 px-1">/content</code>, imported with <code className="rounded bg-line/60 px-1">npm run content:import</code>, and must be reviewed here before children see it.</p>
      </div>
      <nav className="flex flex-wrap gap-2" aria-label="Filter by status">
        <Link href="/admin" className={`rounded-full px-4 py-2 text-sm font-bold ${!status ? "bg-ink text-white" : "bg-surface"}`}>All ({activities.length && !status ? activities.length : counts.reduce((n, c) => n + c._count, 0)})</Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin?status=${s}`} className={`rounded-full px-4 py-2 text-sm font-bold ${status === s ? "bg-ink text-white" : "bg-surface"}`}>{s.replace("_", " ").toLowerCase()} ({count(s)})</Link>
        ))}
      </nav>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line bg-paper text-ink-muted">
            <tr><th className="px-4 py-3">Activity</th><th className="px-4 py-3">Age group</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Objective</th><th className="px-4 py-3">Version</th><th className="px-4 py-3">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {activities.map((a) => (
              <tr key={a.id} className="hover:bg-paper">
                <td className="px-4 py-3"><Link href={`/admin/activity/${a.id}`} className="font-bold text-brand hover:underline">{a.title}</Link><div className="text-xs text-ink-muted">{a.slug}</div></td>
                <td className="px-4 py-3">{AGE_BANDS[a.ageBand].name}</td>
                <td className="px-4 py-3 capitalize">{a.subjectSlug}</td>
                <td className="px-4 py-3 font-mono text-xs">{a.objectiveCode}</td>
                <td className="px-4 py-3">v{a.version}</td>
                <td className="px-4 py-3"><Badge tone={TONE[a.status]}>{a.status.replace("_", " ").toLowerCase()}</Badge>{a.reviewedBy && <div className="mt-1 text-xs text-ink-muted">by {a.reviewedBy.displayName}</div>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
