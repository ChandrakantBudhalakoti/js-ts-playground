"use client";

import { useCallback, useEffect, useState } from "react";
import { getCompilerClient } from "@/hooks/useCompiler";
import { DiagnosticsScheduler } from "@/lib/compiler/diagnostics-scheduler";
import type { Diagnostic, Language } from "@/types/playground";

function sameDiagnostics(a: Diagnostic[], b: Diagnostic[]): boolean {
  return a.length === b.length && JSON.stringify(a) === JSON.stringify(b);
}

/** Debounced type checking in the compiler worker (see DiagnosticsScheduler). */
export function useDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [scheduler] = useState(
    () =>
      new DiagnosticsScheduler({
        check: (code, language) => getCompilerClient().check(code, language),
        onResult: (next) =>
          setDiagnostics((previous) =>
            sameDiagnostics(previous, next) ? previous : next,
          ),
      }),
  );

  useEffect(() => () => scheduler.cancel(), [scheduler]);

  const schedule = useCallback(
    (code: string, language: Language, delayMs?: number) =>
      scheduler.schedule(code, language, delayMs),
    [scheduler],
  );
  /** Apply a Run's compile diagnostics, unless the code has changed since. */
  const applyFor = useCallback(
    (code: string, language: Language, next: Diagnostic[]) =>
      scheduler.applyFor(code, language, next),
    [scheduler],
  );
  const clear = useCallback(() => scheduler.clear(), [scheduler]);

  return { diagnostics, schedule, applyFor, clear };
}
