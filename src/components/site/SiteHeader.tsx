import { Braces, Play } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { REPO_URL, SITE_NAME } from "@/lib/site";
import { GitHubIcon } from "./GitHubIcon";
import { NavLinks } from "./NavLinks";
import { PlaygroundLink } from "./PlaygroundLink";

export function SiteHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 sm:px-6">
        <Link
          href="/"
          className="order-1 flex items-center gap-2 rounded-md py-1.5 text-sm font-semibold tracking-tight"
        >
          <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Braces className="size-3.5" aria-hidden />
          </span>
          {SITE_NAME}
        </Link>
        <NavLinks className="order-3 -ml-2.5 w-full sm:order-2 sm:ml-auto sm:w-auto" />
        <div className="order-2 ml-auto flex items-center gap-1 sm:order-3 sm:ml-0">
          <Button asChild variant="ghost" size="icon-sm">
            <a href={REPO_URL} aria-label="Source code on GitHub">
              <GitHubIcon className="size-4" />
            </a>
          </Button>
          <Button asChild size="sm">
            <PlaygroundLink>
              <Play className="fill-current" aria-hidden />
              Start Coding
            </PlaygroundLink>
          </Button>
        </div>
      </div>
    </header>
  );
}
