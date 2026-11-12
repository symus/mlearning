/**
 * Original avatar characters, drawn in SVG in the same friendly style as Pip:
 * round heads, big dot eyes with a highlight, rosy cheeks, thick dark outline-free shapes.
 * Each character takes a body colour from the child's chosen colour.
 */
import clsx from "clsx";

export const CHARACTER_IDS = ["fox", "owl", "bear", "cat", "dragon", "robot"] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];

export const CHARACTER_NAMES: Record<CharacterId, string> = {
  fox: "Fox",
  owl: "Owl",
  bear: "Bear",
  cat: "Cat",
  dragon: "Dragon",
  robot: "Robot",
};

/** Body colours for each avatar colour choice (main, shade, light belly). */
export const AVATAR_PALETTE: Record<string, { main: string; shade: string; light: string; bg: string }> = {
  sun: { main: "#ffb81c", shade: "#e89a00", light: "#fff1c9", bg: "#fff4d6" },
  coral: { main: "#ff7a59", shade: "#e35a3a", light: "#ffe2d8", bg: "#ffe9e2" },
  leaf: { main: "#2fb873", shade: "#1e8f57", light: "#d8f5e5", bg: "#e1f6ea" },
  sky: { main: "#4a9ff5", shade: "#2a7fd6", light: "#dcecfd", bg: "#e2f0fe" },
  berry: { main: "#d6589c", shade: "#b23f7f", light: "#fadceb", bg: "#fbe6f1" },
  sand: { main: "#d9a75e", shade: "#b8863f", light: "#f6e7cc", bg: "#f8eedc" },
};

const INK = "#1e1b3a";

function Eyes({ y = 54, dx = 13 }: { y?: number; dx?: number }) {
  return (
    <g>
      <circle cx={50 - dx} cy={y} r="5.5" fill={INK} />
      <circle cx={50 + dx} cy={y} r="5.5" fill={INK} />
      <circle cx={50 - dx + 1.8} cy={y - 1.8} r="1.8" fill="#fff" />
      <circle cx={50 + dx + 1.8} cy={y - 1.8} r="1.8" fill="#fff" />
    </g>
  );
}

function Cheeks({ y = 63 }: { y?: number }) {
  return (
    <g fill="#ff7a59" opacity="0.4">
      <circle cx="30" cy={y} r="4.5" />
      <circle cx="70" cy={y} r="4.5" />
    </g>
  );
}

