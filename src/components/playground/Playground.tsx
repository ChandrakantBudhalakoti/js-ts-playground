"use client";

import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { ConsolePanel } from "@/components/console/ConsolePanel";
import { ProblemsPanel } from "@/components/diagnostics/ProblemsPanel";
import type { CodeEditorHandle, CodeKey } from "@/components/editor/CodeEditor";
import { CodeKeys } from "@/components/editor/CodeKeys";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { InputPanel } from "@/components/input/InputPanel";
import { createEditorHost, EditorSlot } from "@/components/layout/EditorSlot";
import {
  PlaygroundLayout,
  type PanelView,
} from "@/components/layout/PlaygroundLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getClangClient } from "@/hooks/useClang";
import { useCodeExecution } from "@/hooks/useCodeExecution";
import { getCompilerClient, useCompilerState } from "@/hooks/useCompiler";
import { useDiagnostics } from "@/hooks/useDiagnostics";
import { useEditorSettings } from "@/hooks/useEditorSettings";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useToolingStatus } from "@/hooks/useToolingStatus";
import type { ClangResult } from "@/lib/clang/protocol";
import { countBySeverity, hasBlockingErrors } from "@/lib/compiler/diagnostics";
import { FILE_NAMES } from "@/lib/compiler/options";
import type { CompileResult } from "@/lib/compiler/typescript";
import { entryToText } from "@/lib/console/format";
import {
  isClangLanguage,
  isJavaScriptLike,
  isLanguage,
  languageInfo,
} from "@/lib/languages";
import {
  DEFAULT_EXAMPLE,
  EXAMPLE_PARAM,
  findExample,
  isStarterCode,
} from "@/lib/examples";
import { onFormatError } from "@/lib/monaco/setup";
import {
  decodeShareHash,
  encodeShareHash,
  ShareError,
} from "@/lib/sharing/encode-code";
import { SITE_NAME } from "@/lib/site";
import { readJson, STORAGE_KEYS, writeStorage } from "@/lib/storage";
import type {
  CodeExample,
  ConsoleLevel,
  Diagnostic,
  Language,
  SourceLocation,
} from "@/types/playground";

function EditorPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      Loading editor…
    </div>
  );
}

// Monaco only works in the browser.
const CodeEditor = dynamic(() => import("@/components/editor/CodeEditor"), {
  ssr: false,
  loading: EditorPlaceholder,
});

const SANDBOX_URL = process.env.NEXT_PUBLIC_SANDBOX_URL || "/sandbox";
const DRAFT_SAVE_DELAY_MS = 400;
/** Links longer than this may be truncated by chat apps and some browsers. */
const LONG_URL_WARNING = 8_000;

interface CodeDocument {
  language: Language;
  code: string;
  /** Standard input (languages that read it). */
  stdin?: string;
}

interface PendingReplace {
  /** Confirmation dialog title. */
  title: string;
  doc: CodeDocument;
  /** Notification shown afterwards (with an Undo action if work was replaced). */
  notice: string;
  /** Also clear the console and stop any run (Reset). */
  resetExecution: boolean;
  /** The document comes from a share link in the URL hash. */
  shared: boolean;
}

/** How long the "Undo" action for a replaced document stays available. */
const UNDO_TOAST_MS = 10_000;

function parseDraft(value: unknown): CodeDocument | null {
  if (!value || typeof value !== "object") return null;
  const { language, code, stdin } = value as Record<string, unknown>;
  if (!isLanguage(language) || typeof code !== "string") return null;
  return typeof stdin === "string" && stdin
    ? { language, code, stdin }
    : { language, code };
}

/** The current URL without the document it may carry (share hash, `?example=`). */
function urlWithoutDocument(): URL {
  const url = new URL(window.location.href);
  url.searchParams.delete(EXAMPLE_PARAM);
  url.hash = "";
  return url;
}

/** Remove a document carried in the URL: a share-link hash or `?example=`. */
function clearUrlDocument() {
  const hasExample = new URLSearchParams(window.location.search).has(
    EXAMPLE_PARAM,
  );
  if (!window.location.hash && !hasExample) return;
  const url = urlWithoutDocument();
  window.history.replaceState(
    window.history.state,
    "",
    url.pathname + url.search,
  );
}

