import { createHash } from "node:crypto";
import vm from "node:vm";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseRuntimeMessage,
  RUNTIME_CHANNEL,
  RUNTIME_LIMITS,
} from "@/lib/runtime/protocol";
import {
  buildSandboxDocument,
  buildWorkerSource,
  USER_FILE_TOKEN,
} from "@/lib/runtime/sandbox-document";

type Message = Record<string, unknown>;
type Listener = (event: {
  data?: unknown;
  source?: unknown;
  ports?: unknown[];
}) => void;

const USER_URL = "blob:null/user-module";

/**
 * A MessagePort made in a VM realm (so code there can patch its prototype)
 * that hands what is posted to `sink`.
 */
function realmPort(context: vm.Context, sink: (message: Message) => void) {
  const create = vm.runInContext(
    `(sink) => {
      class MessagePort { postMessage(message) { sink(message); } }
      globalThis.MessagePort = MessagePort;
      return new MessagePort();
    }`,
    context,
  ) as (sink: (message: Message) => void) => unknown;
  return create((message) => sink(structuredClone(message)));
}

/** Run the real worker script in a VM context with a fake worker global. */
function startWorker() {
  /** Reports sent through the private port. */
  const posted: Message[] = [];
  /** Anything sent with the worker's own postMessage (never read by the relay). */
  const unsafe: Message[] = [];
  const listeners: Record<string, Listener[]> = {};
  const scope: Record<string, unknown> = {
    postMessage: (message: Message) => unsafe.push(structuredClone(message)),
    addEventListener: (type: string, listener: Listener) =>
      (listeners[type] ??= []).push(listener),
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    console: {},
    performance,
    Blob,
    URL: { createObjectURL: () => USER_URL },
  };
  scope.self = scope;
  const context = vm.createContext(scope);
  vm.runInContext(buildWorkerSource(), context);
  const port = realmPort(context, (message) => posted.push(message));
  return {
    posted,
    unsafe,
    /** Execute code as if it were user code (errors come from the VM realm). */
    exec: (code: string) => vm.runInContext(code, context),
    /** Deliver a message from the relay, with the private port. */
    dispatch: (data: unknown) =>
      listeners.message?.forEach((listener) =>
        listener({ data, ports: [port] }),
      ),
  };
}

/** One end of a FakeMessageChannel; delivers synchronously to the other. */
class FakePort {
  other: FakePort | null = null;
  onmessage: Listener | null = null;
  postMessage(data: unknown) {
    this.other?.onmessage?.({ data });
  }
}

class FakeMessageChannel {
  port1 = new FakePort();
  port2 = new FakePort();
  constructor() {
    this.port1.other = this.port2;
    this.port2.other = this.port1;
  }
}

/** Run the real relay script with a fake parent window and Worker class. */
function startRelay() {
  const toHost: Message[] = [];
  const windowListeners: Listener[] = [];
  const workers: FakeWorker[] = [];
  const host = {
    postMessage: (message: Message) => toHost.push(structuredClone(message)),
  };

  class FakeWorker {
    received: Message[] = [];
    terminated = false;
    /** The private port the relay sent with the first message. */
    port: FakePort | undefined;
    listeners: Record<string, Listener[]> = {};
    constructor(
      readonly url: string,
      readonly options?: WorkerOptions,
    ) {
      workers.push(this);
    }
    postMessage(message: Message, transfer: unknown[] = []) {
      this.received.push(message);
      this.port ??= transfer.find((item) => item instanceof FakePort);
    }
    addEventListener(type: string, listener: Listener) {
      (this.listeners[type] ??= []).push(listener);
    }
    terminate() {
      this.terminated = true;
    }
    /** Report to the relay, as the worker's scripts do. */
    emit(data: Message) {
      this.port?.postMessage(data);
    }
    /** Post with the worker's own postMessage, as user code could. */
    emitUnsafe(data: Message) {
      this.listeners.message?.forEach((listener) => listener({ data }));
    }
  }

  const doc = buildSandboxDocument((input) =>
    createHash("sha256").update(input).digest("base64"),
  );
  const context = vm.createContext({
    window: {
      parent: host,
      addEventListener: (_type: string, listener: Listener) =>
        windowListeners.push(listener),
    },
    document: { body: {} },
    URL: { createObjectURL: () => "blob:null/worker" },
    Blob,
    Worker: FakeWorker,
    MessageChannel: FakeMessageChannel,
    setTimeout,
    clearTimeout,
  });
  vm.runInContext(doc.script, context);

  return {
    toHost,
    workers,
    send: (data: Message) =>
      windowListeners.forEach((listener) =>
        listener({ source: host, data: { channel: RUNTIME_CHANNEL, ...data } }),
      ),
  };
}

