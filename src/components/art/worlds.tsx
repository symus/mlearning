/**
 * Original illustrations for the learning-universe worlds.
 * Every world is a floating island in one shared style: a rounded top, a rocky underside,
 * and one landmark that tells children what the world is about.
 */
import clsx from "clsx";

const INK = "#1e1b3a";

function Island({ top, side, children, glow }: { top: string; side: string; children: React.ReactNode; glow: string }) {
  return (
    <g>
      <ellipse cx="100" cy="182" rx="56" ry="7" fill="#000" opacity="0.18" />
      <circle cx="100" cy="100" r="88" fill={glow} opacity="0.18" />
      {/* rocky underside */}
      <path d="M28 128 Q100 214 172 128 Z" fill={side} />
      <path d="M60 150 Q100 196 140 150" fill="none" stroke="#000" strokeOpacity="0.12" strokeWidth="6" strokeLinecap="round" />
      {/* top surface */}
      <ellipse cx="100" cy="128" rx="74" ry="22" fill={top} />
      <ellipse cx="100" cy="124" rx="66" ry="15" fill="#fff" opacity="0.18" />
      {children}
    </g>
  );
}

function Sparkle({ x, y, s = 1, fill = "#fff4d6" }: { x: number; y: number; s?: number; fill?: string }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z" fill={fill} />;
}

