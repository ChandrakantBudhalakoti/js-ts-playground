export type Language =
  | "javascript"
  | "typescript"
  | "python"
  | "c"
  | "cpp"
  | "go"
  | "ruby"
  | "php"
  | "lua"
  | "r";

/** The languages the TypeScript compiler, Monaco's language service and Prettier handle. */
export type ScriptLanguage = "javascript" | "typescript";

/**
 * What executes a language in the sandbox. `js` runs JavaScript directly;
 * every other runtime is a WebAssembly interpreter (or, for `wasi`, a
 * program compiled by Clang) loaded into the sandbox's worker.
 */
export type RuntimeId =
  "js" | "python" | "lua" | "ruby" | "php" | "go" | "r" | "wasi";

/** Runtimes that are booted from downloaded files before they can run code. */
export type WasmRuntimeId = Exclude<RuntimeId, "js">;

export type ConsoleLevel = "log" | "info" | "warn" | "error" | "debug";

export type ExecutionStatus =
  "idle" | "running" | "completed" | "failed" | "timed-out" | "stopped";

export type DiagnosticSeverity = "error" | "warning" | "info";

/** Where a diagnostic came from. Syntax errors block execution; semantic ones are advisory by default. */
export type DiagnosticSource = "syntax" | "semantic" | "options";

/**
 * A compiler diagnostic normalized for Monaco and the Problems panel.
 * Positions are one-based (Monaco convention). Diagnostics without a source
 * location have `fileName: null` and positions of 1.
 */
export interface Diagnostic {
  fileName: string | null;
  message: string;
  severity: DiagnosticSeverity;
  code: number;
  source: DiagnosticSource;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  /** Set for C/C++ diagnostics, which come from Clang (`code` is then 0). */
  tool?: "clang";
}

/** A console argument serialized inside the sandbox. Rendered as text only, never as HTML. */
export type SerializedValue =
  | { t: "string"; v: string; truncated?: number }
  | { t: "number"; v: string }
  | { t: "bigint"; v: string }
  | { t: "boolean"; v: boolean }
  | { t: "undefined" }
  | { t: "null" }
  | { t: "symbol"; v: string }
  | { t: "function"; name: string; isClass: boolean }
  | { t: "date"; v: string }
  | { t: "regexp"; v: string }
  | { t: "error"; name: string; message: string; stack?: string }
  | { t: "array"; ctor?: string; items: SerializedValue[]; length: number }
  | {
      t: "object";
      ctor?: string;
      entries: [string, SerializedValue][];
      more: number;
    }
  | { t: "map"; entries: [SerializedValue, SerializedValue][]; size: number }
  | { t: "set"; items: SerializedValue[]; size: number }
  | { t: "circular" }
  | { t: "truncated" }
  | { t: "opaque"; v: string };

export interface SourceLocation {
  line: number;
  column: number;
}

export type ConsoleEntryKind = "log" | "runtime-error" | "system";

export interface ConsoleEntry {
  /** Monotonic sequence number; also the React key. */
  id: number;
  runId: string;
  kind: ConsoleEntryKind;
  level: ConsoleLevel;
  args: SerializedValue[];
  /** Milliseconds since the run started. */
  elapsedMs: number;
  groupDepth: number;
  /** Source location in the user's code, when known (runtime errors). */
  location?: SourceLocation;
  /** File the location refers to (`main.ts`, `main.py`…), fixed at run time. */
  fileName?: string;
  /**
   * Runtime errors from JavaScript read "Uncaught …". `false` for other
   * languages, whose errors are shown the way they report them.
   */
  uncaught?: false;
  /** Visual tone for system entries. */
  tone?: "success";
  /**
   * For a system entry, the text a friendly explanation is matched against
   * (src/lib/friendly-errors), which stays English when the entry is shown
   * in another language.
   */
  explain?: string;
}

export interface RuntimeErrorInfo {
  name: string;
  message: string;
  stack?: string;
  /** Location in the executed JavaScript (one-based), when the stack contained one. */
  line?: number;
  column?: number;
}

/** Messages the sandbox sends to the app. Every one is validated before use. */
export type RuntimeMessage =
  | { channel: string; type: "READY" }
  /** A WebAssembly runtime finished booting and waits for code. */
  | { channel: string; type: "BOOTED"; runId: string; elapsedMs: number }
  | {
      channel: string;
      type: "LOG";
      runId: string;
      level: ConsoleLevel;
      args: SerializedValue[];
      groupDepth: number;
      elapsedMs: number;
    }
  | {
      channel: string;
      type: "ERROR";
      runId: string;
      error: RuntimeErrorInfo;
      elapsedMs: number;
    }
  | {
      channel: string;
      type: "DONE";
      runId: string;
      elapsedMs: number;
      /** Exit status of programs that have one (non-JavaScript runtimes). */
      exitCode?: number;
      /** The program read standard input, but none was given. */
      inputMissing?: true;
    }
  | { channel: string; type: "LIMIT"; runId: string; reason: string };

/** Messages the app sends to the sandbox. */
export type HostMessage =
  /** Start a WebAssembly runtime from its files, ahead of the code. */
  | {
      channel: string;
      type: "BOOT";
      runId: string;
      runtime: WasmRuntimeId;
      assets: Record<string, ArrayBuffer>;
    }
  | {
      channel: string;
      type: "RUN";
      runId: string;
      code: string;
      /** Standard input for programs that read it. */
      stdin?: string;
      /** A compiled program (`wasi` runtime). */
      binary?: ArrayBuffer;
    }
  | { channel: string; type: "STOP"; runId: string };

export interface EditorSettings {
  fontSize: number;
  tabSize: 2 | 4;
  minimap: boolean;
  wordWrap: boolean;
  timeoutMs: number;
  blockRunOnTypeErrors: boolean;
  clearConsoleOnRun: boolean;
  /** Ask before a language's first download (its size, on mobile data). */
  askBeforeDownload: boolean;
}

export interface CodeExample {
  id: string;
  title: string;
  description: string;
  language: Language;
  code: string;
  /** Standard input the example expects (put in the Input panel). */
  stdin?: string;
  /** How hard it is, for filtering (see `exampleLevel`). */
  level?: Level;
}

/** How hard an example is. */
export type Level = "beginner" | "intermediate" | "advanced";
