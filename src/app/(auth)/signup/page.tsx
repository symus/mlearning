import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/dal";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Create a family account" };

export default async function SignupPage() {
  if (await getSession()) redirect("/parent");
  return (
    <>
      <h1 className="text-3xl font-bold">Create your family account</h1>
      <p className="mb-6 mt-1 text-ink-soft">Free to start. You&apos;ll add your child&apos;s profile next.</p>
      <SignupForm />
    </>
  );
}
