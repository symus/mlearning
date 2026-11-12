import Link from "next/link";
import { Muchi } from "@/components/mascot";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <Muchi className="size-28" mood="think" />
      <h1 className="text-3xl font-bold">We couldn&apos;t find that page</h1>
      <p className="text-ink-soft">It may have moved, or the link might be wrong.</p>
      <Link href="/" className="rounded-full bg-brand px-6 py-3 font-bold text-white">Go to the home page</Link>
    </main>
  );
}
