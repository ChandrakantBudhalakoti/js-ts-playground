"use client";

import { Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale, useT } from "@/hooks/useLocale";
import type { Language } from "@/types/playground";

interface FriendlyErrorProps {
  language: Language;
  /** The error as "<Name>: <message>", or a compiler's message. */
  error: string;
  line?: number;
  onGoToLine?: () => void;
}

/**
 * A plain-language explanation of a common error, in the interface
 * language, shown under the original error (which stays as it is). The
 * rules (src/lib/friendly-errors/rules.ts) load only when an error appears.
 */
export function FriendlyError({
  language,
  error,
  line,
  onGoToLine,
}: FriendlyErrorProps) {
  const locale = useLocale();
  const t = useT();
  const [explanation, setExplanation] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("@/lib/friendly-errors").then(({ explainError }) => {
      if (!cancelled)
        setExplanation(explainError(language, error, line, locale)?.text ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [language, error, line, locale]);

  if (!explanation) return null;
  return (
    <div
      data-testid="friendly-error"
      className="mt-1.5 flex max-w-prose gap-2 rounded-md border border-sky-600/30 bg-sky-500/5 px-2.5 py-2 font-sans text-xs font-normal text-foreground"
    >
      <Lightbulb
        className="mt-0.5 size-3.5 shrink-0 text-sky-700 dark:text-sky-400"
        aria-hidden
      />
      <div className="min-w-0">
        <p className="font-medium">{t("friendly.title")}</p>
        <p className="mt-0.5 leading-relaxed whitespace-pre-wrap">
          {explanation}
        </p>
        {line !== undefined && onGoToLine && (
          <button
            type="button"
            onClick={onGoToLine}
            className="mt-1 underline decoration-dotted underline-offset-2 opacity-80 hover:opacity-100"
          >
            {t("friendly.goToLine", { line })}
          </button>
        )}
      </div>
    </div>
  );
}