export function CharacterArt({
  character,
  colour = "sun",
  className,
  title,
}: {
  character: string;
  colour?: string;
  className?: string;
  title?: string;
}) {
  const c = AVATAR_PALETTE[colour] ?? AVATAR_PALETTE.sun;
  const id = (CHARACTER_IDS as readonly string[]).includes(character) ? (character as CharacterId) : "fox";
  return (
    <svg viewBox="0 0 100 100" className={clsx("block", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      {id === "fox" && (
        <g>
          <path d="M18 22 L36 40 L22 50 Z" fill={c.main} />
          <path d="M82 22 L64 40 L78 50 Z" fill={c.main} />
          <path d="M22 28 L32 40 L25 45 Z" fill={c.light} />
          <path d="M78 28 L68 40 L75 45 Z" fill={c.light} />
          <ellipse cx="50" cy="58" rx="33" ry="30" fill={c.main} />
          <path d="M50 88 C30 88 20 74 24 62 C34 66 42 64 50 70 C58 64 66 66 76 62 C80 74 70 88 50 88Z" fill={c.light} />
          <Eyes />
          <ellipse cx="50" cy="66" rx="4" ry="3" fill={INK} />
          <path d="M44 72 q6 4 12 0" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <Cheeks y={62} />
        </g>
      )}
      {id === "owl" && (
        <g>
          <path d="M20 26 L34 34 L24 42 Z" fill={c.shade} />
          <path d="M80 26 L66 34 L76 42 Z" fill={c.shade} />
          <ellipse cx="50" cy="58" rx="34" ry="32" fill={c.main} />
          <ellipse cx="50" cy="72" rx="20" ry="16" fill={c.light} />
          <circle cx="36" cy="52" r="13" fill="#fff" />
          <circle cx="64" cy="52" r="13" fill="#fff" />
          <Eyes y={52} dx={14} />
          <path d="M45 62 L50 70 L55 62 Z" fill="#ffb81c" />
          <path d="M42 78 q3 3 6 0 M52 78 q3 3 6 0" stroke={c.shade} strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      )}
      {id === "bear" && (
        <g>
          <circle cx="24" cy="30" r="12" fill={c.main} />
          <circle cx="76" cy="30" r="12" fill={c.main} />
          <circle cx="24" cy="30" r="6" fill={c.light} />
          <circle cx="76" cy="30" r="6" fill={c.light} />
          <circle cx="50" cy="56" r="33" fill={c.main} />
          <ellipse cx="50" cy="68" rx="15" ry="12" fill={c.light} />
          <Eyes y={52} />
          <ellipse cx="50" cy="63" rx="5" ry="3.6" fill={INK} />
          <path d="M45 71 q5 4 10 0" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <Cheeks y={62} />
        </g>
      )}
      {id === "cat" && (
        <g>
          <path d="M20 20 L40 34 L22 46 Z" fill={c.main} />
          <path d="M80 20 L60 34 L78 46 Z" fill={c.main} />
          <path d="M24 26 L34 34 L25 40 Z" fill="#ff9fb5" />
          <path d="M76 26 L66 34 L75 40 Z" fill="#ff9fb5" />
          <ellipse cx="50" cy="58" rx="34" ry="30" fill={c.main} />
          <Eyes y={54} />
          <path d="M47 63 L53 63 L50 67 Z" fill="#ff7a8f" />
          <path d="M50 67 q-4 5 -8 2 M50 67 q4 5 8 2" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <g stroke={INK} strokeWidth="1.6" strokeLinecap="round">
            <path d="M18 60 L32 62 M18 68 L32 66 M82 60 L68 62 M82 68 L68 66" />
          </g>
          <Cheeks y={62} />
        </g>
      )}
      {id === "dragon" && (
        <g>
          <path d="M30 30 L26 12 L40 26 Z" fill="#ffc23d" />
          <path d="M70 30 L74 12 L60 26 Z" fill="#ffc23d" />
          <path d="M50 22 l5 8 h-10z M38 24 l4 7 h-8z M62 24 l4 7 h-8z" fill={c.shade} />
          <ellipse cx="50" cy="58" rx="34" ry="31" fill={c.main} />
          <ellipse cx="50" cy="72" rx="22" ry="14" fill={c.light} />
          <Eyes y={52} />
          <circle cx="44" cy="70" r="2" fill={INK} />
          <circle cx="56" cy="70" r="2" fill={INK} />
          <path d="M40 78 q10 6 20 0" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <Cheeks y={62} />
        </g>
      )}
      {id === "robot" && (
        <g>
          <path d="M50 14 V26" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="12" r="5" fill="#ff7a59" />
          <rect x="12" y="46" width="8" height="18" rx="4" fill={c.shade} />
          <rect x="80" y="46" width="8" height="18" rx="4" fill={c.shade} />
          <rect x="18" y="26" width="64" height="60" rx="18" fill={c.main} />
          <rect x="26" y="38" width="48" height="30" rx="12" fill="#1e1b3a" />
          <circle cx="40" cy="52" r="5" fill="#6ff0c8" />
          <circle cx="60" cy="52" r="5" fill="#6ff0c8" />
          <path d="M44 61 q6 4 12 0" stroke="#6ff0c8" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <g fill={c.light}>
            <rect x="32" y="74" width="8" height="5" rx="2" />
            <rect x="46" y="74" width="8" height="5" rx="2" />
            <rect x="60" y="74" width="8" height="5" rx="2" />
          </g>
        </g>
      )}
    </svg>
  );
}
