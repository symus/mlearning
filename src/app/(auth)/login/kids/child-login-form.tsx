"use client";

import { useActionState } from "react";
import { childLogin } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { FormMessage, TextField } from "@/components/ui/field";

// Card details are lower-case letters and numbers: stop phones from capitalising or "correcting" them.
const plain = { autoCapitalize: "none", autoCorrect: "off", spellCheck: false, className: "font-mono text-xl! tracking-wide" } as const;

export function ChildLoginForm() {
  const [state, action, pending] = useActionState(childLogin, undefined);
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <TextField label="Login ID" name="loginId" autoComplete="username" placeholder="e.g. aya4821" required defaultValue={state?.values?.loginId} errors={state?.errors?.loginId} {...plain} />
      <TextField label="Password" name="password" type="password" autoComplete="current-password" placeholder="e.g. tiger0482" required errors={state?.errors?.password} {...plain} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Opening…" : "Let's go! 🚀"}</Button>
    </form>
  );
}
