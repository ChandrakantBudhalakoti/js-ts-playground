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

const SHORTCUTS: [string, string][] = [
  ["Run", "Ctrl/⌘ + Enter"],
  ["Format", "Shift + Alt + F"],
  ["Command palette", "F1"],
  ["Toggle Tab moves focus", "Ctrl + M"],
];

export function SettingsPopover({ settings, onChange }: SettingsPopoverProps) {
  const { theme = "dark", setTheme } = useTheme();
  const fontId = useId();
  const timeoutId = useId();

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Settings">
              <Settings aria-hidden />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Settings</TooltipContent>
      </Tooltip>
      <PopoverContent
        align="end"
        collisionPadding={8}
        className="max-h-(--radix-popover-content-available-height) w-80 overflow-y-auto p-4"
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Editor</h2>
          <Row label="Theme">
            <ToggleGroup
              type="single"
              size="sm"
              variant="outline"
              spacing={0}
              value={theme}
              onValueChange={(value) => value && setTheme(value)}
              aria-label="Theme"
            >
              <ToggleGroupItem value="dark" className="px-2 text-xs">
                Dark
              </ToggleGroupItem>
              <ToggleGroupItem value="light" className="px-2 text-xs">
                Light
              </ToggleGroupItem>
              <ToggleGroupItem value="system" className="px-2 text-xs">
                System
              </ToggleGroupItem>
            </ToggleGroup>
          </Row>
          <Row label="Font size" htmlFor={fontId}>
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
          <Row label="Tab size">
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
              aria-label="Tab size"
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
            label="Minimap"
            checked={settings.minimap}
            onCheckedChange={(minimap) => onChange({ minimap })}
          />
          <SwitchRow
            label="Word wrap"
            checked={settings.wordWrap}
            onCheckedChange={(wordWrap) => onChange({ wordWrap })}
          />

          <Separator className="my-2" />
          <h2 className="text-sm font-medium">Execution</h2>
          <Row label="Time limit" htmlFor={timeoutId}>
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
            label="Block Run on type errors"
            checked={settings.blockRunOnTypeErrors}
            onCheckedChange={(blockRunOnTypeErrors) =>
              onChange({ blockRunOnTypeErrors })
            }
          />
          <SwitchRow
            label="Clear console on Run"
            checked={settings.clearConsoleOnRun}
            onCheckedChange={(clearConsoleOnRun) =>
              onChange({ clearConsoleOnRun })
            }
          />

          <Separator className="my-2" />
          <h2 className="text-sm font-medium">Downloaded languages</h2>
          <SwitchRow
            label="Ask before downloading"
            checked={settings.askBeforeDownload}
            onCheckedChange={(askBeforeDownload) =>
              onChange({ askBeforeDownload })
            }
          />
          <DownloadedLanguages />

          <Separator className="my-2" />
          <h2 className="text-sm font-medium">Shortcuts</h2>
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-xs">
            {SHORTCUTS.map(([action, keys]) => (
              <div key={action} className="contents">
                <dt className="text-muted-foreground">{action}</dt>
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