const RUN_ID = "a1b2c3d4e5f60718293a4b5c";

describe("sandbox worker script", () => {
  it("caps console arguments so the app still accepts the message", () => {
    const worker = startWorker();
    worker.dispatch({ type: "RUN", code: "" });
    worker.exec("console.log(...Array.from({ length: 60 }, (_, i) => i))");
    const log = worker.posted.find((m) => m.type === "LOG")!;
    const args = log.args as { t: string; v: string }[];
    expect(args).toHaveLength(RUNTIME_LIMITS.maxArgs);
    expect(args.at(-1)).toEqual({ t: "string", v: "… 11 more arguments" });
    expect(
      parseRuntimeMessage({ ...log, runId: RUN_ID, channel: RUNTIME_CHANNEL }),
    ).not.toBeNull();
  });

  it("does not add a marker at exactly the limit", () => {
    const worker = startWorker();
    worker.dispatch({ type: "RUN", code: "" });
    worker.exec(
      `console.log(...Array.from({ length: ${RUNTIME_LIMITS.maxArgs} }, (_, i) => i))`,
    );
    const log = worker.posted.find((m) => m.type === "LOG")!;
    const args = log.args as { t: string; v: string }[];
    expect(args).toHaveLength(RUNTIME_LIMITS.maxArgs);
    expect(args.at(-1)).toEqual({ t: "number", v: "49" });
  });

  it("cleans the stacks of errors passed to console methods", () => {
    const worker = startWorker();
    worker.dispatch({ type: "RUN", code: "" });
    worker.exec(`
      const error = new Error("caught");
      error.stack = "Error: caught\\n    at f (${USER_URL}:3:7)\\n    at invoke (blob:null/runtime:40:9)";
      console.error("handled:", { nested: [error] }, error);
    `);
    const log = worker.posted.find((m) => m.type === "LOG")!;
    const [, nested, top] = log.args as Message[];
    const expected = `Error: caught\n    at f (${USER_FILE_TOKEN}:3:7)`;
    expect(top).toMatchObject({ t: "error", stack: expected });
    expect(JSON.stringify(nested)).toContain(JSON.stringify(expected));
    expect(JSON.stringify(log)).not.toContain("blob:");
  });

  it("reports only through the port that comes with RUN", () => {
    const worker = startWorker();
    worker.exec("console.log('before RUN')");
    expect(worker.posted).toEqual([]);

    worker.dispatch({ type: "RUN", code: "" });
    worker.exec("console.log('hello')");
    expect(worker.posted.find((m) => m.type === "LOG")).toMatchObject({
      args: [{ t: "string", v: "hello" }],
    });
    expect(worker.unsafe).toEqual([]);
  });

  it("does not let user code capture the port by patching MessagePort", () => {
    const worker = startWorker();
    worker.dispatch({ type: "RUN", code: "" });
    worker.exec(`
      MessagePort.prototype.postMessage = function () { globalThis.stolen = this; };
      console.log("after the patch");
    `);
    expect(worker.exec("globalThis.stolen")).toBeUndefined();
    expect(worker.posted.find((m) => m.type === "LOG")).toMatchObject({
      args: [{ t: "string", v: "after the patch" }],
    });
  });
});

