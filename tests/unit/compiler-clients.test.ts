import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClangClient } from "@/lib/clang/clang-client";
import { CompilerClient } from "@/lib/compiler/compiler-client";

/** Stands in for the compiler workers; tests answer for the worker. */
class FakeWorker extends EventTarget {
  static instances: FakeWorker[] = [];
  posted: { id: number; type: string; code: string }[] = [];
  terminated = false;

  constructor() {
    super();
    FakeWorker.instances.push(this);
  }

  postMessage(message: { id: number; type: string; code: string }) {
    this.posted.push(message);
  }

  terminate() {
    this.terminated = true;
  }

  reply(data: unknown) {
    this.dispatchEvent(new MessageEvent("message", { data }));
  }
}

const TIMEOUT_MS = 2_000;

describe("compiler time limits", () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    vi.stubGlobal("Worker", FakeWorker);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("only counts time once the worker has started a request", async () => {
    const client = new CompilerClient(TIMEOUT_MS);
    const check = client.check("let a = 1;", "typescript");
    const [worker] = FakeWorker.instances;
    const { id } = worker.posted[0];

    // Still loading TypeScript: no limit yet.
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS * 5);
    worker.reply({ id, type: "started" });
    worker.reply({ id, type: "check", diagnostics: [] });

    await expect(check).resolves.toEqual([]);
    expect(worker.terminated).toBe(false);
  });

  it("fails a stuck request, replaces the worker and resends the queue", async () => {
    const client = new CompilerClient(TIMEOUT_MS);
    const check = client.check("type Loop = Loop;", "typescript");
    const compile = client.compile("let a = 1;", "typescript");
    const failed = expect(check).rejects.toThrow(
      "The compiler took longer than 2 seconds and was stopped.",
    );
    const [stuck] = FakeWorker.instances;
    stuck.reply({ id: stuck.posted[0].id, type: "started" });

    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);
    await failed;
    expect(stuck.terminated).toBe(true);

    const fresh = FakeWorker.instances[1];
    expect(fresh.posted).toEqual([stuck.posted[1]]);
    const result = { js: "let a = 1;", sourceMap: null, diagnostics: [] };
    fresh.reply({ id: stuck.posted[1].id, type: "started" });
    fresh.reply({ id: stuck.posted[1].id, type: "compile", result });
    await expect(compile).resolves.toEqual(result);
    expect(client.state.status).toBe("loading");
  });

  it("stops a stuck Clang compile the same way", async () => {
    const client = new ClangClient(TIMEOUT_MS);
    const compile = client.compile("int main(void) {}", "c");
    const failed = expect(compile).rejects.toThrow(
      "The compiler took longer than 2 seconds and was stopped.",
    );
    const [stuck] = FakeWorker.instances;
    stuck.reply({ id: 0, type: "ready", version: "22.0.0" });
    stuck.reply({ id: stuck.posted[0].id, type: "started" });

    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);
    await failed;
    expect(stuck.terminated).toBe(true);
    expect(FakeWorker.instances).toHaveLength(2);
    // The new worker downloads the toolchain again (from the HTTP cache).
    expect(client.state.status).toBe("loading");
  });
});

describe("compiler recovery", () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    vi.stubGlobal("Worker", FakeWorker);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("starts a new TypeScript worker after a failed download once reset", async () => {
    const client = new CompilerClient();
    client.start();
    const [broken] = FakeWorker.instances;
    // A chunk of the worker could not be downloaded (server overloaded).
    broken.dispatchEvent(
      Object.assign(new Event("error"), { message: "Failed to fetch" }),
    );
    expect(client.state).toEqual({
      status: "error",
      message: "Failed to fetch",
    });
    await expect(client.check("let a = 1;", "typescript")).rejects.toThrow(
      "Failed to fetch",
    );

    client.reset();
    expect(broken.terminated).toBe(true);
    const check = client.check("let a = 1;", "typescript");
    const fresh = FakeWorker.instances[1];
    fresh.reply({ id: 0, type: "ready", version: "5.9.3" });
    const { id } = fresh.posted[0];
    fresh.reply({ id, type: "started" });
    fresh.reply({ id, type: "check", diagnostics: [] });
    await expect(check).resolves.toEqual([]);
    expect(client.state).toEqual({ status: "ready", version: "5.9.3" });
  });

  it("leaves a working compiler alone on reset", () => {
    const client = new CompilerClient();
    client.start();
    client.reset();
    expect(FakeWorker.instances).toHaveLength(1);
    expect(FakeWorker.instances[0].terminated).toBe(false);
  });
});
