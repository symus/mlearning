import clsx from "clsx";
import type { ComponentProps } from "react";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={clsx("rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]", className)} {...props} />;
}

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: "neutral" | "success" | "warning" | "brand" | "danger" }) {
  const tones = {
    neutral: "bg-line/60 text-ink-soft",
    success: "bg-leaf-soft text-success",
    warning: "bg-sun-soft text-warning",
    brand: "bg-brand-soft text-brand",
    danger: "bg-danger-soft text-danger",
  };
  return <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold", tones[tone], className)} {...props} />;
}

export function ProgressBar({ value, label, colour = "bg-brand", className }: { value: number; label: string; colour?: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div className={clsx("h-3 w-full overflow-hidden rounded-full bg-line/70", className)} role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={clsx("h-full rounded-full transition-[width] duration-500", colour)} style={{ width: `${pct}%` }} />
    </div>
  );
}
