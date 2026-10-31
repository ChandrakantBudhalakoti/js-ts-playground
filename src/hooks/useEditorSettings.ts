"use client";

import { useCallback, useSyncExternalStore } from "react";
import { createPersistentStore, STORAGE_KEYS } from "@/lib/storage";
import type { EditorSettings } from "@/types/playground";

export const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 14,
  tabSize: 2,
  minimap: false,
  wordWrap: false,
  timeoutMs: 5_000,
  blockRunOnTypeErrors: false,
  clearConsoleOnRun: true,
  askBeforeDownload: true,
};

export const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20] as const;
export const TIMEOUTS = [2_000, 5_000, 10_000, 30_000] as const;

function parseSettings(value: unknown): EditorSettings | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const pick = <T>(
    candidate: unknown,
    valid: (x: unknown) => x is T,
    fallback: T,
  ): T => (valid(candidate) ? candidate : fallback);
  const isBoolean = (x: unknown): x is boolean => typeof x === "boolean";
  // A setting missing from what was saved (one added later) gets this
  // device's default, as if nothing had been saved.
  const defaults = deviceDefaults();
  return {
    fontSize: pick(
      v.fontSize,
      (x): x is number => FONT_SIZES.includes(x as never),
      defaults.fontSize,
    ),
    tabSize: pick(
      v.tabSize,
      (x): x is 2 | 4 => x === 2 || x === 4,
      defaults.tabSize,
    ),
    minimap: pick(v.minimap, isBoolean, defaults.minimap),
    wordWrap: pick(v.wordWrap, isBoolean, defaults.wordWrap),
    timeoutMs: pick(
      v.timeoutMs,
      (x): x is number => TIMEOUTS.includes(x as never),
      defaults.timeoutMs,
    ),
    blockRunOnTypeErrors: pick(
      v.blockRunOnTypeErrors,
      isBoolean,
      defaults.blockRunOnTypeErrors,
    ),
    clearConsoleOnRun: pick(
      v.clearConsoleOnRun,
      isBoolean,
      defaults.clearConsoleOnRun,
    ),
    askBeforeDownload: pick(
      v.askBeforeDownload,
      isBoolean,
      defaults.askBeforeDownload,
    ),
  };
}

/** Phones wrap long lines by default: scrolling sideways is awkward there. */
function deviceDefaults(): EditorSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  return window.matchMedia("(max-width: 639px)").matches
    ? { ...DEFAULT_SETTINGS, wordWrap: true }
    : DEFAULT_SETTINGS;
}

const store = createPersistentStore(
  STORAGE_KEYS.settings,
  DEFAULT_SETTINGS,
  parseSettings,
  deviceDefaults,
);

/** Editor and runtime preferences, persisted in this browser. */
export function useEditorSettings() {
  const settings = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  const update = useCallback((patch: Partial<EditorSettings>) => {
    store.set({ ...store.getSnapshot(), ...patch });
  }, []);
  return [settings, update] as const;
}
