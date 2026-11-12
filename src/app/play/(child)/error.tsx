"use client";

import { ErrorScreen } from "@/components/state-screens";

export default function ChildError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorScreen reset={reset} dark homeHref="/play" />;
}
