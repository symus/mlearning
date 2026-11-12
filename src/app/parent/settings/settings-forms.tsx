"use client";

import { useActionState } from "react";
import { changePin, deleteAccount } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { FormMessage, TextField } from "@/components/ui/field";

export function ChangePinForm() {
  const [state, action, pending] = useActionState(changePin, undefined);
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <TextField label="Current password" name="currentPassword" type="password" autoComplete="current-password" errors={state?.errors?.currentPassword} />
      <TextField label="New 4-digit PIN" name="pin" inputMode="numeric" maxLength={4} autoComplete="off" errors={state?.errors?.pin} />
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Update PIN"}</Button>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccount, undefined);
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <TextField label='Type "DELETE" to confirm' name="confirm" autoComplete="off" errors={state?.errors?.confirm} />
      <TextField label="Password" name="password" type="password" autoComplete="current-password" errors={state?.errors?.password} />
      <Button type="submit" variant="danger" disabled={pending}>{pending ? "Deleting…" : "Delete account and all data"}</Button>
    </form>
  );
}
