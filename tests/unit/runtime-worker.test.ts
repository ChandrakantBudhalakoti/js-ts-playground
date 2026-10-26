import vm from "node:vm";
import { describe, expect, it } from "vitest";
import type { DriverHost } from "@/lib/runtime/drivers/types";
import { buildRuntimeWorkerSource } from "@/lib/runtime/sandbox-document";

type Message = Record<string, unknown>;
type Listener = (event: { data?: unknown; ports?: unknown[] }) => void;

/**
 * A driver that exercises the worker's services. Self-contained, like real
 * drivers: it runs inside the VM, where `fetch`, `XMLHttpRequest` and
 * `importScripts` are the worker's replacements.
 */
function probeDriver(host: DriverHost) {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const scope = globalThis as any;
  let fetched = "";
  let blocked = "";
  return {
    async boot() {
      host.stdout.write("boot chatter\n");
      fetched = await (await scope.fetch(`${host.baseUrl}hello.txt`)).text();
      try {
        await scope.fetch("https://example.com/");
      } catch (error) {
        blocked = String(error);
      }
    },
    async run(code: string, binary: Uint8Array | null) {
      host.stdout.write(`code: ${code}\n`);
      host.stdout.write(`fetched: ${fetched}\n`);
      host.stdout.write(`blocked: ${blocked}\n`);
      // A multi-byte character split across writes.
      host.stderr.writeBytes(new Uint8Array([0xe2, 0x82]));
      host.stderr.writeBytes(new Uint8Array([0xac, 0x0a]));
      const request = new scope.XMLHttpRequest();
      request.open("GET", `${host.baseUrl}hello.txt`, false);
      request.send();
      host.stdout.write(
        `xhr: ${request.status} ${request.responseText} ${request.getResponseHeader("Content-Length")}\n`,
      );
      const first = new TextDecoder().decode(host.readStdin(3));
      const rest = new TextDecoder().decode(host.readAllStdin());
      host.stdout.write(`stdin: ${first}|${rest}\n`);
      let importScriptsThrows = false;
      try {
        scope.importScripts("x.js");
      } catch {
        importScriptsThrows = true;
      }
      host.stdout.write(`importScripts throws: ${importScriptsThrows}\n`);
      if (code === "fail") {
        host.reportError({ name: "Oops", message: "bad thing", line: 3 });
        return 1;
      }
      if (code === "throw") throw new Error("driver failure");
      return binary ? binary.length : 0;
    },
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

function startRuntimeWorker() {
  /** Reports sent through the private port that came with BOOT. */
  const posted: Message[] = [];
  /** Anything sent with the worker's own postMessage (never read by the relay). */
  const unsafe: Message[] = [];
  const listeners: Record<string, Listener[]> = {};
  const quiet = () => {};
  const scope: Record<string, unknown> = {
    postMessage: (message: Message) => unsafe.push(structuredClone(message)),
    addEventListener: (type: string, listener: Listener) =>
      (listeners[type] ??= []).push(listener),
    console: {
      log: quiet,
      info: quiet,
      debug: quiet,
      warn: quiet,
      error: quiet,
    },
    fetch: () => Promise.reject(new Error("the real network was used")),
    importScripts: () => {},
    performance,
    TextEncoder,
    TextDecoder,
    Response,
    Blob,
    URL,
    DOMException,
    setTimeout,
    clearTimeout,
  };
  scope.self = scope;
  const context = vm.createContext(scope);
  vm.runInContext(buildRuntimeWorkerSource({ probe: probeDriver }), context);
  // Buffers must come from the worker's realm, as postMessage delivers them.
  const buffer = vm.runInContext(
    "(text) => { const bytes = new TextEncoder().encode(text); const copy = new Uint8Array(bytes.length); copy.set(bytes); return copy.buffer; }",
    context,
  ) as (text: string) => ArrayBuffer;
  const port = {
    postMessage: (message: Message) => posted.push(structuredClone(message)),
  };
  const send = (data: Message) =>
    listeners.message?.forEach((listener) => listener({ data, ports: [port] }));
  const next = async (type: string) => {
    for (let i = 0; i < 200; i++) {
      const found = posted.find((message) => message.type === type);
      if (found) return found;
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    throw new Error(`No ${type} message`);
  };
  const output = (stream: 1 | 2) =>
    posted
      .filter((message) => message.type === "OUT" && message.stream === stream)
      .map((message) => message.text)
      .join("");
  return { posted, unsafe, send, next, output, buffer };
}

describe("runtime worker", () => {
  it("boots a driver from its files without network access", async () => {
    const worker = startRuntimeWorker();
    worker.send({
      type: "BOOT",
      runtime: "probe",
      assets: { "hello.txt": worker.buffer("hello") },
    });
    await worker.next("BOOTED");
    // Output written while booting is not part of the program's output.
    expect(worker.posted.filter((m) => m.type === "OUT")).toEqual([]);

    worker.send({ type: "RUN", code: "print", stdin: "abcdef" });
    const done = await worker.next("DONE");
    expect(done).toMatchObject({ type: "DONE", exitCode: 0 });
    const stdout = worker.output(1);
    expect(stdout).toContain("code: print\n");
    expect(stdout).toContain("fetched: hello\n");
    expect(stdout).toContain(
      "blocked: TypeError: Network access is disabled in the playground sandbox.",
    );
    expect(stdout).toContain("xhr: 200 hello 5\n");
    expect(stdout).toContain("stdin: abc|def\n");
    expect(stdout).toContain("importScripts throws: true\n");
    expect(worker.output(2)).toBe("€\n");
    // Everything went through the private port.
    expect(worker.unsafe).toEqual([]);
  });

  it("reports errors with their location and the exit status", async () => {
    const worker = startRuntimeWorker();
    worker.send({
      type: "BOOT",
      runtime: "probe",
      assets: { "hello.txt": worker.buffer("") },
    });
    await worker.next("BOOTED");
    worker.send({ type: "RUN", code: "fail" });
    const error = await worker.next("ERROR");
    expect(error).toMatchObject({
      error: { name: "Oops", message: "bad thing", line: 3, column: 1 },
    });
    expect(await worker.next("DONE")).toMatchObject({ exitCode: 1 });
  });

  it("reports a driver that throws as an error", async () => {
    const worker = startRuntimeWorker();
    worker.send({
      type: "BOOT",
      runtime: "probe",
      assets: { "hello.txt": worker.buffer("") },
    });
    await worker.next("BOOTED");
    worker.send({ type: "RUN", code: "throw" });
    expect(await worker.next("ERROR")).toMatchObject({
      error: { name: "Error", message: "driver failure" },
    });
    const done = await worker.next("DONE");
    expect(done.exitCode).toBeUndefined();
  });

  it("passes a compiled program to the driver", async () => {
    const worker = startRuntimeWorker();
    worker.send({
      type: "BOOT",
      runtime: "probe",
      assets: { "hello.txt": worker.buffer("") },
    });
    await worker.next("BOOTED");
    worker.send({ type: "RUN", code: "", binary: worker.buffer("12345678") });
    expect(await worker.next("DONE")).toMatchObject({ exitCode: 8 });
  });

  it("tells when the program read input but none was given", async () => {
    const worker = startRuntimeWorker();
    worker.send({
      type: "BOOT",
      runtime: "probe",
      assets: { "hello.txt": worker.buffer("") },
    });
    await worker.next("BOOTED");
    worker.send({ type: "RUN", code: "", stdin: "" });
    expect(await worker.next("DONE")).toMatchObject({ inputMissing: true });

    const given = startRuntimeWorker();
    given.send({
      type: "BOOT",
      runtime: "probe",
      assets: { "hello.txt": given.buffer("") },
    });
    await given.next("BOOTED");
    given.send({ type: "RUN", code: "", stdin: "x" });
    expect((await given.next("DONE")).inputMissing).toBeUndefined();
  });

  it("fails to boot an unknown runtime", async () => {
    const worker = startRuntimeWorker();
    worker.send({ type: "BOOT", runtime: "cobol", assets: {} });
    expect(await worker.next("BOOT_ERROR")).toMatchObject({
      message: expect.stringContaining("Unknown runtime"),
    });
  });

  it("ignores code until it has booted", async () => {
    const worker = startRuntimeWorker();
    worker.send({ type: "RUN", code: "early" });
    worker.send({
      type: "BOOT",
      runtime: "probe",
      assets: { "hello.txt": worker.buffer("") },
    });
    await worker.next("BOOTED");
    expect(worker.posted.some((m) => m.type === "DONE")).toBe(false);
  });
});
