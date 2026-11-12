import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getOwnedChild, requireParent } from "@/lib/auth/dal";
import { AGE_BANDS, ageFromBirthYear } from "@/lib/age";
import { getChildReport } from "@/lib/learning/queries";
import type { ActivityBody } from "@/lib/content/schema";
import { deleteChild, updateChild } from "@/app/actions/children";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { worldForSubject } from "@/lib/worlds";
import { Avatar } from "@/components/avatar";
import { Badge, Card, ProgressBar } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChildForm } from "@/components/parent/child-form";
import { MasteryBars, WeeklyMinutesChart } from "@/components/parent/charts";
import { SUBJECTS } from "@/lib/content/schema";
import { SUBJECT_LABEL } from "@/lib/worlds";
import { getJourneyView, journeysForBand } from "@/lib/learning/journey";
import { getPlan } from "@/lib/learning/queries";
import { resetJourney } from "@/app/actions/journey";

export const metadata = { title: "Child progress" };

const STATUS: Record<string, { label: string; tone: "success" | "brand" | "warning" | "neutral" }> = {
  MASTERED: { label: "Mastered", tone: "success" },
  PRACTISING: { label: "Practising", tone: "brand" },
  LEARNING: { label: "Learning", tone: "warning" },
  NOT_STARTED: { label: "Not started", tone: "neutral" },
};

