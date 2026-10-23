"use client";

import { useClangState } from "@/hooks/useClang";
import { useDownloadState } from "@/hooks/useRuntimeAssets";
import type { CompilerState } from "@/lib/compiler/compiler-client";
import {
  isClangLanguage,
  isJavaScriptLike,
  languageInfo,
} from "@/lib/languages";
import type { AssetBundleId } from "@/lib/runtime/assets";
import type { Language } from "@/types/playground";

/** What the current language needs before it can check and run code. */
export type ToolingStatus =
  | {
      status: "loading";
      label: string;
      /** Download progress from 0 to 1, when known. */
      progress: number | null;
    }
  | { status: "ready"; label: string }
  | { status: "error"; label: string; message: string };

export function runtimeBundle(language: Language): AssetBundleId | null {
  const { runtime } = languageInfo(language);
  if (runtime === "js") return null;
  return runtime === "wasi" ? "clang" : runtime;
}

/**
 * TypeScript's checker for JavaScript and TypeScript, Clang for C and C++,
 * and the language runtime's download for everything else.
 */
export function useToolingStatus(
  language: Language,
  compilerState: CompilerState,
): ToolingStatus {
  const clang = useClangState();
  const bundle = runtimeBundle(language);
  const download = useDownloadState(
    bundle === null || bundle === "clang" ? null : bundle,
  );
  const info = languageInfo(language);

  if (isJavaScriptLike(language)) {
    if (compilerState.status === "ready")
      return { status: "ready", label: `TypeScript ${compilerState.version}` };
    if (compilerState.status === "loading")
      return { status: "loading", label: "TypeScript", progress: null };
    return {
      status: "error",
      label: "Type checking unavailable",
      message: compilerState.message,
    };
  }

  if (isClangLanguage(language)) {
    if (clang.status === "ready")
      return { status: "ready", label: `Clang ${clang.version}` };
    if (clang.status === "error")
      return {
        status: "error",
        label: "Compiler unavailable",
        message: clang.message,
      };
    return {
      status: "loading",
      label: "C/C++ compiler",
      progress:
        clang.status === "loading" && clang.total > 0
          ? clang.loaded / clang.total
          : null,
    };
  }

  if (download.status === "ready")
    return { status: "ready", label: info.version };
  if (download.status === "error")
    return {
      status: "error",
      label: `${info.name} unavailable`,
      message: download.message,
    };
  return {
    status: "loading",
    label: info.name,
    progress:
      download.status === "downloading" && download.total > 0
        ? download.loaded / download.total
        : null,
  };
}
