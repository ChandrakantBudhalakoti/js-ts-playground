"use client";

import { Terminal } from "lucide-react";
import { type ReactNode, useLayoutEffect, useRef } from "react";
import type {
  ConsoleEntry as ConsoleEntryData,
  SourceLocation,
} from "@/types/playground";
import { useT } from "@/hooks/useLocale";
import { ConsoleEntry } from "./ConsoleEntry";

/** A message with `{run}` (or `{keys}`) replaced by an element. */
function withRun(text: string, element: ReactNode): ReactNode[] {
  const [before, after] = text.split(/\{(?:run|keys)\}/);
  return after === undefined ? [text] : [before, element, after];
}

interface ConsolePanelProps {
  entries: ConsoleEntryData[];
  dropped: number;
  onNavigate: (location: SourceLocation) => void;
  /** Shown while the console is empty, e.g. a runtime's first download. */
  hint?: string;
  /** Shown above the output, e.g. asking before a language's first download. */
  banner?: ReactNode;
}

/** Distance from the bottom (px) within which new output keeps the view pinned. */
const STICKY_THRESHOLD = 48;

export function ConsolePanel({
  entries,
  dropped,
  onNavigate,
  hint,
  banner,
}: ConsolePanelProps) {
  const t = useT();
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  useLayoutEffect(() => {
    if (entries.length === 0) pinned.current = true;
    const element = scrollRef.current;
    if (element && pinned.current) element.scrollTop = element.scrollHeight;
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="flex h-full flex-col">
        {banner}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
          <Terminal className="size-5 opacity-60" aria-hidden />
          {hint && (
            <p className="max-w-xs text-xs" data-testid="console-hint">
              {hint}
            </p>
          )}
          <p>
            {withRun(
              t("console.empty"),
              <span key="run" className="font-medium text-foreground">
                {t("toolbar.run")}
              </span>,
            )}
          </p>
          <p className="text-xs pointer-coarse:hidden">
            {withRun(
              t("console.shortcut"),
              <kbd
                key="keys"
                className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground"
              >
                Ctrl/⌘ + Enter
              </kbd>,
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {banner}
      <div
        ref={scrollRef}
        role="log"
        aria-label={t("console.output")}
        data-testid="console-output"
        onScroll={(event) => {
          const element = event.currentTarget;
          pinned.current =
            element.scrollHeight - element.scrollTop - element.clientHeight <
            STICKY_THRESHOLD;
        }}
        className="min-h-0 flex-1 overflow-auto overscroll-contain"
      >
        {dropped > 0 && (
          <p className="border-b px-3 py-1 text-xs text-muted-foreground italic">
            {dropped} earlier {dropped === 1 ? "message was" : "messages were"}{" "}
            removed to keep the console fast.
          </p>
        )}
        {entries.map((entry) => (
          <ConsoleEntry key={entry.id} entry={entry} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}