/** Lines of text, not counting the newline that ends the last one. */
function countLines(text: string): number {
  if (!text) return 0;
  return text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function Playground() {
  const [settings, updateSettings] = useEditorSettings();
  const compilerState = useCompilerState();
  const { resolvedTheme } = useTheme();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const execution = useCodeExecution(SANDBOX_URL);
  const { prepare: prepareRuntime } = execution;
  const {
    diagnostics,
    schedule: scheduleCheck,
    applyFor: applyDiagnosticsFor,
    clear: clearDiagnostics,
  } = useDiagnostics();

  const [language, setLanguage] = useState<Language>("typescript");
  const tooling = useToolingStatus(language, compilerState);
  const [stdin, setStdin] = useState("");
  const [loaded, setLoaded] = useState(false);
  // "code" shows the editor on phones; on desktop the bottom panel treats it as "console".
  const [view, setView] = useState<PanelView>("code");
  const [preparing, setPreparing] = useState(false);
  const [pendingReplace, setPendingReplace] = useState<PendingReplace | null>(
    null,
  );

  // Created once on the client; the editor is portaled into it (see EditorSlot).
  const [editorHost] = useState(() =>
    typeof document === "undefined" ? null : createEditorHost(),
  );
  const editorRef = useRef<CodeEditorHandle>(null);
  const codeRef = useRef("");
  const languageRef = useRef<Language>("typescript");
  const stdinRef = useRef("");
  /**
   * Code loaded from the URL (a share link or `?example=`); the URL is
   * cleared once the user edits it.
   */
  const sharedCodeRef = useRef<string | null>(null);
  const runToken = useRef(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const savePending = useRef(false);

  const saveDraft = useCallback(() => {
    clearTimeout(saveTimer.current);
    savePending.current = false;
    writeStorage(
      STORAGE_KEYS.draft,
      JSON.stringify({
        language: languageRef.current,
        code: codeRef.current,
        ...(stdinRef.current ? { stdin: stdinRef.current } : {}),
      }),
    );
  }, []);

  /** Start downloading what a language needs, so its first run is quick. */
  const prepareLanguage = useCallback(
    (next: Language) => {
      if (isClangLanguage(next)) getClangClient().start();
      prepareRuntime(languageInfo(next).runtime);
    },
    [prepareRuntime],
  );

  const scheduleSave = useCallback(() => {
    savePending.current = true;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveDraft, DRAFT_SAVE_DELAY_MS);
  }, [saveDraft]);

  // Never lose the last edits: flush a pending save when the page is hidden,
  // closed or reloaded, and when the playground unmounts.
  useEffect(() => {
    const flush = () => {
      if (savePending.current) saveDraft();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      flush();
    };
  }, [saveDraft]);

  /** Replace the document (examples, reset, shared links). Undoable in the editor. */
  const loadDocument = useCallback(
    (doc: CodeDocument, options: { shared?: boolean } = {}) => {
      sharedCodeRef.current = options.shared ? doc.code : null;
      if (!options.shared) clearUrlDocument();
      codeRef.current = doc.code;
      languageRef.current = doc.language;
      stdinRef.current = doc.stdin ?? "";
      setLanguage(doc.language);
      setStdin(stdinRef.current);
      editorRef.current?.replaceValue(doc.code);
      clearDiagnostics();
      scheduleCheck(doc.code, doc.language, 0);
      prepareLanguage(doc.language);
      saveDraft();
    },
    [clearDiagnostics, prepareLanguage, scheduleCheck, saveDraft],
  );

  // Initial document: share link > `?example=` > saved draft > default example.
  useEffect(() => {
    let cancelled = false;
    async function init() {
      let doc: CodeDocument | null = null;
      let shareError: unknown = null;
      try {
        doc = await decodeShareHash(window.location.hash);
      } catch (error) {
        shareError = error;
      }
      if (cancelled) return;
      if (shareError) {
        toast.error(
          shareError instanceof ShareError
            ? shareError.message
            : "The share link could not be opened.",
          {
            description: "Your last draft was opened instead.",
            duration: 8_000,
          },
        );
        clearUrlDocument();
      }
      let notice = "Loaded shared code";
      const exampleId = new URLSearchParams(window.location.search).get(
        EXAMPLE_PARAM,
      );
      if (!doc && !shareError && exampleId !== null) {
        const example = findExample(exampleId);
        if (example) {
          doc = {
            language: example.language,
            code: example.code,
            stdin: example.stdin,
          };
          notice = `Opened “${example.title}”`;
        } else {
          toast.error("That example does not exist.", {
            description: "Your last draft was opened instead.",
            // Shown while the editor may still be loading, like share errors.
            duration: 8_000,
          });
          clearUrlDocument();
        }
      }
      const draft = readJson(STORAGE_KEYS.draft, parseDraft);
      const shared = doc;
      if (shared) sharedCodeRef.current = shared.code;
      doc ??= draft ?? {
        language: "typescript",
        code: DEFAULT_EXAMPLE.typescript.code,
      };
      codeRef.current = doc.code;
      languageRef.current = doc.language;
      stdinRef.current = doc.stdin ?? "";
      setLanguage(doc.language);
      setStdin(stdinRef.current);
      setLoaded(true);
      scheduleCheck(doc.code, doc.language, 0);
      prepareLanguage(doc.language);
      if (shared) {
        // The saved draft is only overwritten once the URL's code is edited;
        // until then it can be brought back.
        const restorable =
          draft && !isStarterCode(draft.code) && draft.code !== shared.code
            ? draft
            : null;
        toast.success(
          notice,
          restorable
            ? {
                description: "Your previous draft is still available.",
                action: {
                  label: "Restore draft",
                  onClick: () => loadDocument(restorable),
                },
                duration: UNDO_TOAST_MS,
              }
            : undefined,
        );
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, [loadDocument, prepareLanguage, scheduleCheck]);

  useEffect(() => {
    onFormatError((error) =>
      toast.error("Could not format the code", {
        description: error.line
          ? `${error.message} (line ${error.line}, column ${error.column})`
          : error.message,
      }),
    );
    return () => onFormatError(null);
  }, []);

  const getInitialValue = useCallback(() => codeRef.current, []);

  const handleChange = useCallback(
    (value: string) => {
      codeRef.current = value;
      if (sharedCodeRef.current !== null && value !== sharedCodeRef.current) {
        sharedCodeRef.current = null;
        clearUrlDocument();
      }
      scheduleCheck(value, languageRef.current);
      scheduleSave();
    },
    [scheduleCheck, scheduleSave],
  );

  const handleLanguageChange = useCallback(
    (next: Language) => {
      if (next === languageRef.current) return;
      // Untouched starter code is swapped for the other language's starter.
      if (isStarterCode(codeRef.current)) {
        loadDocument({ language: next, code: DEFAULT_EXAMPLE[next].code });
        return;
      }
      languageRef.current = next;
      setLanguage(next);
      clearDiagnostics();
      scheduleCheck(codeRef.current, next, 0);
      prepareLanguage(next);
      saveDraft();
    },
    [clearDiagnostics, loadDocument, prepareLanguage, scheduleCheck, saveDraft],
  );

  const handleStdinChange = useCallback(
    (value: string) => {
      stdinRef.current = value;
      setStdin(value);
      scheduleSave();
    },
    [scheduleSave],
  );

  const handleRun = useCallback(async () => {
    const token = ++runToken.current;
    const code = editorRef.current?.getValue() ?? codeRef.current;
    const lang = languageRef.current;
    const info = languageInfo(lang);
    const input = info.stdin ? stdinRef.current : "";
    const clearConsole = settings.clearConsoleOnRun;
    setView("console");

    if (code.trim() === "") {
      execution.report({
        status: "idle",
        level: "info",
        message: "Nothing to run: the editor is empty.",
        clearConsole,
      });
      return;
    }

    const notices: { level: ConsoleLevel; message: string }[] = [];
    const common = {
      runtimeName: info.name,
      fileName: info.fileName,
      timeoutMs: settings.timeoutMs,
      clearConsole,
    };

    if (isClangLanguage(lang)) {
      const clang = getClangClient();
      // After a failed download, pressing Run tries again.
      clang.reset();
      const started = performance.now();
      let result: ClangResult;
      setPreparing(true);
      execution.announce(
        clang.state.status === "ready"
          ? `Compiling ${info.fileName}…`
          : `Compiling ${info.fileName} (the compiler downloads once, about ${info.download})…`,
        clearConsole,
      );
      try {
        result = await clang.compile(code, lang);
      } catch (error) {
        if (token !== runToken.current) return;
        setPreparing(false);
        execution.report({
          status: "failed",
          level: "error",
          message: `Cannot compile ${info.name}: ${error instanceof Error ? error.message : String(error)}`,
          clearConsole,
        });
        return;
      }
      if (token !== runToken.current) return; // Superseded by another Run, or stopped.
      setPreparing(false);
      applyDiagnosticsFor(code, lang, result.diagnostics);
      const errors = result.diagnostics.filter((d) => d.severity === "error");
      const warnings = result.diagnostics.filter(
        (d) => d.severity === "warning",
      );
      if (!result.binary) {
        execution.report({
          status: "failed",
          level: "error",
          message: `Compilation failed with ${plural(Math.max(errors.length, 1), "error")}. See the Problems panel.`,
          clearConsole,
        });
        setView("problems");
        return;
      }
      const seconds = (performance.now() - started) / 1000;
      notices.push({
        level: warnings.length > 0 ? "warn" : "debug",
        message:
          `Compiled ${info.fileName} in ${seconds.toFixed(1)} s` +
          (warnings.length > 0
            ? ` with ${plural(warnings.length, "warning")} (see the Problems panel).`
            : "."),
      });
      execution.run({
        ...common,
        runtime: "wasi",
        code: "",
        binary: result.binary,
        stdin: input,
        sourceMap: null,
        notices,
      });
      return;
    }

    if (!isJavaScriptLike(lang)) {
      execution.run({
        ...common,
        runtime: info.runtime,
        code,
        stdin: input,
        sourceMap: null,
      });
      return;
    }

    let result: CompileResult;
    setPreparing(true);
    try {
      result = await getCompilerClient().compile(code, lang);
    } catch (error) {
      if (token !== runToken.current) return;
      setPreparing(false);
      const message = error instanceof Error ? error.message : String(error);
      if (lang === "typescript") {
        execution.report({
          status: "failed",
          level: "error",
          message: `Cannot compile TypeScript: ${message}`,
          clearConsole,
        });
        return;
      }
      // JavaScript can still run without the checker.
      result = { js: code, sourceMap: null, diagnostics: [] };
      notices.push({
        level: "warn",
        message:
          "The syntax checker is unavailable; running the code unchecked.",
      });
    }
    if (token !== runToken.current) return; // Superseded by another Run, or stopped.
    setPreparing(false);
    // Shown only if the user has not edited since pressing Run; otherwise the
    // check for the newer code is left to finish.
    applyDiagnosticsFor(code, lang, result.diagnostics);

    const errors = result.diagnostics.filter((d) => d.severity === "error");
    const typeErrors = errors.filter((d) => d.source !== "syntax");
    if (hasBlockingErrors(result.diagnostics)) {
      const syntaxErrors = errors.length - typeErrors.length;
      execution.report({
        status: "failed",
        level: "error",
        message: `Fix ${plural(syntaxErrors, "syntax error")} before running. See the Problems panel.`,
        clearConsole,
      });
      setView("problems");
      return;
    }
    if (typeErrors.length > 0) {
      if (settings.blockRunOnTypeErrors) {
        execution.report({
          status: "failed",
          level: "error",
          message: `Run blocked by ${plural(typeErrors.length, "type error")}. Turn off "Block Run on type errors" in Settings to run anyway.`,
          clearConsole,
        });
        setView("problems");
        return;
      }
      notices.push({
        level: "warn",
        message: `Running with ${plural(typeErrors.length, "type error")}. See the Problems panel.`,
      });
    }

    execution.run({
      ...common,
      runtime: "js",
      code: result.js,
      fileName: FILE_NAMES[lang],
      sourceMap: result.sourceMap,
      notices,
    });
  }, [
    execution,
    applyDiagnosticsFor,
    settings.blockRunOnTypeErrors,
    settings.clearConsoleOnRun,
    settings.timeoutMs,
  ]);

  const runRef = useRef(handleRun);
  useEffect(() => {
    runRef.current = handleRun;
  }, [handleRun]);
  const runFromEditor = useCallback(() => void runRef.current(), []);

  // Ctrl/Cmd+Enter anywhere (the editor handles its own copy of the shortcut).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.key !== "Enter" ||
        !(event.ctrlKey || event.metaKey)
      )
        return;
      event.preventDefault();
      void runRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleStop = useCallback(() => {
    runToken.current++;
    if (preparing) {
      setPreparing(false);
      execution.report({
        status: "stopped",
        level: "warn",
        message: "Run cancelled.",
        clearConsole: false,
      });
      return;
    }
    execution.stop();
  }, [execution, preparing]);

  const { resetState } = execution;
  const applyReplace = useCallback(
    (replace: PendingReplace) => {
      const previous: CodeDocument = {
        language: languageRef.current,
        code: codeRef.current,
        stdin: stdinRef.current,
      };
      if (replace.resetExecution) resetState();
      loadDocument(replace.doc, { shared: replace.shared });
      if (!isStarterCode(previous.code) && previous.code !== replace.doc.code) {
        // Restores code *and* language; editor Undo restores the text too.
        toast(replace.notice, {
          action: { label: "Undo", onClick: () => loadDocument(previous) },
          duration: UNDO_TOAST_MS,
        });
      } else if (replace.shared) {
        toast.success(replace.notice);
      }
    },
    [loadDocument, resetState],
  );

  /** Ask before replacing code the user has written; starter code is replaced directly. */
  const replaceWithConfirmation = useCallback(
    (replace: PendingReplace) => {
      if (
        isStarterCode(codeRef.current) ||
        codeRef.current === replace.doc.code
      )
        applyReplace(replace);
      else setPendingReplace(replace);
    },
    [applyReplace],
  );

  const dismissReplace = useCallback(() => {
    // Declining a shared link removes it from the URL, so a reload opens the
    // user's own draft rather than the link.
    if (pendingReplace?.shared) clearUrlDocument();
    setPendingReplace(null);
  }, [pendingReplace]);

  // Back/forward or a pasted link changes the hash: offer that shared code.
  useEffect(() => {
    const onHashChange = async () => {
      try {
        const shared = await decodeShareHash(window.location.hash);
        if (!shared || shared.code === codeRef.current) return;
        replaceWithConfirmation({
          title: "Open the shared code?",
          doc: shared,
          notice: "Loaded shared code",
          resetExecution: false,
          shared: true,
        });
      } catch (error) {
        toast.error(
          error instanceof ShareError
            ? error.message
            : "The share link could not be opened.",
        );
        clearUrlDocument();
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [replaceWithConfirmation]);

  const handleReset = useCallback(() => {
    const lang = languageRef.current;
    replaceWithConfirmation({
      title: "Reset the editor?",
      doc: { language: lang, code: DEFAULT_EXAMPLE[lang].code },
      notice: "Editor reset",
      resetExecution: true,
      shared: false,
    });
  }, [replaceWithConfirmation]);

  const handleExample = useCallback(
    (example: CodeExample) =>
      replaceWithConfirmation({
        title: `Open “${example.title}”?`,
        doc: {
          language: example.language,
          code: example.code,
          stdin: example.stdin,
        },
        notice: `Opened “${example.title}”`,
        resetExecution: false,
        shared: false,
      }),
    [replaceWithConfirmation],
  );

  const handleShare = useCallback(async () => {
    const code = editorRef.current?.getValue() ?? codeRef.current;
    let hash: string;
    try {
      const lang = languageRef.current;
      hash = await encodeShareHash({
        language: lang,
        code,
        stdin: languageInfo(lang).stdin ? stdinRef.current : undefined,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not create a share link.",
      );
      return;
    }
    // The hash replaces any `?example=` the page was opened with.
    const base = urlWithoutDocument();
    const path = `${base.pathname}${base.search}#${hash}`;
    const url = `${base.origin}${path}`;
    window.history.replaceState(window.history.state, "", path);
    sharedCodeRef.current = code;
    const longNote =
      url.length > LONG_URL_WARNING
        ? " This link is long and may not work in every app."
        : "";
    // Phones and tablets: the system share sheet (messaging apps, etc.).
    if (
      typeof navigator.share === "function" &&
      window.matchMedia("(pointer: coarse)").matches
    ) {
      try {
        await navigator.share({
          title: `${languageInfo(languageRef.current).name} code on ${SITE_NAME}`,
          url,
        });
        return;
      } catch (error) {
        // Closing the share sheet is not an error; anything else falls back.
        if (error instanceof DOMException && error.name === "AbortError")
          return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(
        "Share link copied to clipboard",
        longNote ? { description: longNote.trim() } : undefined,
      );
    } catch {
      toast.message("Share link ready", {
        description: `Copy it from the address bar.${longNote}`,
      });
    }
  }, []);

  const handleSave = useCallback(() => {
    saveDraft();
    toast.success("Saved in this browser", { duration: 1500 });
  }, [saveDraft]);

  const navigate = useCallback(
    (location: SourceLocation) => {
      if (isDesktop === false) setView("code");
      requestAnimationFrame(() =>
        editorRef.current?.revealPosition(location.line, location.column),
      );
    },
    [isDesktop],
  );

  const pressKey = useCallback(
    (key: CodeKey) => editorRef.current?.pressKey(key),
    [],
  );

  const selectProblem = useCallback(
    (diagnostic: Diagnostic) =>
      navigate({ line: diagnostic.startLine, column: diagnostic.startColumn }),
    [navigate],
  );

  const copyConsole = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        execution.entries.map(entryToText).join("\n"),
      );
      return true;
    } catch {
      toast.error("Could not copy to the clipboard.");
      return false;
    }
  }, [execution.entries]);

  const busy = preparing || execution.status === "running";
  const theme = resolvedTheme === "light" ? "light" : "dark";

  return (
    <>
      <PlaygroundLayout
        isDesktop={isDesktop}
        view={view}
        onViewChange={setView}
        toolbar={
          <EditorToolbar
            language={language}
            onLanguageChange={handleLanguageChange}
            onExample={handleExample}
            status={preparing ? "running" : execution.status}
            durationMs={execution.durationMs}
            busy={busy}
            onRun={() => void handleRun()}
            onStop={handleStop}
            onFormat={() => void editorRef.current?.format()}
            canFormat={isJavaScriptLike(language)}
            onReset={handleReset}
            onShare={() => void handleShare()}
            settings={settings}
            onSettingsChange={updateSettings}
            tooling={tooling}
          />
        }
        editor={
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1">
              <EditorSlot host={editorHost} />
            </div>
            {/* Touch screens only: symbols and keys phone keyboards lack. */}
            <CodeKeys onKey={pressKey} className="hidden pointer-coarse:flex" />
          </div>
        }
        consolePanel={
          <ConsolePanel
            entries={execution.entries}
            dropped={execution.dropped}
            onNavigate={navigate}
            hint={
              tooling.status === "loading" && languageInfo(language).download
                ? `${languageInfo(language).name} is downloading (about ${languageInfo(language).download}, only the first time). Then it runs right in your browser.`
                : undefined
            }
          />
        }
        problemsPanel={
          <ProblemsPanel
            diagnostics={diagnostics}
            tooling={tooling}
            uncheckedLanguage={
              isJavaScriptLike(language) || isClangLanguage(language)
                ? null
                : languageInfo(language).name
            }
            onSelect={selectProblem}
          />
        }
        inputPanel={
          languageInfo(language).stdin ? (
            <InputPanel
              value={stdin}
              onChange={handleStdinChange}
              language={languageInfo(language).name}
            />
          ) : null
        }
        inputLines={countLines(stdin)}
        consoleCount={execution.entries.length}
        problemCounts={countBySeverity(diagnostics)}
        onClearConsole={execution.clear}
        onCopyConsole={copyConsole}
      />

      {/* Rendered once, outside the layouts, so switching layouts never
          remounts Monaco; EditorSlot moves the host node into place. */}
      {editorHost &&
        isDesktop !== null &&
        createPortal(
          loaded ? (
            <CodeEditor
              ref={editorRef}
              language={language}
              getInitialValue={getInitialValue}
              settings={settings}
              theme={theme}
              diagnostics={diagnostics}
              onChange={handleChange}
              onRun={runFromEditor}
              onSave={handleSave}
            />
          ) : (
            <EditorPlaceholder />
          ),
          editorHost,
        )}

      <AlertDialog
        open={pendingReplace !== null}
        onOpenChange={(open) => !open && dismissReplace()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingReplace?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              Your current code will be replaced. You can bring it back with the
              Undo button in the notification that follows, or with Undo (Ctrl/⌘
              + Z) in the editor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const replace = pendingReplace;
                setPendingReplace(null);
                if (replace) applyReplace(replace);
              }}
            >
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
