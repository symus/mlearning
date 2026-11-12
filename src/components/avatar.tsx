import clsx from "clsx";
import type { Avatar as AvatarConfig } from "@/lib/validation";
import { AVATAR_PALETTE, CharacterArt } from "@/components/art/characters";

export function Avatar({ avatar, size = "md", className }: { avatar: unknown; size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const a = (avatar ?? {}) as Partial<AvatarConfig>;
  const colour = a.colour ?? "sun";
  const sizes = { sm: "size-9", md: "size-12", lg: "size-20", xl: "size-28" };
  return (
    <span
      aria-hidden
      className={clsx("inline-grid shrink-0 place-items-center overflow-hidden rounded-full ring-4 ring-white/70", sizes[size], className)}
      style={{ background: (AVATAR_PALETTE[colour] ?? AVATAR_PALETTE.sun).bg }}
    >
      <CharacterArt character={a.character ?? "fox"} colour={colour} className="size-[88%] translate-y-[6%]" />
    </span>
  );
}

/** Colour swatch classes used by the onboarding colour picker. */
export const COLOUR_CLASS: Record<string, string> = {
  sun: "bg-sun", coral: "bg-coral", leaf: "bg-leaf", sky: "bg-sky", berry: "bg-berry", sand: "bg-sand",
};
