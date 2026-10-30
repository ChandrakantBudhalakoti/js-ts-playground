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

/** Hindi for browsers set to Hindi, English otherwise. */
export function defaultLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const preferred = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  return preferred.some((tag) => /^hi\b/i.test(tag)) ? "hi" : "en";
}
