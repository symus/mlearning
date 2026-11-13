import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/dal";
import { LoginForm } from "./login-form";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; card?: string }> }) {
  const session = await getSession();
  // A child-card session may log in as a parent here; other sessions skip the form.
  if (session && !session.childOnly) redirect(session.childMode ? "/play" : "/parent");
  const { next, card } = await searchParams;
  return (
    <>
      {card === "invalid" && (
        <p role="alert" className="mb-4 rounded-xl bg-danger-soft px-4 py-3 font-bold text-danger">That login card no longer works. Ask a grown-up to print a new one.</p>
      )}
      <h1 className="text-3xl font-bold">Welcome back</h1>
      <p className="mb-6 mt-1 text-ink-soft">Log in to your family account.</p>
      <LoginForm next={next} />
      <div className="mt-8 rounded-2xl border-2 border-dashed border-line p-4 text-center">
        <p className="font-bold">Are you a child with a login card?</p>
        <Link href="/login/qr" className="btn-pop mt-3 inline-flex min-h-12 items-center gap-2 rounded-full bg-berry px-6 font-bold text-white">📷 Scan my card</Link>
      </div>
    </>
  );
}
