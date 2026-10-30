import type { Language, RuntimeId, ScriptLanguage } from "@/types/playground";

export type LanguageGroup = "web" | "compiled" | "scripting";

export interface LanguageInfo {
  id: Language;
  /** Display name. */
  name: string;
  /** Compact label for the language picker on small screens. */
  short: string;
  /** Name of the user's file in messages and stack traces. */
  fileName: string;
  /** Monaco language id. */
  monaco: string;
  /** Code used in share links (`#lang=`). Never change one: old links use it. */
  shareCode: string;
  runtime: RuntimeId;
  /** What compiles or interprets the code, as shown to users. */
  engine: string;
  /** Short name and version of the tooling, for the toolbar ("Python 3.14"). */
  version: string;
  group: LanguageGroup;
  /** Programs read the Input panel as standard input. */
  stdin: boolean;
  /** Approximate one-time download (gzip) before the first run, if any. */
  download?: string;
  /** The language's page on the site. */
  path: string;
}

/** Every language, in picker order. */
export const LANGUAGES: readonly LanguageInfo[] = [
  {
    id: "javascript",
    path: "/javascript",
    name: "JavaScript",
    short: "JS",
    fileName: "main.js",
    monaco: "javascript",
    shareCode: "js",
    runtime: "js",
    engine: "The browser's JavaScript engine",
    version: "JavaScript",
    group: "web",
    stdin: false,
  },
  {
    id: "typescript",
    path: "/typescript",
    name: "TypeScript",
    short: "TS",
    fileName: "main.ts",
    monaco: "typescript",
    shareCode: "ts",
    runtime: "js",
    engine: "TypeScript 5.9, run as JavaScript",
    version: "TypeScript 5.9",
    group: "web",
    stdin: false,
  },
  {
    id: "python",
    path: "/python",
    name: "Python",
    short: "PY",
    fileName: "main.py",
    monaco: "python",
    shareCode: "py",
    runtime: "python",
    engine: "CPython 3.14 (Pyodide)",
    version: "Python 3.14",
    group: "scripting",
    stdin: true,
    download: "7 MB",
  },
  {
    id: "c",
    path: "/c",
    name: "C",
    short: "C",
    fileName: "main.c",
    monaco: "c",
    shareCode: "c",
    runtime: "wasi",
    engine: "Clang 22 (C17) compiled to WebAssembly",
    version: "Clang 22",
    group: "compiled",
    stdin: true,
    download: "27 MB",
  },
  {
    id: "cpp",
    path: "/cpp",
    name: "C++",
    short: "C++",
    fileName: "main.cpp",
    monaco: "cpp",
    shareCode: "cpp",
    runtime: "wasi",
    engine: "Clang 22 (C++20, libc++) compiled to WebAssembly",
    version: "Clang 22",
    group: "compiled",
    stdin: true,
    download: "27 MB",
  },
  {
    id: "java",
    path: "/java",
    name: "Java",
    short: "JAVA",
    fileName: "Main.java",
    monaco: "java",
    shareCode: "java",
    runtime: "java",
    engine: "OpenJDK javac and TeaVM, compiled to WebAssembly",
    version: "Java 21",
    group: "compiled",
    stdin: true,
    download: "4.5 MB",
  },
  {
    id: "go",
    path: "/go",
    name: "Go",
    short: "GO",
    fileName: "main.go",
    monaco: "go",
    shareCode: "go",
    runtime: "go",
    engine: "Yaegi Go interpreter (Go 1.25 standard library)",
    version: "Go (Yaegi)",
    group: "compiled",
    stdin: true,
    download: "9 MB",
  },
  {
    id: "ruby",
    path: "/ruby",
    name: "Ruby",
    short: "RB",
    fileName: "main.rb",
    monaco: "ruby",
    shareCode: "rb",
    runtime: "ruby",
    engine: "CRuby 3.4 (ruby.wasm)",
    version: "Ruby 3.4",
    group: "scripting",
    stdin: true,
    download: "9 MB",
  },
  {
    id: "php",
    path: "/php",
    name: "PHP",
    short: "PHP",
    fileName: "main.php",
    monaco: "php",
    shareCode: "php",
    runtime: "php",
    engine: "PHP 8.4 CLI (php-wasm)",
    version: "PHP 8.4",
    group: "scripting",
    stdin: true,
    download: "8 MB",
  },
  {
    id: "lua",
    path: "/lua",
    name: "Lua",
    short: "LUA",
    fileName: "main.lua",
    monaco: "lua",
    shareCode: "lua",
    runtime: "lua",
    engine: "Lua 5.4 (wasmoon)",
    version: "Lua 5.4",
    group: "scripting",
    stdin: true,
    download: "0.2 MB",
  },
  {
    id: "r",
    path: "/r",
    name: "R",
    short: "R",
    fileName: "main.R",
    monaco: "r",
    shareCode: "r",
    runtime: "r",
    engine: "R 4.6 (webR)",
    version: "R 4.6",
    group: "scripting",
    stdin: false,
    download: "15 MB",
  },
];

const BY_ID = new Map(LANGUAGES.map((info) => [info.id, info]));
const BY_SHARE_CODE = new Map(LANGUAGES.map((info) => [info.shareCode, info]));

export function languageInfo(language: Language): LanguageInfo {
  return BY_ID.get(language)!;
}

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && BY_ID.has(value as Language);
}

export function languageForShareCode(code: string): Language | undefined {
  return BY_SHARE_CODE.get(code)?.id;
}

/** JavaScript and TypeScript run directly; everything else needs a WebAssembly runtime. */
export function isJavaScriptLike(
  language: Language,
): language is ScriptLanguage {
  return language === "javascript" || language === "typescript";
}

/** C and C++ are compiled by Clang in the app before they run. */
export function isClangLanguage(language: Language): language is "c" | "cpp" {
  return language === "c" || language === "cpp";
}

export const LANGUAGE_GROUPS: { id: LanguageGroup; label: string }[] = [
  { id: "web", label: "Web" },
  { id: "compiled", label: "Compiled" },
  { id: "scripting", label: "Scripting" },
];
