"use client";

import Link from "next/link";
import { useActionState } from "react";
import { teacherSignup } from "@/app/actions/auth";
import { COUNTRIES } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { CheckboxField, FormMessage, SelectField, TextField } from "@/components/ui/field";

export function TeacherSignupForm() {
  const [state, action, pending] = useActionState(teacherSignup, undefined);
  const e = state?.errors;
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <TextField label="Your name" name="displayName" autoComplete="name" required defaultValue={state?.values?.displayName} errors={e?.displayName} hint="As your students know you, e.g. Ms Patel." />
      <TextField label="School name" name="schoolName" autoComplete="organization" required defaultValue={state?.values?.schoolName} errors={e?.schoolName} />
      <TextField label="Email" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} errors={e?.email} />
      <TextField label="Password" name="password" type="password" autoComplete="new-password" required hint="At least 10 characters, with a letter and a number." errors={e?.password} />
      <SelectField label="Country" name="country" defaultValue={state?.values?.country ?? "GB"} errors={e?.country}>
        {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
      </SelectField>
      <div className="space-y-3 rounded-2xl bg-brand-soft/50 p-4">
        <CheckboxField
          name="schoolAuthorisation"
          label="I am a teacher. My school allows me to use this service with my class and has any parental permissions needed for students' learning data to be processed."
          errors={e?.schoolAuthorisation}
        />
        <CheckboxField
          name="terms"
          label={<>I accept the <Link href="/terms" className="font-bold text-brand underline" target="_blank">terms</Link> and have read the <Link href="/privacy" className="font-bold text-brand underline" target="_blank">privacy notice</Link>.</>}
          errors={e?.terms}
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Creating account…" : "Create teacher account"}</Button>
      <p className="text-center text-sm text-ink-soft">
        A parent? <Link href="/signup" className="font-bold text-brand underline-offset-2 hover:underline">Create a family account</Link> · <Link href="/login" className="font-bold text-brand underline-offset-2 hover:underline">Log in</Link>
      </p>
    </form>
  );
}
