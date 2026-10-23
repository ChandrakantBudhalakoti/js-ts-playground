/// <reference lib="webworker" />
import { assetBaseUrl, downloadAssetBundle } from "@/lib/runtime/assets";
import RUNTIME_ASSETS from "@/lib/runtime/runtime-assets.json";
import { parseClangDiagnostics } from "./diagnostics";
import type {
  ClangLanguage,
  ClangRequest,
  ClangResponse,
  ClangResult,
} from "./protocol";

declare const self: DedicatedWorkerGlobalScope;

/**
 * Clang and wasm-ld (YoWASP), compiled to WebAssembly, running in a worker
 * of the app. They only ever see the user's source text in a virtual
 * filesystem; the compiled program runs in the sandbox, like all user code.
 */

type Tree = { [name: string]: Tree | string | Uint8Array };
type RunClang = (
  args: string[],
  files: Tree,
  options: {
    stdout?: (bytes: Uint8Array | null) => void;
    stderr?: (bytes: Uint8Array | null) => void;
    fetchProgress?: () => void;
  },
) => Promise<Tree>;

const FILE_NAMES: Record<ClangLanguage, string> = {
  c: "main.c",
  cpp: "main.cpp",
};

const FLAGS: Record<ClangLanguage, string[]> = {
  c: ["-std=gnu17"],
  cpp: ["-std=c++20"],
};

const COMMON_FLAGS = ["-O1", "-Wall", "-fno-color-diagnostics"];

/**
 * The toolchain's C++ library has no exception support, so a `throw` would
 * not even link. This stand-in reports the exception like an uncaught one
 * (`catch` blocks never run) and ends the program. It is C, written against
 * the Itanium C++ ABI, because C++ headers would make it slow to compile.
 */
const CXX_RUNTIME = String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char *__cxa_demangle(const char *name, char *buffer, size_t *length, int *status);

void *__cxa_allocate_exception(size_t size) {
    void *p = calloc(1, size);
    if (!p) abort();
    return p;
}

void __cxa_free_exception(void *p) { free(p); }

/* std::exception and the standard exceptions derived from it: their what() is the third vtable slot. */
static const char *const STANDARD[] = {
    "St9exception", "St13runtime_error", "St11logic_error", "St16invalid_argument",
    "St12out_of_range", "St12length_error", "St12domain_error", "St11range_error",
    "St14overflow_error", "St15underflow_error", "St9bad_alloc", "St20bad_array_new_length",
    "St8bad_cast", "St10bad_typeid", "St17bad_function_call", "St12bad_any_cast",
    "St18bad_variant_access", "St19bad_optional_access",
};

typedef const char *(*what_fn)(const void *);

