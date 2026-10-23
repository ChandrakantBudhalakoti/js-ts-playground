import RUNTIME_ASSETS from "./runtime-assets.json";

/** A set of files prepared by scripts/prepare-assets.mjs. `wasi` needs none. */
export type AssetBundleId = keyof typeof RUNTIME_ASSETS;

export interface AssetIndex {
  version: string;
  files: Record<string, { size: number; gzip?: number }>;
}

export type DownloadState =
  | { status: "idle" }
  | { status: "downloading"; loaded: number; total: number }
  | { status: "ready"; bytes: number }
  | { status: "error"; message: string };

export function assetBaseUrl(id: AssetBundleId): string {
  return `/vendor/runtimes/${id}/${RUNTIME_ASSETS[id].version}/`;
}

const GZIP_MAGIC = [0x1f, 0x8b];

async function readWithProgress(
  response: Response,
  onChunk: (bytes: number) => void,
): Promise<Uint8Array> {
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    onChunk(bytes.byteLength);
    return bytes;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
    onChunk(value.byteLength);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

/**
 * Decompress a gzipped file. A host that already decoded it (by serving it
 * with `Content-Encoding: gzip`) hands over the plain bytes, which pass through.
 */
async function gunzip(bytes: Uint8Array): Promise<ArrayBuffer> {
  if (bytes[0] !== GZIP_MAGIC[0] || bytes[1] !== GZIP_MAGIC[1])
    return bytes.buffer as ArrayBuffer;
  const stream = new Blob([bytes as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).arrayBuffer();
}

async function fetchChecked(url: string): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(
      "The download failed. Check your connection and run the code again.",
    );
  }
  if (!response.ok) {
    throw new Error(
      `The download failed (HTTP ${response.status} for ${url}). Run "npm run dev" or "npm run build", which prepare the runtime files.`,
    );
  }
  return response;
}

export async function fetchAssetIndex(id: AssetBundleId): Promise<AssetIndex> {
  const response = await fetchChecked(`${assetBaseUrl(id)}index.json`);
  return (await response.json()) as AssetIndex;
}

/** Download every file of a bundle, decompressed, reporting progress in bytes transferred. */
export async function downloadAssetBundle(
  id: AssetBundleId,
  onProgress?: (loaded: number, total: number) => void,
): Promise<Record<string, ArrayBuffer>> {
  const base = assetBaseUrl(id);
  const index = await fetchAssetIndex(id);
  const entries = Object.entries(index.files);
  const total = entries.reduce(
    (sum, [, file]) => sum + (file.gzip ?? file.size),
    0,
  );
  let loaded = 0;
  onProgress?.(0, total);
  const files = await Promise.all(
    entries.map(async ([name, file]) => {
      const response = await fetchChecked(
        `${base}${name}${file.gzip === undefined ? "" : ".gz"}`,
      );
      const bytes = await readWithProgress(response, (chunk) => {
        loaded += chunk;
        onProgress?.(Math.min(loaded, total), total);
      });
      const data =
        file.gzip === undefined
          ? (bytes.buffer as ArrayBuffer)
          : await gunzip(bytes);
      return [name, data] as const;
    }),
  );
  return Object.fromEntries(files);
}

type Listener = () => void;

const IDLE: DownloadState = { status: "idle" };

/**
 * Downloads runtime files once per page and shares the result. Only the most
 * recently used runtimes stay in memory; the browser's HTTP cache (versioned,
 * immutable URLs) makes a later re-download cheap.
 */
export class AssetCache {
  private readonly entries = new Map<
    AssetBundleId,
    Promise<Record<string, ArrayBuffer>>
  >();
  private readonly states = new Map<AssetBundleId, DownloadState>();
  private readonly listeners = new Set<Listener>();

  constructor(
    private readonly download = downloadAssetBundle,
    private readonly keep = 2,
  ) {}

  /** The same object until the state changes (for useSyncExternalStore). */
  state(id: AssetBundleId): DownloadState {
    return this.states.get(id) ?? IDLE;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  load(id: AssetBundleId): Promise<Record<string, ArrayBuffer>> {
    const cached = this.entries.get(id);
    if (cached) {
      // Most recently used goes last.
      this.entries.delete(id);
      this.entries.set(id, cached);
      return cached;
    }
    const promise = this.download(id, (loaded, total) =>
      this.setState(id, { status: "downloading", loaded, total }),
    ).then(
      (files) => {
        const bytes = Object.values(files).reduce(
          (sum, file) => sum + file.byteLength,
          0,
        );
        this.setState(id, { status: "ready", bytes });
        return files;
      },
      (error: unknown) => {
        if (this.entries.get(id) === promise) this.entries.delete(id);
        this.setState(id, {
          status: "error",
          message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      },
    );
    this.entries.set(id, promise);
    while (this.entries.size > this.keep) {
      const oldest = this.entries.keys().next().value!;
      this.entries.delete(oldest);
      // Evicted files are downloaded again (from the HTTP cache) when needed.
      if (this.state(oldest).status === "ready") this.states.delete(oldest);
    }
    return promise;
  }

  private setState(id: AssetBundleId, state: DownloadState) {
    this.states.set(id, state);
    for (const listener of this.listeners) listener();
  }
}
