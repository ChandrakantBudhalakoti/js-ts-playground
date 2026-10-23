"use client";

import Editor, {
  loader,
  type BeforeMount,
  type OnMount,
} from "@monaco-editor/react";
import { Loader2 } from "lucide-react";
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  configureMonaco,
  MARKER_OWNER,
  MODEL_URI,
  MONACO_THEMES,
  MONACO_VS_PATH,
  toMarkers,
  type Monaco,
  type MonacoEditor,
} from "@/lib/monaco/setup";
import type { Diagnostic, EditorSettings, Language } from "@/types/playground";

loader.config({ paths: { vs: MONACO_VS_PATH } });

export interface CodeEditorHandle {
  getValue(): string;
  /** Replace the whole document as one undoable edit. */
  replaceValue(value: string): void;
  revealPosition(line: number, column: number): void;
  focus(): void;
  format(): Promise<void>;
  /** A key from the on-screen code keys (touch screens), as if typed. */
  pressKey(key: CodeKey): void;
}

/** Text to type, or an editor command (Tab, arrows, undo). */
export type CodeKey =
  | { text: string }
  | {
      command:
        | "tab"
        | "cursorLeft"
        | "cursorRight"
        | "cursorUp"
        | "cursorDown"
        | "undo"
        | "redo";
    };

interface CodeEditorProps {
  ref?: Ref<CodeEditorHandle>;
  language: Language;
  /** Read once when the editor mounts. */
  getInitialValue: () => string;
  settings: EditorSettings;
  theme: "dark" | "light";
  diagnostics: Diagnostic[];
  onChange: (value: string) => void;
  onRun: () => void;
  onSave: () => void;
}

const FONT_FAMILY =
  "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

function EditorLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      Loading editor…
    </div>
  );
}