describe("sandbox relay script", () => {
  it("announces itself, starts one worker per run and tags output with the run ID", () => {
    const relay = startRelay();
    expect(relay.toHost[0]).toEqual({
      type: "READY",
      channel: RUNTIME_CHANNEL,
    });
    relay.send({ type: "RUN", runId: RUN_ID, code: "console.log(1)" });
    expect(relay.workers).toHaveLength(1);
    expect(relay.workers[0].received).toEqual([
      { type: "RUN", code: "console.log(1)" },
    ]);
    relay.workers[0].emit({
      type: "LOG",
      level: "log",
      args: [{ t: "number", v: "1" }],
      groupDepth: 0,
      elapsedMs: 1,
    });
    const forwarded = relay.toHost.at(-1)!;
    expect(forwarded).toMatchObject({ type: "LOG", runId: RUN_ID });
    expect(parseRuntimeMessage(forwarded)).not.toBeNull();
  });

  it("answers oversized code with an error instead of ignoring it", () => {
    const relay = startRelay();
    relay.send({
      type: "RUN",
      runId: RUN_ID,
      code: "x".repeat(RUNTIME_LIMITS.maxCodeLength + 1),
    });
    expect(relay.workers).toHaveLength(0);
    const [error, done] = relay.toHost.slice(1);
    expect(parseRuntimeMessage(error)).toMatchObject({
      type: "ERROR",
      runId: RUN_ID,
      error: {
        name: "SandboxError",
        message: expect.stringContaining("too large"),
      },
    });
    expect(parseRuntimeMessage(done)).toMatchObject({
      type: "DONE",
      runId: RUN_ID,
    });
  });

  it("measures message size as the app does, so near-limit output is never silently lost", () => {
    const relay = startRelay();
    relay.send({ type: "RUN", runId: RUN_ID, code: "" });
    const message = (v: string) => ({
      type: "LOG",
      level: "log",
      args: [{ t: "string", v }],
      groupDepth: 0,
      elapsedMs: 0,
    });
    // Fits on its own, but not once runId and channel are added.
    const base = JSON.stringify(message("")).length;
    const nearLimit = message(
      "x".repeat(RUNTIME_LIMITS.maxMessageBytes - base - 10),
    );
    expect(JSON.stringify(nearLimit).length).toBeLessThanOrEqual(
      RUNTIME_LIMITS.maxMessageBytes,
    );
    relay.workers[0].emit(nearLimit);
    const received = relay.toHost.at(-1)!;
    expect(parseRuntimeMessage(received)).toMatchObject({
      type: "LOG",
      level: "warn",
      args: [{ t: "string", v: expect.stringContaining("dropped") }],
    });

    // Every message the relay forwards must pass the app's validation.
    const overhead = JSON.stringify({
      runId: RUN_ID,
      channel: RUNTIME_CHANNEL,
    }).length;
    const fits = message(
      "x".repeat(RUNTIME_LIMITS.maxMessageBytes - base - overhead),
    );
    relay.workers[0].emit(fits);
    expect(parseRuntimeMessage(relay.toHost.at(-1)!)).toMatchObject({
      type: "LOG",
      level: "log",
    });
  });

  it("stops the worker when the output limit is exceeded", () => {
    const relay = startRelay();
    relay.send({ type: "RUN", runId: RUN_ID, code: "" });
    const worker = relay.workers[0];
    for (let i = 0; i <= RUNTIME_LIMITS.maxMessages; i++) {
      worker.emit({
        type: "LOG",
        level: "log",
        args: [],
        groupDepth: 0,
        elapsedMs: 0,
      });
    }
    expect(worker.terminated).toBe(true);
    expect(relay.toHost.at(-1)).toMatchObject({ type: "LIMIT", runId: RUN_ID });
    const forwardedLogs = relay.toHost.filter((m) => m.type === "LOG");
    expect(forwardedLogs).toHaveLength(RUNTIME_LIMITS.maxMessages);
  });

  it("ignores messages that are not from the parent window or the channel", () => {
    const relay = startRelay();
    relay.send({ type: "RUN", runId: RUN_ID, code: "", channel: "other" });
    expect(relay.workers).toHaveLength(0);
  });

  it("ignores what the worker posts outside its private port", () => {
    const relay = startRelay();
    relay.send({ type: "RUN", runId: RUN_ID, code: "" });
    const worker = relay.workers[0];
    const before = relay.toHost.length;
    // What user code could send with self.postMessage().
    worker.emitUnsafe({ type: "DONE", elapsedMs: 0, exitCode: 0 });
    worker.emitUnsafe({
      type: "ERROR",
      error: { name: "SandboxError", message: "forged" },
      elapsedMs: 0,
    });
    expect(relay.toHost).toHaveLength(before);
    expect(worker.listeners.message).toBeUndefined();
  });

  it("forwards DONE once, and BOOTED never for a JavaScript run", () => {
    const relay = startRelay();
    relay.send({ type: "RUN", runId: RUN_ID, code: "" });
    const worker = relay.workers[0];
    const before = relay.toHost.length;
    worker.emit({ type: "BOOTED", elapsedMs: 0 });
    worker.emit({ type: "DONE", elapsedMs: 1 });
    worker.emit({ type: "DONE", elapsedMs: 2 });
    expect(relay.toHost.slice(before).map((m) => m.type)).toEqual(["DONE"]);
  });
});

