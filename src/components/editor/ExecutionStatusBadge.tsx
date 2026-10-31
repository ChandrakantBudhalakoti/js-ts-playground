"use client";

import {
  CircleCheck,
  CircleDot,
  CircleSlash,
  CircleX,
  Loader2,
  TimerOff,
} from "lucide-react";
import { useT } from "@/hooks/useLocale";
import type { MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ExecutionStatus } from "@/types/playground";

const STATUS = {
  idle: {
    label: "status.idle",
    icon: CircleDot,
    className: "text-muted-foreground",
  },
  running: {
    label: "status.running",
    icon: Loader2,
    className: "text-sky-600 dark:text-sky-400",
  },
  completed: {
    label: "status.completed",
    icon: CircleCheck,
    className: "text-emerald-600 dark:text-emerald-400",
  },
  failed: {
    label: "status.failed",
    icon: CircleX,
    className: "text-red-600 dark:text-red-400",
  },
  "timed-out": {
    label: "status.timedOut",
    icon: TimerOff,
    className: "text-amber-600 dark:text-amber-400",
  },
  stopped: {
    label: "status.stopped",
    icon: CircleSlash,
    className: "text-muted-foreground",
  },
} satisfies Record<
  ExecutionStatus,
  { label: MessageKey; icon: typeof CircleDot; className: string }
>;

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.max(Math.round(ms), 0)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function ExecutionStatusBadge({
  status,
  durationMs,
}: {
  status: ExecutionStatus;
  durationMs: number | null;
}) {
  const t = useT();
  const { label, icon: Icon, className } = STATUS[status];
  return (
    <div
      role="status"
      aria-live="polite"
      data-status={status}
      data-testid="execution-status"
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
    >
      <Icon
        className={cn("size-3.5", status === "running" && "animate-spin")}
        aria-hidden
      />
      <span className="sr-only sm:not-sr-only">{t(label)}</span>
      {durationMs !== null &&
        (status === "completed" || status === "failed") && (
          <span className="hidden font-normal text-muted-foreground md:inline">
            · {formatDuration(durationMs)}
          </span>
        )}
    </div>
  );
}
