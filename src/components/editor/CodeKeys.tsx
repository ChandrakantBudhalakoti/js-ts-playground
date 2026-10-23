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
import { cn } from "@/lib/utils";

interface KeyDef {
  key: CodeKey;
  label: ReactNode;
  name: string;
}

const COMMANDS: KeyDef[] = [
  { key: { command: "tab" }, label: <ArrowRightToLine />, name: "Tab" },
  { key: { command: "cursorLeft" }, label: <ArrowLeft />, name: "Left" },
  { key: { command: "cursorRight" }, label: <ArrowRight />, name: "Right" },
  { key: { command: "cursorUp" }, label: <ArrowUp />, name: "Up" },
  { key: { command: "cursorDown" }, label: <ArrowDown />, name: "Down" },
  { key: { command: "undo" }, label: <Undo2 />, name: "Undo" },
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
  return (
    <div
      role="toolbar"
      aria-label="Code keys"
      data-testid="code-keys"
      className={cn(
        "flex shrink-0 gap-1 overflow-x-auto overscroll-x-contain border-t bg-background px-1.5 py-1.5 [scrollbar-width:none]",
        className,
      )}
    >
      {KEYS.map(({ key, label, name }) => (
        <button
          key={name}
          type="button"
          aria-label={name}
          title={name}
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
