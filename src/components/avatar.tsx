import clsx from "clsx";
import type { Avatar as AvatarConfig } from "@/lib/validation";

export const CHARACTER_EMOJI: Record<string, string> = { fox: "🦊", owl: "🦉", bear: "🐻", cat: "🐱", dragon: "🐲", robot: "🤖" };
export const COLOUR_CLASS: Record<string, string> = {
  sun: "bg-sun", coral: "bg-coral", leaf: "bg-leaf", sky: "bg-sky", berry: "bg-berry", sand: "bg-sand",
};

export function Avatar({ avatar, size = "md", className }: { avatar: unknown; size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const a = (avatar ?? {}) as Partial<AvatarConfig>;
  const sizes = { sm: "size-9 text-lg", md: "size-12 text-2xl", lg: "size-20 text-4xl", xl: "size-28 text-6xl" };
  return (
    <span aria-hidden className={clsx("inline-grid shrink-0 place-items-center rounded-full ring-4 ring-white/70", COLOUR_CLASS[a.colour ?? "sun"] ?? "bg-sun", sizes[size], className)}>
      {CHARACTER_EMOJI[a.character ?? "fox"] ?? "🦊"}
    </span>
  );
}
