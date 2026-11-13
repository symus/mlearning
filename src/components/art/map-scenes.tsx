/**
 * Original illustrated map scenery (SVG). One theme per world; `variant` (the map number)
 * shifts decorations so Map 1, Map 2… look different. Purely decorative: aria-hidden.
 */
export type MapTheme = "reading" | "maths" | "science" | "logic" | "coding";

/** Stepping-stone positions (percent of the map) for up to 10 lessons, winding like a trail. */
export const STOPS: [number, number][] = [
  [9, 30], [26, 25], [43, 31], [33, 48], [14, 61], [27, 81], [47, 85], [62, 69], [79, 56], [90, 37],
];
/** Treasure chest position at the end of each map. */
export const CHEST: [number, number] = [90, 78];

const PALETTE: Record<MapTheme, { sky: string; ground: string; ground2: string; path: string; water: string }> = {
  reading: { sky: "#bfe8ff", ground: "#7ccf6a", ground2: "#5fb854", path: "#f3d9a4", water: "#4aa8e8" },
  maths: { sky: "#2a1d6e", ground: "#4b3aa8", ground2: "#3a2c8c", path: "#ffd76a", water: "#6c5ce7" },
  science: { sky: "#c9f2f5", ground: "#7fd8c9", ground2: "#5ec2b2", path: "#ffffff", water: "#38b6c9" },
  logic: { sky: "#ffe1b8", ground: "#f2c27b", ground2: "#e8ad5c", path: "#fff4e0", water: "#3ab4d9" },
  coding: { sky: "#cfe0ff", ground: "#8fb3f5", ground2: "#6d97ea", path: "#ffffff", water: "#3b6fd6" },
};

/** Smooth path through the stops (Catmull-Rom → cubic Bézier), in a 1000×620 viewBox. */
export function trailPath(points: [number, number][]): string {
  const p = points.map(([x, y]) => [x * 10, y * 6.2]);
  if (p.length < 2) return "";
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

const Tree = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-6" y="0" width="12" height="34" rx="4" fill="#8a5a2b" />
    <circle cx="0" cy="-8" r="28" fill="#2f9e57" />
    <circle cx="-18" cy="6" r="18" fill="#3cb468" />
    <circle cx="18" cy="6" r="18" fill="#3cb468" />
  </g>
);
const Flower = ({ x, y, c }: { x: number; y: number; c: string }) => (
  <g transform={`translate(${x} ${y})`}>
    {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 7} cy={Math.sin((a * Math.PI) / 180) * 7} r="6" fill={c} />)}
    <circle r="5" fill="#ffc23d" />
  </g>
);
const Rock = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => <ellipse cx={x} cy={y} rx={30 * s} ry={18 * s} fill="#b9b2a8" stroke="#9a9289" strokeWidth="3" />;
const Star = ({ x, y, r = 3 }: { x: number; y: number; r?: number }) => <circle cx={x} cy={y} r={r} fill="#fff" opacity="0.8" />;
const Planet = ({ x, y, r, c, ring }: { x: number; y: number; r: number; c: string; ring?: string }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={c} />
    {ring && <ellipse cx={x} cy={y} rx={r * 1.7} ry={r * 0.45} fill="none" stroke={ring} strokeWidth="5" transform={`rotate(-15 ${x} ${y})`} />}
  </g>
);
const Building = ({ x, w, h, c }: { x: number; w: number; h: number; c: string }) => (
  <g>
    <rect x={x} y={150 - h} width={w} height={h + 10} rx="6" fill={c} />
    {Array.from({ length: Math.floor(h / 26) }, (_, i) => (
      <g key={i}>
        <rect x={x + 8} y={162 - h + i * 26} width="10" height="10" rx="2" fill="#ffd76a" opacity="0.85" />
        <rect x={x + w - 18} y={162 - h + i * 26} width="10" height="10" rx="2" fill="#ffd76a" opacity="0.85" />
      </g>
    ))}
  </g>
);

