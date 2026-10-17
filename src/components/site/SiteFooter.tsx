import Link from "next/link";
import { REPO_URL, SITE_NAME } from "@/lib/site";
import { PlaygroundLink } from "./PlaygroundLink";

const PAGES = [
  { href: "/javascript", label: "JavaScript playground" },
  { href: "/typescript", label: "TypeScript playground" },
  { href: "/examples", label: "Examples" },
];

const PROJECT = [
  { href: REPO_URL, label: "Source code" },
  { href: `${REPO_URL}/issues/new/choose`, label: "Report a bug" },
  { href: `${REPO_URL}/blob/main/CONTRIBUTING.md`, label: "Contributing" },
];

const LINK = "text-muted-foreground hover:text-foreground hover:underline";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 text-sm sm:grid-cols-3 sm:px-6">
        <div className="space-y-2">
          <p className="font-semibold">{SITE_NAME}</p>
          <p className="text-muted-foreground">
            Free and open source under the MIT license.
          </p>
        </div>
        <nav aria-label="Pages">
          <ul className="space-y-2">
            <li>
              <PlaygroundLink className={LINK}>Playground</PlaygroundLink>
            </li>
            {PAGES.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className={LINK}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Project">
          <ul className="space-y-2">
            {PROJECT.map(({ href, label }) => (
              <li key={href}>
                <a href={href} className={LINK}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
