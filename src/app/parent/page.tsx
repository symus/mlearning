import Link from "next/link";
import { db } from "@/lib/db";
import { requireParent } from "@/lib/auth/dal";
import { AGE_BANDS, ageFromBirthYear } from "@/lib/age";
import { getChildReport, getPlan } from "@/lib/learning/queries";
import { PLAN_FEATURES } from "@/lib/pricing";
import { Avatar } from "@/components/avatar";
import { Badge, Card, ProgressBar } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Muchi } from "@/components/mascot";
import { WeeklyMinutesChart } from "@/components/parent/charts";

export const metadata = { title: "Parent overview" };

export default async function ParentHome({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const session = await requireParent();
  const sp = await searchParams;
  const [children, plan] = await Promise.all([
    db.childProfile.findMany({ where: { parentId: session.userId }, orderBy: { createdAt: "asc" } }),
    getPlan(session.userId),
  ]);
  const reports = await Promise.all(children.map((c) => getChildReport(c.id)));

  return (
    <div className="space-y-8">
      {sp.deleted && <p role="status" className="rounded-xl bg-leaf-soft px-4 py-3 font-bold text-success">The profile and its learning data were deleted.</p>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-ink-muted">Hello, {session.user.displayName}</p>
          <h1 className="text-3xl font-bold">Your family&apos;s learning</h1>
        </div>
        <Badge tone="brand">{PLAN_FEATURES[plan].name} plan</Badge>
      </div>

      {children.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 py-12 text-center">
          <Muchi className="size-24" />
          <h2 className="text-2xl font-bold">Add your first child</h2>
          <p className="max-w-md text-ink-soft">Create a profile with just a nickname and birth year. We&apos;ll choose the right learning experience for their age.</p>
          <ButtonLink href="/parent/children/new" size="lg">Add a child</ButtonLink>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {children.map((child, i) => {
            const r = reports[i];
            const band = AGE_BANDS[child.ageBand];
            const goal = child.dailyGoalMinutes * 7;
            return (
              <Card key={child.id} className="space-y-5">
                <div className="flex items-center gap-4">
                  <Avatar avatar={child.avatar} size="lg" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-2xl font-bold">{child.nickname}</h2>
                    <p className="text-sm text-ink-muted">About {ageFromBirthYear(child.birthYear)} · {band.name}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 sm:flex-row">
                    <ButtonLink href={`/parent/children/${child.id}`} variant="secondary" size="sm">Progress</ButtonLink>
                    <ButtonLink href={`/parent/children/${child.id}/report`} variant="secondary" size="sm">Weekly report</ButtonLink>
                  </div>
                </div>
                <dl className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-paper p-3"><dt className="text-xs font-bold text-ink-muted">This week</dt><dd className="font-display text-2xl font-bold">{r.minutesThisWeek}<span className="text-sm"> min</span></dd></div>
                  <div className="rounded-xl bg-paper p-3"><dt className="text-xs font-bold text-ink-muted">Activities</dt><dd className="font-display text-2xl font-bold">{r.activitiesThisWeek}</dd></div>
                  <div className="rounded-xl bg-paper p-3"><dt className="text-xs font-bold text-ink-muted">Skills mastered</dt><dd className="font-display text-2xl font-bold">{r.mastered}</dd></div>
                </dl>
                <div>
                  <div className="mb-2 flex justify-between text-sm"><span className="font-bold">Last 7 days</span><span className="text-ink-muted">{r.minutesThisWeek} of {goal} min weekly goal</span></div>
                  <WeeklyMinutesChart daily={r.daily} goal={child.dailyGoalMinutes} compact />
                  <ProgressBar className="mt-3 h-2" value={r.minutesThisWeek / goal} label={`${child.nickname}'s weekly goal`} colour="bg-leaf" />
                </div>
                {r.needsAttention.length > 0 ? (
                  <p className="rounded-xl bg-sun-soft px-4 py-3 text-sm">
                    <span className="font-bold">Worth a look:</span> {r.needsAttention[0].objective.title.toLowerCase()}.{" "}
                    <Link href={`/parent/children/${child.id}#attention`} className="font-bold text-brand underline">See why</Link>
                  </p>
                ) : r.totalCompleted === 0 ? (
                  <p className="rounded-xl bg-brand-soft px-4 py-3 text-sm">No activities yet. Tap <span className="font-bold">Let a child play</span> to start their first adventure.</p>
                ) : (
                  <p className="rounded-xl bg-leaf-soft px-4 py-3 text-sm text-success">Nothing needs attention right now. Lovely steady progress!</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
