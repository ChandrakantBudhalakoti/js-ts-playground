import type * as TS from "typescript";
import type { Diagnostic, ScriptLanguage } from "@/types/playground";
import { mergeDiagnostics, normalizeDiagnostic } from "./diagnostics";
import { FILE_NAMES, SHARED_COMPILER_OPTIONS } from "./options";

type TypeScriptModule = typeof TS;

export interface CompileResult {
  /** JavaScript to execute. For JavaScript input this is the source unchanged. */
  js: string;
  /** Source map (JSON) from `js` back to the TypeScript source, when transpiled. */
  sourceMap: string | null;
  diagnostics: Diagnostic[];
}

export interface CompilerService {
  readonly version: string;
  /** Syntactic, semantic and option diagnostics for the code. */
  check(code: string, language: ScriptLanguage): Diagnostic[];
  /** Diagnostics plus executable JavaScript (via `ts.transpileModule` for TypeScript). */
  compile(code: string, language: ScriptLanguage): CompileResult;
}

const SOURCE_MAPPING_URL = /\n?\/\/# sourceMappingURL=.*\s*$/;

/**
 * Build an in-memory TypeScript language service. No disk access: the user's
 * file and the standard library files live in memory.
 *
 * @param libFiles lib file name (e.g. `lib.es2024.d.ts`) to contents.
 */
export function createCompilerService(
  ts: TypeScriptModule,
  libFiles: ReadonlyMap<string, string>,
): CompilerService {
  const registry = ts.createDocumentRegistry(true, "/");
  const libSnapshots = new Map<string, TS.IScriptSnapshot>();
  const services = new Map<ScriptLanguage, ReturnType<typeof createService>>();

  const compilerOptions: TS.CompilerOptions = {
    ...SHARED_COMPILER_OPTIONS,
    lib: [...SHARED_COMPILER_OPTIONS.lib],
    noEmit: true,
  };

  function libName(path: string): string | undefined {
    if (!path.startsWith("/lib.")) return undefined;
    const name = path.slice(1);
    return libFiles.has(name) ? name : undefined;
  }

  function libSnapshot(path: string): TS.IScriptSnapshot | undefined {
    const name = libName(path);
    if (!name) return undefined;
    let snapshot = libSnapshots.get(name);
    if (!snapshot) {
      snapshot = ts.ScriptSnapshot.fromString(libFiles.get(name)!);
      libSnapshots.set(name, snapshot);
    }
    return snapshot;
  }

  function createService(language: ScriptLanguage) {
    const fileName = `/${FILE_NAMES[language]}`;
    const state = {
      text: "",
      version: 0,
      snapshot: ts.ScriptSnapshot.fromString(""),
    };

    const host: TS.LanguageServiceHost = {
      getCompilationSettings: () => compilerOptions,
      getScriptFileNames: () => [fileName],
      getScriptVersion: (path) =>
        path === fileName ? String(state.version) : "1",
      getScriptSnapshot: (path) =>
        path === fileName ? state.snapshot : libSnapshot(path),
      getScriptKind: (path) =>
        path === fileName
          ? language === "typescript"
            ? ts.ScriptKind.TS
            : ts.ScriptKind.JS
          : ts.ScriptKind.TS,
      getCurrentDirectory: () => "/",
      getDefaultLibFileName: (options) =>
        `/${ts.getDefaultLibFileName(options)}`,
      fileExists: (path) => path === fileName || libName(path) !== undefined,
      readFile: (path) => {
        if (path === fileName) return state.text;
        const name = libName(path);
        return name ? libFiles.get(name) : undefined;
      },
      directoryExists: (path) => path === "/",
      getDirectories: () => [],
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => "\n",
    };

    const service = ts.createLanguageService(host, registry);

    function update(code: string) {
      if (code === state.text) return;
      state.text = code;
      state.version += 1;
      state.snapshot = ts.ScriptSnapshot.fromString(code);
    }

    function diagnostics(): Diagnostic[] {
      const syntactic = service
        .getSyntacticDiagnostics(fileName)
        .map((d) => normalizeDiagnostic(ts, d, "syntax"));
      const semantic = service
        .getSemanticDiagnostics(fileName)
        .map((d) => normalizeDiagnostic(ts, d, "semantic"));
      const options = service
        .getCompilerOptionsDiagnostics()
        .map((d) => normalizeDiagnostic(ts, d, "options"));
      return mergeDiagnostics(
        syntactic.filter(isDefined),
        semantic.filter(isDefined),
        options.filter(isDefined),
      );
    }

    return { update, diagnostics };
  }

  function getService(language: ScriptLanguage) {
    let service = services.get(language);
    if (!service) {
      service = createService(language);
      services.set(language, service);
    }
    return service;
  }

  function check(code: string, language: ScriptLanguage): Diagnostic[] {
    const service = getService(language);
    service.update(code);
    return service.diagnostics();
  }

  function compile(code: string, language: ScriptLanguage): CompileResult {
    const checked = check(code, language);
    if (language === "javascript") {
      return { js: code, sourceMap: null, diagnostics: checked };
    }

    const output = ts.transpileModule(code, {
      fileName: FILE_NAMES.typescript,
      reportDiagnostics: true,
      compilerOptions: {
        target: compilerOptions.target,
        module: compilerOptions.module,
        moduleDetection: compilerOptions.moduleDetection,
        esModuleInterop: true,
        sourceMap: true,
      },
    });
    const transpileDiagnostics = (output.diagnostics ?? [])
      .map((d) => normalizeDiagnostic(ts, d, "syntax"))
      .filter(isDefined);

    return {
      js: output.outputText.replace(SOURCE_MAPPING_URL, "\n"),
      sourceMap: output.sourceMapText ?? null,
      diagnostics: mergeDiagnostics(checked, transpileDiagnostics),
    };
  }

  return { version: ts.version, check, compile };
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
