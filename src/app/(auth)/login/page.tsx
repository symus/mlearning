import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/dal";
import { LoginForm } from "./login-form";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await getSession();
  if (session) redirect(session.childMode ? "/play" : "/parent");
  const { next } = await searchParams;
  return (
    <>
      <h1 className="text-3xl font-bold">Welcome back</h1>
      <p className="mb-6 mt-1 text-ink-soft">Log in to your family account.</p>
      <LoginForm next={next} />
    </>
  );
}
