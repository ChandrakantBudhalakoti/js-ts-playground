import type { Language } from "@/types/playground";
import LIB_ROOTS from "./lib-roots.json";

/**
 * Compiler options shared by the playground compiler worker and Monaco's
 * built-in TypeScript service, so completions and diagnostics agree.
 *
 * Enum values are written as numbers so this module never pulls the
 * TypeScript compiler into the main bundle; `options.test.ts` asserts they
 * match the `typescript` package's enums.
 */
export const SCRIPT_TARGET_ES2022 = 9;
export const MODULE_KIND_ESNEXT = 99;
export const MODULE_RESOLUTION_BUNDLER = 100;
export const MODULE_DETECTION_FORCE = 3;

/**
 * User code runs in a dedicated Web Worker, so the worker globals (not the DOM)
 * describe the runtime accurately. The list lives in JSON because
 * scripts/prepare-assets.mjs bundles these libs (and their references).
 */
export const LIB_FILES: readonly string[] = LIB_ROOTS;

export const FILE_NAMES: Record<Language, string> = {
  typescript: "main.ts",
  javascript: "main.js",
};

export const SHARED_COMPILER_OPTIONS = {
  target: SCRIPT_TARGET_ES2022,
  module: MODULE_KIND_ESNEXT,
  moduleResolution: MODULE_RESOLUTION_BUNDLER,
  // Every file is a module: matches how the sandbox imports user code and
  // avoids clashes with global declarations such as `name`.
  moduleDetection: MODULE_DETECTION_FORCE,
  lib: [...LIB_FILES],
  strict: true,
  allowJs: true,
  checkJs: false,
  esModuleInterop: true,
  skipLibCheck: true,
  allowNonTsExtensions: true,
  types: [] as string[],
};

/** The TypeScript version bundled with monaco-editor 0.57; the `typescript` dependency is pinned to it. */
export const EXPECTED_TYPESCRIPT_VERSION = "5.9.3";

/** Lib files bundled by scripts/prepare-assets.mjs, as `{ [fileName]: contents }`. */
export const LIB_BUNDLE_URL = `/vendor/typescript/${EXPECTED_TYPESCRIPT_VERSION}/lib.json`;
