import { Logo } from "@/components/logo";
import { Muchi } from "@/components/mascot";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh md:grid-cols-[1fr_1.1fr]">
      <aside className="bg-universe relative hidden flex-col justify-between p-10 text-white md:flex">
        <Logo light />
        <div>
          <Muchi className="size-32" mood="cheer" />
          <p className="mt-6 max-w-sm font-display text-3xl font-bold leading-snug">A learning universe that grows with your child.</p>
          <p className="mt-3 max-w-sm text-white/75">Parents create the account and stay in control. Children just get to explore.</p>
        </div>
        <p className="text-sm text-white/60">No ads · No chat · No public profiles</p>
      </aside>
      <main className="flex flex-col px-4 py-8 sm:px-10">
        <div className="md:hidden"><Logo /></div>
        <div className="mx-auto my-auto w-full max-w-md py-8">{children}</div>
      </main>
    </div>
  );
}
