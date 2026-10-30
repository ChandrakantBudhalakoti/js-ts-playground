import { readStorage, STORAGE_KEYS, writeStorage } from "@/lib/storage";
import { defaultLocale, isLocale, LOCALES, type Locale } from "./locales";
import { en, type MessageKey, type Messages } from "./messages/en";

export { isLocale, LOCALES, type Locale, type MessageKey };

/**
 * The interface language: English is built in; Hindi and Hinglish are
 * loaded when chosen, so they cost nothing to people who don't use them.
 * Code, program output and the site's articles are never translated.
 */
const LOADERS: Record<Exclude<Locale, "en">, () => Promise<Messages>> = {
  hi: () => import("./messages/hi").then((loaded) => loaded.hi),
  hinglish: () =>
    import("./messages/hinglish").then((loaded) => loaded.hinglish),
};

type Params = Record<string, string | number>;

let locale: Locale = "en";
let messages: Messages = en;
let started = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

async function apply(next: Locale) {
  const loaded = next === "en" ? en : await LOADERS[next]().catch(() => en);
  locale = next;
  messages = loaded;
  if (typeof document !== "undefined") {
    document.documentElement.lang =
      LOCALES.find((option) => option.id === next)?.htmlLang ?? "en";
  }
  emit();
}

/** The saved choice, else Hindi for browsers set to Hindi, else English. */
function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  const saved = readStorage(STORAGE_KEYS.locale);
  const initial = isLocale(saved) ? saved : defaultLocale();
  if (initial !== "en") void apply(initial);
}

export function subscribeLocale(listener: () => void): () => void {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function currentLocale(): Locale {
  return locale;
}

export function setLocale(next: Locale) {
  writeStorage(STORAGE_KEYS.locale, next);
  void apply(next);
}

/**
 * A message in the current language, with `{name}` placeholders filled.
 * Falls back to English for a message a translation lacks.
 */
export function t(key: MessageKey, params?: Params): string {
  const template = messages[key] || en[key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  );
}

/** "1 error" / "3 errors": `key` names a pair of messages, `.one` and `.other`. */
export function plural(
  key: "count.error" | "count.warning" | "count.syntaxError" | "count.typeError",
  count: number,
): string {
  return t(`${key}.${count === 1 ? "one" : "other"}`, { count });
}
