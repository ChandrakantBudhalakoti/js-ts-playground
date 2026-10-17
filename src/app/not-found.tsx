import { Play } from "lucide-react";
import Link from "next/link";
import { PlaygroundLink } from "@/components/site/PlaygroundLink";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Button } from "@/components/ui/button";

// Next.js responds with a 404 status and adds `noindex` to this page.
export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          This page doesn&apos;t exist
        </h1>
        <p className="mt-3 max-w-lg text-muted-foreground">
          The link may be out of date, or the address may have a typo. Your code
          drafts are safe: they are saved in your browser.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <PlaygroundLink>
              <Play className="fill-current" aria-hidden />
              Open the playground
            </PlaygroundLink>
          </Button>
          <Button asChild variant="outline">
            <Link href="/examples">Browse examples</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">Home page</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