export function MapScene({ theme, variant = 0 }: { theme: MapTheme; variant?: number }) {
  const c = PALETTE[theme];
  const flip = variant % 2 === 1; // alternate scenery sides on alternate maps
  const sx = (x: number) => (flip ? 1000 - x : x);
  const flowers = ["#ff7a59", "#d6589c", "#ffffff", "#4a9ff5"];
  return (
    <svg viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
      <rect width="1000" height="620" fill={c.sky} />
      {/* rolling ground */}
      <path d="M0,150 C200,110 380,170 560,130 C740,95 860,140 1000,120 L1000,620 L0,620 Z" fill={c.ground} />
      <path d="M0,420 C220,380 420,460 640,410 C820,370 920,420 1000,400 L1000,620 L0,620 Z" fill={c.ground2} opacity="0.6" />
      {/* river / pool */}
      <path d={`M${sx(-20)},300 C${sx(180)},270 ${sx(240)},360 ${sx(360)},340 S${sx(520)},250 ${sx(600)},290`} stroke={c.water} strokeWidth="46" fill="none" strokeLinecap="round" opacity="0.9" />
      <path d={`M${sx(-20)},300 C${sx(180)},270 ${sx(240)},360 ${sx(360)},340 S${sx(520)},250 ${sx(600)},290`} stroke="#fff" strokeWidth="4" fill="none" strokeDasharray="14 22" opacity="0.5" />

      {theme === "reading" && (
        <g>
          <Tree x={sx(160)} y={110} s={1.1} />
          <Tree x={sx(700)} y={150} />
          <Tree x={sx(930)} y={430} s={0.9} />
          {/* castle on the hill */}
          <g transform={`translate(${sx(560)} 70)`}>
            <rect x="-40" y="0" width="80" height="70" fill="#fff4d6" />
            <rect x="-56" y="-20" width="26" height="90" fill="#fff4d6" />
            <rect x="30" y="-20" width="26" height="90" fill="#fff4d6" />
            <path d="M-60 -20 h34 l-17 -26z M26 -20 h34 l-17 -26z" fill="#c8458e" />
            <rect x="-10" y="36" width="20" height="34" rx="10" fill="#8a5a2b" />
          </g>
          {[[80, 520], [380, 560], [520, 470], [870, 600], [250, 210]].map(([x, y], i) => <Flower key={i} x={sx(x)} y={y} c={flowers[(i + variant) % 4]} />)}
        </g>
      )}
      {theme === "maths" && (
        <g>
          {Array.from({ length: 28 }, (_, i) => <Star key={i} x={(i * 137 + variant * 40) % 1000} y={(i * 53) % 130} r={1.5 + (i % 3)} />)}
          <Planet x={sx(150)} y={70} r={34} c="#ffc23d" ring="#ff7a59" />
          <Planet x={sx(820)} y={60} r={22} c="#4a9ff5" />
          <Planet x={sx(940)} y={480} r={40} c="#d6589c" ring="#ffd76a" />
          {[[260, 520], [600, 560], [720, 230]].map(([x, y], i) => <circle key={i} cx={sx(x)} cy={y} r="18" fill="#2a1d6e" opacity="0.35" />)}
          <text x={sx(470)} y="100" fontSize="40" fill="#ffd76a" opacity="0.6" fontWeight="800">+ × − ÷</text>
        </g>
      )}
      {theme === "science" && (
        <g>
          <g transform={`translate(${sx(150)} 60)`}>
            <path d="M-14 0 h28 v26 l30 54 q6 12 -8 12 h-72 q-14 0 -8 -12 l30 -54z" fill="#fff" />
            <path d="M-34 60 h68 l14 26 q6 10 -8 10 h-80 q-14 0 -8 -10z" fill="#6ff0c8" />
          </g>
          <Tree x={sx(780)} y={140} />
          {[[880, 60], [920, 100], [860, 120]].map(([x, y], i) => <circle key={i} cx={sx(x)} cy={y} r={10 - i * 2} fill="#6ff0c8" opacity="0.7" />)}
          {[[300, 540], [600, 520], [940, 560]].map(([x, y], i) => <text key={i} x={sx(x)} y={y} fontSize="34">{["🦋", "🌱", "🐞"][(i + variant) % 3]}</text>)}
        </g>
      )}
      {theme === "logic" && (
        <g>
          <path d={`M${sx(600)},150 L${sx(700)},40 L${sx(800)},150 Z`} fill="#c5551f" />
          <path d={`M${sx(700)},40 L${sx(680)},70 L${sx(720)},70 Z`} fill="#fff" />
          <circle cx={sx(140)} cy="70" r="40" fill="#ffc23d" />
          <Rock x={sx(250)} y={540} s={1.2} />
          <Rock x={sx(620)} y={580} />
          {[[880, 560], [430, 200]].map(([x, y], i) => <text key={i} x={sx(x)} y={y} fontSize="40">{["🌴", "🧩"][i]}</text>)}
        </g>
      )}
      {theme === "coding" && (
        <g>
          <Building x={sx(80)} w={70} h={110} c="#2a5cc4" />
          <Building x={sx(170)} w={60} h={80} c="#3b6fd6" />
          <Building x={sx(720)} w={80} h={120} c="#2a5cc4" />
          <Building x={sx(820)} w={60} h={90} c="#3b6fd6" />
          {/* circuit lines in the ground */}
          {[480, 540].map((y, i) => <path key={y} d={`M0 ${y} h${200 + i * 100} v-30 h200`} stroke="#fff" strokeOpacity="0.35" strokeWidth="4" fill="none" />)}
          {[[940, 560], [420, 210]].map(([x, y], i) => <text key={i} x={sx(x)} y={y} fontSize="36">{["🤖", "⚙️"][(i + variant) % 2]}</text>)}
        </g>
      )}
    </svg>
  );
}

export function themeForSubject(subject: string): MapTheme {
  return (["reading", "maths", "science", "logic", "coding"] as const).find((t) => t === subject) ?? "reading";
}
