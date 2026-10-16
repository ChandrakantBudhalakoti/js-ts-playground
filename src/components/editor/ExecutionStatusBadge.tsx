"use client";

import {
  CircleCheck,
  CircleDot,
  CircleSlash,
  CircleX,
  Loader2,
  TimerOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExecutionStatus } from "@/types/playground";

const STATUS = {
  idle: { label: "Idle", icon: CircleDot, className: "text-muted-foreground" },
  running: {
    label: "Running",
    icon: Loader2,
    className: "text-sky-600 dark:text-sky-400",
  },
  completed: {
    label: "Completed",
    icon: CircleCheck,
    className: "text-emerald-600 dark:text-emerald-400",
  },
  failed: {
    label: "Failed",
    icon: CircleX,
    className: "text-red-600 dark:text-red-400",
  },
  "timed-out": {
    label: "Timed out",
    icon: TimerOff,
    className: "text-amber-600 dark:text-amber-400",
  },
  stopped: {
    label: "Stopped",
    icon: CircleSlash,
    className: "text-muted-foreground",
  },
} satisfies Record<
  ExecutionStatus,
  { label: string; icon: typeof CircleDot; className: string }
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
      <span className="sr-only sm:not-sr-only">{label}</span>
      {durationMs !== null &&
        (status === "completed" || status === "failed") && (
          <span className="hidden font-normal text-muted-foreground md:inline">
            · {formatDuration(durationMs)}
          </span>
        )}
    </div>
  );
}
