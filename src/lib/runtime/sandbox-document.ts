import type { SerializedValue } from "@/types/playground";
import { goDriver } from "./drivers/go";
import { luaDriver } from "./drivers/lua";
import { phpDriver } from "./drivers/php";
import { pythonDriver } from "./drivers/python";
import { rDriver } from "./drivers/r";
import { rubyDriver } from "./drivers/ruby";
import type { DriverFactory } from "./drivers/types";
import { wasiDriver } from "./drivers/wasi";
import { RUNTIME_CHANNEL, RUNTIME_LIMITS } from "./protocol";
import { runtimeWorkerMain, type RuntimeWorkerConfig } from "./runtime-worker";
import { serializeValue, type SerializeLimits } from "./serialize";

/** Placeholder that replaces the user module's blob URL in stack traces. */
export const USER_FILE_TOKEN = "playground:main";

interface WorkerConfig {
  serialize: SerializeLimits;
  maxArgs: number;
  maxStackLength: number;
  userFileToken: string;
}

interface RelayConfig {
  channel: string;
  maxMessages: number;
  maxMessageBytes: number;
  maxCodeLength: number;
  /** Text output (non-JavaScript runtimes) allowed per run. */
  maxOutputChars: number;
  /** Largest console entry made from text output. */
  outputBatchChars: number;
  /** How long text output is collected before it is shown. */
  outputFlushMs: number;
}

/** Language drivers by runtime ID (see ./drivers/types.ts). */
const DRIVERS: Record<string, DriverFactory> = {
  python: pythonDriver,
  lua: luaDriver,
  ruby: rubyDriver,
  php: phpDriver,
  go: goDriver,
  r: rDriver,
  wasi: wasiDriver,
};

/**
 * Origin of the runtimes' virtual file URLs inside the worker. `.invalid`
 * never resolves, and the worker answers these URLs itself.
 */
export const RUNTIME_VIRTUAL_ORIGIN = "https://runtime.playground.invalid/";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Runs inside the execution Web Worker (a classic worker owned by the sandbox
 * iframe). It patches `console`, tracks timers so it knows when the run is
 * idle, reports uncaught errors, then imports the user's code as an ES module.
 *
 * Self-contained: serialized with `Function.prototype.toString`, so it must
 * not reference imports, module-level identifiers or dynamic `import()`.
 */
