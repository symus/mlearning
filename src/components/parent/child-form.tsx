"use client";

import { useActionState, useState } from "react";
import { AGE_BANDS, ageBandForBirthYear, allowedBirthYears } from "@/lib/age";
import { INTERESTS, type FormState } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { CheckboxField, FieldError, FormMessage, SelectField, TextField } from "@/components/ui/field";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

export function ChildForm({
  action,
  submitLabel,
  initial,
}: {
  action: Action;
  submitLabel: string;
  initial?: { nickname: string; birthYear: number; dailyGoalMinutes: number; interests: string[]; narration: boolean };
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const v = state?.values;
  const [birthYear, setBirthYear] = useState<string>(v?.birthYear ?? (initial ? String(initial.birthYear) : ""));
  const interests = v?.interests !== undefined ? v.interests.split(",").filter(Boolean) : initial?.interests ?? [];
  const band = birthYear ? AGE_BANDS[ageBandForBirthYear(Number(birthYear))] : null;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <TextField
        label="Nickname"
        name="nickname"
        required
        maxLength={20}
        defaultValue={v?.nickname ?? initial?.nickname}
        hint="Only your family sees this. A first name or nickname is perfect — please don't use a full name."
        errors={state?.errors?.nickname}
      />
      <div>
        <SelectField label="Birth year" name="birthYear" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} errors={state?.errors?.birthYear}>
          <option value="">Choose a year</option>
          {allowedBirthYears().map((y) => <option key={y} value={y}>{y}</option>)}
        </SelectField>
        {band && (
          <p className="mt-2 rounded-xl bg-brand-soft px-3 py-2 text-sm" aria-live="polite">
            <span className="font-bold">{band.name} ({band.ages}):</span> {band.description}
          </p>
        )}
      </div>
      <SelectField label="Daily learning goal" name="dailyGoalMinutes" defaultValue={v?.dailyGoalMinutes ?? String(initial?.dailyGoalMinutes ?? 15)} errors={state?.errors?.dailyGoalMinutes}>
        <option value="10">10 minutes (recommended for ages 3–5)</option>
        <option value="15">15 minutes</option>
        <option value="20">20 minutes (recommended for ages 6–8)</option>
        <option value="30">30 minutes (recommended for ages 9–12)</option>
      </SelectField>
      <fieldset>
        <legend className="text-sm font-bold">Interests <span className="font-normal text-ink-muted">(optional, up to 5 — used to personalise stories and examples)</span></legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <label key={i.id} className="cursor-pointer">
              <input type="checkbox" name="interests" value={i.id} defaultChecked={interests.includes(i.id)} className="peer sr-only" />
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-line px-3 py-1.5 text-sm font-bold peer-checked:border-brand peer-checked:bg-brand-soft peer-checked:text-brand peer-focus-visible:outline-3 peer-focus-visible:outline-brand">
                <span aria-hidden>{i.emoji}</span> {i.label}
              </span>
            </label>
          ))}
        </div>
        <FieldError id="interests-error" errors={state?.errors?.interests} />
      </fieldset>
      <CheckboxField name="narration" label="Read instructions aloud (recommended for pre-readers)" defaultChecked={v ? v.narration === "on" : initial?.narration ?? true} />
      <Button type="submit" size="lg" disabled={pending}>{pending ? "Saving…" : submitLabel}</Button>
    </form>
  );
}
