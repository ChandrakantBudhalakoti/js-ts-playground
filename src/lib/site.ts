/**
 * Site-wide constants for metadata, canonical URLs, the sitemap and links.
 *
 * `SITE_URL` is the canonical origin: canonical links, og:url, the sitemap,
 * robots.txt and structured data all derive from it. Moving to another
 * domain means changing the default below, or setting NEXT_PUBLIC_SITE_URL
 * at build time (a fork or self-hosted copy with its own domain). Preview
 * deployments keep pointing their canonical URLs at the real site.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://codetakhti.vercel.app"
).replace(/\/+$/, "");

/**
 * The product name. The repository and the browser storage keys keep their
 * original "js-ts-playground" names: changing those would break links and
 * lose people's saved drafts.
 */
export const SITE_NAME = "CodeTakhti";

export const SITE_TITLE = `${SITE_NAME} – Free Online Compiler for Phone, Tablet and PC`;

export const SITE_DESCRIPTION =
  "Run Python, C, C++, Java, JavaScript, TypeScript, Go, Ruby, PHP, Lua and R online on your phone, tablet or PC. Free code editor, no install, no account.";

export const REPO_URL =
  "https://github.com/ChandrakantBudhalakoti/js-ts-playground";

/** Alt text for the social-sharing image (src/app/opengraph-image.tsx). */
export const OG_IMAGE_ALT = `${SITE_NAME}: a free code editor and compiler for Python, C, C++, JavaScript and more, running in the browser on phones, tablets and computers.`;

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
  "/java",
  "/go",
  "/ruby",
  "/php",
  "/lua",
  "/r",
  "/examples",
] as const;
