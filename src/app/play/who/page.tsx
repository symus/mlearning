import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/dal";
import { startPlaying } from "@/app/actions/children";
import { Avatar } from "@/components/avatar";
import { Muchi } from "@/components/mascot";

export const metadata = { title: "Who's learning?" };

export default async function WhoPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.childMode && session.activeChild) redirect("/play");
  const children = await db.childProfile.findMany({ where: { parentId: session.userId }, orderBy: { createdAt: "asc" } });

  return (
    <main className="bg-universe flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10 text-white">
      <Muchi className="size-24" mood="cheer" />
      <h1 className="text-center text-4xl font-bold">Who&apos;s exploring today?</h1>
      {children.length === 0 ? (
        <div className="text-center">
          <p className="text-lg text-white/80">There are no profiles yet.</p>
          <Link href="/parent/children/new" className="mt-4 inline-block rounded-full bg-sun px-6 py-3 font-bold text-ink">Add a child profile</Link>
        </div>
      ) : (
        <ul className="flex flex-wrap justify-center gap-6">
          {children.map((c) => (
            <li key={c.id}>
              <form action={startPlaying.bind(null, c.id)}>
                <button className="group flex w-40 flex-col items-center gap-3 rounded-3xl bg-white/10 p-5 ring-2 ring-white/15 transition hover:-translate-y-1 hover:bg-white/20">
                  <Avatar avatar={c.avatar} size="xl" />
                  <span className="font-display text-2xl font-bold">{c.nickname}</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <Link href="/parent" className="text-sm font-bold text-white/70 underline">Back to the parent area</Link>
    </main>
  );
}
