"use client";

import { useEffect, useState } from "react";

export interface VisualViewportBox {
  height: number;
  offsetTop: number;
}

/**
 * The part of the page the user can see, on touch screens. iOS keeps the
 * layout viewport when the on-screen keyboard opens and scrolls the page
 * instead, so a full-height app would slide under the keyboard; following
 * the visual viewport keeps it in view. `null` on other devices.
 */
export function useVisualViewport(): VisualViewportBox | null {
  const [box, setBox] = useState<VisualViewportBox | null>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport || !window.matchMedia("(pointer: coarse)").matches) return;
    const update = () =>
      setBox({
        height: Math.round(viewport.height),
        offsetTop: Math.round(viewport.offsetTop),
      });
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return box;
}
