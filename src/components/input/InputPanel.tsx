"use client";

import { useId } from "react";
import { useT } from "@/hooks/useLocale";

interface InputPanelProps {
  value: string;
  onChange: (value: string) => void;
  /** Display name of the current language, e.g. "Python". */
  language: string;
}

/** Standard input for the program: read from the start on every run. */
export function InputPanel({ value, onChange, language }: InputPanelProps) {
  const t = useT();
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className="flex h-full flex-col gap-1.5 p-2">
      <label htmlFor={id} className="sr-only">
        {t("input.label")}
      </label>
      <textarea
        id={id}
        aria-describedby={hintId}
        data-testid="stdin-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        placeholder={t("input.placeholder")}
        className="min-h-0 flex-1 resize-none rounded-md border bg-transparent p-2 font-mono text-[12.5px] leading-5 pointer-coarse:text-base pointer-coarse:leading-6 outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <p id={hintId} className="px-0.5 text-xs text-muted-foreground">
        {t("input.help", { name: language })}
      </p>
    </div>
  );
}
