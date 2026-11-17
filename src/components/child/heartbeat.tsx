"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { heartbeat } from "@/app/actions/children";
import { HEARTBEAT_MS } from "@/lib/learning/pause";

/**
 * While the child's screen is open and visible, check in every 45 s: the parent sees "on Arivupulla now",
 * and if a grown-up has paused (or un-paused) the app, the screen updates within a minute.
 */
export function Heartbeat({ paused }: { paused: boolean }) {
  const router = useRouter();
  useEffect(() => {
    const beat = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await heartbeat();
        if (res.paused !== paused) router.refresh();
      } catch {
        /* offline: try again next time */
      }
    };
    const id = window.setInterval(beat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [paused, router]);
  return null;
}
