import { readdirSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { DEFAULT_SETTINGS, TIMEOUTS } from "@/hooks/useEditorSettings";
import { faqJsonLd, HOME_FAQS } from "@/lib/content";
import {
  EXAMPLE_PARAM,
  EXAMPLES,
  findExample,
  playgroundHref,
} from "@/lib/examples";
import { findGuide, GUIDES, guideExample } from "@/lib/guides";
import { OG_IMAGE, pageMetadata } from "@/lib/metadata";
import { programPaths } from "@/lib/programs";
import { absoluteUrl, SITE_NAME, SITE_URL, STATIC_ROUTES } from "@/lib/site";

const EXAMPLE_ROUTES_DIR = join(
  import.meta.dirname,
  "../../src/app/(site)/examples",
);

describe("sitemap.xml", () => {
  const entries = sitemap();
  const urls = entries.map((entry) => entry.url);

  it("lists every static page, guide and program page exactly once", () => {
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.toSorted()).toEqual(
      [
        ...STATIC_ROUTES,
        ...GUIDES.map((guide) => `/examples/${guide.slug}`),
        ...programPaths(),
      ]
        .map(absoluteUrl)
        .toSorted(),
    );
  });

  it("uses absolute URLs on the canonical origin", () => {
    for (const url of urls) {
      expect(new URL(url).origin).toBe(SITE_URL);
    }
    expect(SITE_URL).toBe("https://codetakhti.vercel.app");
  });

  it("does not list the sandbox page", () => {
    expect(urls.some((url) => url.includes("/sandbox"))).toBe(false);
  });
});

describe("robots.txt", () => {
  it("allows everything and points to the sitemap", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: `${SITE_URL}/sitemap.xml`,
    });
  });
});

describe("NEXT_PUBLIC_SITE_URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("moves every canonical address to another domain", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.org/");
    vi.resetModules();
    const site = await import("@/lib/site");
    const { default: sitemapOn } = await import("@/app/sitemap");
    const { default: robotsOn } = await import("@/app/robots");
    expect(site.SITE_URL).toBe("https://example.org");
    expect(site.absoluteUrl("/")).toBe("https://example.org/");
    for (const { url } of sitemapOn())
      expect(new URL(url).origin).toBe("https://example.org");
    expect(robotsOn().sitemap).toBe("https://example.org/sitemap.xml");
  });
});

describe("pageMetadata", () => {
  it("sets the canonical URL, Open Graph data and the social image", () => {
    const metadata = pageMetadata({
      title: "Promises",
      description: "About promises.",
      path: "/examples/promises",
    });
    expect(metadata.title).toBe("Promises");
    expect(metadata.alternates?.canonical).toBe("/examples/promises");
    expect(metadata.openGraph).toMatchObject({
      title: `Promises | ${SITE_NAME}`,
      description: "About promises.",
      url: "/examples/promises",
      images: [OG_IMAGE],
    });
  });

  it("supports an absolute title for the home page", () => {
    const metadata = pageMetadata({
      title: "Home",
      description: "Home page.",
      path: "/",
      absoluteTitle: true,
    });
    expect(metadata.title).toEqual({ absolute: "Home" });
    expect(metadata.openGraph?.title).toBe("Home");
  });
});

describe("examples", () => {
  it("have unique ids, and unique titles within each language", () => {
    const ids = EXAMPLES.map((example) => example.id);
    // The Examples menu lists one language at a time.
    const titles = EXAMPLES.map(
      (example) => `${example.language}: ${example.title}`,
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("can be opened by URL", () => {
    expect(playgroundHref("ts-generics")).toBe(
      `/playground?${EXAMPLE_PARAM}=ts-generics`,
    );
    for (const example of EXAMPLES) {
      const url = new URL(playgroundHref(example.id), SITE_URL);
      expect(findExample(url.searchParams.get(EXAMPLE_PARAM)!)).toBe(example);
    }
  });
});

describe("guides", () => {
  it("have unique slugs, titles and descriptions", () => {
    for (const key of ["slug", "title", "heading", "description"] as const) {
      const values = GUIDES.map((guide) => guide[key]);
      expect(new Set(values).size, key).toBe(values.length);
    }
  });

  it("explain an existing example in the language they name", () => {
    for (const guide of GUIDES) {
      const example = guideExample(guide);
      const language =
        example.language === "typescript" ? "TypeScript" : "JavaScript";
      expect(guide.heading, guide.slug).toContain(language);
      expect(findGuide(guide.slug)).toBe(guide);
    }
  });

  it("have descriptions that fit in search results and real content", () => {
    for (const guide of GUIDES) {
      expect(guide.description.length, guide.slug).toBeGreaterThanOrEqual(70);
      expect(guide.description.length, guide.slug).toBeLessThanOrEqual(160);
      expect(guide.intro.length, guide.slug).toBeGreaterThan(0);
      expect(guide.concepts.length, guide.slug).toBeGreaterThanOrEqual(3);
      expect(guide.output.length, guide.slug).toBeGreaterThan(0);
      expect(guide.tryNext.length, guide.slug).toBeGreaterThan(0);
    }
  });

  it("each have a page, and every example page has a guide", () => {
    const folders = readdirSync(EXAMPLE_ROUTES_DIR, { withFileTypes: true })
      // [language] holds the beginner program pages (tests/unit/programs.test.ts).
      .filter((entry) => entry.isDirectory() && entry.name !== "[language]")
      .map((entry) => entry.name);
    expect(folders.toSorted()).toEqual(
      GUIDES.map((guide) => guide.slug).toSorted(),
    );
  });
});

describe("landing page copy", () => {
  it("quotes the real time limits", () => {
    // HOME_FAQS (src/lib/content.ts) says "5 seconds by default, adjustable
    // from 2 to 30 seconds"; update the copy if these change.
    const answer = HOME_FAQS.find((faq) =>
      faq.question.includes("infinite loop"),
    )!.answer;
    expect(DEFAULT_SETTINGS.timeoutMs).toBe(5_000);
    expect(TIMEOUTS[0]).toBe(2_000);
    expect(TIMEOUTS.at(-1)).toBe(30_000);
    expect(answer).toContain("5 seconds by default");
    expect(answer).toContain("from 2 to 30 seconds");
  });

  it("mirrors the visible FAQs in its structured data", () => {
    const data = faqJsonLd(HOME_FAQS);
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity.map((q) => [q.name, q.acceptedAnswer.text])).toEqual(
      HOME_FAQS.map((faq) => [faq.question, faq.answer]),
    );
  });
});
