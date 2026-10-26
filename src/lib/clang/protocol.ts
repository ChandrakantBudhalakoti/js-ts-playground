import type { Diagnostic } from "@/types/playground";

export type ClangLanguage = "c" | "cpp";

/** Messages between the main thread and the Clang Web Worker. */
export type ClangRequest =
  | { id: number; type: "check"; code: string; language: ClangLanguage }
  | { id: number; type: "compile"; code: string; language: ClangLanguage };

export interface ClangResult {
  diagnostics: Diagnostic[];
  /** Compiler and linker output, as printed. */
  output: string;
  /** The WASI program (compile only, and only without errors). */
  binary: ArrayBuffer | null;
}

export type ClangResponse =
  | { id: 0; type: "progress"; loaded: number; total: number }
  | { id: 0; type: "ready"; version: string }
  | { id: 0; type: "init-error"; message: string }
  /** The worker began this request (the client's time limit starts now). */
  | { id: number; type: "started" }
  | { id: number; type: "result"; result: ClangResult }
  | { id: number; type: "error"; message: string };
