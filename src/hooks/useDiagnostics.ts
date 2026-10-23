"use client";

import { useCallback, useEffect, useState } from "react";
import { getClangClient } from "@/hooks/useClang";
import { getCompilerClient } from "@/hooks/useCompiler";
import { DiagnosticsScheduler } from "@/lib/compiler/diagnostics-scheduler";
import { isClangLanguage, isJavaScriptLike } from "@/lib/languages";
import type { Diagnostic, Language } from "@/types/playground";

function sameDiagnostics(a: Diagnostic[], b: Diagnostic[]): boolean {
  return a.length === b.length && JSON.stringify(a) === JSON.stringify(b);
}

/** Diagnostics while typing: TypeScript for JS/TS, Clang for C/C++. */
function check(code: string, language: Language): Promise<Diagnostic[]> {
  if (isJavaScriptLike(language))
    return getCompilerClient().check(code, language);
  if (isClangLanguage(language))
    return getClangClient()
      .check(code, language)
      .then((result) => result.diagnostics);
  // Other languages report errors when they run.
  return Promise.resolve([]);
}

/** Clang checks are slower than TypeScript's: wait for a longer pause. */
const CLANG_DELAY_MS = 700;

/** Debounced checking in a worker (see DiagnosticsScheduler). */
export function useDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [scheduler] = useState(
    () =>
      new DiagnosticsScheduler({
        check,
        onResult: (next) =>
          setDiagnostics((previous) =>
            sameDiagnostics(previous, next) ? previous : next,
          ),
      }),
  );

  useEffect(() => () => scheduler.cancel(), [scheduler]);

  const schedule = useCallback(
    (code: string, language: Language, delayMs?: number) =>
      scheduler.schedule(
        code,
        language,
        delayMs ?? (isClangLanguage(language) ? CLANG_DELAY_MS : undefined),
      ),
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
