import type { Locale } from "@/lib/i18n/locales";
import type { Language } from "@/types/playground";
import { type FriendlyRule, RULES } from "./rules";

export type { FriendlyRule };
export { RULES };

/**
 * The plain-language explanation of an error, in the interface language
 * (English where a translation is missing), or null when no rule matches.
 */
export function explainError(
  language: Language | "java",
  error: string,
  line: number | undefined,
  locale: Locale,
  rules: readonly FriendlyRule[] = RULES,
): { id: string; text: string } | null {
  for (const rule of rules) {
    if (rule.languages !== "any" && !rule.languages.includes(language))
      continue;
    const match = rule.pattern.exec(error);
    if (!match) continue;
    const template = rule.text[locale] || rule.text.en;
    const text = template
      .replaceAll("{line}", line === undefined ? "?" : String(line))
      .replace(/\{(\d)\}/g, (_, group: string) => match[Number(group)] ?? "");
    return { id: rule.id, text };
  }
  return null;
}
