"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowRightToLine,
  ArrowUp,
  Undo2,
} from "lucide-react";
import type { ReactNode } from "react";
import type { CodeKey } from "@/components/editor/CodeEditor";
import { useT } from "@/hooks/useLocale";
import type { MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface KeyDef {
  key: CodeKey;
  label: ReactNode;
  name: string;
  /** Its accessible name in the interface language, unless it is a symbol. */
  message?: MessageKey;
}

const COMMANDS: KeyDef[] = [
  {
    key: { command: "tab" },
    label: <ArrowRightToLine />,
    name: "Tab",
    message: "keys.tab",
  },
  {
    key: { command: "cursorLeft" },
    label: <ArrowLeft />,
    name: "Left",
    message: "keys.left",
  },
  {
    key: { command: "cursorRight" },
    label: <ArrowRight />,
    name: "Right",
    message: "keys.right",
  },
  {
    key: { command: "cursorUp" },
    label: <ArrowUp />,
    name: "Up",
    message: "keys.up",
  },
  {
    key: { command: "cursorDown" },
    label: <ArrowDown />,
    name: "Down",
    message: "keys.down",
  },
  {
    key: { command: "undo" },
    label: <Undo2 />,
    name: "Undo",
    message: "keys.undo",
  },
];

/** Characters that take two or three taps on phone keyboards. */
const SYMBOLS = [
  "{",
  "}",
  "(",
  ")",
  "[",
  "]",
  ";",
  ":",
  "=",
  '"',
  "'",
  "<",
  ">",
  "+",
  "-",
  "*",
  "/",
  "%",
  "!",
  "&",
  "|",
  "_",
  "#",
  ",",
  ".",
  "\\",
  "?",
];

const KEYS: KeyDef[] = [
  ...COMMANDS,
  ...SYMBOLS.map((symbol) => ({
    key: { text: symbol },
    label: symbol,
    name: symbol,
  })),
];

/**
 * A row of keys for code on touch screens: Tab, cursor keys, undo and the
 * symbols phone keyboards hide behind extra layouts. Pressing one never
 * moves focus away from the editor, so the keyboard stays open.
 */
export function CodeKeys({
  onKey,
  className,
}: {
  onKey: (key: CodeKey) => void;
  className?: string;
}) {
  const t = useT();
  return (
    <div
      role="toolbar"
      aria-label={t("keys.toolbar")}
      data-testid="code-keys"
      className={cn(
        "flex shrink-0 gap-1 overflow-x-auto overscroll-x-contain border-t bg-background px-1.5 py-1.5 [scrollbar-width:none]",
        className,
      )}
    >
      {KEYS.map(({ key, label, name, message }) => (
        <button
          key={name}
          type="button"
          aria-label={message ? t(message) : name}
          title={message ? t(message) : name}
          // Keep the editor focused (and the on-screen keyboard open).
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => onKey(key)}
          className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-md border bg-muted/40 px-2 font-mono text-base text-foreground active:bg-muted [&_svg]:size-4"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
