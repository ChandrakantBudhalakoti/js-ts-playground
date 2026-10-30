import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { absoluteUrl } from "@/lib/site";
import { JsonLd } from "./JsonLd";

export interface Crumb {
  name: string;
  path: string;
}

/** A breadcrumb trail (the last crumb is the current page) and its BreadcrumbList data. */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: crumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.name,
            item: absoluteUrl(crumb.path),
          })),
        }}
      />
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {crumbs.slice(0, -1).map((crumb) => (
            <li key={crumb.path} className="flex items-center gap-1">
              <Link href={crumb.path} className="hover:underline">
                {crumb.name}
              </Link>
              <ChevronRight className="size-3.5" aria-hidden />
            </li>
          ))}
          <li aria-current="page" className="text-foreground">
            {crumbs.at(-1)?.name}
          </li>
        </ol>
      </nav>
    </>
  );
}
