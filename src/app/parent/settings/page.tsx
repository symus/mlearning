import { db } from "@/lib/db";
import { requireParent } from "@/lib/auth/dal";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { ChangePinForm, DeleteAccountForm } from "./settings-forms";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await requireParent();
  const consents = await db.consentRecord.findMany({ where: { userId: session.userId }, orderBy: { grantedAt: "asc" } });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold">Account</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <div><dt className="inline font-bold">Name: </dt><dd className="inline">{session.user.displayName}</dd></div>
            <div><dt className="inline font-bold">Email: </dt><dd className="inline">{session.user.email}</dd></div>
            <div><dt className="inline font-bold">Country: </dt><dd className="inline">{session.user.country}</dd></div>
          </dl>
          <h3 className="mt-5 font-bold">Consent records</h3>
          <ul className="mt-1 text-sm text-ink-soft">
            {consents.map((c) => <li key={c.id}>{c.type.replace("_", " ").toLowerCase()} · version {c.version} · {c.grantedAt.toLocaleDateString("en-GB")}</li>)}
          </ul>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">Parent PIN</h2>
          <p className="mb-4 mt-1 text-sm text-ink-soft">The PIN is needed to leave child mode, so children can&apos;t reach reports, settings or billing.</p>
          <ChangePinForm />
        </Card>
        <Card>
          <h2 className="text-xl font-bold">Your data</h2>
          <p className="mt-1 text-sm text-ink-soft">Download everything we store about your family as a JSON file (account, child profiles, learning records).</p>
          <ButtonLink href="/parent/export" variant="secondary" className="mt-4" prefetch={false}>Download my data</ButtonLink>
        </Card>
        <Card className="border-danger/30">
          <h2 className="text-xl font-bold text-danger">Delete account</h2>
          <p className="mb-4 mt-1 text-sm text-ink-soft">Permanently deletes your account, every child profile and all learning records.</p>
          <DeleteAccountForm />
        </Card>
      </div>
    </div>
  );
}
