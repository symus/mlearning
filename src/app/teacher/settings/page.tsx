import { db } from "@/lib/db";
import { requireTeacher } from "@/lib/auth/dal";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { DeleteAccountForm } from "@/app/parent/settings/settings-forms";

export const metadata = { title: "Settings" };

export default async function TeacherSettingsPage() {
  const session = await requireTeacher();
  const [user, consents] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: session.userId }, select: { schoolName: true } }),
    db.consentRecord.findMany({ where: { userId: session.userId }, orderBy: { grantedAt: "asc" } }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold">Account</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <div><dt className="inline font-bold">Name: </dt><dd className="inline">{session.user.displayName}</dd></div>
            <div><dt className="inline font-bold">School: </dt><dd className="inline">{user.schoolName}</dd></div>
            <div><dt className="inline font-bold">Email: </dt><dd className="inline">{session.user.email}</dd></div>
          </dl>
          <h3 className="mt-5 font-bold">Consent records</h3>
          <ul className="mt-1 text-sm text-ink-soft">
            {consents.map((c) => <li key={c.id}>{c.type.replaceAll("_", " ").toLowerCase()} · version {c.version} · {c.grantedAt.toLocaleDateString("en-GB")}</li>)}
          </ul>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">Your data</h2>
          <p className="mt-1 text-sm text-ink-soft">Download everything we store for your account and your students as a JSON file.</p>
          <ButtonLink href="/parent/export" variant="secondary" className="mt-4" prefetch={false}>Download my data</ButtonLink>
        </Card>
        <Card className="border-danger/30">
          <h2 className="text-xl font-bold text-danger">Delete account</h2>
          <p className="mb-4 mt-1 text-sm text-ink-soft">Permanently deletes your account, every class, every student profile and all their learning records.</p>
          <DeleteAccountForm />
        </Card>
      </div>
    </div>
  );
}
