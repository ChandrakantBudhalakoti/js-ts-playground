/// <reference lib="webworker" />
import { assetBaseUrl, downloadAssetBundle } from "@/lib/runtime/assets";
import RUNTIME_ASSETS from "@/lib/runtime/runtime-assets.json";
import { CXX_RUNTIME } from "./cxx-runtime";
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
  post({ id: request.id, type: "started" });
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
