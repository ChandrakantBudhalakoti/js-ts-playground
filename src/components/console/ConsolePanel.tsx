"use client";

import { Terminal } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import type {
  ConsoleEntry as ConsoleEntryData,
  SourceLocation,
} from "@/types/playground";
import { ConsoleEntry } from "./ConsoleEntry";

interface ConsolePanelProps {
  entries: ConsoleEntryData[];
  dropped: number;
  onNavigate: (location: SourceLocation) => void;
}

/** Distance from the bottom (px) within which new output keeps the view pinned. */
const STICKY_THRESHOLD = 48;

export function ConsolePanel({
  entries,
  dropped,
  onNavigate,
}: ConsolePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  useLayoutEffect(() => {
    if (entries.length === 0) pinned.current = true;
    const element = scrollRef.current;
    if (element && pinned.current) element.scrollTop = element.scrollHeight;
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
        <Terminal className="size-5 opacity-60" aria-hidden />
        <p>Run your code to see its output here.</p>
        <p className="text-xs">
          Press{" "}
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
            Ctrl/⌘ + Enter
          </kbd>{" "}
          in the editor.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-label="Console output"
      data-testid="console-output"
      onScroll={(event) => {
        const element = event.currentTarget;
        pinned.current =
          element.scrollHeight - element.scrollTop - element.clientHeight <
          STICKY_THRESHOLD;
      }}
      className="h-full overflow-auto overscroll-contain"
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
  );
}
