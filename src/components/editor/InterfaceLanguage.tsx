"use client";

import { Button } from "@/components/ui/button";
import { useLocale, useT } from "@/hooks/useLocale";
import { setLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Switches the interface between English and Hindi in one tap: it shows
 * the language it switches to. Everyone starts in English; Hinglish is in
 * Settings (from Hinglish, this switches back to English).
 */
export function InterfaceLanguageToggle({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useT();
  const toHindi = locale === "en";
  return (
    <Button
      variant="ghost"
      size="sm"
      data-testid="interface-language-toggle"
      onClick={() => setLocale(toHindi ? "hi" : "en")}
      className={cn("h-8 min-w-9 px-2 text-xs font-semibold", className)}
    >
      {/* The visible text is part of the accessible name (WCAG 2.5.3). */}
      <span lang={toHindi ? "hi" : "en"}>{toHindi ? "हिं" : "EN"}</span>
      <span className="sr-only">
        {` (${t(toHindi ? "toolbar.switchToHindi" : "toolbar.switchToEnglish")})`}
      </span>
    </Button>
  );
}
