"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/javascript", label: "JavaScript" },
  { href: "/typescript", label: "TypeScript" },
  { href: "/examples", label: "Examples" },
] as const;

/** Main navigation; marks the current section with `aria-current`. */
export function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className={className}>
      <ul className="flex items-center gap-1">
        {LINKS.map(({ href, label }) => {
          const current =
            pathname === href || pathname.startsWith(`${href}/`)
              ? "page"
              : undefined;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  current && "text-foreground",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
