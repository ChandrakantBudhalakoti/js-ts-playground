"use client";

import { useEffect } from "react";

export function DisableDevToolsShortcuts() {
  useEffect(() => {
    const preventContextMenu = (event: MouseEvent) => event.preventDefault();
    const preventDevToolsShortcuts = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const opensDevTools =
        key === "f12" ||
        (event.ctrlKey && event.shiftKey && ["i", "c", "j"].includes(key)) ||
        (event.metaKey && event.altKey && key === "i");

      if (opensDevTools) event.preventDefault();
    };

    document.addEventListener("contextmenu", preventContextMenu);
    document.addEventListener("keydown", preventDevToolsShortcuts);

    return () => {
      document.removeEventListener("contextmenu", preventContextMenu);
      document.removeEventListener("keydown", preventDevToolsShortcuts);
    };
  }, []);

  return null;
}
