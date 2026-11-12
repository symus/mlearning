import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/dal";
import { ExitForm } from "./exit-form";

export const metadata = { title: "Grown-ups only" };

export default async function ExitPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.childMode) redirect("/parent");
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
