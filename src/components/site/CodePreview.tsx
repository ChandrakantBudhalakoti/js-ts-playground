import { CircleCheck } from "lucide-react";
import { HERO_EXAMPLE } from "@/lib/content";
import { languageInfo } from "@/lib/languages";

/**
 * A static picture of the playground: real code and the exact line the
 * playground's console prints for it.
 */
export function CodePreview() {
  const { name, fileName } = languageInfo(HERO_EXAMPLE.language);
  return (
    <figure className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <figcaption className="sr-only">
        {name} code in the playground editor and the output it prints in the
        console.
      </figcaption>
      <div className="flex items-center gap-2 border-b px-4 py-2.5 text-xs text-muted-foreground">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
        </span>
        <span className="ml-2 font-mono">{fileName}</span>
      </div>
      <pre
        tabIndex={0}
        aria-label="Example code"
        className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
      >
        <code>{HERO_EXAMPLE.code}</code>
      </pre>
      <div className="border-t bg-muted/40 px-4 py-3 font-mono text-[13px]">
        <p className="mb-1 text-xs tracking-wide text-muted-foreground uppercase">
          Console
        </p>
        <p className="whitespace-pre-line">{HERO_EXAMPLE.output}</p>
        <p className="mt-1 flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
          <CircleCheck className="size-3.5" aria-hidden />
          Completed
        </p>
      </div>
    </figure>
  );
}
