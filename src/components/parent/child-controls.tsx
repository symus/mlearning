"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { pauseChild, resumeChild } from "@/app/actions/children";
import { PAUSE_LABEL, PAUSE_OPTIONS } from "@/lib/learning/pause";
import { Button } from "@/components/ui/button";
import { LocalTime } from "@/components/local-time";

/** Re-render the page every 20 s so the live status stays current. */
export function AutoRefresh({ everyMs = 20_000 }: { everyMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => document.visibilityState === "visible" && router.refresh(), everyMs);
    return () => window.clearInterval(id);
  }, [router, everyMs]);
  return null;
}

/** Pause ("lock for a while") or unpause Arivupulla for one child. */
export function PauseControls({ childId, nickname, pausedUntil }: { childId: string; nickname: string; pausedUntil: string | null }) {
  const [pending, start] = useTransition();
  if (pausedUntil) {
    return (
      <div className="space-y-3">
        <p className="rounded-xl bg-sun-soft px-4 py-2 font-semibold text-ink" role="status">
          🔒 Paused until <LocalTime iso={pausedUntil} withDay />. {nickname} sees a friendly “Arivupulla is resting” screen.
        </p>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => start(() => resumeChild(childId))}>
          {pending ? "Unlocking…" : "🔓 Unlock now"}
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-sm text-ink-soft">Pause Arivupulla on every device {nickname} uses (including login cards). It opens again by itself.</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Pause for">
        {PAUSE_OPTIONS.map((o) => (
          <Button
            key={o}
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => start(() => pauseChild(childId, o, new Date().getTimezoneOffset()))}
          >
            🔒 {PAUSE_LABEL[o]}
          </Button>
        ))}
      </div>
    </div>
  );
}
