"use client";

import { Bug, CircleCheck, CircleX, Info, TriangleAlert } from "lucide-react";
import { memo } from "react";
import {
  formatConsoleArgs,
  formatTopLevel,
  runtimeErrorTitle,
} from "@/lib/console/format";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";
import type {
  ConsoleEntry as ConsoleEntryData,
  SourceLocation,
} from "@/types/playground";

const LEVEL_STYLES = {
  log: { icon: null, row: "", text: "" },
  info: { icon: Info, row: "", text: "text-sky-700 dark:text-sky-300" },
  warn: {
    icon: TriangleAlert,
    row: "bg-amber-500/8 border-l-amber-500/60",
    text: "text-amber-800 dark:text-amber-200",
  },
  error: {
    icon: CircleX,
    row: "bg-red-500/8 border-l-red-500/60",
    text: "text-red-700 dark:text-red-300",
  },
  debug: { icon: Bug, row: "", text: "text-muted-foreground" },
} as const;

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

interface ConsoleEntryProps {
  entry: ConsoleEntryData;
  onNavigate: (location: SourceLocation) => void;
}

function RuntimeError({ entry, onNavigate }: ConsoleEntryProps) {
  const error = entry.args[0];
  // The file of the run that produced the error, not the current language.
  const fileName = entry.fileName ?? "code";
  if (!error || error.t !== "error") return null;
  const title = runtimeErrorTitle(entry, error);
  // The first stack line repeats the message in V8; show only the frames.
  const frames = error.stack
    ?.split("\n")
    .filter((line) => line.trim() && !line.startsWith(`${error.name}:`))
    .join("\n");
  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-medium whitespace-pre-wrap break-words">
          {title}
        </span>
        {entry.location && (
          <button
            type="button"
            className="text-xs underline decoration-dotted underline-offset-2 opacity-80 hover:opacity-100"
            onClick={() => onNavigate(entry.location!)}
            aria-label={`Go to ${fileName} line ${entry.location.line}, column ${entry.location.column}`}
          >
            {fileName}:{entry.location.line}:{entry.location.column}
          </button>
        )}
      </div>
      {frames && (
        <details className="mt-0.5">
          <summary className="cursor-pointer text-xs opacity-70 select-none hover:opacity-100">
            Stack trace
          </summary>
          <pre className="mt-1 text-xs whitespace-pre-wrap break-words opacity-80">
            {frames}
          </pre>
        </details>
      )}
    </div>
  );
}

export const ConsoleEntry = memo(function ConsoleEntry({
  entry,
  onNavigate,
}: ConsoleEntryProps) {
  const success = entry.tone === "success";
  const isSystem = entry.kind === "system";
  const style = success
    ? {
        icon: CircleCheck,
        row: "",
        text: "text-emerald-700 dark:text-emerald-400",
      }
    : isSystem && entry.level === "debug"
      ? { icon: null, row: "", text: "" } // neutral run notes ("Run started", "Finished…")
      : LEVEL_STYLES[entry.level];
  const Icon = style.icon;

  return (
    <div
      data-level={entry.level}
      data-kind={entry.kind}
      className={cn(
        "flex items-start gap-2 border-b border-l-2 border-b-border/50 border-l-transparent px-3 py-1 font-mono text-[12.5px] leading-5",
        style.row,
        isSystem && "text-muted-foreground italic",
      )}
      style={
        entry.groupDepth
          ? { paddingLeft: `${0.75 + entry.groupDepth}rem` }
          : undefined
      }
    >
      <span
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center",
          style.text,
        )}
        aria-hidden
      >
        {Icon && <Icon className="size-3.5" />}
      </span>
      {/* Program output can imitate a note's words, never this prefix (or
          the note's font and icon). */}
      <span className="sr-only">
        {isSystem ? `${SITE_NAME} ${entry.level}: ` : `${entry.level}: `}
      </span>
      {entry.kind === "runtime-error" ? (
        <div className={cn("flex min-w-0 flex-1", style.text)}>
          <RuntimeError entry={entry} onNavigate={onNavigate} />
        </div>
      ) : (
        <pre
          className={cn(
            "min-w-0 flex-1 whitespace-pre-wrap break-words",
            style.text,
            isSystem && "font-sans",
          )}
        >
          {entry.kind === "system"
            ? formatTopLevel(entry.args[0])
            : formatConsoleArgs(entry.args)}
        </pre>
      )}
      {!isSystem && (
        <span
          className="mt-0.5 shrink-0 text-[10.5px] text-muted-foreground/70 tabular-nums"
          title="Time since the run started"
        >
          {formatElapsed(entry.elapsedMs)}
        </span>
      )}
    </div>
  );
});
