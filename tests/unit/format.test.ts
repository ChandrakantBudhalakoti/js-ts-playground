import { describe, expect, it } from "vitest";
import {
  formatConsoleArgs,
  formatTopLevel,
  inspect,
} from "@/lib/console/format";
import {
  appendEntries,
  createErrorEntry,
  createLogEntry,
  createSystemEntry,
  rewriteStack,
} from "@/lib/runtime/console-bridge";
import type { SerializedValue } from "@/types/playground";

const s = (v: string): SerializedValue => ({ t: "string", v });
const n = (v: number): SerializedValue => ({ t: "number", v: String(v) });

describe("console formatting", () => {
  it("prints top-level strings raw and nested strings quoted", () => {
    expect(formatConsoleArgs([s("Hello World")])).toBe("Hello World");
    expect(
      formatConsoleArgs([s("a"), { t: "array", items: [s("b")], length: 1 }]),
    ).toBe("a [ 'b' ]");
  });

  it("applies printf-style substitutions", () => {
    expect(
      formatConsoleArgs([
        s("%s has %d items (%i%%)"),
        s("list"),
        n(3.7),
        n(50),
      ]),
    ).toBe("list has 3 items (50%)");
    expect(formatConsoleArgs([s("%c styled"), s("color: red")])).toBe(
      " styled",
    );
    expect(
      formatConsoleArgs([
        s("%o"),
        { t: "object", entries: [["a", n(1)]], more: 0 },
      ]),
    ).toBe("{ a: 1 }");
    expect(formatConsoleArgs([s("no args %s")])).toBe("no args %s");
    expect(formatConsoleArgs([s("extra"), n(1), n(2)])).toBe("extra 1 2");
  });

  it("breaks long objects across lines", () => {
    const entries: [string, SerializedValue][] = Array.from(
      { length: 8 },
      (_, i) => [`key${i}`, s("value value")],
    );
    const text = inspect({ t: "object", entries, more: 0 });
    expect(text.split("\n")).toHaveLength(10);
    expect(text).toContain("\n  key0: 'value value',");
  });

  it("renders values that look like HTML as plain text", () => {
    expect(formatConsoleArgs([s("<img src=x onerror=alert(1)>")])).toBe(
      "<img src=x onerror=alert(1)>",
    );
  });

  it("renders errors with their stack at the top level", () => {
    expect(
      formatTopLevel({
        t: "error",
        name: "Error",
        message: "boom",
        stack: "Error: boom\n    at main.ts:1:7",
      }),
    ).toBe("Error: boom\n    at main.ts:1:7");
    expect(
      formatTopLevel({
        t: "error",
        name: "Error",
        message: "boom",
        stack: "@main.js:1:7",
      }),
    ).toBe("Error: boom\n@main.js:1:7");
    expect(formatTopLevel({ t: "string", v: "abc", truncated: 10 })).toBe(
      "abc… (+10 chars)",
    );
  });
});

describe("console bridge", () => {
  const context = {
    runId: "r1",
    fileName: "main.ts",
    mapper: ({ line, column }: { line: number; column: number }) => ({
      line: line + 10,
      column,
    }),
  };

  it("maps error locations and stack frames to the source file", () => {
    const entry = createErrorEntry(
      1,
      context,
      {
        name: "Error",
        message: "x",
        stack: "Error: x\n    at fail (playground:main:2:9)",
        line: 2,
        column: 9,
      },
      5,
    );
    expect(entry.location).toEqual({ line: 12, column: 9 });
    // The entry remembers which file its location refers to.
    expect(entry.fileName).toBe("main.ts");
    expect(entry.args[0]).toMatchObject({
      stack: "Error: x\n    at fail (main.ts:12:9)",
    });
    expect(
      rewriteStack("@playground:main:1:1", { ...context, mapper: null }),
    ).toBe("@main.ts:1:1");
  });

  it("rewrites stacks of errors that are logged", () => {
    const entry = createLogEntry(
      2,
      context,
      "log",
      [
        {
          t: "error",
          name: "E",
          message: "m",
          stack: "at playground:main:1:2",
        },
      ],
      0,
      0,
    );
    expect(entry.args[0]).toMatchObject({ stack: "at main.ts:11:2" });
  });

  it("caps the number of entries, dropping the oldest", () => {
    const entries = Array.from({ length: 5 }, (_, i) =>
      createSystemEntry(i, "r", "log", `m${i}`),
    );
    const { entries: kept, dropped } = appendEntries(
      entries.slice(0, 3),
      entries.slice(3),
      4,
    );
    expect(dropped).toBe(1);
    expect(kept.map((e) => e.id)).toEqual([1, 2, 3, 4]);
  });
});
