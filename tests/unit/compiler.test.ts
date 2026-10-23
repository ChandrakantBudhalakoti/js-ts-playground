import ts from "typescript";
import { describe, expect, it } from "vitest";
import { hasBlockingErrors } from "@/lib/compiler/diagnostics";
import { referencedLibFiles } from "@/lib/compiler/libs";
import {
  EXPECTED_TYPESCRIPT_VERSION,
  MODULE_DETECTION_FORCE,
  MODULE_KIND_ESNEXT,
  MODULE_RESOLUTION_BUNDLER,
  SCRIPT_TARGET_ES2022,
} from "@/lib/compiler/options";
import { createPositionMapper } from "@/lib/compiler/source-map";
import { EXAMPLES } from "@/lib/examples";
import { isJavaScriptLike } from "@/lib/languages";
import { getCompilerService } from "./helpers";

describe("compiler options", () => {
  it("uses enum values that match the installed TypeScript", () => {
    expect(SCRIPT_TARGET_ES2022).toBe(ts.ScriptTarget.ES2022);
    expect(MODULE_KIND_ESNEXT).toBe(ts.ModuleKind.ESNext);
    expect(MODULE_RESOLUTION_BUNDLER).toBe(ts.ModuleResolutionKind.Bundler);
    expect(MODULE_DETECTION_FORCE).toBe(ts.ModuleDetectionKind.Force);
  });

  it("pins the TypeScript version bundled with Monaco", () => {
    expect(ts.version).toBe(EXPECTED_TYPESCRIPT_VERSION);
  });
});

describe("lib loading", () => {
  it("parses /// <reference lib> directives", () => {
    const content =
      '/// <reference lib="es2015.core" />\n/// <reference lib="ES2016" />\nfoo';
    expect(referencedLibFiles(content)).toEqual([
      "lib.es2015.core.d.ts",
      "lib.es2016.d.ts",
    ]);
  });
});

