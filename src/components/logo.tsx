import Link from "next/link";
import { brand } from "@/config/brand";

export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2 font-display text-xl font-bold ${light ? "text-white" : "text-ink"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="" width={32} height={32} className="rounded-lg" />
      {brand.name}
    </Link>
  );
}
