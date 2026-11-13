import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/dal";
import { logout } from "@/app/actions/auth";
import { ExitForm } from "./exit-form";

export const metadata = { title: "Grown-ups only" };

export default async function ExitPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.childMode) redirect("/parent");
  if (session.childOnly) {
    // Signed in with a child's QR card: the PIN is not enough; a grown-up must log in properly.
    return (
      <main className="bg-universe flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center text-white">
        <span className="text-6xl" aria-hidden>🔐</span>
        <h1 className="text-3xl font-bold">Grown-ups only</h1>
        <p className="max-w-sm text-white/80">This device signed in with {session.activeChild?.nickname ?? "a child"}&apos;s login card. To open reports and settings, log in with your email and password.</p>
        <Link href="/login?next=/parent" className="btn-pop rounded-full bg-sun px-8 py-3 font-bold text-ink">Log in as a grown-up</Link>
        <form action={logout}>
          <button className="text-sm font-bold text-white/70 underline">Sign this card out of this device</button>
        </form>
        <Link href="/play" className="font-bold text-white/80 underline">← Back to playing</Link>
      </main>
    );
  }
  return (
    <main className="bg-universe flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-white">
      <span className="text-6xl" aria-hidden>🔐</span>
      <h1 className="text-center text-3xl font-bold">Grown-ups only</h1>
      <p className="max-w-sm text-center text-white/80">Enter the 4-digit parent PIN to open reports and settings.</p>
      <ExitForm />
      <Link href="/play" className="font-bold text-white/80 underline">← Back to playing</Link>
    </main>
  );
}
