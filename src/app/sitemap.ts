import type { MetadataRoute } from "next";
import { GUIDES } from "@/lib/guides";
import { absoluteUrl, STATIC_ROUTES } from "@/lib/site";

// No `lastModified`: there is no reliable per-page date, and an inaccurate
// one is worse than none. (`new Date()` would also defeat prerendering.)
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...STATIC_ROUTES.map((path) => ({ url: absoluteUrl(path) })),
    ...GUIDES.map((guide) => ({
      url: absoluteUrl(`/examples/${guide.slug}`),
    })),
  ];
}
