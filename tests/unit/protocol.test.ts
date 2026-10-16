import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createHostMessage,
  createRunId,
  isRunId,
  isSerializedValue,
  parseRuntimeMessage,
  RUNTIME_CHANNEL,
  RUNTIME_LIMITS,
} from "@/lib/runtime/protocol";
import {
  buildSandboxDocument,
  sandboxContentSecurityPolicy,
} from "@/lib/runtime/sandbox-document";

const runId = "abc123";
const base = { channel: RUNTIME_CHANNEL, runId };

describe("parseRuntimeMessage", () => {
  it("accepts well-formed messages and returns fresh objects", () => {
    const log = {
      ...base,
      type: "LOG",
      level: "warn",
      args: [{ t: "string", v: "hi" }],
      groupDepth: 1,
      elapsedMs: 3,
      extra: "ignored",
    };
    const parsed = parseRuntimeMessage(log);
    expect(parsed).toEqual({
      ...base,
      type: "LOG",
      level: "warn",
      args: log.args,
      groupDepth: 1,
      elapsedMs: 3,
    });
    expect(parsed).not.toBe(log);
    expect(
      parseRuntimeMessage({ channel: RUNTIME_CHANNEL, type: "READY" }),
    ).toEqual({
      channel: RUNTIME_CHANNEL,
      type: "READY",
    });
    expect(
      parseRuntimeMessage({ ...base, type: "DONE", elapsedMs: 10 }),
    ).toMatchObject({ type: "DONE" });
    expect(
      parseRuntimeMessage({
        ...base,
        type: "ERROR",
        error: { name: "Error", message: "x", line: 2, column: 3 },
      }),
    ).toMatchObject({
      type: "ERROR",
      error: { name: "Error", message: "x", line: 2, column: 3 },
    });
    expect(
      parseRuntimeMessage({ ...base, type: "LIMIT", reason: "too much" }),
    ).toMatchObject({ type: "LIMIT" });
  });

  it("rejects messages from other channels or with unknown types", () => {
    expect(parseRuntimeMessage(null)).toBeNull();
    expect(parseRuntimeMessage("READY")).toBeNull();
    expect(parseRuntimeMessage({ type: "READY" })).toBeNull();
    expect(parseRuntimeMessage({ channel: "other", type: "READY" })).toBeNull();
    expect(
      parseRuntimeMessage({ ...base, type: "EVAL", code: "alert(1)" }),
    ).toBeNull();
  });

  it("rejects malformed payloads", () => {
    expect(
      parseRuntimeMessage({ ...base, runId: "../../etc", type: "DONE" }),
    ).toBeNull();
    expect(
      parseRuntimeMessage({ ...base, type: "LOG", level: "fatal", args: [] }),
    ).toBeNull();
    expect(
      parseRuntimeMessage({ ...base, type: "LOG", level: "log", args: "x" }),
    ).toBeNull();
    expect(
      parseRuntimeMessage({
        ...base,
        type: "LOG",
        level: "log",
        args: [{ t: "html", v: "<b>" }],
      }),
    ).toBeNull();
    expect(
      parseRuntimeMessage({
        ...base,
        type: "LOG",
        level: "log",
        args: [{ t: "string", v: 1 }],
      }),
    ).toBeNull();
    expect(
      parseRuntimeMessage({
        ...base,
        type: "ERROR",
        error: { message: "no name" },
      }),
    ).toBeNull();
    expect(parseRuntimeMessage({ ...base, type: "LIMIT" })).toBeNull();
  });

  it("rejects oversized messages and too many arguments", () => {
    const huge = "x".repeat(RUNTIME_LIMITS.maxMessageBytes + 1);
    expect(
      parseRuntimeMessage({
        ...base,
        type: "LOG",
        level: "log",
        args: [{ t: "string", v: huge }],
      }),
    ).toBeNull();
    const many = Array.from({ length: RUNTIME_LIMITS.maxArgs + 1 }, () => ({
      t: "null",
    }));
    expect(
      parseRuntimeMessage({ ...base, type: "LOG", level: "log", args: many }),
    ).toBeNull();
  });

  it("drops invalid error positions and clamps group depth", () => {
    const error = parseRuntimeMessage({
      ...base,
      type: "ERROR",
      error: { name: "E", message: "m", line: -1, column: 2 },
    });
    expect(error?.type === "ERROR" && error.error.line).toBeUndefined();
    const log = parseRuntimeMessage({
      ...base,
      type: "LOG",
      level: "log",
      args: [],
      groupDepth: 999,
    });
    expect(log?.type === "LOG" && log.groupDepth).toBe(10);
  });
});

describe("isSerializedValue", () => {
  it("validates nested structures and limits depth", () => {
    expect(
      isSerializedValue({
        t: "object",
        entries: [["a", { t: "number", v: "1" }]],
        more: 0,
      }),
    ).toBe(true);
    expect(
      isSerializedValue({
        t: "object",
        entries: [["a", { t: "nope" }]],
        more: 0,
      }),
    ).toBe(false);
    let deep: unknown = { t: "null" };
    for (let i = 0; i < 40; i++)
      deep = { t: "array", items: [deep], length: 1 };
    expect(isSerializedValue(deep)).toBe(false);
  });
});

describe("run ids and host messages", () => {
  it("creates unique, valid run ids", () => {
    const ids = new Set(Array.from({ length: 50 }, createRunId));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(isRunId(id)).toBe(true);
  });

  it("tags host messages with the channel", () => {
    expect(createHostMessage({ type: "STOP", runId })).toEqual({
      type: "STOP",
      runId,
      channel: RUNTIME_CHANNEL,
    });
  });
});

describe("sandbox document", () => {
  const sha256 = (input: string) =>
    createHash("sha256").update(input).digest("base64");
  const doc = buildSandboxDocument(sha256);

  it("embeds a syntactically valid bootstrap script", () => {
    expect(() => new Function(doc.script)).not.toThrow();
    // Bundler-injected helpers would be undefined inside the sandbox.
    expect(doc.script).not.toMatch(
      /__vite_ssr|__TURBOPACK__|__webpack_require__|turbopack_context/,
    );
    expect(doc.html).toContain(`<script>${doc.script}</script>`);
    expect(doc.scriptHash).toBe(sha256(doc.script));
  });

  it("builds a restrictive CSP", () => {
    const csp = sandboxContentSecurityPolicy(doc.scriptHash, "'self'");
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain(`script-src 'sha256-${doc.scriptHash}' blob:`);
    expect(csp).toContain("connect-src 'none'");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("sandbox allow-scripts");
    expect(csp).not.toContain("allow-same-origin");
  });
});