describe("sandbox relay script: WebAssembly runtimes", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  /** A runtime worker booted for RUN_ID. */
  function booted() {
    const relay = startRelay();
    const assets = { "python.wasm": new ArrayBuffer(4) };
    relay.send({ type: "BOOT", runId: RUN_ID, runtime: "python", assets });
    const worker = relay.workers[0];
    worker.emit({ type: "BOOTED", elapsedMs: 12 });
    return { relay, worker };
  }

  const out = (stream: 1 | 2, text: string, elapsedMs = 1) => ({
    type: "OUT",
    stream,
    text,
    elapsedMs,
  });

  it("boots a runtime worker, then hands it the program", () => {
    const { relay, worker } = booted();
    // A classic worker: Chromium cannot start module workers in an opaque origin.
    expect(worker.options).toEqual({ name: "playground-python" });
    expect(worker.received[0]).toMatchObject({
      type: "BOOT",
      runtime: "python",
      assets: { "python.wasm": expect.any(ArrayBuffer) },
    });
    expect(parseRuntimeMessage(relay.toHost.at(-1)!)).toEqual({
      channel: RUNTIME_CHANNEL,
      type: "BOOTED",
      runId: RUN_ID,
      elapsedMs: 12,
    });

    relay.send({ type: "RUN", runId: RUN_ID, code: "print(1)", stdin: "in" });
    expect(worker.received[1]).toEqual({
      type: "RUN",
      code: "print(1)",
      stdin: "in",
      binary: undefined,
    });
    // One program per sandbox; a run for another ID is not this worker's.
    relay.send({ type: "RUN", runId: RUN_ID, code: "again" });
    relay.send({ type: "RUN", runId: "other", code: "x" });
    expect(worker.received).toHaveLength(2);
    expect(relay.workers).toHaveLength(1);
  });

  it("does not send code before the runtime has booted", () => {
    const relay = startRelay();
    relay.send({ type: "BOOT", runId: RUN_ID, runtime: "lua", assets: {} });
    relay.send({ type: "RUN", runId: RUN_ID, code: "print(1)" });
    expect(relay.workers[0].received).toHaveLength(1);
  });

  it("batches printed text into console entries, kept in order with errors", () => {
    const { relay, worker } = booted();
    relay.send({ type: "RUN", runId: RUN_ID, code: "" });
    const before = relay.toHost.length;
    worker.emit(out(1, "one\n"));
    worker.emit(out(1, "two\n"));
    worker.emit(out(2, "warning\n"));
    worker.emit(out(1, "partial"));
    worker.emit({
      type: "ERROR",
      error: { name: "ValueError", message: "bad", line: 2, column: 1 },
      elapsedMs: 3,
    });
    worker.emit({ type: "DONE", elapsedMs: 4, exitCode: 1 });
    const sent = relay.toHost.slice(before).map((m) => parseRuntimeMessage(m));
    expect(sent.map((m) => m?.type)).toEqual([
      "LOG",
      "LOG",
      "LOG",
      "ERROR",
      "DONE",
    ]);
    expect(sent[0]).toMatchObject({
      level: "log",
      args: [{ t: "string", v: "one\ntwo" }],
    });
    expect(sent[1]).toMatchObject({
      level: "error",
      args: [{ t: "string", v: "warning" }],
    });
    expect(sent[2]).toMatchObject({ args: [{ t: "string", v: "partial" }] });
    expect(sent[4]).toMatchObject({ exitCode: 1 });
  });

  it("shows printed text after a short delay, even if the program then hangs", () => {
    vi.useFakeTimers();
    const { relay, worker } = booted();
    relay.send({ type: "RUN", runId: RUN_ID, code: "" });
    const before = relay.toHost.length;
    worker.emit(out(1, "still running\n"));
    expect(relay.toHost).toHaveLength(before);
    vi.advanceTimersByTime(RUNTIME_LIMITS.outputFlushMs);
    expect(relay.toHost.at(-1)).toMatchObject({
      type: "LOG",
      args: [{ t: "string", v: "still running" }],
    });
  });

  it("splits long output into entries the app accepts", () => {
    const { relay, worker } = booted();
    relay.send({ type: "RUN", runId: RUN_ID, code: "" });
    const before = relay.toHost.length;
    const line = `${"x".repeat(99)}\n`;
    worker.emit(out(1, line.repeat(250)));
    worker.emit({ type: "DONE", elapsedMs: 1 });
    const logs = relay.toHost.slice(before, -1);
    expect(logs.length).toBeGreaterThan(1);
    for (const log of logs) {
      const parsed = parseRuntimeMessage(log);
      expect(parsed?.type).toBe("LOG");
      const text = (log.args as { v: string }[])[0].v;
      expect(text.length).toBeLessThanOrEqual(RUNTIME_LIMITS.outputBatchChars);
    }
    const total = logs
      .map((log) => (log.args as { v: string }[])[0].v)
      .join("\n");
    expect(total).toBe(line.repeat(250).trimEnd());
  });

  it("stops a runtime that prints too much", () => {
    const { relay, worker } = booted();
    relay.send({ type: "RUN", runId: RUN_ID, code: "" });
    const chunk = "y".repeat(100_000);
    for (let i = 0; i * chunk.length <= RUNTIME_LIMITS.maxOutputChars; i++)
      worker.emit(out(1, chunk));
    expect(worker.terminated).toBe(true);
    expect(relay.toHost.at(-1)).toMatchObject({
      type: "LIMIT",
      reason: expect.stringContaining("Output limit"),
    });
  });

  it("counts printed text toward the message limit", () => {
    const { relay, worker } = booted();
    relay.send({ type: "RUN", runId: RUN_ID, code: "" });
    // Each switch between stdout and stderr ends a console entry.
    for (let i = 0; i <= RUNTIME_LIMITS.maxMessages; i++) {
      worker.emit(out(1, "a"));
      worker.emit(out(2, "b"));
    }
    expect(worker.terminated).toBe(true);
    expect(relay.toHost.at(-1)).toMatchObject({
      type: "LIMIT",
      reason: expect.stringContaining(`${RUNTIME_LIMITS.maxMessages} messages`),
    });
    const logs = relay.toHost.filter((m) => m.type === "LOG");
    expect(logs).toHaveLength(RUNTIME_LIMITS.maxMessages);
  });

  it("forwards BOOTED once", () => {
    const { relay, worker } = booted();
    worker.emit({ type: "BOOTED", elapsedMs: 13 });
    expect(relay.toHost.filter((m) => m.type === "BOOTED")).toHaveLength(1);
  });

  it("forwards STARTED once, and only once the code was sent", () => {
    const { relay, worker } = booted();
    const started = () => relay.toHost.filter((m) => m.type === "STARTED");
    worker.emit({ type: "STARTED", elapsedMs: 20 });
    expect(started()).toHaveLength(0);
    relay.send({ type: "RUN", runId: RUN_ID, code: "class Main {}" });
    worker.emit({ type: "STARTED", elapsedMs: 900 });
    worker.emit({ type: "STARTED", elapsedMs: 901 });
    expect(started()).toHaveLength(1);
    expect(parseRuntimeMessage(started()[0])).toEqual({
      channel: RUNTIME_CHANNEL,
      type: "STARTED",
      runId: RUN_ID,
      elapsedMs: 900,
    });
  });

  it("reports a runtime that fails to boot", () => {
    const relay = startRelay();
    relay.send({ type: "BOOT", runId: RUN_ID, runtime: "r", assets: {} });
    relay.workers[0].emit({ type: "BOOT_ERROR", message: "no R today" });
    const [error, done] = relay.toHost
      .slice(-2)
      .map((m) => parseRuntimeMessage(m));
    expect(error).toMatchObject({
      type: "ERROR",
      error: { message: expect.stringContaining("no R today") },
    });
    expect(done).toMatchObject({ type: "DONE", runId: RUN_ID });
    expect(relay.workers[0].terminated).toBe(true);
  });
});
