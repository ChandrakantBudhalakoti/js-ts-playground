import { assetBaseUrl, type AssetBundleId } from "@/lib/runtime/assets";
import RUNTIME_ASSETS from "@/lib/runtime/runtime-assets.json";
import { readStorage, STORAGE_KEYS, writeStorage } from "@/lib/storage";
import { vendorCacheName } from "./service-worker";

/**
 * Whether each language runtime may be downloaded, and which ones are
 * already saved for offline use.
 *
 * - `checking`: not known yet (a moment after the page loads);
 * - `ask`: never downloaded; the user is asked first (see DownloadPrompt);
 * - `allowed`: the user said yes, or turned off "Ask before downloading";
 * - `downloaded`: saved, so it needs no connection again.
 *
 * With the service worker running, "saved" means every file is in the
 * runtime's cache (the worker marks it complete). Without one, a note in
 * localStorage records the download, which the browser's HTTP cache keeps.
 */
export type DownloadStatus = "checking" | "ask" | "allowed" | "downloaded";

/** Runtimes that need a download, with what they are called in the UI. */
export const DOWNLOADS: readonly { id: AssetBundleId; name: string }[] = [
  { id: "python", name: "Python" },
  { id: "clang", name: "C and C++" },
  { id: "java", name: "Java" },
  { id: "go", name: "Go" },
  { id: "ruby", name: "Ruby" },
  { id: "php", name: "PHP" },
  { id: "lua", name: "Lua" },
  { id: "r", name: "R" },
];

/** Written by the service worker once every file of a runtime is cached. */
const MARKER = "__downloaded__";

function version(id: AssetBundleId): string {
  return RUNTIME_ASSETS[id].version;
}

export function runtimeCacheName(id: AssetBundleId): string {
  return vendorCacheName(assetBaseUrl(id))!;
}

function readRecord(): Record<string, string> {
  try {
    const value: unknown = JSON.parse(
      readStorage(STORAGE_KEYS.downloads) ?? "{}",
    );
    return value && typeof value === "object"
      ? (value as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

function writeRecord(record: Record<string, string>) {
  writeStorage(STORAGE_KEYS.downloads, JSON.stringify(record));
}

function controller(): ServiceWorker | null {
  return typeof navigator !== "undefined"
    ? (navigator.serviceWorker?.controller ?? null)
    : null;
}

async function savedOffline(id: AssetBundleId): Promise<boolean> {
  const recorded = readRecord()[id] === version(id);
  if (typeof caches === "undefined" || !controller()) return recorded;
  try {
    const cache = await caches.open(runtimeCacheName(id));
    return Boolean(await cache.match(`${assetBaseUrl(id)}${MARKER}`));
  } catch {
    return recorded;
  }
}

/** Ask the service worker to save every file of a runtime, then mark it complete. */
function saveOffline(id: AssetBundleId): Promise<boolean> {
  const worker = controller();
  if (!worker) return Promise.resolve(false);
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => resolve(Boolean(event.data?.ok));
    worker.postMessage(
      {
        type: "cache-bundle",
        base: new URL(assetBaseUrl(id), location.origin).href,
      },
      [channel.port2],
    );
  });
}

class Downloads {
  private readonly statuses = new Map<AssetBundleId, DownloadStatus>();
  private readonly listeners = new Set<() => void>();
  private askFirst = true;
  private started = false;

  /** The same value until something changes (for useSyncExternalStore). */
  status(id: AssetBundleId): DownloadStatus {
    const status = this.statuses.get(id) ?? "checking";
    return status === "ask" && !this.askFirst ? "allowed" : status;
  }

  /** Whether downloading `id` is fine now (it may already be saved). */
  isAllowed(id: AssetBundleId): boolean {
    this.start();
    const status = this.status(id);
    return status === "allowed" || status === "downloaded";
  }

  subscribe(listener: () => void): () => void {
    this.start();
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** The "Ask before downloading" setting. */
  setAskFirst(value: boolean) {
    if (this.askFirst === value) return;
    this.askFirst = value;
    this.emit();
  }

  allow(id: AssetBundleId) {
    if (this.statuses.get(id) === "ask") this.set(id, "allowed");
  }

  /** A runtime finished downloading: remember it and save it for offline use. */
  downloaded(id: AssetBundleId) {
    writeRecord({ ...readRecord(), [id]: version(id) });
    this.set(id, "downloaded");
    void saveOffline(id);
  }

  /** Delete a saved runtime to free space; it is downloaded again when needed. */
  async remove(id: AssetBundleId) {
    const record = readRecord();
    delete record[id];
    writeRecord(record);
    if (typeof caches !== "undefined")
      await caches.delete(runtimeCacheName(id)).catch(() => false);
    this.set(id, "ask");
  }

  /** Bytes a saved runtime takes in the cache, if known. */
  async size(id: AssetBundleId): Promise<number | null> {
    if (typeof caches === "undefined") return null;
    try {
      const cache = await caches.open(runtimeCacheName(id));
      let total = 0;
      for (const request of await cache.keys()) {
        const response = await cache.match(request);
        if (response) total += (await response.blob()).size;
      }
      return total;
    } catch {
      return null;
    }
  }

  /**
   * Once the service worker controls the page, save the runtimes that were
   * downloaded before it did.
   */
  resync() {
    const record = readRecord();
    for (const { id } of DOWNLOADS) {
      if (record[id] === version(id)) void saveOffline(id);
    }
  }

  private start() {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    for (const { id } of DOWNLOADS) {
      void savedOffline(id).then((saved) =>
        // Unless something happened meanwhile (a download or a decision).
        this.statuses.has(id)
          ? undefined
          : this.set(id, saved ? "downloaded" : "ask"),
      );
    }
  }

  private set(id: AssetBundleId, status: DownloadStatus) {
    if (this.statuses.get(id) === status) return;
    this.statuses.set(id, status);
    this.emit();
  }

  private emit() {
    for (const listener of this.listeners) listener();
  }
}

/** Shared by the whole page (browser only). */
export const downloads = new Downloads();
