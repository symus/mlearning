"use client";

import Link from "next/link";
import { Muchi } from "./mascot";

/** Friendly loading state shared by child and parent areas. */
export function LoadingScreen({ dark = false, label = "Loading…" }: { dark?: boolean; label?: string }) {
  return (
    <div role="status" aria-live="polite" className={`flex min-h-[50vh] flex-col items-center justify-center gap-3 ${dark ? "text-white" : "text-ink"}`}>
      <Muchi className="size-20 animate-bounce" mood="think" />
      <p className="font-display text-lg font-bold">{label}</p>
    </div>
  );
}

/** Error state with retry. Never shows technical details to children. */
export function ErrorScreen({ reset, dark = false, homeHref }: { reset: () => void; dark?: boolean; homeHref: string }) {
  return (
    <div role="alert" className={`mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 text-center ${dark ? "text-white" : "text-ink"}`}>
      <Muchi className="size-24" mood="think" />
      <h1 className="text-2xl font-bold">Oops! Something went wobbly.</h1>
      <p className={dark ? "text-white/80" : "text-ink-soft"}>It wasn&apos;t you. Let&apos;s try that again.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="btn-pop rounded-full bg-sun px-6 py-3 font-bold text-ink">Try again</button>
        <Link href={homeHref} className={`rounded-full px-6 py-3 font-bold underline ${dark ? "text-white" : "text-ink"}`}>Go home</Link>
      </div>
    </div>
  );
}
