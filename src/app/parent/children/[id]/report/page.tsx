import Link from "next/link";
import { notFound } from "next/navigation";
import { getOwnedChild, requireParent } from "@/lib/auth/dal";
import { getWeeklyReport } from "@/lib/learning/report";
import { addWeeks, changeLabel, isoDate, parseWeek, startOfWeek } from "@/lib/learning/week";
import { SUBJECT_LABEL } from "@/lib/worlds";
import { Avatar } from "@/components/avatar";
import { Badge, Card, ProgressBar } from "@/components/ui/card";
import { WeeklyMinutesChart } from "@/components/parent/charts";
import { PrintButton } from "@/components/parent/print-button";

export const metadata = { title: "Weekly report" };

const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

export default async function WeeklyReportPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ week?: string }> }) {
  const session = await requireParent();
  const { id } = await params;
  const { week } = await searchParams;
  const child = await getOwnedChild(session.userId, id);
  if (!child) notFound();

  const weekStart = parseWeek(week);
  const r = await getWeeklyReport(child.id, weekStart);
  const isCurrent = weekStart.getTime() === startOfWeek(new Date()).getTime();
  const lastDay = new Date(r.weekEnd.getTime() - 86_400_000);
  const goal = child.dailyGoalMinutes * 7;

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/parent/children/${child.id}`} className="text-sm font-bold text-brand">← {child.nickname}&apos;s progress</Link>
        <nav aria-label="Choose week" className="flex items-center gap-2">
          <Link href={`?week=${isoDate(addWeeks(weekStart, -1))}`} className="rounded-full border-2 border-line bg-surface px-3 py-1.5 text-sm font-bold hover:border-brand">← Previous week</Link>
          {!isCurrent && <Link href={`?week=${isoDate(addWeeks(weekStart, 1))}`} className="rounded-full border-2 border-line bg-surface px-3 py-1.5 text-sm font-bold hover:border-brand">Next week →</Link>}
          <PrintButton />
        </nav>
      </div>

      <header className="flex flex-wrap items-center gap-4">
        <Avatar avatar={child.avatar} size="lg" />
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-ink-muted">Weekly learning report</p>
          <h1 className="text-3xl font-bold">{child.nickname} · {fmt(weekStart)} – {fmt(lastDay)}</h1>
          {isCurrent && <p className="text-sm text-ink-muted">This week so far</p>}
        </div>
      </header>

      {r.totals.activities === 0 ? (
        <Card className="py-10 text-center">
          <p className="text-4xl" aria-hidden>🌱</p>
          <h2 className="mt-2 text-xl font-bold">No learning recorded this week</h2>
          <p className="mx-auto mt-1 max-w-md text-ink-soft">That&apos;s completely fine — rest weeks happen. When {child.nickname} plays, this report fills in automatically.</p>
          <Link href="?" className="mt-4 inline-block font-bold text-brand underline">Go to this week</Link>
        </Card>
      ) : (
        <>
          <section aria-labelledby="summary-title">
            <h2 id="summary-title" className="sr-only">Summary</h2>
            <div className="grid gap-3 sm:grid-cols-4">
              <Card className="p-4"><p className="text-sm font-bold text-ink-muted">Learning time</p><p className="font-display text-3xl font-bold">{r.totals.minutes} min</p><p className="text-xs text-ink-muted">{changeLabel(r.totals.minutes, r.totals.prevMinutes, "min")}</p></Card>
              <Card className="p-4"><p className="text-sm font-bold text-ink-muted">Days active</p><p className="font-display text-3xl font-bold">{r.totals.activeDays} of 7</p><p className="text-xs text-ink-muted">Goal: {child.dailyGoalMinutes} min a day</p></Card>
              <Card className="p-4"><p className="text-sm font-bold text-ink-muted">Activities</p><p className="font-display text-3xl font-bold">{r.totals.activities}</p><p className="text-xs text-ink-muted">{changeLabel(r.totals.activities, r.totals.prevActivities, "")}</p></Card>
              <Card className="p-4"><p className="text-sm font-bold text-ink-muted">First-try accuracy</p><p className="font-display text-3xl font-bold">{pct(r.totals.accuracy)}</p><p className="text-xs text-ink-muted">Week before: {pct(r.totals.prevAccuracy)}</p></Card>
            </div>
            <ProgressBar className="mt-3 h-2" value={r.totals.minutes / goal} label="Weekly goal" colour="bg-leaf" />
            <p className="mt-1 text-xs text-ink-muted">{r.totals.minutes} of {goal} minutes weekly goal</p>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card><WeeklyMinutesChart daily={r.daily} goal={child.dailyGoalMinutes} /></Card>
            <Card>
              <h2 className="mb-3 font-bold">By subject</h2>
              <table className="w-full text-left text-sm">
                <thead className="text-ink-muted"><tr><th className="pb-2">Subject</th><th className="pb-2">Time</th><th className="pb-2">Activities</th><th className="pb-2">Accuracy</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {r.subjects.map((s) => (
                    <tr key={s.subject}><td className="py-2 font-semibold">{SUBJECT_LABEL[s.subject] ?? s.subject}</td><td>{s.minutes} min</td><td>{s.activities}</td><td>{pct(s.accuracy)}</td></tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          <Card>
            <h2 className="text-xl font-bold">What {child.nickname} learned</h2>
            <ul className="mt-3 space-y-2">
              {r.practised.map((p) => (
                <li key={p.code} className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2 last:border-0">
                  <span><span className="font-semibold">{p.title}</span> <span className="text-sm text-ink-muted">· {SUBJECT_LABEL[p.subject]} · {p.activities} activit{p.activities === 1 ? "y" : "ies"}</span></span>
                  <Badge tone={p.status === "MASTERED" ? "success" : p.weekAccuracy >= 0.75 ? "brand" : p.weekAccuracy < 0.6 ? "warning" : "neutral"}>
                    {p.status === "MASTERED" ? "Mastered" : p.weekAccuracy >= 0.75 ? "Going well" : p.weekAccuracy < 0.6 ? "Needs practice" : "Practising"} · {pct(p.weekAccuracy)}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <h2 className="text-xl font-bold">🌟 Highlights</h2>
              <ul className="mt-3 space-y-2 text-ink-soft">
                {r.mastered.map((m) => <li key={m.code}>⭐ Mastered <strong className="text-ink">{m.childTitle}</strong></li>)}
                {r.goingWell.slice(0, 3).map((m) => <li key={m.code}>🌱 Strong progress in <strong className="text-ink">{m.childTitle}</strong></li>)}
                {r.stickers.length > 0 && <li>📒 Earned {r.stickers.length} sticker{r.stickers.length > 1 ? "s" : ""}: {r.stickers.map((s) => s.emoji).join(" ")}</li>}
                {r.achievements.map((a) => <li key={a.title}>{a.emoji} {a.title}: {a.description}</li>)}
                {r.mastered.length + r.goingWell.length + r.stickers.length + r.achievements.length === 0 && <li>Every activity builds skills. Highlights appear as skills grow.</li>}
              </ul>
            </Card>
            <Card>
              <h2 className="text-xl font-bold">🎯 Needs practice</h2>
              {r.needsPractice.length ? (
                <ul className="mt-3 space-y-3">
                  {r.needsPractice.slice(0, 3).map((p) => (
                    <li key={p.code}>
                      <p className="font-semibold">{p.title}</p>
                      {p.tip ? <p className="text-sm text-ink-soft">Common slip: {p.tip.description} <strong className="text-ink">Try at home:</strong> {p.tip.remedy}</p> : <p className="text-sm text-ink-soft">A little more practice will help; Muchi will bring this back at an easier level.</p>}
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-ink-soft">Nothing stood out as difficult this week. 🎉</p>}
              {r.dueForReview > 0 && <p className="mt-3 text-sm text-ink-muted">{r.dueForReview} skill(s) are due for a quick review, and they&apos;ll be suggested first.</p>}
            </Card>
          </div>
        </>
      )}

      <p className="text-xs text-ink-muted">
        This report describes the activities {child.nickname} completed and the skills practised in them. It is not a test score and does not measure intelligence or predict grades.
      </p>
    </div>
  );
}
