"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { FormMessage, TextField } from "@/components/ui/field";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next ?? ""} />
      <TextField label="Email" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} errors={state?.errors?.email} />
      <TextField label="Password" name="password" type="password" autoComplete="current-password" required errors={state?.errors?.password} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Logging in…" : "Log in"}</Button>
      <p className="text-center text-sm text-ink-soft">
        New here? <Link href="/signup" className="font-bold text-brand underline-offset-2 hover:underline">Create a family account</Link>
      </p>
    </form>
  );
}
