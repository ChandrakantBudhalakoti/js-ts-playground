"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** Shown if a page crashes while rendering. */
export default function ErrorPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-3 text-muted-foreground">
        The page hit an unexpected error. The playground saves your draft in
        this browser as you type, so trying again or reloading should bring your
        code back.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={() => retry()}>
          <RotateCcw aria-hidden />
          Try again
        </Button>
        <Button asChild variant="outline">
          {/* A full page load, which also recovers from client-side state. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">Home page</a>
        </Button>
      </div>
    </main>
  );
}
