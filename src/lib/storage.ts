/** localStorage helpers that never throw (private mode, quota, disabled storage). */

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage is best-effort.
  }
}

export function readJson<T>(
  key: string,
  parse: (value: unknown) => T | null,
): T | null {
  const raw = readStorage(key);
  if (raw === null) return null;
  try {
    return parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export const STORAGE_KEYS = {
  settings: "jsts-playground:settings",
  draft: "jsts-playground:draft",
  /** Runtimes downloaded in this browser: { id: version } (src/lib/offline/downloads.ts). */
  downloads: "jsts-playground:downloads",
} as const;

/**
 * A tiny external store persisted to localStorage, for `useSyncExternalStore`.
 * The server snapshot is always `defaults`, so hydration stays deterministic.
 * `clientDefaults` can adapt the defaults to the device when nothing is saved.
 */
export function createPersistentStore<T>(
  key: string,
  defaults: T,
  parse: (value: unknown) => T | null,
  clientDefaults?: () => T,
) {
  let value: T | undefined;
  const listeners = new Set<() => void>();

  function getSnapshot(): T {
    value ??= readJson(key, parse) ?? clientDefaults?.() ?? defaults;
    return value;
  }

  return {
    getSnapshot,
    getServerSnapshot: () => defaults,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set(next: T) {
      value = next;
      writeStorage(key, JSON.stringify(next));
      for (const listener of listeners) listener();
    },
  };
}
