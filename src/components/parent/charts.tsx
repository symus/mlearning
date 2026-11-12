/**
 * Parent dashboard charts. Pure server-rendered HTML/CSS (no chart library):
 * thin rounded bars, recessive grid, hover/focus tooltips, legends, and a table view.
 */
import clsx from "clsx";

const dayLabel = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short" });
const fullDate = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

/** Single series: learning minutes per day, with the daily goal as a dashed reference line. */
export function WeeklyMinutesChart({ daily, goal, compact = false }: { daily: { date: Date; minutes: number }[]; goal: number; compact?: boolean }) {
  const max = Math.max(goal * 1.25, ...daily.map((d) => d.minutes), 1);
  const height = compact ? 72 : 150;
  const goalPct = (goal / max) * 100;
  return (
    <figure className="w-full">
      {!compact && (
        <figcaption className="mb-3 flex items-baseline justify-between gap-2">
          <span className="font-bold">Learning minutes per day</span>
          <span className="text-xs text-ink-muted">Dashed line: daily goal ({goal} min)</span>
        </figcaption>
      )}
      <div className="relative" style={{ height }}>
        {/* recessive baseline + goal reference line */}
        <div className="absolute inset-x-0 bottom-0 border-b border-line" aria-hidden />
        <div className="absolute inset-x-0 border-t-2 border-dashed border-ink-muted/40" style={{ bottom: `${goalPct}%` }} aria-hidden>
          {!compact && <span className="absolute -top-5 right-0 text-[11px] font-bold text-ink-muted">goal</span>}
        </div>
        <ol className="absolute inset-0 flex items-end gap-2 sm:gap-3" aria-hidden>
          {daily.map((d) => {
            const pct = (d.minutes / max) * 100;
            const met = d.minutes >= goal;
            return (
              <li key={d.date.toISOString()} className="group relative flex h-full flex-1 items-end justify-center">
                <span
                  tabIndex={compact ? -1 : 0}
                  className={clsx("block w-full max-w-7 rounded-t-[4px] outline-none transition-[filter] group-hover:brightness-110", met ? "bg-leaf" : "bg-brand/80", d.minutes === 0 && "bg-transparent")}
                  style={{ height: `${Math.max(pct, d.minutes > 0 ? 3 : 0)}%` }}
                />
                {!compact && (
                  <span className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg group-focus-within:block group-hover:block">
                    <span className="block font-bold">{d.minutes} min</span>
                    {fullDate(d.date)}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
      <ol className="mt-1.5 flex gap-2 sm:gap-3" aria-hidden>
        {daily.map((d) => (
          <li key={d.date.toISOString()} className="flex-1 text-center text-[11px] font-semibold text-ink-muted">{dayLabel(d.date)}</li>
        ))}
      </ol>
      <table className="sr-only">
        <caption>Learning minutes per day, goal {goal} minutes</caption>
        <thead><tr><th>Day</th><th>Minutes</th></tr></thead>
        <tbody>{daily.map((d) => <tr key={d.date.toISOString()}><td>{fullDate(d.date)}</td><td>{d.minutes}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

/** Ordinal states use one hue, light -> dark (more mastery = darker), plus a neutral for "not started". */
export const MASTERY_STATES = [
  { key: "MASTERED", label: "Mastered", colour: "#1e8f57" },
  { key: "PRACTISING", label: "Practising", colour: "#4cbb82" },
  { key: "LEARNING", label: "Learning", colour: "#a6e0bf" },
  { key: "NOT_STARTED", label: "Not started", colour: "#e4ddd0" },
] as const;

export function MasteryBars({ rows }: { rows: { label: string; counts: Record<string, number>; total: number }[] }) {
  return (
    <figure>
      <figcaption className="mb-3 font-bold">Skills by status</figcaption>
      <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-ink-soft" aria-label="Legend">
        {MASTERY_STATES.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5"><span className="size-3 rounded-[3px]" style={{ background: s.colour }} aria-hidden />{s.label}</li>
        ))}
      </ul>
      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex justify-between text-sm"><span className="font-bold">{r.label}</span><span className="text-ink-muted">{r.counts.MASTERED ?? 0} of {r.total} mastered</span></div>
            <div className="flex h-5 w-full gap-[2px] overflow-visible" aria-hidden>
              {MASTERY_STATES.filter((s) => (r.counts[s.key] ?? 0) > 0).map((s, i, arr) => (
                <span
                  key={s.key}
                  tabIndex={0}
                  className={clsx("group relative block h-full outline-none", i === 0 && "rounded-l-[4px]", i === arr.length - 1 && "rounded-r-[4px]")}
                  style={{ width: `${((r.counts[s.key] ?? 0) / r.total) * 100}%`, background: s.colour }}
                >
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg group-focus:block group-hover:block">
                    <span className="font-bold">{r.counts[s.key]}</span> {s.label.toLowerCase()}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <table className="sr-only">
        <caption>Skills by status</caption>
        <thead><tr><th>Subject</th>{MASTERY_STATES.map((s) => <th key={s.key}>{s.label}</th>)}</tr></thead>
        <tbody>{rows.map((r) => <tr key={r.label}><td>{r.label}</td>{MASTERY_STATES.map((s) => <td key={s.key}>{r.counts[s.key] ?? 0}</td>)}</tr>)}</tbody>
      </table>
    </figure>
  );
}
