import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// /sandbox stays crawlable on purpose: it sends `X-Robots-Tag: noindex`, and
// crawlers only see that header on pages they are allowed to fetch.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
