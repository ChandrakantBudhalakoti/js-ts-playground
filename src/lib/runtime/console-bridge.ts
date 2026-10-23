import type {
  ConsoleEntry,
  ConsoleLevel,
  RuntimeErrorInfo,
  SerializedValue,
  SourceLocation,
} from "@/types/playground";
import type { PositionMapper } from "@/lib/compiler/source-map";
import { USER_FILE_TOKEN } from "./sandbox-document";

/** Upper bound on entries kept in the console; older entries are dropped first. */
export const MAX_CONSOLE_ENTRIES = 1_200;

export interface RunContext {
  runId: string;
  /** Display name of the user's file (`main.ts`, `main.py`…). */
  fileName: string;
  /** Maps executed-JS positions to source positions (TypeScript only). */
  mapper: PositionMapper | null;
  /** JavaScript errors read "Uncaught …"; other languages' errors do not. */
  javascript?: boolean;
}

const TOKEN_POSITION = new RegExp(
  `${USER_FILE_TOKEN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:(\\d+):(\\d+)`,
  "g",
);

export function mapLocation(
  location: SourceLocation,
  context: RunContext,
): SourceLocation {
  return context.mapper?.(location) ?? location;
}

/** Replace the sandbox's placeholder file references with source file positions. */
export function rewriteStack(stack: string, context: RunContext): string {
  return stack.replace(
    TOKEN_POSITION,
    (_match, line: string, column: string) => {
      const mapped = mapLocation(
        { line: Number(line), column: Number(column) },
        context,
      );
      return `${context.fileName}:${mapped.line}:${mapped.column}`;
    },
  );
}

export function createLogEntry(
  id: number,
  context: RunContext,
  level: ConsoleLevel,
  args: SerializedValue[],
  groupDepth: number,
  elapsedMs: number,
): ConsoleEntry {
  return {
    id,
    runId: context.runId,
    kind: "log",
    level,
    args: args.map((arg) =>
      arg.t === "error" && arg.stack
        ? { ...arg, stack: rewriteStack(arg.stack, context) }
        : arg,
    ),
    elapsedMs,
    groupDepth,
  };
}

export function createErrorEntry(
  id: number,
  context: RunContext,
  error: RuntimeErrorInfo,
  elapsedMs: number,
): ConsoleEntry {
  const location =
    error.line !== undefined && error.column !== undefined
      ? mapLocation({ line: error.line, column: error.column }, context)
      : undefined;
  const value: SerializedValue = {
    t: "error",
    name: error.name,
    message: error.message,
    stack: error.stack ? rewriteStack(error.stack, context) : undefined,
  };
  return {
    id,
    runId: context.runId,
    kind: "runtime-error",
    level: "error",
    args: [value],
    elapsedMs,
    groupDepth: 0,
    location,
    fileName: context.fileName,
    ...(context.javascript === false ? { uncaught: false } : {}),
  };
}

export function createSystemEntry(
  id: number,
  runId: string,
  level: ConsoleLevel,
  message: string,
  elapsedMs = 0,
  tone?: ConsoleEntry["tone"],
): ConsoleEntry {
  return {
    id,
    runId,
    kind: "system",
    level,
    args: [{ t: "string", v: message }],
    elapsedMs,
    groupDepth: 0,
    ...(tone ? { tone } : {}),
  };
}

/** Append entries while keeping at most `max`; returns how many were dropped. */
export function appendEntries(
  current: ConsoleEntry[],
  incoming: ConsoleEntry[],
  max = MAX_CONSOLE_ENTRIES,
): { entries: ConsoleEntry[]; dropped: number } {
  const combined = current.concat(incoming);
  if (combined.length <= max) return { entries: combined, dropped: 0 };
  const dropped = combined.length - max;
  return { entries: combined.slice(dropped), dropped };
}
