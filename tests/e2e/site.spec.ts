import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { encodeShareHash } from "../../src/lib/sharing/encode-code";
import { GUIDES } from "../../src/lib/guides";
import { LANGUAGE_PAGES } from "../../src/lib/language-pages";
import { languageInfo } from "../../src/lib/languages";
import { programPaths } from "../../src/lib/programs";
import { SITE_NAME, SITE_URL, STATIC_ROUTES } from "../../src/lib/site";
import { HERO_EXAMPLE } from "../../src/lib/content";
import {
  expectLanguage,
  expectStatus,
  loggedLines,
  openPlayground,
  run,
  waitForPlayground,
} from "./helpers";

const CONTENT_PAGES = [
  { path: "/", h1: "Learn to Code on Your Phone, Tablet or Laptop" },
  { path: "/languages", h1: "Programming Languages You Can Run Online" },
  { path: "/javascript", h1: "Online JavaScript Playground" },
  { path: "/typescript", h1: "Online TypeScript Playground" },
  ...LANGUAGE_PAGES.map((page) => ({
    path: languageInfo(page.language).path,
    h1: page.title,
  })),
  { path: "/examples", h1: "Code Examples to Run Online" },
  ...GUIDES.map((guide) => ({
    path: `/examples/${guide.slug}`,
    h1: guide.heading,
  })),
  { path: "/examples/python", h1: "Python Programs for Beginners" },
  {
    path: "/examples/c/star-pattern-pyramid",
    h1: "Pyramid Star Pattern Program in C",
  },
];

/** Canonical URLs may or may not end the bare origin with a slash. */
const normalize = (url: string | null) => url?.replace(/\/$/, "") ?? null;

async function head(page: Page) {
  return page.evaluate(() => {
    const meta = (selector: string) =>
      document.querySelector(selector)?.getAttribute("content") ?? null;
    return {
      lang: document.documentElement.lang,
      title: document.title,
      description: meta('meta[name="description"]'),
      robots: meta('meta[name="robots"]'),
      canonical:
        document.querySelector('link[rel="canonical"]')?.getAttribute("href") ??
        null,
      ogTitle: meta('meta[property="og:title"]'),
      ogDescription: meta('meta[property="og:description"]'),
      ogUrl: meta('meta[property="og:url"]'),
      ogImage: meta('meta[property="og:image"]'),
      ogImageAlt: meta('meta[property="og:image:alt"]'),
      twitterCard: meta('meta[name="twitter:card"]'),
      h1s: [...document.querySelectorAll("h1")].map((h) =>
        h.textContent?.trim(),
      ),
      jsonLd: [
        ...document.querySelectorAll('script[type="application/ld+json"]'),
      ].map((s) => s.textContent ?? ""),
    };
  });
}

test.describe("SEO metadata", () => {
  test("every content page has unique metadata, a canonical URL and one H1", async ({
    page,
  }) => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    for (const { path, h1 } of CONTENT_PAGES) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      const tags = await head(page);
      const canonical = normalize(`${SITE_URL}${path}`);

      expect(tags.lang, path).toBe("en");
      expect(tags.h1s, path).toEqual([h1]);
      expect(tags.robots, path).toBeNull();
      expect(normalize(tags.canonical), path).toBe(canonical);
      expect(normalize(tags.ogUrl), path).toBe(canonical);
      expect(tags.ogTitle, path).toBe(tags.title);
      expect(tags.ogDescription, path).toBe(tags.description);
      expect(tags.ogImage, path).toBe(`${SITE_URL}/opengraph-image`);
      expect(tags.ogImageAlt?.length, path).toBeGreaterThan(20);
      expect(tags.twitterCard, path).toBe("summary_large_image");
      expect(tags.description?.length ?? 0, path).toBeGreaterThanOrEqual(50);
      expect(tags.description?.length ?? 0, path).toBeLessThanOrEqual(200);
      for (const json of tags.jsonLd)
        expect(() => JSON.parse(json)).not.toThrow();

      expect(titles.has(tags.title), `duplicate title on ${path}`).toBe(false);
      expect(
        descriptions.has(tags.description ?? ""),
        `duplicate description on ${path}`,
      ).toBe(false);
      titles.add(tags.title);
      descriptions.add(tags.description ?? "");
    }
  });

  test("the playground page has its own title, canonical URL and a single H1", async ({
    page,
  }) => {
    await page.goto("/playground");
    await waitForPlayground(page);
    const tags = await head(page);
    expect(tags.title).toBe(`Online Code Editor and Compiler | ${SITE_NAME}`);
    expect(tags.canonical).toBe(`${SITE_URL}/playground`);
    expect(tags.h1s).toEqual([SITE_NAME]);
  });

  test("robots.txt allows crawling and points to the sitemap", async ({
    request,
  }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/plain");
    const text = await response.text();
    expect(text).toContain("User-Agent: *");
    expect(text).toContain("Allow: /");
    expect(text).not.toContain("Disallow");
    expect(text).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });

  test("sitemap.xml is valid and lists exactly the indexable pages, all reachable", async ({
    page,
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("xml");
    const xml = await response.text();

    await page.goto("/robots.txt"); // any same-origin page with DOMParser
    const parsed = await page.evaluate((source) => {
      const doc = new DOMParser().parseFromString(source, "application/xml");
      return {
        error: doc.getElementsByTagName("parsererror").length > 0,
        root: doc.documentElement.namespaceURI,
        locs: [...doc.getElementsByTagName("loc")].map((l) => l.textContent),
      };
    }, xml);
    expect(parsed.error).toBe(false);
    expect(parsed.root).toBe("http://www.sitemaps.org/schemas/sitemap/0.9");

    const expected = [
      ...STATIC_ROUTES,
      ...GUIDES.map((g) => `/examples/${g.slug}`),
      ...programPaths(),
    ].map((path) => normalize(`${SITE_URL}${path}`));
    expect(parsed.locs.map(normalize).toSorted()).toEqual(expected.toSorted());

    for (const loc of parsed.locs) {
      const path = new URL(loc!).pathname;
      expect((await request.get(path)).status(), path).toBe(200);
    }
  });

  test("the social image is a 1200×630 PNG", async ({ request }) => {
    const response = await request.get("/opengraph-image");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
    const png = await response.body();
    // IHDR: width and height are big-endian at bytes 16 and 20.
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });

  test("unknown pages return 404 with noindex", async ({ page }) => {
    const response = await page.goto("/no-such-page");
    expect(response?.status()).toBe(404);
    const tags = await head(page);
    expect(tags.robots).toContain("noindex");
    expect(tags.h1s).toEqual(["This page doesn't exist"]);
  });

  test("the sandbox page is excluded from search results", async ({
    request,
  }) => {
    const response = await request.get("/sandbox");
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
  });
});

