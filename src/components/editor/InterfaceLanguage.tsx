"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale, useT } from "@/hooks/useLocale";
import { isLocale, LOCALES, setLocale } from "@/lib/i18n";

/** The interface languages, as radio items (for a menu). */
export function InterfaceLanguageItems() {
  const locale = useLocale();
  return (
    <DropdownMenuRadioGroup
      value={locale}
      onValueChange={(value) => isLocale(value) && setLocale(value)}
    >
      {LOCALES.map((option) => (
        <DropdownMenuRadioItem
          key={option.id}
          value={option.id}
          lang={option.htmlLang}
        >
          {option.name}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );
}

/** A toolbar button that switches the interface language. */
export function InterfaceLanguageMenu({ className }: { className?: string }) {
  const t = useT();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("toolbar.interfaceLanguage")}
          title={t("toolbar.interfaceLanguage")}
          className={className}
        >
          <Languages aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t("toolbar.interfaceLanguage")}
        </DropdownMenuLabel>
        <InterfaceLanguageItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
