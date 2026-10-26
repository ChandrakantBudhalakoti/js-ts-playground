import type {
  ClangLanguage,
  ClangRequest,
  ClangResponse,
  ClangResult,
} from "./protocol";

export type ClangState =
  | { status: "idle" }
  | { status: "loading"; loaded: number; total: number }
  | { status: "ready"; version: string }
  | { status: "error"; message: string };

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/**
 * How long one check or compile may run once the worker has started it (the
 * toolchain download does not count). The preprocessor and templates can be
 * made to run almost forever, and share links are checked as they open.
 */
export const CLANG_TIMEOUT_MS = 60_000;

type Request = DistributiveOmit<ClangRequest, "id">;

type Pending = {
  message: Request;
  resolve: (result: ClangResult) => void;
  reject: (error: Error) => void;
  /** The time limit, set once the worker has started the request. */
  timer?: ReturnType<typeof setTimeout>;
};

/**
 * Main-thread client for the Clang worker. The toolchain (~27 MB) is only
 * downloaded once C or C++ is used, and compiles off the main thread. A
 * request that runs past the time limit fails, and the stuck worker is
 * replaced by a new one.
 */
export class ClangClient {
  private worker: Worker | null = null;
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private listeners = new Set<() => void>();
  private _state: ClangState = { status: "idle" };

  constructor(private readonly timeoutMs = CLANG_TIMEOUT_MS) {}

  get state(): ClangState {
    return this._state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Start the worker and the toolchain download (idempotent). */
  start() {
    if (this.worker || this._state.status === "error") return;
    try {
      this.worker = new Worker(new URL("./clang.worker.ts", import.meta.url), {
        name: "clang",
        type: "module",
      });
    } catch (error) {
      this.setState({ status: "error", message: errorMessage(error) });
      return;
    }
    this.setState({ status: "loading", loaded: 0, total: 0 });
    this.worker.addEventListener("message", this.onMessage);
    this.worker.addEventListener("error", this.onError);
  }

  private checking = false;
  private nextCheck: {
    code: string;
    language: ClangLanguage;
    resolve: (result: ClangResult) => void;
    reject: (error: Error) => void;
  } | null = null;

  /**
   * Check `code` without compiling it. Checks can take a few seconds (C++
   * headers), so while one runs only the newest request waits; older waiting
   * ones are rejected as superseded.
   */
  check(code: string, language: ClangLanguage): Promise<ClangResult> {
    if (!this.checking) {
      this.checking = true;
      return this.request({ type: "check", code, language }).finally(() =>
        this.checkNext(),
      );
    }
    this.nextCheck?.reject(new Error("Superseded by a newer check."));
    return new Promise((resolve, reject) => {
      this.nextCheck = { code, language, resolve, reject };
    });
  }

  private checkNext() {
    this.checking = false;
    const next = this.nextCheck;
    this.nextCheck = null;
    if (next)
      this.check(next.code, next.language).then(next.resolve, next.reject);
  }

  compile(code: string, language: ClangLanguage): Promise<ClangResult> {
    // A compile reports the same diagnostics: a check waiting to start is redundant.
    this.nextCheck?.reject(new Error("Superseded by a compile."));
    this.nextCheck = null;
    return this.request({ type: "compile", code, language });
  }

  dispose() {
    this.stopWorker();
    this.rejectAll(new Error("The compiler was stopped."));
    this.listeners.clear();
  }

  private stopWorker() {
    this.worker?.removeEventListener("message", this.onMessage);
    this.worker?.removeEventListener("error", this.onError);
    this.worker?.terminate();
    this.worker = null;
  }

  private request(message: Request): Promise<ClangResult> {
    if (this._state.status === "error")
      return Promise.reject(new Error(this._state.message));
    this.start();
    const worker = this.worker;
    if (!worker)
      return Promise.reject(new Error("The compiler is unavailable."));
    const id = this.nextId++;
    return new Promise<ClangResult>((resolve, reject) => {
      this.pending.set(id, { message, resolve, reject });
      worker.postMessage({ ...message, id } as ClangRequest);
    });
  }

  private onMessage = (event: MessageEvent<ClangResponse>) => {
    const response = event.data;
    if (!response || typeof response !== "object") return;
    switch (response.type) {
      case "progress":
        if (this._state.status === "loading")
          this.setState({
            status: "loading",
            loaded: response.loaded,
            total: response.total,
          });
        return;
      case "ready":
        this.setState({ status: "ready", version: response.version });
        return;
      case "init-error":
        this.fail(`The C/C++ compiler failed to load: ${response.message}`);
        return;
    }
    const pending = this.pending.get(response.id);
    if (!pending) return;
    if (response.type === "started") {
      const { id } = response;
      pending.timer = setTimeout(() => this.timeout(id), this.timeoutMs);
      return;
    }
    clearTimeout(pending.timer);
    this.pending.delete(response.id);
    if (response.type === "result") pending.resolve(response.result);
    else pending.reject(new Error(response.message));
  };

  private onError = (event: ErrorEvent) => {
    this.fail(event.message || "The compiler worker crashed.");
  };

  private fail(message: string) {
    this.stopWorker();
    this.setState({ status: "error", message });
    this.rejectAll(new Error(message));
  }

  /**
   * Request `id` ran past the time limit, so the worker is stuck in it: fail
   * it, replace the worker and resend the requests queued behind it.
   */
  private timeout(id: number) {
    const stuck = this.pending.get(id);
    if (!stuck) return;
    this.pending.delete(id);
    this.stopWorker();
    stuck.reject(
      new Error(
        `The compiler took longer than ${Math.round(this.timeoutMs / 1000)} seconds and was stopped.`,
      ),
    );
    this.start();
    const worker = this.worker;
    if (!worker) {
      this.rejectAll(new Error("The compiler is unavailable."));
      return;
    }
    for (const [queuedId, queued] of this.pending) {
      worker.postMessage({ ...queued.message, id: queuedId } as ClangRequest);
    }
  }

  /** Forget a failure, so the next request starts the compiler again. */
  reset() {
    if (this._state.status === "error") this.setState({ status: "idle" });
  }

  private rejectAll(error: Error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
  }

  private setState(state: ClangState) {
    this._state = state;
    for (const listener of this.listeners) listener();
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