function sandboxWorkerMain(
  importModule: (url: string) => Promise<unknown>,
  serialize: (value: unknown, limits: SerializeLimits) => SerializedValue,
  config: WorkerConfig,
) {
  const scope = self as any;
  /**
   * Reports go to the relay through the private port that comes with RUN.
   * The worker's own postMessage is within reach of the user's code, so the
   * relay ignores it: code cannot forge completion, errors or exit codes.
   */
  let post: (message: unknown) => void = () => {};
  const nativeSetTimeout: (handler: () => void, ms?: number) => number =
    scope.setTimeout.bind(scope);
  const nativeClearTimeout: (id: number) => void =
    scope.clearTimeout.bind(scope);
  const nativeSetInterval: (handler: () => void, ms?: number) => number =
    scope.setInterval.bind(scope);
  const nativeClearInterval: (id: number) => void =
    scope.clearInterval.bind(scope);
  const now = performance.now.bind(performance);
  const globalEval = scope.eval as (code: string) => unknown;

  let startedAt = now();
  let started = false;
  let settled = false;
  let done = false;
  let userUrl = "";
  let groupDepth = 0;
  const timers = new Set<number>();
  const counts = new Map<string, number>();
  const timeLabels = new Map<string, number>();

  const elapsed = () => Math.round((now() - startedAt) * 10) / 10;

  function emit(level: string, args: unknown[]) {
    // At most `maxArgs` arguments in total, including the "more" marker.
    const kept = config.maxArgs - 1;
    const list =
      args.length > config.maxArgs
        ? args.slice(0, kept).concat([`… ${args.length - kept} more arguments`])
        : args;
    post({
      type: "LOG",
      level,
      args: list.map((arg) => cleanErrors(serialize(arg, config.serialize))),
      groupDepth,
      elapsedMs: elapsed(),
    });
  }

  /** Apply `cleanStack` to every error inside a serialized value. */
  function cleanErrors(value: SerializedValue): SerializedValue {
    switch (value.t) {
      case "error":
        return value.stack
          ? { ...value, stack: cleanStack(value.stack) }
          : value;
      case "array":
        return { ...value, items: value.items.map(cleanErrors) };
      case "set":
        return { ...value, items: value.items.map(cleanErrors) };
      case "object":
        return {
          ...value,
          entries: value.entries.map(
            ([key, entry]): [string, SerializedValue] => [
              key,
              cleanErrors(entry),
            ],
          ),
        };
      case "map":
        return {
          ...value,
          entries: value.entries.map(
            ([key, entry]): [SerializedValue, SerializedValue] => [
              cleanErrors(key),
              cleanErrors(entry),
            ],
          ),
        };
      default:
        return value;
    }
  }

  /** Keep frames from the user's module, drop the runtime's own frames. */
  function cleanStack(stack: string): string {
    return stack
      .split("\n")
      .filter(
        (line) =>
          !(userUrl ? line.split(userUrl).join("") : line).includes("blob:"),
      )
      .map((line) =>
        userUrl ? line.split(userUrl).join(config.userFileToken) : line,
      )
      .join("\n")
      .slice(0, config.maxStackLength);
  }

  function describe(value: unknown): {
    name: string;
    message: string;
    stack?: string;
  } {
    try {
      if (value instanceof Error) {
        return {
          name: String(value.name || "Error"),
          message: String(value.message),
          stack: typeof value.stack === "string" ? value.stack : undefined,
        };
      }
    } catch {
      // fall through to the generic description
    }
    let message: string;
    try {
      message =
        typeof value === "string"
          ? value
          : (JSON.stringify(value) ?? String(value));
    } catch {
      try {
        message = String(value);
      } catch {
        message = "[uninspectable value]";
      }
    }
    return { name: "", message };
  }

  function reportError(value: unknown) {
    const info = describe(value);
    const stack = info.stack ? cleanStack(info.stack) : undefined;
    let line: number | undefined;
    let column: number | undefined;
    if (stack) {
      const index = stack.indexOf(`${config.userFileToken}:`);
      if (index >= 0) {
        const match = /^:(\d+):(\d+)/.exec(
          stack.slice(index + config.userFileToken.length),
        );
        if (match) {
          line = Number(match[1]);
          column = Number(match[2]);
        }
      }
    }
    post({
      type: "ERROR",
      error: {
        name: info.name.slice(0, 200),
        message: info.message.slice(0, config.serialize.maxStringLength),
        stack,
        line,
        column,
      },
      elapsedMs: elapsed(),
    });
  }

  // --- console -----------------------------------------------------------
  const target = scope.console as Record<string, unknown>;
  for (const level of ["log", "info", "warn", "error", "debug"]) {
    target[level] = (...args: unknown[]) => emit(level, args);
  }
  target.dir = (value: unknown) => emit("log", [value]);
  target.dirxml = target.dir;
  target.table = (data: unknown) => emit("log", [data]);
  target.trace = (...args: unknown[]) => emit("debug", ["Trace:", ...args]);
  target.assert = (condition: unknown, ...args: unknown[]) => {
    if (!condition)
      emit(
        "error",
        args.length ? ["Assertion failed:", ...args] : ["Assertion failed"],
      );
  };
  target.group = (...args: unknown[]) => {
    emit("log", args.length ? args : ["console.group"]);
    groupDepth = Math.min(groupDepth + 1, 10);
  };
  target.groupCollapsed = target.group;
  target.groupEnd = () => {
    groupDepth = Math.max(0, groupDepth - 1);
  };
  target.count = (label: unknown = "default") => {
    const key = String(label);
    const next = (counts.get(key) ?? 0) + 1;
    counts.set(key, next);
    emit("log", [`${key}: ${next}`]);
  };
  target.countReset = (label: unknown = "default") => {
    counts.delete(String(label));
  };
  target.time = (label: unknown = "default") => {
    const key = String(label);
    if (timeLabels.has(key)) emit("warn", [`Timer '${key}' already exists`]);
    else timeLabels.set(key, now());
  };
  const timeLog =
    (end: boolean) =>
    (label: unknown = "default", ...data: unknown[]) => {
      const key = String(label);
      const start = timeLabels.get(key);
      if (start === undefined) {
        emit("warn", [`Timer '${key}' does not exist`]);
        return;
      }
      emit("log", [
        `${key}: ${Math.round((now() - start) * 1000) / 1000} ms`,
        ...data,
      ]);
      if (end) timeLabels.delete(key);
    };
  target.timeLog = timeLog(false);
  target.timeEnd = timeLog(true);
  target.clear = () => {};

  // --- timers (tracked so the run can report completion) -----------------
  function invoke(handler: unknown, args: unknown[]) {
    try {
      if (typeof handler === "function") handler(...args);
      else globalEval(String(handler));
    } catch (error) {
      reportError(error);
    }
  }

  function checkIdle() {
    if (!settled || done) return;
    nativeSetTimeout(() => {
      if (done || timers.size > 0) return;
      done = true;
      post({ type: "DONE", elapsedMs: elapsed() });
    }, 0);
  }

  scope.setTimeout = (handler: unknown, ms?: number, ...args: unknown[]) => {
    const id = nativeSetTimeout(() => {
      timers.delete(id);
      invoke(handler, args);
      checkIdle();
    }, ms);
    timers.add(id);
    return id;
  };
  scope.setInterval = (handler: unknown, ms?: number, ...args: unknown[]) => {
    const id = nativeSetInterval(() => invoke(handler, args), ms);
    timers.add(id);
    return id;
  };
  const clearTimer = (id?: number) => {
    if (typeof id !== "number") return;
    nativeClearTimeout(id);
    nativeClearInterval(id);
    if (timers.delete(id)) checkIdle();
  };
  scope.clearTimeout = clearTimer;
  scope.clearInterval = clearTimer;

  // --- uncaught errors -----------------------------------------------------
  scope.addEventListener("error", (event: any) => {
    event.preventDefault();
    reportError(event.error ?? event.message);
  });
  scope.addEventListener("unhandledrejection", (event: any) => {
    event.preventDefault();
    reportError(event.reason);
  });

  // --- run -------------------------------------------------------------------
  scope.addEventListener("message", (event: any) => {
    const data = event.data;
    const port = event.ports?.[0];
    if (
      started ||
      !port ||
      !data ||
      typeof data !== "object" ||
      data.type !== "RUN" ||
      typeof data.code !== "string"
    ) {
      return;
    }
    started = true;
    // Bound before the user's code runs, so replacing
    // MessagePort.prototype.postMessage later cannot capture the port.
    post = port.postMessage.bind(port);
    userUrl = URL.createObjectURL(
      new Blob([data.code], { type: "text/javascript" }),
    );
    startedAt = now();
    importModule(userUrl)
      .then(undefined, reportError)
      .then(() => {
        settled = true;
        checkIdle();
      });
  });
}

