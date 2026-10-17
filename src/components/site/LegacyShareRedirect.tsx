"use client";

import { useEffect } from "react";

/**
 * Share links created before the editor moved to /playground point at the
 * home page (`/#lang=ts&code=…`). Forward them, hash included, so old links
 * keep opening the shared code.
 */
export function LegacyShareRedirect() {
  useEffect(() => {
    const forward = () => {
      const params = new URLSearchParams(window.location.hash.slice(1));
      if (params.has("code"))
        window.location.replace(`/playground${window.location.hash}`);
    };
    forward();
    window.addEventListener("hashchange", forward);
    return () => window.removeEventListener("hashchange", forward);
  }, []);
  return null;
}
