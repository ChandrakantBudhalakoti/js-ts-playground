"use client";

import { Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { useId, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DownloadedLanguages } from "@/components/editor/DownloadedLanguages";
import { FONT_SIZES, TIMEOUTS } from "@/hooks/useEditorSettings";
import { useLocale, useT } from "@/hooks/useLocale";
import { isLocale, LOCALES, type MessageKey, setLocale } from "@/lib/i18n";
import type { EditorSettings } from "@/types/playground";

interface SettingsPopoverProps {
  settings: EditorSettings;
  onChange: (patch: Partial<EditorSettings>) => void;
}

function Row({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-4">
      <Label htmlFor={htmlFor} className="text-sm font-normal">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SwitchRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  const id = useId();
  return (
    <Row label={label} htmlFor={id}>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </Row>
  );
}

const SHORTCUTS: [MessageKey, string][] = [
  ["settings.shortcutRun", "Ctrl/⌘ + Enter"],
  ["settings.shortcutFormat", "Shift + Alt + F"],
  ["settings.shortcutPalette", "F1"],
  ["settings.shortcutTabFocus", "Ctrl + M"],
];

export function SettingsPopover({ settings, onChange }: SettingsPopoverProps) {
  const { theme = "dark", setTheme } = useTheme();
  const t = useT();
  const locale = useLocale();
  const localeId = useId();
  const fontId = useId();
  const timeoutId = useId();

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("settings.title")}
            >
              <Settings aria-hidden />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{t("settings.title")}</TooltipContent>
      </Tooltip>
      <PopoverContent
        align="end"
        collisionPadding={8}
        className="max-h-(--radix-popover-content-available-height) w-80 overflow-y-auto p-4"
      >
        <div className="flex flex-col gap-2">
          <Row label={t("settings.interfaceLanguage")} htmlFor={localeId}>
            <Select
              value={locale}
              onValueChange={(value) => isLocale(value) && setLocale(value)}
            >
              <SelectTrigger id={localeId} size="sm" className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCALES.map((option) => (
                  <SelectItem
                    key={option.id}
                    value={option.id}
                    lang={option.htmlLang}
                  >
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>

          <Separator className="my-2" />
          <h2 className="text-sm font-medium">{t("settings.editor")}</h2>
          <Row label={t("settings.theme")}>
            <ToggleGroup
              type="single"
              size="sm"
              variant="outline"
              spacing={0}
              value={theme}
              onValueChange={(value) => value && setTheme(value)}
              aria-label={t("settings.theme")}
            >
              <ToggleGroupItem value="dark" className="px-2 text-xs">
                {t("settings.dark")}
              </ToggleGroupItem>
              <ToggleGroupItem value="light" className="px-2 text-xs">
                {t("settings.light")}
              </ToggleGroupItem>
              <ToggleGroupItem value="system" className="px-2 text-xs">
                {t("settings.system")}
              </ToggleGroupItem>
            </ToggleGroup>
          </Row>
          <Row label={t("settings.fontSize")} htmlFor={fontId}>
            <Select
              value={String(settings.fontSize)}
              onValueChange={(value) => onChange({ fontSize: Number(value) })}
            >
              <SelectTrigger id={fontId} size="sm" className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
          <Row label={t("settings.tabSize")}>
            <ToggleGroup
              type="single"
              size="sm"
              variant="outline"
              spacing={0}
              value={String(settings.tabSize)}
              onValueChange={(value) =>
                (value === "2" || value === "4") &&
                onChange({ tabSize: Number(value) as 2 | 4 })
              }
              aria-label={t("settings.tabSize")}
            >
              <ToggleGroupItem value="2" className="px-2.5 text-xs">
                2
              </ToggleGroupItem>
              <ToggleGroupItem value="4" className="px-2.5 text-xs">
                4
              </ToggleGroupItem>
            </ToggleGroup>
          </Row>
          <SwitchRow
            label={t("settings.minimap")}
            checked={settings.minimap}
            onCheckedChange={(minimap) => onChange({ minimap })}
          />
          <SwitchRow
            label={t("settings.wordWrap")}
            checked={settings.wordWrap}
            onCheckedChange={(wordWrap) => onChange({ wordWrap })}
          />

          <Separator className="my-2" />
          <h2 className="text-sm font-medium">{t("settings.execution")}</h2>
          <Row label={t("settings.timeLimit")} htmlFor={timeoutId}>
            <Select
              value={String(settings.timeoutMs)}
              onValueChange={(value) => onChange({ timeoutMs: Number(value) })}
            >
              <SelectTrigger id={timeoutId} size="sm" className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEOUTS.map((ms) => (
                  <SelectItem key={ms} value={String(ms)}>
                    {ms / 1000} s
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
          <SwitchRow
            label={t("settings.blockTypeErrors")}
            checked={settings.blockRunOnTypeErrors}
            onCheckedChange={(blockRunOnTypeErrors) =>
              onChange({ blockRunOnTypeErrors })
            }
          />
          <SwitchRow
            label={t("settings.clearConsole")}
            checked={settings.clearConsoleOnRun}
            onCheckedChange={(clearConsoleOnRun) =>
              onChange({ clearConsoleOnRun })
            }
          />

          <Separator className="my-2" />
          <h2 className="text-sm font-medium">{t("settings.downloads")}</h2>
          <SwitchRow
            label={t("settings.askBeforeDownload")}
            checked={settings.askBeforeDownload}
            onCheckedChange={(askBeforeDownload) =>
              onChange({ askBeforeDownload })
            }
          />
          <DownloadedLanguages />

          <Separator className="my-2" />
          <h2 className="text-sm font-medium">{t("settings.shortcuts")}</h2>
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-xs">
            {SHORTCUTS.map(([action, keys]) => (
              <div key={action} className="contents">
                <dt className="text-muted-foreground">{t(action)}</dt>
                <dd>
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                    {keys}
                  </kbd>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </PopoverContent>
    </Popover>
  );
}
