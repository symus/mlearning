import Link from "next/link";
import { requireTeacher } from "@/lib/auth/dal";
import { logout } from "@/app/actions/auth";
import { Logo } from "@/components/logo";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await requireTeacher();
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Logo href="/teacher" />
          <nav aria-label="Teacher" className="flex items-center gap-1">
            <Link href="/teacher" className="rounded-full px-4 py-2 text-sm font-bold text-ink-soft hover:bg-line/60">My classes</Link>
            <Link href="/teacher/settings" className="rounded-full px-4 py-2 text-sm font-bold text-ink-soft hover:bg-line/60">Settings</Link>
            <form action={logout}>
              <button className="rounded-full px-3 py-2 text-sm font-bold text-ink-soft hover:bg-line/60">Log out</button>
            </form>
          </nav>
        </div>
        <p className="mx-auto max-w-6xl px-4 pb-3 text-sm text-ink-muted">{session.user.displayName}</p>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
