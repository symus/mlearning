import { db } from "@/lib/db";
import { requireParent } from "@/lib/auth/dal";
import { getPlan } from "@/lib/learning/queries";
import { formatMoney, PLAN_FEATURES, priceRegion } from "@/lib/pricing";
import { Badge, Card } from "@/components/ui/card";

export const metadata = { title: "Plan" };

export default async function PlansPage() {
  const session = await requireParent();
  const plan = await getPlan(session.userId);
  const region = priceRegion(session.user.country);
  let prices = await db.price.findMany({ where: { country: region, active: true } });
  if (!prices.length) prices = await db.price.findMany({ where: { country: "*", active: true } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your plan</h1>
        <p className="mt-1 text-ink-soft">You&apos;re on the <strong>{PLAN_FEATURES[plan].name}</strong> plan. Prices shown for {session.user.country}.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {(["FREE", "PREMIUM", "FAMILY"] as const).map((p) => {
          const info = PLAN_FEATURES[p];
          const m = prices.find((x) => x.plan === p && x.interval === "month");
          const y = prices.find((x) => x.plan === p && x.interval === "year");
          return (
            <Card key={p} className={p === plan ? "border-2 border-brand" : ""}>
              <div className="flex items-center justify-between"><h2 className="text-xl font-bold">{info.name}</h2>{p === plan && <Badge tone="brand">Current</Badge>}</div>
              <p className="mt-2 font-display text-2xl font-bold">{p === "FREE" ? "Free" : m ? `${formatMoney(m.amountMinor, m.currency)} / month` : "—"}</p>
              {y && <p className="text-sm text-ink-muted">or {formatMoney(y.amountMinor, y.currency)} / year</p>}
              <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">{info.features.map((f) => <li key={f}>✔ {f}</li>)}</ul>
            </Card>
          );
        })}
      </div>
      <Card className="bg-brand-soft/40">
        <h2 className="text-lg font-bold">Upgrading</h2>
        <p className="mt-1 text-ink-soft">
          Secure card payments (via Stripe) arrive in the next release. Until then every family uses the Free plan, and your child&apos;s progress
          carries over automatically when you upgrade. Children can never see prices or buy anything.
        </p>
      </Card>
    </div>
  );
}
