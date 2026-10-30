"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { useDownloadStatus } from "@/hooks/useOffline";
import { DOWNLOADS, downloads } from "@/lib/offline/downloads";
import type { AssetBundleId } from "@/lib/runtime/assets";

function formatBytes(bytes: number): string {
  return bytes >= 1_000_000
    ? `${(bytes / 1_000_000).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1_000))} KB`;
}

function DownloadRow({ id, name }: { id: AssetBundleId; name: string }) {
  const status = useDownloadStatus(id);
  const [size, setSize] = useState<number | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (status !== "downloaded") return;
    let cancelled = false;
    void downloads.size(id).then((bytes) => {
      if (!cancelled) setSize(bytes);
    });
    return () => {
      cancelled = true;
    };
  }, [id, status]);

  if (status !== "downloaded") return null;
  return (
    <li className="flex min-h-9 items-center justify-between gap-3">
      <span className="text-sm">
        {name}
        {size !== null && size > 0 && (
          <span className="ml-2 text-xs text-muted-foreground">
            {formatBytes(size)}
          </span>
        )}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs text-muted-foreground"
        disabled={removing}
        aria-label={`Remove ${name}`}
        onClick={() => {
          setRemoving(true);
          void downloads.remove(id).finally(() => setRemoving(false));
        }}
      >
        <Trash2 aria-hidden />
        Remove
      </Button>
    </li>
  );
}

/**
 * The language runtimes saved in this browser (for offline use), with their
 * size and a way to remove each one to free space.
 */
const subscribe = (onChange: () => void) => downloads.subscribe(onChange);
const noneSaved = () =>
  DOWNLOADS.every(({ id }) => downloads.status(id) !== "downloaded");

export function DownloadedLanguages() {
  const none = useSyncExternalStore(subscribe, noneSaved, () => true);
  return (
    <div data-testid="downloaded-languages">
      <ul className="flex flex-col">
        {DOWNLOADS.map(({ id, name }) => (
          <DownloadRow key={id} id={id} name={name} />
        ))}
      </ul>
      {none && (
        <p className="text-xs text-muted-foreground">
          None yet. Each language is saved the first time you run it, and then
          works offline.
        </p>
      )}
    </div>
  );
}
