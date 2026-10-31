"use client";

import { useCallback, useSyncExternalStore } from "react";
import { type DownloadStatus, downloads } from "@/lib/offline/downloads";
import type { AssetBundleId } from "@/lib/runtime/assets";

const subscribeDownloads = (onChange: () => void) =>
  downloads.subscribe(onChange);

/** Whether a runtime may be downloaded, or is saved; `null` asks about nothing. */
export function useDownloadStatus(
  id: AssetBundleId | null,
): DownloadStatus | null {
  const getSnapshot = useCallback(
    () => (id ? downloads.status(id) : null),
    [id],
  );
  return useSyncExternalStore(subscribeDownloads, getSnapshot, () =>
    id ? "checking" : null,
  );
}

function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** False while the browser reports no network connection. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}
