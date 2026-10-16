import type * as TS from "typescript";
import type {
  Diagnostic,
  DiagnosticSeverity,
  DiagnosticSource,
} from "@/types/playground";

type TypeScriptModule = typeof TS;

export function toSeverity(
  ts: TypeScriptModule,
  category: TS.DiagnosticCategory,
): DiagnosticSeverity | null {
  switch (category) {
    case ts.DiagnosticCategory.Error:
      return "error";
    case ts.DiagnosticCategory.Warning:
      return "warning";
    case ts.DiagnosticCategory.Message:
      return "info";
    default:
      // Suggestions are editor hints, not problems.
      return null;
  }
}

/**
 * Convert a TypeScript diagnostic (zero-based offsets) into the app's
 * one-based, line/column form. Diagnostics without a file get `fileName: null`.
 */
export function normalizeDiagnostic(
  ts: TypeScriptModule,
  diagnostic: TS.Diagnostic,
  source: DiagnosticSource,
): Diagnostic | null {
  const severity = toSeverity(ts, diagnostic.category);
  if (!severity) return null;

  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
  const { file, start } = diagnostic;

  if (!file || start === undefined) {
    return {
      fileName: null,
      message,
      severity,
      code: diagnostic.code,
      source,
      startLine: 1,
      startColumn: 1,
      endLine: 1,
      endColumn: 1,
    };
  }

  const textLength = file.text.length;
  const startOffset = Math.min(Math.max(start, 0), textLength);
  const endOffset = Math.min(
    startOffset + Math.max(diagnostic.length ?? 0, 0),
    textLength,
  );
  const startPos = file.getLineAndCharacterOfPosition(startOffset);
  const endPos = file.getLineAndCharacterOfPosition(endOffset);

  return {
    fileName: file.fileName.replace(/^\//, ""),
    message,
    severity,
    code: diagnostic.code,
    source,
    startLine: startPos.line + 1,
    startColumn: startPos.character + 1,
    endLine: endPos.line + 1,
    endColumn: endPos.character + 1,
  };
}

function diagnosticKey(d: Diagnostic): string {
  return [
    d.fileName,
    d.code,
    d.startLine,
    d.startColumn,
    d.endLine,
    d.endColumn,
    d.message,
  ].join("|");
}

const SOURCE_PRIORITY: Record<DiagnosticSource, number> = {
  syntax: 0,
  options: 1,
  semantic: 2,
};

/**
 * Merge diagnostics from several passes (transpile, syntactic, semantic),
 * dropping exact duplicates. When duplicates disagree on source, the
 * syntax classification wins because it blocks execution.
 */
export function mergeDiagnostics(...groups: Diagnostic[][]): Diagnostic[] {
  const byKey = new Map<string, Diagnostic>();
  for (const group of groups) {
    for (const diagnostic of group) {
      const key = diagnosticKey(diagnostic);
      const existing = byKey.get(key);
      if (
        !existing ||
        SOURCE_PRIORITY[diagnostic.source] < SOURCE_PRIORITY[existing.source]
      ) {
        byKey.set(key, diagnostic);
      }
    }
  }
  return sortDiagnostics([...byKey.values()]);
}

const SEVERITY_ORDER: Record<DiagnosticSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

export function sortDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  return [...diagnostics].sort(
    (a, b) =>
      (a.fileName === null ? -1 : 0) - (b.fileName === null ? -1 : 0) ||
      a.startLine - b.startLine ||
      a.startColumn - b.startColumn ||
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      a.code - b.code,
  );
}

export function hasBlockingErrors(diagnostics: Diagnostic[]): boolean {
  return diagnostics.some(
    (d) => d.severity === "error" && d.source === "syntax",
  );
}

export function countBySeverity(diagnostics: Diagnostic[]) {
  let errors = 0;
  let warnings = 0;
  let infos = 0;
  for (const d of diagnostics) {
    if (d.severity === "error") errors++;
    else if (d.severity === "warning") warnings++;
    else infos++;
  }
  return { errors, warnings, infos };
}
