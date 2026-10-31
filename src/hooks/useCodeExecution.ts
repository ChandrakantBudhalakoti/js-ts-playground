"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAssetCache } from "@/hooks/useRuntimeAssets";
import { createPositionMapper } from "@/lib/compiler/source-map";
import { t } from "@/lib/i18n";
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
  RuntimeId,
} from "@/types/playground";

export interface RunRequest {
  runtime: RuntimeId;
  /** JavaScript to execute, or the program's source for other runtimes. */
  code: string;
  /** Standard input (non-JavaScript runtimes). */
  stdin?: string;
  /** A program compiled by Clang (the `wasi` runtime). */
  binary?: ArrayBuffer;
  /** Shown while the run waits for its runtime to start, e.g. "Python". */
  runtimeName: string;
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
  const contextRef = useRef<
    (RunContext & { hadError: boolean; runtimeName: string }) | null
  >(null);
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
        case "booting":
          system("debug", t("run.starting", { name: context.runtimeName }));
          break;
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
        case "done": {
          // A non-zero exit status fails the run, like in a terminal.
          const exitCode = event.exitCode ?? 0;
          const failed = context.hadError || exitCode !== 0;
          if (event.inputMissing)
            system("info", t("run.inputEmpty"), event.elapsedMs);
          setStatus(failed ? "failed" : "completed");
          setDurationMs(event.elapsedMs);
          system(
            "debug",
            context.hadError
              ? t("run.finishedWithErrors", {
                  duration: formatDuration(event.elapsedMs),
                })
              : exitCode !== 0
                ? t("run.exited", {
                    code: exitCode,
                    duration: formatDuration(event.elapsedMs),
                  })
                : t("run.completed", {
                    duration: formatDuration(event.elapsedMs),
                  }),
            event.elapsedMs,
            failed ? undefined : "success",
          );
          break;
        }
        case "timeout":
          setStatus("timed-out");
          push({
            ...createSystemEntry(
              id(),
              context.runId,
              "error",
              t("run.timedOut", { duration: formatDuration(event.timeoutMs) }),
            ),
            fileName: context.fileName,
            explain: "timed out after",
          });
          break;
        case "stopped":
          setStatus("stopped");
          system("warn", t("run.stopped"));
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
    const runtime = new SandboxRuntime({
      sandboxUrl,
      onEvent: handleEvent,
      loadAssets: (id) => getAssetCache().load(id),
      prewarm: true,
    });
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
      const runId = runtime.run({
        runtime: request.runtime,
        code: request.code,
        timeoutMs: request.timeoutMs,
        stdin: request.stdin,
        binary: request.binary,
      });
      contextRef.current = {
        runId,
        fileName: request.fileName,
        mapper: createPositionMapper(request.sourceMap),
        javascript: request.runtime === "js",
        hadError: false,
        runtimeName: request.runtimeName,
      };
      if (!request.clearConsole)
        push(createSystemEntry(id(), runId, "debug", t("run.started")));
      for (const notice of request.notices ?? []) {
        push(createSystemEntry(id(), runId, notice.level, notice.message));
      }
      setStatus("running");
      setDurationMs(null);
    },
    [clear, push],
  );

  /** Show a note while a run is being prepared (e.g. "Compiling main.c…"). */
  const announce = useCallback(
    (message: string, clearConsole: boolean) => {
      if (clearConsole) clear();
      push(createSystemEntry(id(), "local", "debug", message));
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

  /** Download and boot a runtime ahead of its first run. */
  const prepare = useCallback(
    (runtime: RuntimeId) => runtimeRef.current?.prepare(runtime),
    [],
  );

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
    prepare,
    announce,
    clear,
    report,
    resetState,
  };
}
