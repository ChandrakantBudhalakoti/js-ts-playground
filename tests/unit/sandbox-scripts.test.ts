import { createHash } from "node:crypto";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
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
type Listener = (event: { data?: unknown; source?: unknown }) => void;

const USER_URL = "blob:null/user-module";

/** Run the real worker script in a VM context with a fake worker global. */
function startWorker() {
  const posted: Message[] = [];
  const listeners: Record<string, Listener[]> = {};
  const scope: Record<string, unknown> = {
    postMessage: (message: Message) => posted.push(structuredClone(message)),
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
  return {
    posted,
    /** Execute code as if it were user code (errors come from the VM realm). */
    exec: (code: string) => vm.runInContext(code, context),
    dispatch: (data: unknown) =>
      listeners.message?.forEach((listener) => listener({ data })),
  };
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
    private listeners: Record<string, Listener[]> = {};
    constructor() {
      workers.push(this);
    }
    postMessage(message: Message) {
      this.received.push(message);
    }
    addEventListener(type: string, listener: Listener) {
      (this.listeners[type] ??= []).push(listener);
    }
    terminate() {
      this.terminated = true;
    }
    emit(data: Message) {
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
    worker.exec("console.log(...Array.from({ length: 60 }, (_, i) => i))");
    const [log] = worker.posted;
    const args = log.args as { t: string; v: string }[];
    expect(args).toHaveLength(RUNTIME_LIMITS.maxArgs);
    expect(args.at(-1)).toEqual({ t: "string", v: "… 11 more arguments" });
    expect(
      parseRuntimeMessage({ ...log, runId: RUN_ID, channel: RUNTIME_CHANNEL }),
    ).not.toBeNull();
  });

  it("does not add a marker at exactly the limit", () => {
    const worker = startWorker();
    worker.exec(
      `console.log(...Array.from({ length: ${RUNTIME_LIMITS.maxArgs} }, (_, i) => i))`,
    );
    const args = worker.posted[0].args as { t: string; v: string }[];
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
});
