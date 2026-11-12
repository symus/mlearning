import { requireParent } from "@/lib/auth/dal";
import { logout } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";
import { ParentNav } from "@/components/parent/parent-nav";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireParent();
  const isStaff = session.user.role === "ADMIN" || session.user.role === "REVIEWER";
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Logo href="/parent" />
          <div className="flex items-center gap-2">
            <ButtonLink href="/play/who" variant="sun" size="sm">▶ Let a child play</ButtonLink>
            <form action={logout}>
              <button className="rounded-full px-3 py-2 text-sm font-bold text-ink-soft hover:bg-line/60">Log out</button>
            </form>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-3">
          <ParentNav isStaff={isStaff} />
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
