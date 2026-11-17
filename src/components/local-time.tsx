"use client";

/** Shows a time in the viewer's own time zone (the server may be in another one). */
export function LocalTime({ iso, withDay = false }: { iso: string; withDay?: boolean }) {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const day = sameDay ? "today" : d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {withDay ? `${day} at ${time}` : sameDay ? time : `${time} ${day === "today" ? "" : `(${day})`}`.trim()}
    </time>
  );
}
