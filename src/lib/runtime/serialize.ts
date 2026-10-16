import type { SerializedValue } from "@/types/playground";

export interface SerializeLimits {
  maxDepth: number;
  maxItems: number;
  maxStringLength: number;
  /** Upper bound on visited values, so wide/deep graphs stay cheap. */
  maxNodes: number;
}

/**
 * Convert any runtime value into a JSON-safe description for the console.
 * Never throws: getters are not invoked, and values that resist inspection
 * (revoked proxies, hostile `toString`s) degrade to an opaque placeholder.
 *
 * IMPORTANT: this function is injected into the sandbox worker with
 * `Function.prototype.toString`, so it must stay self-contained — no
 * references to imports or other module-level identifiers.
 */
export function serializeValue(
  input: unknown,
  limits: SerializeLimits,
): SerializedValue {
  let nodes = 0;
  const ancestors = new Set<object>();

  function text(fn: () => unknown, fallback: string): string {
    try {
      return String(fn());
    } catch {
      return fallback;
    }
  }

  function str(value: string): SerializedValue {
    if (value.length > limits.maxStringLength) {
      return {
        t: "string",
        v: value.slice(0, limits.maxStringLength),
        truncated: value.length - limits.maxStringLength,
      };
    }
    return { t: "string", v: value };
  }

  function constructorName(obj: object): string | undefined {
    const proto = Object.getPrototypeOf(obj);
    if (proto === null) return "[Object: null prototype]";
    const ctor = (proto as { constructor?: unknown }).constructor;
    if (typeof ctor !== "function") return undefined;
    const name = (ctor as { name?: unknown }).name;
    return typeof name === "string" && name ? name : undefined;
  }

  function property(obj: object, key: string): SerializedValue {
    const descriptor = Object.getOwnPropertyDescriptor(obj, key);
    if (!descriptor) return { t: "undefined" };
    if (descriptor.get || descriptor.set) {
      const kind =
        descriptor.get && descriptor.set
          ? "Getter/Setter"
          : descriptor.get
            ? "Getter"
            : "Setter";
      return { t: "opaque", v: `[${kind}]` };
    }
    return walk(descriptor.value);
  }

  let depth = 0;

  function walk(value: unknown): SerializedValue {
    nodes += 1;
    if (nodes > limits.maxNodes) return { t: "truncated" };

    switch (typeof value) {
      case "string":
        return str(value);
      case "number":
        return { t: "number", v: Object.is(value, -0) ? "-0" : String(value) };
      case "bigint":
        return { t: "bigint", v: value.toString() };
      case "boolean":
        return { t: "boolean", v: value };
      case "undefined":
        return { t: "undefined" };
      case "symbol":
        return { t: "symbol", v: text(() => value.toString(), "Symbol()") };
      case "function": {
        const source = text(() => Function.prototype.toString.call(value), "");
        return {
          t: "function",
          name: text(() => (value as { name?: unknown }).name ?? "", ""),
          isClass: /^class[\s{]/.test(source),
        };
      }
    }

    if (value === null) return { t: "null" };
    const obj = value as object;
    if (ancestors.has(obj)) return { t: "circular" };

    try {
      if (obj instanceof Error) {
        const stack = text(() => (obj as Error).stack ?? "", "");
        return {
          t: "error",
          name: text(() => (obj as Error).name, "Error"),
          message: text(() => (obj as Error).message, ""),
          stack: stack ? stack.slice(0, limits.maxStringLength) : undefined,
        };
      }
      if (obj instanceof Date) {
        const time = obj.getTime();
        return {
          t: "date",
          v: Number.isNaN(time) ? "Invalid Date" : obj.toISOString(),
        };
      }
      if (obj instanceof RegExp)
        return { t: "regexp", v: text(() => obj.toString(), "/(?:)/") };
      if (obj instanceof Promise) return { t: "opaque", v: "Promise {}" };
      if (obj instanceof WeakMap)
        return { t: "opaque", v: "WeakMap { <items unknown> }" };
      if (obj instanceof WeakSet)
        return { t: "opaque", v: "WeakSet { <items unknown> }" };
      if (obj instanceof ArrayBuffer)
        return {
          t: "opaque",
          v: `ArrayBuffer { byteLength: ${obj.byteLength} }`,
        };

      const ctor = constructorName(obj);
      if (depth >= limits.maxDepth) {
        if (Array.isArray(obj)) return { t: "opaque", v: "[Array]" };
        return {
          t: "opaque",
          v: `[${ctor && ctor !== "[Object: null prototype]" ? ctor : "Object"}]`,
        };
      }

      ancestors.add(obj);
      depth += 1;
      try {
        if (
          Array.isArray(obj) ||
          (ArrayBuffer.isView(obj) && !(obj instanceof DataView))
        ) {
          const list = obj as ArrayLike<unknown>;
          const length = list.length;
          const items: SerializedValue[] = [];
          for (let i = 0; i < Math.min(length, limits.maxItems); i++) {
            if (nodes >= limits.maxNodes) break;
            items.push(
              i in list ? walk(list[i]) : { t: "opaque", v: "<empty>" },
            );
          }
          return {
            t: "array",
            ctor: ctor === "Array" ? undefined : ctor,
            items,
            length,
          };
        }
        if (obj instanceof Map) {
          const entries: [SerializedValue, SerializedValue][] = [];
          for (const [key, entry] of obj) {
            if (entries.length >= limits.maxItems || nodes >= limits.maxNodes)
              break;
            entries.push([walk(key), walk(entry)]);
          }
          return { t: "map", entries, size: obj.size };
        }
        if (obj instanceof Set) {
          const items: SerializedValue[] = [];
          for (const item of obj) {
            if (items.length >= limits.maxItems || nodes >= limits.maxNodes)
              break;
            items.push(walk(item));
          }
          return { t: "set", items, size: obj.size };
        }

        const keys = Object.keys(obj);
        const entries: [string, SerializedValue][] = [];
        for (const key of keys.slice(0, limits.maxItems)) {
          if (nodes >= limits.maxNodes) break;
          entries.push([key, property(obj, key)]);
        }
        return {
          t: "object",
          ctor: ctor === "Object" ? undefined : ctor,
          entries,
          more: Math.max(0, keys.length - entries.length),
        };
      } finally {
        depth -= 1;
        ancestors.delete(obj);
      }
    } catch {
      return { t: "opaque", v: "[Uninspectable]" };
    }
  }

  return walk(input);
}
