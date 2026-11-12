/**
 * Loads and validates the content library from /content (Node only: scripts and tests).
 * Content lives outside the app code so it can be versioned, reviewed and imported
 * without redeploying the application.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { activitySchema, journeySchema, objectivesFileSchema, type ActivityFile, type Journey, type ObjectiveFile } from "./schema";

export interface ContentLibrary {
  objectives: ObjectiveFile[];
  activities: (ActivityFile & { file: string; hash: string })[];
  journeys: (Journey & { hash: string })[];
  errors: string[];
}

const formatIssues = (issues: { path: PropertyKey[]; message: string }[]) =>
  issues.map((i) => `${i.path.map(String).join(".") || "(root)"}: ${i.message}`).join("; ");

export function loadContent(root = path.join(process.cwd(), "content")): ContentLibrary {
  const errors: string[] = [];
  const objectives: ObjectiveFile[] = [];
  const activities: ContentLibrary["activities"] = [];
  const journeys: ContentLibrary["journeys"] = [];

  const objDir = path.join(root, "objectives");
  for (const file of readdirSync(objDir).filter((f) => f.endsWith(".json"))) {
    const parsed = objectivesFileSchema.safeParse(JSON.parse(readFileSync(path.join(objDir, file), "utf8")));
    if (!parsed.success) errors.push(`objectives/${file}: ${formatIssues(parsed.error.issues)}`);
    else objectives.push(...parsed.data.objectives);
  }

  const actDir = path.join(root, "activities");
  for (const file of readdirSync(actDir).filter((f) => f.endsWith(".json"))) {
    const raw = JSON.parse(readFileSync(path.join(actDir, file), "utf8")) as { activities?: unknown[] };
    (raw.activities ?? []).forEach((a, i) => {
      const parsed = activitySchema.safeParse(a);
      const label = `${file}#${(a as { slug?: string })?.slug ?? i}`;
      if (!parsed.success) errors.push(`${label}: ${formatIssues(parsed.error.issues)}`);
      else
        activities.push({
          ...parsed.data,
          file,
          hash: createHash("sha256").update(JSON.stringify(a)).digest("hex").slice(0, 16),
        });
    });
  }

  const jDir = path.join(root, "journeys");
  for (const file of existsSync(jDir) ? readdirSync(jDir).filter((f) => f.endsWith(".json")) : []) {
    const raw = readFileSync(path.join(jDir, file), "utf8");
    const parsed = journeySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) errors.push(`journeys/${file}: ${formatIssues(parsed.error.issues)}`);
    else journeys.push({ ...parsed.data, hash: createHash("sha256").update(raw).digest("hex").slice(0, 16) });
  }

  // Cross-file integrity checks.
  const objByCode = new Map(objectives.map((o) => [o.code, o]));
  const slugs = new Set<string>();
  for (const o of objectives)
    for (const p of o.prerequisites) if (!objByCode.has(p)) errors.push(`objective ${o.code}: unknown prerequisite ${p}`);
  for (const a of activities) {
    const key = `${a.slug}:${a.locale}`;
    if (slugs.has(key)) errors.push(`activity ${a.slug}: duplicate slug`);
    slugs.add(key);
    const o = objByCode.get(a.objective);
    if (!o) errors.push(`activity ${a.slug}: unknown objective ${a.objective}`);
    else if (o.subject !== a.subject || o.ageBand !== a.ageBand)
      errors.push(`activity ${a.slug}: subject/ageBand do not match objective ${o.code}`);
  }
  for (const a of activities)
    if (a.followUp && !activities.some((b) => b.slug === a.followUp))
      errors.push(`activity ${a.slug}: follow-up ${a.followUp} does not exist`);

  for (const j of journeys)
    for (const slug of j.stages.flatMap((s) => s.lessons))
      if (!activities.some((a) => a.slug === slug)) errors.push(`journey ${j.slug}: lesson ${slug} does not exist`);

  return { objectives, activities, journeys, errors };
}
