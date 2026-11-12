import Link from "next/link";
import { brand } from "@/config/brand";
import { db } from "@/lib/db";
import { AGE_BANDS } from "@/lib/age";
import { WORLDS } from "@/lib/worlds";
import { formatMoney, PLAN_FEATURES, priceRegion } from "@/lib/pricing";
import { COUNTRIES } from "@/lib/validation";
import { ButtonLink } from "@/components/ui/button";
import { Pip } from "@/components/mascot";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";

export default async function Home({ searchParams }: { searchParams: Promise<{ country?: string; accountDeleted?: string }> }) {
  const sp = await searchParams;
  const country = COUNTRIES.some((c) => c.code === sp.country) ? sp.country! : "GB";
  const region = priceRegion(country);
  const prices = await db.price.findMany({ where: { country: region, active: true } });
  const fallback = prices.length ? prices : await db.price.findMany({ where: { country: "*", active: true } });
  const priceFor = (plan: "PREMIUM" | "FAMILY", interval: "month" | "year") => fallback.find((p) => p.plan === plan && p.interval === interval);
  const [activityCount, objectiveCount] = await Promise.all([
    db.activity.count({ where: { status: "PUBLISHED" } }),
    db.objective.count(),
  ]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3" aria-label="Main">
          <Logo />
          <div className="hidden items-center gap-6 text-sm font-bold text-ink-soft md:flex">
            <a href="#worlds" className="hover:text-brand">Worlds</a>
            <a href="#how" className="hover:text-brand">How it works</a>
            <a href="#parents" className="hover:text-brand">For parents</a>
            <a href="#pricing" className="hover:text-brand">Pricing</a>
            <Link href="/safety" className="hover:text-brand">Safety</Link>
          </div>
          <div className="flex items-center gap-2">
            <ButtonLink href="/login" variant="ghost" size="sm">Log in</ButtonLink>
            <ButtonLink href="/signup" size="sm">Start free</ButtonLink>
          </div>
        </nav>
      </header>

      <main id="main">
        {sp.accountDeleted && (
          <p role="status" className="bg-leaf-soft px-4 py-3 text-center text-sm font-bold text-success">
            Your account and all your family&apos;s learning data have been deleted.
          </p>
        )}

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm font-bold text-brand">
                Ages 3–12 · Maths & reading · No ads, ever
              </p>
              <h1 className="text-4xl font-bold leading-tight text-ink sm:text-5xl md:text-6xl">
                Learning that feels like <span className="text-brand">an adventure</span>.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-ink-soft">
                {brand.name} is a learning universe where children explore worlds, solve real challenges and build lasting understanding.
                Every activity is carefully designed, adapts to your child, and shows you exactly what they&apos;ve learned.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/signup" size="lg">Create a free family account</ButtonLink>
                <ButtonLink href="#how" variant="secondary" size="lg">See how it works</ButtonLink>
              </div>
              <p className="mt-4 text-sm text-ink-muted">No card needed. Parents create the account; children never see ads or chat.</p>
            </div>
            <div className="relative">
              <div className="bg-universe relative mx-auto aspect-square max-w-md rounded-[2.5rem] p-6 shadow-2xl">
                <div className="grid h-full grid-cols-2 gap-4">
                  {WORLDS.slice(0, 4).map((w, i) => (
                    <div key={w.slug} className={`flex flex-col justify-end rounded-3xl p-4 text-white ${i % 3 === 0 ? "translate-y-4" : ""}`} style={{ background: `var(--color-world-${w.colour})` }}>
                      <span className="text-4xl" aria-hidden>{w.emoji}</span>
                      <span className="mt-2 font-display text-lg font-bold leading-tight">{w.name}</span>
                    </div>
                  ))}
                </div>
                <Pip className="absolute -bottom-8 -left-6 size-28" mood="cheer" />
              </div>
            </div>
          </div>
        </section>

        {/* Age bands */}
        <section className="bg-surface py-16" aria-labelledby="ages-title">
          <div className="mx-auto max-w-6xl px-4">
            <h2 id="ages-title" className="text-3xl font-bold">Three experiences, designed for how children grow</h2>
            <p className="mt-2 max-w-2xl text-ink-soft">Each age group has its own pace, visual style and way of interacting — not just harder questions.</p>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {Object.values(AGE_BANDS).map((b, i) => (
                <div key={b.band} className="rounded-3xl border-2 border-line p-6">
                  <span className="text-4xl" aria-hidden>{["🎈", "🧩", "🚀"][i]}</span>
                  <h3 className="mt-3 text-xl font-bold">{b.name} <span className="text-ink-muted">· {b.ages}</span></h3>
                  <p className="mt-2 text-ink-soft">{b.description}</p>
                  <p className="mt-3 text-sm font-semibold text-ink-muted">Suggested session: about {b.sessionMinutes} minutes</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Worlds */}
        <section id="worlds" className="bg-universe py-16 text-white" aria-labelledby="worlds-title">
          <div className="mx-auto max-w-6xl px-4">
            <h2 id="worlds-title" className="text-3xl font-bold">Explore the learning universe</h2>
            <p className="mt-2 max-w-2xl text-white/80">Every world has learning paths, missions and achievements. Two worlds are open now; more arrive as each is carefully built and reviewed.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {WORLDS.map((w) => (
                <div key={w.slug} className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                  <div className="flex items-center justify-between">
                    <span className="grid size-14 place-items-center rounded-2xl text-3xl" style={{ background: `var(--color-world-${w.colour})` }} aria-hidden>{w.emoji}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${w.status === "open" ? "bg-leaf text-white" : "bg-white/20"}`}>{w.status === "open" ? "Open now" : "Coming soon"}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{w.name}</h3>
                  <p className="mt-1 text-sm text-white/75">{w.tagline}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="py-16" aria-labelledby="how-title">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2">
            <div>
              <h2 id="how-title" className="text-3xl font-bold">Built by educators, not generated in bulk</h2>
              <p className="mt-3 text-ink-soft">
                Every activity follows the same professional structure and is reviewed before children see it. Today there are{" "}
                <strong>{activityCount} published activities</strong> covering <strong>{objectiveCount} learning objectives</strong>, mapped to the England National Curriculum and EYFS.
              </p>
              <ol className="mt-6 space-y-4">
                {[
                  ["Learn", "A short, child-friendly explanation with a visual model — ten frames, number lines, arrays, fraction bars."],
                  ["Practise at the right level", "Difficulty steps up after two clean answers and down after two misses."],
                  ["Get help that fits the mistake", "Each wrong answer is linked to a known misconception, so help targets why it happened."],
                  ["Show mastery", "A skill counts as mastered only when accuracy, level and consistency criteria are all met."],
                  ["Come back at the right time", "Spaced review brings skills back after 1, 3, 7, 14 and 30 days so learning sticks."],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand font-bold text-white">{i + 1}</span>
                    <div>
                      <p className="font-bold">{t}</p>
                      <p className="text-ink-soft">{d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-3xl border-2 border-line bg-surface p-6 shadow-[var(--shadow-card)]">
              <p className="text-sm font-bold uppercase tracking-wide text-ink-muted">Example · Young Thinkers · Maths</p>
              <h3 className="mt-2 text-2xl font-bold">Bridge Through 10</h3>
              <p className="mt-3 rounded-2xl bg-sun-soft p-4 text-ink">To add numbers that cross 10, make a 10 first. For 8 + 5: take 2 from the 5 to fill up to 10, then add the 3 left over.</p>
              <div className="mt-4 rounded-2xl border-2 border-line p-4">
                <p className="text-xl font-bold">9 + 6 = ?</p>
                <div className="mt-3 space-y-2 text-sm">
                  <p><span className="font-bold text-brand">Hint 1:</span> 9 needs 1 more to make 10.</p>
                  <p><span className="font-bold text-coral">If the answer is 14:</span> “Count the jumps, not the number you start on.”</p>
                  <p><span className="font-bold text-success">Explanation:</span> 9 + 1 = 10, then add the other 5: 15.</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-ink-muted">Mastery: 80% accuracy over at least 5 questions, including level 2.</p>
            </div>
          </div>
        </section>

        {/* Parents */}
        <section id="parents" className="bg-surface py-16" aria-labelledby="parents-title">
          <div className="mx-auto max-w-6xl px-4">
            <h2 id="parents-title" className="text-3xl font-bold">See real progress, not just scores</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                ["🎯", "Progress by skill", "See which learning objectives are mastered, in progress or due for review."],
                ["🔍", "Why mistakes happen", "Spot recurring misconceptions, such as counting the start number when adding."],
                ["⏱️", "Healthy time", "Gentle daily goals, natural stopping points and no streak pressure."],
              ].map(([e, t, d]) => (
                <div key={t} className="rounded-3xl bg-paper p-6">
                  <span className="text-3xl" aria-hidden>{e}</span>
                  <h3 className="mt-3 text-lg font-bold">{t}</h3>
                  <p className="mt-1 text-ink-soft">{d}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 rounded-3xl border-2 border-leaf/30 bg-leaf-soft p-6">
              <h3 className="text-xl font-bold text-ink">Our safety promises</h3>
              <ul className="mt-3 grid gap-2 text-ink-soft sm:grid-cols-2">
                <li>✔ No advertising and no tracking for ads</li>
                <li>✔ No chat, messaging or public profiles</li>
                <li>✔ Only a nickname and birth year stored for children</li>
                <li>✔ A parent PIN guards settings and purchases</li>
                <li>✔ Export or delete your family&apos;s data at any time</li>
                <li>✔ Designed with GDPR and the UK Children&apos;s Code in mind</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16" aria-labelledby="pricing-title">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="pricing-title" className="text-3xl font-bold">Simple, honest pricing</h2>
                <p className="mt-2 text-ink-soft">Prices shown for your country. No hidden fees, no fake countdowns. Cancel any time.</p>
              </div>
              <form className="flex items-center gap-2" action="/#pricing">
                <label htmlFor="country" className="text-sm font-bold">Country</label>
                <select id="country" name="country" defaultValue={country} className="rounded-xl border-2 border-line bg-surface px-3 py-2">
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
                <button className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">Update</button>
              </form>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {(["FREE", "PREMIUM", "FAMILY"] as const).map((plan) => {
                const info = PLAN_FEATURES[plan];
                const m = plan === "FREE" ? null : priceFor(plan, "month");
                const y = plan === "FREE" ? null : priceFor(plan, "year");
                return (
                  <div key={plan} className={`flex flex-col rounded-3xl border-2 p-6 ${plan === "FAMILY" ? "border-brand bg-brand-soft/40" : "border-line bg-surface"}`}>
                    <h3 className="text-xl font-bold">{info.name}</h3>
                    <p className="text-ink-soft">{info.summary}</p>
                    <p className="mt-4 font-display text-3xl font-bold">
                      {plan === "FREE" ? "Free" : m ? formatMoney(m.amountMinor, m.currency) : "—"}
                      {m && <span className="text-base font-semibold text-ink-muted"> / month</span>}
                    </p>
                    {y && <p className="text-sm text-ink-muted">or {formatMoney(y.amountMinor, y.currency)} billed yearly</p>}
                    <ul className="mt-4 flex-1 space-y-2 text-sm text-ink-soft">
                      {info.features.map((f) => <li key={f}>✔ {f}</li>)}
                    </ul>
                    <ButtonLink href="/signup" className="mt-6" variant={plan === "FAMILY" ? "primary" : "secondary"}>
                      {plan === "FREE" ? "Start free" : "Start free, upgrade later"}
                    </ButtonLink>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-sm text-ink-muted">Paid plans open with secure checkout in a coming release. Everyone starts on Free.</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-surface py-16" aria-labelledby="faq-title">
          <div className="mx-auto max-w-3xl px-4">
            <h2 id="faq-title" className="text-3xl font-bold">Questions parents ask</h2>
            <div className="mt-6 space-y-3">
              {[
                ["Does it use AI to make questions?", "No. Every activity is written and reviewed by people against a strict content standard. We plan to use AI only for carefully checked extra explanations, never to invent answers in real time."],
                ["How long should my child use it?", "We suggest about 10 minutes a day for ages 3–5, 20 for 6–8 and 30 for 9–12. The app shows natural stopping points and never pressures children to keep going."],
                ["Which curriculum does it follow?", "Objectives are mapped to the England National Curriculum and EYFS today. The mapping is configurable so we can add Polish, Indian and other curricula."],
                ["Can my child buy things or talk to strangers?", "No. Children cannot make purchases, send messages or see other children. Leaving child mode needs your parent PIN."],
                ["Will it improve my child's grades?", "We don't promise grades or measure intelligence. We show what your child practised, what they've mastered, and where they need support."],
              ].map(([q, a]) => (
                <details key={q} className="group rounded-2xl border-2 border-line p-4 open:border-brand">
                  <summary className="cursor-pointer list-none font-bold marker:hidden">{q}</summary>
                  <p className="mt-2 text-ink-soft">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
