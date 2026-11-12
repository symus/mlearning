import type { ReactNode } from "react";
import { Logo } from "./logo";
import { SiteFooter } from "./site-footer";

export function ProsePage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto max-w-3xl px-4 py-4"><Logo /></div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_p]:mt-3 [&_p]:text-ink-soft [&_ul]:mt-3 [&_ul]:space-y-1 [&_ul]:text-ink-soft">
        <h1 className="text-4xl font-bold">{title}</h1>
        <p className="text-sm text-ink-muted">Last updated {updated}. Draft for legal review before launch.</p>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
