"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Create the DOM node the editor is portaled into. It is moved between
 * layouts (desktop panels / mobile tabs) instead of being re-created, so the
 * Monaco instance, its undo history, cursor and scroll position survive a
 * breakpoint change.
 */
export function createEditorHost(): HTMLDivElement {
  const host = document.createElement("div");
  host.style.width = "100%";
  host.style.height = "100%";
  host.dataset.editorHost = "";
  return host;
}

/** Where the persistent editor host is attached in the current layout. */
export function EditorSlot({ host }: { host: HTMLElement | null }) {
  const slotRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot || !host) return;
    slot.appendChild(host);
    return () => {
      if (host.parentNode === slot) slot.removeChild(host);
    };
  }, [host]);

  return <div ref={slotRef} className="h-full w-full" />;
}
