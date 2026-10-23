"use client";

import { Check, Copy, Loader2, Trash2 } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useVisualViewport } from "@/hooks/useVisualViewport";
import { cn } from "@/lib/utils";

export type PanelView = "code" | "console" | "problems" | "input";

interface ProblemCounts {
  errors: number;
  warnings: number;
  infos: number;
}

interface PlaygroundLayoutProps {
  /** `null` until the viewport size is known on the client. */
  isDesktop: boolean | null;
  toolbar: ReactNode;
  editor: ReactNode;
  consolePanel: ReactNode;
  problemsPanel: ReactNode;
  /** Standard input editor; null for languages that do not read input. */
  inputPanel: ReactNode | null;
  /** Lines of standard input, shown as a count on the tab. */
  inputLines: number;
  view: PanelView;
  onViewChange: (view: PanelView) => void;
  consoleCount: number;
  problemCounts: ProblemCounts;
  onClearConsole: () => void;
  onCopyConsole: () => Promise<boolean>;
}

function CountBadge({
  count,
  tone = "neutral",
}: {
  count: number;
  tone?: "neutral" | "error" | "warning";
}) {
  if (count === 0) return null;
  return (
    <span
      className={cn(
        "min-w-5 rounded-full px-1.5 text-[11px] leading-4 font-medium tabular-nums",
        tone === "neutral" && "bg-muted text-muted-foreground",
        tone === "error" && "bg-red-500/15 text-red-700 dark:text-red-300",
        tone === "warning" &&
          "bg-amber-500/15 text-amber-700 dark:text-amber-300",
      )}
    >
      {count > 999 ? "999+" : count}
    </span>
  );
}

function ProblemsBadge({ counts }: { counts: ProblemCounts }) {
  return (
    <>
      <CountBadge count={counts.errors} tone="error" />
      <CountBadge count={counts.warnings} tone="warning" />
      <CountBadge count={counts.infos} />
    </>
  );
}

function ConsoleActions({
  onClear,
  onCopy,
  disabled,
}: {
  onClear: () => void;
  onCopy: () => Promise<boolean>;
  disabled: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Copy output"
            disabled={disabled}
            onClick={async () => {
              if (await onCopy()) {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }
            }}
          >
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{copied ? "Copied" : "Copy output"}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Clear console"
            disabled={disabled}
            onClick={onClear}
          >
            <Trash2 aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Clear console</TooltipContent>
      </Tooltip>
    </div>
  );
}

const TRIGGER =
  "h-9 flex-none gap-1.5 px-2 text-xs pointer-coarse:h-11 pointer-coarse:px-2.5 pointer-coarse:text-sm";

export function PlaygroundLayout(props: PlaygroundLayoutProps) {
  const { isDesktop, onViewChange } = props;
  // Touch screens: stay inside the visible area when the keyboard is open.
  const visible = useVisualViewport();
  const rootStyle: CSSProperties | undefined = visible
    ? {
        position: "fixed",
        insetInline: 0,
        top: visible.offsetTop,
        height: visible.height,
      }
    : undefined;
  const hasInput = props.inputPanel !== null;
  // The Input tab disappears for languages without standard input.
  const view = props.view === "input" && !hasInput ? "console" : props.view;
  const actions =
    view === "console" ? (
      <ConsoleActions
        onClear={props.onClearConsole}
        onCopy={props.onCopyConsole}
        disabled={props.consoleCount === 0}
      />
    ) : null;

  const consoleTrigger = (
    <TabsTrigger value="console" className={TRIGGER}>
      Console <CountBadge count={props.consoleCount} />
    </TabsTrigger>
  );
  const problemsTrigger = (
    <TabsTrigger value="problems" className={TRIGGER}>
      Problems <ProblemsBadge counts={props.problemCounts} />
    </TabsTrigger>
  );
  const inputTrigger = hasInput && (
    <TabsTrigger value="input" className={TRIGGER}>
      Input <CountBadge count={props.inputLines} />
    </TabsTrigger>
  );

  if (isDesktop === null) {
    // Viewport unknown during SSR/hydration: render a neutral shell.
    return (
      <div className="flex h-dvh flex-col overflow-hidden" style={rootStyle}>
        {props.toolbar}
        <div
          className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground"
          aria-busy="true"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading editor…
        </div>
      </div>
    );
  }

  if (isDesktop) {
    const bottomView = view === "code" ? "console" : view;
    return (
      <div className="flex h-dvh flex-col overflow-hidden" style={rootStyle}>
        {props.toolbar}
        <ResizablePanelGroup orientation="vertical" className="min-h-0 flex-1">
          <ResizablePanel id="editor" defaultSize="64%" minSize="20%">
            <main className="h-full" aria-label="Editor">
              {props.editor}
            </main>
          </ResizablePanel>
          <ResizableHandle withHandle aria-label="Resize output panel" />
          <ResizablePanel id="output" defaultSize="36%" minSize="12%">
            <Tabs
              value={bottomView}
              onValueChange={(value) => onViewChange(value as PanelView)}
              className="flex h-full flex-col gap-0"
            >
              <div className="flex shrink-0 items-center justify-between border-b pr-2 pl-1">
                <TabsList
                  variant="line"
                  className="h-9 min-w-0 overflow-x-auto pointer-coarse:h-11"
                >
                  {consoleTrigger}
                  {problemsTrigger}
                  {inputTrigger}
                </TabsList>
                {actions}
              </div>
              <TabsContent value="console" className="min-h-0 overflow-hidden">
                {props.consolePanel}
              </TabsContent>
              <TabsContent value="problems" className="min-h-0 overflow-hidden">
                {props.problemsPanel}
              </TabsContent>
              {hasInput && (
                <TabsContent value="input" className="min-h-0 overflow-hidden">
                  {props.inputPanel}
                </TabsContent>
              )}
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden" style={rootStyle}>
      {props.toolbar}
      <Tabs
        value={view}
        onValueChange={(value) => onViewChange(value as PanelView)}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <div className="flex shrink-0 items-center justify-between border-b pr-2 pl-1">
          <TabsList
            variant="line"
            className="h-9 min-w-0 overflow-x-auto pointer-coarse:h-11"
          >
            <TabsTrigger value="code" className={TRIGGER}>
              Code
            </TabsTrigger>
            {consoleTrigger}
            {problemsTrigger}
            {inputTrigger}
          </TabsList>
          {actions}
        </div>
        <div className="relative min-h-0 flex-1">
          {/* The editor stays mounted (and sized) so switching tabs keeps its state. */}
          <TabsContent
            value="code"
            forceMount
            className="absolute inset-0 data-[state=inactive]:invisible"
            aria-label="Editor"
          >
            {props.editor}
          </TabsContent>
          <TabsContent value="console" className="absolute inset-0">
            {props.consolePanel}
          </TabsContent>
          <TabsContent value="problems" className="absolute inset-0">
            {props.problemsPanel}
          </TabsContent>
          {hasInput && (
            <TabsContent value="input" className="absolute inset-0">
              {props.inputPanel}
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
