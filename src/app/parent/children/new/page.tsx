import { createChild } from "@/app/actions/children";
import { requireParent } from "@/lib/auth/dal";
import { Card } from "@/components/ui/card";
import { ChildForm } from "@/components/parent/child-form";

export const metadata = { title: "Add a child" };

export default async function NewChildPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  await requireParent();
  const { welcome } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl">
      {welcome && <p role="status" className="mb-6 rounded-xl bg-leaf-soft px-4 py-3 font-bold text-success">Your account is ready. Now let&apos;s add your child.</p>}
      <h1 className="text-3xl font-bold">Add a child</h1>
      <p className="mb-6 mt-1 text-ink-soft">We only ask for what we need to choose the right learning experience.</p>
      <Card><ChildForm action={createChild} submitLabel="Create profile" /></Card>
    </div>
  );
}
