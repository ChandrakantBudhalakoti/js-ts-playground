import type {
  ConsoleLevel,
  RuntimeErrorInfo,
  SerializedValue,
} from "@/types/playground";
import {
  createHostMessage,
  createRunId,
  parseRuntimeMessage,
  RUNTIME_CHANNEL,
  RUNTIME_LIMITS,
} from "./protocol";

export type SandboxEvent =
  | { type: "started"; runId: string }
  | {
      type: "log";
      runId: string;
      level: ConsoleLevel;
      args: SerializedValue[];
      groupDepth: number;
      elapsedMs: number;
    }
  | { type: "error"; runId: string; error: RuntimeErrorInfo; elapsedMs: number }
  | { type: "done"; runId: string; elapsedMs: number }
  | { type: "limit"; runId: string; reason: string }
  | { type: "timeout"; runId: string; timeoutMs: number }
  | { type: "stopped"; runId: string }
  | { type: "sandbox-error"; runId: string; message: string };

export interface SandboxRuntimeOptions {
  /** URL of the sandbox page. Use a separate origin in production. */
  sandboxUrl: string;
  onEvent: (event: SandboxEvent) => void;
  /** Time allowed for the sandbox page to load before the run fails. */
  loadTimeoutMs?: number;
  /**
   * How long a finished run's sandbox lingers to deliver late output from
   * async work that timers do not track (promise callbacks, MessageChannel…).
   * Afterwards it is destroyed, so nothing can keep running unbounded.
   */
  settleGraceMs?: number;
  container?: HTMLElement;
}

/** Default for `SandboxRuntimeOptions.settleGraceMs`. */
export const SETTLE_GRACE_MS = 1_000;

function formatSize(characters: number): string {
  return characters >= 1_000_000
    ? `${(characters / 1_000_000).toFixed(1)} M characters`
    : `${Math.round(characters / 1_000)} K characters`;
}

type Phase = "loading" | "running" | "settled";

interface ActiveRun {
  runId: string;
  iframe: HTMLIFrameElement;
  code: string;
  timeoutMs: number;
  phase: Phase;
  timer: ReturnType<typeof setTimeout> | undefined;
}

/** Messages from a sandboxed iframe without `allow-same-origin` always carry this origin. */
const OPAQUE_ORIGIN = "null";

/**
 * Parent-side runtime manager. Each run gets a fresh sandboxed iframe (opaque
 * origin) whose worker executes the code. The timeout lives here, on the
 * app's thread, so even a synchronous infinite loop in the worker is
 * terminated: removing the iframe destroys its worker.
 */
export class SandboxRuntime {
  private active: ActiveRun | null = null;
  private readonly options: Required<
    Omit<SandboxRuntimeOptions, "container">
  > & {
    container?: HTMLElement;
  };

  constructor(options: SandboxRuntimeOptions) {
    this.options = {
      loadTimeoutMs: 10_000,
      settleGraceMs: SETTLE_GRACE_MS,
      ...options,
    };
    window.addEventListener("message", this.onMessage);
  }

  get activeRunId(): string | null {
    return this.active?.runId ?? null;
  }

  get isRunning(): boolean {
    return this.active !== null && this.active.phase !== "settled";
  }

