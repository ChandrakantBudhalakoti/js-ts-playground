"use client";

import { useCallback, useSyncExternalStore } from "react";
import { downloads } from "@/lib/offline/downloads";
import {
  AssetCache,
  type AssetBundleId,
  type DownloadState,
  downloadAssetBundle,
} from "@/lib/runtime/assets";

let cache: AssetCache | null = null;

/** Runtime file downloads shared by the whole page (browser only). */
export function getAssetCache(): AssetCache {
  // Each completed download is saved for offline use.
  cache ??= new AssetCache((id, onProgress) =>
    downloadAssetBundle(id, onProgress).then((files) => {
      downloads.downloaded(id);
      return files;
    }),
  );
  return cache;
}

const IDLE: DownloadState = { status: "idle" };

/** Download progress of a runtime's files; `null` tracks nothing. */
export function useDownloadState(id: AssetBundleId | null): DownloadState {
  const subscribe = useCallback(
    (onChange: () => void) => getAssetCache().subscribe(onChange),
    [],
  );
  const getSnapshot = useCallback(
    () => (id ? getAssetCache().state(id) : IDLE),
    [id],
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => IDLE);
}
