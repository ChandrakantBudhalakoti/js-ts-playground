/**
 * Site-wide constants for metadata, canonical URLs, the sitemap and links.
 *
 * `SITE_URL` is the canonical origin. Preview and fork deployments keep
 * pointing their canonical URLs here unless `SITE_URL` is set at build time
 * (for example on a self-hosted copy with its own domain).
 */
export const SITE_URL = (
  process.env.SITE_URL || "https://js-ts-playground-eight.vercel.app"
).replace(/\/+$/, "");

export const SITE_NAME = "JS/TS Playground";

export const SITE_TITLE =
  "JS/TS Playground – Free Online JavaScript & TypeScript Editor";

export const SITE_DESCRIPTION =
  "Write, run, and debug JavaScript and TypeScript online with a Monaco code editor, autocomplete, type diagnostics, and an interactive console. Free, with no installation required.";

export const REPO_URL =
  "https://github.com/ChandrakantBudhalakoti/js-ts-playground";

/** Alt text for the social-sharing image (src/app/opengraph-image.tsx). */
export const OG_IMAGE_ALT =
  "JS/TS Playground: a code editor and console for writing and running JavaScript and TypeScript in the browser.";

/** Absolute URL for a site path such as `/examples`. */
export function absoluteUrl(path: string): string {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

/** Indexable pages other than the example guides (those come from `GUIDES`). */
export const STATIC_ROUTES = [
  "/",
  "/playground",
  "/javascript",
  "/typescript",
  "/examples",
] as const;