describe("TypeScript compiler service", () => {
  it("reports a semantic type error at the right one-based position", async () => {
    const service = await getCompilerService();
    const diagnostics = service.check(
      `const age: number = '25';`,
      "typescript",
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      fileName: "main.ts",
      code: 2322,
      severity: "error",
      source: "semantic",
      startLine: 1,
      startColumn: 7,
      endLine: 1,
      endColumn: 10,
    });
    expect(diagnostics[0].message).toContain(
      "Type 'string' is not assignable to type 'number'",
    );
    // Type errors are advisory: they do not block execution.
    expect(hasBlockingErrors(diagnostics)).toBe(false);
  });

  it("reports syntax errors as blocking, on the right line", async () => {
    const service = await getCompilerService();
    const diagnostics = service.check(
      "const x = 1;\nconst y = ;\n",
      "typescript",
    );
    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        code: 1109,
        source: "syntax",
        startLine: 2,
        startColumn: 11,
      }),
    );
    expect(diagnostics[0].message).toBe("Expression expected.");
    expect(hasBlockingErrors(diagnostics)).toBe(true);
  });

  it("reports multi-line positions correctly", async () => {
    const service = await getCompilerService();
    const code = "const a = 1;\n\n    const b: string = a;\n";
    const [diagnostic] = service.check(code, "typescript");
    expect(diagnostic).toMatchObject({
      startLine: 3,
      startColumn: 11,
      code: 2322,
    });
  });

  it("knows the worker runtime globals but not the DOM", async () => {
    const service = await getCompilerService();
    expect(
      service.check(
        "console.log(self.location.href, Object.groupBy([1], (x) => x));",
        "typescript",
      ),
    ).toEqual([]);
    const dom = service.check("document.title = 'x';", "typescript");
    expect(dom.map((d) => d.code)).toContain(2584); // Cannot find name 'document'... change 'lib'
  });

  it("treats every file as a module so names like `name` do not clash with globals", async () => {
    const service = await getCompilerService();
    expect(
      service.check("const name = 'x'; console.log(name);", "typescript"),
    ).toEqual([]);
  });

  it("supports top-level await", async () => {
    const service = await getCompilerService();
    expect(service.check("await Promise.resolve(1);", "typescript")).toEqual(
      [],
    );
  });

  it("updates diagnostics incrementally as code changes", async () => {
    const service = await getCompilerService();
    expect(service.check("let n: number = 1;", "typescript")).toEqual([]);
    expect(service.check("let n: number = 'a';", "typescript")).toHaveLength(1);
    expect(service.check("let n: number = 2;", "typescript")).toEqual([]);
  });

  it("transpiles valid TypeScript to runnable JavaScript with a source map", async () => {
    const service = await getCompilerService();
    const result = service.compile(
      "interface P { x: number }\nconst p: P = { x: 1 };\nexport const doubled: number = p.x * 2;\n",
      "typescript",
    );
    expect(result.diagnostics).toEqual([]);
    expect(result.js).not.toContain("interface");
    expect(result.js).not.toContain("sourceMappingURL");
    expect(result.js).toContain("p.x * 2");
    expect(result.sourceMap).toBeTruthy();
  });

  it("does not duplicate diagnostics reported by both transpile and syntax checking", async () => {
    const service = await getCompilerService();
    const { diagnostics } = service.compile("const = 5;", "typescript");
    const keys = diagnostics.map(
      (d) => `${d.code}:${d.startLine}:${d.startColumn}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("passes JavaScript through unchanged and flags TypeScript-only syntax", async () => {
    const service = await getCompilerService();
    const code = "const x = 1;\nconsole.log(x);\n";
    expect(service.compile(code, "javascript")).toEqual({
      js: code,
      sourceMap: null,
      diagnostics: [],
    });
    const diagnostics = service.check("const age: number = 1;", "javascript");
    expect(diagnostics[0]).toMatchObject({
      code: 8010,
      source: "syntax",
      startLine: 1,
      startColumn: 12,
    });
  });

  it("reports unresolvable imports", async () => {
    const service = await getCompilerService();
    const diagnostics = service.check(
      "import _ from 'lodash';\nconsole.log(_);",
      "typescript",
    );
    expect(diagnostics.map((d) => d.code)).toContain(2307);
  });

  it("maps runtime positions back to TypeScript source", async () => {
    const service = await getCompilerService();
    const source =
      "interface A { a: string }\n\ntype B = A;\n\nfunction fail(): never {\n  throw new Error('x');\n}\nfail();\n";
    const result = service.compile(source, "typescript");
    const mapper = createPositionMapper(result.sourceMap)!;
    const jsLines = result.js.split("\n");
    const throwLine =
      jsLines.findIndex((line) => line.includes("throw new Error")) + 1;
    const throwColumn = jsLines[throwLine - 1].indexOf("throw") + 1;
    expect(mapper({ line: throwLine, column: throwColumn })).toEqual({
      line: 6,
      column: 3,
    });
  });

  it("compiles every JS/TS example; only the type-error demo has errors", async () => {
    const service = await getCompilerService();
    for (const example of EXAMPLES) {
      const { language } = example;
      if (!isJavaScriptLike(language)) continue;
      const { diagnostics } = service.compile(example.code, language);
      if (example.id === "ts-type-errors") {
        expect(diagnostics.length, example.id).toBeGreaterThan(0);
        expect(hasBlockingErrors(diagnostics), example.id).toBe(false);
      } else {
        expect(diagnostics, example.id).toEqual([]);
      }
    }
  });
});

describe("shipped lib bundle", () => {
  it("contains every lib file the compiler needs (generated by scripts/prepare-assets.mjs)", async () => {
    const { readFile } = await import("node:fs/promises");
    const { loadLibFiles } = await import("@/lib/compiler/libs");
    const { LIB_BUNDLE_URL, LIB_FILES } =
      await import("@/lib/compiler/options");
    const { createCompilerService } = await import("@/lib/compiler/typescript");
    const bundle = JSON.parse(
      await readFile(`public${LIB_BUNDLE_URL}`, "utf8"),
    ) as Record<string, string>;
    const libs = await loadLibFiles(LIB_FILES, async (name) => bundle[name]);
    const service = createCompilerService(ts, libs);
    expect(
      service
        .check("const n: number = 'x'; self.postMessage(n);", "typescript")
        .map((d) => d.code),
    ).toEqual([2322]);
  });
});

describe("self-hosted Monaco", () => {
  it("MONACO_VERSION matches the installed monaco-editor package", async () => {
    const { readFile } = await import("node:fs/promises");
    const { MONACO_VERSION } = await import("@/lib/monaco/setup");
    const pkg = JSON.parse(
      await readFile("node_modules/monaco-editor/package.json", "utf8"),
    ) as { version: string };
    expect(MONACO_VERSION).toBe(pkg.version);
  });
});
