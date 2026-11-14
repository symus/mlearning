import Link from "next/link";
import { brand } from "@/config/brand";
import { db } from "@/lib/db";
import { AGE_BANDS } from "@/lib/age";
import { WORLDS } from "@/lib/worlds";
import { formatMoney, PLAN_FEATURES, priceRegion } from "@/lib/pricing";
import { COUNTRIES } from "@/lib/validation";
import { ButtonLink } from "@/components/ui/button";
import { Muchi } from "@/components/mascot";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { WorldArt } from "@/components/art/worlds";
import { CharacterArt } from "@/components/art/characters";
import { Visual } from "@/components/child/visual";

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
        <section className="bg-universe relative overflow-hidden text-white">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {Array.from({ length: 24 }, (_, i) => (
              <span key={i} className="animate-twinkle absolute rounded-full bg-white" style={{ left: `${(i * 37.3) % 100}%`, top: `${(i * 61.7) % 100}%`, width: 2 + (i % 3), height: 2 + (i % 3), animationDelay: `${(i % 7) * 0.4}s` }} />
            ))}
          </div>
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1.05fr_1fr] md:py-24">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold ring-1 ring-white/20">
                Ages 3–12 · Maths &amp; reading · No ads, ever
              </p>
              <h1 className="text-4xl font-bold leading-[1.08] sm:text-5xl md:text-6xl">
                Where every child becomes a <span className="text-sun">child of knowledge</span>.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-white/80">
                <strong className="text-white">{brand.name}</strong> (அறிவுப்புள்ள) is a learning universe of worlds to explore, songs to sing and real challenges to solve.
                Every activity is written by educators, adapts to your child, and shows you exactly what they&apos;ve learned.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/signup" size="lg" variant="sun">Create a free family account</ButtonLink>
                <a href="#how" className="inline-flex min-h-14 items-center rounded-full px-6 text-lg font-bold text-white ring-2 ring-white/30 hover:bg-white/10">See how it works</a>
              </div>
              <p className="mt-4 text-sm text-white/65">No card needed · Parents stay in control · Children never see ads or chat</p>
              <p className="mt-2 text-sm text-white/80">
                A teacher? <a href="/signup/teacher" className="font-bold text-white underline underline-offset-2">Set up your class</a>: login cards, assignments and class progress. Free during the school pilot.
              </p>
            </div>
            <div className="relative mx-auto aspect-square w-full max-w-md" aria-hidden>
              <WorldArt slug="math-galaxy" float className="absolute left-0 top-2 w-[46%]" />
              <WorldArt slug="reading-kingdom" float className="absolute right-0 top-10 w-[44%] [animation-delay:1.2s]" />
              <WorldArt slug="science-lab" float className="absolute bottom-0 left-[10%] w-[36%] opacity-80 [animation-delay:2s]" />
              <WorldArt slug="money-mission" float className="absolute bottom-6 right-[6%] w-[34%] opacity-80 [animation-delay:.6s]" />
              <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-end">
                <Muchi className="animate-float size-32 drop-shadow-xl" mood="cheer" />
                <CharacterArt character="fox" colour="coral" className="-ml-4 size-20 drop-shadow-xl" />
              </div>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section aria-label="Our promises" className="border-b border-line bg-surface">
          <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-5 text-sm font-bold text-ink-soft md:grid-cols-4">
            {[
              ["🚫", "No ads, no chat, no strangers"],
              ["🧑‍🏫", `${activityCount} educator-written activities`],
              ["🎯", `${objectiveCount} objectives mapped to curriculum`],
              ["🔐", "Parent PIN · GDPR-minded design"],
            ].map(([e, t]) => (
              <li key={t} className="flex items-center gap-2"><span aria-hidden className="text-xl">{e}</span>{t}</li>
            ))}
          </ul>
        </section>

        {/* Age bands */}
        <section className="py-20" aria-labelledby="ages-title">
          <div className="mx-auto max-w-6xl px-4">
            <p className="text-sm font-bold uppercase tracking-wider text-brand">Grows with your child</p>
            <h2 id="ages-title" className="mt-1 text-3xl font-bold sm:text-4xl">Three experiences, designed for how children grow</h2>
            <p className="mt-3 max-w-2xl text-lg text-ink-soft">Each age group has its own pace, look and way of interacting — not just harder questions.</p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {Object.values(AGE_BANDS).map((b, i) => {
                const look = [
                  { character: "bear", colour: "sun", bg: "bg-sun-soft", detail: "Voice-led · big picture buttons · songs" },
                  { character: "owl", colour: "sky", bg: "bg-sky-soft", detail: "Read & listen · keypad · puzzles" },
                  { character: "robot", colour: "berry", bg: "bg-berry-soft", detail: "Text-first · reasoning · projects" },
                ][i];
                return (
                  <div key={b.band} className="group rounded-[2rem] border border-line bg-surface p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1">
                    <div className={`grid h-36 place-items-center rounded-3xl ${look.bg}`}>
                      <CharacterArt character={look.character} colour={look.colour} className="size-28 transition group-hover:scale-110" />
                    </div>
                    <h3 className="mt-5 text-2xl font-bold">{b.name}</h3>
                    <p className="text-sm font-bold text-ink-muted">Ages {b.ages} · about {b.sessionMinutes} min a day</p>
                    <p className="mt-3 text-ink-soft">{b.description}</p>
                    <p className="mt-4 text-sm font-semibold text-brand">{look.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Worlds */}
        <section id="worlds" className="bg-universe py-20 text-white" aria-labelledby="worlds-title">
          <div className="mx-auto max-w-6xl px-4">
            <p className="text-sm font-bold uppercase tracking-wider text-sun">The learning universe</p>
            <h2 id="worlds-title" className="mt-1 text-3xl font-bold sm:text-4xl">Not a list of lessons. A universe to explore.</h2>
            <p className="mt-3 max-w-2xl text-lg text-white/80">Every world has learning paths, songs and achievements. Two worlds are open now; more arrive as each is carefully built and reviewed.</p>
            <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
              {WORLDS.map((w) => (
                <div key={w.slug} className="text-center">
                  <WorldArt slug={w.slug} float={w.status === "open"} className={`mx-auto w-full max-w-40 ${w.status === "soon" ? "opacity-60 saturate-50" : ""}`} />
                  <h3 className="mt-2 font-display text-xl font-bold">{w.name}</h3>
                  <p className="text-sm text-white/70">{w.tagline}</p>
                  <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${w.status === "open" ? "bg-leaf text-white" : "bg-white/15"}`}>{w.status === "open" ? "Open now" : "Coming soon"}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Watch & Sing */}
        <section className="py-20" aria-labelledby="sing-title">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
            <div className="order-2 rounded-[2rem] border border-line bg-surface p-6 shadow-[var(--shadow-card)] md:order-1">
              <p className="inline-block rounded-full bg-berry-soft px-3 py-1 text-sm font-bold text-berry">🎵 Watch &amp; Sing · Make Ten!</p>
              <div className="mt-4 grid place-items-center rounded-3xl bg-gradient-to-b from-sky-soft to-paper p-6">
                <Visual visual={{ kind: "tenFrame", filled: 7 }} />
              </div>
              <ol className="mt-4 space-y-1.5 text-lg">
                <li className="text-ink-muted">Two and eight, that&apos;s great!</li>
                <li className="rounded-xl bg-sun-soft px-3 py-1 font-bold">Three and <span className="rounded bg-sun px-1">seven</span>, we&apos;re counting to heaven!</li>
                <li className="text-ink-soft">Four and six, a magic trick!</li>
              </ol>
            </div>
            <div className="order-1 md:order-2">
              <p className="text-sm font-bold uppercase tracking-wider text-berry">Songs that teach</p>
              <h2 id="sing-title" className="mt-1 text-3xl font-bold sm:text-4xl">Rhymes and phonics songs, then practice</h2>
              <p className="mt-3 text-lg text-ink-soft">
                Original sing-alongs open many activities: counting songs, shape songs, letter-sound songs and rhyme raps. Words light up as they are read aloud,
                so pre-readers follow along — and then put the idea straight into practice.
              </p>
              <ul className="mt-5 space-y-2 text-ink-soft">
                <li>✔ Original lyrics written for each learning objective</li>
                <li>✔ Karaoke-style highlighting builds early reading</li>
                <li>✔ Never autoplays — children press play</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="bg-surface py-20" aria-labelledby="how-title">
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
        <section id="parents" className="py-20" aria-labelledby="parents-title">
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
