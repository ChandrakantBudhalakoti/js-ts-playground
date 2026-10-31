/** Languages of the interface (code and program output are never translated). */
export const LOCALES = [
  { id: "en", name: "English", htmlLang: "en" },
  { id: "hi", name: "हिन्दी", htmlLang: "hi" },
  { id: "hinglish", name: "Hinglish", htmlLang: "hi-Latn" },
] as const;

export type Locale = (typeof LOCALES)[number]["id"];

export function isLocale(value: unknown): value is Locale {
  return LOCALES.some((locale) => locale.id === value);
}
