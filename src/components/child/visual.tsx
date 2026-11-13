import clsx from "clsx";
import type { Visual as VisualSpec } from "@/lib/content/schema";

/** Renders the visual models used by explanations and items. Pure SVG/CSS so it works offline. */
export function Visual({ visual, className }: { visual: VisualSpec; className?: string }) {
  switch (visual.kind) {
    case "objects":
      return (
        <div className={clsx("flex flex-wrap justify-center gap-2 text-5xl sm:text-6xl", className)} role="img" aria-label={`${visual.count} ${visual.emoji}`}>
          {Array.from({ length: visual.count }, (_, i) => <span key={i} aria-hidden>{visual.emoji}</span>)}
        </div>
      );
    case "groups":
      return (
        <div className={clsx("flex flex-wrap items-center justify-center gap-4", className)} role="img" aria-label={visual.groups.map((g) => `${g.count} ${g.emoji}`).join(` ${visual.operator ?? "and"} `)}>
          {visual.groups.map((g, i) => (
            <div key={i} className="flex items-center gap-4">
              {i > 0 && <span className="font-display text-4xl font-bold text-ink-muted" aria-hidden>{visual.operator === "and" ? "&" : visual.operator ?? "&"}</span>}
              <div className="flex max-w-56 flex-wrap justify-center gap-1 rounded-2xl bg-paper p-3 text-4xl" aria-hidden>
                {Array.from({ length: g.count }, (_, j) => <span key={j}>{g.emoji}</span>)}
              </div>
            </div>
          ))}
        </div>
      );
    case "tenFrame": {
      const frames = visual.filled > 10 ? 2 : 1;
      return (
        <div className={clsx("flex flex-wrap justify-center gap-4", className)} role="img" aria-label={`Ten frame with ${visual.filled} counters`}>
          {Array.from({ length: frames }, (_, f) => (
            <div key={f} className="grid grid-cols-5 gap-1.5 rounded-xl border-4 border-ink bg-white p-1.5">
              {Array.from({ length: 10 }, (_, i) => {
                const filled = f * 10 + i < visual.filled;
                return (
                  <span key={i} className="grid size-11 place-items-center border-2 border-ink/20 sm:size-12">
                    {filled && <span className="size-8 rounded-full bg-coral sm:size-9" />}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      );
    }
    case "numberLine": {
      const span = visual.to - visual.from;
      const ticks = Array.from({ length: span + 1 }, (_, i) => visual.from + i);
      const x = (n: number) => 20 + ((n - visual.from) / span) * 560;
      const jumps = visual.jumps ?? [];
      const start = visual.mark ?? visual.from;
      const points = [start, ...jumps];
      return (
        <svg viewBox="0 0 600 110" className={clsx("w-full max-w-2xl", className)} role="img" aria-label={`Number line from ${visual.from} to ${visual.to}${visual.mark !== undefined ? `, starting at ${visual.mark}` : ""}`}>
          <line x1="20" y1="70" x2="580" y2="70" stroke="#1e1b3a" strokeWidth="3" />
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} y1="62" x2={x(t)} y2="78" stroke="#1e1b3a" strokeWidth={t % 5 === 0 ? 3 : 1.5} />
              {(span <= 20 || t % 5 === 0) && <text x={x(t)} y="98" textAnchor="middle" fontSize="15" fontWeight="700" fill="#1e1b3a">{t}</text>}
            </g>
          ))}
          {points.slice(1).map((p, i) => {
            const a = x(points[i]), b = x(p);
            return <path key={i} d={`M${a} 62 Q${(a + b) / 2} ${10} ${b} 62`} fill="none" stroke="#5b3fd9" strokeWidth="3" markerEnd="url(#arrow)" />;
          })}
          {visual.mark !== undefined && <circle cx={x(visual.mark)} cy="70" r="8" fill="#ff7a59" />}
          <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#5b3fd9" /></marker></defs>
        </svg>
      );
    }
    case "array":
      return (
        <div className={clsx("inline-grid gap-1.5 rounded-2xl bg-paper p-3", className)} style={{ gridTemplateColumns: `repeat(${visual.cols}, minmax(0, 1fr))` }} role="img" aria-label={`${visual.rows} rows of ${visual.cols}`}>
          {Array.from({ length: visual.rows * visual.cols }, (_, i) =>
            visual.emoji ? <span key={i} className="text-3xl" aria-hidden>{visual.emoji}</span> : <span key={i} className="size-7 rounded-full bg-sky" />,
          )}
        </div>
      );
    case "fractionBar":
      return (
        <div className={clsx("flex h-16 w-full max-w-lg overflow-hidden rounded-xl border-4 border-ink", className)} role="img" aria-label={`${visual.shaded} of ${visual.parts} equal parts shaded`}>
          {Array.from({ length: visual.parts }, (_, i) => (
            <span key={i} className={clsx("flex-1 border-ink", i > 0 && "border-l-2", i < visual.shaded ? "bg-berry" : "bg-white")} />
          ))}
        </div>
      );
    case "shape":
      return <ShapeSvg shape={visual.shape} className={className} />;
    case "placeValue":
      return (
        <div className={clsx("flex flex-wrap items-end justify-center gap-6", className)} role="img" aria-label={`${visual.hundreds ? `${visual.hundreds} hundreds, ` : ""}${visual.tens} tens and ${visual.ones} ones`}>
          {visual.hundreds ? (
            <div className="flex gap-1">{Array.from({ length: visual.hundreds }, (_, i) => <span key={i} className="grid size-20 grid-cols-10 gap-px rounded bg-leaf p-0.5">{Array.from({ length: 100 }, (_, j) => <span key={j} className="bg-leaf-soft/60" />)}</span>)}</div>
          ) : null}
          <div className="flex gap-1.5">{Array.from({ length: visual.tens }, (_, i) => <span key={i} className="flex h-28 w-5 flex-col gap-px rounded bg-sky p-0.5">{Array.from({ length: 10 }, (_, j) => <span key={j} className="flex-1 rounded-sm bg-sky-soft/70" />)}</span>)}</div>
          <div className="grid max-w-24 grid-cols-3 gap-1.5">{Array.from({ length: visual.ones }, (_, i) => <span key={i} className="size-5 rounded-sm bg-coral" />)}</div>
        </div>
      );
    case "passage":
      return (
        <article className={clsx("rounded-2xl bg-sand-soft p-5 text-left text-lg leading-relaxed text-ink", className)}>
          {visual.title && <h3 className="mb-2 font-display text-xl font-bold">{visual.title}</h3>}
          <p>{visual.text}</p>
        </article>
      );
    case "bigText":
      return <p className={clsx("font-display text-6xl font-bold tracking-wide text-brand sm:text-7xl", className)}>{visual.text}</p>;
    case "pattern":
      return (
        <div className={clsx("flex flex-wrap justify-center gap-2", className)} role="img" aria-label={`Pattern: ${visual.items.join(", ")}`}>
          {visual.items.map((it, i) => (
            <span key={i} className={clsx("grid size-16 place-items-center rounded-2xl text-4xl", it === "?" ? "border-4 border-dashed border-brand font-display font-bold text-brand" : "bg-paper")} aria-hidden>{it}</span>
          ))}
        </div>
      );
    case "robot": {
      const at = (cells: [number, number][] | undefined, r: number, c: number) => cells?.some(([rr, cc]) => rr === r && cc === c);
      return (
        <div
          className={clsx("inline-grid gap-1 rounded-2xl bg-sky-soft p-2", className)}
          style={{ gridTemplateColumns: `repeat(${visual.cols}, minmax(0, 1fr))` }}
          role="img"
          aria-label={`Grid ${visual.rows} by ${visual.cols}. Robot at row ${visual.robot[0] + 1}, column ${visual.robot[1] + 1}. Flag at row ${visual.goal[0] + 1}, column ${visual.goal[1] + 1}.${visual.walls?.length ? ` ${visual.walls.length} wall(s).` : ""}`}
        >
          {Array.from({ length: visual.rows * visual.cols }, (_, i) => {
            const r = Math.floor(i / visual.cols), c = i % visual.cols;
            const robot = visual.robot[0] === r && visual.robot[1] === c;
            const goal = visual.goal[0] === r && visual.goal[1] === c;
            return (
              <span key={i} className={clsx("grid size-11 place-items-center rounded-lg text-2xl sm:size-12", at(visual.walls, r, c) ? "bg-[#a8743a]" : "bg-white")} aria-hidden>
                {robot ? "🤖" : goal ? "🏁" : at(visual.walls, r, c) ? "🧱" : at(visual.items, r, c) ? "⭐" : ""}
              </span>
            );
          })}
        </div>
      );
    }
    case "grid":
      return (
        <div className={clsx("flex flex-col items-center", className)} role="img" aria-label={`Grid ${visual.cols} by ${visual.rows}${visual.unit ? ` ${visual.unit}` : ""}`}>
          <div className="inline-grid border-2 border-ink" style={{ gridTemplateColumns: `repeat(${visual.cols}, 1.75rem)` }}>
            {Array.from({ length: visual.rows * visual.cols }, (_, i) => <span key={i} className="size-7 border border-ink/25 bg-sky-soft" />)}
          </div>
          {visual.unit && <p className="mt-1 text-sm font-bold text-ink-muted">Each square is 1 {visual.unit} × 1 {visual.unit}</p>}
        </div>
      );
  }
}

function ShapeSvg({ shape, className }: { shape: string; className?: string }) {
  const common = { fill: "#ffc23d", stroke: "#1e1b3a", strokeWidth: 5, strokeLinejoin: "round" as const };
  const poly = (n: number, r = 60, rot = -Math.PI / 2) =>
    Array.from({ length: n }, (_, i) => `${80 + r * Math.cos(rot + (i * 2 * Math.PI) / n)},${80 + r * Math.sin(rot + (i * 2 * Math.PI) / n)}`).join(" ");
  const shapes: Record<string, React.ReactNode> = {
    circle: <circle cx="80" cy="80" r="60" {...common} />,
    oval: <ellipse cx="80" cy="80" rx="70" ry="45" {...common} />,
    square: <rect x="25" y="25" width="110" height="110" {...common} />,
    rectangle: <rect x="10" y="40" width="140" height="80" {...common} />,
    triangle: <polygon points={poly(3, 66)} {...common} />,
    pentagon: <polygon points={poly(5)} {...common} />,
    hexagon: <polygon points={poly(6, 62, 0)} {...common} />,
    star: <polygon points={Array.from({ length: 10 }, (_, i) => { const r = i % 2 ? 28 : 64; const a = -Math.PI / 2 + (i * Math.PI) / 5; return `${80 + r * Math.cos(a)},${80 + r * Math.sin(a)}`; }).join(" ")} {...common} />,
  };
  return (
    <svg viewBox="0 0 160 160" className={clsx("size-40", className)} role="img" aria-label={`A ${shape}`}>
      {shapes[shape]}
    </svg>
  );
}
