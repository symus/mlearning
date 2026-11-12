import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { Logo } from "@/components/logo";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["ADMIN", "REVIEWER"]);
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3"><Logo href="/admin" /><span className="rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-white">Content review</span></div>
          <Link href="/parent" className="text-sm font-bold text-ink-soft hover:text-brand">← Parent area</Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
