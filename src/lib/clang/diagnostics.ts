import type { Diagnostic, DiagnosticSeverity } from "@/types/playground";

/** "main.c:3:5: error: expected ';' after expression" */
const LOCATED =
  /^(.+?):(\d+):(\d+): (fatal error|error|warning|note|remark): (.*)$/;
/** "wasm-ld: error: …", "clang: error: …" */
const UNLOCATED = /^([\w.+-]+): (fatal error|error|warning): (.*)$/;

function severityOf(kind: string): DiagnosticSeverity {
  if (kind === "warning") return "warning";
  if (kind === "note" || kind === "remark") return "info";
  return "error";
}

function diagnostic(
  severity: DiagnosticSeverity,
  message: string,
  fileName: string | null,
  line = 1,
  column = 1,
): Diagnostic {
  return {
    fileName,
    message,
    severity,
    code: 0,
    // Errors stop a run (there is no program); warnings and notes do not.
    source: severity === "error" ? "syntax" : "semantic",
    startLine: line,
    startColumn: column,
    // An empty range: the editor underlines the word at the position.
    endLine: line,
    endColumn: column,
    tool: "clang",
  };
}

/**
 * Turn Clang and wasm-ld output into diagnostics for `fileName`. Messages
 * about other files (system headers) keep their location in the text, and
 * notes are kept only when they point into the user's file.
 */
export function parseClangDiagnostics(
  output: string,
  fileName: string,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const line of output.split(/\r?\n/)) {
    const located = LOCATED.exec(line);
    if (located) {
      const [, file, lineText, columnText, kind, message] = located;
      const severity = severityOf(kind);
      if (file === fileName) {
        diagnostics.push(
          diagnostic(
            severity,
            message,
            fileName,
            Number(lineText),
            Number(columnText),
          ),
        );
      } else if (severity !== "info") {
        diagnostics.push(
          diagnostic(
            severity,
            `${file}:${lineText}:${columnText}: ${message}`,
            null,
          ),
        );
      }
      continue;
    }
    const unlocated = UNLOCATED.exec(line);
    if (unlocated) {
      const [, tool, kind, message] = unlocated;
      diagnostics.push(
        diagnostic(severityOf(kind), `${tool}: ${message}`, null),
      );
    }
  }
  return diagnostics;
}
