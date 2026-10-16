import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  countBySeverity,
  hasBlockingErrors,
  mergeDiagnostics,
  normalizeDiagnostic,
} from "@/lib/compiler/diagnostics";
import type { Diagnostic } from "@/types/playground";

function makeDiagnostic(overrides: Partial<Diagnostic> = {}): Diagnostic {
  return {
    fileName: "main.ts",
    message: "Something is wrong.",
    severity: "error",
    code: 2322,
    source: "semantic",
    startLine: 1,
    startColumn: 1,
    endLine: 1,
    endColumn: 5,
    ...overrides,
  };
}

describe("normalizeDiagnostic", () => {
  const file = ts.createSourceFile(
    "/main.ts",
    "let a = 1;\nlet b = 2;\n",
    ts.ScriptTarget.ES2022,
  );

  it("converts zero-based offsets to one-based line/column", () => {
    const start = file.text.indexOf("b");
    const diagnostic = normalizeDiagnostic(
      ts,
      {
        file,
        start,
        length: 1,
        category: ts.DiagnosticCategory.Error,
        code: 1,
        messageText: "msg",
      },
      "syntax",
    );
    expect(diagnostic).toEqual({
      fileName: "main.ts",
      message: "msg",
      severity: "error",
      code: 1,
      source: "syntax",
      startLine: 2,
      startColumn: 5,
      endLine: 2,
      endColumn: 6,
    });
  });

  it("handles diagnostics without a source location", () => {
    const diagnostic = normalizeDiagnostic(
      ts,
      {
        file: undefined,
        start: undefined,
        length: undefined,
        category: ts.DiagnosticCategory.Warning,
        code: 5,
        messageText: "global",
      },
      "options",
    );
    expect(diagnostic).toMatchObject({
      fileName: null,
      severity: "warning",
      startLine: 1,
      startColumn: 1,
    });
  });

  it("flattens message chains", () => {
    const diagnostic = normalizeDiagnostic(
      ts,
      {
        file,
        start: 0,
        length: 3,
        category: ts.DiagnosticCategory.Error,
        code: 2322,
        messageText: {
          messageText: "Outer",
          category: ts.DiagnosticCategory.Error,
          code: 2322,
          next: [
            {
              messageText: "Inner",
              category: ts.DiagnosticCategory.Error,
              code: 2326,
            },
          ],
        },
      },
      "semantic",
    );
    expect(diagnostic?.message).toBe("Outer\n  Inner");
  });

  it("drops suggestion diagnostics and clamps out-of-range offsets", () => {
    expect(
      normalizeDiagnostic(
        ts,
        {
          file,
          start: 0,
          length: 1,
          category: ts.DiagnosticCategory.Suggestion,
          code: 6133,
          messageText: "unused",
        },
        "semantic",
      ),
    ).toBeNull();
    const clamped = normalizeDiagnostic(
      ts,
      {
        file,
        start: 10_000,
        length: 5,
        category: ts.DiagnosticCategory.Error,
        code: 1,
        messageText: "eof",
      },
      "syntax",
    );
    expect(clamped).toMatchObject({
      startLine: 3,
      startColumn: 1,
      endLine: 3,
      endColumn: 1,
    });
  });
});

describe("mergeDiagnostics", () => {
  it("removes exact duplicates, preferring the syntax classification", () => {
    const semantic = makeDiagnostic({ source: "semantic" });
    const syntax = makeDiagnostic({ source: "syntax" });
    const merged = mergeDiagnostics(
      [semantic],
      [syntax],
      [makeDiagnostic({ source: "semantic" })],
    );
    expect(merged).toEqual([syntax]);
  });

  it("keeps distinct diagnostics and sorts by position", () => {
    const later = makeDiagnostic({ startLine: 3, code: 1 });
    const earlier = makeDiagnostic({ startLine: 1, startColumn: 4, code: 2 });
    const global = makeDiagnostic({ fileName: null, code: 3 });
    expect(mergeDiagnostics([later, earlier], [global])).toEqual([
      global,
      earlier,
      later,
    ]);
  });
});

describe("blocking rules", () => {
  it("blocks on syntax errors only", () => {
    expect(hasBlockingErrors([makeDiagnostic({ source: "semantic" })])).toBe(
      false,
    );
    expect(hasBlockingErrors([makeDiagnostic({ source: "syntax" })])).toBe(
      true,
    );
    expect(
      hasBlockingErrors([
        makeDiagnostic({ source: "syntax", severity: "warning" }),
      ]),
    ).toBe(false);
  });

  it("counts by severity", () => {
    expect(
      countBySeverity([
        makeDiagnostic(),
        makeDiagnostic({ severity: "warning" }),
        makeDiagnostic({ severity: "info" }),
        makeDiagnostic(),
      ]),
    ).toEqual({ errors: 2, warnings: 1, infos: 1 });
  });
});
