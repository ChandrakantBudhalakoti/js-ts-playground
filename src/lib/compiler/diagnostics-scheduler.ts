import type { Diagnostic, Language } from "@/types/playground";

export interface DiagnosticsSchedulerOptions {
  check: (code: string, language: Language) => Promise<Diagnostic[]>;
  onResult: (diagnostics: Diagnostic[]) => void;
  delayMs?: number;
}

/**
 * Debounced type checking that never lets stale results win: only the
 * response to the most recent request is applied, and diagnostics computed
 * elsewhere (a Run's compile) are applied only if they describe the latest
 * code.
 */
export class DiagnosticsScheduler {
  private sequence = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private latest: { code: string; language: Language } | null = null;
  private readonly delayMs: number;

  constructor(private readonly options: DiagnosticsSchedulerOptions) {
    this.delayMs = options.delayMs ?? 300;
  }

  /** Check `code` after the debounce delay, superseding earlier requests. */
  schedule(code: string, language: Language, delayMs = this.delayMs): void {
    clearTimeout(this.timer);
    const id = ++this.sequence;
    this.latest = { code, language };
    this.timer = setTimeout(() => {
      this.options.check(code, language).then(
        (diagnostics) => {
          if (id === this.sequence) this.options.onResult(diagnostics);
        },
        () => {
          // Checker unavailable: its status is reported separately.
          if (id === this.sequence) this.options.onResult([]);
        },
      );
    }, delayMs);
  }

  /**
   * Use diagnostics produced for `code` by someone else (e.g. the compile
   * done on Run). Ignored when the user has edited since, so the pending or
   * in-flight check for the newer code still wins. Returns whether applied.
   */
  applyFor(
    code: string,
    language: Language,
    diagnostics: Diagnostic[],
  ): boolean {
    if (
      !this.latest ||
      this.latest.code !== code ||
      this.latest.language !== language
    ) {
      return false;
    }
    clearTimeout(this.timer);
    this.sequence++;
    this.options.onResult(diagnostics);
    return true;
  }

  /** Drop pending work and clear the current diagnostics. */
  clear(): void {
    this.cancel();
    this.options.onResult([]);
  }

  /** Drop pending work without touching the current diagnostics. */
  cancel(): void {
    clearTimeout(this.timer);
    this.sequence++;
  }
}