test.describe("navigation", () => {
  test("the landing page links to the editor and the examples", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("main")
      .getByRole("link", { name: "Start Coding" })
      .first()
      .click();
    await expect(page).toHaveURL(/\/playground$/);
    await waitForPlayground(page);

    await page.goto("/");
    await page.getByRole("link", { name: "Explore Examples" }).click();
    await expect(page).toHaveURL(/\/examples$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Code Examples to Run Online",
    );
  });

  test("the playground logo links back to the home page", async ({ page }) => {
    await page.goto("/playground");
    await waitForPlayground(page);
    await page.getByRole("link", { name: SITE_NAME }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Learn to Code on Your Phone, Tablet or Laptop",
    );
  });

  test("the landing page's code preview shows what the code really prints", async ({
    page,
  }) => {
    await openPlayground(page, {
      language: HERO_EXAMPLE.language,
      code: HERO_EXAMPLE.code,
    });
    await run(page);
    await expectStatus(page, "completed", 120_000);
    await expect(loggedLines(page)).toHaveText([HERO_EXAMPLE.output]);
    await expect(page.getByTestId("problem-item")).toHaveCount(0);
  });

  test("share links made before the editor moved to /playground still open", async ({
    page,
  }) => {
    const hash = await encodeShareHash({
      language: "typescript",
      code: "const legacy: string = 'old link';\nconsole.log(legacy);",
    });
    await page.goto(`/#${hash}`);
    await expect(page).toHaveURL(new RegExp(`/playground#${hash}$`));
    await waitForPlayground(page);
    await expect(page.locator(".monaco-editor .view-lines")).toContainText(
      "const legacy: string = 'old link';",
    );
    await expectLanguage(page, "TypeScript");
  });
});

test.describe("accessibility (axe, WCAG 2.1 A/AA)", () => {
  const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

  for (const theme of ["dark", "light"] as const) {
    test.describe(`${theme} theme`, () => {
      test.beforeEach(async ({ page }) => {
        // next-themes reads the stored choice before the first paint.
        await page.addInitScript(
          (value) => window.localStorage.setItem("theme", value),
          theme,
        );
      });

      for (const path of [
        ...CONTENT_PAGES.map((p) => p.path),
        "/no-such-page",
      ]) {
        test(`${path} has no detectable violations`, async ({ page }) => {
          await page.goto(path);
          await expect(page.locator("html")).toHaveClass(new RegExp(theme));
          const results = await new AxeBuilder({ page })
            .withTags(WCAG)
            .analyze();
          expect(results.violations).toEqual([]);
        });
      }

      test("the playground has no detectable violations outside the Monaco editor", async ({
        page,
      }) => {
        await page.goto("/playground");
        await waitForPlayground(page);
        await expect(page.locator("html")).toHaveClass(new RegExp(theme));
        const results = await new AxeBuilder({ page })
          .withTags(WCAG)
          // Monaco's internals are third-party and tested upstream.
          .exclude(".monaco-editor")
          .analyze();
        expect(results.violations).toEqual([]);
      });
    });
  }
});
