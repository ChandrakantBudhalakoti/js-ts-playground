"use client";

import {
  Braces,
  CircleAlert,
  Ellipsis,
  Loader2,
  Play,
  RotateCcw,
  Share2,
  Square,
  WandSparkles,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GitHubIcon } from "@/components/site/GitHubIcon";
import type { CompilerState } from "@/lib/compiler/compiler-client";
import { REPO_URL } from "@/lib/site";
import type {
  CodeExample,
  EditorSettings,
  ExecutionStatus,
  Language,
} from "@/types/playground";
import { ExamplesMenu } from "./ExamplesMenu";
import { ExecutionStatusBadge } from "./ExecutionStatusBadge";
import { LanguageSelector } from "./LanguageSelector";
import { SettingsPopover } from "./SettingsPopover";

interface EditorToolbarProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
  onExample: (example: CodeExample) => void;
  status: ExecutionStatus;
  durationMs: number | null;
  /** True while compiling or executing. */
  busy: boolean;
  onRun: () => void;
  onStop: () => void;
  onFormat: () => void;
  onReset: () => void;
  onShare: () => void;
  settings: EditorSettings;
  onSettingsChange: (patch: Partial<EditorSettings>) => void;
  compilerState: CompilerState;
}

function IconAction({
  label,
  shortcut,
  children,
  ...props
}: { label: string; shortcut?: string; children: ReactNode } & ComponentProps<
  typeof Button
>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={label} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut && <span className="ml-1.5 opacity-70">{shortcut}</span>}
      </TooltipContent>
    </Tooltip>
  );
}

function CompilerIndicator({ state }: { state: CompilerState }) {
  return (
    <span
      data-testid="compiler-status"
      data-status={state.status}
      className="contents"
    >
      <CompilerIndicatorContent state={state} />
    </span>
  );
}

function CompilerIndicatorContent({ state }: { state: CompilerState }) {
  if (state.status === "ready") {
    return (
      <span className="hidden text-xs text-muted-foreground lg:inline">
        TypeScript {state.version}
      </span>
    );
  }
  if (state.status === "loading") {
    return (
      <span className="hidden items-center gap-1 text-xs text-muted-foreground lg:flex">
        <Loader2 className="size-3 animate-spin" aria-hidden />
        Loading TypeScript…
      </span>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"
          tabIndex={0}
        >
          <CircleAlert className="size-3.5" aria-hidden />
          <span className="hidden lg:inline">Type checking unavailable</span>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{state.message}</TooltipContent>
    </Tooltip>
  );
}

export function EditorToolbar(props: EditorToolbarProps) {
  const { busy, onRun, onStop, onFormat, onReset, onShare } = props;

  return (
    <header className="flex h-12 shrink-0 items-center gap-1.5 border-b bg-background px-2 sm:gap-2 sm:px-3">
      <h1 className="pr-1 text-sm font-semibold tracking-tight">
        {/* A full page load (not next/link): see PlaygroundLink. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className="flex items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Braces className="size-3.5" aria-hidden />
          </span>
          <span className="sr-only md:not-sr-only">JS/TS Playground</span>
        </a>
      </h1>

      <LanguageSelector
        value={props.language}
        onChange={props.onLanguageChange}
      />
      <ExamplesMenu onSelect={props.onExample} />

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <CompilerIndicator state={props.compilerState} />
        <ExecutionStatusBadge
          status={props.status}
          durationMs={props.durationMs}
        />

        {busy ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={onStop}
            aria-label="Stop"
            data-testid="stop-button"
          >
            <Square className="fill-current" aria-hidden />
            Stop
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                onClick={onRun}
                aria-label="Run"
                data-testid="run-button"
                className="bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-800"
              >
                <Play className="fill-current" aria-hidden />
                Run
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Run <span className="ml-1.5 opacity-70">Ctrl/⌘ + Enter</span>
            </TooltipContent>
          </Tooltip>
        )}

        <div className="hidden items-center gap-0.5 sm:flex">
          <IconAction
            label="Format"
            shortcut="Shift + Alt + F"
            onClick={onFormat}
          >
            <WandSparkles aria-hidden />
          </IconAction>
          <IconAction label="Reset" onClick={onReset}>
            <RotateCcw aria-hidden />
          </IconAction>
          <IconAction label="Share" onClick={onShare}>
            <Share2 aria-hidden />
          </IconAction>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="More actions"
              className="sm:hidden"
            >
              <Ellipsis aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onFormat}>
              <WandSparkles aria-hidden /> Format
              <DropdownMenuShortcut>⇧⌥F</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onReset}>
              <RotateCcw aria-hidden /> Reset
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onShare}>
              <Share2 aria-hidden /> Share
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <SettingsPopover
          settings={props.settings}
          onChange={props.onSettingsChange}
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              variant="ghost"
              size="icon-sm"
              className="hidden md:inline-flex"
            >
              <a href={REPO_URL} aria-label="Source code on GitHub">
                <GitHubIcon className="size-4" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Source code on GitHub</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
