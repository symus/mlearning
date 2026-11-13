"use client";

import { ErrorScreen } from "@/components/state-screens";

export default function ParentError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorScreen reset={reset} homeHref="/parent" />;
}
