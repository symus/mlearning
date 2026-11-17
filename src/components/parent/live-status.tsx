import type { Presence } from "@/lib/learning/pause";
import { LocalTime } from "@/components/local-time";

/** "Right now" line for a parent: playing / on the app / last active / not played yet. */
export function LiveStatus({ presence, nickname, paused = false }: { presence: Presence; nickname: string; paused?: boolean }) {
  const dot = (c: string) => <span aria-hidden className={`inline-block size-2.5 shrink-0 rounded-full ${c}`} />;
  return (
    <p className="flex flex-wrap items-center gap-2 text-sm" data-testid="live-status">
      {paused && (presence.state === "playing" || presence.state === "online") && (
        <>
          {dot("bg-warning")}
          <span><strong>On Arivupulla now</strong> · seeing the “resting” screen (paused)</span>
        </>
      )}
      {!paused && presence.state === "playing" && (
        <>
          {dot("animate-pulse bg-success")}
          <span>
            <strong>Playing now:</strong> {presence.activityTitle} · {presence.answered} of {presence.ofItems} questions answered · started{" "}
            {presence.startedMinutesAgo < 1 ? "just now" : `${presence.startedMinutesAgo} min ago`}
          </span>
        </>
      )}
      {!paused && presence.state === "online" && (
        <>
          {dot("animate-pulse bg-success")}
          <span><strong>On Arivupulla now</strong> · looking around (maps, stickers or songs)</span>
        </>
      )}
      {presence.state === "away" && (
        <>
          {dot("bg-ink-muted/50")}
          <span>Last active <LocalTime iso={presence.lastSeenAt.toISOString()} withDay /></span>
        </>
      )}
      {presence.state === "never" && (
        <>
          {dot("bg-ink-muted/50")}
          <span>{nickname} hasn&apos;t played yet</span>
        </>
      )}
    </p>
  );
}
