import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import ts from "typescript";
import { loadLibFiles } from "@/lib/compiler/libs";
import { LIB_FILES } from "@/lib/compiler/options";
import {
  createCompilerService,
  type CompilerService,
} from "@/lib/compiler/typescript";

const require = createRequire(import.meta.url);
const libDir = dirname(require.resolve("typescript/lib/lib.d.ts"));

let service: Promise<CompilerService> | undefined;

/** A compiler service backed by the real TypeScript lib files (read from node_modules). */
export function getCompilerService(): Promise<CompilerService> {
  service ??= loadLibFiles(LIB_FILES, async (name) => {
    try {
      return await readFile(join(libDir, name), "utf8");
    } catch {
      return undefined;
    }
  }).then((libs) => createCompilerService(ts, libs));
  return service;
}
