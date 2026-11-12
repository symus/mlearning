/** Decorative twinkling stars, placed deterministically (same on server and client). */
export function Starfield({ count = 28 }: { count?: number }) {
  const stars = Array.from({ length: count }, (_, i) => {
    const x = (i * 37.3) % 100;
    const y = (i * 61.7) % 100;
    return { x, y, size: 2 + (i % 3), delay: (i % 7) * 0.4 };
  });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <span
          key={i}
          className="animate-twinkle absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}
        />
      ))}
    </div>
  );
}
