import { describe, expect, it } from "vitest";
import { GET } from "@/app/sw.js/route";
import { LIB_BUNDLE_URL } from "@/lib/compiler/options";
import { MONACO_VS_PATH } from "@/lib/monaco/setup";
import {
  CACHE_PREFIX,
  serviceWorkerSource,
  vendorCacheName,
} from "@/lib/offline/service-worker";
import { assetBaseUrl } from "@/lib/runtime/assets";
import RUNTIME_ASSETS from "@/lib/runtime/runtime-assets.json";

describe("service worker caches", () => {
  it("keep each versioned vendor path in a cache of its own", () => {
    expect(vendorCacheName("/vendor/monaco/0.57.0/vs/loader.js")).toBe(
      `${CACHE_PREFIX}monaco-0.57.0`,
    );
    expect(vendorCacheName("/vendor/typescript/5.9.3/lib.json")).toBe(
      `${CACHE_PREFIX}typescript-5.9.3`,
    );
    expect(
      vendorCacheName("/vendor/runtimes/python/314.0.7/pyodide.asm.wasm.gz"),
    ).toBe(`${CACHE_PREFIX}runtime-python-314.0.7`);
    expect(vendorCacheName("/_next/static/chunks/app.js")).toBeNull();
    expect(vendorCacheName("/playground")).toBeNull();
  });

  it("serializes into a script that parses on its own", () => {
    const source = serviceWorkerSource({
      shell: `${CACHE_PREFIX}shell-test`,
      keep: [],
      precache: ["/playground"],
    });
    // Self-contained: no reference to module identifiers survives.
    expect(source).not.toContain("CACHE_PREFIX");
    expect(() => new Function(source)).not.toThrow();
  });
});

describe("/sw.js", () => {
  it("is served fresh and keeps exactly this build's caches", async () => {
    const response = GET();
    expect(response.headers.get("Content-Type")).toContain("javascript");
    expect(response.headers.get("Cache-Control")).toBe("no-cache");
    const source = await response.text();
    const config = JSON.parse(
      /\}\)\((\{.*?\}), function/s.exec(source)![1],
    ) as { shell: string; keep: string[]; precache: string[] };
    expect(config.precache).toEqual(["/playground"]);
    expect(config.keep).toContain(config.shell);
    expect(config.keep).toContain(vendorCacheName(`${MONACO_VS_PATH}/`));
    expect(config.keep).toContain(vendorCacheName(LIB_BUNDLE_URL));
    for (const id of Object.keys(RUNTIME_ASSETS)) {
      expect(config.keep).toContain(
        vendorCacheName(assetBaseUrl(id as keyof typeof RUNTIME_ASSETS)),
      );
    }
  });
});
