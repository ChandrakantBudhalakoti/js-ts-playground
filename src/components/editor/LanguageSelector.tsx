"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Language } from "@/types/playground";

const ITEM =
  "px-2.5 font-mono text-xs data-[state=on]:bg-sky-500/15 data-[state=on]:text-sky-700 dark:data-[state=on]:text-sky-300";

interface LanguageSelectorProps {
  value: Language;
  onChange: (language: Language) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      variant="outline"
      spacing={0}
      value={value}
      onValueChange={(next) => {
        if (next === "javascript" || next === "typescript") onChange(next);
      }}
      aria-label="Language"
    >
      <ToggleGroupItem
        value="javascript"
        aria-label="JavaScript"
        title="JavaScript"
        className={ITEM}
      >
        JS
      </ToggleGroupItem>
      <ToggleGroupItem
        value="typescript"
        aria-label="TypeScript"
        title="TypeScript"
        className={ITEM}
      >
        TS
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
