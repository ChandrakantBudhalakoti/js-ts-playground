import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseClangDiagnostics } from "@/lib/clang/diagnostics";
import { DEFAULT_EXAMPLE, EXAMPLES, isStarterCode } from "@/lib/examples";
import {
  isClangLanguage,
  isJavaScriptLike,
  isLanguage,
  languageForShareCode,
  LANGUAGES,
  languageInfo,
} from "@/lib/languages";
import { AssetCache, type AssetBundleId } from "@/lib/runtime/assets";
import RUNTIME_ASSETS from "@/lib/runtime/runtime-assets.json";

const root = join(process.cwd(), "node_modules");

describe("languages", () => {
  it("are described once each, with unique share codes and file names", () => {
    const ids = LANGUAGES.map((info) => info.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const key of ["shareCode", "fileName"] as const) {
      const values = LANGUAGES.map((info) => info[key]);
      expect(new Set(values).size, key).toBe(values.length);
    }
    for (const info of LANGUAGES) {
      expect(isLanguage(info.id)).toBe(true);
      expect(languageInfo(info.id)).toBe(info);
      expect(languageForShareCode(info.shareCode)).toBe(info.id);
    }
    expect(isLanguage("cobol")).toBe(false);
  });

  it("each have starter code, and switching away from it is free", () => {
    for (const { id } of LANGUAGES) {
      const starter = DEFAULT_EXAMPLE[id];
      expect(starter?.language, id).toBe(id);
      expect(isStarterCode(starter.code)).toBe(true);
      expect(EXAMPLES.filter((e) => e.language === id).length).toBeGreaterThan(
        0,
      );
    }
  });

  it("are highlighted by Monaco", () => {
    const definitions = join(
      root,
      "monaco-editor",
      "esm",
      "vs",
      "languages",
      "definitions",
    );
    const registered = readdirSync(definitions)
      .map((name) => join(definitions, name, "register.js"))
      .filter((file) => existsSync(file))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    for (const info of LANGUAGES) {
      if (isJavaScriptLike(info.id)) continue;
      expect(registered, info.monaco).toContain(`id: "${info.monaco}"`);
    }
  });

  it("run where expected", () => {
    expect(isJavaScriptLike("typescript")).toBe(true);
    expect(isJavaScriptLike("python")).toBe(false);
    expect(isClangLanguage("cpp")).toBe(true);
    expect(isClangLanguage("go")).toBe(false);
    for (const info of LANGUAGES) {
      if (info.runtime === "js") expect(isJavaScriptLike(info.id)).toBe(true);
      else if (info.runtime === "wasi")
        expect(isClangLanguage(info.id)).toBe(true);
      else expect(info.runtime in RUNTIME_ASSETS, info.id).toBe(true);
    }
  });
});

describe("runtime-assets.json", () => {
  it("pins the installed version of every runtime package", () => {
    for (const [id, spec] of Object.entries(RUNTIME_ASSETS)) {
      if ("path" in spec) continue; // kept in this repository (below)
      const manifest = JSON.parse(
        readFileSync(
          join(root, ...spec.package.split("/"), "package.json"),
          "utf8",
        ),
      );
      expect(manifest.version, id).toBe(spec.version);
      // Exact versions only: the drivers depend on these builds' internals.
      const pinned = JSON.parse(readFileSync("package.json", "utf8"))
        .devDependencies[spec.package];
      expect(pinned, spec.package).toBe(spec.version);
    }
  });

  it("has every file of the runtimes kept in this repository", () => {
    for (const [id, spec] of Object.entries(RUNTIME_ASSETS)) {
      if (!("path" in spec)) continue;
      for (const source of Object.values(spec.files))
        expect(
          existsSync(join(process.cwd(), spec.path, source)),
          `${id}: ${source}`,
        ).toBe(true);
    }
  });
});

describe("clang diagnostics", () => {
  const output = [
    "main.c:3:9: warning: unused variable 'x' [-Wunused-variable]",
    "    3 |     int x = 1;",
    "      |         ^",
    "main.c:4:22: error: expected ';' after expression",
    "/usr/include/stdio.h:10:1: note: previous declaration is here",
    "/usr/include/c++/v1/vector:42:7: error: no matching function",
    "main.c:4:5: note: in instantiation requested here",
    "wasm-ld: error: undefined symbol: frobnicate",
    "2 errors generated.",
  ].join("\n");
  const diagnostics = parseClangDiagnostics(output, "main.c");

  it("places messages about the user's file at their position", () => {
    expect(diagnostics[0]).toMatchObject({
      fileName: "main.c",
      severity: "warning",
      source: "semantic",
      startLine: 3,
      startColumn: 9,
      message: "unused variable 'x' [-Wunused-variable]",
      tool: "clang",
    });
    // Errors block the run: there is no program to run.
    expect(diagnostics[1]).toMatchObject({
      severity: "error",
      source: "syntax",
      startLine: 4,
      startColumn: 22,
    });
  });

  it("keeps errors from headers and the linker without a position", () => {
    expect(diagnostics.map((d) => d.message)).toEqual([
      "unused variable 'x' [-Wunused-variable]",
      "expected ';' after expression",
      "/usr/include/c++/v1/vector:42:7: no matching function",
      "in instantiation requested here",
      "wasm-ld: undefined symbol: frobnicate",
    ]);
    expect(diagnostics[2]).toMatchObject({ fileName: null, severity: "error" });
    expect(diagnostics[3]).toMatchObject({
      fileName: "main.c",
      severity: "info",
    });
    expect(diagnostics[4]).toMatchObject({ fileName: null, severity: "error" });
  });
});

describe("AssetCache", () => {
  const files = (id: string) => ({ [`${id}.wasm`]: new ArrayBuffer(8) });

  it("downloads a runtime once and reports progress", async () => {
    const calls: string[] = [];
    let resolve!: () => void;
    const gate = new Promise<void>((r) => (resolve = r));
    const cache = new AssetCache(async (id, onProgress) => {
      calls.push(id);
      onProgress?.(5, 10);
      await gate;
      return files(id);
    });
    const states: string[] = [];
    cache.subscribe(() => states.push(cache.state("python").status));
    const first = cache.load("python");
    const second = cache.load("python");
    expect(cache.state("python")).toEqual({
      status: "downloading",
      loaded: 5,
      total: 10,
    });
    resolve();
    expect(await first).toBe(await second);
    expect(calls).toEqual(["python"]);
    expect(cache.state("python")).toEqual({ status: "ready", bytes: 8 });
    expect(states).toEqual(["downloading", "ready"]);
  });

  it("keeps only the most recent runtimes", async () => {
    const calls: AssetBundleId[] = [];
    const cache = new AssetCache(async (id) => {
      calls.push(id);
      return files(id);
    }, 2);
    await cache.load("python");
    await cache.load("lua");
    await cache.load("python"); // now the most recent
    await cache.load("ruby"); // evicts lua
    await cache.load("python");
    await cache.load("lua");
    expect(calls).toEqual(["python", "lua", "ruby", "lua"]);
    expect(cache.state("ruby").status).toBe("idle");
  });

  it("forgets failed downloads, so the next load retries", async () => {
    let fail = true;
    const cache = new AssetCache(async (id) => {
      if (fail) throw new Error("offline");
      return files(id);
    });
    await expect(cache.load("go")).rejects.toThrow("offline");
    expect(cache.state("go")).toEqual({ status: "error", message: "offline" });
    fail = false;
    await expect(cache.load("go")).resolves.toHaveProperty("go.wasm");
  });
});
