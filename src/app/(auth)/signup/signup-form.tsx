"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "@/app/actions/auth";
import { COUNTRIES } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { CheckboxField, FormMessage, SelectField, TextField } from "@/components/ui/field";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);
  const e = state?.errors;
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <TextField label="Your name" name="displayName" autoComplete="name" required defaultValue={state?.values?.displayName} errors={e?.displayName} />
      <TextField label="Email" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} errors={e?.email} />
      <TextField label="Password" name="password" type="password" autoComplete="new-password" required hint="At least 10 characters, with a letter and a number." errors={e?.password} />
      <TextField
        label="Parent PIN"
        name="pin"
        inputMode="numeric"
        pattern="\d{4}"
        maxLength={4}
        autoComplete="off"
        required
        hint="4 digits. Needed to leave child mode, so children can't reach settings."
        errors={e?.pin}
      />
      <SelectField label="Country" name="country" defaultValue={state?.values?.country ?? "GB"} errors={e?.country}>
        {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
      </SelectField>
      <div className="space-y-3 rounded-2xl bg-brand-soft/50 p-4">
        <CheckboxField name="parentalConsent" label="I am 18 or over and the parent or legal guardian of the children I will add. I consent to their learning data being processed to provide the service." errors={e?.parentalConsent} />
        <CheckboxField
          name="terms"
          label={<>I accept the <Link href="/terms" className="font-bold text-brand underline" target="_blank">terms</Link> and have read the <Link href="/privacy" className="font-bold text-brand underline" target="_blank">privacy notice</Link>.</>}
          errors={e?.terms}
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Creating account…" : "Create free account"}</Button>
      <p className="text-center text-sm text-ink-soft">
        Already have an account? <Link href="/login" className="font-bold text-brand underline-offset-2 hover:underline">Log in</Link>
      </p>
      <p className="text-center text-sm text-ink-soft">
        A teacher? <Link href="/signup/teacher" className="font-bold text-brand underline-offset-2 hover:underline">Create a teacher account</Link>
      </p>
    </form>
  );
}
