import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/dal";
import { TeacherSignupForm } from "./teacher-signup-form";

export const metadata = { title: "Create a teacher account" };

export default async function TeacherSignupPage() {
  if (await getSession()) redirect("/parent");
  return (
    <>
      <h1 className="text-3xl font-bold">Create your teacher account</h1>
      <p className="mb-6 mt-1 text-ink-soft">Set up classes, print login cards for your students, set activities and follow progress. Free during the school pilot.</p>
      <TeacherSignupForm />
    </>
  );
}
