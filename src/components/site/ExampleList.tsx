import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";
import { EXAMPLES, isProgramExample, playgroundHref } from "@/lib/examples";
import { GUIDES } from "@/lib/guides";
import type { Language } from "@/types/playground";
import { PlaygroundLink } from "./PlaygroundLink";

/**
 * The playground's examples for one language, each opening in the editor.
 * The beginner programs are listed separately (ProgramList).
 */
export function ExampleList({ language }: { language: Language }) {
  const examples = EXAMPLES.filter(
    (example) => example.language === language && !isProgramExample(example),
  );
  return (
    <ul className="divide-y rounded-xl border">
      {examples.map((example) => {
        const guide = GUIDES.find((g) => g.exampleId === example.id);
        return (
          <li
            key={example.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h3 className="font-medium">{example.title}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {example.description}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4 text-sm">
              {guide && (
                <Link
                  href={`/examples/${guide.slug}`}
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
                  aria-label={`Read the guide: ${guide.heading}`}
                >
                  Guide
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              )}
              <PlaygroundLink
                href={playgroundHref(example.id)}
                className="inline-flex items-center gap-1.5 font-medium hover:underline"
                aria-label={`Open “${example.title}” in the playground`}
              >
                <Play className="size-3.5 fill-current" aria-hidden />
                Open
              </PlaygroundLink>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