void __cxa_throw(void *object, void *type, void *(*destructor)(void *)) {
    (void)destructor;
    /* Itanium ABI: a type_info is { vtable, mangled name }. */
    const char *mangled = ((const char *const *)type)[1];
    int status = 0;
    char *name = __cxa_demangle(mangled, 0, 0, &status);
    fflush(stdout);
    fprintf(stderr, "terminate called after throwing an instance of '%s'", status == 0 && name ? name : mangled);
    for (size_t i = 0; i < sizeof STANDARD / sizeof *STANDARD; i++) {
        if (strcmp(mangled, STANDARD[i]) == 0) {
            what_fn *vtable = *(what_fn **)object;
            fprintf(stderr, ": %s", vtable[2](object));
            break;
        }
    }
    if (strcmp(mangled, "PKc") == 0 || strcmp(mangled, "Pc") == 0) fprintf(stderr, ": %s", *(const char **)object);
    if (strcmp(mangled, "i") == 0) fprintf(stderr, ": %d", *(int *)object);
    fprintf(stderr, "\n(C++ exceptions are not supported in this playground, so catch blocks do not run.)\n");
    exit(134);
}
`;

function post(message: ClangResponse, transfer: Transferable[] = []) {
  self.postMessage(message, transfer);
}

const base = new URL(assetBaseUrl("clang"), self.location.origin).href;

/**
 * Download the toolchain (gzipped, with progress) and answer YoWASP's own
 * requests for it from memory. Each file is requested once.
 */
const toolchain: Promise<RunClang> = (async () => {
  const files = await downloadAssetBundle("clang", (loaded, total) =>
    post({ id: 0, type: "progress", loaded, total }),
  );
  const nativeFetch = self.fetch.bind(self);
  self.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(
      typeof input === "string" || input instanceof URL ? input : input.url,
      self.location.href,
    ).href;
    const name = url.startsWith(base) ? url.slice(base.length) : null;
    const data = name ? files[name] : undefined;
    if (!name || !data) return nativeFetch(input, init);
    delete files[name];
    return Promise.resolve(
      new Response(data, {
        headers: {
          "Content-Type": name.endsWith(".wasm")
            ? "application/wasm"
            : "application/octet-stream",
        },
      }),
    );
  };
  const bundle = (await import(
    /* webpackIgnore: true */ `${base}bundle.js`
  )) as { runClang: RunClang };
  return bundle.runClang;
})();

let cxxRuntime: Promise<Uint8Array> | null = null;

async function run(
  runClang: RunClang,
  args: string[],
  files: Tree,
): Promise<{ files: Tree | null; output: string }> {
  let output = "";
  const decoder = new TextDecoder();
  const collect = (bytes: Uint8Array | null) => {
    if (bytes) output += decoder.decode(bytes, { stream: true });
  };
  try {
    const result = await runClang(args, files, {
      stdout: collect,
      stderr: collect,
      fetchProgress: () => {},
    });
    return { files: result, output };
  } catch (error) {
    // A failed compile or link throws Exit with a non-zero code.
    if (error && typeof error === "object" && "code" in error)
      return { files: null, output };
    throw error;
  }
}

function compileCxxRuntime(runClang: RunClang): Promise<Uint8Array> {
  cxxRuntime ??= run(runClang, ["clang", "-c", "rt.c", "-O1", "-o", "rt.o"], {
    "rt.c": CXX_RUNTIME,
  }).then(({ files, output }) => {
    const object = files?.["rt.o"];
    if (!(object instanceof Uint8Array)) {
      cxxRuntime = null;
      throw new Error(`Could not build the C++ runtime support.\n${output}`);
    }
    return object;
  });
  return cxxRuntime;
}

async function handle(request: ClangRequest): Promise<ClangResult> {
  const runClang = await toolchain;
  const fileName = FILE_NAMES[request.language];
  const driver = request.language === "c" ? "clang" : "clang++";
  const flags = [...FLAGS[request.language], ...COMMON_FLAGS];

  if (request.type === "check") {
    const { output } = await run(
      runClang,
      [driver, "-fsyntax-only", fileName, ...flags],
      { [fileName]: request.code },
    );
    return {
      diagnostics: parseClangDiagnostics(output, fileName),
      output,
      binary: null,
    };
  }

  const files: Tree = { [fileName]: request.code };
  const inputs = [fileName];
  if (request.language === "cpp") {
    files["rt.o"] = await compileCxxRuntime(runClang);
    inputs.push("rt.o");
  }
  const { files: result, output } = await run(
    runClang,
    [
      driver,
      ...inputs,
      ...flags,
      // An 8 MB stack, like a native program (wasm-ld's default is 64 KB).
      "-Wl,-z,stack-size=8388608",
      "-o",
      "main.wasm",
    ],
    files,
  );
  const program = result?.["main.wasm"];
  return {
    diagnostics: parseClangDiagnostics(output, fileName),
    output,
    binary:
      program instanceof Uint8Array
        ? (program.slice().buffer as ArrayBuffer)
        : null,
  };
}

toolchain.then(
  () =>
    post({
      id: 0,
      type: "ready",
      version: RUNTIME_ASSETS.clang.version.split("-")[0],
    }),
  (error: unknown) =>
    post({
      id: 0,
      type: "init-error",
      message: error instanceof Error ? error.message : String(error),
    }),
);

// One request at a time: Clang is single-threaded, and a queue keeps
// results in order.
let queue: Promise<unknown> = Promise.resolve();

self.addEventListener("message", (event: MessageEvent<ClangRequest>) => {
  const request = event.data;
  if (
    !request ||
    typeof request !== "object" ||
    typeof request.id !== "number" ||
    (request.language !== "c" && request.language !== "cpp")
  )
    return;
  queue = queue.then(async () => {
    try {
      const result = await handle(request);
      post(
        { id: request.id, type: "result", result },
        result.binary ? [result.binary] : [],
      );
    } catch (error) {
      post({
        id: request.id,
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });
});
