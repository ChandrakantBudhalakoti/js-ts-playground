import type * as MonacoNamespace from "monaco-editor";
import { SHARED_COMPILER_OPTIONS } from "@/lib/compiler/options";
import { FormatError, formatCode } from "@/lib/format/prettier";
import type { Diagnostic, ScriptLanguage } from "@/types/playground";

export type Monaco = typeof MonacoNamespace;
export type MonacoEditor = MonacoNamespace.editor.IStandaloneCodeEditor;

export const MONACO_VERSION = "0.57.0";
/** Self-hosted copy of monaco-editor/min/vs (see scripts/copy-monaco.mjs). */
export const MONACO_VS_PATH = `/vendor/monaco/${MONACO_VERSION}/vs`;

export const MONACO_THEMES = {
  dark: "playground-dark",
  light: "playground-light",
} as const;

/**
 * One model for both languages; switching language changes the model's
 * language in place, keeping undo history. The URI has no extension, so
 * Monaco's TypeScript service picks the script kind from `allowJs`, which is
 * off for TypeScript and on for JavaScript (see configureMonaco).
 */
export const MODEL_URI = "file:///main";

export const MARKER_OWNER = "playground";

type FormatListener = (error: FormatError) => void;
let formatErrorListener: FormatListener | null = null;

/** Receive Prettier failures from Monaco's "Format Document" command. */
export function onFormatError(listener: FormatListener | null) {
  formatErrorListener = listener;
}

let configured = false;

/**
 * One-time Monaco configuration: align its TypeScript service with the
 * playground compiler, hand diagnostics and formatting to our own pipeline,
 * and register themes.
 */
export function configureMonaco(monaco: Monaco) {
  if (configured) return;
  configured = true;

  const { typescriptDefaults, javascriptDefaults } = monaco.typescript;
  for (const defaults of [typescriptDefaults, javascriptDefaults]) {
    defaults.setCompilerOptions({
      ...SHARED_COMPILER_OPTIONS,
      lib: [...SHARED_COMPILER_OPTIONS.lib],
      // MODEL_URI has no extension: `allowJs` decides the script kind.
      allowJs: defaults === javascriptDefaults,
    });
    // Diagnostics come from the compiler worker so markers and the Problems
    // panel share a single source of truth.
    defaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
    });
    defaults.setModeConfiguration({
      completionItems: true,
      hovers: true,
      documentSymbols: true,
      definitions: true,
      references: true,
      documentHighlights: true,
      rename: true,
      diagnostics: false,
      signatureHelp: true,
      codeActions: true,
      inlayHints: false,
      // Prettier handles formatting.
      documentRangeFormattingEdits: false,
      onTypeFormattingEdits: false,
    });
    defaults.setEagerModelSync(true);
  }

  monaco.languages.registerDocumentFormattingEditProvider(
    ["javascript", "typescript"],
    {
      displayName: "Prettier",
      async provideDocumentFormattingEdits(model, options) {
        const language: ScriptLanguage =
          model.getLanguageId() === "typescript" ? "typescript" : "javascript";
        try {
          const text = await formatCode(model.getValue(), language, {
            tabWidth: options.tabSize,
          });
          return [{ range: model.getFullModelRange(), text }];
        } catch (error) {
          formatErrorListener?.(
            error instanceof FormatError
              ? error
              : new FormatError(String(error)),
          );
          return [];
        }
      },
    },
  );

  monaco.editor.defineTheme(MONACO_THEMES.dark, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#121316",
      "editor.lineHighlightBackground": "#ffffff08",
      "editorLineNumber.foreground": "#5c6370",
      "editorLineNumber.activeForeground": "#c8ccd4",
      "editorGutter.background": "#121316",
      "editorWidget.background": "#17181b",
      "editorWidget.border": "#2a2c31",
      "editorSuggestWidget.background": "#17181b",
      "editorSuggestWidget.border": "#2a2c31",
      "editorHoverWidget.background": "#17181b",
      "editorHoverWidget.border": "#2a2c31",
      "scrollbarSlider.background": "#ffffff14",
      "scrollbarSlider.hoverBackground": "#ffffff24",
    },
  });
  monaco.editor.defineTheme(MONACO_THEMES.light, {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#ffffff",
      "editor.lineHighlightBackground": "#0000000a",
      "editorLineNumber.foreground": "#a0a4ab",
      "editorLineNumber.activeForeground": "#3b3f46",
      "editorWidget.border": "#e4e4e7",
      "editorSuggestWidget.border": "#e4e4e7",
      "editorHoverWidget.border": "#e4e4e7",
    },
  });
}

export function toMarkers(
  monaco: Monaco,
  diagnostics: Diagnostic[],
): MonacoNamespace.editor.IMarkerData[] {
  const severity = {
    error: monaco.MarkerSeverity.Error,
    warning: monaco.MarkerSeverity.Warning,
    info: monaco.MarkerSeverity.Info,
  } as const;
  return diagnostics
    .filter((d) => d.fileName !== null)
    .map((d) => ({
      severity: severity[d.severity],
      message: d.message,
      code: String(d.code),
      source: d.source === "syntax" ? "syntax" : "ts",
      startLineNumber: d.startLine,
      startColumn: d.startColumn,
      endLineNumber: d.endLine,
      // Zero-width ranges (e.g. "'}' expected" at EOF) still need a visible squiggle.
      endColumn:
        d.endLine === d.startLine && d.endColumn === d.startColumn
          ? d.endColumn + 1
          : d.endColumn,
    }));
}
