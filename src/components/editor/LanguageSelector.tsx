"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  isLanguage,
  LANGUAGE_GROUPS,
  LANGUAGES,
  languageInfo,
} from "@/lib/languages";
import type { Language } from "@/types/playground";

interface LanguageSelectorProps {
  value: Language;
  onChange: (language: Language) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const current = languageInfo(value);
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (isLanguage(next)) onChange(next);
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={`Language: ${current.name}`}
        data-testid="language-select"
        className="gap-1 px-2 text-xs font-medium"
      >
        <SelectValue>
          <span className="font-mono sm:hidden">{current.short}</span>
          <span className="hidden sm:inline">{current.name}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="min-w-44">
        {LANGUAGE_GROUPS.map((group) => (
          <SelectGroup key={group.id}>
            <SelectLabel className="text-xs text-muted-foreground">
              {group.label}
            </SelectLabel>
            {LANGUAGES.filter((info) => info.group === group.id).map((info) => (
              <SelectItem
                key={info.id}
                value={info.id}
                data-testid={`language-${info.id}`}
              >
                {info.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
