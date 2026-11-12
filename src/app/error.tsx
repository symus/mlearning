"use client";

import { ErrorScreen } from "@/components/state-screens";

export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return <main className="px-4 py-16"><ErrorScreen reset={reset} homeHref="/" /></main>;
}
