"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const LINKS = [
  { href: "/parent", label: "Overview" },
  { href: "/parent/children/new", label: "Add child" },
  { href: "/parent/plans", label: "Plan" },
  { href: "/parent/settings", label: "Settings" },
];

export function ParentNav({ isStaff }: { isStaff: boolean }) {
  const path = usePathname();
  const links = isStaff ? [...LINKS, { href: "/admin", label: "Content review" }] : LINKS;
  return (
    <nav aria-label="Parent" className="-mx-4 flex gap-1 overflow-x-auto px-4">
      {links.map((l) => {
        const active = l.href === "/parent" ? path === "/parent" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={clsx("whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold", active ? "bg-ink text-white" : "text-ink-soft hover:bg-line/60")}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
