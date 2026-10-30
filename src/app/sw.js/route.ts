import { LIB_BUNDLE_URL } from "@/lib/compiler/options";
import { MONACO_VS_PATH } from "@/lib/monaco/setup";
import {
  CACHE_PREFIX,
  serviceWorkerSource,
  vendorCacheName,
} from "@/lib/offline/service-worker";
import { assetBaseUrl, type AssetBundleId } from "@/lib/runtime/assets";
import RUNTIME_ASSETS from "@/lib/runtime/runtime-assets.json";

/**
 * The service worker (src/lib/offline/service-worker.ts), configured for
 * this build. Generated at build time.
 */
export function GET() {
  const shell = `${CACHE_PREFIX}shell-${process.env.NEXT_PUBLIC_BUILD_ID ?? "dev"}`;
  const vendorCaches = [
    `${MONACO_VS_PATH}/`,
    LIB_BUNDLE_URL,
    ...Object.keys(RUNTIME_ASSETS).map((id) =>
      assetBaseUrl(id as AssetBundleId),
    ),
  ].map((path) => vendorCacheName(path)!);
  return new Response(
    serviceWorkerSource({
      shell,
      keep: [shell, ...vendorCaches],
      precache: ["/playground"],
    }),
    {
      headers: {
        "Content-Type": "text/javascript; charset=utf-8",
        // Browsers check for a new worker on navigation; never serve a stale one.
        "Cache-Control": "no-cache",
      },
    },
  );
}