  /** Start a run, replacing any previous one. Returns the new run ID. */
  run(code: string, timeoutMs: number): string {
    this.teardown();
    const runId = createRunId();
    if (code.length > RUNTIME_LIMITS.maxCodeLength) {
      // Reported asynchronously, like every other outcome, so callers can
      // record the run ID first.
      queueMicrotask(() =>
        this.emit({
          type: "sandbox-error",
          runId,
          message: `The code is too large to run (${formatSize(code.length)}; the limit is ${formatSize(RUNTIME_LIMITS.maxCodeLength)}).`,
        }),
      );
      return runId;
    }
    const iframe = document.createElement("iframe");
    // `allow-scripts` without `allow-same-origin`: the document gets an opaque
    // origin and cannot touch the app's DOM, storage or cookies.
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.setAttribute("referrerpolicy", "no-referrer");
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;
    iframe.title = "Code execution sandbox";
    iframe.dataset.runId = runId;
    iframe.style.cssText =
      "position:absolute;width:0;height:0;border:0;visibility:hidden;";
    iframe.src = this.options.sandboxUrl;

    const active: ActiveRun = {
      runId,
      iframe,
      code,
      timeoutMs,
      phase: "loading",
      timer: undefined,
    };
    this.active = active;
    active.timer = setTimeout(() => {
      if (this.active !== active || active.phase !== "loading") return;
      this.teardown();
      this.emit({
        type: "sandbox-error",
        runId,
        message:
          "The sandbox did not start. Check the sandbox URL and its Content Security Policy.",
      });
    }, this.options.loadTimeoutMs);

    (this.options.container ?? document.body).appendChild(iframe);
    this.emit({ type: "started", runId });
    return runId;
  }

  /** Stop the active run. Late messages from it are ignored. */
  stop(): void {
    const active = this.active;
    if (!active) return;
    const wasRunning = active.phase !== "settled";
    this.teardown();
    if (wasRunning) this.emit({ type: "stopped", runId: active.runId });
  }

  dispose(): void {
    window.removeEventListener("message", this.onMessage);
    this.teardown();
  }

  private emit(event: SandboxEvent) {
    this.options.onEvent(event);
  }

  private teardown() {
    const active = this.active;
    if (!active) return;
    clearTimeout(active.timer);
    this.active = null;
    active.iframe.remove();
  }

  private onMessage = (event: MessageEvent) => {
    const active = this.active;
    // Only the current iframe may talk to us, and it must be sandboxed.
    if (!active || event.source !== active.iframe.contentWindow) return;
    if (event.origin !== OPAQUE_ORIGIN) return;

    const message = parseRuntimeMessage(event.data, RUNTIME_CHANNEL);
    if (!message) return;

    if (message.type === "READY") {
      if (active.phase !== "loading") return;
      active.phase = "running";
      clearTimeout(active.timer);
      active.iframe.contentWindow?.postMessage(
        createHostMessage({
          type: "RUN",
          runId: active.runId,
          code: active.code,
        }),
        "*",
      );
      active.timer = setTimeout(() => this.onTimeout(active), active.timeoutMs);
      return;
    }

    // Stale run IDs (from a replaced or stopped run) are dropped.
    if (message.runId !== active.runId) return;

    switch (message.type) {
      case "LOG":
        this.emit({
          type: "log",
          runId: message.runId,
          level: message.level,
          args: message.args,
          groupDepth: message.groupDepth,
          elapsedMs: message.elapsedMs,
        });
        break;
      case "ERROR":
        this.emit({
          type: "error",
          runId: message.runId,
          error: message.error,
          elapsedMs: message.elapsedMs,
        });
        break;
      case "DONE":
        if (active.phase !== "running") return;
        active.phase = "settled";
        clearTimeout(active.timer);
        // Keep the sandbox briefly for late async output from this run, then
        // destroy it: work not tracked by timers (e.g. a promise callback that
        // loops forever) must not outlive the run.
        active.timer = setTimeout(() => {
          if (this.active === active) this.teardown();
        }, this.options.settleGraceMs);
        this.emit({
          type: "done",
          runId: message.runId,
          elapsedMs: message.elapsedMs,
        });
        break;
      case "LIMIT":
        this.teardown();
        this.emit({
          type: "limit",
          runId: message.runId,
          reason: message.reason,
        });
        break;
    }
  };

  private onTimeout(active: ActiveRun) {
    if (this.active !== active || active.phase !== "running") return;
    this.teardown();
    this.emit({
      type: "timeout",
      runId: active.runId,
      timeoutMs: active.timeoutMs,
    });
  }
}
