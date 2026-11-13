import Link from "next/link";
import { ChildLoginForm } from "./child-login-form";

export const metadata = { title: "Log in with my card" };

export default function ChildLoginPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Hello, explorer! 👋</h1>
      <p className="mb-6 mt-1 text-ink-soft">Type the login ID and password from your card.</p>
      <ChildLoginForm />
      <p className="mt-6 text-center text-sm text-ink-muted">
        <Link href="/login/qr" className="font-bold text-brand underline">📷 Scan my card instead</Link>
        {" · "}
        <Link href="/login" className="font-bold text-brand underline">Grown-ups log in here</Link>
      </p>
    </>
  );
}
