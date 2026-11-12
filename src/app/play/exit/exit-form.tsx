"use client";

import { useActionState, useState } from "react";
import { exitChildMode } from "@/app/actions/children";

export function ExitForm() {
  const [state, action, pending] = useActionState(exitChildMode, undefined);
  const [pin, setPin] = useState("");
  const press = (d: string) => setPin((p) => (d === "⌫" ? p.slice(0, -1) : p.length < 4 ? p + d : p));
  return (
    <form action={action} className="flex flex-col items-center gap-4">
      <label htmlFor="pin" className="sr-only">Parent PIN</label>
      <input id="pin" name="pin" type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} className="h-16 w-48 rounded-2xl text-center font-display text-4xl tracking-[0.5em] text-ink" autoComplete="off" />
      {(state?.message || state?.errors?.pin) && <p role="alert" className="font-bold text-coral">{state?.message ?? state?.errors?.pin?.[0]}</p>}
      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, i) =>
          k ? (
            <button key={i} type="button" onClick={() => press(k)} className="h-14 w-16 rounded-xl bg-white/15 font-display text-2xl font-bold hover:bg-white/25" aria-label={k === "⌫" ? "Delete" : k}>{k}</button>
          ) : <span key={i} />,
        )}
      </div>
      <button disabled={pending || pin.length !== 4} className="rounded-full bg-sun px-8 py-3 font-bold text-ink disabled:opacity-50">{pending ? "Checking…" : "Open parent area"}</button>
    </form>
  );
}
