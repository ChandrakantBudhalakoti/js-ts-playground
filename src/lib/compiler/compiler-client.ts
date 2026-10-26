import type { Diagnostic, ScriptLanguage } from "@/types/playground";
import type { CompilerRequest, CompilerResponse } from "./protocol";
import type { CompileResult } from "./typescript";

export type CompilerState =
  | { status: "loading" }
  | { status: "ready"; version: string }
  | { status: "error"; message: string };

/**
 * How long one check or compile may run once the worker has started it.
 * Types can be written to keep the checker busy almost forever, and code
 * from a share link is checked as soon as it opens.
 */
export const COMPILER_TIMEOUT_MS = 20_000;

type Request = DistributiveOmit<CompilerRequest, "id">;

type Pending = {
  message: Request;
  resolve: (value: CompilerResponse) => void;
  reject: (error: Error) => void;
  /** The time limit, set once the worker has started the request. */
  timer?: ReturnType<typeof setTimeout>;
};

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/**
 * Main-thread client for the compiler worker. TypeScript runs off the main
 * thread so type checking never blocks typing. A request that runs past the
 * time limit fails, and the stuck worker is replaced by a new one.
 */
export class CompilerClient {
  private worker: Worker | null = null;
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private listeners = new Set<(state: CompilerState) => void>();
  private _state: CompilerState = { status: "loading" };

  constructor(private readonly timeoutMs = COMPILER_TIMEOUT_MS) {}

  get state(): CompilerState {
    return this._state;
  }

  start() {
    if (this.worker) return;
    try {
      this.worker = new Worker(
        new URL("./compiler.worker.ts", import.meta.url),
        {
          name: "typescript-compiler",
        },
      );
    } catch (error) {
      this.setState({ status: "error", message: errorMessage(error) });
      return;
    }
    this.worker.addEventListener("message", this.onMessage);
    this.worker.addEventListener("error", this.onError);
  }

  subscribe(listener: (state: CompilerState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async check(code: string, language: ScriptLanguage): Promise<Diagnostic[]> {
    const response = await this.request({ type: "check", code, language });
    if (response.type !== "check")
      throw new Error("Unexpected compiler response.");
    return response.diagnostics;
  }

  async compile(
    code: string,
    language: ScriptLanguage,
  ): Promise<CompileResult> {
    const response = await this.request({ type: "compile", code, language });
    if (response.type !== "compile")
      throw new Error("Unexpected compiler response.");
    return response.result;
  }

  dispose() {
    this.stopWorker();
    this.rejectAll(new Error("Compiler disposed."));
    this.listeners.clear();
  }

  /**
   * Forget a failure (such as a download that failed while the server was
   * overloaded), so the next request starts a new compiler worker.
   */
  reset() {
    if (this._state.status !== "error") return;
    this.stopWorker();
    this.setState({ status: "loading" });
  }

  private stopWorker() {
    this.worker?.removeEventListener("message", this.onMessage);
    this.worker?.removeEventListener("error", this.onError);
    this.worker?.terminate();
    this.worker = null;
  }

  private request(message: Request): Promise<CompilerResponse> {
    if (this._state.status === "error") {
      return Promise.reject(new Error(this._state.message));
    }
    this.start();
    const worker = this.worker;
    if (!worker) return Promise.reject(new Error("Compiler is unavailable."));
    const id = this.nextId++;
    return new Promise<CompilerResponse>((resolve, reject) => {
      this.pending.set(id, { message, resolve, reject });
      worker.postMessage({ ...message, id } as CompilerRequest);
    }).then((response) => {
      if (response.type === "error") throw new Error(response.message);
      return response;
    });
  }

  private onMessage = (event: MessageEvent<CompilerResponse>) => {
    const response = event.data;
    if (!response || typeof response !== "object") return;
    if (response.type === "ready") {
      this.setState({ status: "ready", version: response.version });
      return;
    }
    if (response.type === "init-error") {
      this.setState({
        status: "error",
        message: `TypeScript failed to load: ${response.message}`,
      });
      this.rejectAll(new Error(response.message));
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
    pending.resolve(response);
  };

  private onError = (event: ErrorEvent) => {
    const message = event.message || "The compiler worker crashed.";
    this.setState({ status: "error", message });
    this.rejectAll(new Error(message));
  };

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
      this.rejectAll(new Error("Compiler is unavailable."));
      return;
    }
    for (const [queuedId, queued] of this.pending) {
      worker.postMessage({
        ...queued.message,
        id: queuedId,
      } as CompilerRequest);
    }
  }

  private rejectAll(error: Error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
  }

  private setState(state: CompilerState) {
    this._state = state;
    for (const listener of this.listeners) listener(state);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
