"use client";

import { useSyncExternalStore } from "react";
import {
  currentLocale,
  type Locale,
  subscribeLocale,
  t,
} from "@/lib/i18n";

/** The interface language; English until the saved choice has loaded. */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribeLocale, currentLocale, () => "en");
}

/** `t`, re-rendering the component when the interface language changes. */
export function useT(): typeof t {
  useLocale();
  return t;
}
