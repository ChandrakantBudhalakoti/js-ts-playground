import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DiagnosticsScheduler } from "@/lib/compiler/diagnostics-scheduler";
import type { Diagnostic } from "@/types/playground";

const diagnostic = (message: string): Diagnostic => ({
  fileName: "main.ts",
  message,
  severity: "error",
  code: 2322,
  source: "semantic",
  startLine: 1,
  startColumn: 1,
  endLine: 1,
  endColumn: 2,
});

function setup() {
  const results: Diagnostic[][] = [];
  const pending: { code: string; resolve: (d: Diagnostic[]) => void }[] = [];
  const scheduler = new DiagnosticsScheduler({
    delayMs: 100,
    check: (code) => new Promise((resolve) => pending.push({ code, resolve })),
    onResult: (d) => results.push(d),
  });
  return { scheduler, results, pending };
}

describe("DiagnosticsScheduler", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("debounces checks", async () => {
    const { scheduler, pending } = setup();
    scheduler.schedule("a", "typescript");
    scheduler.schedule("ab", "typescript");
    await vi.advanceTimersByTimeAsync(100);
    expect(pending.map((p) => p.code)).toEqual(["ab"]);
  });

  it("drops results of superseded checks", async () => {
    const { scheduler, results, pending } = setup();
    scheduler.schedule("old", "typescript", 0);
    await vi.advanceTimersByTimeAsync(0);
    scheduler.schedule("new", "typescript", 0);
    await vi.advanceTimersByTimeAsync(0);
    pending[1].resolve([diagnostic("new")]);
    pending[0].resolve([diagnostic("old")]);
    await vi.runAllTimersAsync();
    expect(results).toEqual([[diagnostic("new")]]);
  });

  it("applies Run diagnostics for the latest code and cancels the redundant check", async () => {
    const { scheduler, results, pending } = setup();
    scheduler.schedule("code", "typescript");
    expect(scheduler.applyFor("code", "typescript", [diagnostic("run")])).toBe(
      true,
    );
    await vi.advanceTimersByTimeAsync(100);
    expect(pending).toHaveLength(0);
    expect(results).toEqual([[diagnostic("run")]]);
  });

  it("ignores Run diagnostics when the user edited during compilation", async () => {
    const { scheduler, results, pending } = setup();
    scheduler.schedule("v1", "typescript");
    // Run compiles v1; meanwhile the user types and v2 is scheduled.
    scheduler.schedule("v2", "typescript");
    expect(scheduler.applyFor("v1", "typescript", [diagnostic("stale")])).toBe(
      false,
    );
    await vi.advanceTimersByTimeAsync(100);
    expect(pending.map((p) => p.code)).toEqual(["v2"]);
    pending[0].resolve([diagnostic("fresh")]);
    await vi.runAllTimersAsync();
    expect(results).toEqual([[diagnostic("fresh")]]);
  });

  it("ignores Run diagnostics for another language", () => {
    const { scheduler } = setup();
    scheduler.schedule("x", "javascript");
    expect(scheduler.applyFor("x", "typescript", [])).toBe(false);
  });

  it("reports an empty list when the checker fails", async () => {
    const results: Diagnostic[][] = [];
    const scheduler = new DiagnosticsScheduler({
      delayMs: 0,
      check: () => Promise.reject(new Error("offline")),
      onResult: (d) => results.push(d),
    });
    scheduler.schedule("x", "typescript");
    await vi.runAllTimersAsync();
    expect(results).toEqual([[]]);
  });

  it("clear() empties diagnostics and drops in-flight results", async () => {
    const { scheduler, results, pending } = setup();
    scheduler.schedule("a", "typescript", 0);
    await vi.advanceTimersByTimeAsync(0);
    scheduler.clear();
    pending[0].resolve([diagnostic("late")]);
    await vi.runAllTimersAsync();
    expect(results).toEqual([[]]);
  });
});
