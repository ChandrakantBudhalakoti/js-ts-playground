"use client";

import { useEffect } from "react";
import { downloads } from "@/lib/offline/downloads";

/**
 * Registers the service worker (src/lib/offline/service-worker.ts) in
 * production builds. Once it controls the page, it is handed the files the
 * page loaded before that (on a first visit), so they work offline too.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const container = navigator.serviceWorker;
    const saveLoaded = () => {
      const controller = container.controller;
      if (!controller) return;
      controller.postMessage({
        type: "cache-urls",
        urls: [
          location.href,
          ...performance
            .getEntriesByType("resource")
            .map((entry) => entry.name),
        ],
      });
      downloads.resync();
    };
    container.register("/sw.js").catch(() => {
      // No offline support (private mode, an old browser): the app still works.
    });
    if (container.controller) saveLoaded();
    container.addEventListener("controllerchange", saveLoaded);
    return () => container.removeEventListener("controllerchange", saveLoaded);
  }, []);
  return null;
}
