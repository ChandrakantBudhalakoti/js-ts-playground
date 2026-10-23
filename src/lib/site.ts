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

/**
 * The product name. The repository, the default domain and the browser
 * storage keys keep their original "js-ts-playground" names: changing those
 * would break links and lose people's saved drafts.
 */
export const SITE_NAME = "CodeSlate";

export const SITE_TITLE =
  "CodeSlate – Free Online Compiler for Phone, Tablet and PC";

export const SITE_DESCRIPTION =
  "Run Python, C, C++, JavaScript, TypeScript, Go, Ruby, PHP, Lua and R online on your phone, tablet or PC. Free code editor, no install, no account.";

export const REPO_URL =
  "https://github.com/ChandrakantBudhalakoti/js-ts-playground";

/** Alt text for the social-sharing image (src/app/opengraph-image.tsx). */
export const OG_IMAGE_ALT =
  "CodeSlate: a free code editor and compiler for Python, C, C++, JavaScript and more, running in the browser on phones, tablets and computers.";

/** Absolute URL for a site path such as `/examples`. */
export function absoluteUrl(path: string): string {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

/** Indexable pages other than the example guides (those come from `GUIDES`). */
export const STATIC_ROUTES = [
  "/",
  "/playground",
  "/languages",
  "/javascript",
  "/typescript",
  "/python",
  "/c",
  "/cpp",
  "/go",
  "/ruby",
  "/php",
  "/lua",
  "/r",
  "/examples",
] as const;
