import type {
  ConsoleLevel,
  RuntimeErrorInfo,
  RuntimeId,
  SerializedValue,
  WasmRuntimeId,
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
  /** The run waits for its runtime to download or boot. */
  | { type: "booting"; runId: string; runtime: WasmRuntimeId }
  | {
      type: "log";
      runId: string;
      level: ConsoleLevel;
      args: SerializedValue[];
      groupDepth: number;
      elapsedMs: number;
    }
  | { type: "error"; runId: string; error: RuntimeErrorInfo; elapsedMs: number }
  | {
      type: "done";
      runId: string;
      elapsedMs: number;
      exitCode?: number;
      /** The program read standard input, but none was given. */
      inputMissing?: true;
    }
  | { type: "limit"; runId: string; reason: string }
  | { type: "timeout"; runId: string; timeoutMs: number }
  | { type: "stopped"; runId: string }
  | { type: "sandbox-error"; runId: string; message: string };

export interface RunRequest {
  runtime: RuntimeId;
  /** JavaScript, or the program's source for other runtimes. */
  code: string;
  timeoutMs: number;
  stdin?: string;
  /** A compiled program for the `wasi` runtime. */
  binary?: ArrayBuffer;
}

export interface SandboxRuntimeOptions {
  /** URL of the sandbox page. Use a separate origin in production. */
  sandboxUrl: string;
  onEvent: (event: SandboxEvent) => void;
  /** Downloads a runtime's files (not called for `wasi`, which has none). */
  loadAssets?: (
    runtime: Exclude<WasmRuntimeId, "wasi">,
  ) => Promise<Record<string, ArrayBuffer>>;
  /** Time allowed for the sandbox page to load before the run fails. */
  loadTimeoutMs?: number;
  /** Time a runtime may take to boot once its files are in the sandbox. */
  bootTimeoutMs?: number;
  /**
   * How long a finished run's sandbox lingers to deliver late output from
   * async work that timers do not track (promise callbacks, MessageChannel…).
   * Afterwards it is destroyed, so nothing can keep running unbounded.
   */
  settleGraceMs?: number;
  /**
   * After each run of a WebAssembly runtime, boot a fresh sandbox for the
   * next one, so later runs do not wait for the runtime to start.
   */
  prewarm?: boolean;
  container?: HTMLElement;
}

/** Default for `SandboxRuntimeOptions.settleGraceMs`. */
export const SETTLE_GRACE_MS = 1_000;

function formatSize(characters: number): string {
  return characters >= 1_000_000
    ? `${(characters / 1_000_000).toFixed(1)} M characters`
    : `${Math.round(characters / 1_000)} K characters`;
}

type Phase =
  | "loading" // the sandbox page is loading
  | "booting" // a runtime's files are downloading or it is starting
  | "ready" // booted, waiting for code
  | "running"
  | "settled"
  | "failed";

interface PendingRun {
  code: string;
  timeoutMs: number;
  stdin: string;
  binary?: ArrayBuffer;
}

interface Sandbox {
  runId: string;
  runtime: RuntimeId;
  iframe: HTMLIFrameElement;
  phase: Phase;
  timer: ReturnType<typeof setTimeout> | undefined;
  /** The run this sandbox executes once ready; null while pre-warmed. */
  run: PendingRun | null;
  timeoutMs: number;
  assets: Promise<Record<string, ArrayBuffer>> | null;
}

/** Messages from a sandboxed iframe without `allow-same-origin` always carry this origin. */
const OPAQUE_ORIGIN = "null";

/**
 * Parent-side runtime manager. Each run gets a fresh sandboxed iframe (opaque
 * origin) whose worker executes the code. The timeout lives here, on the
 * app's thread, so even a synchronous infinite loop in the worker is
 * terminated: removing the iframe destroys its worker.
 *
 * WebAssembly runtimes are booted from files the app downloads (the sandbox
 * has no network) before the code is sent. With `prewarm`, the next sandbox
 * boots in the background as soon as a run ends, so every run still starts
 * from a clean interpreter without waiting for one.
 */
export class SandboxRuntime {
  /** The sandbox of the current run. */
  private active: Sandbox | null = null;
  /** A sandbox booting or booted ahead of the next run. */
  private warm: Sandbox | null = null;
  private readonly options: Required<
    Omit<SandboxRuntimeOptions, "container" | "loadAssets">
  > &
    Pick<SandboxRuntimeOptions, "container" | "loadAssets">;

  constructor(options: SandboxRuntimeOptions) {
    this.options = {
      loadTimeoutMs: 10_000,
      bootTimeoutMs: 60_000,
      settleGraceMs: SETTLE_GRACE_MS,
      prewarm: false,
      ...options,
    };
    window.addEventListener("message", this.onMessage);
  }

  get activeRunId(): string | null {
    return this.active?.runId ?? null;
  }

  get isRunning(): boolean {
    return (
      this.active !== null &&
      this.active.phase !== "settled" &&
      this.active.phase !== "failed"
    );
  }

  /** Start a run, replacing any previous one. Returns the new run ID. */
  run(request: RunRequest): string {
    this.teardown(this.active);
    this.active = null;
    if (request.code.length > RUNTIME_LIMITS.maxCodeLength) {
      const runId = createRunId();
      // Reported asynchronously, like every other outcome, so callers can
      // record the run ID first.
      queueMicrotask(() =>
        this.emit({
          type: "sandbox-error",
          runId,
          message: `The code is too large to run (${formatSize(request.code.length)}; the limit is ${formatSize(RUNTIME_LIMITS.maxCodeLength)}).`,
        }),
      );
      return runId;
    }

    let sandbox: Sandbox;
    if (
      this.warm &&
      this.warm.runtime === request.runtime &&
      this.warm.phase !== "failed"
    ) {
      sandbox = this.warm;
      this.warm = null;
    } else {
      sandbox = this.create(request.runtime);
    }
    this.active = sandbox;
    sandbox.run = {
      code: request.code,
      timeoutMs: request.timeoutMs,
      stdin: request.stdin ?? "",
      binary: request.binary,
    };
    this.emit({ type: "started", runId: sandbox.runId });
    if (sandbox.phase === "ready") this.sendRun(sandbox);
    else if (request.runtime !== "js") {
      const runtime = request.runtime;
      // Asynchronous, so callers have recorded the run ID by then.
      queueMicrotask(() => {
        if (
          this.active === sandbox &&
          (sandbox.phase === "loading" || sandbox.phase === "booting")
        )
          this.emit({ type: "booting", runId: sandbox.runId, runtime });
      });
    }
    return sandbox.runId;
  }

  /**
   * Boot a sandbox for `runtime` ahead of its first run, replacing one warm
   * for another runtime. JavaScript needs none: it only drops that one.
   */
  prepare(runtime: RuntimeId): void {
    if (this.warm?.runtime === runtime && this.warm.phase !== "failed") return;
    this.teardown(this.warm);
    this.warm = runtime === "js" ? null : this.create(runtime);
  }

  /** Stop the active run. Late messages from it are ignored. */
  stop(): void {
    const active = this.active;
    if (!active) return;
    const wasRunning = active.phase !== "settled" && active.phase !== "failed";
    this.teardown(active);
    this.active = null;
    if (wasRunning) {
      this.emit({ type: "stopped", runId: active.runId });
      this.prewarmAfter(active);
    }
  }

  dispose(): void {
    window.removeEventListener("message", this.onMessage);
    this.teardown(this.active);
    this.teardown(this.warm);
    this.active = null;
    this.warm = null;
  }

  private emit(event: SandboxEvent) {
    this.options.onEvent(event);
  }

  private create(runtime: RuntimeId): Sandbox {
    const runId = createRunId();
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

    const sandbox: Sandbox = {
      runId,
      runtime,
      iframe,
      phase: "loading",
      timer: undefined,
      run: null,
      timeoutMs: 0,
      assets: null,
    };
    if (runtime !== "js" && runtime !== "wasi") {
      const load = this.options.loadAssets;
      sandbox.assets = load
        ? load(runtime)
        : Promise.reject(new Error(`No files are available for ${runtime}.`));
      // Failures are handled when the sandbox is ready for them (onReady).
      sandbox.assets.catch(() => {});
    }
    sandbox.timer = setTimeout(() => {
      if (sandbox.phase !== "loading") return;
      this.fail(
        sandbox,
        // The page the code runs in is kept by the browser's cache, which
        // can be cleared; it is then needed from the network once more.
        navigator.onLine
          ? "The sandbox did not start. Check the sandbox URL and its Content Security Policy."
          : "Code can't run offline right now: the page it runs in is no longer saved in this browser. Connect to the internet once and run again.",
      );
    }, this.options.loadTimeoutMs);

    (this.options.container ?? document.body).appendChild(iframe);
    return sandbox;
  }

  private teardown(sandbox: Sandbox | null) {
    if (!sandbox) return;
    clearTimeout(sandbox.timer);
    sandbox.iframe.remove();
  }

  private post(
    sandbox: Sandbox,
    message: Parameters<typeof createHostMessage>[0],
    transfer: Transferable[] = [],
  ) {
    sandbox.iframe.contentWindow?.postMessage(
      createHostMessage(message),
      "*",
      transfer,
    );
  }

  /** The sandbox can no longer run anything. Reports it if a run is waiting. */
  private fail(sandbox: Sandbox, message: string) {
    sandbox.phase = "failed";
    this.teardown(sandbox);
    if (this.warm === sandbox) {
      // A pre-warmed sandbox fails silently; the next run starts over.
      this.warm = null;
      return;
    }
    if (this.active === sandbox) {
      this.emit({ type: "sandbox-error", runId: sandbox.runId, message });
    }
  }

  private sendRun(sandbox: Sandbox) {
    const run = sandbox.run;
    if (!run) return;
    sandbox.phase = "running";
    sandbox.timeoutMs = run.timeoutMs;
    clearTimeout(sandbox.timer);
    // The program is transferred, not copied: it is used once.
    this.post(
      sandbox,
      {
        type: "RUN",
        runId: sandbox.runId,
        code: run.code,
        ...(sandbox.runtime === "js" ? {} : { stdin: run.stdin }),
        ...(run.binary ? { binary: run.binary } : {}),
      },
      run.binary ? [run.binary] : [],
    );
    sandbox.timer = setTimeout(() => this.onTimeout(sandbox), run.timeoutMs);
  }

  private async onReady(sandbox: Sandbox) {
    clearTimeout(sandbox.timer);
    if (sandbox.runtime === "js") {
      sandbox.phase = "ready";
      this.sendRun(sandbox);
      return;
    }
    sandbox.phase = "booting";
    let assets: Record<string, ArrayBuffer> = {};
    if (sandbox.assets) {
      try {
        assets = await sandbox.assets;
      } catch (error) {
        this.fail(
          sandbox,
          `Could not download the ${sandbox.runtime} runtime: ${error instanceof Error ? error.message : String(error)}`,
        );
        return;
      }
    }
    if (sandbox.phase !== "booting") return; // torn down meanwhile
    // Each sandbox gets its own copy; the cache keeps the original.
    const copies = Object.fromEntries(
      Object.entries(assets).map(([name, data]) => [name, data.slice(0)]),
    );
    this.post(
      sandbox,
      {
        type: "BOOT",
        runId: sandbox.runId,
        runtime: sandbox.runtime as WasmRuntimeId,
        assets: copies,
      },
      Object.values(copies),
    );
    sandbox.timer = setTimeout(() => {
      if (sandbox.phase !== "booting") return;
      this.fail(
        sandbox,
        `The ${sandbox.runtime} runtime did not start within ${Math.round(this.options.bootTimeoutMs / 1000)} seconds.`,
      );
    }, this.options.bootTimeoutMs);
  }

  private sandboxFor(source: MessageEventSource | null): Sandbox | null {
    for (const sandbox of [this.active, this.warm]) {
      if (sandbox && source === sandbox.iframe.contentWindow) return sandbox;
    }
    return null;
  }

  private onMessage = (event: MessageEvent) => {
    // Only our current iframes may talk to us, and they must be sandboxed.
    const sandbox = this.sandboxFor(event.source);
    if (!sandbox || event.origin !== OPAQUE_ORIGIN) return;

    const message = parseRuntimeMessage(event.data, RUNTIME_CHANNEL);
    if (!message) return;

    if (message.type === "READY") {
      if (sandbox.phase === "loading") void this.onReady(sandbox);
      return;
    }

    // Stale run IDs (from a replaced or stopped run) are dropped.
    if (message.runId !== sandbox.runId) return;

    if (message.type === "BOOTED") {
      if (sandbox.phase !== "booting") return;
      clearTimeout(sandbox.timer);
      sandbox.phase = "ready";
      if (sandbox.run) this.sendRun(sandbox);
      return;
    }

    if (sandbox.phase === "booting") {
      // Before any code ran, an error means the runtime failed to start.
      if (message.type === "ERROR") this.fail(sandbox, message.error.message);
      return;
    }
    if (sandbox !== this.active) return;

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
        if (sandbox.phase !== "running") return;
        sandbox.phase = "settled";
        clearTimeout(sandbox.timer);
        // Keep the sandbox briefly for late async output from this run, then
        // destroy it: work not tracked by timers (e.g. a promise callback that
        // loops forever) must not outlive the run.
        sandbox.timer = setTimeout(() => {
          if (this.active === sandbox) {
            this.teardown(sandbox);
            this.active = null;
          }
        }, this.options.settleGraceMs);
        this.emit({
          type: "done",
          runId: message.runId,
          elapsedMs: message.elapsedMs,
          ...(message.exitCode === undefined
            ? {}
            : { exitCode: message.exitCode }),
          ...(message.inputMissing ? { inputMissing: true as const } : {}),
        });
        this.prewarmAfter(sandbox);
        break;
      case "LIMIT":
        this.teardown(sandbox);
        this.active = null;
        this.emit({
          type: "limit",
          runId: message.runId,
          reason: message.reason,
        });
        this.prewarmAfter(sandbox);
        break;
    }
  };

  private onTimeout(sandbox: Sandbox) {
    if (this.active !== sandbox || sandbox.phase !== "running") return;
    this.teardown(sandbox);
    this.active = null;
    this.emit({
      type: "timeout",
      runId: sandbox.runId,
      timeoutMs: sandbox.timeoutMs,
    });
    this.prewarmAfter(sandbox);
  }

  private prewarmAfter(sandbox: Sandbox) {
    if (this.options.prewarm && sandbox.runtime !== "js")
      this.prepare(sandbox.runtime);
  }
}
