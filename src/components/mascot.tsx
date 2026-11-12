import clsx from "clsx";

/** Pip: the learning guide. An original star-sprout character drawn in SVG. */
export function Pip({ className, mood = "happy" }: { className?: string; mood?: "happy" | "think" | "cheer" }) {
  return (
    <svg viewBox="0 0 120 120" className={clsx("drop-shadow-sm", className)} role="img" aria-label="Pip, your learning guide">
      <path d="M60 30 V14" stroke="#23a565" strokeWidth="5" strokeLinecap="round" />
      <path d="M60 20 C 48 8, 36 14, 40 22 C 46 26, 56 24, 60 20Z" fill="#23a565" />
      <path d="M60 4l3.6 7.4 8.1 1.2-5.9 5.7 1.4 8-7.2-3.8-7.2 3.8 1.4-8-5.9-5.7 8.1-1.2z" fill="#ffc23d" />
      <ellipse cx="60" cy="72" rx="40" ry="38" fill="#ffc23d" />
      <ellipse cx="60" cy="80" rx="26" ry="22" fill="#fff4d6" />
      {mood === "think" ? (
        <>
          <path d="M42 64 q6 -5 12 0" stroke="#1e1b3a" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="76" cy="64" r="6" fill="#1e1b3a" />
          <path d="M52 86 h16" stroke="#1e1b3a" strokeWidth="4" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="46" cy="64" r="6" fill="#1e1b3a" />
          <circle cx="74" cy="64" r="6" fill="#1e1b3a" />
          <circle cx="48" cy="62" r="2" fill="#fff" />
          <circle cx="76" cy="62" r="2" fill="#fff" />
          <path d={mood === "cheer" ? "M46 80 q14 16 28 0 z" : "M48 82 q12 10 24 0"} stroke="#1e1b3a" strokeWidth="4" fill={mood === "cheer" ? "#ff7a59" : "none"} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      <circle cx="36" cy="78" r="5" fill="#ff7a59" opacity="0.45" />
      <circle cx="84" cy="78" r="5" fill="#ff7a59" opacity="0.45" />
    </svg>
  );
}
