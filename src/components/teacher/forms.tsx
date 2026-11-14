"use client";

import { useActionState, useTransition } from "react";
import { addStudents, createClass, removeAssignment, removeStudent, setAssignment } from "@/app/actions/teacher";
import { AGE_BANDS } from "@/lib/age";
import { Button } from "@/components/ui/button";
import { FieldError, FormMessage, SelectField, TextField } from "@/components/ui/field";

export function CreateClassForm() {
  const [state, action, pending] = useActionState(createClass, undefined);
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <TextField label="Class name" name="name" placeholder="e.g. Year 2 Robins" required defaultValue={state?.values?.name} errors={state?.errors?.name} />
      <SelectField label="Age group" name="ageBand" defaultValue={state?.values?.ageBand || "YOUNG_THINKERS"} errors={state?.errors?.ageBand}>
        {Object.values(AGE_BANDS).map((b) => <option key={b.band} value={b.band}>{b.name} (ages {b.ages})</option>)}
      </SelectField>
      <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create class"}</Button>
    </form>
  );
}

export function AddStudentsForm({ classId }: { classId: string }) {
  const [state, action, pending] = useActionState(addStudents.bind(null, classId), undefined);
  return (
    <form action={action} className="space-y-3" noValidate>
      <FormMessage state={state} />
      <div>
        <label htmlFor="names" className="block text-sm font-bold text-ink">Students&apos; first names</label>
        <p className="text-sm text-ink-muted">One per line, or separated by commas. First names only: no surnames or other details.</p>
        <textarea
          id="names"
          name="names"
          rows={4}
          defaultValue={state?.ok ? "" : state?.values?.names}
          aria-invalid={!!state?.errors?.names?.length}
          aria-describedby={state?.errors?.names?.length ? "names-error" : undefined}
          className="mt-1 block w-full rounded-xl border-2 border-line bg-surface px-4 py-3 text-base text-ink focus:border-brand focus:outline-none aria-[invalid=true]:border-danger"
          placeholder={"Aya\nRavi\nZoe"}
        />
        <FieldError id="names-error" errors={state?.errors?.names} />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Adding…" : "Add students"}</Button>
    </form>
  );
}

export function AssignForm({ classId, options }: { classId: string; options: { world: string; activities: { slug: string; title: string }[] }[] }) {
  const [state, action, pending] = useActionState(setAssignment.bind(null, classId), undefined);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end" noValidate>
      <div className="sm:col-span-3"><FormMessage state={state} /></div>
      <SelectField label="Activity" name="activitySlug" defaultValue="" errors={state?.errors?.activitySlug}>
        <option value="" disabled>Choose an activity…</option>
        {options.map((g) => (
          <optgroup key={g.world} label={g.world}>
            {g.activities.map((a) => <option key={a.slug} value={a.slug}>{a.title}</option>)}
          </optgroup>
        ))}
      </SelectField>
      <TextField label="Due date (optional)" name="dueAt" type="date" errors={state?.errors?.dueAt} />
      <Button type="submit" disabled={pending} className="sm:mb-0.5">{pending ? "Setting…" : "Set for class"}</Button>
    </form>
  );
}

/** A small destructive button that asks first. */
function ConfirmButton({ label, confirm, run, ariaLabel }: { label: string; confirm: string; run: () => Promise<void>; ariaLabel: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={pending}
      onClick={() => window.confirm(confirm) && start(run)}
      className="rounded-full px-3 py-1 text-sm font-bold text-danger hover:bg-danger-soft disabled:opacity-50"
    >
      {pending ? "…" : label}
    </button>
  );
}

export function RemoveStudentButton({ classId, studentId, name }: { classId: string; studentId: string; name: string }) {
  return (
    <ConfirmButton
      label="Remove"
      ariaLabel={`Remove ${name}`}
      confirm={`Remove ${name} from the class? Their profile and learning records will be deleted.`}
      run={() => removeStudent(classId, studentId)}
    />
  );
}

export function RemoveAssignmentButton({ classId, assignmentId, title }: { classId: string; assignmentId: string; title: string }) {
  return (
    <ConfirmButton label="Remove" ariaLabel={`Remove assignment ${title}`} confirm={`Remove “${title}” from the class's assignments?`} run={() => removeAssignment(classId, assignmentId)} />
  );
}
