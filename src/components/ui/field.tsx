import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

export function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p id={id} className="mt-1 text-sm font-semibold text-danger" role="alert">
      {errors[0]}
    </p>
  );
}

const inputClass =
  "mt-1 block w-full rounded-xl border-2 border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none aria-[invalid=true]:border-danger";

export function TextField({ label, name, errors, hint, ...props }: ComponentProps<"input"> & { label: string; name: string; errors?: string[]; hint?: ReactNode }) {
  const errId = `${name}-error`;
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-bold text-ink">
        {label}
      </label>
      {hint && <p className="text-sm text-ink-muted">{hint}</p>}
      <input id={name} name={name} className={inputClass} aria-invalid={!!errors?.length} aria-describedby={errors?.length ? errId : undefined} {...props} />
      <FieldError id={errId} errors={errors} />
    </div>
  );
}

export function SelectField({ label, name, errors, children, className, ...props }: ComponentProps<"select"> & { label: string; name: string; errors?: string[] }) {
  const errId = `${name}-error`;
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-bold text-ink">
        {label}
      </label>
      <select id={name} name={name} className={clsx(inputClass, "appearance-auto")} aria-invalid={!!errors?.length} aria-describedby={errors?.length ? errId : undefined} {...props}>
        {children}
      </select>
      <FieldError id={errId} errors={errors} />
    </div>
  );
}

export function CheckboxField({ label, name, errors, ...props }: ComponentProps<"input"> & { label: ReactNode; name: string; errors?: string[] }) {
  const errId = `${name}-error`;
  return (
    <div>
      <label className="flex items-start gap-3 text-sm text-ink-soft">
        <input type="checkbox" name={name} className="mt-0.5 size-5 shrink-0 accent-brand" aria-invalid={!!errors?.length} aria-describedby={errors?.length ? errId : undefined} {...props} />
        <span>{label}</span>
      </label>
      <FieldError id={errId} errors={errors} />
    </div>
  );
}

export function FormMessage({ state }: { state?: { ok?: boolean; message?: string } }) {
  if (!state?.message) return null;
  return (
    <p role="status" className={clsx("rounded-xl px-4 py-3 text-sm font-semibold", state.ok ? "bg-leaf-soft text-success" : "bg-danger-soft text-danger")}>
      {state.message}
    </p>
  );
}