const ART: Record<string, React.ReactNode> = {
  "number-nebula": (
    <Island top="#7a63ea" side="#3e2aa6" glow="#5b3fd9">
      <circle cx="100" cy="78" r="34" fill="#ffc23d" />
      <path d="M78 64 a34 34 0 0 1 44 -6" stroke="#fff" strokeOpacity="0.5" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="100" cy="82" rx="58" ry="13" fill="none" stroke="#ff7a59" strokeWidth="6" transform="rotate(-12 100 82)" />
      <text x="100" y="92" textAnchor="middle" fontSize="28" fontWeight="800" fontFamily="var(--font-display)" fill={INK}>123</text>
      <Sparkle x={40} y={40} />
      <Sparkle x={160} y={50} s={0.8} />
      <Sparkle x={150} y={112} s={0.6} />
    </Island>
  ),
  "story-grove": (
    <Island top="#3cc27f" side="#1b7a4f" glow="#1f9d6b">
      <rect x="92" y="78" width="16" height="48" rx="5" fill="#8a5a2b" />
      <circle cx="100" cy="66" r="32" fill="#23a565" />
      <circle cx="76" cy="80" r="20" fill="#2fb873" />
      <circle cx="124" cy="80" r="20" fill="#2fb873" />
      <circle cx="88" cy="58" r="5" fill="#ff7a59" />
      <circle cx="116" cy="70" r="5" fill="#ff7a59" />
      {/* open book */}
      <path d="M58 122 q14 -8 28 0 v-18 q-14 -8 -28 0z" fill="#fff" />
      <path d="M86 122 q14 -8 28 0 v-18 q-14 -8 -28 0z" fill="#fff4d6" />
      <path d="M64 108 h16 M64 114 h14 M92 108 h16 M92 114 h14" stroke="#c8458e" strokeWidth="2" strokeLinecap="round" />
      <Sparkle x={150} y={46} />
    </Island>
  ),
  "discovery-lab": (
    <Island top="#2bb3c4" side="#0a6b78" glow="#0e8fa0">
      <path d="M86 46 h28 v10 h-4 v18 l24 40 q4 10 -8 10 h-52 q-12 0 -8 -10 l24 -40 v-18 h-4z" fill="#e2f0fe" />
      <path d="M74 106 l12 -20 h28 l12 20 q4 10 -8 10 h-36 q-12 0 -8 -10z" fill="#6ff0c8" />
      <circle cx="94" cy="100" r="5" fill="#fff" opacity="0.8" />
      <circle cx="108" cy="92" r="3.5" fill="#fff" opacity="0.8" />
      <circle cx="120" cy="34" r="6" fill="#6ff0c8" opacity="0.7" />
      <circle cx="132" cy="22" r="4" fill="#6ff0c8" opacity="0.5" />
    </Island>
  ),
  "puzzle-peaks": (
    <Island top="#f08a4b" side="#a8471b" glow="#d9652a">
      <path d="M46 126 L86 52 L126 126 Z" fill="#c5551f" />
      <path d="M86 52 L72 78 L80 74 L86 82 L92 74 L100 78 Z" fill="#fff" />
      <path d="M90 126 L124 70 L158 126 Z" fill="#e0713a" />
      <path d="M124 70 L113 88 L120 85 L124 92 L130 85 L136 88 Z" fill="#fff" />
      <rect x="54" y="98" width="20" height="20" rx="4" fill="#ffc23d" />
      <circle cx="64" cy="96" r="5" fill="#ffc23d" />
      <circle cx="76" cy="108" r="5" fill="#ffc23d" />
    </Island>
  ),
  "code-harbour": (
    <Island top="#4f8cf0" side="#1f4fae" glow="#2f6fe0">
      <rect x="64" y="58" width="72" height="56" rx="16" fill="#e2f0fe" />
      <rect x="74" y="68" width="52" height="28" rx="9" fill={INK} />
      <circle cx="90" cy="82" r="5" fill="#6ff0c8" />
      <circle cx="110" cy="82" r="5" fill="#6ff0c8" />
      <path d="M100 58 V44" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <circle cx="100" cy="40" r="6" fill="#ff7a59" />
      <text x="100" y="128" textAnchor="middle" fontSize="18" fontWeight="800" fontFamily="monospace" fill="#fff">{"{ }"}</text>
    </Island>
  ),
  "atlas-trails": (
    <Island top="#c99042" side="#7a5212" glow="#a86c12">
      <circle cx="100" cy="76" r="34" fill="#4a9ff5" />
      <path d="M78 62 q10 -10 20 -2 q8 10 -4 16 q-10 4 -16 -4z M108 84 q12 -6 18 4 q-2 12 -14 8z" fill="#2fb873" />
      <ellipse cx="100" cy="76" rx="34" ry="12" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="2" />
      <path d="M100 42 V110" stroke="#fff" strokeOpacity="0.6" strokeWidth="2" />
      <rect x="94" y="110" width="12" height="12" rx="2" fill="#8a5a2b" />
      <path d="M140 40 l6 12 l-12 0z" fill="#ff7a59" />
    </Island>
  ),
  "make-studio": (
    <Island top="#e06aae" side="#93286a" glow="#c8458e">
      <path d="M60 96 q-6 -44 40 -46 q44 0 42 34 q-2 16 -18 12 q-12 -4 -14 8 q-2 16 -22 14 q-26 -4 -28 -22z" fill="#fff4d6" />
      <circle cx="80" cy="76" r="7" fill="#ff7a59" />
      <circle cx="100" cy="64" r="7" fill="#ffc23d" />
      <circle cx="122" cy="70" r="7" fill="#2fb873" />
      <circle cx="86" cy="98" r="7" fill="#4a9ff5" />
      <path d="M140 40 L116 104" stroke="#8a5a2b" strokeWidth="6" strokeLinecap="round" />
      <path d="M114 100 l-4 14 l10 -10z" fill={INK} />
    </Island>
  ),
  "coin-cove": (
    <Island top="#d4ab1f" side="#7a5d00" glow="#b08700">
      <rect x="66" y="72" width="68" height="44" rx="8" fill="#8a5a2b" />
      <path d="M66 80 q34 -30 68 0" fill="#a8743a" />
      <rect x="94" y="84" width="12" height="14" rx="3" fill="#ffc23d" />
      <circle cx="74" cy="122" r="11" fill="#ffc23d" stroke="#e89a00" strokeWidth="3" />
      <circle cx="126" cy="122" r="11" fill="#ffc23d" stroke="#e89a00" strokeWidth="3" />
      <circle cx="100" cy="60" r="10" fill="#ffc23d" stroke="#e89a00" strokeWidth="3" />
      <Sparkle x={146} y={50} />
      <Sparkle x={52} y={58} s={0.7} />
    </Island>
  ),
};

export function WorldArt({ slug, className, float = false }: { slug: string; className?: string; float?: boolean }) {
  return (
    <svg viewBox="0 0 200 200" className={clsx("block overflow-visible", float && "animate-float", className)} aria-hidden>
      {ART[slug] ?? ART["number-nebula"]}
    </svg>
  );
}
