import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AGE_BANDS } from "@/lib/age";
import type { ActivityBody } from "@/lib/content/schema";
import { setActivityStatus } from "@/app/actions/admin";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Visual } from "@/components/child/visual";

const CHECKLIST = [
  "Facts and answers are correct (checked independently).",
  "Language and examples are age-appropriate and culturally inclusive.",
  "Hints guide thinking without giving the answer away.",
  "Each misconception is real and its remedy is helpful.",
  "Visuals have text alternatives; nothing relies on colour alone.",
  "Content is original (no copied textbook material).",
];

export default async function ReviewActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await db.activity.findUnique({ where: { id }, include: { objective: { include: { mappings: true } }, reviewedBy: true } });
  if (!a) notFound();
  const body = a.body as unknown as ActivityBody;
  const act = (d: "publish" | "draft" | "archive" | "review") => setActivityStatus.bind(null, a.id, d);

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm font-bold text-brand">← All content</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{a.title}</h1>
          <p className="text-ink-muted">{AGE_BANDS[a.ageBand].name} · {a.subjectSlug} · {a.topic} › {a.subtopic} · v{a.version} · ~{a.estimatedMinutes} min {a.isFree && "· free plan"}</p>
        </div>
        <Badge tone={a.status === "PUBLISHED" ? "success" : a.status === "IN_REVIEW" ? "warning" : "neutral"}>{a.status}</Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <Card>
            <h2 className="font-bold">Objective</h2>
            <p>{a.objective.code} — {a.objective.title}</p>
            <p className="text-sm text-ink-muted">Prerequisites: {a.objective.prerequisites.join(", ") || "none"} · Mastery: {Math.round(body.mastery.minAccuracy * 100)}% over ≥{body.mastery.minItems} items at level ≥{body.mastery.atLevel}</p>
            <ul className="mt-2 text-sm text-ink-soft">{a.objective.mappings.map((m) => <li key={m.id}>{m.curriculumCode}: {m.reference}</li>)}</ul>
          </Card>
          <Card className="space-y-3">
            <h2 className="font-bold">Explanation</h2>
            {body.learn.visual && <div className="flex justify-center"><Visual visual={body.learn.visual} /></div>}
            <p>{body.learn.text}</p>
            {body.learn.example && <p className="rounded-xl bg-sun-soft px-3 py-2">{body.learn.example}</p>}
          </Card>
          {body.levels.map((l) => (
            <Card key={l.level}>
              <h2 className="font-bold">Level {l.level}: {l.label}</h2>
              <ol className="mt-3 space-y-4">
                {l.items.map((it) => (
                  <li key={it.id} className="rounded-xl border border-line p-4">
                    <p className="font-bold">{it.prompt} <span className="font-mono text-xs font-normal text-ink-muted">[{it.type} · {it.id}]</span></p>
                    {it.visual && <div className="my-2 flex justify-center"><Visual visual={it.visual} /></div>}
                    {it.type === "choice" && <p className="text-sm">Options: {it.options.map((o) => `${o.id === it.answer ? "✅ " : ""}${o.label}`).join(" · ")}</p>}
                    {it.type === "number" && <p className="text-sm">Answer: ✅ {it.answer} {it.unit}</p>}
                    {it.type === "order" && <p className="text-sm">Order: ✅ {it.answer.map((id) => it.tiles.find((t) => t.id === id)?.label).join(" → ")}</p>}
                    <p className="text-sm text-ink-soft">Hints: {it.hints.join(" / ")}</p>
                    <p className="text-sm text-ink-soft">Explanation: {it.explanation}</p>
                    {it.misconceptions && <p className="text-sm text-ink-soft">Wrong-answer map: {Object.entries(it.misconceptions).map(([k, v]) => `${k} → ${v}`).join(", ")}</p>}
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
        <div className="space-y-5">
          <Card>
            <h2 className="font-bold">Misconceptions</h2>
            <ul className="mt-2 space-y-2 text-sm">{body.misconceptions.map((m) => <li key={m.code}><span className="font-mono font-bold">{m.code}</span>: {m.description} <em className="text-ink-soft">Remedy: {m.remedy}</em></li>)}</ul>
            <p className="mt-3 text-sm">Follow-up: {body.followUp ?? "—"}</p>
          </Card>
          <Card>
            <h2 className="font-bold">Review checklist</h2>
            <ul className="mt-2 space-y-1 text-sm text-ink-soft">{CHECKLIST.map((c) => <li key={c}>☐ {c}</li>)}</ul>
            {a.reviewedBy && <p className="mt-3 text-sm">Last approved by {a.reviewedBy.displayName} on {a.reviewedAt?.toLocaleDateString("en-GB")}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {a.status !== "PUBLISHED" && <form action={act("publish")}><Button type="submit">Approve & publish</Button></form>}
              {a.status !== "DRAFT" && <form action={act("draft")}><Button type="submit" variant="secondary">Return to draft</Button></form>}
              {a.status === "DRAFT" && <form action={act("review")}><Button type="submit" variant="secondary">Send to review</Button></form>}
              {a.status !== "ARCHIVED" && <form action={act("archive")}><Button type="submit" variant="ghost">Archive</Button></form>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
