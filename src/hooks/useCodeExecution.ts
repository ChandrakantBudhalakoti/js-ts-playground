"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPositionMapper } from "@/lib/compiler/source-map";
import {
  appendEntries,
  createErrorEntry,
  createLogEntry,
  createSystemEntry,
  type RunContext,
} from "@/lib/runtime/console-bridge";
import { SandboxRuntime, type SandboxEvent } from "@/lib/runtime/sandbox";
import type {
  ConsoleEntry,
  ConsoleLevel,
  ExecutionStatus,
} from "@/types/playground";

export interface RunRequest {
  /** JavaScript to execute. */
  code: string;
  fileName: string;
  sourceMap: string | null;
  timeoutMs: number;
  clearConsole: boolean;
  /** System messages shown before the run's output (e.g. type-error warnings). */
  notices?: { level: ConsoleLevel; message: string }[];
}

function formatDuration(ms: number): string {
  if (ms < 1) return "<1 ms";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * Owns the sandbox runtime and the console state. Console output is buffered
 * and flushed once per animation frame, so chatty programs do not re-render
 * the console for every message.
 */
export function useCodeExecution(sandboxUrl: string) {
  const [status, setStatus] = useState<ExecutionStatus>("idle");
  const [log, setLog] = useState<{ entries: ConsoleEntry[]; dropped: number }>({
    entries: [],
    dropped: 0,
  });
  const [durationMs, setDurationMs] = useState<number | null>(null);

  const runtimeRef = useRef<SandboxRuntime | null>(null);
  const contextRef = useRef<(RunContext & { hadError: boolean }) | null>(null);
  const nextId = useRef(1);
  const buffer = useRef<ConsoleEntry[]>([]);
  const frame = useRef<number | null>(null);

  const flush = useCallback(() => {
    frame.current = null;
    const pending = buffer.current;
    buffer.current = [];
    if (pending.length === 0) return;
    setLog((previous) => {
      const result = appendEntries(previous.entries, pending);
      return {
        entries: result.entries,
        dropped: previous.dropped + result.dropped,
      };
    });
  }, []);

  const push = useCallback(
    (entry: ConsoleEntry) => {
      buffer.current.push(entry);
      frame.current ??= requestAnimationFrame(flush);
    },
    [flush],
  );

  const id = () => nextId.current++;

  const handleEvent = useCallback(
    (event: SandboxEvent) => {
      const context = contextRef.current;
      if (!context || event.runId !== context.runId) return;
      const system = (
        level: ConsoleLevel,
        message: string,
        elapsed = 0,
        tone?: "success",
      ) =>
        push(
          createSystemEntry(id(), context.runId, level, message, elapsed, tone),
        );

      switch (event.type) {
        case "log":
          push(
            createLogEntry(
              id(),
              context,
              event.level,
              event.args,
              event.groupDepth,
              event.elapsedMs,
            ),
          );
          break;
        case "error":
          context.hadError = true;
          push(createErrorEntry(id(), context, event.error, event.elapsedMs));
          // An async error after completion still marks the run as failed.
          setStatus((current) =>
            current === "completed" ? "failed" : current,
          );
          break;
        case "done":
          setStatus(context.hadError ? "failed" : "completed");
          setDurationMs(event.elapsedMs);
          system(
            "debug",
            `${context.hadError ? "Finished with errors" : "Completed"} in ${formatDuration(event.elapsedMs)}`,
            event.elapsedMs,
            context.hadError ? undefined : "success",
          );
          break;
        case "timeout":
          setStatus("timed-out");
          system(
            "error",
            `Execution timed out after ${formatDuration(event.timeoutMs)}. The sandbox was terminated. ` +
              "Check for infinite loops, or raise the time limit in Settings.",
          );
          break;
        case "stopped":
          setStatus("stopped");
          system("warn", "Execution stopped.");
          break;
        case "limit":
          setStatus("failed");
          system("error", event.reason);
          break;
        case "sandbox-error":
          setStatus("failed");
          system("error", event.message);
          break;
      }
    },
    [push],
  );

  useEffect(() => {
    const runtime = new SandboxRuntime({ sandboxUrl, onEvent: handleEvent });
    runtimeRef.current = runtime;
    return () => {
      runtime.dispose();
      runtimeRef.current = null;
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [sandboxUrl, handleEvent]);

  const clear = useCallback(() => {
    buffer.current = [];
    setLog({ entries: [], dropped: 0 });
  }, []);

  const run = useCallback(
    (request: RunRequest) => {
      const runtime = runtimeRef.current;
      if (!runtime) return;
      if (request.clearConsole) clear();
      const runId = runtime.run(request.code, request.timeoutMs);
      contextRef.current = {
        runId,
        fileName: request.fileName,
        mapper: createPositionMapper(request.sourceMap),
        hadError: false,
      };
      if (!request.clearConsole)
        push(createSystemEntry(id(), runId, "debug", "Run started"));
      for (const notice of request.notices ?? []) {
        push(createSystemEntry(id(), runId, notice.level, notice.message));
      }
      setStatus("running");
      setDurationMs(null);
    },
    [clear, push],
  );

  /** Report an outcome without running anything (e.g. blocked by syntax errors). */
  const report = useCallback(
    (outcome: {
      status: ExecutionStatus;
      level: ConsoleLevel;
      message: string;
      clearConsole: boolean;
    }) => {
      runtimeRef.current?.stop();
      contextRef.current = null;
      if (outcome.clearConsole) clear();
      push(createSystemEntry(id(), "local", outcome.level, outcome.message));
      setStatus(outcome.status);
      setDurationMs(null);
    },
    [clear, push],
  );

  const stop = useCallback(() => runtimeRef.current?.stop(), []);

  /** Stop any run and return to a clean, idle state. */
  const resetState = useCallback(() => {
    contextRef.current = null;
    runtimeRef.current?.stop();
    clear();
    setStatus("idle");
    setDurationMs(null);
  }, [clear]);

  return {
    status,
    entries: log.entries,
    dropped: log.dropped,
    durationMs,
    run,
    stop,
    clear,
    report,
    resetState,
  };
}
