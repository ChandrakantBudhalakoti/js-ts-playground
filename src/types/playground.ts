export type Language = "javascript" | "typescript";

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
  /** File the location refers to (`main.ts` / `main.js`), fixed at run time. */
  fileName?: string;
  /** Visual tone for system entries. */
  tone?: "success";
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
  | { channel: string; type: "DONE"; runId: string; elapsedMs: number }
  | { channel: string; type: "LIMIT"; runId: string; reason: string };

/** Messages the app sends to the sandbox. */
export type HostMessage =
  | { channel: string; type: "RUN"; runId: string; code: string }
  | { channel: string; type: "STOP"; runId: string };

export interface EditorSettings {
  fontSize: number;
  tabSize: 2 | 4;
  minimap: boolean;
  wordWrap: boolean;
  timeoutMs: number;
  blockRunOnTypeErrors: boolean;
  clearConsoleOnRun: boolean;
}

export interface CodeExample {
  id: string;
  title: string;
  description: string;
  language: Language;
  code: string;
}
