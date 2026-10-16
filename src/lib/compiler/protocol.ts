import type { Diagnostic, Language } from "@/types/playground";
import type { CompileResult } from "./typescript";

/** Messages between the main thread and the compiler Web Worker. */
export type CompilerRequest =
  | { id: number; type: "check"; code: string; language: Language }
  | { id: number; type: "compile"; code: string; language: Language };

export type CompilerResponse =
  | { id: 0; type: "ready"; version: string }
  | { id: 0; type: "init-error"; message: string }
  | { id: number; type: "check"; diagnostics: Diagnostic[] }
  | { id: number; type: "compile"; result: CompileResult }
  | { id: number; type: "error"; message: string };
