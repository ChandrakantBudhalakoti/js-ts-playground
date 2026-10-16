import type {
  ConsoleLevel,
  HostMessage,
  RuntimeErrorInfo,
  RuntimeMessage,
  SerializedValue,
} from "@/types/playground";
import type { SerializeLimits } from "./serialize";

/** Distinguishes playground messages from anything else posted to the window. */
export const RUNTIME_CHANNEL = "jsts-playground/runtime/v1";

export const RUNTIME_LIMITS = {
  /** Console messages (logs + errors) per run before the run is stopped. */
  maxMessages: 1000,
  /** Maximum size of one message, measured as JSON length. */
  maxMessageBytes: 128 * 1024,
  maxArgs: 50,
  maxCodeLength: 1_000_000,
  maxStackLength: 8_000,
  serialize: {
    maxDepth: 5,
    maxItems: 100,
    maxStringLength: 10_000,
    maxNodes: 1_500,
  } satisfies SerializeLimits,
} as const;

const CONSOLE_LEVELS: ReadonlySet<string> = new Set<ConsoleLevel>([
  "log",
  "info",
  "warn",
  "error",
  "debug",
]);

const MAX_VALUE_DEPTH = 32;
const RUN_ID = /^[A-Za-z0-9_-]{1,64}$/;

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown, max = Infinity): value is string {
  return typeof value === "string" && value.length <= max;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isRunId(value: unknown): value is string {
  return typeof value === "string" && RUN_ID.test(value);
}

/** Structural validation of a serialized console value (recursive, depth-limited). */
export function isSerializedValue(
  value: unknown,
  depth = 0,
): value is SerializedValue {
  if (depth > MAX_VALUE_DEPTH || !isObject(value)) return false;
  switch (value.t) {
    case "string":
      return (
        isString(value.v) &&
        (value.truncated === undefined || isFiniteNumber(value.truncated))
      );
    case "number":
    case "bigint":
    case "symbol":
    case "date":
    case "regexp":
    case "opaque":
      return isString(value.v);
    case "boolean":
      return typeof value.v === "boolean";
    case "undefined":
    case "null":
    case "circular":
    case "truncated":
      return true;
    case "function":
      return isString(value.name) && typeof value.isClass === "boolean";
    case "error":
      return (
        isString(value.name) &&
        isString(value.message) &&
        (value.stack === undefined || isString(value.stack))
      );
    case "array":
      return (
        (value.ctor === undefined || isString(value.ctor)) &&
        isFiniteNumber(value.length) &&
        Array.isArray(value.items) &&
        value.items.every((item) => isSerializedValue(item, depth + 1))
      );
    case "object":
      return (
        (value.ctor === undefined || isString(value.ctor)) &&
        isFiniteNumber(value.more) &&
        Array.isArray(value.entries) &&
        value.entries.every(
          (entry) =>
            Array.isArray(entry) &&
            entry.length === 2 &&
            isString(entry[0]) &&
            isSerializedValue(entry[1], depth + 1),
        )
      );
    case "map":
      return (
        isFiniteNumber(value.size) &&
        Array.isArray(value.entries) &&
        value.entries.every(
          (entry) =>
            Array.isArray(entry) &&
            entry.length === 2 &&
            isSerializedValue(entry[0], depth + 1) &&
            isSerializedValue(entry[1], depth + 1),
        )
      );
    case "set":
      return (
        isFiniteNumber(value.size) &&
        Array.isArray(value.items) &&
        value.items.every((item) => isSerializedValue(item, depth + 1))
      );
    default:
      return false;
  }
}

function parseErrorInfo(value: unknown): RuntimeErrorInfo | null {
  if (!isObject(value)) return null;
  const { name, message, stack, line, column } = value;
  if (
    !isString(name, 200) ||
    !isString(message, RUNTIME_LIMITS.serialize.maxStringLength)
  )
    return null;
  if (stack !== undefined && !isString(stack, RUNTIME_LIMITS.maxStackLength))
    return null;
  const info: RuntimeErrorInfo = { name, message };
  if (stack !== undefined) info.stack = stack;
  if (
    isFiniteNumber(line) &&
    isFiniteNumber(column) &&
    line >= 1 &&
    column >= 1
  ) {
    info.line = Math.floor(line);
    info.column = Math.floor(column);
  }
  return info;
}

function messageSize(data: unknown): number {
  try {
    return JSON.stringify(data)?.length ?? 0;
  } catch {
    return Infinity;
  }
}

/**
 * Validate a message received from the sandbox. Returns a fresh, well-typed
 * object (never the original reference) or `null` when anything is off.
 * Callers must separately check `event.source`, `event.origin` and run ID.
 */
export function parseRuntimeMessage(
  data: unknown,
  channel = RUNTIME_CHANNEL,
): RuntimeMessage | null {
  if (!isObject(data) || data.channel !== channel || !isString(data.type, 16))
    return null;
  if (messageSize(data) > RUNTIME_LIMITS.maxMessageBytes) return null;

  if (data.type === "READY") return { channel, type: "READY" };
  if (!isRunId(data.runId)) return null;
  const runId = data.runId;
  const elapsedMs =
    isFiniteNumber(data.elapsedMs) && data.elapsedMs >= 0 ? data.elapsedMs : 0;

  switch (data.type) {
    case "LOG": {
      const { level, args, groupDepth } = data;
      if (!isString(level) || !CONSOLE_LEVELS.has(level)) return null;
      if (!Array.isArray(args) || args.length > RUNTIME_LIMITS.maxArgs)
        return null;
      if (!args.every((arg) => isSerializedValue(arg))) return null;
      const depth = isFiniteNumber(groupDepth)
        ? Math.min(Math.max(Math.floor(groupDepth), 0), 10)
        : 0;
      return {
        channel,
        type: "LOG",
        runId,
        level: level as ConsoleLevel,
        args: args as SerializedValue[],
        groupDepth: depth,
        elapsedMs,
      };
    }
    case "ERROR": {
      const error = parseErrorInfo(data.error);
      return error ? { channel, type: "ERROR", runId, error, elapsedMs } : null;
    }
    case "DONE":
      return { channel, type: "DONE", runId, elapsedMs };
    case "LIMIT":
      return isString(data.reason, 500)
        ? { channel, type: "LIMIT", runId, reason: data.reason }
        : null;
    default:
      return null;
  }
}

type WithoutChannel<T> = T extends unknown ? Omit<T, "channel"> : never;

export function createHostMessage(
  message: WithoutChannel<HostMessage>,
): HostMessage {
  return { ...message, channel: RUNTIME_CHANNEL } as HostMessage;
}

export function createRunId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
