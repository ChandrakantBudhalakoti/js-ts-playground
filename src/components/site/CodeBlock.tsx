import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  /** Accessible name, e.g. "Example code" or "Console output". */
  label: string;
  className?: string;
}

/** Server-rendered, crawlable code. Focusable so keyboard users can scroll it. */
export function CodeBlock({ code, label, className }: CodeBlockProps) {
  return (
    <pre
      tabIndex={0}
      aria-label={label}
      className={cn(
        "overflow-x-auto rounded-lg border bg-muted/40 p-4 font-mono text-[13px] leading-relaxed focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      <code>{code.trimEnd()}</code>
    </pre>
  );
}