/**
 * Runs in the sandbox iframe (opaque origin). It owns one execution worker,
 * relays the worker's messages to the app tagged with the run ID, and stops
 * the worker when it exceeds the output limits. User code never runs here,
 * so this context stays responsive even if the worker is stuck in a loop.
 *
 * JavaScript runs in a worker started by RUN. Other languages run in a
 * runtime worker started by BOOT (with the runtime's files), which receives
 * the code with a later RUN. Their output arrives as text chunks (OUT) that
 * are batched here into console entries: the worker may be stuck in a loop,
 * so the relay, not the worker, decides when output is shown.
 *
 * Self-contained: serialized with `Function.prototype.toString`.
 */
function sandboxRelayMain(
  workerSource: string,
  runtimeWorkerSource: string,
  config: RelayConfig,
) {
  const host = window.parent;
  if (!host || host === window) {
    document.body.textContent =
      "This page runs code for the playground and only works when embedded by it.";
    return;
  }
  const workerUrl = URL.createObjectURL(
    new Blob([workerSource], { type: "text/javascript" }),
  );
  let runtimeWorkerUrl = "";
  let run: {
    id: string;
    worker: Worker;
    messages: number;
    stopped: boolean;
    /** DONE was forwarded (it is forwarded once). */
    done: boolean;
    /** Set for runtime workers (BOOT); false until the code was sent. */
    booted?: boolean;
    started?: boolean;
    outputChars: number;
    /** Text output not yet sent, from one stream. */
    pending: { level: string; text: string; elapsedMs: number } | null;
    flushTimer: ReturnType<typeof setTimeout> | undefined;
  } | null = null;

  const send = (message: Record<string, unknown>) =>
    host.postMessage({ ...message, channel: config.channel }, "*");

  function size(value: unknown): number {
    try {
      return JSON.stringify(value)?.length ?? 0;
    } catch {
      return Infinity;
    }
  }

  function stop(reason?: string) {
    if (!run || run.stopped) return;
    run.stopped = true;
    clearTimeout(run.flushTimer);
    run.worker.terminate();
    if (reason) send({ type: "LIMIT", runId: run.id, reason });
  }

  /**
   * Count one console entry about to be sent, printed text included (output
   * that switches between stdout and stderr makes one entry per switch).
   * Past the limit the run is stopped and this returns false.
   */
  function countEntry(): boolean {
    if (!run || run.stopped) return false;
    run.messages += 1;
    if (run.messages <= config.maxMessages) return true;
    stop(
      `Output limit reached (${config.maxMessages} messages). The run was stopped.`,
    );
    return false;
  }

  /** Send buffered text output as console entries of bounded size. */
  function flushOutput() {
    if (!run) return;
    clearTimeout(run.flushTimer);
    run.flushTimer = undefined;
    const pending = run.pending;
    run.pending = null;
    if (!pending) return;
    let text = pending.text;
    while (text) {
      let cut = text.length;
      if (cut > config.outputBatchChars) {
        const newline = text.lastIndexOf("\n", config.outputBatchChars);
        cut = newline > 0 ? newline + 1 : config.outputBatchChars;
      }
      const chunk = text.slice(0, cut);
      text = text.slice(cut);
      // One trailing newline ends the entry; the rest is shown as is.
      const value = chunk.endsWith("\n") ? chunk.slice(0, -1) : chunk;
      if (!countEntry()) return;
      send({
        type: "LOG",
        runId: run.id,
        level: pending.level,
        args: [{ t: "string", v: value }],
        groupDepth: 0,
        elapsedMs: pending.elapsedMs,
      });
    }
  }

  function queueOutput(stream: unknown, text: unknown, elapsedMs: unknown) {
    if (!run || run.stopped || typeof text !== "string" || !text) return;
    run.outputChars += text.length;
    if (run.outputChars > config.maxOutputChars) {
      flushOutput();
      stop(
        `Output limit reached (${Math.round(config.maxOutputChars / 1000)} K characters). The run was stopped.`,
      );
      return;
    }
    const level = stream === 2 ? "error" : "log";
    if (run.pending && run.pending.level !== level) flushOutput();
    run.pending ??= {
      level,
      text: "",
      elapsedMs: typeof elapsedMs === "number" ? elapsedMs : 0,
    };
    run.pending.text += text;
    if (run.pending.text.length >= config.outputBatchChars) flushOutput();
    else run.flushTimer ??= setTimeout(flushOutput, config.outputFlushMs);
  }

  function forward(data: unknown) {
    if (!run || run.stopped || !data || typeof data !== "object") return;
    const message = data as Record<string, unknown>;
    if (message.type === "OUT") {
      queueOutput(message.stream, message.text, message.elapsedMs);
      return;
    }
    // Everything else keeps its place after the output written before it.
    flushOutput();
    if (run.stopped) return;
    if (message.type === "LOG" || message.type === "ERROR") {
      if (!countEntry()) return;
      const payload: Record<string, unknown> =
        message.type === "LOG"
          ? {
              type: "LOG",
              runId: run.id,
              level: message.level,
              args: message.args,
              groupDepth: message.groupDepth,
              elapsedMs: message.elapsedMs,
            }
          : {
              type: "ERROR",
              runId: run.id,
              error: message.error,
              elapsedMs: message.elapsedMs,
            };
      // Measure exactly what the app will receive (channel included), so a
      // message the app would reject is replaced by a visible notice.
      if (
        size({ ...payload, channel: config.channel }) > config.maxMessageBytes
      ) {
        send({
          type: "LOG",
          runId: run.id,
          level: "warn",
          args: [
            {
              t: "string",
              v: "A console message was dropped because it exceeded the size limit.",
            },
          ],
          groupDepth: 0,
          elapsedMs: message.elapsedMs,
        });
        return;
      }
      send(payload);
    } else if (message.type === "DONE") {
      if (run.done) return;
      run.done = true;
      send({
        type: "DONE",
        runId: run.id,
        elapsedMs: message.elapsedMs,
        exitCode: message.exitCode,
        inputMissing: message.inputMissing,
      });
    } else if (message.type === "BOOTED") {
      // Once, and only from a runtime worker that is booting.
      if (run.booted !== false) return;
      run.booted = true;
      send({ type: "BOOTED", runId: run.id, elapsedMs: message.elapsedMs });
    } else if (message.type === "BOOT_ERROR") {
      send({
        type: "ERROR",
        runId: run.id,
        error: {
          name: "SandboxError",
          message: `The runtime could not start: ${String(message.message)}`,
        },
        elapsedMs: 0,
      });
      stop();
      send({ type: "DONE", runId: run.id, elapsedMs: 0 });
    }
  }

  function fail(runId: string, message: string) {
    send({
      type: "ERROR",
      runId,
      error: { name: "SandboxError", message },
      elapsedMs: 0,
    });
    send({ type: "DONE", runId, elapsedMs: 0 });
  }

  /**
   * Start a worker for `runId`. Its reports arrive only through a private
   * channel, whose `port` must go with the worker's first message: the
   * worker's own postMessage is also within reach of the user's code.
   */
  function startWorker(
    runId: string,
    url: string,
    options: WorkerOptions,
  ): { current: NonNullable<typeof run>; port: MessagePort } | null {
    let worker: Worker;
    try {
      worker = new Worker(url, options);
    } catch (error) {
      fail(runId, `Could not start the execution worker: ${String(error)}`);
      return null;
    }
    const current = {
      id: runId,
      worker,
      messages: 0,
      stopped: false,
      done: false,
      outputChars: 0,
      pending: null,
      flushTimer: undefined,
    };
    run = current;
    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => forward(event.data);
    worker.addEventListener("error", (event) => {
      // User errors are handled inside the worker; this only fires when the
      // worker itself could not start or crashed.
      event.preventDefault();
      if (current.stopped) return;
      flushOutput();
      send({
        type: "ERROR",
        runId,
        error: {
          name: "SandboxError",
          message: event.message || "The execution worker failed.",
        },
        elapsedMs: 0,
      });
      stop();
      send({ type: "DONE", runId, elapsedMs: 0 });
    });
    return { current, port: channel.port2 };
  }

  window.addEventListener("message", (event) => {
    if (event.source !== host) return;
    const data = event.data as Record<string, unknown> | null;
    if (!data || typeof data !== "object" || data.channel !== config.channel)
      return;

    if (data.type === "BOOT") {
      if (
        run ||
        typeof data.runId !== "string" ||
        typeof data.runtime !== "string" ||
        !data.assets ||
        typeof data.assets !== "object"
      )
        return;
      runtimeWorkerUrl ||= URL.createObjectURL(
        new Blob([runtimeWorkerSource], { type: "text/javascript" }),
      );
      const created = startWorker(data.runId, runtimeWorkerUrl, {
        name: `playground-${data.runtime}`,
      });
      if (!created) return;
      const { current, port } = created;
      current.booted = false;
      current.started = false;
      const assets = data.assets as Record<string, unknown>;
      current.worker.postMessage(
        { type: "BOOT", runtime: data.runtime, assets },
        [
          port,
          ...Object.values(assets).filter(
            (value): value is ArrayBuffer => value instanceof ArrayBuffer,
          ),
        ],
      );
    } else if (data.type === "RUN") {
      if (typeof data.runId !== "string" || typeof data.code !== "string")
        return;
      const runId = data.runId;
      const stdin = typeof data.stdin === "string" ? data.stdin : "";
      if (
        data.code.length > config.maxCodeLength ||
        stdin.length > config.maxCodeLength
      ) {
        fail(
          runId,
          `The code is too large to run (limit: ${config.maxCodeLength} characters).`,
        );
        return;
      }
      // A booted runtime worker: hand it the program.
      if (run && run.booted !== undefined) {
        if (run.id !== runId || run.started || !run.booted || run.stopped)
          return;
        run.started = true;
        const binary =
          data.binary instanceof ArrayBuffer ? data.binary : undefined;
        run.worker.postMessage(
          { type: "RUN", code: data.code, stdin, binary },
          binary ? [binary] : [],
        );
        return;
      }
      if (run) return;
      const created = startWorker(runId, workerUrl, { name: "playground-run" });
      created?.current.worker.postMessage({ type: "RUN", code: data.code }, [
        created.port,
      ]);
    } else if (data.type === "STOP") {
      if (run && data.runId === run.id) stop();
    }
  });

  send({ type: "READY" });
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export interface SandboxDocument {
  html: string;
  /** The inline bootstrap script, exposed for tests. */
  script: string;
  scriptHash: string;
}

/** Source of the execution worker script (exposed for tests). */
export function buildWorkerSource(): string {
  const workerConfig: WorkerConfig = {
    serialize: RUNTIME_LIMITS.serialize,
    maxArgs: RUNTIME_LIMITS.maxArgs,
    maxStackLength: RUNTIME_LIMITS.maxStackLength,
    userFileToken: USER_FILE_TOKEN,
  };
  // `import()` is written in this template string rather than in the worker
  // function, because bundlers rewrite dynamic imports in compiled code.
  const importModule = "(url) => import(url)";
  return `"use strict";(${sandboxWorkerMain.toString()})(${importModule}, (${serializeValue.toString()}), ${JSON.stringify(workerConfig)});`;
}

/**
 * Source of the worker that runs every other language. Tests may pass their
 * own (self-contained) drivers.
 */
export function buildRuntimeWorkerSource(
  drivers: Record<string, DriverFactory> = DRIVERS,
): string {
  const config: RuntimeWorkerConfig = {
    virtualOrigin: RUNTIME_VIRTUAL_ORIGIN,
    maxStackLength: RUNTIME_LIMITS.maxStackLength,
    maxMessageLength: RUNTIME_LIMITS.serialize.maxStringLength,
  };
  const sources = Object.entries(drivers)
    .map(([id, driver]) => `${JSON.stringify(id)}: (${driver.toString()})`)
    .join(",\n");
  // See buildWorkerSource for why `import()` lives in a string.
  const importModule = "(url) => import(url)";
  return `(${runtimeWorkerMain.toString()})(${importModule}, ${JSON.stringify(config)}, {${sources}});`;
}

/** Build the sandbox page. `sha256` must return the base64 SHA-256 digest of its input. */
export function buildSandboxDocument(
  sha256: (input: string) => string,
): SandboxDocument {
  const relayConfig: RelayConfig = {
    channel: RUNTIME_CHANNEL,
    maxMessages: RUNTIME_LIMITS.maxMessages,
    maxMessageBytes: RUNTIME_LIMITS.maxMessageBytes,
    maxCodeLength: RUNTIME_LIMITS.maxCodeLength,
    maxOutputChars: RUNTIME_LIMITS.maxOutputChars,
    outputBatchChars: RUNTIME_LIMITS.outputBatchChars,
    outputFlushMs: RUNTIME_LIMITS.outputFlushMs,
  };

  const workerSource = buildWorkerSource();
  const runtimeWorkerSource = buildRuntimeWorkerSource();
  const script = `"use strict";(${sandboxRelayMain.toString()})(${JSON.stringify(workerSource)}, ${JSON.stringify(runtimeWorkerSource)}, ${JSON.stringify(relayConfig)});`;

  if (/<\/script|<!--/i.test(script)) {
    throw new Error(
      "Sandbox bootstrap contains a sequence that would break out of its <script> element.",
    );
  }

  const html =
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="robots" content="noindex"><title>Playground sandbox</title></head>` +
    `<body><script>${script}</script></body></html>`;

  return { html, script, scriptHash: sha256(script) };
}

/**
 * Content Security Policy for the sandbox page. The `sandbox` directive gives
 * the document an opaque origin even if it is opened directly, and network
 * access is blocked. `'unsafe-eval'` adds no capability here (the page exists
 * to run arbitrary code) but keeps `eval`/`new Function` working for users.
 */
export function sandboxContentSecurityPolicy(
  scriptHash: string,
  frameAncestors: string,
): string {
  return [
    "default-src 'none'",
    `script-src 'sha256-${scriptHash}' blob: 'unsafe-eval'`,
    "worker-src blob:",
    "connect-src 'none'",
    "img-src 'none'",
    "style-src 'none'",
    "font-src 'none'",
    "media-src 'none'",
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    `frame-ancestors ${frameAncestors}`,
    "sandbox allow-scripts",
  ].join("; ");
}
