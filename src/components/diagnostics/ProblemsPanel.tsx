"use client";

import {
  CircleCheck,
  CircleX,
  Info,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { FriendlyError } from "@/components/console/FriendlyError";
import { useT } from "@/hooks/useLocale";
import type { ToolingStatus } from "@/hooks/useToolingStatus";
import { cn } from "@/lib/utils";
import type { Diagnostic, Language } from "@/types/playground";

interface ProblemsPanelProps {
  diagnostics: Diagnostic[];
  /** The current language (for explanations of common errors). */
  language: Language;
  /** The checker of the current language (TypeScript or Clang). */
  tooling: ToolingStatus;
  /**
   * Name of the current language when it has no checker while typing (its
   * errors appear in the console when it runs); null when it has one.
   */
  uncheckedLanguage: string | null;
  onSelect: (diagnostic: Diagnostic) => void;
}

const SEVERITY = {
  error: {
    icon: CircleX,
    className: "text-red-600 dark:text-red-400",
    label: "Error",
  },
  warning: {
    icon: TriangleAlert,
    className: "text-amber-600 dark:text-amber-400",
    label: "Warning",
  },
  info: {
    icon: Info,
    className: "text-sky-600 dark:text-sky-400",
    label: "Info",
  },
} as const;

function EmptyState({
  tooling,
  uncheckedLanguage,
}: {
  tooling: ToolingStatus;
  uncheckedLanguage: string | null;
}) {
  const t = useT();
  if (uncheckedLanguage) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 p-6 text-center text-sm text-muted-foreground">
        <Info className="size-4 opacity-70" aria-hidden />
        <p className="max-w-md">
          {t("problems.unchecked", { name: uncheckedLanguage })}
        </p>
      </div>
    );
  }
  if (tooling.status === "loading") {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {t("problems.loading", { name: tooling.label })}
        {tooling.progress !== null && (
          <span className="tabular-nums">
            {Math.round(tooling.progress * 100)}%
          </span>
        )}
      </div>
    );
  }
  if (tooling.status === "download") {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        {t("problems.download", { name: tooling.label })}
      </div>
    );
  }
  if (tooling.status === "error") {
    return (
      <div
        role="alert"
        className="flex h-full flex-col items-center justify-center gap-1 p-6 text-center text-sm"
      >
        <p className="font-medium text-amber-700 dark:text-amber-300">
          {t("problems.unavailable")}
        </p>
        <p className="max-w-md text-muted-foreground">{tooling.message}</p>
      </div>
    );
  }
  return (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
      <CircleCheck
        className="size-4 text-emerald-600 dark:text-emerald-400"
        aria-hidden
      />
      {t("problems.none")}
    </div>
  );
}

export function ProblemsPanel({
  diagnostics,
  language,
  tooling,
  uncheckedLanguage,
  onSelect,
}: ProblemsPanelProps) {
  if (diagnostics.length === 0)
    return (
      <EmptyState tooling={tooling} uncheckedLanguage={uncheckedLanguage} />
    );

  return (
    <ul
      className="h-full overflow-auto overscroll-contain py-1"
      aria-label="Problems"
      data-testid="problems-list"
    >
      {diagnostics.map((diagnostic, index) => {
        const { icon: Icon, className, label } = SEVERITY[diagnostic.severity];
        const location = diagnostic.fileName
          ? `${diagnostic.fileName}:${diagnostic.startLine}:${diagnostic.startColumn}`
          : "Global";
        return (
          <li
            key={`${diagnostic.code}-${diagnostic.startLine}-${diagnostic.startColumn}-${index}`}
          >
            <button
              type="button"
              disabled={!diagnostic.fileName}
              onClick={() => onSelect(diagnostic)}
              data-testid="problem-item"
              className="flex w-full items-start gap-2 px-3 py-1.5 text-left text-[13px] hover:bg-muted/70 focus-visible:bg-muted focus-visible:outline-none disabled:cursor-default disabled:hover:bg-transparent"
            >
              <Icon
                className={cn("mt-0.5 size-4 shrink-0", className)}
                aria-label={label}
              />
              <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">
                {diagnostic.message}
                <span className="ml-2 text-xs text-muted-foreground">
                  {diagnostic.tool === "clang" ? (
                    "clang"
                  ) : (
                    <>
                      TS{diagnostic.code}
                      {diagnostic.source === "syntax" && " · syntax"}
                    </>
                  )}
                </span>
              </span>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {location}
              </span>
            </button>
            {/* Outside the button: the explanation is not part of its name. */}
            {diagnostic.tool === "clang" && (
              <div className="px-3 pb-1.5 pl-9">
                <FriendlyError
                  language={language}
                  error={diagnostic.message}
                  line={diagnostic.startLine}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