export default function CodeEditor({
  ref,
  language,
  getInitialValue,
  settings,
  theme,
  diagnostics,
  onChange,
  onRun,
  onSave,
}: CodeEditorProps) {
  const editorRef = useRef<MonacoEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const pendingValue = useRef<string | null>(null);
  const callbacks = useRef({ onRun, onSave, getInitialValue });
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Language the model is created with; later changes are applied in place.
  const [initialLanguage] = useState(language);

  useEffect(() => {
    callbacks.current = { onRun, onSave, getInitialValue };
  }, [onRun, onSave, getInitialValue]);

  // @monaco-editor/react disposes the editor on unmount; forget it too.
  useEffect(
    () => () => {
      editorRef.current = null;
      monacoRef.current = null;
    },
    [],
  );

  useEffect(() => {
    const init = loader.init();
    init.then(undefined, (error: { type?: string; message?: string }) => {
      if (error?.type === "cancelation") return;
      setLoadError(error?.message || "The code editor failed to load.");
    });
    return () => init.cancel();
  }, []);

  const handleBeforeMount: BeforeMount = (monaco) => {
    configureMonaco(monaco as unknown as Monaco);
  };

  const handleMount: OnMount = (editor, monacoInstance) => {
    const monaco = monacoInstance as unknown as Monaco;
    editorRef.current = editor as unknown as MonacoEditor;
    monacoRef.current = monaco;

    const initial = pendingValue.current ?? callbacks.current.getInitialValue();
    pendingValue.current = null;
    if (editor.getValue() !== initial) editor.setValue(initial);

    editor.addAction({
      id: "playground.run",
      label: "Run Code",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      contextMenuGroupId: "navigation",
      contextMenuOrder: 0,
      run: () => callbacks.current.onRun(),
    });
    editor.addAction({
      id: "playground.save",
      label: "Save Draft",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => callbacks.current.onSave(),
    });

    // Re-measure once the web font is ready so the cursor lines up.
    void document.fonts?.ready.then(() => monaco.editor.remeasureFonts());
    setReady(true);
  };

  // Change the language of the one model in place, so its undo history
  // (including edits made just before a language switch) is preserved.
  useEffect(() => {
    const model = editorRef.current?.getModel();
    const monaco = monacoRef.current;
    if (!ready || !model || !monaco) return;
    if (model.getLanguageId() !== language) {
      monaco.editor.setModelLanguage(model, language);
    }
  }, [language, ready]);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();
    if (!ready || !monaco || !model) return;
    monaco.editor.setModelMarkers(
      model,
      MARKER_OWNER,
      toMarkers(monaco, diagnostics),
    );
  }, [diagnostics, language, ready]);

  useImperativeHandle(
    ref,
    () => ({
      // Until Monaco has mounted, the document is the pending replacement or
      // the initial value, never an empty string.
      getValue: () =>
        editorRef.current?.getModel()?.getValue() ??
        pendingValue.current ??
        callbacks.current.getInitialValue(),
      replaceValue: (value: string) => {
        const editor = editorRef.current;
        const model = editor?.getModel();
        if (!editor || !model) {
          pendingValue.current = value;
          return;
        }
        if (model.getValue() === value) return;
        editor.pushUndoStop();
        editor.executeEdits("playground", [
          { range: model.getFullModelRange(), text: value },
        ]);
        editor.pushUndoStop();
        editor.setPosition({ lineNumber: 1, column: 1 });
        editor.revealLine(1);
      },
      revealPosition: (line: number, column: number) => {
        const editor = editorRef.current;
        if (!editor) return;
        const position = { lineNumber: line, column };
        editor.setPosition(position);
        editor.revealPositionInCenterIfOutsideViewport(position);
        editor.focus();
      },
      focus: () => editorRef.current?.focus(),
      pressKey: (key: CodeKey) => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.focus();
        // As keyboard input, "type" goes through auto-closing brackets and
        // auto-indent, like a key on a real keyboard.
        if ("text" in key)
          editor.trigger("keyboard", "type", { text: key.text });
        else editor.trigger("keyboard", key.command, null);
      },
      format: async () => {
        await editorRef.current
          ?.getAction("editor.action.formatDocument")
          ?.run();
      },
    }),
    [],
  );

  // Phones get a slimmer gutter; touch screens keep the native long-press
  // menu and selection instead of Monaco's context menu and text dragging.
  const compact = useMediaQuery("(max-width: 639px)") === true;
  const touch = useMediaQuery("(pointer: coarse)") === true;

  const options = useMemo(
    () => ({
      fontSize: settings.fontSize,
      fontFamily: FONT_FAMILY,
      fontLigatures: false,
      tabSize: settings.tabSize,
      insertSpaces: true,
      detectIndentation: false,
      minimap: { enabled: settings.minimap },
      wordWrap: settings.wordWrap ? ("on" as const) : ("off" as const),
      automaticLayout: true,
      scrollBeyondLastLine: false,
      padding: { top: compact ? 8 : 12, bottom: 12 },
      lineNumbersMinChars: compact ? 2 : 3,
      lineDecorationsWidth: compact ? 6 : 10,
      folding: !compact,
      contextmenu: !touch,
      dragAndDrop: !touch,
      renderLineHighlight: "all" as const,
      smoothScrolling: true,
      cursorBlinking: "smooth" as const,
      fixedOverflowWidgets: true,
      ariaLabel: "Code editor",
      quickSuggestions: { other: true, comments: false, strings: false },
      suggestOnTriggerCharacters: true,
      parameterHints: { enabled: true },
      hover: { enabled: "on" as const, delay: 300 },
      matchBrackets: "always" as const,
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: "active" as const, indentation: true },
      autoClosingBrackets: "languageDefined" as const,
      tabCompletion: "on" as const,
      formatOnPaste: false,
      stickyScroll: { enabled: false },
      scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
    }),
    [
      settings.fontSize,
      settings.tabSize,
      settings.minimap,
      settings.wordWrap,
      compact,
      touch,
    ],
  );

  if (loadError) {
    return (
      <div
        role="alert"
        className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm"
      >
        <p className="font-medium text-destructive">
          The code editor could not be loaded.
        </p>
        <p className="max-w-md text-muted-foreground">{loadError}</p>
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </div>
    );
  }

  return (
    <Editor
      className="h-full"
      defaultLanguage={initialLanguage}
      defaultPath={MODEL_URI}
      defaultValue=""
      theme={MONACO_THEMES[theme]}
      options={options}
      loading={<EditorLoading />}
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      onChange={(value) => onChange(value ?? "")}
    />
  );
}
