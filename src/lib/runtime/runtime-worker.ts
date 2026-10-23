import type { DriverFactory, DriverHost } from "./drivers/types";

export interface RuntimeWorkerConfig {
  /** Origin of the runtimes' virtual file URLs; it never reaches the network. */
  virtualOrigin: string;
  maxStackLength: number;
  maxMessageLength: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Runs inside the execution worker (a classic worker owned by the sandbox
 * iframe) for every language except JavaScript. It receives a runtime's
 * files with BOOT, lets the language driver start the runtime, then runs
 * the user's code once on RUN and reports its output as OUT text chunks.
 *
 * Runtimes that ship ES modules are loaded with dynamic `import()`: Chromium
 * cannot start a module worker from the sandbox's opaque origin.
 *
 * The sandbox CSP already blocks the network. On top of that, `fetch` and
 * `XMLHttpRequest` are replaced: requests for the runtime's own virtual URLs
 * are answered from the files in memory, everything else fails.
 *
 * Self-contained: serialized with `Function.prototype.toString`, so it must
 * not reference imports, module-level identifiers or dynamic `import()`.
 */
export function runtimeWorkerMain(
  importModuleUrl: (url: string) => Promise<any>,
  config: RuntimeWorkerConfig,
  drivers: Record<string, DriverFactory>,
) {
  const scope = self as any;
  const post: (message: unknown) => void = scope.postMessage.bind(scope);
  const now = performance.now.bind(performance);
  const nativeConsole = scope.console;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let phase: "idle" | "booting" | "ready" | "running" | "done" = "idle";
  let startedAt = now();
  let capturing = false;
  let base = config.virtualOrigin;
  const files = new Map<string, Uint8Array>();
  let stdin = new Uint8Array(0);
  let stdinPos = 0;

  const elapsed = () => Math.round((now() - startedAt) * 10) / 10;

  // Pyodide refuses to start in a classic worker, which it detects by
  // calling importScripts(). Nothing here needs it (scripts are imported as
  // modules), so it fails like it does in a module worker.
  scope.importScripts = () => {
    throw new TypeError("importScripts() is not available in this worker.");
  };

  // --- output ------------------------------------------------------------
  // Methods never use `this`: drivers pass them around as callbacks.
  function createStream(stream: 1 | 2) {
    let streamDecoder = new TextDecoder();
    const write = (text: string) => {
      if (!text) return;
      if (!capturing) {
        // Boot-time chatter goes to the developer console only.
        nativeConsole.debug(text);
        return;
      }
      post({ type: "OUT", stream, text: String(text), elapsedMs: elapsed() });
    };
    return {
      write,
      writeBytes: (bytes: Uint8Array) =>
        write(streamDecoder.decode(bytes, { stream: true })),
      end: () => {
        write(streamDecoder.decode());
        streamDecoder = new TextDecoder();
      },
    };
  }
  const stdout = createStream(1);
  const stderr = createStream(2);

  // Stray console output (from user code reaching into JavaScript, or a
  // runtime's diagnostics) is shown as program output, one call per line.
  const line =
    (stream: typeof stdout) =>
    (...args: unknown[]) =>
      stream.write(args.map((arg) => String(arg)).join(" ") + "\n");
  scope.console = {
    ...nativeConsole,
    log: line(stdout),
    info: line(stdout),
    debug: line(stdout),
    warn: line(stderr),
    error: line(stderr),
  };

  function reportError(info: {
    name?: unknown;
    message?: unknown;
    stack?: unknown;
    line?: unknown;
    column?: unknown;
  }) {
    stdout.end();
    stderr.end();
    const lineNumber = Number(info.line);
    const columnNumber = Number(info.column);
    const located = Number.isFinite(lineNumber) && lineNumber >= 1;
    post({
      type: "ERROR",
      error: {
        name: String(info.name ?? "").slice(0, 200),
        message: String(info.message ?? "").slice(0, config.maxMessageLength),
        stack:
          typeof info.stack === "string" && info.stack
            ? info.stack.slice(0, config.maxStackLength)
            : undefined,
        line: located ? lineNumber : undefined,
        column: located
          ? Number.isFinite(columnNumber) && columnNumber >= 1
            ? columnNumber
            : 1
          : undefined,
      },
      elapsedMs: elapsed(),
    });
  }

  function describe(error: unknown): { name: string; message: string } {
    if (error instanceof Error)
      return { name: error.name || "Error", message: error.message };
    return { name: "Error", message: String(error) };
  }

  // --- virtual network ---------------------------------------------------
  const MIME: Record<string, string> = {
    wasm: "application/wasm",
    js: "text/javascript",
    mjs: "text/javascript",
    json: "application/json",
    zip: "application/zip",
  };
  const mimeOf = (name: string) =>
    MIME[name.slice(name.lastIndexOf(".") + 1)] ?? "application/octet-stream";

  /** The runtime file a URL refers to, or null for anything else. */
  function fileOf(url: unknown): string | null {
    let href: string;
    try {
      href = new URL(String(url), base).href;
    } catch {
      return null;
    }
    if (!href.startsWith(base)) return null;
    const name = decodeURIComponent(href.slice(base.length).split(/[?#]/)[0]);
    return files.has(name) ? name : null;
  }

  const offline = () =>
    new TypeError("Network access is disabled in the playground sandbox.");

  scope.fetch = (input: any) => {
    const url =
      typeof input === "string" || input instanceof URL ? input : input?.url;
    const name = fileOf(url);
    if (name === null) return Promise.reject(offline());
    return Promise.resolve(
      new Response(files.get(name) as BlobPart, {
        status: 200,
        headers: { "Content-Type": mimeOf(name) },
      }),
    );
  };

  function FakeXMLHttpRequest(this: any) {
    this.readyState = 0;
    this.status = 0;
    this.statusText = "";
    this.response = null;
    this.responseText = "";
    this.responseType = "";
    this.responseURL = "";
    this.timeout = 0;
    this.withCredentials = false;
    this.onload = null;
    this.onerror = null;
    this.onloadend = null;
    this.onreadystatechange = null;
    this.onprogress = null;
    this.listeners = {} as Record<string, ((event: unknown) => void)[]>;
    this.url = "";
    this.async = true;
  }
  FakeXMLHttpRequest.UNSENT = 0;
  FakeXMLHttpRequest.OPENED = 1;
  FakeXMLHttpRequest.HEADERS_RECEIVED = 2;
  FakeXMLHttpRequest.LOADING = 3;
  FakeXMLHttpRequest.DONE = 4;
  FakeXMLHttpRequest.prototype = {
    open(_method: string, url: string, async?: boolean) {
      this.url = String(url);
      this.async = async !== false;
      this.readyState = 1;
    },
    setRequestHeader() {},
    overrideMimeType() {},
    abort() {},
    getAllResponseHeaders() {
      const name = this.status === 200 ? fileOf(this.url) : null;
      return name === null
        ? ""
        : `content-type: ${mimeOf(name)}\r\ncontent-length: ${files.get(name)!.length}\r\n`;
    },
    // Emscripten's lazy files ask for the length (HEAD) and read the whole
    // file at once, as no Accept-Ranges header is announced.
    getResponseHeader(header: string) {
      const name = this.status === 200 ? fileOf(this.url) : null;
      if (name === null) return null;
      const key = header.toLowerCase();
      if (key === "content-type") return mimeOf(name);
      if (key === "content-length") return String(files.get(name)!.length);
      return null;
    },
    addEventListener(type: string, listener: (event: unknown) => void) {
      (this.listeners[type] ??= []).push(listener);
    },
    removeEventListener(type: string, listener: (event: unknown) => void) {
      this.listeners[type] = (this.listeners[type] ?? []).filter(
        (entry: unknown) => entry !== listener,
      );
    },
    dispatch(type: string) {
      const event = { type, target: this, currentTarget: this };
      this[`on${type}`]?.call(this, event);
      for (const listener of this.listeners[type] ?? [])
        listener.call(this, event);
    },
    send() {
      const name = fileOf(this.url);
      const finish = () => {
        this.readyState = 4;
        if (name === null) {
          this.dispatch("readystatechange");
          this.dispatch("error");
          this.dispatch("loadend");
          return;
        }
        const data = files.get(name)!;
        this.status = 200;
        this.statusText = "OK";
        this.responseURL = base + name;
        if (this.responseType === "arraybuffer")
          this.response = data.slice().buffer;
        else if (this.responseType === "blob")
          this.response = new Blob([data as BlobPart]);
        else if (this.responseType === "json")
          this.response = JSON.parse(decoder.decode(data));
        else {
          this.responseText = decoder.decode(data);
          this.response = this.responseText;
        }
        this.dispatch("readystatechange");
        this.dispatch("load");
        this.dispatch("loadend");
      };
      if (this.async) {
        setTimeout(finish, 0);
        return;
      }
      finish();
      if (name === null)
        throw new DOMException("Network access is disabled.", "NetworkError");
    },
  };
  scope.XMLHttpRequest = FakeXMLHttpRequest;
  scope.WebSocket = undefined;
  scope.EventSource = undefined;

  // --- runtime files -----------------------------------------------------
  function file(name: string): Uint8Array {
    const data = files.get(name);
    if (!data) throw new Error(`The runtime file "${name}" is missing.`);
    return data;
  }

  function moduleSource(name: string): string {
    return decoder
      .decode(file(name))
      .split("import.meta.url")
      .join(JSON.stringify(base + name));
  }

  async function importModule(name: string): Promise<any> {
    const url = URL.createObjectURL(
      new Blob([moduleSource(name)], { type: "text/javascript" }),
    );
    try {
      return await importModuleUrl(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /** Set when the program reads standard input while none was given. */
  let readEmptyInput = false;

  function readStdin(max: number): Uint8Array {
    if (stdin.length === 0) readEmptyInput = true;
    const chunk = stdin.slice(stdinPos, stdinPos + Math.max(0, max));
    stdinPos += chunk.length;
    return chunk;
  }

  const host: DriverHost = {
    get baseUrl() {
      return base;
    },
    file,
    text: (name: string) => decoder.decode(file(name)),
    fileNames: () => [...files.keys()],
    putFile: (name: string, contents: Uint8Array | string) => {
      files.set(
        name,
        typeof contents === "string" ? encoder.encode(contents) : contents,
      );
    },
    importModule,
    moduleSource,
    stdout,
    stderr,
    readStdin,
    readAllStdin: () => readStdin(stdin.length),
    stdinBytes: () => stdin.slice(),
    reportError,
  };

  // --- errors outside the driver's control -------------------------------
  scope.addEventListener("error", (event: any) => {
    event.preventDefault();
    if (phase === "running")
      reportError(describe(event.error ?? event.message));
  });
  scope.addEventListener("unhandledrejection", (event: any) => {
    event.preventDefault();
    if (phase === "running") reportError(describe(event.reason));
  });

  // --- lifecycle -----------------------------------------------------------
  let driver: ReturnType<DriverFactory> | null = null;

  async function boot(runtime: string, assets: Record<string, ArrayBuffer>) {
    phase = "booting";
    base = `${config.virtualOrigin}${runtime}/`;
    for (const [name, buffer] of Object.entries(assets)) {
      if (buffer instanceof ArrayBuffer)
        files.set(name, new Uint8Array(buffer));
    }
    try {
      const factory = drivers[runtime];
      if (!factory) throw new Error(`Unknown runtime "${runtime}".`);
      driver = factory(host);
      await driver.boot();
      phase = "ready";
      post({ type: "BOOTED", elapsedMs: elapsed() });
    } catch (error) {
      phase = "done";
      const { message } = describe(error);
      post({ type: "BOOT_ERROR", message: message.slice(0, 2_000) });
    }
  }

  async function run(code: string, input: string, binary: unknown) {
    phase = "running";
    stdin = encoder.encode(input);
    stdinPos = 0;
    capturing = true;
    startedAt = now();
    let exitCode: number | void = undefined;
    try {
      exitCode = await driver!.run(
        code,
        binary instanceof ArrayBuffer ? new Uint8Array(binary) : null,
      );
    } catch (error) {
      reportError(describe(error));
    }
    stdout.end();
    stderr.end();
    phase = "done";
    post({
      type: "DONE",
      elapsedMs: elapsed(),
      exitCode:
        typeof exitCode === "number" && Number.isFinite(exitCode)
          ? exitCode
          : undefined,
      inputMissing: readEmptyInput || undefined,
    });
  }

  scope.addEventListener("message", (event: any) => {
    const data = event.data;
    if (!data || typeof data !== "object") return;
    if (data.type === "BOOT" && phase === "idle") {
      if (typeof data.runtime !== "string" || !data.assets) return;
      void boot(data.runtime, data.assets);
    } else if (data.type === "RUN" && phase === "ready") {
      if (typeof data.code !== "string") return;
      void run(
        data.code,
        typeof data.stdin === "string" ? data.stdin : "",
        data.binary,
      );
    }
  });
}

/* eslint-enable @typescript-eslint/no-explicit-any */