export default async function ChildPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; deleteError?: string }> }) {
  const session = await requireParent();
  const { id } = await params;
  const sp = await searchParams;
  const child = await getOwnedChild(session.userId, id);
  if (!child) notFound();

  const [report, objectives, achievements] = await Promise.all([
    getChildReport(child.id),
    db.objective.findMany({ where: { ageBand: child.ageBand }, orderBy: [{ subjectSlug: "asc" }, { code: "asc" }], include: { mappings: { where: { curriculumCode: child.curriculumCode } } } }),
    db.childAchievement.findMany({ where: { childId: child.id }, orderBy: { earnedAt: "desc" } }),
  ]);

  // Look up plain-language descriptions for recurring misconceptions.
  const attentionActivities = await db.activity.findMany({ where: { objectiveCode: { in: report.needsAttention.map((m) => m.objectiveCode) } }, select: { objectiveCode: true, title: true, body: true } });
  const misconceptionText = (objectiveCode: string, code: string | null) => {
    if (!code) return null;
    for (const a of attentionActivities.filter((x) => x.objectiveCode === objectiveCode)) {
      const m = (a.body as unknown as ActivityBody).misconceptions.find((mm) => mm.code === code);
      if (m) return m;
    }
    return null;
  };
  const plan = await getPlan(session.userId);
  const journeyViews = (await Promise.all((await journeysForBand(child.ageBand)).map((j) => getJourneyView(child.id, j.slug, plan)))).filter((v) => v !== null);
  const masteryByCode = new Map(report.masteries.map((m) => [m.objectiveCode, m]));
  const band = AGE_BANDS[child.ageBand];
  const update = updateChild.bind(null, child.id);
  const remove = deleteChild.bind(null, child.id);

  return (
    <div className="space-y-8">
      {sp.created && <p role="status" className="rounded-xl bg-leaf-soft px-4 py-3 font-bold text-success">Profile created! Tap “Let a child play” at the top whenever {child.nickname} is ready.</p>}
      <div className="flex flex-wrap items-center gap-4">
        <Avatar avatar={child.avatar} size="xl" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{child.nickname}</h1>
          <p className="text-ink-muted">About {ageFromBirthYear(child.birthYear)} · {band.name} ({band.ages}) · Goal {child.dailyGoalMinutes} min/day</p>
        </div>
        <Link href={`/parent/children/${child.id}/report`} className="btn-pop rounded-full bg-sun px-5 py-3 font-bold text-ink">📄 Weekly report</Link>
      </div>

      <section aria-labelledby="week-title">
        <h2 id="week-title" className="mb-3 text-xl font-bold">The last 7 days</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ["Learning time", `${report.minutesThisWeek} min`],
            ["Days active", `${report.activeDays} of 7`],
            ["Activities", String(report.activitiesThisWeek)],
            ["First-try accuracy", report.accuracy === null ? "—" : `${Math.round(report.accuracy * 100)}%`],
          ].map(([k, v]) => (
            <Card key={k} className="p-4"><p className="text-sm font-bold text-ink-muted">{k}</p><p className="font-display text-3xl font-bold">{v}</p></Card>
          ))}
        </div>
      </section>

      {journeyViews.map((v) => (
        <Card key={v.journey.slug} className="flex flex-wrap items-center gap-4">
          <span className="text-3xl" aria-hidden>📖</span>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold">{v.journey.title}</h2>
            {v.progress ? (
              <p className="text-ink-soft">
                {v.current ? <>On <strong>lesson {v.current} of {v.total}</strong> ({v.lessons[v.current - 1]?.title}). </> : <>Finished all {v.total} lessons. </>}
                {v.progress.placedAt ? `Started at lesson ${v.progress.startLesson} after the placement check.` : "Started from the beginning."} {v.progress.completed.length} lesson(s) passed.
              </p>
            ) : (
              <p className="text-ink-soft">Not started yet. {child.nickname} can begin from lesson 1 or take a short placement check.</p>
            )}
            {v.progress && <ProgressBar className="mt-2 h-2 max-w-md" value={(v.current ? v.current - 1 : v.total) / v.total} label={`${v.journey.title} progress`} colour="bg-leaf" />}
          </div>
          {v.progress && (
            <form action={resetJourney.bind(null, child.id, v.journey.slug)}>
              <Button type="submit" variant="secondary" size="sm">Reset journey</Button>
            </form>
          )}
        </Card>
      ))}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card><WeeklyMinutesChart daily={report.daily} goal={child.dailyGoalMinutes} /></Card>
        <Card>
          <MasteryBars
            rows={SUBJECTS.filter((subject) => objectives.some((o) => o.subjectSlug === subject)).map((subject) => {
              const objs = objectives.filter((o) => o.subjectSlug === subject);
              const counts: Record<string, number> = {};
              for (const o of objs) {
                const st = masteryByCode.get(o.code)?.status ?? "NOT_STARTED";
                counts[st] = (counts[st] ?? 0) + 1;
              }
              return { label: SUBJECT_LABEL[subject], counts, total: Math.max(objs.length, 1) };
            })}
          />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold">Strengths</h2>
          {report.strengths.length ? (
            <ul className="mt-3 space-y-2">
              {report.strengths.map((m) => <li key={m.id} className="flex items-center gap-2"><span aria-hidden>🌟</span>{m.objective.title}</li>)}
            </ul>
          ) : <p className="mt-2 text-ink-soft">Strengths appear after a few activities.</p>}
        </Card>
        <Card id="attention">
          <h2 className="text-xl font-bold">Needs attention</h2>
          {report.needsAttention.length ? (
            <ul className="mt-3 space-y-4">
              {report.needsAttention.map((m) => {
                const mis = misconceptionText(m.objectiveCode, m.topMisconception);
                return (
                  <li key={m.id}>
                    <p className="font-bold">{m.objective.title}</p>
                    {mis ? (
                      <p className="text-sm text-ink-soft">Common slip: {mis.description} <span className="font-semibold text-ink">Try at home:</span> {mis.remedy}</p>
                    ) : <p className="text-sm text-ink-soft">More practice will help. The app will bring this back at the right level.</p>}
                  </li>
                );
              })}
            </ul>
          ) : <p className="mt-2 text-ink-soft">Nothing flagged. We&apos;ll highlight skills here if {child.nickname} finds something tricky.</p>}
          {report.dueForReview.length > 0 && <p className="mt-4 text-sm text-ink-muted">{report.dueForReview.length} skill(s) are due for a quick review — they&apos;ll be suggested first next time.</p>}
        </Card>
      </div>

      <section aria-labelledby="skills-title">
        <h2 id="skills-title" className="mb-3 text-xl font-bold">Skills by subject</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          {report.bySubject.filter((s) => objectives.some((o) => o.subjectSlug === s.subject)).map((s) => {
            const world = worldForSubject(s.subject);
            const objs = objectives.filter((o) => o.subjectSlug === s.subject);
            return (
              <Card key={s.subject}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">{world?.emoji} {SUBJECT_LABEL[s.subject]}</h3>
                  <span className="text-sm text-ink-muted">{s.mastered} of {objs.length} mastered · {s.minutes} min this week</span>
                </div>
                <ul className="mt-4 space-y-3">
                  {objs.map((o) => {
                    const m = masteryByCode.get(o.code);
                    const st = STATUS[m?.status ?? "NOT_STARTED"];
                    return (
                      <li key={o.code}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold leading-snug">{o.title}</p>
                            {o.mappings[0] && <p className="text-xs text-ink-muted">{o.mappings[0].reference}</p>}
                          </div>
                          <Badge tone={st.tone}>{st.label}</Badge>
                        </div>
                        {m && <ProgressBar className="mt-1.5 h-2" value={m.score} label={`${o.title} progress`} colour={m.status === "MASTERED" ? "bg-[#1e8f57]" : m.status === "PRACTISING" ? "bg-[#4cbb82]" : "bg-[#a6e0bf]"} />}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold">Recent activity</h2>
          {report.recent.length ? (
            <ul className="mt-3 divide-y divide-line">
              {report.recent.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span><span className="font-semibold">{a.activity.title}</span> <span className="text-ink-muted">· {a.startedAt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</span></span>
                  <span className="whitespace-nowrap text-ink-muted">{a.correctCount}/{a.totalCount} · level {a.endLevel ?? a.startLevel}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-ink-soft">No activities in the last 7 days.</p>}
        </Card>
        <Card>
          <h2 className="text-xl font-bold">Achievements</h2>
          {achievements.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {achievements.map((a) => {
                const def = ACHIEVEMENTS[a.code as keyof typeof ACHIEVEMENTS];
                return def ? <li key={a.id} className="rounded-full bg-sun-soft px-3 py-1 text-sm font-bold" title={def.description}>{def.emoji} {def.title}</li> : null;
              })}
            </ul>
          ) : <p className="mt-2 text-ink-soft">Achievements celebrate effort and persistence. They&apos;ll appear here.</p>}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-xl font-bold">Edit profile</h2>
          <ChildForm action={update} submitLabel="Save changes" initial={{ nickname: child.nickname, birthYear: child.birthYear, dailyGoalMinutes: child.dailyGoalMinutes, interests: child.interests, narration: child.narration, soundEffects: child.soundEffects, textSize: child.textSize, dailyLimitMinutes: child.dailyLimitMinutes }} />
        </Card>
        <Card className="border-danger/30">
          <h2 className="text-xl font-bold text-danger">Delete profile</h2>
          <p className="mt-2 text-ink-soft">This permanently deletes {child.nickname}&apos;s profile and all learning records. This cannot be undone.</p>
          <form action={remove} className="mt-4 space-y-3">
            <label htmlFor="confirm" className="block text-sm font-bold">Type <span className="font-mono">{child.nickname}</span> to confirm</label>
            <input id="confirm" name="confirm" required autoComplete="off" className="block w-full rounded-xl border-2 border-line px-4 py-3" aria-invalid={!!sp.deleteError} />
            {sp.deleteError && <p className="text-sm font-semibold text-danger" role="alert">The name didn&apos;t match, so nothing was deleted.</p>}
            <Button variant="danger" type="submit">Delete permanently</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
