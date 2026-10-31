// Runs the beginner programs (src/lib/programs) and compares what they print
// with each program's `output`: C and C++ with the playground's own Clang
// (@yowasp/clang, run in Node), Python and Java with a local `python` and
// `java` if installed. tests/e2e/programs.spec.ts checks the same in the
// browser, in every language the playground runs.
//
// Usage: npx tsx scripts/check-programs.mts [slug ...]
import * as yowasp from "@yowasp/clang";
import type { Command } from "@yowasp/clang";
import { spawnSync } from "node:child_process";
import {
  closeSync,
  mkdtempSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { WASI } from "node:wasi";
import { CXX_RUNTIME } from "../src/lib/clang/cxx-runtime";
import type { Program } from "../src/lib/programs/types";

// Exported by the bundle (as src/lib/clang/clang.worker.ts uses it), but
// missing from the package's types.
const { runClang } = yowasp as unknown as { runClang: Command };

// Each file in topics/, so a new program can be checked before it is listed.
const topics = join(import.meta.dirname, "../src/lib/programs/topics");
const PROGRAMS: Program[] = await Promise.all(
  readdirSync(topics)
    .filter((name) => name.endsWith(".ts"))
    .sort()
    .map(async (name) => {
      const topic = await import(pathToFileURL(join(topics, name)).href);
      return topic.program as Program;
    }),
);

function findCommand(candidates: string[][]): string[] | null {
  for (const command of candidates) {
    const result = spawnSync(command[0], [...command.slice(1), "--version"], {
      encoding: "utf8",
    });
    if (result.status === 0) return command;
  }
  return null;
}

const python = findCommand([["python3"], ["python"], ["py", "-3"]]);
const java = findCommand([["java"]]);

interface Result {
  status: number | null;
  stdout: string;
  stderr: string;
}

/** Compile with the playground's flags (src/lib/clang/clang.worker.ts) and run under WASI. */
async function runClangProgram(
  language: "c" | "cpp",
  code: string,
  stdin: string,
  dir: string,
): Promise<Result> {
  const file = language === "c" ? "main.c" : "main.cpp";
  let messages = "";
  const decoder = new TextDecoder();
  const collect = (bytes: Uint8Array | null) => {
    if (bytes) messages += decoder.decode(bytes, { stream: true });
  };
  let binary: Uint8Array | undefined;
  try {
    const inputs: Record<string, string | Uint8Array> = { [file]: code };
    if (language === "cpp") {
      const runtime = await runClang(
        ["clang", "-c", "rt.c", "-O1", "-o", "rt.o"],
        { "rt.c": CXX_RUNTIME },
        { stdout: collect, stderr: collect },
      );
      inputs["rt.o"] = runtime?.["rt.o"] as Uint8Array;
    }
    const files = await runClang(
      [
        language === "c" ? "clang" : "clang++",
        ...Object.keys(inputs),
        language === "c" ? "-std=gnu17" : "-std=c++20",
        "-O1",
        "-Wall",
        "-fno-color-diagnostics",
        "-Wl,-z,stack-size=8388608",
        "-o",
        "main.wasm",
      ],
      inputs,
      { stdout: collect, stderr: collect },
    );
    binary = files?.["main.wasm"] as Uint8Array | undefined;
  } catch (error) {
    messages += String(error);
  }
  if (!binary) return { status: null, stdout: "", stderr: messages };

  const inputPath = join(dir, "stdin.txt");
  const outputPath = join(dir, "stdout.txt");
  writeFileSync(inputPath, stdin);
  const input = openSync(inputPath, "r");
  const output = openSync(outputPath, "w");
  try {
    const wasi = new WASI({
      version: "preview1",
      args: ["main"],
      stdin: input,
      stdout: output,
      returnOnExit: true,
    });
    const instance = await WebAssembly.instantiate(
      await WebAssembly.compile(binary as Uint8Array<ArrayBuffer>),
      { wasi_snapshot_preview1: wasi.wasiImport },
    );
    const status = wasi.start(instance);
    closeSync(output);
    return {
      status,
      stdout: readFileSync(outputPath, "utf8"),
      stderr: messages,
    };
  } finally {
    closeSync(input);
    try {
      closeSync(output);
    } catch {
      // Already closed.
    }
  }
}

function runLocal(
  command: string[],
  fileName: string,
  code: string,
  stdin: string,
  dir: string,
): Result {
  const file = join(dir, fileName);
  writeFileSync(file, code);
  const result = spawnSync(command[0], [...command.slice(1), file], {
    input: stdin,
    encoding: "utf8",
    timeout: 30_000,
  });
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

type Runner = (
  code: string,
  stdin: string,
  dir: string,
) => Promise<Result> | Result;

const RUNNERS: Record<string, Runner | null> = {
  python: python && ((...a) => runLocal(python, "main.py", ...a)),
  c: (...a) => runClangProgram("c", ...a),
  cpp: (...a) => runClangProgram("cpp", ...a),
  java: java && ((...a) => runLocal(java, "Main.java", ...a)),
};

const only = new Set(process.argv.slice(2));
let failures = 0;
let checked = 0;

for (const program of PROGRAMS) {
  if (only.size > 0 && !only.has(program.slug)) continue;
  for (const [language, runner] of Object.entries(RUNNERS)) {
    const code = program.code[language as keyof Program["code"]];
    if (!code || !runner) continue;
    const dir = mkdtempSync(join(tmpdir(), "program-"));
    try {
      const result = await runner(code, program.stdin ?? "", dir);
      const actual = (result.stdout ?? "").replace(/\r\n/g, "\n").trimEnd();
      const expected = program.output.trimEnd();
      checked++;
      if (actual === expected && result.status === 0) {
        console.log(`ok    ${program.slug} (${language})`);
      } else {
        failures++;
        console.log(
          `FAIL  ${program.slug} (${language}), exit ${result.status}`,
        );
        console.log(`--- expected\n${expected}\n--- actual\n${actual}`);
        if (result.stderr) console.log(`--- messages\n${result.stderr}`);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
}

if (!python) console.log("Python not found: Python code not checked.");
if (!java) console.log("Java not found: Java code not checked.");
console.log(`${checked} checked, ${failures} failed`);
process.exit(failures > 0 ? 1 : 0);
