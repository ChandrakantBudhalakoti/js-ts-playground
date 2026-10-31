import type { Driver, DriverHost } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Java via TeaVM's in-browser compiler (runtimes/java/README.md).
 * Self-contained (see ./types.ts).
 *
 * Each run compiles the program with javac, adds a launcher that gives it
 * the Input tab (read by our java.util.Scanner) and catches what it throws,
 * compiles that to WebAssembly with TeaVM, and runs it.
 */
export function javaDriver(host: DriverHost): Driver {
  let runtime: any = null;
  let compiler: any = null;
  let extraClasses: [string, Int8Array][] = [];
  let diagnostics: {
    type: string;
    severity: string;
    fileName: string;
    lineNumber: number;
    columnNumber?: number;
    message: string;
  }[] = [];
  /** Marks the launcher's report of an uncaught exception on stderr. */
  const UNCAUGHT = "\u0000codetakhti:";

  function bytes(name: string): Int8Array {
    const data = host.file(name);
    return new Int8Array(data.buffer, data.byteOffset, data.byteLength);
  }

  /** Entries of a TeaVM class archive: gzip of (u16 name, u32 size, data)*. */
  async function readArchive(name: string): Promise<[string, Int8Array][]> {
    const stream = new Blob([host.file(name) as BlobPart])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));
    const data = new Uint8Array(await new Response(stream).arrayBuffer());
    const view = new DataView(data.buffer);
    const decoder = new TextDecoder();
    const entries: [string, Int8Array][] = [];
    for (let pos = 0; pos < data.length;) {
      const nameLength = view.getUint16(pos);
      pos += 2;
      const entryName = decoder.decode(data.subarray(pos, pos + nameLength));
      pos += nameLength;
      const size = view.getUint32(pos);
      pos += 4;
      entries.push([entryName, new Int8Array(data.slice(pos, pos + size))]);
      pos += size;
    }
    return entries;
  }

  /** The first error javac (or TeaVM) found in the user's file. */
  function reportCompileError(fileName: string, code: string) {
    const errors = diagnostics.filter((d) => d.severity === "error");
    const own = errors.find((d) => d.fileName === fileName) ?? errors[0];
    if (own?.type === "teavm") {
      // TeaVM's messages name internal methods; say what it means instead.
      const reads =
        /\bInputStreamReader\b|\bBufferedReader\b/.test(code) &&
        "BufferedReader and InputStreamReader are not available in the browser yet: read input with Scanner (Scanner sc = new Scanner(System.in);).";
      host.reportError({
        name: "Not available here",
        message:
          reads ||
          "This program uses a part of the Java library that is not available in the browser yet.",
        line: own.fileName === fileName ? own.lineNumber : undefined,
      });
      return 1;
    }
    host.reportError({
      name: "",
      message: own?.message ?? "The program could not be compiled.",
      line: own && own.fileName === fileName ? own.lineNumber : undefined,
      column: own && own.fileName === fileName ? own.columnNumber : undefined,
    });
    return 1;
  }

  /** A WebAssembly trap (which Java code cannot catch), as Java reports it. */
  function trapError(
    error: any,
    code: string,
  ): { name: string; message: string } {
    const text = String(error?.message ?? error);
    const stack = String(error?.stack ?? "");
    // Chrome names the failing class in the stack; Firefox does not, so a
    // null trap in a program that formats decimals counts too.
    const formatsDecimals =
      /\b(printf|format|formatted)\s*\(/.test(code) &&
      /%[-#+ 0,(]*\d*(\.\d+)?[eEfgG]/.test(code);
    if (
      /DecimalFormat|Formatter/.test(stack) ||
      (/null/.test(text) && formatsDecimals)
    )
      return {
        name: "Not available here",
        message:
          "printf and String.format with %f (decimal places) are not available in the browser yet. Print the number with println, or round it first: Math.round(x * 100) / 100.0.",
      };
    if (/out of bounds/.test(text))
      return {
        name: "java.lang.ArrayIndexOutOfBoundsException",
        message:
          "an index is outside the array (in the browser this can't be caught with catch)",
      };
    if (/null/.test(text))
      return { name: "java.lang.NullPointerException", message: "" };
    if (/divide by zero|remainder by zero/.test(text))
      return { name: "java.lang.ArithmeticException", message: "/ by zero" };
    if (error instanceof RangeError || /call stack/.test(text))
      return { name: "java.lang.StackOverflowError", message: "" };
    return { name: "Error", message: text };
  }

  return {
    async boot() {
      runtime = await host.importModule("compiler.wasm-runtime.js");
      const library = await runtime.load(host.file("compiler.wasm"));
      compiler = library.exports.createCompiler();
      compiler.setSdk(bytes("sdk.bin"));
      compiler.setTeaVMClasslib(bytes("runtime-classlib-teavm.bin"));
      compiler.onDiagnostic((d: any) =>
        diagnostics.push({
          type: String(d.type),
          severity: String(d.severity),
          fileName: String(d.fileName ?? ""),
          lineNumber: Number(d.lineNumber),
          columnNumber:
            d.columnNumber === undefined ? undefined : Number(d.columnNumber),
          message: String(d.message),
        }),
      );
      extraClasses = await readArchive("extra-classes.bin");
    },

    async run(code: string) {
      // A public class must be in a file of its name, as with javac.
      const publicClass =
        /\bpublic\s+(?:final\s+|abstract\s+)*class\s+([A-Za-z_$][\w$]*)/.exec(
          code,
        )?.[1];
      const fileName = `${publicClass ?? "Main"}.java`;
      compiler.clearSourceFiles();
      compiler.clearOutputFiles();
      compiler.addSourceFile(fileName, code);
      diagnostics = [];
      if (!compiler.compile()) return reportCompileError(fileName, code);

      const mains: string[] = Array.from(compiler.detectMainClasses() ?? []);
      if (mains.length === 0) {
        host.reportError({
          name: "",
          message:
            "There is no main method to run. Add public static void main(String[] args) { ... } to your class.",
        });
        return 1;
      }
      const main =
        publicClass && mains.includes(publicClass) ? publicClass : mains[0];
      const stdin = new TextDecoder().decode(host.stdinBytes());
      compiler.addSourceFile(
        "CodeTakhtiLauncher.java",
        `public class CodeTakhtiLauncher {
  public static void main(String[] args) {
    System.setProperty("codetakhti.stdin", ${JSON.stringify(stdin)});
    try {
      ${main}.main(args);
    } catch (Throwable error) {
      System.out.flush();
      System.err.println("\\u0000codetakhti:" + error);
    }
  }
}
`,
      );
      diagnostics = [];
      if (!compiler.compile()) return reportCompileError(fileName, code);
      for (const [name, data] of extraClasses)
        compiler.addOutputClassFile(name, data);
      if (
        !compiler.generateWebAssembly({
          outputName: "app",
          mainClass: "CodeTakhtiLauncher",
        })
      )
        return reportCompileError(fileName, code);

      let out = "";
      let err = "";
      // Set from closures, so not narrowed away by TypeScript.
      const result: { uncaught: { name: string; message: string } | null } = {
        uncaught: null,
      };
      const errLine = () => {
        if (err.startsWith(UNCAUGHT)) {
          // "java.lang.ArithmeticException: / by zero"
          const text = err.slice(UNCAUGHT.length);
          const colon = text.indexOf(": ");
          result.uncaught =
            colon < 0
              ? { name: text, message: "" }
              : { name: text.slice(0, colon), message: text.slice(colon + 2) };
        } else {
          host.stderr.write(`${err}\n`);
        }
        err = "";
      };
      const program = await runtime.load(
        compiler.getWebAssemblyOutputFile("app.wasm"),
        {
          installImports(imports: any) {
            imports.teavmConsole = {
              putcharStdout(c: number) {
                out += String.fromCharCode(c);
                if (c === 10) {
                  host.stdout.write(out);
                  out = "";
                }
              },
              putcharStderr(c: number) {
                if (c === 10) errLine();
                else err += String.fromCharCode(c);
              },
            };
          },
        },
      );
      try {
        host.started();
        program.exports.main([]);
      } catch (error) {
        result.uncaught = trapError(error, code);
      } finally {
        if (out) host.stdout.write(out);
        if (err) errLine();
      }
      if (!result.uncaught) return 0;
      host.reportError(result.uncaught);
      return 1;
    },
  };
}
