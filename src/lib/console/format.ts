import type { ConsoleEntry, SerializedValue } from "@/types/playground";

const MAX_LINE = 72;
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

function quote(value: string): string {
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")}'`;
}

function formatKey(key: string): string {
  return IDENTIFIER.test(key) ? key : quote(key);
}

function truncatedSuffix(count: number | undefined): string {
  return count ? `… (+${count} chars)` : "";
}

/** Wrap children inline when short, otherwise one per line. */
function wrap(
  open: string,
  close: string,
  parts: string[],
  indent: string,
): string {
  if (parts.length === 0) return `${open}${close}`;
  const inline = `${open} ${parts.join(", ")} ${close}`;
  if (inline.length <= MAX_LINE && !inline.includes("\n")) return inline;
  const inner = indent + "  ";
  return `${open}\n${parts.map((p) => inner + p).join(",\n")}\n${indent}${close}`;
}

/**
 * Render a serialized value roughly like Node's `util.inspect`.
 * Output is plain text; the console renders it as a text node.
 */
export function inspect(value: SerializedValue, indent = ""): string {
  switch (value.t) {
    case "string":
      return quote(value.v) + truncatedSuffix(value.truncated);
    case "number":
    case "symbol":
    case "date":
    case "regexp":
    case "opaque":
      return value.v;
    case "bigint":
      return `${value.v}n`;
    case "boolean":
      return String(value.v);
    case "undefined":
      return "undefined";
    case "null":
      return "null";
    case "circular":
      return "[Circular]";
    case "truncated":
      return "…";
    case "function":
      if (value.isClass) return `[class ${value.name || "(anonymous)"}]`;
      return value.name
        ? `[Function: ${value.name}]`
        : "[Function (anonymous)]";
    case "error":
      return value.message
        ? `[${value.name}: ${value.message}]`
        : `[${value.name}]`;
    case "array": {
      const inner = indent + "  ";
      const parts = value.items.map((item) => inspect(item, inner));
      const hidden = value.length - value.items.length;
      if (hidden > 0)
        parts.push(`... ${hidden} more item${hidden === 1 ? "" : "s"}`);
      const prefix = value.ctor ? `${value.ctor}(${value.length}) ` : "";
      return prefix + wrap("[", "]", parts, indent);
    }
    case "object": {
      const inner = indent + "  ";
      const parts = value.entries.map(
        ([key, entry]) => `${formatKey(key)}: ${inspect(entry, inner)}`,
      );
      if (value.more > 0)
        parts.push(
          `... ${value.more} more propert${value.more === 1 ? "y" : "ies"}`,
        );
      const prefix = value.ctor ? `${value.ctor} ` : "";
      return prefix + wrap("{", "}", parts, indent);
    }
    case "map": {
      const inner = indent + "  ";
      const parts = value.entries.map(
        ([k, v]) => `${inspect(k, inner)} => ${inspect(v, inner)}`,
      );
      const hidden = value.size - value.entries.length;
      if (hidden > 0)
        parts.push(`... ${hidden} more item${hidden === 1 ? "" : "s"}`);
      return `Map(${value.size}) ` + wrap("{", "}", parts, indent);
    }
    case "set": {
      const inner = indent + "  ";
      const parts = value.items.map((item) => inspect(item, inner));
      const hidden = value.size - value.items.length;
      if (hidden > 0)
        parts.push(`... ${hidden} more item${hidden === 1 ? "" : "s"}`);
      return `Set(${value.size}) ` + wrap("{", "}", parts, indent);
    }
  }
}

/** Top-level rendering: strings are printed raw, errors with their stack. */
export function formatTopLevel(value: SerializedValue): string {
  if (value.t === "string") return value.v + truncatedSuffix(value.truncated);
  if (value.t === "error") {
    if (value.stack) {
      // V8 stacks start with "Name: message"; Firefox stacks contain frames only.
      const header = `${value.name}: ${value.message}`;
      return value.stack.startsWith(value.name)
        ? value.stack
        : `${header}\n${value.stack}`;
    }
    return value.message ? `${value.name}: ${value.message}` : value.name;
  }
  return inspect(value);
}

function toNumber(value: SerializedValue): number {
  if (value.t === "number") return Number(value.v);
  if (value.t === "string") return Number.parseFloat(value.v);
  if (value.t === "boolean") return value.v ? 1 : 0;
  if (value.t === "bigint") return Number(value.v);
  return Number.NaN;
}

/**
 * Join console arguments into display text, applying printf-style
 * substitutions (`%s %d %i %f %o %O %c %%`) when the first argument is a string.
 */
export function formatConsoleArgs(args: SerializedValue[]): string {
  if (args.length === 0) return "";
  const [first, ...rest] = args;
  const remaining = [...rest];
  let head: string;

  if (first.t === "string" && first.v.includes("%") && remaining.length > 0) {
    head = first.v.replace(/%([sdifoOjc%])/g, (match, spec: string) => {
      if (spec === "%") return "%";
      if (remaining.length === 0) return match;
      const arg = remaining.shift()!;
      switch (spec) {
        case "s":
          return arg.t === "string" ? arg.v : inspect(arg);
        case "d":
        case "i": {
          const n = toNumber(arg);
          return Number.isNaN(n) ? "NaN" : String(Math.trunc(n));
        }
        case "f":
          return String(toNumber(arg));
        case "c":
          return ""; // CSS styling is ignored.
        default:
          return inspect(arg);
      }
    });
    head += truncatedSuffix(first.truncated);
  } else {
    head = formatTopLevel(first);
  }

  return [head, ...remaining.map(formatTopLevel)].join(" ");
}

/** Plain-text form of a console entry, for "Copy output". */
export function entryToText(entry: ConsoleEntry): string {
  const indent = "  ".repeat(entry.groupDepth);
  if (entry.kind === "runtime-error") {
    const error = entry.args[0];
    if (error?.t === "error") {
      const title = error.name
        ? `Uncaught ${error.name}: ${error.message}`
        : `Uncaught ${error.message}`;
      const frames = error.stack
        ?.split("\n")
        .filter((line) => line.trim() && !line.startsWith(`${error.name}:`))
        .join("\n");
      return frames ? `${title}\n${frames}` : title;
    }
  }
  const text =
    entry.kind === "system"
      ? formatTopLevel(entry.args[0])
      : formatConsoleArgs(entry.args);
  const prefix =
    entry.level === "log" || entry.kind === "system" ? "" : `[${entry.level}] `;
  return indent + prefix + text;
}
