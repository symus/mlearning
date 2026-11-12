import Link from "next/link";
import { redirect } from "next/navigation";
import { requireChild } from "@/lib/auth/dal";
import { getToday } from "@/lib/learning/queries";
import { Avatar } from "@/components/avatar";
import { ChildPrefsProvider, PrefsControls } from "@/components/child/prefs";

export default async function ChildLayout({ children }: { children: React.ReactNode }) {
  const { child } = await requireChild();
  if (!child.onboardedAt) redirect("/play/onboarding");
  const today = await getToday(child.id);
  const pct = Math.min(1, today.minutes / child.dailyGoalMinutes);
  const r = 18, c = 2 * Math.PI * r;

  return (
    <ChildPrefsProvider initial={{ soundEffects: child.soundEffects, narration: child.narration, textSize: (["normal", "large", "xlarge"].includes(child.textSize) ? child.textSize : "normal") as "normal" | "large" | "xlarge" }}>
    <div className="bg-universe min-h-dvh text-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
        <Link href="/play" className="flex items-center gap-3" aria-label="Home: the learning universe">
          <Avatar avatar={child.avatar} size="md" />
          <span className="font-display text-xl font-bold">{child.nickname}</span>
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <PrefsControls />
          <div className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3" title="Today's learning goal">
            <svg viewBox="0 0 44 44" className="size-10 -rotate-90" role="img" aria-label={`Today: ${today.minutes} of ${child.dailyGoalMinutes} minutes`}>
              <circle cx="22" cy="22" r={r} stroke="rgb(255 255 255 / 0.2)" strokeWidth="6" fill="none" />
              <circle cx="22" cy="22" r={r} stroke="#ffc23d" strokeWidth="6" fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" />
            </svg>
            <span className="text-sm font-bold">{pct >= 1 ? "Goal done! 🌙" : `${today.minutes}/${child.dailyGoalMinutes} min`}</span>
          </div>
          <Link href="/play/exit" className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20">Grown-ups</Link>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-5xl px-4 pb-16">{children}</main>
    </div>
    </ChildPrefsProvider>
  );
}
