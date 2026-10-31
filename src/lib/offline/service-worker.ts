/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The service worker (served as /sw.js by src/app/sw.js/route.ts), which
 * keeps the app usable offline:
 *
 * - the app shell (pages, Next.js chunks, icons) in a cache per build;
 * - Monaco, the TypeScript libraries and each language runtime in a cache
 *   per version (their paths are versioned), so anything used once keeps
 *   working without a connection, and an update replaces the old files.
 *
 * Pages are fetched from the network first and fall back to the cache;
 * versioned files are served from the cache first. Caches of other builds
 * and versions are deleted when a new worker takes over.
 */
export interface ServiceWorkerConfig {
  /** The build's app-shell cache. */
  shell: string;
  /** Every cache this build uses; the worker deletes the others it made. */
  keep: string[];
  /** Pages cached when the worker installs. */
  precache: string[];
}

export const CACHE_PREFIX = "codetakhti-";

/**
 * Cache of a versioned vendor path, or null for everything else.
 * Self-contained (it is also serialized into the worker), so the prefix is
 * written out rather than read from `CACHE_PREFIX`.
 */
export function vendorCacheName(pathname: string): string | null {
  const vendor = /^\/vendor\/(monaco|typescript)\/([^/]+)\//.exec(pathname);
  if (vendor) return `codetakhti-${vendor[1]}-${vendor[2]}`;
  const runtime = /^\/vendor\/runtimes\/([^/]+)\/([^/]+)\//.exec(pathname);
  if (runtime) return `codetakhti-runtime-${runtime[1]}-${runtime[2]}`;
  return null;
}

/**
 * The worker itself. Self-contained: serialized with
 * `Function.prototype.toString`, so it must not reference imports or
 * module-level identifiers (`vendorCacheName` is passed in as source).
 */
function serviceWorker(
  config: ServiceWorkerConfig,
  cacheNameOf: (pathname: string) => string | null,
) {
  const scope = self as any;
  const prefix = config.shell.slice(0, config.shell.indexOf("shell-"));
  /** Marks a runtime whose every file is in its cache (see `cache-bundle`). */
  const MARKER = "__downloaded__";

  function cacheable(response: Response) {
    return response.status === 200 && response.type === "basic";
  }

  async function put(cacheName: string, request: Request, response: Response) {
    if (!cacheable(response)) return;
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
  }

  async function cacheFirst(event: any, cacheName: string) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    const response = await fetch(event.request);
    event.waitUntil(put(cacheName, event.request, response.clone()));
    return response;
  }

  async function staleWhileRevalidate(event: any, cacheName: string) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(event.request);
    const update = fetch(event.request).then(async (response) => {
      await put(cacheName, event.request, response.clone());
      return response;
    });
    if (cached) {
      event.waitUntil(update.catch(() => {}));
      return cached;
    }
    return update;
  }

  async function networkFirst(event: any, cacheName: string) {
    const request: Request = event.request;
    try {
      const response = await fetch(request);
      event.waitUntil(put(cacheName, request, response.clone()));
      return response;
    } catch (error) {
      const cache = await caches.open(cacheName);
      // A page opened with a different query (?example=…) is the same page.
      const cached =
        (await cache.match(request)) ??
        (request.mode === "navigate"
          ? await cache.match(request, { ignoreSearch: true })
          : undefined);
      if (cached) return cached;
      if (request.mode === "navigate") {
        return new Response(
          "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'>" +
            "<title>Offline</title><body style='font-family:system-ui;padding:2rem;max-width:32rem'>" +
            "<h1>You're offline</h1><p>This page hasn't been saved for offline use yet. " +
            "Pages you have opened before, and the playground, work without a connection.</p>",
          {
            status: 503,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          },
        );
      }
      throw error;
    }
  }

  /** Cache every file of a runtime (from its index.json), then mark it complete. */
  async function cacheBundle(base: string) {
    const cacheName = cacheNameOf(new URL(base).pathname);
    if (!cacheName) return false;
    const cache = await caches.open(cacheName);
    const indexUrl = `${base}index.json`;
    let index = await cache.match(indexUrl);
    if (!index) {
      const response = await fetch(indexUrl);
      if (!cacheable(response)) return false;
      await cache.put(indexUrl, response.clone());
      index = response;
    }
    const { files } = (await index.json()) as {
      files: Record<string, { gzip?: number }>;
    };
    for (const [name, file] of Object.entries(files)) {
      const url = `${base}${name}${file.gzip === undefined ? "" : ".gz"}`;
      if (await cache.match(url)) continue;
      const response = await fetch(url);
      if (!cacheable(response)) return false;
      await cache.put(url, response);
    }
    await cache.put(`${base}${MARKER}`, new Response("1"));
    return true;
  }

  scope.addEventListener("install", (event: any) => {
    event.waitUntil(
      caches
        .open(config.shell)
        .then((cache) => cache.addAll(config.precache))
        .catch(() => {})
        .then(() => scope.skipWaiting()),
    );
  });

  scope.addEventListener("activate", (event: any) => {
    event.waitUntil(
      caches
        .keys()
        .then((names) =>
          Promise.all(
            names
              .filter(
                (name) =>
                  name.startsWith(prefix) && !config.keep.includes(name),
              )
              .map((name) => caches.delete(name)),
          ),
        )
        .then(() => scope.clients.claim()),
    );
  });

  scope.addEventListener("fetch", (event: any) => {
    const request: Request = event.request;
    if (request.method !== "GET") return;
    const url = new URL(request.url);
    if (url.origin !== scope.location.origin) return;
    if (url.pathname === "/sw.js") return;
    // Next.js router data: let a failure fall back to a full page load.
    if (request.headers.has("RSC") || url.searchParams.has("_rsc")) return;

    const vendor = cacheNameOf(url.pathname);
    if (vendor) {
      // Files that can change at the same path are revalidated.
      const revalidate =
        url.pathname.startsWith("/vendor/typescript/") ||
        url.pathname.endsWith("/index.json");
      event.respondWith(
        revalidate
          ? staleWhileRevalidate(event, vendor)
          : cacheFirst(event, vendor),
      );
    } else if (url.pathname.startsWith("/_next/static/")) {
      event.respondWith(cacheFirst(event, config.shell));
    } else {
      event.respondWith(networkFirst(event, config.shell));
    }
  });

  scope.addEventListener("message", (event: any) => {
    const message = event.data;
    if (message?.type === "cache-urls" && Array.isArray(message.urls)) {
      // Files the page loaded before this worker controlled it.
      event.waitUntil(
        Promise.all(
          message.urls.map(async (href: string) => {
            const url = new URL(href, scope.location.origin);
            if (url.origin !== scope.location.origin) return;
            const cacheName = cacheNameOf(url.pathname) ?? config.shell;
            const cache = await caches.open(cacheName);
            if (await cache.match(url.href)) return;
            const response = await fetch(url.href).catch(() => null);
            if (response && cacheable(response))
              await cache.put(url.href, response);
          }),
        ),
      );
    } else if (message?.type === "cache-bundle") {
      const reply = event.ports?.[0];
      event.waitUntil(
        cacheBundle(String(message.base)).then(
          (ok) => reply?.postMessage({ ok }),
          () => reply?.postMessage({ ok: false }),
        ),
      );
    }
  });
}

/** The worker's source, with its configuration. */
export function serviceWorkerSource(config: ServiceWorkerConfig): string {
  return `(${serviceWorker.toString()})(${JSON.stringify(config)}, ${vendorCacheName.toString()});\n`;
}
