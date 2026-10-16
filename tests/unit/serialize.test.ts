import { describe, expect, it } from "vitest";
import { inspect } from "@/lib/console/format";
import { RUNTIME_LIMITS } from "@/lib/runtime/protocol";
import { serializeValue, type SerializeLimits } from "@/lib/runtime/serialize";

const limits = RUNTIME_LIMITS.serialize;
const show = (value: unknown, l: SerializeLimits = limits) =>
  inspect(serializeValue(value, l));

describe("serializeValue", () => {
  it("serializes primitives", () => {
    expect(serializeValue("hi", limits)).toEqual({ t: "string", v: "hi" });
    expect(serializeValue(42, limits)).toEqual({ t: "number", v: "42" });
    expect(serializeValue(-0, limits)).toEqual({ t: "number", v: "-0" });
    expect(serializeValue(Number.NaN, limits)).toEqual({
      t: "number",
      v: "NaN",
    });
    expect(serializeValue(10n, limits)).toEqual({ t: "bigint", v: "10" });
    expect(serializeValue(true, limits)).toEqual({ t: "boolean", v: true });
    expect(serializeValue(null, limits)).toEqual({ t: "null" });
    expect(serializeValue(undefined, limits)).toEqual({ t: "undefined" });
    expect(serializeValue(Symbol("id"), limits)).toEqual({
      t: "symbol",
      v: "Symbol(id)",
    });
  });

  it("serializes arrays, objects and nested values", () => {
    expect(show([1, "a", { b: [true] }])).toBe("[ 1, 'a', { b: [ true ] } ]");
    expect(show({ name: "Alex", "needs-quotes": 1 })).toBe(
      "{ name: 'Alex', 'needs-quotes': 1 }",
    );
  });

  it("handles circular references without crashing", () => {
    const value: Record<string, unknown> = { name: "root" };
    value.self = value;
    value.list = [value];
    expect(show(value)).toBe(
      "{ name: 'root', self: [Circular], list: [ [Circular] ] }",
    );
  });

  it("prints shared (non-circular) references in full", () => {
    const shared = { x: 1 };
    expect(show({ a: shared, b: shared })).toBe("{ a: { x: 1 }, b: { x: 1 } }");
  });

  it("serializes special objects", () => {
    expect(show(new Map([["a", 1]]))).toBe("Map(1) { 'a' => 1 }");
    expect(show(new Set([1, 2]))).toBe("Set(2) { 1, 2 }");
    expect(show(new Date(0))).toBe("1970-01-01T00:00:00.000Z");
    expect(show(new Date(Number.NaN))).toBe("Invalid Date");
    expect(show(/re/gi)).toBe("/re/gi");
    expect(show(function named() {})).toBe("[Function: named]");
    expect(show(class Thing {})).toBe("[class Thing]");
    expect(show(new Uint8Array([1, 2]))).toBe("Uint8Array(2) [ 1, 2 ]");
    expect(show(Promise.resolve(1))).toBe("Promise {}");
    expect(show(Object.create(null))).toBe("[Object: null prototype] {}");
    class Point {
      constructor(public x: number) {}
    }
    expect(show(new Point(1))).toBe("Point { x: 1 }");
  });

  it("serializes errors with name, message and stack", () => {
    const value = serializeValue(new TypeError("bad"), limits);
    expect(value).toMatchObject({
      t: "error",
      name: "TypeError",
      message: "bad",
    });
    expect(value.t === "error" && value.stack).toContain("TypeError: bad");
  });

  it("does not invoke getters", () => {
    let called = false;
    const value = {
      get secret() {
        called = true;
        return 1;
      },
    };
    expect(show(value)).toBe("{ secret: [Getter] }");
    expect(called).toBe(false);
  });

  it("survives hostile values", () => {
    const revocable = Proxy.revocable({}, {});
    revocable.revoke();
    expect(show(revocable.proxy)).toBe("[Uninspectable]");
    const throwing = new Proxy(
      {},
      {
        ownKeys: () => {
          throw new Error("nope");
        },
      },
    );
    expect(show(throwing)).toBe("[Uninspectable]");
    const badName = Object.defineProperty(() => {}, "name", {
      get: () => {
        throw new Error("x");
      },
    });
    expect(() => serializeValue(badName, limits)).not.toThrow();
  });

  it("applies size limits", () => {
    const small: SerializeLimits = {
      maxDepth: 2,
      maxItems: 3,
      maxStringLength: 5,
      maxNodes: 50,
    };
    expect(serializeValue("abcdefgh", small)).toEqual({
      t: "string",
      v: "abcde",
      truncated: 3,
    });
    expect(show([1, 2, 3, 4, 5], small)).toBe("[ 1, 2, 3, ... 2 more items ]");
    expect(show({ a: { b: { c: 1 } } }, small)).toBe("{ a: { b: [Object] } }");
    const wide = Array.from({ length: 100 }, (_, i) => ({ i }));
    const result = serializeValue(wide, {
      ...small,
      maxItems: 100,
      maxNodes: 20,
    });
    expect(JSON.stringify(result).length).toBeLessThan(1_000);
    expect(inspect(result)).toMatch(/\.\.\. \d+ more items/);
  });

  it("is self-contained so it can be injected into the sandbox worker", () => {
    // Recreate the function from its source text alone, as the sandbox does.
    const revived = new Function(
      `return (${serializeValue.toString()});`,
    )() as typeof serializeValue;
    const value: Record<string, unknown> = { a: [1, new Map([[1, 2]])] };
    value.self = value;
    expect(revived(value, limits)).toEqual(serializeValue(value, limits));
  });
});
