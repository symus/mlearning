import Link from "next/link";
import { brand } from "@/config/brand";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo />
          <p className="mt-2 max-w-sm text-sm text-ink-muted">{brand.tagline}. No ads. No chat. No public profiles.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-ink-soft">
          <Link href="/safety" className="hover:text-brand">Child safety</Link>
          <Link href="/privacy" className="hover:text-brand">Privacy notice</Link>
          <Link href="/terms" className="hover:text-brand">Terms</Link>
          <a href={`mailto:${brand.supportEmail}`} className="hover:text-brand">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
